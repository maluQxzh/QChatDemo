
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const wss = new WebSocketServer({ port: PORT, host: HOST });

console.log(`Signaling Server started on ws://${HOST}:${PORT}`);

// Store clients: userId -> WebSocket
const clients = new Map();

wss.on('connection', (ws) => {
  let currentUserId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      // Handle Heartbeat
      if (message.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
          return;
      }

      // Handle Authentication / Registration
      if (message.type === 'AUTH') {
        currentUserId = message.userId;

        // Check if user is already connected
        if (clients.has(currentUserId)) {
          console.log(`User ${currentUserId} already connected. Kicking old session.`);
          const oldWs = clients.get(currentUserId);
          if (oldWs.readyState === 1) { // OPEN
            oldWs.send(JSON.stringify({ 
              type: 'FORCE_LOGOUT', 
              reason: 'Account logged in from another location' 
            }));
            oldWs.close();
          }
        }

        clients.set(currentUserId, ws);
        console.log(`User connected: ${currentUserId}`);
        
        // Send list of currently online users to the new user
        const onlineUsers = Array.from(clients.keys()).filter(id => id !== currentUserId);
        ws.send(JSON.stringify({
            type: 'ONLINE_USERS_LIST',
            userIds: onlineUsers
        }));

        // Broadcast presence
        broadcastStatus(currentUserId, 'online');
        return;
      }

      // Handle P2P/Relay Message (Chat & Friend Signals)
      const RELAY_TYPES = ['CHAT', 'FRIEND_REQUEST', 'FRIEND_ACCEPT', 'FRIEND_REMOVE'];
      if (RELAY_TYPES.includes(message.type)) {
        const { targetUserId, payload } = message;
        const targetWs = clients.get(targetUserId);
        
        if (targetWs && targetWs.readyState === 1) { // 1 = OPEN
          targetWs.send(JSON.stringify({
            type: message.type,
            payload: payload
          }));
          console.log(`Relayed ${message.type} from ${currentUserId} to ${targetUserId}`);
        } else {
          // Store offline message logic would go here
          console.log(`User ${targetUserId} is offline or not found.`);
        }
      }

    } catch (e) {
      console.error('Failed to parse message', e);
    }
  });

  ws.on('close', () => {
    if (currentUserId && clients.get(currentUserId) === ws) {
      clients.delete(currentUserId);
      console.log(`User disconnected: ${currentUserId}`);
      broadcastStatus(currentUserId, 'offline');
    }
  });
});

function broadcastStatus(userId, status) {
  const statusMsg = JSON.stringify({
    type: 'STATUS_UPDATE',
    userId,
    status
  });
  
  for (const client of clients.values()) {
    if (client.readyState === 1) {
      client.send(statusMsg);
    }
  }
}
