import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import type { ClientMessage } from '../shared/protocol.js';
import { UserManager } from './UserManager.js';
import { LobbyManager } from './LobbyManager.js';

export function createWSServer(
  wss: WebSocketServer,
  userManager: UserManager,
  lobbyManager: LobbyManager,
): void {
  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    let userId: string | null = null;

    const send = (msg: any): void => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    };

    ws.on('message', (raw: Buffer) => {
      let msg: ClientMessage;
      try { msg = JSON.parse(raw.toString()); } catch { send({ type: 'auth_error', reason: '无效JSON' }); return; }

      // ─── Auth ───
      if (msg.type === 'auth_login' || msg.type === 'auth_register') {
        if (msg.type === 'auth_register') {
          try {
            const { userId: newId, nickname } = userManager.register(msg.nickname, msg.password);
            userId = newId;
            userManager.login(newId, nickname, ws);
            send({ type: 'auth_ok', userId: newId, nickname });
            broadcastOnlineUsers(wss, userManager, ws);
            send({ type: 'player_list', players: userManager.getAllOnlinePlayers() });
            return;
          } catch (e: any) { send({ type: 'auth_error', reason: e.message }); return; }
        }

        const existingId = userManager.findByNickname(msg.nickname);
        if (existingId) {
          if (userManager.isOnline(existingId)) { send({ type: 'auth_error', reason: '该昵称已在线' }); return; }
          userId = existingId;
        } else {
          try {
            const result = userManager.register(msg.nickname, msg.password);
            userId = result.userId;
          } catch (e: any) { send({ type: 'auth_error', reason: e.message }); return; }
        }

        const ok = userManager.login(userId, msg.nickname, ws);
        if (!ok) { send({ type: 'auth_error', reason: '登录失败' }); return; }
        const user = userManager.getUser(userId);
        send({ type: 'auth_ok', userId, nickname: user?.nickname ?? msg.nickname });
        broadcastOnlineUsers(wss, userManager, ws);
        send({ type: 'player_list', players: userManager.getAllOnlinePlayers() });
        return;
      }

      if (!userId) { send({ type: 'auth_error', reason: '请先登录' }); return; }

      // ─── Friends ───
      if (msg.type === 'friend_list') {
        send({ type: 'friend_list', friends: userManager.getFriends(userId) });
        return;
      }
      if (msg.type === 'friend_add') {
        const targetId = userManager.findByNickname(msg.target);
        if (!targetId) { send({ type: 'game_error', message: '未找到该玩家' }); return; }
        const friend = userManager.addFriend(userId, targetId);
        if (friend) { send({ type: 'friend_added', friend }); } else { send({ type: 'game_error', message: '添加失败' }); }
        return;
      }

      // ─── Match vs Bot ───
      if (msg.type === 'match_vs_bot') {
        const result = lobbyManager.createBotRoom(userId);
        if ('error' in result) {
          send({ type: 'game_error', message: result.error });
        }
        return;
      }

      // ─── Matchmaking ───
      if (msg.type === 'match_start') {
        if (lobbyManager.getRoomByUserId(userId)) { send({ type: 'game_error', message: '你已在游戏中' }); return; }
        const result = lobbyManager.joinMatchQueue(userId);
        if ('position' in result) {
          send({ type: 'match_waiting', position: result.position });
        } else {
          send({ type: 'match_found', opponentId: result.found.opponentId, opponentName: result.found.opponentName });
        }
        return;
      }
      if (msg.type === 'match_cancel') { lobbyManager.cancelMatchQueue(userId); send({ type: 'match_timeout' }); return; }

      // ─── Invites ───
      if (msg.type === 'invite_send') {
        const targetId = userManager.findByNickname(msg.target);
        if (!targetId) { send({ type: 'game_error', message: '未找到该玩家' }); return; }
        const result = lobbyManager.sendInvite(userId, targetId);
        if (result.error) send({ type: 'game_error', message: result.error });
        return;
      }
      if (msg.type === 'invite_accept') {
        const result = lobbyManager.acceptInvite(userId, msg.inviterId);
        if ('error' in result) send({ type: 'game_error', message: (result as any).error });
        return;
      }
      if (msg.type === 'invite_decline') { lobbyManager.declineInvite(userId, msg.inviterId); return; }

      // ─── Game actions ───
      const room = lobbyManager.getRoomByUserId(userId);
      if (!room) { send({ type: 'game_error', message: '你不在任何对局中' }); return; }

      if (msg.type === 'game_coin_guess') { room.submitCoinGuess(userId, msg.guess); return; }
      if (msg.type === 'game_select_deck') { room.selectDeck(userId, msg.deckId); return; }
      if (msg.type === 'game_pick_hand') { room.pickHandCard(userId, msg.cardId); return; }
      if (msg.type === 'game_pick_public') { room.pickPublicCard(userId, msg.cardId); return; }
      if (msg.type === 'game_discard_hand') { room.discardHandCard(userId); return; }
      if (msg.type === 'game_dismiss_popup') { room.dismissPopup(userId); return; }
      if (msg.type === 'game_concede') { room.concede(userId); return; }
    });

    ws.on('close', () => {
      if (userId) {
        lobbyManager.handleDisconnect(userId);
        userManager.logout(userId);
        const user = userManager.getUser(userId);
        if (user) {
          for (const friend of userManager.getFriends(userId)) {
            const fws = userManager.getWS(friend.userId);
            if (fws?.readyState === WebSocket.OPEN) {
              fws.send(JSON.stringify({ type: 'player_offline', userId }));
            }
          }
        }
        broadcastOnlineUsers(wss, userManager, null);
      }
    });
  });
}

function broadcastOnlineUsers(wss: WebSocketServer, userManager: UserManager, excludeWS: WebSocket | null): void {
  const players = userManager.getAllOnlinePlayers();
  const msg = JSON.stringify({ type: 'player_list', players });
  wss.clients.forEach(c => {
    if (c !== excludeWS && c.readyState === WebSocket.OPEN) c.send(msg);
  });
}
