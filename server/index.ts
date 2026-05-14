import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { FileStore } from './FileStore.js';
import { UserManager } from './UserManager.js';
import { DeckStore } from './DeckStore.js';
import { LobbyManager } from './LobbyManager.js';
import { createWSServer } from './wsServer.js';
import { ensureDefaultDecks } from './defaultDecks.js';
import { BotPlayer } from './BotPlayer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function projectRoot(): string {
  if (__dirname.endsWith(path.join('dist-server', 'server')) ||
      __dirname.endsWith('dist-server\\server')) {
    return path.resolve(__dirname, '..', '..');
  }
  return path.resolve(__dirname, '..');
}

async function main(): Promise<void> {
  const root = projectRoot();
  const dataDir = path.join(root, 'server', 'data');
  const distPath = path.join(root, 'dist');

  const store = new FileStore(dataDir);
  await ensureDefaultDecks(store);

  const userManager = new UserManager(store);
  const deckStore = new DeckStore(store);
  const deckList = deckStore.listDecks();
  const deckIds = deckList.map(d => d.id);
  const decks = deckList.map(d => deckStore.getDeck(d.id)!).filter(Boolean);

  const lobbyManager = new LobbyManager(userManager, deckIds);
  lobbyManager.setDecks(decks);

  const app = express();
  app.use(express.static(distPath));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });
  createWSServer(wss, userManager, lobbyManager);

  // ─── Bot Player ───
  const bot = new BotPlayer(lobbyManager);
  const existingBotId = userManager.findByNickname(bot.nickname);
  let botId: string;
  if (existingBotId) {
    botId = existingBotId;
  } else {
    const info = userManager.register(bot.nickname);
    botId = info.userId;
  }
  // Important: use the consistent botId for login, not bot.userId
  userManager.login(botId, bot.nickname, bot.ws as any);

  // Fix: BotPlayer must use the server-assigned userId, not the one in its constructor
  bot.userId = botId;
  
  console.log(`  🤖 机器人已上线: ${bot.nickname} (${botId})`);

  // Bot auto-joins match queue when not in a game
  setInterval(() => {
    if (!lobbyManager.getRoomByUserId(botId)) {
      lobbyManager.joinMatchQueue(botId);
    }
  }, 3000);

  const PORT = parseInt(process.env.PORT || '3000', 10);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🃏 知识卡牌对战服务器已启动!`);
    console.log(`   项目根: ${root}`);
    console.log(`   前端文件: ${distPath}`);
    console.log(`   HTTP + WebSocket: http://0.0.0.0:${PORT}`);
    console.log(`   WebSocket: ws://0.0.0.0:${PORT}/ws`);
    console.log(`   卡组: ${deckIds.length} 个\n`);
  });
}

main().catch(err => { console.error('Server startup failed:', err); process.exit(1); });
