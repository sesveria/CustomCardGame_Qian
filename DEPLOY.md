# 🃏 知识卡牌对战 — 部署指南

---

## 0. 前置准备（服务器 + 本地都要）

在你的开发机器上：

```bash
cd /home/gm/codex/CustomCardGame_Qian
npm install
npm run full:build        # 前端 → dist/  后端 → dist-server/
npm run pack              # 打包前端 ZIP（可选，发给 Windows 用户）
```

构建产物：

```
dist/                     ← 前端静态文件（发给客户端的）
dist-server/              ← 编译后的后端 JS（部署到服务器）
CustomCardGame_Qian.zip   ← 前端 ZIP 包（发给 Windows 用户双击 start.cmd）
```

---

## 1. 服务器部署（Ubuntu）

### 1.1 上传项目到服务器

在你的开发机器上：

```bash
# 把整个项目目录上传到服务器（可以先删掉 node_modules 减少体积）
rsync -avz --exclude node_modules --exclude dist --exclude dist-server \
  /home/gm/codex/CustomCardGame_Qian/ \
  user@你的服务器IP:/home/user/CustomCardGame_Qian/
```

### 1.2 在服务器上安装依赖和构建

SSH 登录服务器：

```bash
ssh user@你的服务器IP

# 安装 Node.js 18+（如果还没装）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # 确认 ≥18

# 进入项目目录
cd /home/user/CustomCardGame_Qian

# 安装依赖
npm install

# 构建全部
npm run full:build
```

### 1.3 启动服务器

```bash
# 直接启动（测试用，关终端就停）
npm run server:start

# 或指定端口
PORT=8080 npm run server:start
```

启动后访问 `http://你的服务器IP:3000`，应该能看到登录页。

### 1.4 后台持续运行（推荐 pm2）

```bash
# 安装 pm2
sudo npm install -g pm2

# 启动
pm2 start dist-server/server/index.js --name card-game

# 设置开机自启
pm2 startup systemd
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs card-game

# 重启
pm2 restart card-game
```

### 1.5 防火墙开放端口

```bash
# 如果用了 ufw
sudo ufw allow 3000/tcp

# 如果是云服务器，还要在云控制台的安全组里放行 TCP 3000
```

### 1.6 添加更多卡组

把卡组 JSON 文件放入服务器上的 `server/data/decks/` 目录，然后重启：

```bash
cp 我的卡组.json /home/user/CustomCardGame_Qian/server/data/decks/
pm2 restart card-game
```

---

## 2. 客户端使用

客户端是**纯浏览器应用**，有以下几种方式：

### 2.1 方式一：浏览器直接访问（最简单，全平台通用）

玩家**不需要安装任何东西**。在 Windows / macOS / Linux 上打开浏览器，输入：

```
http://你的服务器IP:3000
```

输入昵称 → 登录 → 进入大厅 → 对战机器人 / 邀请好友 / 随机匹配。

**这就是客户端。** 一个浏览器标签就是一个客户端。

---

### 2.2 方式二：Windows 本地启动（双击运行）

适用场景：玩家没有服务器，只想体验编辑器功能；或者玩家的 Windows 机器本身就是服务器。

**接收方操作步骤：**

1. 安装 [Node.js](https://nodejs.org)（18+，下载 Windows 安装包，一路下一步）
2. 把 `CustomCardGame_Qian.zip` 发给对方
3. 对方解压到任意文件夹（比如桌面）
4. **双击 `start.cmd`**
5. 浏览器自动打开或手动打开 `http://localhost:3000`

> 注意：本地启动时只能玩编辑器和单机模式（机器人）。联机对战需要连接到运行中的游戏服务器。

**自定义端口：** 右键 `start.cmd` → 编辑 → 把 `set PORT=3000` 改成 `set PORT=8080` → 保存 → 双击。

---

### 2.3 方式三：macOS / Linux 本地启动

```bash
cd dist/
node serve.mjs           # 默认 http://localhost:3000
node serve.mjs 8080      # 自定义端口
```

或者直接运行：
```bash
bash start.sh            # 默认 :3000
bash start.sh 8080       # 自定义端口
```

---

## 3. 开发调试（在开发机器上）

开两个终端：

```bash
# 终端 1 — 前端热更新
cd /home/gm/codex/CustomCardGame_Qian
npm run dev
# → http://localhost:5173

# 终端 2 — 后端热重载
cd /home/gm/codex/CustomCardGame_Qian
npm run server:dev
# → http://localhost:3000 (WebSocket /ws)
```

浏览器打开 `http://localhost:5173`，登录时会自动连接 `ws://localhost:3000/ws`。

---

## 4. 快速命令速查

| 在哪里运行 | 命令 | 作用 |
|-----------|------|------|
| 开发机 | `npm install` | 安装依赖 |
| 开发机 | `npm run dev` | 前端开发 (Vite :5173) |
| 开发机 | `npm run server:dev` | 后端开发 (tsx :3000) |
| 开发机 | `npm run full:build` | 构建前端 + 后端 |
| 开发机 | `npm run pack` | 构建 + 打包 ZIP (跨平台) |
| 服务器 | `npm run server:start` | 启动后端 |
| 服务器 | `pm2 start dist-server/server/index.js --name card-game` | 后台运行 |
| 服务器 | `pm2 restart card-game` | 重启 |
| 服务器 | `pm2 logs card-game` | 看日志 |
| Windows | 双击 `start.cmd` | 本地启动 |
| macOS | `bash start.sh` | 本地启动 |

---

## 5. 常见问题

**Q: 浏览器打开显示"无法连接"？**
- 检查服务器是否在运行 (`pm2 status`)
- 检查防火墙是否开放端口 (`sudo ufw status`)
- 云服务器检查安全组规则

**Q: 登录后看不到其他玩家？**
- 需要至少两个人同时登录才能匹配或邀请
- 可以开两个浏览器标签，用不同昵称登录测试
- 没有在线玩家时可以用"对战机器人"

**Q: 机器人未在线？**
- 机器人不需要在线，点击"对战机器人"按钮即可直接开局
- 服务器会自动创建机器人玩家并接受邀请

**Q: 如何添加卡组？**
- 用编辑器 (`http://服务器IP:3000/#/editor`) 创建卡组
- 导出 JSON
- 把 JSON 文件放到服务器的 `server/data/decks/` 目录

**Q: 换端口后 WebSocket 连不上？**
- 同时改服务器端口 (`PORT=8080 npm run server:start`) 和防火墙规则
- 客户端不需要改，浏览器自动用当前页面的 host:port 连接
