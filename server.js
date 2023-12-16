const express = require("express");
const { pool } = require("./dbConfig");
const path = require("path");
const passport = require("passport");
const socketio = require("socket.io");
const app = express();
const http = require("http");
const server = http.createServer(app);
const io = socketio(server);
const session = require("express-session");
const MemoryStore = require("session-memory-store")(session);
const bcrypt = require("bcrypt");
const PORT = process.env.PORT || 4000;
const initializePassport = require("./passportConfig");
const flash = require("express-flash");


initializePassport(passport);

// Middleware
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Serve static files for Battleship game
app.use(express.static(path.join(__dirname, "views")));

// Game-related variables
let roomCount = 0;
const roomPlayerCount = new Map();
const roomStates = new Map();

io.on("connection", (socket) => {
  let room = findAvailableRoom();
  socket.join(room);
  socket.room = room;

  let playerIndex = roomPlayerCount.get(room) || 0;
  roomPlayerCount.set(room, playerIndex + 1);

  if (!roomStates.has(room)) {
    roomStates.set(room, [
      { connected: false, ready: false },
      { connected: false, ready: false },
    ]);
  }
  let roomState = roomStates.get(room);
  roomState[playerIndex] = { connected: true, ready: false };

  console.log(`Player ${playerIndex} has connected to ${room}`);

  socket.on("disconnect", () => {
    let roomStateOnDisconnect = roomStates.get(socket.room);
    if (roomStateOnDisconnect && roomStateOnDisconnect[playerIndex]) {
      roomStateOnDisconnect[playerIndex].connected = false;
    }
    socket.to(room).emit("player-connection", playerIndex);
  });

  socket.on("player-ready", () => {
    roomState[playerIndex].ready = true;
    socket.to(room).emit("enemy-ready", playerIndex);
  });

  socket.on("check-players", () => {
    socket.emit("check-players", roomState);
  });

  socket.on("chat-content", ({ message, lobbyId }) => {
    io.to(room).emit("chat-content", message);
  });

  socket.on("fire", (id) => {
    socket.to(room).emit("fire", id);
  });

  socket.on("fire-reply", (square) => {
    socket.to(room).emit("fire-reply", square);
  });
});

// Authentication routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  console.log(req.session.flash.error);
  res.render("login");
});

app.get("/singleplayer", (req, res) => {
  res.render("singleplayer");
});

app.get("/multiplayer", (req, res) => {
  res.render("multiplayer");
});

app.get("/users/landingPage", checkNotAuthenticated, (req, res) => {
  console.log(req.isAuthenticated());
  res.render("landingPage", { user: req.user.name });
});

app.get("/users/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.render("error", { error: "Logout failed" });
    }
    res.redirect("http://localhost:4000");
  });
});

app.post("/users/register", async (req, res) => {
  // Your registration logic remains unchanged
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/landingPage",
    failureRedirect: "/users/login",
    failureFlash: true,
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

// Helper function to find an available game room
function findAvailableRoom() {
  for (let [room, count] of roomPlayerCount) {
    if (count < 2) {
      return room;
    }
  }
  let newRoom = `room-${++roomCount}`;
  roomPlayerCount.set(newRoom, 0);
  return newRoom;
}

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
