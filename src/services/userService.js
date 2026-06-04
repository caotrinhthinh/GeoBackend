const crypto = require('crypto');
const { Op } = require('sequelize');
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

  if (role_id === 2 && facility_id) {
    const conflict = await User.findOne({
      where: {
        role_id: 2,
        facility_id: Number(facility_id),
        is_active: true,
      },
    });
    if (conflict) {
      throw new AppError('Bệnh viện này đã có admin hoạt động', 400);
    }
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

/**
 * Super Admin: cập nhật Admin BV (email, bệnh viện, đổi mật khẩu tuỳ chọn).
 */
const updateHospitalAdminById = async (targetId, data) => {
  const user = await User.findByPk(targetId);
  if (!user) {
    throw new AppError('Không tìm thấy người dùng', 404);
  }
  if (user.role_id !== 2) {
    throw new AppError('Chỉ chỉnh sửa được tài khoản Admin bệnh viện', 400);
  }

  const updates = {};

  if (data.email !== undefined && String(data.email).trim() !== user.email) {
    const nextEmail = String(data.email).trim().toLowerCase();
    const existing = await User.findOne({ where: { email: nextEmail } });
    if (existing && Number(existing.id) !== Number(user.id)) {
      throw new AppError('Email đã được sử dụng', 400);
    }
    updates.email = nextEmail;
  }

  if (data.facility_id !== undefined && Number(data.facility_id) !== Number(user.facility_id)) {
    const fid = Number(data.facility_id);
    const facility = await MedicalFacility.findByPk(fid);
    if (!facility) {
      throw new AppError('Không tìm thấy cơ sở y tế này', 404);
    }
    if (facility.type !== 'hospital') {
      throw new AppError('Admin bệnh viện chỉ được gán vào bệnh viện', 400);
    }
    const conflict = await User.findOne({
      where: {
        role_id: 2,
        facility_id: fid,
        is_active: true,
        id: { [Op.ne]: user.id },
      },
    });
    if (conflict) {
      throw new AppError('Bệnh viện này đã có admin hoạt động', 400);
    }
    updates.facility_id = fid;
  }

  if (data.password && String(data.password).length >= 8) {
    updates.password_hash = await bcrypt.hash(String(data.password), 12);
  }

  if (Object.keys(updates).length === 0) {
    await user.reload({ include: [{ model: MedicalFacility, attributes: ['id', 'name', 'type'] }] });
    return user;
  }

  await user.update(updates);
  await user.reload({ include: [{ model: MedicalFacility, attributes: ['id', 'name', 'type'] }] });
  return user;
};

function generateSuperAdminTempPassword() {
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const digit = '23456789';
  const buf = crypto.randomBytes(16);
  let out = '';
  for (let i = 0; i < 9; i += 1) {
    out += lower[buf[i] % lower.length];
  }
  out += upper[buf[9] % upper.length];
  out += digit[buf[10] % digit.length];
  out += upper[buf[11] % upper.length];
  return out;
}

/**
 * Super Admin: đặt lại mật khẩu Admin BV, trả plaintext một lần (không lưu plaintext trong DB).
 */
const resetHospitalAdminPasswordById = async (targetId, plainOptional) => {
  const user = await User.findByPk(targetId);
  if (!user) {
    throw new AppError('Không tìm thấy người dùng', 404);
  }
  if (user.role_id !== 2) {
    throw new AppError('Chỉ áp dụng cho Admin bệnh viện', 400);
  }

  const plain =
    plainOptional && String(plainOptional).length >= 8 ? String(plainOptional) : generateSuperAdminTempPassword();

  await user.update({ password_hash: await bcrypt.hash(plain, 12) });

  return {
    id: user.id,
    email: user.email,
    temporary_password: plain,
  };
};

const deactivateUserById = async (targetId, currentUserId) => {
  const user = await User.findByPk(targetId);
  if (!user) {
    throw new AppError('Không tìm thấy người dùng', 404);
  }
  if (Number(user.id) === Number(currentUserId)) {
    throw new AppError('Không thể vô hiệu chính tài khoản đang đăng nhập', 400);
  }
  if (user.role_id === 1) {
    throw new AppError('Không thể vô hiệu SuperAdmin', 400);
  }
  if (!user.is_active) {
    return { id: user.id, email: user.email, is_active: false };
  }
  await user.update({ is_active: false });
  return { id: user.id, email: user.email, is_active: false };
};

module.exports = {
  createUser,
  getUsers,
  updateHospitalAdminById,
  resetHospitalAdminPasswordById,
  deactivateUserById,
};
