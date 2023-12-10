const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const MAX_PLAYERS = 3;

app.use(express.static(path.join(__dirname, "battleship")));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//handle a socket  connection request from web client

const connection = [null, null]

const lobbies = {};
const LobbyState = {
  WAITING: 'waiting',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed'
};

function createLobby() {
  const lobbyId = 'lobby' + Math.floor(Math.random() * 10000);
  lobbies[lobbyId] = {
      players: [],
      state: LobbyState.WAITING
  };
  return lobbyId;
}

function joinLobby(socket, lobbyId) {
  let lobby = lobbies[lobbyId];

  if (lobby && lobby.state === LobbyState.WAITING) {
      if (!lobby.players.includes(socket.id)) {
          if (lobby.players.length < MAX_PLAYERS) {
              lobby.players.push(socket.id);
              socket.join(lobbyId);

              if (lobby.players.length === MAX_PLAYERS) {
                  lobby.state = LobbyState.IN_PROGRESS;
              }

              // Notify all players in the lobby about the new connection
              io.to(lobbyId).emit('player-connection-update', {
                  playerId: socket.id,
                  connected: true
              });

              return { success: true };
          } else {
              return { success: false, message: "Lobby is full" };
          }
      } else {
          return { success: false, message: "Already in the lobby" };
      }
  } else {
      return { success: false, message: "Lobby does not exist or is not in a joinable state" };
  }
}

// function updateLobbyState(lobbyId, newState) {
//   if (lobbies[lobbyId]) {
//       lobbies[lobbyId].state = newState;
//   }
// }

io.on('connection', socket => {
  console.log('New WS Connection, Socket ID:', socket.id);
    //console.log('New WS Connection')

    // Handle lobby creation
    socket.on('create-lobby', () => {
      const lobbyId = createLobby();
      socket.emit('lobby-created', lobbyId);
  });

  // Handle joining a lobby
  socket.on('join-lobby', (lobbyId) => {
    const result = joinLobby(socket, lobbyId);
    if (result.success) {
        socket.emit('lobby-joined', lobbyId);
        io.to(lobbyId).emit('update-lobby', lobbies[lobbyId]);
    } else {
        socket.emit('lobby-error', result.message);
    }
});

// find an avaliable player number
let playerIndex =  -1;
for (const i in connection) {
    if (connection[i] === null){
        playerIndex = i
        break
    }
}

// tell the connection client what player number they are
socket.emit('player-number', playerIndex)

console.log(`player ${playerIndex} has connected`)

// // ignore player 3
if (playerIndex === -1) return

connection[playerIndex] = false

// // Tell eveyone what player number just connected
socket.broadcast.emit('player-connection', playerIndex)

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Socket Disconnected, Socket ID:', socket.id);
      // Find the lobby the player was in and remove the player
      for (let lobbyId in lobbies) {
          let index = lobbies[lobbyId].players.indexOf(socket.id);
          if (index !== -1) {
              lobbies[lobbyId].players.splice(index, 1);

              // Notify remaining players about the disconnection
              io.to(lobbyId).emit('player-connection-update', {
                  playerId: socket.id,
                  connected: false
              });
              break;
          }
      }
  });

  // On Ready
socket.on('player-ready', () => {
    socket.broadcast.emit('enemy-ready', playerIndex)
    connection[playerIndex] = true
})

  // Check player connections
socket.on('check-players', () => {
    const players = []
    for (const i in connection) {
        connection[i] === null ? players.push({connected: false, ready: false}) :
        players.push({connected: true, ready: connection[i]})
    }
    socket.emit('check-players', players)
})

// On Fire Received
socket.on('fire', id => {
    console.log(`Shot fired from ${playerIndex}`, id)

    // Emit the move to the other player
    socket.broadcast.emit('fire', id)
})

  // on Fire Reply
socket.on('fire-reply', square => {
    console.log(square)

    // Forward the reply to the other player
    socket.broadcast.emit('fire-reply', square)
})

// // Timeout connection
// setTimeout(() => {
//     connection[playerIndex] = null
//     socket.emit('timeout')
//     socket.disconnect()
//   }, 600000) // 10 minute limit per player
})