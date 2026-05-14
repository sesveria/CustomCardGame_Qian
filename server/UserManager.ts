import { v4 as uuid } from 'uuid'; import { FileStore } from './FileStore.js'; import type { FriendInfo } from '../shared/protocol.js'; import WebSocket from 'ws';
interface UserRecord { id: string; nickname: string; password: string | null; friends: string[]; }
interface UsersDB { users: Record<string, UserRecord>; }
export class UserManager {
  private db: UsersDB; private sessions = new Map<string, WebSocket>(); private nickToId = new Map<string, string>(); private saveScheduled = false;
  constructor(private store: FileStore) { this.db = store.readJSON<UsersDB>('users.json') ?? { users: {} }; for (const [id, u] of Object.entries(this.db.users)) this.nickToId.set(u.nickname, id); }
  private async saveDB(): Promise<void> { if (this.saveScheduled) return; this.saveScheduled = true; setImmediate(async () => { await this.store.writeJSON('users.json', this.db); this.saveScheduled = false; }); }
  register(nickname: string, password?: string): { userId: string; nickname: string } { if (this.nickToId.has(nickname)) throw new Error('昵称已被使用'); const id = 'u_' + uuid().substring(0, 8); const user: UserRecord = { id, nickname, password: password ?? null, friends: [] }; this.db.users[id] = user; this.nickToId.set(nickname, id); this.saveDB(); return { userId: id, nickname }; }
  login(userId: string, nickname: string, ws: WebSocket): boolean { let user = this.db.users[userId]; if (!user) { if (this.nickToId.has(nickname)) return false; user = { id: userId, nickname, password: null, friends: [] }; this.db.users[userId] = user; this.nickToId.set(nickname, userId); this.saveDB(); } this.sessions.set(userId, ws); return true; }
  logout(userId: string): void { this.sessions.delete(userId); }
  getWS(userId: string): WebSocket | undefined { return this.sessions.get(userId); }
  isOnline(userId: string): boolean { return this.sessions.has(userId); }
  getUser(userId: string): UserRecord | undefined { return this.db.users[userId]; }
  findByNickname(nickname: string): string | null { return this.nickToId.get(nickname) ?? null; }
  getFriends(userId: string): FriendInfo[] { const u = this.db.users[userId]; if (!u) return []; return u.friends.map(fid => { const f = this.db.users[fid]; return { userId: fid, nickname: f?.nickname ?? '(未知)', online: this.isOnline(fid) }; }); }
  addFriend(userId: string, targetId: string): FriendInfo | null { const u = this.db.users[userId]; const t = this.db.users[targetId]; if (!u || !t || userId === targetId) return null; if (!u.friends.includes(targetId)) { u.friends.push(targetId); this.saveDB(); } return { userId: targetId, nickname: t.nickname, online: this.isOnline(targetId) }; }
  getAllOnlinePlayers(): { userId: string; nickname: string }[] { const r: { userId: string; nickname: string }[] = []; for (const [id] of this.sessions) { const u = this.db.users[id]; if (u) r.push({ userId: id, nickname: u.nickname }); } return r; }
}
