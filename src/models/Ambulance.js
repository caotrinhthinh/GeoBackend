const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const MedicalFacility = require('./MedicalFacility');

const Ambulance = sequelize.define('Ambulance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  plate_number: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
  },
  facility_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: MedicalFacility,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('available', 'dispatched', 'maintenance'),
    defaultValue: 'available',
  },
  current_location: {
    type: DataTypes.GEOGRAPHY('POINT', 4326),
  },
}, {
  tableName: 'ambulance',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Ambulance;
