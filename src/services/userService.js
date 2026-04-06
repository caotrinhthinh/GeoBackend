const { User, MedicalFacility } = require('../models');
const AppError = require('../utils/AppError');
const bcrypt = require('bcryptjs');

const createUser = async (data) => {
  const { email, password, role_id, facility_id } = data;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError('Email đã được sử dụng', 400);
  }

  // Validate facility for Role 2 (Admin Truc Ban)
  if (role_id === 2 && !facility_id) {
    throw new AppError('Tài khoản Admin Trực Ban bắt buộc phải gán với một cơ sở y tế', 400);
  }

  if (facility_id) {
    const facility = await MedicalFacility.findByPk(facility_id);
    if (!facility) throw new AppError('Không tìm thấy cơ sở y tế này', 404);
  }

  const password_hash = await bcrypt.hash(password, 12);

  const newUser = await User.create({
    email,
    password_hash,
    role_id,
    facility_id,
    is_active: true
  });

  return { id: newUser.id, email: newUser.email, role_id: newUser.role_id, facility_id: newUser.facility_id };
};

const getUsers = async () => {
  return await User.findAll({
    attributes: { exclude: ['password_hash'] },
    include: [{ model: MedicalFacility, attributes: ['id', 'name', 'type'] }]
  });
};

module.exports = {
  createUser,
  getUsers
};
