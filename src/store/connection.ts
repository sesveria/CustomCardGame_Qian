import { create } from 'zustand';
import type { ClientMessage, ServerMessage } from '../engine/types';

type MessageHandler = (msg: ServerMessage) => void;

interface ConnectionState {
  ws: WebSocket | null;
  connected: boolean;
  handlers: Map<string, Set<MessageHandler>>;

  connect: (url: string) => void;
  send: (msg: ClientMessage) => void;
  on: (type: ServerMessage['type'], handler: MessageHandler) => () => void;
  close: () => void;
}

export const useConnection = create<ConnectionState>((set, get) => ({
  ws: null,
  connected: false,
  handlers: new Map(),

  connect: (url: string) => {
    const existing = get().ws;
    if (existing) existing.close();

    const ws = new WebSocket(url);
    ws.onopen = () => set({ connected: true });
    ws.onclose = () => set({ connected: false });
    ws.onerror = () => set({ connected: false });

    ws.onmessage = (event) => {
      let msg: ServerMessage;
      try { msg = JSON.parse(event.data); } catch { return; }
      const handlers = get().handlers.get(msg.type);
      if (handlers) {
        handlers.forEach(h => h(msg));
      }
    };

    set({ ws, connected: false });
  },

  send: (msg: ClientMessage) => {
    const ws = get().ws;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  },

  on: (type: string, handler: MessageHandler) => {
    const map = get().handlers;
    if (!map.has(type)) map.set(type, new Set());
    map.get(type)!.add(handler);
    // Return unsubscribe fn
    return () => {
      map.get(type)?.delete(handler);
    };
  },

  close: () => {
    get().ws?.close();
    set({ ws: null, connected: false, handlers: new Map() });
  },
}));
