const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

// Rate limit chung cho API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Mỗi IP tối đa 100 requests / 15m
  handler: (req, res, next) => {
    next(new AppError('Quá nhiều request từ IP của bạn, vui lòng thử lại sau 15 phút.', 429));
  }
});

// Cho đặc thù endpoint cấp cứu SOS (ngăn chặn spam)
const sosLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 5, // Tối đa 5 request tạo SOS / phút / IP
  handler: (req, res, next) => {
    next(new AppError('Bạn gửi yêu cầu cấp cứu quá nhanh, vui lòng từ từ.', 429));
  }
});

module.exports = { apiLimiter, sosLimiter };
