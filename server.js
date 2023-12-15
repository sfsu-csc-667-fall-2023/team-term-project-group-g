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

let roomCount = 0;
const roomPlayerCount = new Map(); // Maps room IDs to the number of players in the room
const roomStates = new Map(); // Maps room IDs to the states of players in the room

io.on('connection', socket => {
    let room = findAvailableRoom();
    socket.join(room);
    socket.room = room;

    let playerIndex = roomPlayerCount.get(room) || 0;
    roomPlayerCount.set(room, playerIndex + 1);

    if (!roomStates.has(room)) {
        roomStates.set(room, [{ connected: false, ready: false }, { connected: false, ready: false }]);
    }
    let roomState = roomStates.get(room);
    roomState[playerIndex] = { connected: true, ready: false };

    console.log(`Player ${playerIndex} has connected to ${room}`);

    socket.on('disconnect', () => {
        let roomStateOnDisconnect = roomStates.get(socket.room);
        if (roomStateOnDisconnect && roomStateOnDisconnect[playerIndex]) {
            roomStateOnDisconnect[playerIndex].connected = false;
        }
        socket.to(room).emit('player-connection', playerIndex);
    });

    socket.on('player-ready', () => {
        roomState[playerIndex].ready = true;
        socket.to(room).emit('enemy-ready', playerIndex);
    });

    socket.on('check-players', () => {
        socket.emit('check-players', roomState);
    });

    socket.on('chat-content', ({ message, lobbyId }) => {
        io.to(room).emit('chat-content', message);
    });

    socket.on('fire', id => {
        socket.to(room).emit('fire', id);
    });

    socket.on('fire-reply', square => {
        socket.to(room).emit('fire-reply', square);
    });
});

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
