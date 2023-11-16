const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const PORT = process.env.PORT || 3000;

const app = express();
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

    // ignore player 3
    if (playerIndex === -1) return
})