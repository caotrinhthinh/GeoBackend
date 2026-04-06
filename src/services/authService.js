const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, MedicalFacility } = require('../models');
const AppError = require('../utils/AppError');

const login = async (email, password) => {
  const user = await User.findOne({
    where: { email },
    include: [{
      model: MedicalFacility,
      attributes: ['id', 'name', 'type']
    }]
  });

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError('Email hoặc mật khẩu không chính xác', 401);
  }

  if (!user.is_active) {
    throw new AppError('Tài khoản đã bị vô hiệu hóa', 403);
  }

  // Update last login
  user.last_login_at = new Date();
  await user.save();

  // Create token
  const payload = {
    id: user.id,
    role_id: user.role_id,
    facility_id: user.facility_id
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      facility: user.MedicalFacility || null,
      last_login_at: user.last_login_at
    },
    token
  };
};

module.exports = {
  login
};
