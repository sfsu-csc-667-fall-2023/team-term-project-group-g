const gamesBoardContainer = document.querySelector('#gamesboard-container')
const optionContainer = document.querySelector('.option-container')
const flipButton = document.querySelector('#flip-button')
const startButton = document.querySelector('#start-button')
const infoDisplay = document.querySelector('#info')
const turnDisplay = document.querySelector('#turn-display')

// option choosing
let angle = 0
function flip () {
const optionShips = Array.from(optionContainer.children)
    angle = angle === 0 ? 90 : 0
    optionShips.forEach(optionShip => optionShip.style.transform = `rotate(${angle}deg)`)
}
flipButton.addEventListener('click', flip)

//Creating Boards
const width = 10

function createBoard(color, user) {
    const gameBoardContainer = document.createElement('div')
    gameBoardContainer.classList.add('game-board')
    gameBoardContainer.style.backgroundColor = color
    gameBoardContainer.id = user

    for (let i = 0; i < width * width; i++) {
        const block = document.createElement('div')
        block.classList.add('block')
        block.id = i
        gameBoardContainer.append(block)
    }
    gamesBoardContainer.append(gameBoardContainer)
}
createBoard('yellow', 'player' )
createBoard('pink', 'computer')

// Creating Ships
class Ship {
    constructor(name, length) {
        this.name = name
        this.length = length
    }
}

const destroyer = new Ship('destroyer', 2)
const submarine = new Ship('submarine', 3)
const cruiser = new Ship('cruiser', 3)
const battleship = new Ship('battleship', 4)
const carrier = new Ship('carrier', 5)

const ships = [destroyer, submarine, cruiser, battleship, carrier]
let notDropped

function handleValidity(allBoardBlocks, isHorizontal, startIndex, ship) {
    let validStart = isHorizontal ? startIndex <= width * width - ship.length ? startIndex :
    width * width - ship.length :
    // handle vertical
    startIndex <= width * width - width * ship.length ? startIndex :
        startIndex - ship.length * width + width

let shipBlocks = []

for (let i = 0; i < ship.length; i++) {
    if (isHorizontal) {
        shipBlocks.push(allBoardBlocks[Number(validStart) + i])
    } else {
        shipBlocks.push(allBoardBlocks[Number(validStart) + i * width])
    }
}

let valid
if (isHorizontal) {
    shipBlocks.every((_shipBlock, index) =>
        valid = shipBlocks[0].id % width !== width - (shipBlocks.length - (index + 1)))
} else {
    shipBlocks.every((_shipBlock, index) =>
       valid = shipBlocks[0].id < 90 + (width * index +1)
    )
}

const notTaken = shipBlocks.every(shipBlocks => !shipBlock.classList.contains('taken'))

return ( shipBlocks, valid, notTaken)

}

function addShipPiece(user, ship, startId) {
    const allBoardBlocks = document.querySelectorAll(`#${user} div`)
    let randomBoolean = Math.random() < 0.5
    let isHorizontal = user === 'player' ? angle == 0 : randomBoolean
    let randomStartIndex = Math.floor(Math.random() * width * width)

    let startIndex = startId ? startId : randomStartIndex
    
    const { shipBlocks, valid, notTaken } = getValidity(allBoardBlocks, isHorizontal, startIndex, ship)

    if (valid && notTaken) {
        shipBlocks.forEach(shipBlock => {
            shipBlock.classList.add(ship.name)
            shipBlock.classList.add('taken')
        })
    } else {
        if (user === 'computer') addShipPiece(user, ship, startId)
        if (user === 'player') notDropped = true
    }
}
ships.forEach(ship => addShipPiece('computer', ship))

// drag player ships
let draggedShip
const optionShips = Array.from(optionContainer.children)
optionShips.forEach(optionShip => optionShip.addEventListener('dragstart', dragStart))

const allPlayerBlocks = document.querySelectorAll('#player div')
allPlayerBlocks.forEach(playerBlock => {
    playerBlock.addEventListener('dragover', dragOver)
    playerBlock.addEventListener('drop', dropship)
})

function dragStart(e) {
    notDropped = false
    draggedShip = e.target
}

function dragOver(e) {
    e.preventDefault()
    const ship = ships[draggedShip.id]
    highlightArea(e.target.id, ship)
}

function dropShip(e) {
    const startId = e.target.id
    const ship = ships[draggedShip]
    addShipPiece('player', ship, startId)
    if (!notDropped) {
        draggedShip.remove()
    }
}

// add highlight
function highlightArea(startIndex, ship) {
    const allBoardBlocks = document.querySelectorAll('#player div')
    let isHorizontal = angle === 0

    const { shipBlocks, valid ,notTaken } = getValidity(allBoardBlocks, isHorizontal, startIndex, ship)

    if (valid && notTaken) {
        shipBlocks.forEach(shipBlock => {
            shipBlock.classList.add('hover')
            setTimeout(() => shipBlock.classList.remove('hover'), 500)
        })
    }
}

let gameOver = false
let playerTurn

// Start Game
function startGame() {
    if (playerTurn === undefined) {
        if(optionContainer.children.length != 0 ) {
            infoDisplay.textContent = 'Please place all you pieces first!'
        } else {
            const allBoardBlocks = document.querySelectorAll('#computer div')
            allBoardBlocks.forEach(block => block.addEventListener('click', handleClick))
            playerTurn = true
            turnDisplay.textContent = 'Your turn!'
            infoDisplay.textContent = 'The game has started'
        }
    }

}
startButton.addEventListener('click', startGame)

let playerHits = []
let computerHits = []
let playerSunkShips = []
let computerSunkShips = []

function handleClick(e) {
    if (!gameOver) {
        if (e.target.classList.contains('taken')) {
            e.target.classList.add('boom')
            infoDisplay.textContent = 'You hit this computers ship!'
            let classes = Array.from(e.target.classList)
            classes = classes.filter(className => className !== 'block')
            classes = classes.filter(className => className !== 'boom')
            classes = classes.filter(className => className !== 'taken')
            playerHits.push(...classes)
            checkScore('player', playerHits, playSunkShips)
        }
        if(!e.target.classList.contains('taken')) {
            infoDisplay.textContent = 'Nothing hit this time.'
            e.target.classList.add('empty')
        }
        playerTurn = false
        const allBoardBlocks = document.querySelectorAll('#computer div')
        allBoardBlocks.forEach(block => block.replaceWith(block.cloneNode(true)))
        setTimeout(computerGo, 3000)
    }
}


// define the computers go
function computerGo() {
    if (!gameOver) {
        turnDisplay.textContent = 'Computers Go!'
        infoDisplay.textContent = 'The computer is thinking...'

        setTimeout(() => {
            let randomGo = Math.floor(math.random() * width * width)
            const allBoardBlocks = document.querySelectorAll('#player div')

            if (allBoardBlocks[randomGo].classList.contains('taken') && 
                allBoardBlocks[randomGo].classList.contains('boom') 
            ) {
                computerGo()
                return
            } else if (
                allBoardBlocks[randomGo].classList.contains('taken') &&
                !allBoardBlocks[randomGo].classList.contains('boom') 
            ) {
                allBoardBlocks[randomGo].classList.add('boom')
                infoDisplay.textContent = 'The computer hit your ship!'
                let classes = Array.from(allBoardBlocks[randomGo].classList)
                classes = classes.filter(className => className !== 'block')
                classes = classes.filter(className => className !== 'boom')
                classes = classes.filter(className => className !== 'taken')
                computerHits.push(...classes)
                checkScore('computer', computerHits, computerSunkShips)
            } else {
                infoDisplay.textContent = 'Nothing hit this time'
                allBoardBlocks[randomGo].classList.add('empty')
            }
        }, 3000)

        setTimeout(() => {
            playerTurn = true
            turnDisplay.textContent = 'Your turn!'
            infoDisplay.textContent = 'Please take your go.'
            const allBoardBlocks = document.querySelectorAll('#computer div')
            allBoardBlocks.forEach(block => block.addEventListener('click', handleClick))
        }, 6000)
    }
}

function checkScore(user, userHits, userSunkShips) {

    function checkShip(shipName, shipLength) {
        if (
            userHits.filter(storedShipname => storedShipname ===  shipName).length === shipLength
        ) {
            
            if (user === 'player') {
                infoDisplay.textContent = `you sunk the computers's ${shipName}`
                playerHits = userHits.filter(storedShipname => storedShipname !== shipName)
            }
            if (user === 'computer') {
                infoDisplay.textContent = `the computer sunk your ${shipName}`
                computerHitsHits = userHits.filter(storedShipname => storedShipname !== shipName)
            }

            userSunkShips.push(shipName)
        }
    }

    checkShip('destroyer', 2)
    checkShip('submarine', 3)
    checkShip('cruiser', 3)
    checkShip('battleship', 4)
    checkShip('carrier', 5)

    if(playerSunkShips.length === 5) {
    infoDisplay.textContent = 'You sunk all the ships. YOU WIN!'
    gameOver = true
    }
    if(computerSunkShipsSunkShips.length === 5) {
        infoDisplay.textContent = 'All the ships. YOU LOSE!'
        gameOver = true
    }

}