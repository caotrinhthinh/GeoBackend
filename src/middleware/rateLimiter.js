const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

// Rate limit chung cho API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 300, // Nới ngưỡng để tránh nghẽn các luồng realtime/e2e nhiều request
  // Allow e2e/tests to avoid collisions by using a client id header.
  keyGenerator: (req) => {
    const clientId = req.headers["x-client-id"];
    if (typeof clientId === "string" && clientId.trim()) {
      return clientId.trim();
    }
    return req.ip;
  },
  handler: (req, res, next) => {
    next(new AppError('Quá nhiều request từ IP của bạn, vui lòng thử lại sau 15 phút.', 429));
  }
});

// Cho đặc thù endpoint cấp cứu SOS (ngăn chặn spam)
const sosLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 15, // Tối đa 15 request tạo SOS / phút / IP
  // Allow e2e/tests to avoid collisions by using a stable per-run client id.
  // When header is not provided, fall back to req.ip.
  keyGenerator: (req) => {
    const clientId = req.headers["x-client-id"];
    if (typeof clientId === "string" && clientId.trim()) {
      return clientId.trim();
    }
    return req.ip;
  },
  handler: (req, res, next) => {
    next(new AppError('Bạn gửi yêu cầu cấp cứu quá nhanh, vui lòng từ từ.', 429));
  }
});

module.exports = { apiLimiter, sosLimiter };
