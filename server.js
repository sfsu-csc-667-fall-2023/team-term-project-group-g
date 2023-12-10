const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const PORT = process.env.PORT || 3000;
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = socketio(server);
const session = require('express-session');
const MemoryStore = require('session-memory-store')(session);

const sessionMiddleware = session({
  store: new MemoryStore(),
  secret: 'Alphabet',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
});

app.use(sessionMiddleware);

app.use(express.static('public'));

app.use(express.static(path.join(__dirname, 'battleship')));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

let lobbies = {};
let nextLobbyId = 1; // Start with lobby ID 1

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

io.on('connection', (socket) => {
  let playerIndex = null;
  const session = socket.request.session;
  lobbyId = session ? session.lobbyId : null;

  if (session && lobbyId && lobbies[lobbyId]) {
    const existingPlayerIndex = lobbies[lobbyId].findIndex((s) => s.request.sessionID === socket.request.sessionID);

    if (existingPlayerIndex !== -1) {
      // Player is already in the lobby, ignore the connection
      console.log(`Player ${existingPlayerIndex} reconnected to lobby ${lobbyId}`);
      playerIndex = existingPlayerIndex;
    } else {
      // The player was not in the lobby, clear the session data
      session.lobbyId = null;
      session.save();
    }
  }

  if (lobbyId && lobbies[lobbyId]) {
    playerIndex = lobbies[lobbyId].indexOf(null);

    if (playerIndex !== -1) {
      lobbies[lobbyId][playerIndex] = socket;
      socket.join(lobbyId);

      socket.emit('player-info', { playerIndex, lobbyId });
      io.to(lobbyId).emit('player-connection', { playerIndex, lobbyId });

      console.log(`Player ${playerIndex} reconnected to lobby ${lobbyId}`);
    } else {
      socket.request.session.lobbyId = null;
      socket.request.session.save();
    }
  }

  socket.on('create-lobby', () => {
    lobbyId = nextLobbyId++;
    lobbies[lobbyId] = {
      players: [null, null], // Initially, no players in the lobby
      currentPlayer: 0, // Set the initial current player for the lobby
    };
    socket.join(lobbyId);
  
    // Save the lobby ID to the session
    socket.request.session.lobbyId = lobbyId;
    socket.request.session.save();
  
    socket.emit('created-lobby', { playerIndex: 0, lobbyId });
    io.emit('lobbies-list', getLobbiesList());
  });

  socket.on('join-lobby', (selectedLobbyId) => {
    if (lobbies[selectedLobbyId]) {
      playerIndex = lobbies[selectedLobbyId].players.indexOf(null);
      lobbies[selectedLobbyId].currentPlayer = playerIndex;
  
      if (playerIndex !== -1) {
        // Update the playerRole based on the playerIndex
        const playerRole = playerIndex === 0 ? 'user' : 'enemy';

        lobbies[selectedLobbyId].players[playerIndex] = socket;
        socket.join(selectedLobbyId);
  
        // Save the lobby ID to the session
        socket.request.session.lobbyId = selectedLobbyId;
        socket.request.session.playerRole = playerRole;
        socket.request.session.save();
  
        socket.emit('player-info', { playerIndex, lobbyId: selectedLobbyId, playerRole });
        io.to(selectedLobbyId).emit('player-connection', { playerIndex, lobbyId: selectedLobbyId });
  
        
      console.log(`Player ${parseInt(playerIndex)+1} joined lobby ${selectedLobbyId} as ${playerRole}`);
        
        // Emit the updated lobbies list to all clients
        io.emit('lobbies-list', getLobbiesList());
      } else {
        // Lobby is full or in an invalid state, clear the session data
        socket.request.session.lobbyId = null;
        socket.request.session.playerRole = null;
        socket.request.session.save();
  
        socket.emit('lobby-full');
      }
    }
  });
  
  io.to(lobbyId).emit('player-connection', { playerIndex, lobbyId });

  // Handle the request for the list of existing lobbies
  socket.on('request-lobbies', () => {
    lobbiesList = getLobbiesList();
    socket.emit('lobbies-list', lobbiesList);
  });

  socket.on('disconnect', () => {
    if (lobbyId && lobbies[lobbyId] && playerIndex !== null && lobbies[lobbyId][playerIndex] !== null) {
      console.log(`Player ${playerIndex} in lobby ${lobbyId} disconnected`);
      lobbies[lobbyId][playerIndex] = null;
      socket.broadcast.emit('player-connection', { playerIndex, lobbyId });
    }
  });
  
  io.to(lobbyId).emit('player-connection', { playerIndex, lobbyId });

  socket.on('player-connection', ({ playerIndex, lobbyId }) => {
    io.to(lobbyId).emit('player-connection', { playerIndex, lobbyId });
  });

  socket.on('player-ready', () => {
    socket.to(lobbyId).emit('enemy-ready', playerIndex);
    lobbies[lobbyId][playerIndex] = true;

    // Check if both players are ready
    if (lobbies[lobbyId][0] && lobbies[lobbyId][1]) {
      io.to(lobbyId).emit('start-game');
    }
  });

  socket.on('check-players', () => {
    const players = [];
    for (let i = 0; i < lobbies[lobbyId].length; i++) {
      lobbies[lobbyId][i] === null
        ? players.push({ connected: false, ready: false })
        : players.push({ connected: true, ready: lobbies[lobbyId][i] });
    }
    socket.emit('check-players', players);
  });

  socket.on('chat-content', ({ message, lobbyId }) => {
    io.to(lobbyId).emit('chat-content', message);
  });

  socket.on('fire', (id) => {
    console.log(`Shot fired from player ${playerIndex} in lobby ${lobbyId}`, id);
    socket.to(lobbyId).emit('fire', id);
  });

  socket.on('fire-reply', (square) => {
    console.log(square);
    socket.to(lobbyId).emit('fire-reply', square);
  });
  
  function getLobbiesList() {
    return Object.keys(lobbies).map((lobbyId) => {
      const lobby = lobbies[lobbyId];
  
      if (!lobby || !Array.isArray(lobby.players)) {
        console.error(`Invalid lobby structure for lobby ${lobbyId}: ${JSON.stringify(lobby)}`);
        return null; // or handle the error in an appropriate way
      }
  
      const playersCount = lobby.players.filter((player) => player !== null).length;
      const maxPlayers = 2; // Change this based on your game's max players
  
      return { id: lobbyId, players: playersCount, maxPlayers };
    }).filter(lobby => lobby !== null);
  }

  setTimeout(() => {
    if (lobbies[lobbyId][playerIndex]) {
      console.log(`Player ${playerIndex} in lobby ${lobbyId} timed out`);
      lobbies[lobbyId][playerIndex] = null;
      socket.emit('timeout');
      socket.disconnect();
    }
  }, 600000);

  socket.join(lobbyId);
});