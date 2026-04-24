const jwt = require('jsonwebtoken');
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

      // TC05: Client join room để theo dõi một ca cấp cứu cụ thể (Yêu cầu JWT hoặc Tracking Token)
      socket.on('join_request_room', ({ requestId, token } = {}) => {
        if (!requestId || !token) {
          return socket.emit('error', 'Missing tracking token');
        }

        try {
          // Verify token (Tracking Token sinh ra từ createSOS hoặc JWT của User)
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // Nếu dùng tracking token của guest, phải khớp request_id
          if (decoded.role === 'guest_tracker' && decoded.request_id !== parseInt(requestId, 10)) {
            return socket.emit('error', 'Invalid token for this request');
          }

          socket.join(`request:${requestId}`);
          socket.emit('room_joined', { room: `request:${requestId}` });
        } catch (error) {
          socket.emit('error', 'Token expired or invalid');
        }
      });

      socket.on('leave_request_room', ({ requestId } = {}) => {
        if (!requestId) return;
        socket.leave(`request:${requestId}`);
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

  // TC05: Emit chỉ vào đúng room của ca cấp cứu — không broadcast toàn cục
  if (payload.emergency_request_id) {
    ioInstance
      .to(`request:${payload.emergency_request_id}`)
      .emit('tracking_update', payload);
  }
};

const closeEmergencyRoom = (requestId) => {
  if (!ioInstance) return;
  const roomName = `request:${requestId}`;
  
  // Thông báo cho các client biết ca cấp cứu đã kết thúc
  ioInstance.to(roomName).emit('tracking_ended', { message: 'Ca cấp cứu đã hoàn tất' });
  
  // Ép tất cả sockets rời khỏi room
  ioInstance.in(roomName).socketsJoin('limbo');
  ioInstance.socketsLeave(roomName);
};

module.exports = {
  initializeRealtimeServer,
  getRealtimeServer,
  emitTrackingUpdate,
  closeEmergencyRoom,
};