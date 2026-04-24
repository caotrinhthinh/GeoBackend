const { sequelize, MedicalFacility, EmergencyRequest } = require('../models');
const { selectGeoJSON, makePoint } = require('../utils/geoHelpers');
const AppError = require('../utils/AppError');
const { parseCoordinatePair } = require('../utils/coordinateUtils');

const getAllFacilities = async () => {
    return await MedicalFacility.findAll({
        where: { is_active: true },
        attributes: ['id', 'name', 'type', 'address', 'phone', selectGeoJSON('location_geom', 'location')],
    });
};

const getNearbyFacilities = async (lat, lng, radius_m) => {
    const { latNum, lngNum } = parseCoordinatePair(lat, lng, 'Cần cung cấp lat và lng.');
    const radius = parseInt(radius_m) || 5000; // Mặc định 5km

    const query = `
    SELECT 
      id, name, type, address, phone,
      ST_AsGeoJSON(location_geom::geometry) as location,
      ST_Distance(location_geom, ST_GeogFromText('POINT(:lng :lat)')) AS distance_meters
    FROM medical_facility
    WHERE is_active = true
      AND ST_DWithin(location_geom, ST_GeogFromText('POINT(:lng :lat)'), :radius)
    ORDER BY distance_meters ASC;
  `;

    const results = await sequelize.query(query, {
        replacements: { lng: lngNum, lat: latNum, radius },
        type: sequelize.QueryTypes.SELECT,
    });

    return results;
};

const createFacility = async (data) => {
    const { name, type, address, phone, lat, lng } = data;
    const { latNum, lngNum } = parseCoordinatePair(lat, lng, 'Cần cung cấp lat và lng');

    const facility = await MedicalFacility.create({
        name,
        type,
        address,
        phone,
        location_geom: makePoint(latNum, lngNum),
    });

    return facility;
};

const updateFacility = async (id, data) => {
    const facility = await MedicalFacility.findByPk(id);
    if (!facility) throw new AppError('Cơ sở y tế không tồn tại', 404);

    const { name, type, address, phone, lat, lng, is_active } = data;

    const updateData = { name, type, address, phone, is_active };
    if (lat != null || lng != null) {
        const { latNum, lngNum } = parseCoordinatePair(lat, lng, 'Cần cung cấp lat và lng');
        updateData.location_geom = makePoint(latNum, lngNum);
    }

    await facility.update(updateData);
    return facility;
};

const deleteFacility = async (id) => {
    const facility = await MedicalFacility.findByPk(id);
    if (!facility) throw new AppError('Cơ sở y tế không tồn tại', 404);

    // TC02: Chặn xóa nếu cơ sở đang xử lý ca SOS
    const activeRequest = await EmergencyRequest.findOne({
        where: {
            assigned_facility_id: id,
            status: ['pending', 'assigned', 'in_progress'],
        },
    });
    if (activeRequest) {
        throw new AppError('Không thể xóa cơ sở đang xử lý ca cấp cứu', 400);
    }

    // Soft delete
    await facility.update({ is_active: false });
    return true;
};

module.exports = {
    getAllFacilities,
    getNearbyFacilities,
    createFacility,
    updateFacility,
    deleteFacility,
};
