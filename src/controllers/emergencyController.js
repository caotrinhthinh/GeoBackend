const emergencyService = require('../services/emergencyService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { MedicalFacility } = require('../models');
const { selectGeoJSON } = require('../utils/geoHelpers');
const { toPointObject } = require('../services/routeService');
const { emitSosAlert } = require('../config/socket');
const { ROLE } = require('../constants/roles');

const createSOS = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    guest_uuid: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).optional(),
    // Frontend gửi victim_phone; backend dùng notes.
    victim_phone: Joi.string().allow('', null).optional(),
    notes: Joi.string().allow('', null).optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const requester_id = req.user ? req.user.id : null;
  const notesToUse = value.notes ?? value.victim_phone;
  const sos = await emergencyService.createSOS(requester_id, value.lat, value.lng, notesToUse, value.guest_uuid);

  // TC09: notify dispatcher immediately to zoom/beep.
  emitSosAlert({
    request_id: sos.id,
    lat: value.lat,
    lng: value.lng,
    facility_id: sos.assigned_facility_id ?? null,
  });

  // Build assigned_hospital payload to match frontend contract.
  let assigned_hospital = null;
  if (sos?.assigned_facility_id) {
    const facility = await MedicalFacility.findByPk(sos.assigned_facility_id, {
      attributes: ['id', 'name', 'phone', selectGeoJSON('location_geom', 'location')],
    });

    const locationValue = facility ? facility.get('location') : null;
    const point = facility ? toPointObject(locationValue) : null;

    assigned_hospital = facility
      ? {
          id: facility.id,
          name: facility.name,
          hotline: facility.phone ?? undefined,
          lat: point?.lat ?? undefined,
          lng: point?.lng ?? undefined,
        }
      : null;
  }
  
  // Tạo tracking token cho guest (hết hạn sau 1 giờ)
  const tracking_token = jwt.sign(
    { request_id: sos.id, role: 'guest_tracker' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Frontend expects top-level keys.
  const eta_minutes =
    typeof sos?.eta_seconds === 'number' && Number.isFinite(sos.eta_seconds)
      ? Math.max(1, sos.eta_seconds / 60)
      : undefined;

  res.status(201).json({
    request_id: sos.id,
    session_token: sos.session_token ?? undefined,
    assigned_hospital,
    route_path: sos.route_geometry,
    eta_minutes,
    tracking_token,
  });
});

const getAnonymousSession = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    session_token: Joi.string().uuid({ version: 'uuidv4' }).required(),
  });

  const { error, value } = schema.validate(req.query);
  if (error) return next(new AppError(error.details[0].message, 400));

  const preview = await emergencyService.getAnonymousSessionPreview(value.session_token);
  res.status(200).json({ status: 'success', data: preview });
});

const linkAnonymousSession = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    session_token: Joi.string().uuid({ version: 'uuidv4' }).required(),
    request_id: Joi.number().integer().positive().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  if (!req.user || req.user.role_id !== ROLE.USER) {
    return next(new AppError('Chỉ tài khoản người dùng mới có thể liên kết SOS', 403));
  }

  const result = await emergencyService.linkAnonymousSession(
    req.user.id,
    value.session_token,
    value.request_id,
  );

  res.status(200).json({ status: 'success', data: result });
});

const getActiveSOS = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    guest_uuid: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).optional(),
  });

  const { error, value } = schema.validate(req.query);
  if (error) return next(new AppError(error.details[0].message, 400));

  const requester_id = req.user ? req.user.id : null;
  const activeSos = await emergencyService.getActiveRequestByIdentity(requester_id, value.guest_uuid);
  if (!activeSos) {
    return res.status(200).json({ data: null });
  }

  const facility = activeSos.facility;
  const facilityLocation = facility ? facility.get('location') : null;
  const facilityPoint = facilityLocation ? toPointObject(facilityLocation) : null;
  const ambulancePoint = activeSos.ambulance?.current_location
    ? toPointObject(activeSos.ambulance.current_location)
    : null;
  const patientPoint = activeSos.patient_location ? toPointObject(activeSos.patient_location) : null;

  const tracking_token = jwt.sign(
    { request_id: activeSos.id, role: 'guest_tracker' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return res.status(200).json({
    data: {
      request_id: activeSos.id,
      status: activeSos.status,
      tracking_token,
      route_path: activeSos.route_geometry ?? null,
      eta_minutes:
        typeof activeSos.eta_seconds === 'number' && Number.isFinite(activeSos.eta_seconds)
          ? Math.max(1, activeSos.eta_seconds / 60)
          : null,
      assigned_hospital: facility
        ? {
            id: facility.id,
            name: facility.name,
            hotline: facility.phone ?? undefined,
            lat: facilityPoint?.lat ?? undefined,
            lng: facilityPoint?.lng ?? undefined,
          }
        : null,
      ambulance_position:
        ambulancePoint && Number.isFinite(ambulancePoint.lat) && Number.isFinite(ambulancePoint.lng)
          ? { lat: ambulancePoint.lat, lng: ambulancePoint.lng }
          : null,
      patient_position:
        patientPoint && Number.isFinite(patientPoint.lat) && Number.isFinite(patientPoint.lng)
          ? { lat: patientPoint.lat, lng: patientPoint.lng }
          : null,
    },
  });
});

const getRequests = catchAsync(async (req, res, next) => {
  const result = await emergencyService.getRequests(req.user.facility_id, req.user.role_id);
  const data = result.map(e => {
    let loc = e.get('location');
    if (typeof loc === 'string') loc = JSON.parse(loc);
    return { ...e.dataValues, location: loc };
  });

  res.status(200).json({ status: 'success', results: data.length, data });
});

// Admin dispatcher dashboard (TC09-TC11)
const getEmergenciesAdmin = catchAsync(async (req, res, next) => {
  const results = await emergencyService.getRequests(req.user.facility_id, req.user.role_id);

  const toAdminStatus = (status) => {
    switch (String(status)) {
      case 'pending':
        return 'WAITING';
      case 'assigned':
        return 'ASSIGNED';
      case 'in_progress':
        return 'ARRIVED';
      case 'completed':
        return 'COMPLETED';
      default:
        return 'WAITING';
    }
  };

  const toPriority = (distanceMeters) => {
    const d = typeof distanceMeters === 'number' ? distanceMeters : Number(distanceMeters);
    if (!Number.isFinite(d)) return 'MEDIUM';
    if (d <= 1000) return 'CRITICAL';
    if (d <= 2000) return 'HIGH';
    return 'MEDIUM';
  };

  const data = await Promise.all(
    results.map(async (e) => {
      let loc = e.get('location');
      if (typeof loc === 'string') loc = JSON.parse(loc);

      const point = toPointObject(loc);
      const distanceMeters = e.distance_meters;
      const tracking_token = jwt.sign(
        { request_id: e.id, role: 'guest_tracker' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
      );

      return {
        id: String(e.id),
        createdAt: e.created_at ?? e.dataValues?.created_at ?? null,
        priority: toPriority(distanceMeters),
        address: 'Vị trí nạn nhân',
        latitude: point?.lat ?? null,
        longitude: point?.lng ?? null,
          distanceKm:
            typeof distanceMeters === 'number' && Number.isFinite(distanceMeters) ? distanceMeters / 1000 : 0,
        status: toAdminStatus(e.status),
        // Expose token so admin can join socket room `request:<id>`
        tracking_token,
        // Helpful for UI dispatch logic
        assigned_ambulance_id: e.assigned_ambulance_id ?? null,
        assigned_ambulance_plate: e.ambulance?.plate_number ?? null,
        done_at: e.done_at ?? null,
        requester_name: e.requester_name ?? null,
        requester_age: e.requester_age ?? null,
        requester_emergency_contact_phone: e.requester_emergency_contact_phone ?? null,
        medical_profile:
          req.user?.role_id === ROLE.ADMIN || req.user?.role_id === ROLE.SUPER_ADMIN
            ? {
                blood_type: e.requester_blood_type ?? null,
                allergies: e.requester_allergies ?? null,
                chronic_conditions: e.requester_chronic_conditions ?? null,
              }
            : null,
      };
    }),
  );

  res.status(200).json(data);
});

const assignAmbulance = catchAsync(async (req, res, next) => {
  const { ambulance_id } = req.body;
  if (!ambulance_id) {
    return next(new AppError('Cần cung cấp ambulance_id để điều động', 400));
  }
  
  const emergency = await emergencyService.assignAmbulance(
    req.params.id, 
    ambulance_id, 
    req.user.facility_id, 
    req.user.role_id
  );

  res.status(200).json({ status: 'success', data: emergency });
});

const dispatchAmbulance = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    emergency_request_id: Joi.number().required(),
    ambulance_id: Joi.number().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const emergency = await emergencyService.assignAmbulance(
    value.emergency_request_id,
    value.ambulance_id,
    req.user.facility_id,
    req.user.role_id,
  );

  res.status(200).json({ status: 'success', data: emergency });
});

const updateStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  const emergency = await emergencyService.updateStatus(
    req.params.id, 
    status, 
    req.user.facility_id, 
    req.user.role_id
  );

  res.status(200).json({ status: 'success', data: emergency });
});

module.exports = {
  createSOS,
  getActiveSOS,
  getAnonymousSession,
  linkAnonymousSession,
  getRequests,
  getEmergenciesAdmin,
  assignAmbulance,
  dispatchAmbulance,
  updateStatus
};
