# 🃏 知识卡牌对战 (CustomCardGame\_Qian)

将知识点做成卡牌，发现概念之间的关联，在游戏中巩固学习成果。

灵感来自《古剑奇谭3》的"千秋戏"玩法，支持**双人联机**和**与机器人**对战，BO3 三局两胜制。

---

## ✨ 功能

| 功能 | 说明 |
|------|------|
| **双人联机对战** | 大厅邀请好友或随机匹配，BO3 三局两胜制 |
| **🤖 机器人对战** | 点击 "对战机器人" 即可单人对战，AI 自动行动 |
| **抛硬币抢选** | 先选者锁定硬币面，对手自动获得另一面；猜对者优先选卡组 |
| **对手手牌隐藏** | 服务器推送裁剪后的状态，只看得到自己手牌 |
| **卡组编辑器** | 在线创建/编辑卡牌和关联，导出/导入 JSON |
| **在线大厅** | 好友列表、在线状态、邀请/接受/拒绝 |
| **服务端卡组管理** | JSON 文件放入 `server/data/decks/` 即可生效 |

---

## 🏗 架构

```
客户端 (React SPA) ◄── WebSocket ──► Node.js 服务器 (Express + ws)
                                   ├─ UserManager (注册/登录/好友/在线)
                                   ├─ LobbyManager (匹配队列/邀请)
                                   ├─ GameRoom × N (每局完整生命周期)
                                   ├─ BotPlayer (机器人 AI)
                                   └─ DeckStore (服务端卡组)
```

服务器是唯一权威，所有游戏逻辑在服务端执行。

---

## 📦 服务器部署 (Linux / macOS)

```bash
cd CustomCardGame_Qian
npm install
npm run full:build                             # 前端 → dist/  后端 → dist-server/
npm run server:start                           # → http://0.0.0.0:3000
```

改端口:

```bash
PORT=8080 npm run server:start
```

### 后台持续运行

```bash
# pm2
sudo npm install -g pm2
pm2 start dist-server/server/index.js --name card-game
pm2 startup systemd
pm2 save

# systemd
sudo cat > /etc/systemd/system/card-game.service << 'SVC'
[Unit]
Description=知识卡牌对战服务器
After=network.target
[Service]
Type=simple
User=你的用户名
WorkingDirectory=/path/to/CustomCardGame_Qian
ExecStart=/usr/bin/node dist-server/server/index.js
Restart=on-failure
[Install]
WantedBy=multi-user.target
SVC
sudo systemctl enable --now card-game
```

### 添加卡组

把 `.json` 卡组文件放入 `server/data/decks/`，重启服务器即可。

```bash
cp 我的卡组.json server/data/decks/
pm2 restart card-game
```

### 防火墙

```bash
sudo ufw allow 3000/tcp          # 本地防火墙
# 云服务器还需在安全组放行 TCP 3000
```

---

## 💻 客户端使用

### 方式一：浏览器直接打开（零部署）

```
http://你的服务器IP:3000
```

输入昵称 → 登录 → 进入大厅。一个浏览器标签就是一个客户端。

### 方式二：Windows 双击运行

1. 安装 [Node.js](https://nodejs.org) (18+)
2. 解压 `CustomCardGame_Qian.zip`
3. 双击 `start.cmd`
4. 浏览器打开 `http://localhost:3000`

### 方式三：macOS / Linux 本地启动

```bash
cd dist/
node serve.mjs                  # → http://localhost:3000
# 或
bash start.sh 8080
```

---

## 🎮 完整玩法流程

```
登录 (输入昵称)
  ↓
大厅
  ├─ 在线玩家列表 → 点击邀请
  ├─ 好友列表 → 点击邀请
  ├─ 🤖 对战机器人 → 自动接受
  └─ 🎲 随机匹配 → 优先匹配机器人 → 其次在线玩家
  ↓
进入对局 (BO3)
  ├─ 🪙 抛硬币 (先选者锁定正面/反面，对手自动得另一面)
  │     猜对 → 优先选卡组
  ├─ 📚 选卡组 (从服务器卡组列表选)
  ├─ 🎴 Round 1 对战
  │    ├─ 我的回合: 手牌(6张) 选一张 → 公共池(8张) 选一张
  │    ├─ 有关联 → 得分 + 弹出知识解释 ✨
  │    └─ 无关联 → 牌退回，回合结束 💨
  ├─ 📚 Round 2 (对方选卡组)
  ├─ 📚 Round 3 (如 1:1 平)
  └─ 🏆 BO3 结算 → 返回大厅
```

---

## 🛠 开发命令

| 命令 | 说明 |
|------|------|
| `npm install` | 安装全部依赖 |
| `npm run dev` | 前端开发 (Vite :5173) |
| `npm run server:dev` | 后端开发 (tsx 热重载 :3000) |
| `npm run build` | 构建前端到 `dist/` |
| `npm run server:build` | 编译后端到 `dist-server/` |
| `npm run full:build` | 前端 + 后端一起构建 |
| `npm run server:start` | 启动编译后的服务器 |
| `npm run pack` | 构建 + 打包 ZIP (跨平台) |

### 同时开发前后端

```bash
# 终端 1
npm run dev                    # 前端 :5173

# 终端 2
npm run server:dev             # 后端 :3000，热重载
```

打开 `http://localhost:5173`，前端自动连接 `ws://localhost:3000/ws`。

---

## 📁 项目结构

```
CustomCardGame_Qian/
├── server/                  # 后端 (Node.js)
│   ├── index.ts             # 入口：Express + WebSocket + 机器人
│   ├── wsServer.ts          # WebSocket 消息路由
│   ├── UserManager.ts       # 注册/登录/好友/在线
│   ├── LobbyManager.ts      # 匹配队列/邀请
│   ├── GameRoom.ts          # BO3 游戏引擎
│   ├── BotPlayer.ts         # 机器人 AI（模拟 WebSocket）
│   ├── DeckStore.ts         # 服务端卡组存储
│   ├── FileStore.ts         # JSON 文件读写
│   ├── defaultDecks.ts      # 内置演示卡组
│   └── data/decks/          # 卡组 JSON 存放目录
├── shared/
│   └── protocol.ts          # 前后端共享类型 & WS 消息定义
├── src/                     # 前端 (React + TypeScript)
│   ├── engine/types.ts      # 共享类型（前端副本）
│   ├── store/
│   │   ├── connection.ts    # WebSocket 连接管理
│   │   └── gameStore.ts     # 游戏状态
│   ├── pages/
│   │   ├── Login.tsx        # 登录页
│   │   ├── Lobby.tsx        # 大厅（好友 + 在线 + 匹配 + 对战机器人）
│   │   ├── Game.tsx         # 对战页（抛硬币/选卡组/配对/BO3）
│   │   ├── Editor.tsx       # 卡组编辑器
│   │   └── Home.tsx         # 首页（路由跳转）
│   ├── components/
│   │   └── Card.tsx         # 卡牌组件
│   └── styles/global.css    # 暗色主题样式
├── scripts/                 # 部署脚本
│   ├── serve.mjs            # Node.js 迷你静态服务器
│   ├── pack.mjs             # 跨平台打包脚本
│   ├── start.cmd            # Windows 双击启动
│   └── start.sh             # macOS/Linux 启动
├── tsconfig.server.json     # 后端 TypeScript 配置
├── vite.config.ts           # 前端 Vite 配置
└── package.json             # 项目依赖 & 脚本
```

---

## 📁 卡组 JSON 格式

```json
{
  "meta": {
    "name": "初中物理 — 力学",
    "description": "覆盖牛顿定律、力、运动等核心概念",
    "author": "系统",
    "version": "1.0"
  },
  "cards": [
    { "id": "newton1", "name": "牛顿第一定律", "description": "...", "category": "定律" },
    { "id": "force", "name": "力", "description": "...", "category": "概念" }
  ],
  "relations": [
    {
      "cardA": "newton1",
      "cardB": "force",
      "type": "causal",
      "explanation": "牛顿第一定律说明了力不是维持运动的原因"
    }
  ]
}
```

### 关联类型 & 分值

| 类型 | 含义 | 基础分 |
|------|------|--------|
| `prerequisite` | 前置知识 | 3 |
| `causal` | 因果关系 | 4 |
| `analogy` | 类比概念 | 2 |
| `generalization` | 泛化/特例 | 3 |
| `application` | 实际应用 | 3 |

用编辑器 (`/#/editor`) 创建卡组，导出 JSON → 放入 `server/data/decks/`。

---

## 🤖 机器人行为说明

| 阶段 | 机器人行为 |
|------|-----------|
| 抛硬币 | 随机选正/反 (延迟 0.6-1.6s) |
| 选卡组 | 随机选一个 |
| 出牌 | 随机选手牌 + 公共牌 (间隔 0.4s) |
| 弹窗 | 自动关闭 |
| 邀请 | 自动接受 |
| 空闲 | 每 3 秒自动加入匹配队列 |
