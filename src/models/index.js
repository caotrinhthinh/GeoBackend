const sequelize = require('../config/database');

const MedicalFacility = require('./MedicalFacility');
const User = require('./User');
const Ambulance = require('./Ambulance');
const EmergencyRequest = require('./EmergencyRequest');
const AmbulanceTracking = require('./AmbulanceTracking');

// MedicalFacility relations
MedicalFacility.hasMany(User, { foreignKey: 'facility_id' });
User.belongsTo(MedicalFacility, { foreignKey: 'facility_id' });

MedicalFacility.hasMany(Ambulance, { foreignKey: 'facility_id' });
Ambulance.belongsTo(MedicalFacility, { foreignKey: 'facility_id' });

MedicalFacility.hasMany(EmergencyRequest, { foreignKey: 'assigned_facility_id' });
EmergencyRequest.belongsTo(MedicalFacility, { foreignKey: 'assigned_facility_id', as: 'facility' });

// Ambulance relations
Ambulance.hasMany(EmergencyRequest, { foreignKey: 'assigned_ambulance_id' });
EmergencyRequest.belongsTo(Ambulance, { foreignKey: 'assigned_ambulance_id', as: 'ambulance' });

Ambulance.hasMany(AmbulanceTracking, { foreignKey: 'ambulance_id' });
AmbulanceTracking.belongsTo(Ambulance, { foreignKey: 'ambulance_id' });

// EmergencyRequest relations
User.hasMany(EmergencyRequest, { foreignKey: 'requester_id' });
EmergencyRequest.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });

EmergencyRequest.hasMany(AmbulanceTracking, { foreignKey: 'emergency_request_id' });
AmbulanceTracking.belongsTo(EmergencyRequest, { foreignKey: 'emergency_request_id' });

module.exports = {
  sequelize,
  MedicalFacility,
  User,
  Ambulance,
  EmergencyRequest,
  AmbulanceTracking,
};
