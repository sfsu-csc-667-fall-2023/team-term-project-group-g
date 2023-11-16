const gamesBoardContainer = document.querySelector('#gamesboard-container');
const optionContainer = document.querySelector('.option-container');
const flipButton = document.querySelector('#flip-button');
const startButton = document.querySelector('#start-button');
const infoDisplay = document.querySelector('#info');
const turnDisplay = document.querySelector('#turn-display');
const singlePlayerButton = document.querySelector('#singlePlayerButton')
const multiPlayerButton = document.querySelector('#multiPlayerButton')

let gameMode = "";
let playerNum = 0;
let ready = false;
let enemyReady = false;
let allShipPlaced = false;
let shotFired = -1

// select player mode
singlePlayerButton.addEventListener('click', startSinglePlayer)
multiPlayerButton.addEventListener('click', startMultiPlayer)


// multiplayer
    function startMultiPlayer() {
        gameMode = 'multiplayer'
        
    const socket = io();

    // get your number
    socket.on('player-number', num => {
        if (num === -1 ) {
            infoDisplay.innerHTML = "Sorry, the server is full"
        } else {
            playerNum = parseInt(num)
            if(playerNum === 1) currentPlayer = "enemy"
        }
    })
    }

// single player
function startSinglePlayer() {
    gameMode = "singlePlayer"

    startButton.addEventListener('click', playGameSingle);
}

let angle = 0;
function flip() {
    const optionShips = Array.from(optionContainer.children);
    angle = angle === 0 ? 90 : 0;
    optionShips.forEach(optionShip => optionShip.style.transform = `rotate(${angle}deg)`);
}
flipButton.addEventListener('click', flip);

const width = 10;
function createBoard(color, user) {
    const gameBoardContainer = document.createElement('div');
    gameBoardContainer.classList.add('game-board');
    gameBoardContainer.style.backgroundColor = color;
    gameBoardContainer.id = user;

    for (let i = 0; i < width * width; i++) {
        const block = document.createElement('div');
        block.classList.add('block');
        block.id = `${user}-${i}`;
        gameBoardContainer.append(block);
    }
    gamesBoardContainer.append(gameBoardContainer);
}
createBoard('yellow', 'player'); 
createBoard('pink', 'computer');

class Ship {
    constructor(name, length) {
        this.name = name;
        this.length = length;
    }
}

const ships = [
    new Ship('destroyer', 2),
    new Ship('submarine', 3),
    new Ship('cruiser', 3),
    new Ship('battleship', 4),
    new Ship('carrier', 5)
];

let notDropped;

function getValidity(allBoardBlocks, isHorizontal, startIndex, ship) {
    let shipBlocks = [];
    
    // Check if ship placement goes beyond the board's right edge
    if (isHorizontal) {
        let row = Math.floor(startIndex / width);
        if (startIndex % width + ship.length > width) {
            return { valid: false };
        }
    }

    for (let i = 0; i < ship.length; i++) {
        let index = isHorizontal ? startIndex + i : startIndex + i * width;
        if (index >= allBoardBlocks.length || allBoardBlocks[index].classList.contains('taken')) {
            return { valid: false };
        }
        shipBlocks.push(allBoardBlocks[index]);
    }
    return { shipBlocks, valid: true, notTaken: true };
}


function addShipPiece(user, ship, startId = null) {
    const allBoardBlocks = document.querySelectorAll(`#${user} .block`);
    let isHorizontal = user === 'player' ? angle === 0 : Math.random() < 0.5;
    let randomStartIndex = Math.floor(Math.random() * width * width);

    let startIndex = startId !== null ? startId : randomStartIndex;
    
    const { shipBlocks, valid, notTaken } = getValidity(allBoardBlocks, isHorizontal, startIndex, ship);

    if (valid && notTaken) {
        shipBlocks.forEach(shipBlock => {
            shipBlock.classList.add(ship.name);
            shipBlock.classList.add('taken');
        });
    } else {
        if (user === 'computer') addShipPiece(user, ship);
        if (user === 'player') notDropped = true;
    }
}

// Initialize computer ships
ships.forEach(ship => addShipPiece('computer', ship));

let draggedShip;
const optionShips = Array.from(optionContainer.children);
optionShips.forEach(optionShip => optionShip.addEventListener('dragstart', dragStart));

const allPlayerBlocks = document.querySelectorAll('#player .block');
allPlayerBlocks.forEach(playerBlock => {
    playerBlock.addEventListener('dragover', dragOver);
    playerBlock.addEventListener('drop', dropShip);
});

function dragStart(e) {
    notDropped = false;
    draggedShip = e.target;
}

function dragOver(e) {
    e.preventDefault();
}

function dropShip(e) {
    const startId = parseInt(e.target.id.split('-')[1]);
    const ship = ships[parseInt(draggedShip.id)];
    addShipPiece('player', ship, startId);
    if (!notDropped) {
        draggedShip.remove();
    }
}

// Start Game
function startGame() {
    if (optionContainer.children.length !== 0) {
        infoDisplay.textContent = 'Please place all your pieces first!';
        return;
    }
    const allBoardBlocks = document.querySelectorAll('#computer .block');
    allBoardBlocks.forEach(block => block.addEventListener('click', handleClick));
    playerTurn = true;
    turnDisplay.textContent = 'Your turn!';
    infoDisplay.textContent = 'The game has started';
}
startButton.addEventListener('click', startGame);

let gameOver = false;
let playerTurn;
let playerHits = [];
let computerHits = [];
let playerSunkShips = [];
let computerSunkShips = [];

function handleClick(e) {
    if (!gameOver && playerTurn) {
        const allBoardBlocks = document.querySelectorAll('#computer .block'); // Define it here

        if (e.target.classList.contains('taken')) {
            e.target.classList.add('boom');
            infoDisplay.textContent = 'You hit the computer\'s ship!';
            processHit(e.target, 'player');
        } else {
            infoDisplay.textContent = 'Nothing hit this time.';
            e.target.classList.add('empty');
        }
        playerTurn = false;
        allBoardBlocks.forEach(block => block.removeEventListener('click', handleClick));
        setTimeout(computerGo, 1000);
    }
}


function computerGo() {
    if (gameOver) return;

    turnDisplay.textContent = 'Computer\'s turn!';
    infoDisplay.textContent = 'The computer is thinking...';

    setTimeout(() => {
        let randomGo;
        let target;
        do {
            randomGo = Math.floor(Math.random() * width * width);
            target = document.querySelector(`#player-${randomGo}`);
        } while (target.classList.contains('boom') || target.classList.contains('empty'));

        if (target.classList.contains('taken')) {
            target.classList.add('boom');
            infoDisplay.textContent = 'The computer hit your ship!';
            processHit(target, 'computer');
        } else {
            infoDisplay.textContent = 'The computer missed!';
            target.classList.add('empty');
        }

        playerTurn = true;
        turnDisplay.textContent = 'Your turn!';
        infoDisplay.textContent = 'Take your shot.';
        const allBoardBlocks = document.querySelectorAll('#computer .block');
        allBoardBlocks.forEach(block => block.addEventListener('click', handleClick));
    }, 1000);
}

function processHit(target, user) {
    let classes = Array.from(target.classList);
    let shipName = classes.find(className => ships.some(ship => ship.name === className));
    let hitsArray = user === 'player' ? playerHits : computerHits;
    let sunkShipsArray = user === 'player' ? playerSunkShips : computerSunkShips;

    hitsArray.push(shipName);
    checkShipSunk(shipName, hitsArray, sunkShipsArray);
}

function checkShipSunk(shipName, hitsArray, sunkShipsArray) {
    let ship = ships.find(s => s.name === shipName);
    if (hitsArray.filter(name => name === shipName).length === ship.length) {
        infoDisplay.textContent += ` You sunk the ${shipName}!`;
        sunkShipsArray.push(shipName);
        checkGameOver();
    }
}

function checkGameOver() {
    if (playerSunkShips.length === ships.length) {
        infoDisplay.textContent = 'You win! All enemy ships have been sunk!';
        gameOver = true;
    } else if (computerSunkShips.length === ships.length) {
        infoDisplay.textContent = 'You lose! All your ships have been sunk!';
        gameOver = true;
    }
}
