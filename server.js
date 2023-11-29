const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const PORT = process.env.PORT || 3000;
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "battleship")));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//handle a socket  connection request from web client

const connection = [null, null]

io.on('connection', socket => {
    //console.log('New WS Connection')

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

  // Handle Diconnect
socket.on('disconnect', () => {
    console.log(`Player ${playerIndex} disconnected`)
    connection[playerIndex] = null
    //Tell everyone what player numbe just disconnected
    socket.broadcast.emit('player-connection', playerIndex)
})

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

socket.on('chat-content', (message) => {
  io.emit('chat-content', message);
});

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

// Timeout connection
setTimeout(() => {
    connection[playerIndex] = null
    socket.emit('timeout')
    socket.disconnect()
  }, 600000) // 10 minute limit per player
})