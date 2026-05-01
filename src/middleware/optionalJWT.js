const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async function optionalJWT(req, res, next) {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (user && user.is_active) {
      req.user = user;
    }
  } catch (_) {
    // Ignore invalid token so guest SOS still works one-touch.
  }

  return next();
};
