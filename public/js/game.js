const socket = io();
let currentRoom = null;

let players = [];
let currentPlayerIndex = 0;
let myId = null;
document.getElementById('login-btn').addEventListener('click', joinRoom);
document.getElementById('invite-btn').addEventListener('click', () => {
  const room = document.getElementById('Room-ID').value; // 獲取聊天室名稱
  const url = `${window.location.origin}?room=${room}`; // 生成邀請網址
  if (!room) {
    alert('聊天室名稱不存在，請先建立聊天室！');
    return;
  }
  // 將邀請訊息複製到剪貼簿
  const inviteMessage = `加入我的現金流遊戲！\n聊天室名稱：${room}\n邀請連結：${url}`;
  navigator.clipboard.writeText(inviteMessage).then(() => {
    alert('邀請訊息已複製到剪貼簿，快分享給朋友吧！');
  }).catch(err => {
    console.error('無法複製到剪貼簿：', err);
    alert('複製失敗，請手動複製以下訊息：\n' + inviteMessage);
  });
});

// Canvas 地圖繪製
const canvas = document.getElementById('game-map');

const ctx = canvas.getContext('2d');
let cameraOffset = { x: 0, y: 0 };

const professions = {
  "門衛": { salary: 1500, expense: 800, cash: 500, debt: 1000 },
  "卡車司機": { salary: 2000, expense: 1000, cash: 800, debt: 2000 },
  "秘書": { salary: 2200, expense: 1200, cash: 1000, debt: 2500 },
  "護士": { salary: 2500, expense: 1500, cash: 1500, debt: 3000 },
  "警察": { salary: 2800, expense: 1600, cash: 1800, debt: 4000 },
  "小學教師": { salary: 3000, expense: 1700, cash: 2000, debt: 4500 },
  "經理": { salary: 4000, expense: 2200, cash: 3000, debt: 6000 },
  "工程師": { salary: 4500, expense: 2500, cash: 4000, debt: 8000 },
  "機械師": { salary: 4200, expense: 2400, cash: 3500, debt: 7500 },
  "飛行員": { salary: 6000, expense: 3500, cash: 6000, debt: 10000 },
  "律師": { salary: 7000, expense: 4000, cash: 8000, debt: 12000 },
  "醫生": { salary: 8000, expense: 5000, cash: 10000, debt: 15000 }
};

for (const job in professions) {
  document.getElementById("jobSelect").innerHTML += `<option value="${job}">${job}</option>`;
}

function joinRoom() {
  const name = document.getElementById("player-name").value;
  const room = document.getElementById("Room-ID").value;

  if (!name || !room) {
    alert("請填寫所有欄位");
    return;
  }else{
    // 加入聊天室
  currentRoom = room;
  socket.emit('join_room', { name, room });
  // 顯示「開始遊戲」按鈕
  document.getElementById('start-game-btn').style.display = "inline-block";
  document.getElementById('start-game-btn').addEventListener('click', startGame);
  // 隱藏登入按鈕
  document.getElementById('login-btn').style.display = "none";
  }
}

function startGame() {
    //顯示畫布
    //document.getElementById('game-container').style.display = "block";
    //const gameContainer = document.getElementById('game-container');
    //gameContainer.classList.remove('hidden');
    //gameContainer.classList.add('visible');


    //隱藏畫布document.getElementById('login-container').style.display = "none";
    document.getElementById('asset-btn').disabled = false;
    document.getElementById('roll-dice').disabled = false;
    console.log("開始繪製地圖");
    //drawMap();
    generateBoard();
    
    document.getElementById('roll-dice').addEventListener('click', rollDice);
    document.getElementById('asset-btn').addEventListener('click', toggleAssets);
}


const outerPath = [
  [2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,8],[2,9],
  [3,9],[4,9],[5,9],[6,9],[7,9],[8,9],
  [9,9],[9,8],[9,7],[9,6],[9,5],[9,4],[9,3],[9,2],
  [8,2],[7,2],[6,2],[5,2],[4,2],[3,2]
];

const innerPath = [
  [4, 4], [4, 5], [4, 6], [4, 7],
  [5, 7], [6, 7],
  [7, 7], [7, 6], [7, 5], [7, 4],
  [6, 4], [5, 4]
];


function drawMap() {
  // 繪製內外圈
  //目前沒用
  if (!ctx) {
    console.error("Canvas 上下文未初始化");
    return;
  }
  console.log("繪製地圖開始");
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.fillStyle = "orange";
  //ctx.fillStyle = "#FFA500";
  //ctx.fillStyle = "rgb(255,165,0)";
  ctx.arc(400, 400, 300, 0, Math.PI * 2); // 內圈
  ctx.arc(800, 800, 600, 0, Math.PI * 2);  // 外圈
  ctx.fillRect(1000, 1000, 25, 25);
  ctx.stroke();
} 

function generateBoard() {
  const tileSize = 80; // 每個格子的大小
  const rows = 12; // 棋盤的行數
  const cols = 12; // 棋盤的列數

  // 清空 Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 繪製棋盤格
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileSize;
      const y = row * tileSize;

      // 判斷格子類型
      const isOuter = outerPath.some(p => p[0] === row && p[1] === col);
      const isInner = innerPath.some(p => p[0] === row && p[1] === col);
      const isCenter = row >= 5 && row <= 6 && col >= 5 && col <= 6;

      // 設定格子顏色
      if (isCenter) {
        ctx.fillStyle = "#eeeeee"; // 中心區域
      } else if (isOuter) {
        ctx.fillStyle = "#fce4ec"; // 外圈
      } else if (isInner) {
        ctx.fillStyle = "#e8f5e9"; // 內圈
      } else {
        ctx.fillStyle = "#eeeeee"; // 其他區域
      }

      // 繪製格子
      ctx.fillRect(x, y, tileSize, tileSize);

      // 繪製格子邊框
      ctx.strokeStyle = "#000000";
      ctx.strokeRect(x, y, tileSize, tileSize);

      // 繪製文字（例如 "內" 或 "外"）
      if (isOuter) {
        ctx.fillStyle = "#000000";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("外", x + tileSize / 2, y + tileSize / 2);
      } else if (isInner) {
        ctx.fillStyle = "#000000";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("內", x + tileSize / 2, y + tileSize / 2);
      }
    }
  }
}

// 接收伺服器推播的玩家更新訊息
socket.on('update_players', (updatedPlayers) => {
  players = updatedPlayers;

  // 更新訊息框
  const logBox = document.getElementById('log');
  logBox.innerHTML = ""; // 清空訊息框
  players.forEach(player => {
    const message = `${player.name} 已加入聊天室`;
    const logEntry = document.createElement('div');
    logEntry.textContent = message;
    logBox.appendChild(logEntry);
  });
});

// Socket.IO 事件：玩家加入
socket.on('player_joined', (player) => {
  const logBox = document.getElementById('log');
  const message = `${player.name} 已加入聊天室`;
  const logEntry = document.createElement('div');
  logEntry.textContent = message;
  logBox.appendChild(logEntry);
});

  // 繪製玩家
  players.forEach(player => {
    const pos = calculatePosition(player.position);
    ctx.drawImage(player.avatar, pos.x, pos.y, 16, 16);
  });



  function toggleAssets() {
    const panel = document.getElementById("asset-panel");
    panel.style.display = panel.style.display === "none" ? "block" : "none";
    if (panel.style.display === "block") updateAssetsDisplay();
  }

  function updateAssetsDisplay() {
    const panel = document.getElementById("asset-panel");
    panel.innerHTML = players.map((p, i) => `
      <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
        <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px; background:#f9f9f9">
      <h4>${p.name} - ${p.job}</h4>
      <div>💵 現金：$${p.cash}</div>
      <div>💳 債務：$${p.debt}</div>
      <div>📈 薪資：$${p.salary}｜📉 支出：$${p.expense}</div>
      <div>🏠 房地產：${(p.properties || []).map(x => `${x.name}（$${x.value} / 租金 $${x.rent}）`).join(", ") || "無"}</div>
      <div>📊 股票：${(p.stocks || []).map(x => `${x.name} × ${x.amount}（$${x.price}）`).join(", ") || "無"}</div>
      <div>💼 企業：${(p.businesses || []).map(x => `${x.name}（收益 $${x.income}）`).join(", ") || "無"}</div>
    </div>
    `).join("<hr>");
  }

  function rollDice() {
    socket.emit("rollDice");
    return Math.floor(Math.random() * 6) + 1;
  }


  function log(msg) {
    const logBox = document.getElementById("log");
    logBox.innerHTML += `<div>${msg}</div>`;
    logBox.scrollTop = logBox.scrollHeight;
  }



// 拖曳控制
let isDragging = false;
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    cameraOffset.x += e.clientX - dragStart.x;
    cameraOffset.y += e.clientY - dragStart.y;
    dragStart = { x: e.clientX, y: e.clientY };
    //drawMap();
    generateBoard()
  }
});
canvas.addEventListener('mouseup', () => isDragging = false);