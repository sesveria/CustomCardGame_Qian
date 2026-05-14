#!/bin/bash
PORT=${1:-3000}
echo "🃏 知识卡牌对战 - 本地启动"
echo "   http://localhost:$PORT"
node serve.mjs "$PORT"
