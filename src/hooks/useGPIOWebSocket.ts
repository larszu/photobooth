import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook für WebSocket-Verbindung zum Backend
 * Reagiert auf GPIO-Button-Events und navigiert automatisch
 */
export const useGPIOWebSocket = () => {
  const navigate = useNavigate();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = () => {
    try {
      // WebSocket-Verbindung zum Backend (angepasst für Raspberry Pi)
      const ws = new WebSocket('ws://192.168.8.204:3002');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('📡 GPIO WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📡 GPIO WebSocket message:', message);

          switch (message.type) {
            case 'navigate':
              // GPIO-Button Navigation
              console.log(`🔘 GPIO Navigation to: ${message.path}`);
              navigate(message.path);
              break;

            case 'photo-taken':
              // Foto wurde per GPIO aufgenommen
              if (message.success) {
                console.log(`📸 GPIO Photo taken: ${message.filename}`);
                // Optional: Toast-Benachrichtigung oder andere UI-Feedback
              } else {
                console.error('❌ GPIO Photo failed:', message.error);
              }
              break;

            default:
              console.log('Unknown GPIO WebSocket message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing GPIO WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('📡 GPIO WebSocket disconnected');
        wsRef.current = null;
        
        // Automatische Wiederverbindung nach 3 Sekunden
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('📡 Attempting GPIO WebSocket reconnection...');
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('📡 GPIO WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error creating GPIO WebSocket connection:', error);
    }
  };

  useEffect(() => {
    // WebSocket-Verbindung starten
    connect();

    // Cleanup beim Unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Verbindungsstatus zurückgeben
  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    reconnect: connect
  };
};

// Default Export
export default useGPIOWebSocket;
