import WebSocket from 'ws';
import { v4 as uuid } from 'uuid';
import type { ClientMessage, ServerMessage, GameStateForPlayer, Card, PlayerSlot } from '../shared/protocol.js';
import type { LobbyManager } from './LobbyManager.js';

// ─── Fake WebSocket for the bot ───
// Used only for receiving server→bot messages via .send()
// Bot→server actions go through direct LobbyManager/GameRoom calls, not WS.

class BotWebSocket {
  readyState: number = WebSocket.OPEN;
  private _closeHandlers: Array<() => void> = [];
  _onServerMsg: ((msg: ServerMessage) => void) | null = null;

  // Server → Bot: server code calls this to send a message TO the bot
  send(data: string): void {
    let msg: ServerMessage;
    try { msg = JSON.parse(data); } catch { return; }
    this._onServerMsg?.(msg);
  }

  // Not used for bot→server; kept for interface compatibility
  on(_event: string, _handler: (...args: any[]) => void): void {}
  close(): void {}
  static readonly OPEN = 1;
}

// ─── Bot AI ───

class BotAI {
  private game: GameStateForPlayer | null = null;
  private sendFn: ((msg: ClientMessage) => void) | null = null;
  private timer: NodeJS.Timeout | null = null;

  bind(send: (msg: ClientMessage) => void): void {
    this.sendFn = send;
  }

  handleState(state: GameStateForPlayer): void {
    this.game = state;
    if (this.timer) clearTimeout(this.timer);

    const delay = 600 + Math.random() * 1000; // 0.6–1.6s
    this.timer = setTimeout(() => this.act(), delay);
  }

  private act(): void {
    const g = this.game;
    const s = this.sendFn;
    if (!g || !s) return;

    switch (g.phase) {
      case 'coin_toss':
        if (!g.coinGuessed) {
          const guess: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
          s({ type: 'game_coin_guess', guess });
        }
        break;

      case 'deck_select':
        if (g.deckSelector === g.mySlot) {
          const idx = Math.floor(Math.random() * g.availableDeckIds.length);
          s({ type: 'game_select_deck', deckId: g.availableDeckIds[idx] });
        }
        break;

      case 'selecting-card': {
        const isMe = g.currentPlayer === g.mySlot;
        if (isMe && g.myHand.length > 0 && g.publicPool.length > 0) {
          const hc = g.myHand[Math.floor(Math.random() * g.myHand.length)];
          const pc = g.publicPool[Math.floor(Math.random() * g.publicPool.length)];
          s({ type: 'game_pick_hand', cardId: hc.id });
          setTimeout(() => s({ type: 'game_pick_public', cardId: pc.id }), 400);
        }
        break;
      }

      case 'matching':
        if (g.currentPlayer === g.mySlot) {
          s({ type: 'game_dismiss_popup' });
        }
        break;
    }
  }

  reset(): void {
    this.game = null;
    if (this.timer) clearTimeout(this.timer);
  }
}

// ─── Bot Player ───

export class BotPlayer {
  userId: string;
  nickname = '🤖 机器人';
  ws: BotWebSocket;
  private ai: BotAI;
  private lobbyManager: LobbyManager;

  constructor(lobbyManager: LobbyManager) {
    this.userId = 'bot_' + uuid().substring(0, 6);
    this.ws = new BotWebSocket();
    this.ai = new BotAI();
    this.lobbyManager = lobbyManager;

    // Bot→server: actions go directly to GameRoom, not through WS
    this.ai.bind((msg) => {
      const room = this.lobbyManager.getRoomByUserId(this.userId);
      if (!room) return;

      switch (msg.type) {
        case 'game_coin_guess': room.submitCoinGuess(this.userId, msg.guess); break;
        case 'game_select_deck': room.selectDeck(this.userId, msg.deckId); break;
        case 'game_pick_hand': room.pickHandCard(this.userId, msg.cardId); break;
        case 'game_pick_public': room.pickPublicCard(this.userId, msg.cardId); break;
        case 'game_dismiss_popup': room.dismissPopup(this.userId); break;
        case 'game_concede': room.concede(this.userId); break;
      }
    });

    // Server→bot: handle incoming messages
    this.ws._onServerMsg = (msg: ServerMessage) => {
      if (msg.type === 'invite_received') {
        // Auto-accept after small delay
        setTimeout(() => {
          this.lobbyManager.acceptInvite(this.userId, msg.inviterId);
        }, 400);
      } else if (msg.type === 'game_start' || msg.type === 'game_state') {
        this.ai.handleState(msg.state);
      }
    };
  }
}
