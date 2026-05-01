const AppError = require('../utils/AppError');

const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Chưa xác thực người dùng.', 401));
    }
    
    if (!roles.includes(req.user.role_id)) {
      // Keep message stable for test assertions (TC08)
      return next(new AppError('Bạn không có quyền truy cập chức năng này', 403));
    }
    
    next();
  };
};

module.exports = checkRole;
