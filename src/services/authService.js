const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { User, MedicalFacility, EmergencyRequest, sequelize } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
const { ROLE } = require('../constants/roles');

function issueAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
}

function issueRefreshToken(payload) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyRefreshToken(token) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  return jwt.verify(token, secret);
}

function normalizeGuestUuid(guestUuid) {
  if (typeof guestUuid !== 'string') {
    return null;
  }

  const normalized = guestUuid.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return normalized;
}

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
    facility_id: user.facility_id,
    email: user.email,
  };

  const token = issueAccessToken(payload);
  const refresh_token = issueRefreshToken(payload);

  return {
    user: {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      role:
        user.role_id === 1 ? 'SUPER_ADMIN'
        : user.role_id === 2 ? 'ADMIN'
        : user.role_id === 3 ? 'USER'
        : 'GUEST',
      facility: user.MedicalFacility || null,
      last_login_at: user.last_login_at
    },
    token,
    refresh_token,
  };
};

async function buildAuthResult(user) {
  const payload = {
    id: user.id,
    role_id: user.role_id,
    facility_id: user.facility_id,
    email: user.email,
  };

  const token = issueAccessToken(payload);
  const refresh_token = issueRefreshToken(payload);

  return {
    user: {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      role:
        user.role_id === 1 ? 'SUPER_ADMIN'
          : user.role_id === 2 ? 'ADMIN'
            : user.role_id === 3 ? 'USER'
              : 'GUEST',
      facility: user.MedicalFacility || null,
      last_login_at: user.last_login_at,
    },
    token,
    refresh_token,
  };
}

const register = async (email, password) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new AppError('Email đã được sử dụng', 400);
  }

  const password_hash = await bcrypt.hash(password, 12);
  const newUser = await User.create({
    email: normalizedEmail,
    password_hash,
    role_id: ROLE.USER,
    is_active: true,
  });

  newUser.last_login_at = new Date();
  await newUser.save();

  return buildAuthResult(newUser);
};

const googleLogin = async (idToken) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new AppError('Hệ thống chưa cấu hình đăng nhập Google', 503);
  }

  const googleClient = new OAuth2Client(clientId);
  let tokenPayload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientId,
    });
    tokenPayload = ticket.getPayload();
  } catch (_) {
    throw new AppError('Google token không hợp lệ', 401);
  }

  const email = tokenPayload?.email ? String(tokenPayload.email).trim().toLowerCase() : null;
  const emailVerified = Boolean(tokenPayload?.email_verified);
  if (!email || !emailVerified) {
    throw new AppError('Tài khoản Google chưa xác thực email', 401);
  }

  let user = await User.findOne({
    where: { email },
    include: [{
      model: MedicalFacility,
      attributes: ['id', 'name', 'type'],
    }],
  });

  if (!user) {
    user = await User.create({
      email,
      password_hash: 'GOOGLE_OAUTH_NO_PASSWORD',
      role_id: ROLE.USER,
      is_active: true,
    });
  }

  if (!user.is_active) {
    throw new AppError('Tài khoản đã bị vô hiệu hóa', 403);
  }

  user.last_login_at = new Date();
  await user.save();

  return buildAuthResult(user);
};

const linkGuestAccount = async (userId, guestUuid) => {
  const normalizedGuestUuid = normalizeGuestUuid(guestUuid);
  if (!normalizedGuestUuid) {
    throw new AppError('guest_uuid không hợp lệ', 400);
  }

  const legacyGuestEmail = `guest+${normalizedGuestUuid}@guest.local`;
  const targetUser = await User.findByPk(userId);
  if (!targetUser || !targetUser.is_active) {
    throw new AppError('Tài khoản không hợp lệ', 401);
  }

  const guestUser = await User.findOne({
    where: {
      [Op.or]: [{ email: normalizedGuestUuid }, { email: legacyGuestEmail }],
    },
  });
  if (!guestUser) {
    return { linked_requests: 0 };
  }

  if (guestUser.role_id !== ROLE.GUEST) {
    throw new AppError('Định danh khách không hợp lệ', 400);
  }

  if (guestUser.id === targetUser.id) {
    return { linked_requests: 0 };
  }

  const linkedRequests = await sequelize.transaction(async (transaction) => {
    const [updatedCount] = await EmergencyRequest.update(
      { requester_id: targetUser.id },
      { where: { requester_id: guestUser.id }, transaction },
    );
    return updatedCount;
  });

  return { linked_requests: linkedRequests };
};

const refreshAccessToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (_) {
    throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn.', 401);
  }

  const currentUser = await User.findByPk(decoded.id, {
    include: [{
      model: MedicalFacility,
      attributes: ['id', 'name', 'type'],
    }],
  });
  if (!currentUser || !currentUser.is_active) {
    throw new AppError('Tài khoản không tồn tại hoặc đã bị khóa.', 401);
  }

  const payload = {
    id: currentUser.id,
    role_id: currentUser.role_id,
    facility_id: currentUser.facility_id,
    email: currentUser.email,
  };

  return {
    token: issueAccessToken(payload),
    refresh_token: issueRefreshToken(payload),
    user: {
      id: currentUser.id,
      email: currentUser.email,
      role_id: currentUser.role_id,
      role:
        currentUser.role_id === 1 ? 'SUPER_ADMIN'
        : currentUser.role_id === 2 ? 'ADMIN'
        : currentUser.role_id === 3 ? 'USER'
        : 'GUEST',
      facility: currentUser.MedicalFacility || null,
      last_login_at: currentUser.last_login_at,
    },
  };
};

module.exports = {
  login,
  register,
  googleLogin,
  linkGuestAccount,
  refreshAccessToken,
};
