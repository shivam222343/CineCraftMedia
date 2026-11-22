import { WebSocketServer, WebSocket } from 'ws';

let wss = null;

// Track client connections
// candidateClients: Map of cleanEmail -> Set of ws connections
const candidateClients = new Map();
// adminClients: Set of ws connections
const adminClients = new Set();

export const initSocketServer = (server) => {
  try {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
      let clientEmail = null;
      let isAdmin = false;

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());

          // Candidate requesting access status updates
          if (data.type === 'subscribe_request' && data.email) {
            clientEmail = data.email.toLowerCase().trim();
            if (!candidateClients.has(clientEmail)) {
              candidateClients.set(clientEmail, new Set());
            }
            candidateClients.get(clientEmail).add(ws);
            ws.send(
              JSON.stringify({
                type: 'subscribed',
                email: clientEmail,
                timestamp: new Date().toISOString(),
              })
            );
          }

          // Active Admin listening for live access requests
          if (data.type === 'subscribe_admin') {
            isAdmin = true;
            adminClients.add(ws);
            ws.send(
              JSON.stringify({
                type: 'admin_subscribed',
                timestamp: new Date().toISOString(),
              })
            );
          }
        } catch {
          // Ignore invalid JSON
        }
      });

      ws.on('close', () => {
        if (clientEmail && candidateClients.has(clientEmail)) {
          candidateClients.get(clientEmail).delete(ws);
          if (candidateClients.get(clientEmail).size === 0) {
            candidateClients.delete(clientEmail);
          }
        }
        if (isAdmin) {
          adminClients.delete(ws);
        }
      });

      ws.on('error', () => {
        if (clientEmail && candidateClients.has(clientEmail)) {
          candidateClients.get(clientEmail).delete(ws);
        }
        if (isAdmin) {
          adminClients.delete(ws);
        }
      });
    });

    console.log('[WebSocket Service] Realtime notification engine initialized.');
  } catch (err) {
    console.error('[WebSocket Service Error] Failed to attach WebSocketServer:', err.message);
  }
};

export const notifyNewAccessRequest = (request) => {
  const payload = JSON.stringify({
    type: 'new_access_request',
    request,
    timestamp: new Date().toISOString(),
  });

  for (const client of adminClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
};

export const notifyRequestStatusChanged = ({ email, status, token, user, message }) => {
  const cleanEmail = (email || '').toLowerCase().trim();
  const payload = JSON.stringify({
    type: 'request_status_update',
    email: cleanEmail,
    status, // 'approved' | 'rejected' | 'pending'
    token,
    user,
    message,
    timestamp: new Date().toISOString(),
  });

  // Notify candidate clients waiting on this email
  if (candidateClients.has(cleanEmail)) {
    for (const client of candidateClients.get(cleanEmail)) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  // Also broadcast to active admin clients
  for (const client of adminClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
};
