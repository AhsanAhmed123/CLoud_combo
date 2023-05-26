import { Server } from 'socket.io';

let io: any;

// Keep track of connected sockets and their associated user IDs
const sockets = new Map();

export function startSocketServer(server: any) {
    io = new Server(server);

    io.on('connection', (socket: any) => {
        // When a user connects, store their socket object in the userSockets object
        const { userId } = socket.handshake.query;
        sockets.set(userId, socket);

        socket.on('disconnect-user', function(id: any) {
            sockets.delete(id);
        });
    });
}

export function getSocketByUserId(userId: any) {
    return sockets.get(userId);
}