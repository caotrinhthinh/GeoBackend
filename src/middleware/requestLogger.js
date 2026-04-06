const requestLogger = (req, res, next) => {
  const method = req.method;
  const url = req.url;
  const time = new Date().toISOString();
  
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${time}] ${method} ${url}`);
  }
  
  next();
};

module.exports = requestLogger;
