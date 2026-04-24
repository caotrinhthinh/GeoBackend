let ioInstance = null;

const createFallbackSocket = () => ({
  on: () => {},
  emit: () => {},
  to: () => createFallbackSocket(),
  join: () => {},
});

const initializeRealtimeServer = (httpServer) => {
  if (ioInstance) {
    return ioInstance;
  }

  try {
    const { Server } = require('socket.io');

    ioInstance = new Server(httpServer, {
      cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
      },
    });

    ioInstance.on('connection', (socket) => {
      socket.on('join-role-room', ({ role_id, facility_id, ambulance_id } = {}) => {
        if (role_id != null) {
          socket.join(`role:${role_id}`);
        }

        if (facility_id != null) {
          socket.join(`facility:${facility_id}`);
        }

        if (ambulance_id != null) {
          socket.join(`ambulance:${ambulance_id}`);
        }
      });
    });

    return ioInstance;
  } catch (error) {
    ioInstance = createFallbackSocket();
    console.warn('Socket.IO is unavailable. Running with realtime fallback disabled.');
    return ioInstance;
  }
};

const getRealtimeServer = () => ioInstance;

const emitTrackingUpdate = (payload) => {
  if (!ioInstance || typeof ioInstance.to !== 'function') {
    return;
  }

  [2, 3].forEach((roleId) => {
    ioInstance.to(`role:${roleId}`).emit('ambulance:tracking:update', payload);
  });

  ioInstance.emit('ambulance:tracking:update', payload);
};

module.exports = {
  initializeRealtimeServer,
  getRealtimeServer,
  emitTrackingUpdate,
};