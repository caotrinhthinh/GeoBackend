const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Ambulance = require('./Ambulance');
const EmergencyRequest = require('./EmergencyRequest');

const AmbulanceTracking = sequelize.define('AmbulanceTracking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ambulance_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Ambulance,
      key: 'id'
    }
  },
  emergency_request_id: {
    type: DataTypes.INTEGER,
    references: {
      model: EmergencyRequest,
      key: 'id'
    }
  },
  location: {
    type: DataTypes.GEOGRAPHY('POINT', 4326),
    allowNull: false,
  },
  recorded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  tableName: 'ambulance_tracking',
  timestamps: false,
});

module.exports = AmbulanceTracking;
