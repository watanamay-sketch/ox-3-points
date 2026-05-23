const boardEl = document.querySelector("#board");
const messageEl = document.querySelector("#message");
const resetButton = document.querySelector("#resetButton");
const clearStatsButton = document.querySelector("#clearStatsButton");
const modeButtons = [...document.querySelectorAll(".mode-button")];
const rulesTextEl = document.querySelector("#rulesText");
const countEls = {
  X: document.querySelector("#xCount"),
  O: document.querySelector("#oCount"),
};
const statEls = {
  games: document.querySelector("#gameCount"),
  X: document.querySelector("#xWins"),
  O: document.querySelector("#oWins"),
};
const playerCards = {
  X: document.querySelector('[data-player="X"]'),
  O: document.querySelector('[data-player="O"]'),
};

const winLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

let board;
let turn;
let queues;
let phase;
let winner;
let selectedIndex;
let winningLine;
let moveMode = "forced";
let requiredMoves;
let stats = { games: 0, X: 0, O: 0 };

function newGame() {
  board = Array(9).fill("");
  turn = "X";
  queues = { X: [], O: [] };
  phase = "place";
  winner = "";
  selectedIndex = null;
  winningLine = [];
  requiredMoves = { X: null, O: null };
  render();
}

function createBoard() {
  boardEl.innerHTML = "";

  for (let index = 0; index < 9; index += 1) {
    const cell = document.createElement("button");
    cell.className = "cell";
    cell.type = "button";
    cell.dataset.index = String(index);
    cell.setAttribute("role", "gridcell");
    cell.addEventListener("click", () => handleCell(index));
    boardEl.append(cell);
  }
}

function handleCell(index) {
  if (winner) return;

  if (phase === "place") {
    placePiece(index);
    return;
  }

  movePiece(index);
}

function placePiece(index) {
  if (board[index] || queues[turn].length >= 3) return;

  board[index] = turn;
  queues[turn].push(index);

  if (finishTurn()) return;

  if (queues.X.length === 3 && queues.O.length === 3) {
    phase = "move";
    prepareRequiredMove(turn === "X" ? "O" : "X");
  }

  switchTurn();
  render();
}

function movePiece(index) {
  const requiredIndex = getRequiredIndex(turn);

  if (index === requiredIndex) {
    selectedIndex = requiredIndex;
    render();
    return;
  }

  if (selectedIndex === null || index === selectedIndex || board[index]) return;

  board[selectedIndex] = "";
  board[index] = turn;
  removeMovedPiece(turn, selectedIndex);
  queues[turn].push(index);
  requiredMoves[turn] = null;
  selectedIndex = null;

  if (finishTurn()) return;

  switchTurn();
  render();
}

function finishTurn() {
  const line = getWinningLine(turn);

  if (!line) return false;

  winner = turn;
  winningLine = line;
  stats.games += 1;
  stats[turn] += 1;
  render();
  return true;
}

function switchTurn() {
  turn = turn === "X" ? "O" : "X";
  selectedIndex = null;
  prepareRequiredMove(turn);
}

function getWinningLine(player) {
  return winLines.find((line) => line.every((index) => board[index] === player));
}

function getRequiredIndex(player) {
  if (phase !== "move") return null;

  if (moveMode === "forced") return queues[player][0];

  if (!queues[player].includes(requiredMoves[player])) {
    prepareRequiredMove(player);
  }

  return requiredMoves[player];
}

function prepareRequiredMove(player) {
  if (phase !== "move") return;

  if (moveMode === "forced") {
    requiredMoves[player] = queues[player][0];
    return;
  }

  const pieces = queues[player];
  requiredMoves[player] = pieces[Math.floor(Math.random() * pieces.length)];
}

function removeMovedPiece(player, index) {
  const pieceIndex = queues[player].indexOf(index);

  if (pieceIndex >= 0) {
    queues[player].splice(pieceIndex, 1);
  }
}

function setMoveMode(nextMode) {
  moveMode = nextMode;
  modeButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.mode === moveMode);
  });
  newGame();
}

function clearStats() {
  stats = { games: 0, X: 0, O: 0 };
  render();
}

function render() {
  const cells = [...boardEl.children];
  const requiredIndex = phase === "move" && !winner ? getRequiredIndex(turn) : null;

  cells.forEach((cell, index) => {
    const value = board[index];
    cell.textContent = value;
    cell.dataset.value = value;
    cell.classList.toggle("is-next", index === requiredIndex);
    cell.classList.toggle("is-target", selectedIndex !== null && !value);
    cell.classList.toggle("is-win", winningLine.includes(index));
    cell.disabled = Boolean(winner);

    const cellName = value ? `ช่อง ${index + 1} มี ${value}` : `ช่อง ${index + 1} ว่าง`;
    cell.setAttribute("aria-label", cellName);
  });

  countEls.X.textContent = `${queues.X.length}/3`;
  countEls.O.textContent = `${queues.O.length}/3`;
  statEls.games.textContent = stats.games;
  statEls.X.textContent = stats.X;
  statEls.O.textContent = stats.O;
  playerCards.X.classList.toggle("is-active", turn === "X" && !winner);
  playerCards.O.classList.toggle("is-active", turn === "O" && !winner);
  messageEl.textContent = getMessage(requiredIndex);
  rulesTextEl.textContent = getRulesText();
}

function getMessage(requiredIndex) {
  if (winner) return `ผู้เล่น ${winner} ชนะ!`;

  if (phase === "place") {
    return `ตา ${turn}: วางหมากช่องว่าง`;
  }

  if (selectedIndex === null) {
    return `ตา ${turn}: แตะตัวที่ไฮไลต์ แล้วเลือกช่องว่าง`;
  }

  return `ตา ${turn}: ย้ายจากช่อง ${requiredIndex + 1} ไปช่องว่าง`;
}

function getRulesText() {
  if (moveMode === "random") {
    return "วางได้คนละ 3 จุดเท่านั้น จากนั้นระบบจะสุ่มตัวหมากของตานั้นให้ย้ายไปช่องว่าง ใครเรียงครบ 3 ก่อนชนะ";
  }

  return "วางได้คนละ 3 จุดเท่านั้น จากนั้นแต่ละตาต้องย้ายตัวที่วางเก่าสุดของฝั่งตัวเองไปช่องว่าง ใครเรียงครบ 3 ก่อนชนะ";
}

resetButton.addEventListener("click", newGame);
clearStatsButton.addEventListener("click", clearStats);
modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMoveMode(button.dataset.mode));
});
createBoard();
newGame();
