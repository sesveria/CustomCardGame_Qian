# 🃏 知识卡牌对战

将知识点做成卡牌，发现概念之间的关联，在游戏中巩固学习成果。

灵感来自《古剑奇谭3》的"千秋戏"玩法，支持双人联机对战（BO3 三局两胜制）。

---

## 🏗 架构

```
服务器 (Node.js) ◄── WebSocket ──► 客户端 A / 客户端 B (浏览器)
```

服务器是唯一权威。客户端只负责渲染，操作通过 WebSocket 发送意图，服务器推送裁剪后的状态（对手手牌隐藏）。

---

## 📦 Part A — 服务器部署 (Linux/macOS)

```bash
cd CustomCardGame_Qian
npm install
npm run full:build
npm run server:start        # → http://0.0.0.0:3000
```

改端口: `PORT=8080 npm run server:start`

加卡组: 把 `.json` 放入 `server/data/decks/`，重启服务器。

后台运行: 用 `pm2` 或 `systemd`（见文末）。

---

## 💻 Part B — 客户端使用

### Windows / macOS / Linux 通用 —— 方式一

**不需要部署客户端。** 浏览器打开服务器地址即可:

```
http://你的服务器IP:3000
```

输入昵称 → 进入大厅 → 邀请好友或随机匹配。

---

### Windows 专属 —— 本地启动 (双击运行)

如果你**没有服务器**，只想在本机体验编辑器，或者你的 Windows 机器就是服务器:

1. 安装 [Node.js](https://nodejs.org) (18+)
2. 解压 `CustomCardGame_Qian.zip`
3. 双击 `start.cmd`
4. 浏览器打开 `http://localhost:3000`

> `start.cmd` 会调用 `node serve.mjs` 启动一个迷你静态服务器。

**想改端口？** 右键 `start.cmd` → 编辑 → 修改 `set PORT=3000` 为其他端口。

---

### macOS / Linux 本地启动

```bash
cd dist/
node serve.mjs          # 默认 :3000
# 或
node serve.mjs 8080     # 自定义端口
```

---

### 打包 ZIP 分发 (跨平台)

```bash
# Windows / macOS / Linux 都可用
npm run pack
```

生成 `CustomCardGame_Qian.zip` (~85 KB)，内含:
- 前端静态文件
- `serve.mjs` — Node.js 迷你服务器
- `start.cmd` — Windows 双击启动
- `start.sh` — macOS/Linux 启动脚本
- `README.md` — 使用说明

---

## 🛠 开发命令

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 (服务器端需运行) |
| `npm run dev` | 前端开发 (Vite :5173) |
| `npm run server:dev` | 后端开发 (tsx 热重载 :3000) |
| `npm run full:build` | 前端 + 后端一起构建 |
| `npm run server:start` | 启动构建后的服务器 |
| `npm run pack` | 构建 + 打包 ZIP (跨平台) |

---

## 🎮 玩法

登录 → 大厅 → 邀请/匹配 → 抛硬币 → 选卡组 → 3局2胜对战

每局: 手牌6张, 公共池8张, 配对成功=得分+知识解释

---

## 📁 卡组格式

```json
{
  "meta": { "name": "初中物理", "description": "...", "author": "系统", "version": "1.0" },
  "cards": [
    { "id": "newton1", "name": "牛顿第一定律", "description": "...", "category": "定律" }
  ],
  "relations": [
    { "cardA": "newton1", "cardB": "inertia", "type": "generalization", "explanation": "牛顿第一定律又称惯性定律" }
  ]
}
```

关联类型: `prerequisite` / `causal` / `analogy` / `generalization` / `application`

用编辑器 (`#/editor`) 创建卡组，导出 JSON → 放入 `server/data/decks/`。

---

## ⚙️ 后台持续运行 (Linux 服务器)

```bash
# pm2
npm install -g pm2
pm2 start dist-server/server/index.js --name card-game
pm2 save

# systemd
sudo cat > /etc/systemd/system/card-game.service << 'SVC'
[Unit]
Description=知识卡牌对战服务器
After=network.target
[Service]
Type=simple
User=you
WorkingDirectory=/path/to/CustomCardGame_Qian
ExecStart=/usr/bin/node dist-server/server/index.js
Restart=on-failure
[Install]
WantedBy=multi-user.target
SVC
sudo systemctl enable --now card-game
```
