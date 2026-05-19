const facilityService = require('../services/facilityService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Joi = require('joi');

function normalizeVietnamese(input) {
  return String(input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function inferFacilityTypeFromName(name) {
  const normalized = normalizeVietnamese(name);

  // Heuristic: use Vietnamese keywords to infer type even if DB has mismatched fields.
  if (normalized.includes("benh vien") || normalized.includes("bv ")) {
    return 1; // Hospital
  }

  if (normalized.includes("phong kham")) {
    return 2; // Clinic
  }

  if (normalized.includes("nha thuoc")) {
    return 3; // Pharmacy
  }

  return undefined;
}

function mapFacilityTypeFromDbType(dbType) {
  if (dbType === "hospital") return 1;
  if (dbType === "clinic") return 2;
  if (dbType === "pharmacy") return 3;
  return undefined;
}

function ensureFacilityType(row) {
  const inferred = inferFacilityTypeFromName(row?.name);
  if (inferred) return inferred;

  return mapFacilityTypeFromDbType(row?.type);
}

function tryParseLocation(rawLocation) {
  if (rawLocation == null) {
    return null;
  }

  if (typeof rawLocation !== "string") {
    return rawLocation;
  }

  try {
    return JSON.parse(rawLocation);
  } catch {
    return null;
  }
}

function mapFacilityRows(result) {
  return result.map((f) => {
    const loc = tryParseLocation(f.get("location"));
    const row = { ...f.dataValues, location: loc };
    row.facility_type = ensureFacilityType(row) ?? row.facility_type;
    return row;
  });
}

const getAllFacilities = catchAsync(async (req, res, next) => {
  const result = await facilityService.getAllFacilities();
  const data = mapFacilityRows(result);
  res.status(200).json({ status: "success", results: data.length, data });
});

const getAllFacilitiesForAdmin = catchAsync(async (req, res, next) => {
  const result = await facilityService.getAllFacilitiesForAdmin();
  const data = mapFacilityRows(result);
  res.status(200).json({ status: "success", results: data.length, data });
});

const getNearbyFacilities = catchAsync(async (req, res, next) => {
  const { lat, lng, radius } = req.query;
  const results = await facilityService.getNearbyFacilities(lat, lng, radius);
  
  // parse geojson strings
  const data = results.map(f => {
    const row = {
      ...f,
      location: tryParseLocation(f.location)
    };
    row.facility_type = ensureFacilityType(row) ?? row.facility_type;
    return row;
  });

  res.status(200).json({ status: 'success', results: data.length, data });
});

const createFacility = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('hospital', 'pharmacy', 'clinic').required(),
    address: Joi.string().optional(),
    phone: Joi.string().optional(),
    lat: Joi.number().required(),
    lng: Joi.number().required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const newFacility = await facilityService.createFacility(value);
  res.status(201).json({ status: 'success', data: newFacility });
});

const updateFacility = catchAsync(async (req, res, next) => {
  const updatedFacility = await facilityService.updateFacility(req.params.id, req.body);
  res.status(200).json({ status: 'success', data: updatedFacility });
});

const deleteFacility = catchAsync(async (req, res, next) => {
  await facilityService.deleteFacility(req.params.id);
  res.status(204).send();
});

module.exports = {
  getAllFacilities,
  getAllFacilitiesForAdmin,
  getNearbyFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
};
