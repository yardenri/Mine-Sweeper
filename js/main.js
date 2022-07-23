'use strict'

const NORMAL = "😃";
const LOSE = "🤯";
const WIN = "😎";
const EMPTY = "";
const BOMB = '💣';
const FLAG = '🚩';
const LIVE = "❤️"
const SAFE = "🛡️";

var intId_Timer
var gElH1 = document.querySelector('h1')
var gElTimer = document.querySelector('.timer')
var gElLives = document.querySelector('.lives')
var gElSafe = document.querySelector('.safe-click button')
var gElSmile = document.querySelector('.smile')

// The Model

var gBoard;
var gLevel;
var gGame;
var g4points = [];
var g8points = [];
var g12points = [];

function init(size, mines) {
    reset(size, mines)
    gBoard = createBoard();
    renderBoard(gBoard, '.board-container');
    renderTable()
}

function reset(size, mines) {
    clearInterval(intId_Timer)
    gGame = {
        isOn: false,
        isTimerOn: false,
        shownCount: 0,
        markedCount: 0,
        safes: [SAFE, SAFE, SAFE],
        secs: 0,
        gMinesLocations: [],
        lives: [LIVE, LIVE, LIVE],
        isFinish: false,
        isLose: false
    }
    gLevel = {
        SIZE: size,
        MINES: mines
    }

    gElH1.classList.remove("lose", "win")
    gElH1.innerText = "Minesweeper"

    gElLives.innerText = ""
    gGame.lives.forEach(LIVE => { gElLives.innerText += LIVE })

    gElSafe.innerText = ""
    gGame.safes.forEach(SAFE => { gElSafe.innerText += SAFE })

    gElTimer.innerText = `000`
    gElSmile.innerHTML = `<button onclick="init(${size},${mines})">${NORMAL}</button>`
}
//pick a call with !isMine and add bgcolor for 1 sec
function safeClick() {
    if (gGame.isFinish) return
    if (gGame.isLose) return
    if (gGame.safes.length === 0) return

    gGame.safes.pop();

    gElSafe.innerText = ""
    gGame.safes.forEach(SAFE => { gElSafe.innerText += SAFE })

    var emptys = [];
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var cell = gBoard[i][j];
            if (cell.isMine) continue
            if (cell.isShown) continue
            emptys.push({ i: i, j: j });
        }
    }
    //get random location
    var randomIdx = getRandomInt(0, emptys.length - 1);
    var location = emptys[randomIdx];
    console.log('emptys:', emptys)
    console.log('location:', location)
    var elButton = document.querySelector(`.cell${location.i}-${location.j} button`)

    elButton.style.backgroundColor = "lightblue";
    // paint it for 1 sec
    setTimeout(function () {
        elButton.style.backgroundColor = "lightblue";
    }, 1000)

}
function cellClicked(elTd, cellI, cellJ, event) {

    if (gGame.finish) return

    var cell = gBoard[cellI][cellJ]

    if (!gGame.isTimerOn) startTimer()

    if (!gGame.isOn) {
        if (event.button === 0) {
            gGame.isOn = true
            addMines(cellI, cellJ)
            setMinesNegsCount()
        }

    }

    var bombCountNegs = cell.minesAroundCount

    if (event.button === 0) {

        if (!cell.isMarked && !cell.isShown) {
            cell.isShown = true
            if (bombCountNegs !== 0 && !cell.isMine) {

                if (bombCountNegs === 1) {
                    elTd.style.color = "#e76346";
                } else if (bombCountNegs === 2) {
                    elTd.style.color = "#4199d3";
                } else if (bombCountNegs === 3 || bombCountNegs === 4) {
                    elTd.style.color = "#bb41d3";
                }

                elTd.innerText = bombCountNegs;
                gGame.shownCount++

            } else if (cell.isMine) {
                //for each cell.mine in the gBoard elTd.innerText=BOMB
                gGame.lives.pop()
                gElLives.innerText = ""
                gGame.lives.forEach(LIVE => { gElLives.innerText += LIVE })
                elTd.innerText = BOMB
                gGame.shownCount++
                if (gGame.lives.length === 0) {
                    gGame.isLose = true
                    var elSmileButton = document.querySelector('.smile button')
                    elSmileButton.innerText = LOSE
                    console.log('elSmile:', elSmileButton.innerText)
                    showAllBombs(elTd)
                }

            } else if (bombCountNegs === 0) {
                elTd.innerText = EMPTY
                gGame.shownCount++
                var negs = getAllNegs(cellI, cellJ)
                expandShown(negs)
            }
        }
    }
    checkGameOver()
}

function cellRightClick(cellI, cellJ, event) {
    window.oncontextmenu = (e) => {
        e.preventDefault();
    }

    if (gGame.finish) return
    if (!gGame.isTimerOn) startTimer()

    var cell = gBoard[cellI][cellJ]

    if (event.type === "contextmenu") {
        if (cell.isShown) return
        addFlag(cell, cellI, cellJ)
    }
    checkGameOver()
}

function startTimer() {

    gGame.isTimerOn = true

    intId_Timer = setInterval(function () {
        gGame.secs++
        if (gGame.secs < 10) {
            gElTimer.innerText = `00${gGame.secs}`
        } else if (gGame.secs >= 10 && gGame.secs <= 99) {
            gElTimer.innerText = `0${gGame.secs}`
        } else if (gGame.secs >= 100 && gGame.secs < 999) {
            gElTimer.innerText = `${gGame.secs}`
        } else if (gGame.secs === 999) {
            gElTimer.innerText = `999`
            clearInterval(intId_Timer)
        }

        if (gGame.finish) {
            clearInterval(intId_Timer)
        }
    }, 1000);
}

function addMines(cellI, cellJ) {

    for (var i = 0; i < gLevel.MINES; i++) {
        addMine(cellI, cellJ)
    }
}

function addMine(cellI, cellJ) {

    //empty places array
    var emptys = [];
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var cell = gBoard[i][j];
            if (cell.isMine) continue
            if (cellI === i && cellJ === j) continue
            emptys.push({ i: i, j: j });

        }
    }
    var randomIdx = getRandomInt(0, emptys.length - 1);
    var location = emptys[randomIdx];

    gBoard[location.i][location.j].isMine = true;
    gGame.gMinesLocations.push(location)

    if (gBoard[location.i][location.j].isMine && gBoard[location.i][location.j].isMarked) {
        gGame.markedCount++
    }
}

//Run on all the cells and check then set to each sell his Mines Negs Count
function setMinesNegsCount() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = gBoard[i][j]
            cell.minesAroundCount = countNeighbors(i, j)
        }
    }
}

//Return an array of all the negs of curr Cell
function getAllNegs(cellI, cellJ) {
    var negs = [];
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (i === cellI && j === cellJ) continue;
            negs.push({ cell: gBoard[i][j], i: i, j: j })
        }
    }
    return negs;
}

function renderTable() {
    var strHTML = ""
    strHTML +=
        `<table>
          <tr>
              <th>Place</th>
              <th colspan="2">Beginner</th>
              <th colspan="2">Medium</th>
              <th colspan="2">Expert</th>
          </tr>
          <tr>`

    g4points = []
    g8points = []
    g12points = []

    strHTML += `</table>`

    var elPoints = document.querySelector('.points')
    // elPoints.innerHTML = strHTML
}

function checkGameOver() {
    //if all BOMBS is marked and all cells is shown
    var allCells = gLevel.SIZE ** 2

    if (allCells === gGame.markedCount + gGame.shownCount) {
        gElH1.classList.add("win")

        renderElementInnerText("h1", "YOU WON! 🏆")
        renderElementInnerText(".smile button", WIN)

        clearInterval(intId_Timer)
        gGame.isFinish = true;
    }
}

function renderElementInnerText(selector, innerText) {
    var element = document.querySelector(selector)
    element.innerText = innerText
}

function expandShown(negs) {
    for (var i = 0; i < negs.length; i++) {
        var currCell = negs[i].cell;
        var elTdNeg = document.querySelector(`.cell${negs[i].i}-${negs[i].j}`)
        if (currCell.isMarked) continue
        if (currCell.isShown) continue
        currCell.isShown = true
        //if the cell has a number show it
        if (currCell.minesAroundCount !== 0) {
            if (currCell.minesAroundCount === 1) {
                elTdNeg.style.color = "#e76346";
            } else if (currCell.minesAroundCount === 2) {
                elTdNeg.style.color = "#4199d3";
            } else if (currCell.minesAroundCount === 3 || currCell.minesAroundCount === 4) {
                elTdNeg.style.color = "#bb41d3";
            }
            elTdNeg.innerText = currCell.minesAroundCount
            //if the cell is empty expand it
        } else {
            elTdNeg.innerText = EMPTY
            //get all the negs of the cell in an array
            var currNegs = getAllNegs(negs[i].i, negs[i].j)
            //check the current each negs and if it empty check it to
            expandShown(currNegs)
        }
        gGame.shownCount++
    }
}

function showAllBombs(elTd) {
    var mines = gGame.gMinesLocations
    for (var i = 0; i < mines.length; i++) {
        var loc = mines[i];
        // var mineObject = gBoard[loc.i][loc.j]
        var elTdMine = document.querySelector(`.cell${loc.i}-${loc.j}`)
        elTdMine.innerText = BOMB
    }

    elTd.style.backgroundColor = "red";
    gElH1.classList.add("lose")
    gElH1.innerText = 'GAME OVER! 🤯'

    gGame.finish = true
    clearInterval(intId_Timer)
}

function addFlag(cell, cellI, cellJ) {
    var elButton = document.querySelector(`.cell${cellI}-${cellJ} button`)
    cell.isMarked = !cell.isMarked
    elButton.innerText = cell.isMarked ? FLAG : EMPTY

    //Count only mines
    if (cell.isMarked && cell.isMine) {
        gGame.markedCount += 1;
    } else if (!cell.isMarked && cell.isMine) {
        gGame.markedCount -= 1
    }
}