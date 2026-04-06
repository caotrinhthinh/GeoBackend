const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicalFacility = sequelize.define('MedicalFacility', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('hospital', 'pharmacy'),
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING(500),
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  location_geom: {
    type: DataTypes.GEOGRAPHY('POINT', 4326),
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'medical_facility',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = MedicalFacility;
