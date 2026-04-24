const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const MedicalFacility = require('./MedicalFacility');
const Ambulance = require('./Ambulance');

const EmergencyRequest = sequelize.define('EmergencyRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  requester_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  patient_location: {
    type: DataTypes.GEOGRAPHY('POINT', 4326),
    allowNull: false,
  },
  assigned_facility_id: {
    type: DataTypes.INTEGER,
    references: {
      model: MedicalFacility,
      key: 'id'
    }
  },
  assigned_ambulance_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Ambulance,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  distance_meters: {
    type: DataTypes.FLOAT,
  },
  route_geometry: {
    type: DataTypes.JSONB,    // GeoJSON LineString từ OSRM
    allowNull: true,
  },
  eta_seconds: {
    type: DataTypes.INTEGER,  // ETA tính bằng giây (null nếu OSRM fallback)
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'emergency_request',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = EmergencyRequest;
