const express = require('express');
const { pool } = require("./dbConfig");
const path = require('path');
const passport = require('passport');
const socketio = require('socket.io');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = socketio(server);
const session = require('express-session');
const MemoryStore = require('session-memory-store')(session);
const bcrypt = require("bcrypt");
const PORT = process.env.PORT || 4000;
const initializePassport = require("./passportConfig");
const flash = require('express-flash');


initializePassport(passport);

const sessionMiddleware = session({
  store: new MemoryStore(),
  secret: 'Alphabet',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
});

app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname,'views')));


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);
// Funtion inside passport which initializes passport
app.use(passport.initialize());
// Store our variables to be persisted across the whole session. Works with app.use(Session) above
app.use(passport.session());
app.use(flash());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/singleplayer", (req, res) => {
  res.render("singleplayer");
});

app.get("/multiplayer", (req, res) => {
  res.render("multiplayer");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  console.log(req.session.flash.error);
  res.render("login");
});

app.get("/users/landingPage", checkNotAuthenticated, (req, res) => {
  console.log(req.isAuthenticated());
  res.render("landingPage", { user: req.user.name });
});

app.get("/users/logout", (req, res) => {
  req.logout();
  res.render("index", { message: "You have logged out successfully" });
});

app.post("/users/register", async (req, res) => {
  let { name, email, password, password2 } = req.body;

  let errors = [];

  console.log({
    name,
    email,
    password,
    password2
  });

  if (!name || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("register", { errors, name, email, password, password2 });
  } else {
    hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    // Validation passed
    pool.query(
      `SELECT * FROM users
        WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          return res.render("register", {
            message: "Email already registered"
          });
        } else {
          pool.query(
            `INSERT INTO users (name, email, password)
                VALUES ($1, $2, $3)
                RETURNING id, password`,
            [name, email, hashedPassword],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/users/login");
            }
          );
        }
      }
    );
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/landingPage",
    failureRedirect: "/users/login",
    failureFlash: true
  })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/landingPage");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use(sessionMiddleware);


// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const lobbies = {};
let nextLobbyId = 1; // Start with lobby ID 1

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

io.on('connection', (socket) => {
  let playerIndex = null;
  const session = socket.request.session;
  const lobbyId = session ? session.lobbyId : null;

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
    const playerIndex = lobbies[lobbyId].indexOf(null);

    if (playerIndex !== -1) {
      lobbies[lobbyId][playerIndex] = socket;
      socket.join(lobbyId);

      socket.emit('player-info', { playerIndex, lobbyId });
      io.to(lobbyId).emit('player-connection', { playerIndex, lobbyId });

      console.log(`Player ${playerIndex} reconnected to lobby ${lobbyId}`);
    } else {
      socket.request.session.lobbyId = null;
      socket.request.session.save();

      socket.emit('lobby-full');
    }
  }

  socket.on('create-lobby', () => {
    const lobbyId = nextLobbyId++;
    lobbies[lobbyId] = [null, null]; // Initially, no players in the lobby
    socket.join(lobbyId);

    // Save the lobby ID to the session
    socket.request.session.lobbyId = lobbyId;
    socket.request.session.save();

    socket.emit('created-lobby', { playerIndex: 0, lobbyId });
    io.emit('lobbies-list', getLobbiesList());
  });

  socket.on('join-lobby', (selectedLobbyId) => {
    if (lobbies[selectedLobbyId]) {
      const playerIndex = lobbies[selectedLobbyId].indexOf(null);
  
      if (playerIndex !== -1) {
        lobbies[selectedLobbyId][playerIndex] = socket;
        socket.join(selectedLobbyId);
  
        // Save the lobby ID to the session
        socket.request.session.lobbyId = selectedLobbyId;
        socket.request.session.save();
  
        socket.emit('player-info', { playerIndex, lobbyId: selectedLobbyId });
        io.to(selectedLobbyId).emit('player-connection', { playerIndex, lobbyId: selectedLobbyId });
  
        console.log(`Player ${playerIndex} joined lobby ${selectedLobbyId}`);
        
        // Emit the updated lobbies list to all clients
        io.emit('lobbies-list', getLobbiesList());
      } else {
        // Lobby is full or in an invalid state, clear the session data
        socket.request.session.lobbyId = null;
        socket.request.session.save();
  
        socket.emit('lobby-full');
      }
    }
  });
  
  io.to(lobbyId).emit('player-connection', { playerIndex, lobbyId });

  // Handle the request for the list of existing lobbies
  socket.on('request-lobbies', () => {
    const lobbiesList = getLobbiesList();
    socket.emit('lobbies-list', lobbiesList);
  });

  // Handle the 'Create Lobby' event
  socket.on('create-lobby', () => {
    const lobbyId = nextLobbyId++;
    lobbies[lobbyId] = [null, null]; // Assuming the creator joins as the first player
    socket.join(lobbyId);

    socket.emit('created-lobby', { playerIndex: 0, lobbyId });
    io.emit('lobbies-list', getLobbiesList());
  });

  socket.on('disconnect', () => {
    // ... existing disconnect logic
    if (playerIndex !== null && lobbies[lobbyId][playerIndex] !== null) {
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

  socket.on('chat-content', (message) => {
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
      const playersCount = lobbies[lobbyId].filter((player) => player !== null).length;
      const maxPlayers = 2; // Change this based on your game's max players
      return { id: lobbyId, players: playersCount, maxPlayers };
    });
  }

  setTimeout(() => {
    if (lobbies[lobbyId][playerIndex] !== null) {
      console.log(`Player ${playerIndex} in lobby ${lobbyId} timed out`);
      lobbies[lobbyId][playerIndex] = null;
      socket.emit('timeout');
      socket.disconnect();
    }
  }, 600000);

  socket.join(lobbyId);
});
