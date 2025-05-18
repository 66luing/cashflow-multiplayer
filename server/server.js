const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const fs = require('fs');
const path = require('path');

// 初始化伺服器
const app = express();
const server = http.createServer(app); // 使用 http.createServer
const io = socketio(server); // 將伺服器傳遞給 Socket.IO
app.use((req, res, next) => {
  const nonce = Buffer.from(Date.now().toString()).toString('base64'); // 生成隨機 nonce
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'nonce-${nonce}' https://cdn.socket.io;"
  );
  res.locals.nonce = nonce; // 將 nonce 傳遞給模板引擎（如果需要）
  next();
  //或在index.html + <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:;">
});
app.use(express.static(path.join(__dirname, '../public')));
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // 回傳 204 No Content，告訴瀏覽器不需要圖示
});
// 載入遊戲資料
const cards = JSON.parse(fs.readFileSync('./server/cards.json'));
const dreams = JSON.parse(fs.readFileSync('./server/dreams.json'));

// 遊戲狀態儲存
const rooms = new Map(); 

// Socket.io 事件處理
io.on('connection', (socket) => {
  socket.on('join_room', ({ name, room }) => {
    if (!rooms.has(room)) {
      rooms.set(room, []);
    }

    const players = rooms.get(room);
    players.push({ id: socket.id, name });
    rooms.set(room, players);

    socket.join(room);

    // 推播玩家更新訊息
    io.to(room).emit('update_players', players);
    socket.to(room).emit('player_joined', { name });
  });

  socket.on('disconnect', () => {
    rooms.forEach((players, room) => {
      const updatedPlayers = players.filter(player => player.id !== socket.id);
      rooms.set(room, updatedPlayers);

      // 推播玩家更新訊息
      io.to(room).emit('update_players', updatedPlayers);
    });
  });

  socket.on('roll_dice', (data) => {
    const room = rooms.get(data.room);
    const player = room.players.find(p => p.id === socket.id);
    // 骰子邏輯與移動處理
    const steps = Math.floor(Math.random() * 6) + 1;
    player.position = (player.position + steps) % 20;
    checkCardTrigger(room, player); // 檢查卡片觸發
    io.to(data.room).emit('player_moved', { player, steps });
  });
});

// 卡片觸發檢查
function checkCardTrigger(room, player) {
  const cardTypes = ['命運卡', '機會卡', '意外卡', '市場風雲卡'];
  const probabilities = [0.15, 0.2, 0.1, 0.05];
  cardTypes.forEach((type, index) => {
    if (Math.random() < probabilities[index]) {
      const card = cards.find(c => c.type === type);
      io.to(room.id).emit('trigger_card', card);
    }
  });
}

// 啟動伺服器
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`伺服器正在 http://localhost:${PORT} 運行`);
});


