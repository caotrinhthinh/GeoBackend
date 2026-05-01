const { UserProfile } = require('../models');
const { ROLE } = require('../constants/roles');
const AppError = require('../utils/AppError');

function toProfileResponse(profile) {
  if (!profile) return null;
  return {
    full_name: profile.full_name || '',
    age: profile.age ?? null,
    emergency_contact_phone: profile.emergency_contact_phone || '',
    blood_type: profile.blood_type || '',
    chronic_conditions: profile.chronic_conditions || '',
    allergies: profile.allergies || '',
  };
}

async function getMyProfile(user) {
  if (user.role_id !== ROLE.USER) {
    throw new AppError('Chỉ tài khoản USER mới có hồ sơ y tế cá nhân', 403);
  }

  const profile = await UserProfile.findOne({ where: { user_id: user.id } });
  return toProfileResponse(profile);
}

async function upsertMyProfile(user, payload) {
  if (user.role_id !== ROLE.USER) {
    throw new AppError('Chỉ tài khoản USER mới có hồ sơ y tế cá nhân', 403);
  }

  const [profile] = await UserProfile.findOrCreate({
    where: { user_id: user.id },
    defaults: { user_id: user.id },
  });

  Object.assign(profile, {
    full_name: payload.full_name ?? profile.full_name,
    age: payload.age ?? profile.age,
    emergency_contact_phone: payload.emergency_contact_phone ?? profile.emergency_contact_phone,
    blood_type: payload.blood_type ?? profile.blood_type,
    chronic_conditions: payload.chronic_conditions ?? profile.chronic_conditions,
    allergies: payload.allergies ?? profile.allergies,
  });

  await profile.save();
  return toProfileResponse(profile);
}

module.exports = {
  getMyProfile,
  upsertMyProfile,
};
