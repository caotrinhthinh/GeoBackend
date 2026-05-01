const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const { encryptText, decryptText } = require('../utils/encryption');

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: User,
      key: 'id',
    },
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  emergency_contact_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  blood_type_enc: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  chronic_conditions_enc: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  allergies_enc: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  blood_type: {
    type: DataTypes.VIRTUAL,
    get() {
      return decryptText(this.getDataValue('blood_type_enc'));
    },
    set(value) {
      this.setDataValue('blood_type_enc', encryptText(value));
    },
  },
  chronic_conditions: {
    type: DataTypes.VIRTUAL,
    get() {
      return decryptText(this.getDataValue('chronic_conditions_enc'));
    },
    set(value) {
      this.setDataValue('chronic_conditions_enc', encryptText(value));
    },
  },
  allergies: {
    type: DataTypes.VIRTUAL,
    get() {
      return decryptText(this.getDataValue('allergies_enc'));
    },
    set(value) {
      this.setDataValue('allergies_enc', encryptText(value));
    },
  },
}, {
  tableName: 'user_profiles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = UserProfile;
