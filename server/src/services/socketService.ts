import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocketIO(socketServer: SocketIOServer) {
  io = socketServer;

  io.on('connection', (socket) => {
    // Clients can join rooms based on interface: 'kiosk', 'staff', 'kitchen', 'admin'
    socket.on('join_room', (room: string) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitOrderCreated(order: any) {
  if (!io) return;
  // Staff receives alert for incoming order to collect payment
  io.to('staff').emit('order:created', order);
  io.to('admin').emit('order:created', order);
}

export function emitOrderPaid(order: any, payment: any) {
  if (!io) return;
  // Staff and Admin see status update to PAID
  io.to('staff').emit('order:paid', { order, payment });
  io.to('admin').emit('order:paid', { order, payment });
  // Kitchen ONLY receives ticket once order is PAID!
  io.to('kitchen').emit('kds:new_ticket', { order, payment });
}

export function emitOrderStatusChanged(order: any) {
  if (!io) return;
  io.emit('order:status_changed', order);
}

export function emitOrderCancelled(order: any) {
  if (!io) return;
  io.emit('order:cancelled', order);
}

export function emitSettingsUpdated(settings: any) {
  if (!io) return;
  io.emit('settings:updated', settings);
}
