const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

// 提供靜態文件
app.use(express.static(path.join(__dirname, 'public')));

let gameState = {
  players: [],
  currentPlayerIndex: 0
};

io.on('connection', (socket) => {
  console.log('玩家連線：', socket.id);

  // 玩家加入
  socket.on('joinGame', (playerData) => {
    playerData.id = socket.id;
    gameState.players.push(playerData);
    io.emit('updateGame', gameState);

    // 測試事件
  socket.on('testEvent', (data) => {
    console.log('收到測試事件：', data);
    socket.emit('testResponse', { message: '伺服器已收到' });
    });
  });

  // 擲骰與移動
  socket.on('rollDice', () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id === socket.id) {
      const steps = Math.floor(Math.random() * 6) + 1;
      currentPlayer.pathIndex = (currentPlayer.pathIndex + steps) % 12; // 先用內圈12格模擬
      currentPlayer.row = [4,5,6,7,7,7,7,6,5,4,4,4][currentPlayer.pathIndex];
      currentPlayer.col = [4,4,4,4,5,6,7,7,7,7,6,5][currentPlayer.pathIndex];

      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      io.emit('updateGame', gameState);
    }
  });

  socket.on('disconnect', () => {
    console.log('玩家離線：', socket.id);
    gameState.players = gameState.players.filter(p => p.id !== socket.id);
    io.emit('updateGame', gameState);
  });
});

// 啟動伺服器
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`伺服器啟動於 http://localhost:${PORT}`);
});
