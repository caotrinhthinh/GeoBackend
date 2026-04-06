const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { User } = require('../models');

const verifyJWT = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Bạn chưa đăng nhập. Vui lòng cung cấp token.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and isActive
    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser || !currentUser.is_active) {
      return next(new AppError('Token không hợp lệ hoặc tài khoản đã bị khóa.', 401));
    }

    req.user = currentUser;
    next();
  } catch (err) {
    return next(new AppError('Token không hợp lệ hoặc đã hết hạn.', 401));
  }
});

module.exports = verifyJWT;
