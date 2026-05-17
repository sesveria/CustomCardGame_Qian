import WebSocket from 'ws';
import { v4 as uuid } from 'uuid';
import { UserManager } from './UserManager.js';
import { GameRoom } from './GameRoom.js';
import { BotAI } from './BotAI.js';
import type { Deck, GameStateForPlayer, ClientMessage } from '../shared/protocol.js';

export class LobbyManager {
  private matchQueue: string[] = [];
  private activeRooms = new Map<string, GameRoom>();
  private pendingInvites = new Map<string, { from: string; to: string; timer: NodeJS.Timeout }>();
  private userDecks: Deck[] = [];

  constructor(
    private userManager: UserManager,
    private deckIds: string[],
  ) {}

  setDecks(decks: Deck[]): void { this.userDecks = decks; }

  joinMatchQueue(userId: string): { position: number } | { found: { opponentId: string; opponentName: string }; roomId: string } {
    this.matchQueue = this.matchQueue.filter(id => id !== userId);
    if (this.matchQueue.length >= 1) {
      const opponentId = this.matchQueue.shift()!;
      const room = this.createRoom(userId, opponentId);
      const opponent = this.userManager.getUser(opponentId);
      return {
        found: { opponentId, opponentName: opponent?.nickname ?? '?' },
        roomId: room.id,
      };
    }
    this.matchQueue.push(userId);
    return { position: 1 };
  }

  cancelMatchQueue(userId: string): void {
    this.matchQueue = this.matchQueue.filter(id => id !== userId);
  }

  removeFromQueue(userId: string): void {
    this.matchQueue = this.matchQueue.filter(id => id !== userId);
    for (const [key, inv] of this.pendingInvites) {
      if (inv.from === userId || inv.to === userId) {
        clearTimeout(inv.timer);
        this.pendingInvites.delete(key);
      }
    }
  }

  sendInvite(fromId: string, toId: string): { error?: string } {
    const from = this.userManager.getUser(fromId);
    const toWS = this.userManager.getWS(toId);
    if (!from || !toWS) return { error: '对方不在线' };
    if (!this.userManager.isOnline(toId)) return { error: '对方不在线' };
    if (this.getRoomByUserId(fromId) || this.getRoomByUserId(toId)) return { error: '有玩家已在游戏中' };

    for (const [key, inv] of this.pendingInvites) {
      if (inv.from === fromId) { clearTimeout(inv.timer); this.pendingInvites.delete(key); }
    }

    const key = `${fromId}:${toId}`;
    const timer = setTimeout(() => {
      this.pendingInvites.delete(key);
      toWS.send(JSON.stringify({ type: 'invite_cancelled', inviterId: fromId }));
    }, 60_000);

    this.pendingInvites.set(key, { from: fromId, to: toId, timer });
    toWS.send(JSON.stringify({ type: 'invite_received', inviterId: fromId, inviterName: from.nickname }));
    return {};
  }

  acceptInvite(accepterId: string, inviterId: string): GameRoom | { error: string } {
    const key = `${inviterId}:${accepterId}`;
    const inv = this.pendingInvites.get(key);
    if (!inv) return { error: '邀请已过期' };
    clearTimeout(inv.timer);
    this.pendingInvites.delete(key);
    if (!this.userManager.isOnline(inviterId)) return { error: '对方已离线' };
    if (this.getRoomByUserId(inviterId) || this.getRoomByUserId(accepterId)) return { error: '有玩家已在游戏中' };
    return this.createRoom(inviterId, accepterId);
  }

  declineInvite(accepterId: string, inviterId: string): void {
    const key = `${inviterId}:${accepterId}`;
    const inv = this.pendingInvites.get(key);
    if (inv) { clearTimeout(inv.timer); this.pendingInvites.delete(key); }
    const ws = this.userManager.getWS(inviterId);
    if (ws) ws.send(JSON.stringify({ type: 'invite_cancelled', inviterId }));
  }

  createBotRoom(playerId: string): GameRoom | { error: string } {
    const user = this.userManager.getUser(playerId);
    const ws = this.userManager.getWS(playerId);
    if (!user || !ws) return { error: '玩家不可用' };
    if (this.getRoomByUserId(playerId)) return { error: '你已在游戏中' };

    const botUserId = 'bot_' + uuid().substring(0, 6);
    const roomId = 'room_' + uuid().substring(0, 6);

    const botWs = { readyState: WebSocket.OPEN, send: () => {} } as any;
    const room = new GameRoom(
      roomId, playerId, user.nickname, ws,
      botUserId, '🤖 机器人', botWs,
      this.deckIds,
    );

    const botAi = new BotAI();
    botAi.bind((msg: ClientMessage) => {
      switch (msg.type) {
        case 'game_coin_guess': room.submitCoinGuess(botUserId, msg.guess); break;
        case 'game_select_deck': room.selectDeck(botUserId, msg.deckId); break;
        case 'game_pick_hand': room.pickHandCard(botUserId, msg.cardId); break;
        case 'game_pick_public': room.pickPublicCard(botUserId, msg.cardId); break;
        case 'game_discard_hand': room.discardHandCard(botUserId); break;
        case 'game_dismiss_popup': room.dismissPopup(botUserId); break;
      }
    });

    room.markBot(botUserId, (state) => botAi.handleState(state));
    room.markBotGame();

    for (const d of this.userDecks) room.setDeck(d.meta.name, d);

    room.setCallbacks(
      (_unused) => {},
      (_unused) => { room.finishMatch(); this.activeRooms.delete(roomId); },
    );

    this.activeRooms.set(roomId, room);
    room.startMatch();
    return room;
  }

  private createRoom(p1: string, p2: string): GameRoom {
    const p1u = this.userManager.getUser(p1);
    const p2u = this.userManager.getUser(p2);
    const p1ws = this.userManager.getWS(p1);
    const p2ws = this.userManager.getWS(p2);
    if (!p1u || !p2u || !p1ws || !p2ws) throw new Error('Player not available');

    const roomId = 'room_' + uuid().substring(0, 6);
    const room = new GameRoom(roomId, p1, p1u.nickname, p1ws, p2, p2u.nickname, p2ws, this.deckIds);

    for (const d of this.userDecks) room.setDeck(d.meta.name, d);

    room.setCallbacks(
      (_unused) => {},
      (_unused) => { room.finishMatch(); this.activeRooms.delete(roomId); },
    );

    this.activeRooms.set(roomId, room);
    room.startMatch();
    return room;
  }

  getRoomByUserId(userId: string): GameRoom | null {
    for (const room of this.activeRooms.values()) {
      if (room.hasPlayer(userId)) return room;
    }
    return null;
  }

  getRoom(roomId: string): GameRoom | undefined { return this.activeRooms.get(roomId); }

  handleDisconnect(userId: string): void {
    this.removeFromQueue(userId);
    const room = this.getRoomByUserId(userId);
    if (room) { room.concede(userId); this.activeRooms.delete(room.id); }
  }
}
