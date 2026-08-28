"use strict";

/* =========================================================
   GALAXY AI
   Created by Harshavardhan
   Main Application + Gaming Center
   ========================================================= */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

const GALAXY_LEVELS = [
  { name: "Casual", elo: 100 },
  { name: "Normal", elo: 200 },
  { name: "Fun", elo: 500 },
  { name: "Master", elo: 800 },
  { name: "GM", elo: 1000 },
  { name: "Player", elo: 1200 }
];

const App = {
  currentView: "chat",
  generating: false,
  controller: null,
  messages: [],
  attachments: [],
  searchEnabled: false
};

const Games = {
  current: null,

  chess: {
    mode: "galaxy",
    elo: 500,
    board: [],
    turn: "w",
    selected: null,
    legal: [],
    history: [],
    snapshots: [],
    finished: false,
    winner: null,
    hints: 0,
    reviewOpen: false
  },

  ttt: {
    mode: "galaxy",
    elo: 500,
    board: Array(9).fill(""),
    turn: "X",
    history: [],
    finished: false,
    winner: null,
    hints: 0,
    reviewOpen: false
  },

  connect: {
    mode: "galaxy",
    elo: 500,
    board: Array.from({ length: 6 }, () => Array(7).fill("")),
    turn: "P",
    history: [],
    finished: false,
    winner: null,
    hints: 0,
    reviewOpen: false
  },

  memory: {
    mode: "galaxy",
    elo: 500,
    cards: [],
    revealed: [],
    matched: new Set(),
    turn: "player",
    playerScore: 0,
    opponentScore: 0,
    history: [],
    known: {},
    busy: false,
    finished: false,
    hints: 0,
    reviewOpen: false,
    playerAttempts: 0,
    playerMatches: 0
  },

  shooter: {
    mode: "galaxy",
    elo: 500,
    running: false,
    finished: false,
    time: 30,
    playerScore: 0,
    opponentScore: 0,
    shots: 0,
    hits: 0,
    misses: 0,
    streak: 0,
    bestStreak: 0,
    target: null,
    timer: null,
    galaxyTimer: null,
    friendTurn: 1,
    friendScores: [0, 0],
    friendStats: [
      { shots: 0, hits: 0, misses: 0, bestStreak: 0 },
      { shots: 0, hits: 0, misses: 0, bestStreak: 0 }
    ],
    reviewOpen: false
  }
};


/* =========================================================
   BASIC UI
   ========================================================= */

function toast(message, type = "") {
  let root = $("#toastRoot");

  if (!root) {
    root = document.createElement("div");
    root.id = "toastRoot";
    root.className = "toast-root";
    document.body.appendChild(root);
  }

  const item = document.createElement("div");
  item.className = `toast ${type}`.trim();
  item.textContent = message;

  root.appendChild(item);

  setTimeout(() => {
    item.remove();
  }, 2800);
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function levelOptions(selected) {
  return GALAXY_LEVELS.map(level => {
    const isSelected = Number(selected) === level.elo ? "selected" : "";

    return `
      <option value="${level.elo}" ${isSelected}>
        ${level.name} — ${level.elo} ELO
      </option>
    `;
  }).join("");
}

function modeOptions(selected) {
  return `
    <option value="galaxy" ${selected === "galaxy" ? "selected" : ""}>
      You vs GALAXY
    </option>

    <option value="friend" ${selected === "friend" ? "selected" : ""}>
      You vs Friend
    </option>
  `;
}

function opponentName(mode) {
  return mode === "galaxy" ? "GALAXY" : "Friend";
}

function setContent(title, eyebrow, html) {
  const contentView = $("#contentView");
  const titleEl = $("#contentTitle");
  const eyebrowEl = $("#contentEyebrow");
  const body = $("#contentBody");

  if (!contentView || !body) return;

  if (titleEl) titleEl.textContent = title;
  if (eyebrowEl) eyebrowEl.textContent = eyebrow;
  body.innerHTML = html;
}

function switchView(view) {
  App.currentView = view;

  $$(".view").forEach(el => el.classList.remove("active-view"));

  const chat = $("#chatView");
  const work = $("#workView");
  const content = $("#contentView");

  if (view === "chat" && chat) {
    chat.classList.add("active-view");
  } else if (view === "work" && work) {
    work.classList.add("active-view");
  } else if (content) {
    content.classList.add("active-view");
  }

  $$("[data-view]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === view
    );
  });

  if (view === "games") {
    renderGamesHome();
  }

  if (view === "projects") {
    renderSimplePage(
      "Projects",
      "GALAXY PROJECTS",
      "Create and manage your GALAXY AI projects."
    );
  }

  if (view === "library") {
    renderSimplePage(
      "Library",
      "GALAXY LIBRARY",
      "Your images, videos, files and generated assets."
    );
  }

  if (view === "studio") {
    renderSimplePage(
      "Create Studio",
      "GALAXY CREATIVE",
      "Image generation, video generation and creative tools."
    );
  }
}

function renderSimplePage(title, eyebrow, description) {
  setContent(
    title,
    eyebrow,
    `
      <div class="panel">
        <h3>${escapeHTML(title)}</h3>
        <p>${escapeHTML(description)}</p>
      </div>
    `
  );
}


/* =========================================================
   CHAT
   ========================================================= */

function updateEmptyState() {
  const empty = $("#chatEmpty");

  if (!empty) return;

  empty.style.display =
    App.messages.length === 0 ? "" : "none";
}

function renderMessages() {
  const container = $("#messages");

  if (!container) return;

  container.innerHTML = App.messages.map(message => `
    <div class="message ${message.role}">
      <div class="bubble">${escapeHTML(message.content)}</div>
    </div>
  `).join("");

  updateEmptyState();

  container.scrollTop = container.scrollHeight;

  window.requestAnimationFrame(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });
  });
}

function updateSendButtonState() {
  const button = $("#sendButton");

  if (!button) return;

  button.textContent = App.generating ? "■" : "↑";
  button.classList.toggle("is-stop", App.generating);

  button.setAttribute(
    "aria-label",
    App.generating ? "Stop generating" : "Send"
  );
}

function autoResizePrompt() {
  const input = $("#promptInput");

  if (!input) return;

  input.style.height = "auto";
  input.style.height =
    `${Math.min(input.scrollHeight, 180)}px`;
}

function addRecentChat(text) {
  const root = $("#recentChats");

  if (!root || !text.trim()) return;

  const button = document.createElement("button");
  button.className = "recent-item";
  button.textContent =
    text.length > 32 ? `${text.slice(0, 32)}…` : text;

  root.prepend(button);

  while (root.children.length > 8) {
    root.lastElementChild.remove();
  }
}

async function fetchAIResponse(messageText) {
  const provider = $("#aiProvider")?.value || "gemini";

  const endpoint =
    provider === "openai"
      ? "/api/chat"
      : "/api/gemini";

  App.controller = new AbortController();

  const response = await fetch(endpoint, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    signal: App.controller.signal,

    body: JSON.stringify({
      message: messageText,
      messages: App.messages.map(message => ({
        role: message.role,
        content: message.content
      }))
    })
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      `GALAXY backend returned ${response.status}`
    );
  }

  return (
    data.reply ||
    data.text ||
    data.output ||
    data.message ||
    "GALAXY did not return a response."
  );
}

async function sendMessage() {
  if (App.generating) {
    if (App.controller) {
      App.controller.abort();
    }

    App.generating = false;
    updateSendButtonState();
    return;
  }

  const input = $("#promptInput");

  if (!input) {
    toast("Prompt input was not found.", "error");
    return;
  }

  const messageText = input.value.trim();

  if (!messageText && App.attachments.length === 0) {
    return;
  }

  const firstMessage = App.messages.length === 0;

  App.messages.push({
    role: "user",
    content: messageText || "Uploaded files"
  });

  if (firstMessage) {
    addRecentChat(messageText || "Uploaded files");
  }

  input.value = "";
  autoResizePrompt();
  renderMessages();

  App.generating = true;
  updateSendButtonState();

  const draftState = $("#draftState");

  if (draftState) {
    draftState.textContent = "GALAXY is thinking…";
  }

  try {
    const reply = await fetchAIResponse(messageText);

    App.messages.push({
      role: "assistant",
      content: reply
    });
  } catch (error) {
    if (error.name !== "AbortError") {
      App.messages.push({
        role: "assistant",
        content:
          `GALAXY backend error: ${error.message}`
      });

      toast(error.message, "error");
    }
  } finally {
    App.generating = false;
    App.controller = null;

    updateSendButtonState();
    renderMessages();

    if (draftState) {
      draftState.textContent = "Ready";
    }
  }
}

function newChat() {
  if (App.generating && App.controller) {
    App.controller.abort();
  }

  App.messages = [];
  App.attachments = [];
  App.generating = false;
  App.controller = null;

  const input = $("#promptInput");

  if (input) {
    input.value = "";
    autoResizePrompt();
  }

  const tray = $("#attachmentTray");

  if (tray) tray.innerHTML = "";

  renderMessages();
  updateSendButtonState();
  switchView("chat");
}

function handleFiles(files) {
  const list = Array.from(files || []);

  if (!list.length) return;

  App.attachments.push(...list);

  const tray = $("#attachmentTray");

  if (!tray) return;

  tray.innerHTML = App.attachments.map(file => `
    <div class="attachment-chip">
      ${escapeHTML(file.name)}
    </div>
  `).join("");

  toast(`${list.length} file(s) added`, "success");
}


/* =========================================================
   GAMING CENTER HOME
   ========================================================= */

function renderGamesHome() {
  Games.current = null;

  setContent(
    "Gaming Center",
    "GALAXY GAMES",
    `
      <div class="games-home">

        <div class="games-hero">
          <div>
            <span class="eyebrow">PLAY WITH GALAXY OR A FRIEND</span>
            <h2>GALAXY Gaming Center</h2>

            <p>
              Choose a game, challenge GALAXY,
              or play locally with a friend.
            </p>
          </div>

          <div class="games-hero-mark">♛</div>
        </div>

        <div class="games-grid">

          ${gameCard(
            "chess",
            "♟",
            "Chess",
            "Play against GALAXY or a friend."
          )}

          ${gameCard(
            "tictactoe",
            "✕○",
            "Tic-Tac-Toe",
            "Quick strategy against GALAXY or a friend."
          )}

          ${gameCard(
            "connect4",
            "●●",
            "Connect Four",
            "Connect four before your opponent."
          )}

          ${gameCard(
            "memory",
            "✦?",
            "Memory",
            "Find more matching pairs than your opponent."
          )}

          ${gameCard(
            "shooter",
            "◎",
            "GALAXY Shooting",
            "Arcade target challenge against GALAXY or a friend."
          )}

        </div>
      </div>
    `
  );
}

function gameCard(id, icon, title, description) {
  return `
    <button
      class="game-card"
      data-game-open="${id}"
      type="button"
    >
      <div class="game-card-visual">${icon}</div>

      <div class="game-card-copy">
        <strong>${escapeHTML(title)}</strong>
        <span>${escapeHTML(description)}</span>
      </div>
    </button>
  `;
}

function gameHeader(title, status, toolbar) {
  return `
    <div class="game-topline">

      <button
        class="secondary-btn"
        data-game-back
        type="button"
      >
        ← Games
      </button>

      <div class="game-status">
        ${escapeHTML(status)}
      </div>

      <div class="game-toolbar">
        ${toolbar}
      </div>

    </div>

    <h2>${escapeHTML(title)}</h2>
  `;
}

function gameModeSelector(game) {
  return `
    <select
      data-game-mode="${game}"
      aria-label="Game mode"
    >
      ${modeOptions(Games[game].mode)}
    </select>
  `;
}

function gameLevelSelector(game) {
  if (Games[game].mode !== "galaxy") {
    return "";
  }

  return `
    <select
      data-game-level="${game}"
      aria-label="GALAXY difficulty"
    >
      ${levelOptions(Games[game].elo)}
    </select>
  `;
}

function commonGameButtons(game, options = {}) {
  const {
    hint = true,
    undo = true,
    resign = true,
    review = true
  } = options;

  return `
    ${hint ? `
      <button
        class="secondary-btn"
        data-game-command="${game}:hint"
        type="button"
      >Hint</button>
    ` : ""}

    ${undo ? `
      <button
        class="secondary-btn"
        data-game-command="${game}:undo"
        type="button"
      >Undo</button>
    ` : ""}

    ${resign ? `
      <button
        class="secondary-btn"
        data-game-command="${game}:resign"
        type="button"
      >Resign</button>
    ` : ""}

    ${review ? `
      <button
        class="secondary-btn"
        data-game-command="${game}:review"
        type="button"
      >Review</button>
    ` : ""}

    <button
      class="primary-btn"
      data-game-command="${game}:reset"
      type="button"
    >
      New Game
    </button>
  `;
}


/* =========================================================
   OPEN GAME
   ========================================================= */

function openGame(name) {
  Games.current = name;

  if (name === "chess") {
    resetChess(false);
    return;
  }

  if (name === "tictactoe") {
    resetTTT(false);
    return;
  }

  if (name === "connect4") {
    resetConnect(false);
    return;
  }

  if (name === "memory") {
    resetMemory(false);
    return;
  }

  if (name === "shooter") {
    resetShooter(false);
  }
}
/* =========================================================
   CHESS
   ========================================================= */

const CHESS_START = [
  ["r","n","b","q","k","b","n","r"],
  ["p","p","p","p","p","p","p","p"],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["P","P","P","P","P","P","P","P"],
  ["R","N","B","Q","K","B","N","R"]
];

const CHESS_ICONS = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟"
};

const CHESS_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100
};

function resetChess(render = true) {
  const game = Games.chess;

  game.board = clone(CHESS_START);
  game.turn = "w";
  game.selected = null;
  game.legal = [];
  game.history = [];
  game.snapshots = [];
  game.finished = false;
  game.winner = null;
  game.hints = 0;
  game.reviewOpen = false;

  if (render) renderChess();
  else renderChess();
}

function chessColor(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? "w" : "b";
}

function chessOpponent(color) {
  return color === "w" ? "b" : "w";
}

function chessInside(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function chessPathMoves(row, col, directions, color) {
  const game = Games.chess;
  const moves = [];

  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;

    while (chessInside(r, c)) {
      const target = game.board[r][c];

      if (!target) {
        moves.push({ row: r, col: c });
      } else {
        if (chessColor(target) !== color) {
          moves.push({
            row: r,
            col: c,
            capture: true
          });
        }

        break;
      }

      r += dr;
      c += dc;
    }
  }

  return moves;
}

function chessPseudoMoves(row, col) {
  const game = Games.chess;
  const piece = game.board[row][col];

  if (!piece) return [];

  const color = chessColor(piece);
  const lower = piece.toLowerCase();

  const moves = [];

  if (lower === "p") {
    const direction = color === "w" ? -1 : 1;
    const startRow = color === "w" ? 6 : 1;

    const one = row + direction;

    if (
      chessInside(one, col) &&
      !game.board[one][col]
    ) {
      moves.push({
        row: one,
        col
      });

      const two = row + direction * 2;

      if (
        row === startRow &&
        chessInside(two, col) &&
        !game.board[two][col]
      ) {
        moves.push({
          row: two,
          col
        });
      }
    }

    for (const dc of [-1, 1]) {
      const r = row + direction;
      const c = col + dc;

      if (
        chessInside(r, c) &&
        game.board[r][c] &&
        chessColor(game.board[r][c]) !== color
      ) {
        moves.push({
          row: r,
          col: c,
          capture: true
        });
      }
    }
  }

  if (lower === "n") {
    const jumps = [
      [-2,-1],[-2,1],
      [-1,-2],[-1,2],
      [1,-2],[1,2],
      [2,-1],[2,1]
    ];

    for (const [dr, dc] of jumps) {
      const r = row + dr;
      const c = col + dc;

      if (!chessInside(r, c)) continue;

      const target = game.board[r][c];

      if (!target) {
        moves.push({ row: r, col: c });
      } else if (chessColor(target) !== color) {
        moves.push({
          row: r,
          col: c,
          capture: true
        });
      }
    }
  }

  if (lower === "b") {
    return chessPathMoves(
      row,
      col,
      [[1,1],[1,-1],[-1,1],[-1,-1]],
      color
    );
  }

  if (lower === "r") {
    return chessPathMoves(
      row,
      col,
      [[1,0],[-1,0],[0,1],[0,-1]],
      color
    );
  }

  if (lower === "q") {
    return chessPathMoves(
      row,
      col,
      [
        [1,1],[1,-1],[-1,1],[-1,-1],
        [1,0],[-1,0],[0,1],[0,-1]
      ],
      color
    );
  }

  if (lower === "k") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        const r = row + dr;
        const c = col + dc;

        if (!chessInside(r, c)) continue;

        const target = game.board[r][c];

        if (!target) {
          moves.push({ row: r, col: c });
        } else if (chessColor(target) !== color) {
          moves.push({
            row: r,
            col: c,
            capture: true
          });
        }
      }
    }
  }

  return moves;
}

function chessAllMoves(color) {
  const game = Games.chess;
  const all = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = game.board[row][col];

      if (
        piece &&
        chessColor(piece) === color
      ) {
        const moves = chessPseudoMoves(row, col);

        for (const move of moves) {
          all.push({
            from: { row, col },
            to: move,
            piece
          });
        }
      }
    }
  }

  return all;
}

function chessSquareName(row, col) {
  const file = "abcdefgh"[col];
  const rank = 8 - row;

  return `${file}${rank}`;
}

function chessMoveText(move, captured = "") {
  const pieceName =
    move.piece.toLowerCase() === "p"
      ? ""
      : move.piece.toUpperCase();

  const capture = captured ? "x" : "";

  return `${pieceName}${chessSquareName(
    move.from.row,
    move.from.col
  )}${capture}${chessSquareName(
    move.to.row,
    move.to.col
  )}`;
}

function chessSnapshot() {
  const game = Games.chess;

  return {
    board: clone(game.board),
    turn: game.turn,
    history: clone(game.history),
    finished: game.finished,
    winner: game.winner
  };
}

function chessRestore(snapshot) {
  const game = Games.chess;

  game.board = clone(snapshot.board);
  game.turn = snapshot.turn;
  game.history = clone(snapshot.history);
  game.finished = snapshot.finished;
  game.winner = snapshot.winner;
  game.selected = null;
  game.legal = [];
}

function chessMoveScore(move) {
  const game = Games.chess;
  const target =
    game.board[move.to.row][move.to.col];

  let score = 0;

  if (target) {
    score +=
      CHESS_VALUES[target.toLowerCase()] * 10;
  }

  const centerDistance =
    Math.abs(3.5 - move.to.row) +
    Math.abs(3.5 - move.to.col);

  score += Math.max(0, 6 - centerDistance);

  if (move.piece.toLowerCase() === "p") {
    score += 1;
  }

  return score;
}

function chooseGalaxyChessMove() {
  const game = Games.chess;

  let moves = chessAllMoves("b");

  if (!moves.length) return null;

  moves = moves.map(move => ({
    ...move,
    score: chessMoveScore(move)
  }));

  moves.sort((a, b) => b.score - a.score);

  const strength = game.elo;

  let poolSize = moves.length;

  if (strength >= 1200) poolSize = Math.min(2, moves.length);
  else if (strength >= 1000) poolSize = Math.min(3, moves.length);
  else if (strength >= 800) poolSize = Math.min(5, moves.length);
  else if (strength >= 500) poolSize = Math.min(8, moves.length);
  else if (strength >= 200) poolSize = Math.min(14, moves.length);

  return randomItem(
    moves.slice(0, Math.max(1, poolSize))
  );
}

function chessApplyMove(move, actor = "player") {
  const game = Games.chess;

  if (game.finished) return;

  game.snapshots.push(chessSnapshot());

  const piece =
    game.board[move.from.row][move.from.col];

  const captured =
    game.board[move.to.row][move.to.col];

  game.board[move.to.row][move.to.col] = piece;
  game.board[move.from.row][move.from.col] = "";

  if (
    piece === "P" &&
    move.to.row === 0
  ) {
    game.board[move.to.row][move.to.col] = "Q";
  }

  if (
    piece === "p" &&
    move.to.row === 7
  ) {
    game.board[move.to.row][move.to.col] = "q";
  }

  game.history.push({
    actor,
    text: chessMoveText(
      {
        ...move,
        piece
      },
      captured
    ),
    captured
  });

  if (captured?.toLowerCase() === "k") {
    game.finished = true;

    game.winner =
      actor === "galaxy"
        ? "GALAXY"
        : actor === "friend"
          ? "Friend"
          : "You";
  }

  game.turn =
    game.turn === "w" ? "b" : "w";

  game.selected = null;
  game.legal = [];

  renderChess();

  if (
    !game.finished &&
    game.mode === "galaxy" &&
    game.turn === "b"
  ) {
    setTimeout(galaxyChessTurn, 450);
  }
}

function galaxyChessTurn() {
  const game = Games.chess;

  if (
    game.finished ||
    game.mode !== "galaxy" ||
    game.turn !== "b"
  ) {
    return;
  }

  const move = chooseGalaxyChessMove();

  if (!move) {
    game.finished = true;
    game.winner = "You";
    renderChess();
    return;
  }

  chessApplyMove(move, "galaxy");
}

function chessClickSquare(row, col) {
  const game = Games.chess;

  if (game.finished) return;

  if (
    game.mode === "galaxy" &&
    game.turn === "b"
  ) {
    return;
  }

  const piece = game.board[row][col];

  const playerColor =
    game.turn;

  if (game.selected) {
    const legal = game.legal.find(
      move =>
        move.row === row &&
        move.col === col
    );

    if (legal) {
      const actor =
        game.mode === "friend" &&
        game.turn === "b"
          ? "friend"
          : "player";

      chessApplyMove(
        {
          from: game.selected,
          to: legal
        },
        actor
      );

      return;
    }
  }

  if (
    piece &&
    chessColor(piece) === playerColor
  ) {
    game.selected = { row, col };
    game.legal = chessPseudoMoves(row, col);
  } else {
    game.selected = null;
    game.legal = [];
  }

  renderChess();
}

function chessHint() {
  const game = Games.chess;

  if (game.finished) return;

  const moves = chessAllMoves(game.turn);

  if (!moves.length) {
    toast("No move available.");
    return;
  }

  moves.sort(
    (a, b) =>
      chessMoveScore(b) -
      chessMoveScore(a)
  );

  const best = moves[0];

  game.hints += 1;

  toast(
    `Hint: ${chessSquareName(
      best.from.row,
      best.from.col
    )} → ${chessSquareName(
      best.to.row,
      best.to.col
    )}`
  );
}

function chessUndo() {
  const game = Games.chess;

  if (!game.snapshots.length) {
    toast("Nothing to undo.");
    return;
  }

  let snapshot = game.snapshots.pop();

  if (
    game.mode === "galaxy" &&
    snapshot.turn === "b" &&
    game.snapshots.length
  ) {
    snapshot = game.snapshots.pop();
  }

  chessRestore(snapshot);
  renderChess();
}

function chessResign() {
  const game = Games.chess;

  if (game.finished) return;

  game.finished = true;

  if (game.mode === "galaxy") {
    game.winner = "GALAXY";
  } else {
    game.winner =
      game.turn === "w"
        ? "Friend"
        : "You";
  }

  renderChess();
}

function chessReviewHTML() {
  const game = Games.chess;

  const playerMoves =
    game.history.filter(
      item => item.actor === "player"
    );

  const captures =
    playerMoves.filter(
      item => item.captured
    ).length;

  const moves = playerMoves.length;

  let accuracy =
    Math.max(
      35,
      Math.min(
        98,
        72 +
        captures * 4 -
        Math.max(0, moves - captures * 2) * 0.7 -
        game.hints * 2
      )
    );

  accuracy = Math.round(accuracy);

  const best = Math.max(
    0,
    Math.round(captures * 0.7)
  );

  const good = Math.max(
    0,
    moves - best - Math.floor(moves * 0.15)
  );

  const mistakes =
    Math.max(
      0,
      Math.floor(moves * 0.1)
    );

  const blunders =
    Math.max(
      0,
      Math.floor(moves * 0.05)
    );

  return reviewCardHTML(
    "Chess Review",
    [
      ["Estimated accuracy", `${accuracy}%`],
      ["Moves", moves],
      ["Best moves", best],
      ["Good moves", good],
      ["Mistakes", mistakes],
      ["Blunders", blunders],
      ["Hints used", game.hints],
      ["Result", game.winner || "In progress"]
    ],
    "GALAXY Chess review is heuristic and is not Stockfish-certified."
  );
}

function renderChess() {
  const game = Games.chess;

  const status =
    game.finished
      ? `${game.winner || "Game"} wins`
      : game.mode === "galaxy"
        ? game.turn === "w"
          ? "Your turn"
          : "GALAXY is thinking"
        : game.turn === "w"
          ? "Your turn"
          : "Friend's turn";

  const toolbar = `
    ${gameModeSelector("chess")}
    ${gameLevelSelector("chess")}
    ${commonGameButtons("chess")}
  `;

  let boardHTML = "";

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece =
        game.board[row][col];

      const light =
        (row + col) % 2 === 0;

      const selected =
        game.selected &&
        game.selected.row === row &&
        game.selected.col === col;

      const legalMove =
        game.legal.find(
          move =>
            move.row === row &&
            move.col === col
        );

      boardHTML += `
        <button
          class="
            chess-square
            ${light ? "light" : "dark"}
            ${selected ? "selected" : ""}
            ${legalMove ? "legal" : ""}
            ${
              legalMove?.capture
                ? "capture"
                : ""
            }
          "
          data-chess-square="${row},${col}"
          type="button"
        >
          ${piece ? CHESS_ICONS[piece] : ""}
        </button>
      `;
    }
  }

  const historyHTML =
    game.history.length
      ? game.history
          .map(
            (move, index) =>
              `<div>${index + 1}. ${escapeHTML(
                move.text
              )}</div>`
          )
          .join("")
      : "<div>No moves yet.</div>";

  setContent(
    "Chess",
    "GALAXY GAMES",
    `
      <div class="game-shell">

        ${gameHeader(
          "Chess",
          status,
          toolbar
        )}

        <div class="game-layout">

          <div class="chess-board-wrap">

            <div class="chess-board">
              ${boardHTML}
            </div>

            <div class="chess-files">
              <span>a</span>
              <span>b</span>
              <span>c</span>
              <span>d</span>
              <span>e</span>
              <span>f</span>
              <span>g</span>
              <span>h</span>
            </div>

          </div>

          <div class="game-side-panel">

            <div class="player-card">
              <div class="player-avatar">Y</div>
              <div>
                <strong>You</strong>
                <span>White</span>
              </div>
            </div>

            <div class="player-card">
              <div class="player-avatar galaxy-avatar">
                ${
                  game.mode === "galaxy"
                    ? "✦"
                    : "F"
                }
              </div>

              <div>
                <strong>
                  ${
                    game.mode === "galaxy"
                      ? "GALAXY"
                      : "Friend"
                  }
                </strong>

                <span>
                  ${
                    game.mode === "galaxy"
                      ? `${game.elo} ELO`
                      : "Black"
                  }
                </span>
              </div>
            </div>

            <div class="move-history">
              <strong>Move history</strong>

              <div class="move-history-list">
                ${historyHTML}
              </div>
            </div>

            ${
              game.reviewOpen
                ? chessReviewHTML()
                : ""
            }

          </div>

        </div>
      </div>
    `
  );
}


/* =========================================================
   TIC TAC TOE
   ========================================================= */

function resetTTT(render = true) {
  const game = Games.ttt;

  game.board = Array(9).fill("");
  game.turn = "X";
  game.history = [];
  game.finished = false;
  game.winner = null;
  game.hints = 0;
  game.reviewOpen = false;

  renderTTT();
}

const TTT_LINES = [
  [0,1,2],
  [3,4,5],
  [6,7,8],
  [0,3,6],
  [1,4,7],
  [2,5,8],
  [0,4,8],
  [2,4,6]
];

function tttWinner(board) {
  for (const [a,b,c] of TTT_LINES) {
    if (
      board[a] &&
      board[a] === board[b] &&
      board[b] === board[c]
    ) {
      return board[a];
    }
  }

  if (board.every(Boolean)) {
    return "draw";
  }

  return null;
}

function tttWinningMove(board, symbol) {
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;

    const copy = [...board];
    copy[i] = symbol;

    if (tttWinner(copy) === symbol) {
      return i;
    }
  }

  return null;
}

function tttGalaxyChoice() {
  const game = Games.ttt;
  const board = game.board;

  const available = board
    .map((cell, index) =>
      cell ? null : index
    )
    .filter(index => index !== null);

  if (!available.length) return null;

  const win = tttWinningMove(board, "O");
  const block = tttWinningMove(board, "X");

  const random = () =>
    randomItem(available);

  if (game.elo >= 1000) {
    if (win !== null) return win;
    if (block !== null) return block;

    if (!board[4]) return 4;

    const corners = [0,2,6,8]
      .filter(index => !board[index]);

    if (corners.length) {
      return randomItem(corners);
    }

    return random();
  }

  if (game.elo >= 800) {
    if (win !== null) return win;

    if (
      block !== null &&
      Math.random() < 0.92
    ) {
      return block;
    }

    if (!board[4] && Math.random() < 0.8) {
      return 4;
    }
  }

  if (game.elo >= 500) {
    if (
      win !== null &&
      Math.random() < 0.85
    ) {
      return win;
    }

    if (
      block !== null &&
      Math.random() < 0.7
    ) {
      return block;
    }
  }

  if (game.elo >= 200) {
    if (
      win !== null &&
      Math.random() < 0.55
    ) {
      return win;
    }

    if (
      block !== null &&
      Math.random() < 0.45
    ) {
      return block;
    }
  }

  return random();
}

function tttApplyMove(index, symbol, actor) {
  const game = Games.ttt;

  if (
    game.finished ||
    game.board[index]
  ) {
    return;
  }

  game.board[index] = symbol;

  game.history.push({
    index,
    symbol,
    actor
  });

  const winner =
    tttWinner(game.board);

  if (winner) {
    game.finished = true;

    if (winner === "draw") {
      game.winner = "Draw";
    } else if (winner === "X") {
      game.winner = "You";
    } else {
      game.winner =
        game.mode === "galaxy"
          ? "GALAXY"
          : "Friend";
    }

    renderTTT();
    return;
  }

  game.turn =
    symbol === "X"
      ? "O"
      : "X";

  renderTTT();

  if (
    game.mode === "galaxy" &&
    game.turn === "O"
  ) {
    setTimeout(tttGalaxyTurn, 380);
  }
}

function tttClick(index) {
  const game = Games.ttt;

  if (
    game.finished ||
    game.board[index]
  ) {
    return;
  }

  if (
    game.mode === "galaxy" &&
    game.turn === "O"
  ) {
    return;
  }

  const actor =
    game.mode === "friend" &&
    game.turn === "O"
      ? "friend"
      : "player";

  tttApplyMove(
    index,
    game.turn,
    actor
  );
}

function tttGalaxyTurn() {
  const game = Games.ttt;

  if (
    game.mode !== "galaxy" ||
    game.finished ||
    game.turn !== "O"
  ) {
    return;
  }

  const move = tttGalaxyChoice();

  if (move === null) return;

  tttApplyMove(
    move,
    "O",
    "galaxy"
  );
}

function tttHint() {
  const game = Games.ttt;

  if (game.finished) return;

  const symbol = game.turn;

  const win =
    tttWinningMove(
      game.board,
      symbol
    );

  const block =
    tttWinningMove(
      game.board,
      symbol === "X" ? "O" : "X"
    );

  let move = win ?? block;

  if (
    move === null ||
    move === undefined
  ) {
    if (!game.board[4]) {
      move = 4;
    } else {
      const available =
        game.board
          .map((cell, index) =>
            cell ? null : index
          )
          .filter(index => index !== null);

      move = randomItem(available);
    }
  }

  game.hints += 1;

  toast(
    `Hint: choose square ${move + 1}`
  );
}

function tttUndo() {
  const game = Games.ttt;

  if (!game.history.length) {
    toast("Nothing to undo.");
    return;
  }

  let count =
    game.mode === "galaxy"
      ? 2
      : 1;

  while (
    count > 0 &&
    game.history.length
  ) {
    const last = game.history.pop();

    game.board[last.index] = "";

    count--;
  }

  game.finished = false;
  game.winner = null;

  game.turn =
    game.history.length % 2 === 0
      ? "X"
      : "O";

  renderTTT();
}

function tttResign() {
  const game = Games.ttt;

  if (game.finished) return;

  game.finished = true;

  game.winner =
    game.mode === "galaxy"
      ? "GALAXY"
      : game.turn === "X"
        ? "Friend"
        : "You";

  renderTTT();
}

function tttReviewHTML() {
  const game = Games.ttt;

  const playerMoves =
    game.history.filter(
      move => move.actor === "player"
    ).length;

  return reviewCardHTML(
    "Tic-Tac-Toe Review",
    [
      ["Your moves", playerMoves],
      ["Total moves", game.history.length],
      ["Hints used", game.hints],
      ["Result", game.winner || "In progress"],
      [
        "Difficulty",
        game.mode === "galaxy"
          ? `${game.elo} ELO`
          : "Friend mode"
      ],
      [
        "Board filled",
        `${game.board.filter(Boolean).length}/9`
      ]
    ]
  );
}

function renderTTT() {
  const game = Games.ttt;

  const status =
    game.finished
      ? game.winner === "Draw"
        ? "Draw"
        : `${game.winner} wins`
      : game.mode === "galaxy"
        ? game.turn === "X"
          ? "Your turn"
          : "GALAXY's turn"
        : game.turn === "X"
          ? "Your turn"
          : "Friend's turn";

  const toolbar = `
    ${gameModeSelector("ttt")}
    ${gameLevelSelector("ttt")}
    ${commonGameButtons("ttt")}
  `;

  setContent(
    "Tic-Tac-Toe",
    "GALAXY GAMES",
    `
      <div class="game-shell">

        ${gameHeader(
          "Tic-Tac-Toe",
          status,
          toolbar
        )}

        <div class="game-layout">

          <div class="ttt-board">
            ${game.board.map((cell, index) => `
              <button
                class="ttt-cell"
                data-ttt-cell="${index}"
                type="button"
              >
                ${cell}
              </button>
            `).join("")}
          </div>

          <div class="game-side-panel">

            <div class="player-card">
              <div class="player-avatar">X</div>
              <div>
                <strong>You</strong>
                <span>Player X</span>
              </div>
            </div>

            <div class="player-card">
              <div class="player-avatar galaxy-avatar">
                ${
                  game.mode === "galaxy"
                    ? "✦"
                    : "O"
                }
              </div>

              <div>
                <strong>
                  ${
                    game.mode === "galaxy"
                      ? "GALAXY"
                      : "Friend"
                  }
                </strong>

                <span>
                  ${
                    game.mode === "galaxy"
                      ? `${game.elo} ELO`
                      : "Player O"
                  }
                </span>
              </div>
            </div>

            ${
              game.reviewOpen
                ? tttReviewHTML()
                : ""
            }

          </div>

        </div>
      </div>
    `
  );
}


/* =========================================================
   CONNECT FOUR
   ========================================================= */

function resetConnect(render = true) {
  const game = Games.connect;

  game.board =
    Array.from(
      { length: 6 },
      () => Array(7).fill("")
    );

  game.turn = "P";
  game.history = [];
  game.finished = false;
  game.winner = null;
  game.hints = 0;
  game.reviewOpen = false;

  renderConnect();
}

function connectAvailableRow(board, col) {
  for (let row = 5; row >= 0; row--) {
    if (!board[row][col]) {
      return row;
    }
  }

  return -1;
}

function connectWinner(board, symbol) {
  const directions = [
    [0,1],
    [1,0],
    [1,1],
    [1,-1]
  ];

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      if (board[row][col] !== symbol) {
        continue;
      }

      for (const [dr, dc] of directions) {
        let count = 1;

        for (let step = 1; step < 4; step++) {
          const r = row + dr * step;
          const c = col + dc * step;

          if (
            r < 0 ||
            r >= 6 ||
            c < 0 ||
            c >= 7 ||
            board[r][c] !== symbol
          ) {
            break;
          }

          count++;
        }

        if (count >= 4) {
          return true;
        }
      }
    }
  }

  return false;
}

function connectBoardFull(board) {
  return board[0].every(Boolean);
}

function connectWinningColumn(board, symbol) {
  for (let col = 0; col < 7; col++) {
    const row =
      connectAvailableRow(board, col);

    if (row < 0) continue;

    const copy = clone(board);

    copy[row][col] = symbol;

    if (
      connectWinner(copy, symbol)
    ) {
      return col;
    }
  }

  return null;
}

function connectGalaxyChoice() {
  const game = Games.connect;

  const available =
    [0,1,2,3,4,5,6]
      .filter(
        col =>
          connectAvailableRow(
            game.board,
            col
          ) >= 0
      );

  if (!available.length) return null;

  const win =
    connectWinningColumn(
      game.board,
      "G"
    );

  const block =
    connectWinningColumn(
      game.board,
      "P"
    );

  if (game.elo >= 1000) {
    if (win !== null) return win;
    if (block !== null) return block;

    const preferred =
      [3,2,4,1,5,0,6]
        .filter(
          col =>
            available.includes(col)
        );

    return preferred[0];
  }

  if (game.elo >= 800) {
    if (win !== null) return win;

    if (
      block !== null &&
      Math.random() < 0.92
    ) {
      return block;
    }

    if (
      available.includes(3) &&
      Math.random() < 0.75
    ) {
      return 3;
    }
  }

  if (game.elo >= 500) {
    if (
      win !== null &&
      Math.random() < 0.85
    ) {
      return win;
    }

    if (
      block !== null &&
      Math.random() < 0.7
    ) {
      return block;
    }
  }

  if (game.elo >= 200) {
    if (
      win !== null &&
      Math.random() < 0.5
    ) {
      return win;
    }

    if (
      block !== null &&
      Math.random() < 0.4
    ) {
      return block;
    }
  }

  return randomItem(available);
}

function connectDrop(col, actor) {
  const game = Games.connect;

  if (game.finished) return;

  const row =
    connectAvailableRow(
      game.board,
      col
    );

  if (row < 0) return;

  const symbol =
    game.turn;

  game.board[row][col] = symbol;

  game.history.push({
    row,
    col,
    symbol,
    actor
  });

  if (
    connectWinner(
      game.board,
      symbol
    )
  ) {
    game.finished = true;

    if (symbol === "P") {
      game.winner = "You";
    } else {
      game.winner =
        game.mode === "galaxy"
          ? "GALAXY"
          : "Friend";
    }

    renderConnect();
    return;
  }

  if (connectBoardFull(game.board)) {
    game.finished = true;
    game.winner = "Draw";
    renderConnect();
    return;
  }

  game.turn =
    symbol === "P"
      ? "G"
      : "P";

  renderConnect();

  if (
    game.mode === "galaxy" &&
    game.turn === "G"
  ) {
    setTimeout(
      connectGalaxyTurn,
      450
    );
  }
}

function connectClick(col) {
  const game = Games.connect;

  if (
    game.finished ||
    (
      game.mode === "galaxy" &&
      game.turn === "G"
    )
  ) {
    return;
  }

  const actor =
    game.mode === "friend" &&
    game.turn === "G"
      ? "friend"
      : "player";

  connectDrop(
    col,
    actor
  );
}

function connectGalaxyTurn() {
  const game = Games.connect;

  if (
    game.finished ||
    game.mode !== "galaxy" ||
    game.turn !== "G"
  ) {
    return;
  }

  const col =
    connectGalaxyChoice();

  if (col === null) return;

  connectDrop(
    col,
    "galaxy"
  );
}

function connectHint() {
  const game = Games.connect;

  if (game.finished) return;

  const symbol = game.turn;

  let col =
    connectWinningColumn(
      game.board,
      symbol
    );

  if (col === null) {
    col =
      connectWinningColumn(
        game.board,
        symbol === "P"
          ? "G"
          : "P"
      );
  }

  if (col === null) {
    const available =
      [3,2,4,1,5,0,6]
        .filter(
          column =>
            connectAvailableRow(
              game.board,
              column
            ) >= 0
        );

    col = available[0];
  }

  game.hints++;

  toast(
    `Hint: play column ${col + 1}`
  );
}

function connectUndo() {
  const game = Games.connect;

  if (!game.history.length) {
    toast("Nothing to undo.");
    return;
  }

  let count =
    game.mode === "galaxy"
      ? 2
      : 1;

  while (
    count > 0 &&
    game.history.length
  ) {
    const last =
      game.history.pop();

    game.board[last.row][last.col] = "";

    count--;
  }

  game.finished = false;
  game.winner = null;

  game.turn =
    game.history.length % 2 === 0
      ? "P"
      : "G";

  renderConnect();
}

function connectResign() {
  const game = Games.connect;

  if (game.finished) return;

  game.finished = true;

  game.winner =
    game.mode === "galaxy"
      ? "GALAXY"
      : game.turn === "P"
        ? "Friend"
        : "You";

  renderConnect();
}

function connectReviewHTML() {
  const game = Games.connect;

  return reviewCardHTML(
    "Connect Four Review",
    [
      [
        "Your moves",
        game.history.filter(
          move =>
            move.actor === "player"
        ).length
      ],
      ["Total moves", game.history.length],
      ["Hints", game.hints],
      ["Result", game.winner || "In progress"],
      [
        "Difficulty",
        game.mode === "galaxy"
          ? `${game.elo} ELO`
          : "Friend mode"
      ]
    ]
  );
}

function renderConnect() {
  const game = Games.connect;

  const status =
    game.finished
      ? game.winner === "Draw"
        ? "Draw"
        : `${game.winner} wins`
      : game.mode === "galaxy"
        ? game.turn === "P"
          ? "Your turn"
          : "GALAXY's turn"
        : game.turn === "P"
          ? "Your turn"
          : "Friend's turn";

  const toolbar = `
    ${gameModeSelector("connect")}
    ${gameLevelSelector("connect")}
    ${commonGameButtons("connect")}
  `;

  let boardHTML = "";

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const value =
        game.board[row][col];

      boardHTML += `
        <div class="connect-cell">
          <span
            class="
              connect-disc
              ${
                value === "P"
                  ? "player"
                  : value === "G"
                    ? game.mode === "galaxy"
                      ? "galaxy"
                      : "friend"
                    : ""
              }
            "
          ></span>
        </div>
      `;
    }
  }

  setContent(
    "Connect Four",
    "GALAXY GAMES",
    `
      <div class="game-shell">

        ${gameHeader(
          "Connect Four",
          status,
          toolbar
        )}

        <div class="game-layout">

          <div>

            <div class="connect-columns">
              ${[0,1,2,3,4,5,6]
                .map(
                  col => `
                    <button
                      data-connect-column="${col}"
                      type="button"
                    >
                      ↓
                    </button>
                  `
                )
                .join("")}
            </div>

            <div class="connect-board">
              ${boardHTML}
            </div>

          </div>

          <div class="game-side-panel">

            <div class="player-card">
              <div class="player-avatar">●</div>
              <div>
                <strong>You</strong>
                <span>Red</span>
              </div>
            </div>

            <div class="player-card">
              <div class="player-avatar galaxy-avatar">
                ${
                  game.mode === "galaxy"
                    ? "✦"
                    : "●"
                }
              </div>

              <div>
                <strong>
                  ${
                    game.mode === "galaxy"
                      ? "GALAXY"
                      : "Friend"
                  }
                </strong>

                <span>
                  ${
                    game.mode === "galaxy"
                      ? `${game.elo} ELO`
                      : "Blue"
                  }
                </span>
              </div>
            </div>

            ${
              game.reviewOpen
                ? connectReviewHTML()
                : ""
            }

          </div>
        </div>
      </div>
    `
  );
}


/* =========================================================
   MEMORY
   ========================================================= */

const MEMORY_SYMBOLS = [
  "🚀",
  "🌕",
  "🪐",
  "⭐",
  "👾",
  "☄️",
  "🛰️",
  "🌌"
];

function shuffle(array) {
  const copy = [...array];

  for (
    let i = copy.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [copy[i], copy[j]] =
      [copy[j], copy[i]];
  }

  return copy;
}

function resetMemory(render = true) {
  const game = Games.memory;

  const deck =
    shuffle([
      ...MEMORY_SYMBOLS,
      ...MEMORY_SYMBOLS
    ]);

  game.cards =
    deck.map((symbol, index) => ({
      id: index,
      symbol
    }));

  game.revealed = [];
  game.matched = new Set();
  game.turn = "player";
  game.playerScore = 0;
  game.opponentScore = 0;
  game.history = [];
  game.known = {};
  game.busy = false;
  game.finished = false;
  game.hints = 0;
  game.reviewOpen = false;
  game.playerAttempts = 0;
  game.playerMatches = 0;

  renderMemory();
}

function memoryRemember(index) {
  const game = Games.memory;

  const symbol =
    game.cards[index]?.symbol;

  if (!symbol) return;

  game.known[index] = symbol;
}

function memorySnapshot() {
  const game = Games.memory;

  return {
    matched: [...game.matched],
    turn: game.turn,
    playerScore: game.playerScore,
    opponentScore: game.opponentScore,
    history: clone(game.history),
    known: clone(game.known),
    playerAttempts: game.playerAttempts,
    playerMatches: game.playerMatches
  };
}

function memoryRestore(snapshot) {
  const game = Games.memory;

  game.matched =
    new Set(snapshot.matched);

  game.turn = snapshot.turn;
  game.playerScore = snapshot.playerScore;
  game.opponentScore = snapshot.opponentScore;
  game.history = clone(snapshot.history);
  game.known = clone(snapshot.known);
  game.playerAttempts = snapshot.playerAttempts;
  game.playerMatches = snapshot.playerMatches;

  game.revealed = [];
  game.finished =
    game.matched.size ===
    game.cards.length;
}

async function memoryClick(index) {
  const game = Games.memory;

  if (
    game.finished ||
    game.busy ||
    game.matched.has(index) ||
    game.revealed.includes(index)
  ) {
    return;
  }

  if (
    game.mode === "galaxy" &&
    game.turn === "galaxy"
  ) {
    return;
  }

  if (game.revealed.length === 0) {
    game.history.push({
      snapshot: memorySnapshot()
    });
  }

  game.revealed.push(index);
  memoryRemember(index);

  renderMemory();

  if (game.revealed.length < 2) {
    return;
  }

  game.busy = true;

  const [a, b] =
    game.revealed;

  const match =
    game.cards[a].symbol ===
    game.cards[b].symbol;

  if (game.turn === "player") {
    game.playerAttempts++;
  }

  await delay(650);

  if (match) {
    game.matched.add(a);
    game.matched.add(b);

    if (game.turn === "player") {
      game.playerScore++;
      game.playerMatches++;
    } else {
      game.opponentScore++;
    }
  }

  game.revealed = [];

  if (
    game.matched.size ===
    game.cards.length
  ) {
    game.finished = true;
    game.busy = false;
    renderMemory();
    return;
  }

  if (!match) {
    game.turn =
      game.turn === "player"
        ? (
            game.mode === "galaxy"
              ? "galaxy"
              : "friend"
          )
        : "player";
  }

  game.busy = false;
  renderMemory();

  if (
    game.mode === "galaxy" &&
    game.turn === "galaxy" &&
    !game.finished
  ) {
    setTimeout(
      memoryGalaxyTurn,
      550
    );
  }
}

function memoryUnknownIndexes() {
  const game = Games.memory;

  return game.cards
    .map((card, index) => index)
    .filter(
      index =>
        !game.matched.has(index)
    );
}

function memoryKnownPair() {
  const game = Games.memory;

  const groups = {};

  for (
    const [indexText, symbol]
    of Object.entries(game.known)
  ) {
    const index =
      Number(indexText);

    if (game.matched.has(index)) {
      continue;
    }

    if (!groups[symbol]) {
      groups[symbol] = [];
    }

    groups[symbol].push(index);
  }

  for (
    const indexes
    of Object.values(groups)
  ) {
    if (indexes.length >= 2) {
      return indexes.slice(0, 2);
    }
  }

  return null;
}

function memoryGalaxyRecallChance() {
  const elo =
    Games.memory.elo;

  if (elo >= 1200) return 0.98;
  if (elo >= 1000) return 0.9;
  if (elo >= 800) return 0.78;
  if (elo >= 500) return 0.58;
  if (elo >= 200) return 0.35;

  return 0.15;
}

async function memoryGalaxyTurn() {
  const game = Games.memory;

  if (
    game.finished ||
    game.mode !== "galaxy" ||
    game.turn !== "galaxy" ||
    game.busy
  ) {
    return;
  }

  game.busy = true;

  let choices = [];

  const rememberedPair =
    memoryKnownPair();

  if (
    rememberedPair &&
    Math.random() <
      memoryGalaxyRecallChance()
  ) {
    choices = rememberedPair;
  } else {
    const available =
      memoryUnknownIndexes();

    const first =
      randomItem(available);

    let secondPool =
      available.filter(
        index => index !== first
      );

    let second = null;

    const knownMatch =
      Object.entries(game.known)
        .find(
          ([indexText, symbol]) =>
            Number(indexText) !== first &&
            !game.matched.has(
              Number(indexText)
            ) &&
            symbol ===
              game.cards[first].symbol
        );

    if (
      knownMatch &&
      Math.random() <
        memoryGalaxyRecallChance()
    ) {
      second =
        Number(knownMatch[0]);
    } else {
      second =
        randomItem(secondPool);
    }

    choices = [first, second];
  }

  game.history.push({
    snapshot: memorySnapshot()
  });

  game.revealed = [choices[0]];
  memoryRemember(choices[0]);
  renderMemory();

  await delay(550);

  game.revealed = choices;
  memoryRemember(choices[1]);
  renderMemory();

  await delay(700);

  const match =
    game.cards[choices[0]].symbol ===
    game.cards[choices[1]].symbol;

  if (match) {
    game.matched.add(choices[0]);
    game.matched.add(choices[1]);

    game.opponentScore++;
  }

  game.revealed = [];

  if (
    game.matched.size ===
    game.cards.length
  ) {
    game.finished = true;
  } else if (!match) {
    game.turn = "player";
  }

  game.busy = false;
  renderMemory();

  if (
    !game.finished &&
    game.turn === "galaxy" &&
    match
  ) {
    setTimeout(
      memoryGalaxyTurn,
      500
    );
  }
}

function memoryHint() {
  const game = Games.memory;

  if (game.finished) return;

  const knownPair =
    memoryKnownPair();

  if (knownPair) {
    game.hints++;

    toast(
      `Hint: cards ${knownPair[0] + 1} and ${knownPair[1] + 1} match.`
    );

    return;
  }

  const available =
    memoryUnknownIndexes();

  if (!available.length) return;

  game.hints++;

  toast(
    `Hint: try card ${randomItem(available) + 1}.`
  );
}

function memoryUndo() {
  const game = Games.memory;

  if (
    game.busy ||
    !game.history.length
  ) {
    toast("Nothing to undo.");
    return;
  }

  const item =
    game.history.pop();

  if (!item?.snapshot) return;

  memoryRestore(
    item.snapshot
  );

  renderMemory();
}

function memoryResign() {
  const game = Games.memory;

  if (game.finished) return;

  game.finished = true;
  game.busy = false;

  renderMemory();
}

function memoryResultText() {
  const game = Games.memory;

  if (!game.finished) {
    return "In progress";
  }

  if (
    game.playerScore >
    game.opponentScore
  ) {
    return "You win";
  }

  if (
    game.playerScore <
    game.opponentScore
  ) {
    return `${opponentName(game.mode)} wins`;
  }

  return "Draw";
}

function memoryReviewHTML() {
  const game = Games.memory;

  const accuracy =
    game.playerAttempts
      ? Math.round(
          game.playerMatches /
          game.playerAttempts *
          100
        )
      : 0;

  return reviewCardHTML(
    "Memory Review",
    [
      ["Your pairs", game.playerScore],
      [
        `${opponentName(game.mode)} pairs`,
        game.opponentScore
      ],
      ["Your attempts", game.playerAttempts],
      ["Match accuracy", `${accuracy}%`],
      ["Hints", game.hints],
      ["Result", memoryResultText()]
    ]
  );
}

function renderMemory() {
  const game = Games.memory;

  const turnName =
    game.turn === "player"
      ? "Your turn"
      : game.mode === "galaxy"
        ? "GALAXY's turn"
        : "Friend's turn";

  const status =
    game.finished
      ? memoryResultText()
      : turnName;

  const toolbar = `
    ${gameModeSelector("memory")}
    ${gameLevelSelector("memory")}
    ${commonGameButtons("memory", {
      hint: true,
      undo: true,
      resign: true,
      review: true
    })}
  `;

  const cards =
    game.cards.map((card, index) => {
      const revealed =
        game.revealed.includes(index);

      const matched =
        game.matched.has(index);

      return `
        <button
          class="
            memory-card
            ${
              revealed || matched
                ? "revealed"
                : ""
            }
            ${
              matched
                ? "matched"
                : ""
            }
          "
          data-memory-card="${index}"
          type="button"
        >
          <span class="back">✦</span>
          <span class="front">
            ${card.symbol}
          </span>
        </button>
      `;
    }).join("");

  setContent(
    "Memory",
    "GALAXY GAMES",
    `
      <div class="game-shell">

        ${gameHeader(
          "Memory",
          status,
          toolbar
        )}

        <div class="scoreboard">

          <div class="scorebox">
            <span>You</span>
            <strong>
              ${game.playerScore}
            </strong>
          </div>

          <div class="scorebox">
            <span>
              ${opponentName(game.mode)}
            </span>
            <strong>
              ${game.opponentScore}
            </strong>
          </div>

          <div class="scorebox">
            <span>Pairs left</span>
            <strong>
              ${
                8 -
                game.matched.size / 2
              }
            </strong>
          </div>

          <div class="scorebox">
            <span>Hints</span>
            <strong>${game.hints}</strong>
          </div>

        </div>

        <div class="game-layout">

          <div class="memory-board">
            ${cards}
          </div>

          <div class="game-side-panel">

            <div class="player-card">
              <div class="player-avatar">Y</div>

              <div>
                <strong>You</strong>
                <span>
                  ${game.playerScore} pairs
                </span>
              </div>
            </div>

            <div class="player-card">
              <div class="player-avatar galaxy-avatar">
                ${
                  game.mode === "galaxy"
                    ? "✦"
                    : "F"
                }
              </div>

              <div>
                <strong>
                  ${opponentName(game.mode)}
                </strong>

                <span>
                  ${
                    game.mode === "galaxy"
                      ? `${game.elo} ELO memory`
                      : `${game.opponentScore} pairs`
                  }
                </span>
              </div>
            </div>

            ${
              game.reviewOpen
                ? memoryReviewHTML()
                : ""
            }

          </div>

        </div>
      </div>
    `
  );
}


/* =========================================================
   SHOOTING GAME
   ========================================================= */

function stopShooterTimers() {
  const game = Games.shooter;

  if (game.timer) {
    clearInterval(game.timer);
    game.timer = null;
  }

  if (game.galaxyTimer) {
    clearInterval(game.galaxyTimer);
    game.galaxyTimer = null;
  }
}

function resetShooter(render = true) {
  const game = Games.shooter;

  stopShooterTimers();

  game.running = false;
  game.finished = false;
  game.time = 30;
  game.playerScore = 0;
  game.opponentScore = 0;
  game.shots = 0;
  game.hits = 0;
  game.misses = 0;
  game.streak = 0;
  game.bestStreak = 0;
  game.target = null;
  game.friendTurn = 1;
  game.friendScores = [0, 0];

  game.friendStats = [
    {
      shots: 0,
      hits: 0,
      misses: 0,
      bestStreak: 0
    },
    {
      shots: 0,
      hits: 0,
      misses: 0,
      bestStreak: 0
    }
  ];

  game.reviewOpen = false;

  renderShooter();
}

function shooterDifficulty() {
  const elo =
    Games.shooter.elo;

  if (elo >= 1200) {
    return {
      interval: 650,
      hitChance: 0.9,
      targetSize: 44
    };
  }

  if (elo >= 1000) {
    return {
      interval: 800,
      hitChance: 0.8,
      targetSize: 48
    };
  }

  if (elo >= 800) {
    return {
      interval: 950,
      hitChance: 0.7,
      targetSize: 50
    };
  }

  if (elo >= 500) {
    return {
      interval: 1150,
      hitChance: 0.58,
      targetSize: 54
    };
  }

  if (elo >= 200) {
    return {
      interval: 1400,
      hitChance: 0.4,
      targetSize: 58
    };
  }

  return {
    interval: 1650,
    hitChance: 0.25,
    targetSize: 64
  };
}

function shooterNewTarget() {
  const game = Games.shooter;

  const stage =
    $(".shooting-stage");

  if (
    !stage ||
    !game.running
  ) {
    return;
  }

  const rect =
    stage.getBoundingClientRect();

  const difficulty =
    shooterDifficulty();

  const size =
    difficulty.targetSize;

  const maxX =
    Math.max(
      0,
      rect.width - size - 20
    );

  const maxY =
    Math.max(
      0,
      rect.height - size - 20
    );

  game.target = {
    x:
      10 +
      Math.random() * maxX,
    y:
      10 +
      Math.random() * maxY,
    size
  };

  renderShooter();
}

function startShooter() {
  const game = Games.shooter;

  if (game.running) return;

  if (game.finished) {
    resetShooter();
  }

  game.running = true;
  game.finished = false;
  game.time = 30;

  shooterNewTarget();

  game.timer =
    setInterval(() => {
      game.time--;

      if (game.time <= 0) {
        finishShooter();
        return;
      }

      const timerEl =
        $("[data-shooter-time]");

      if (timerEl) {
        timerEl.textContent =
          game.time;
      }
    }, 1000);

  if (game.mode === "galaxy") {
    startGalaxyShooterAI();
  }

  renderShooter();
}

function startGalaxyShooterAI() {
  const game = Games.shooter;

  if (
    game.mode !== "galaxy" ||
    !game.running
  ) {
    return;
  }

  if (game.galaxyTimer) {
    clearInterval(
      game.galaxyTimer
    );
  }

  const difficulty =
    shooterDifficulty();

  game.galaxyTimer =
    setInterval(() => {
      if (
        !game.running ||
        game.mode !== "galaxy"
      ) {
        return;
      }

      if (
        Math.random() <
        difficulty.hitChance
      ) {
        game.opponentScore += 10;

        shooterGalaxyEffect();
        shooterNewTarget();
      }
    }, difficulty.interval);
}

function shooterGalaxyEffect() {
  const stage =
    $(".shooting-stage");

  if (!stage) return;

  const effect =
    document.createElement("span");

  effect.className =
    "galaxy-shot";

  effect.style.left =
    `${20 + Math.random() * 70}%`;

  effect.style.top =
    `${15 + Math.random() * 70}%`;

  stage.appendChild(effect);

  setTimeout(
    () => effect.remove(),
    400
  );
}

function shooterHit(event) {
  const game = Games.shooter;

  if (!game.running) return;

  event.preventDefault();
  event.stopPropagation();

  game.shots++;
  game.hits++;
  game.streak++;

  game.bestStreak =
    Math.max(
      game.bestStreak,
      game.streak
    );

  game.playerScore +=
    10 + Math.min(20, game.streak);

  if (game.mode === "friend") {
    game.friendScores[
      game.friendTurn - 1
    ] = game.playerScore;

    const stats =
      game.friendStats[
        game.friendTurn - 1
      ];

    stats.shots = game.shots;
    stats.hits = game.hits;
    stats.misses = game.misses;
    stats.bestStreak =
      game.bestStreak;
  }

  shooterNewTarget();
}

function shooterMiss(event) {
  const game = Games.shooter;

  if (!game.running) return;

  if (
    event.target.closest(
      "[data-shooter-target]"
    )
  ) {
    return;
  }

  game.shots++;
  game.misses++;
  game.streak = 0;

  if (game.mode === "friend") {
    const stats =
      game.friendStats[
        game.friendTurn - 1
      ];

    stats.shots = game.shots;
    stats.hits = game.hits;
    stats.misses = game.misses;
    stats.bestStreak =
      game.bestStreak;
  }

  renderShooter();
}

function finishShooter() {
  const game = Games.shooter;

  stopShooterTimers();

  game.running = false;

  if (
    game.mode === "friend" &&
    game.friendTurn === 1
  ) {
    game.friendScores[0] =
      game.playerScore;

    game.friendStats[0] = {
      shots: game.shots,
      hits: game.hits,
      misses: game.misses,
      bestStreak: game.bestStreak
    };

    game.friendTurn = 2;

    game.time = 30;
    game.playerScore = 0;
    game.shots = 0;
    game.hits = 0;
    game.misses = 0;
    game.streak = 0;
    game.bestStreak = 0;
    game.target = null;

    renderShooter();

    toast(
      "Friend's turn. Press Start Round."
    );

    return;
  }

  if (game.mode === "friend") {
    game.friendScores[1] =
      game.playerScore;

    game.friendStats[1] = {
      shots: game.shots,
      hits: game.hits,
      misses: game.misses,
      bestStreak: game.bestStreak
    };
  }

  game.finished = true;
  game.target = null;

  renderShooter();
}

function shooterResign() {
  const game = Games.shooter;

  if (
    !game.running &&
    !game.finished
  ) {
    return;
  }

  stopShooterTimers();

  game.running = false;
  game.finished = true;
  game.target = null;

  renderShooter();
}

function shooterResultText() {
  const game = Games.shooter;

  if (!game.finished) {
    return "In progress";
  }

  if (game.mode === "galaxy") {
    if (
      game.playerScore >
      game.opponentScore
    ) {
      return "You win";
    }

    if (
      game.playerScore <
      game.opponentScore
    ) {
      return "GALAXY wins";
    }

    return "Draw";
  }

  if (
    game.friendScores[0] >
    game.friendScores[1]
  ) {
    return "You win";
  }

  if (
    game.friendScores[0] <
    game.friendScores[1]
  ) {
    return "Friend wins";
  }

  return "Draw";
}

function shooterReviewHTML() {
  const game = Games.shooter;

  if (game.mode === "friend") {
    const p1 =
      game.friendStats[0];

    const p2 =
      game.friendStats[1];

    const accuracy1 =
      p1.shots
        ? Math.round(
            p1.hits /
            p1.shots *
            100
          )
        : 0;

    const accuracy2 =
      p2.shots
        ? Math.round(
            p2.hits /
            p2.shots *
            100
          )
        : 0;

    return reviewCardHTML(
      "Shooting Review",
      [
        ["Your score", game.friendScores[0]],
        ["Friend score", game.friendScores[1]],
        ["Your accuracy", `${accuracy1}%`],
        ["Friend accuracy", `${accuracy2}%`],
        ["Your best streak", p1.bestStreak],
        ["Friend best streak", p2.bestStreak],
        ["Result", shooterResultText()]
      ]
    );
  }

  const accuracy =
    game.shots
      ? Math.round(
          game.hits /
          game.shots *
          100
        )
      : 0;

  return reviewCardHTML(
    "Shooting Review",
    [
      ["Your score", game.playerScore],
      ["GALAXY score", game.opponentScore],
      ["Shots", game.shots],
      ["Hits", game.hits],
      ["Misses", game.misses],
      ["Accuracy", `${accuracy}%`],
      ["Best streak", game.bestStreak],
      ["Result", shooterResultText()]
    ]
  );
}

function renderShooter() {
  const game = Games.shooter;

  let status =
    game.running
      ? game.mode === "friend"
        ? `Player ${game.friendTurn} shooting`
        : "Target active"
      : game.finished
        ? shooterResultText()
        : game.mode === "friend"
          ? game.friendTurn === 1
            ? "Your round"
            : "Friend's round"
          : "Ready";

  const toolbar = `
    ${gameModeSelector("shooter")}
    ${gameLevelSelector("shooter")}

    <button
      class="primary-btn"
      data-game-command="shooter:start"
      type="button"
    >
      ${
        game.running
          ? "Running"
          : "Start Round"
      }
    </button>

    <button
      class="secondary-btn"
      data-game-command="shooter:resign"
      type="button"
    >
      End
    </button>

    <button
      class="secondary-btn"
      data-game-command="shooter:review"
      type="button"
    >
      Review
    </button>

    <button
      class="secondary-btn"
      data-game-command="shooter:reset"
      type="button"
    >
      New Game
    </button>
  `;

  const opponentScore =
    game.mode === "galaxy"
      ? game.opponentScore
      : game.friendScores[1];

  setContent(
    "GALAXY Shooting",
    "GALAXY GAMES",
    `
      <div class="game-shell">

        ${gameHeader(
          "GALAXY Shooting",
          status,
          toolbar
        )}

        <div class="shooting-hud">

          <div class="scorebox">
            <span>Time</span>
            <strong data-shooter-time>
              ${game.time}
            </strong>
          </div>

          <div class="scorebox">
            <span>
              ${
                game.mode === "friend"
                  ? game.friendTurn === 1
                    ? "Your score"
                    : "Friend score"
                  : "Your score"
              }
            </span>

            <strong>
              ${game.playerScore}
            </strong>
          </div>

          <div class="scorebox">
            <span>
              ${
                game.mode === "galaxy"
                  ? "GALAXY score"
                  : "Your Round 1"
              }
            </span>

            <strong>
              ${
                game.mode === "galaxy"
                  ? opponentScore
                  : game.friendScores[0]
              }
            </strong>
          </div>

          <div class="scorebox">
            <span>Best streak</span>
            <strong>
              ${game.bestStreak}
            </strong>
          </div>

        </div>

        <div class="game-layout">

          <div
            class="shooting-stage"
            data-shooter-arena
          >

            ${
              game.target &&
              game.running
                ? `
                  <button
                    class="shooting-target"
                    data-shooter-target
                    type="button"
                    style="
                      left:${game.target.x}px;
                      top:${game.target.y}px;
                      width:${game.target.size}px;
                      height:${game.target.size}px;
                    "
                    aria-label="Target"
                  ></button>
                `
                : `
                  <div
                    style="
                      height:100%;
                      min-height:500px;
                      display:grid;
                      place-items:center;
                      color:var(--muted);
                      text-align:center;
                      padding:30px;
                    "
                  >
                    ${
                      game.finished
                        ? escapeHTML(
                            shooterResultText()
                          )
                        : "Press Start Round to begin."
                    }
                  </div>
                `
            }

          </div>

          <div class="game-side-panel">

            <div class="game-stat">
              <span>Shots</span>
              <strong>
                ${game.shots}
              </strong>
            </div>

            <div class="game-stat">
              <span>Hits</span>
              <strong>
                ${game.hits}
              </strong>
            </div>

            <div class="game-stat">
              <span>Misses</span>
              <strong>
                ${game.misses}
              </strong>
            </div>

            <div class="game-stat">
              <span>Current streak</span>
              <strong>
                ${game.streak}
              </strong>
            </div>

            ${
              game.reviewOpen
                ? shooterReviewHTML()
                : ""
            }

          </div>

        </div>
      </div>
    `
  );
}


/* =========================================================
   REVIEW CARD
   ========================================================= */

function reviewCardHTML(
  title,
  metrics,
  note = ""
) {
  return `
    <div class="review-card">

      <strong>
        ${escapeHTML(title)}
      </strong>

      <div
        class="review-grid"
        style="margin-top:10px"
      >
        ${metrics.map(
          ([label, value]) => `
            <div class="review-metric">

              <span>
                ${escapeHTML(label)}
              </span>

              <strong>
                ${escapeHTML(value)}
              </strong>

            </div>
          `
        ).join("")}
      </div>

      ${
        note
          ? `
            <p
              style="
                color:var(--muted);
                font-size:11px;
                line-height:1.45;
                margin:10px 0 0;
              "
            >
              ${escapeHTML(note)}
            </p>
          `
          : ""
      }

    </div>
  `;
}


/* =========================================================
   GAME COMMANDS
   ========================================================= */

function handleGameCommand(
  gameName,
  command
) {
  if (gameName === "chess") {
    if (command === "reset") resetChess();
    if (command === "hint") chessHint();
    if (command === "undo") chessUndo();
    if (command === "resign") chessResign();

    if (command === "review") {
      Games.chess.reviewOpen =
        !Games.chess.reviewOpen;

      renderChess();
    }

    return;
  }

  if (gameName === "ttt") {
    if (command === "reset") resetTTT();
    if (command === "hint") tttHint();
    if (command === "undo") tttUndo();
    if (command === "resign") tttResign();

    if (command === "review") {
      Games.ttt.reviewOpen =
        !Games.ttt.reviewOpen;

      renderTTT();
    }

    return;
  }

  if (gameName === "connect") {
    if (command === "reset") resetConnect();
    if (command === "hint") connectHint();
    if (command === "undo") connectUndo();
    if (command === "resign") connectResign();

    if (command === "review") {
      Games.connect.reviewOpen =
        !Games.connect.reviewOpen;

      renderConnect();
    }

    return;
  }

  if (gameName === "memory") {
    if (command === "reset") resetMemory();
    if (command === "hint") memoryHint();
    if (command === "undo") memoryUndo();
    if (command === "resign") memoryResign();

    if (command === "review") {
      Games.memory.reviewOpen =
        !Games.memory.reviewOpen;

      renderMemory();
    }

    return;
  }

  if (gameName === "shooter") {
    if (command === "reset") resetShooter();
    if (command === "start") startShooter();
    if (command === "resign") shooterResign();

    if (command === "review") {
      Games.shooter.reviewOpen =
        !Games.shooter.reviewOpen;

      renderShooter();
    }
  }
}

function changeGameMode(
  gameName,
  mode
) {
  if (!Games[gameName]) return;

  Games[gameName].mode = mode;

  if (gameName === "chess") {
    resetChess();
  }

  if (gameName === "ttt") {
    resetTTT();
  }

  if (gameName === "connect") {
    resetConnect();
  }

  if (gameName === "memory") {
    resetMemory();
  }

  if (gameName === "shooter") {
    resetShooter();
  }
}

function changeGameLevel(
  gameName,
  elo
) {
  if (!Games[gameName]) return;

  Games[gameName].elo =
    Number(elo);

  if (gameName === "chess") {
    resetChess();
  }

  if (gameName === "ttt") {
    resetTTT();
  }

  if (gameName === "connect") {
    resetConnect();
  }

  if (gameName === "memory") {
    resetMemory();
  }

  if (gameName === "shooter") {
    resetShooter();
  }
}


/* =========================================================
   WORK MODE
   ========================================================= */

async function sendWork() {
  const input =
    $("#workPrompt");

  const output =
    $("#workOutput");

  if (
    !input ||
    !output
  ) {
    return;
  }

  const text =
    input.value.trim();

  if (!text) {
    toast(
      "Enter a work request."
    );
    return;
  }

  output.textContent =
    "GALAXY is working…";

  try {
    const provider =
      $("#aiProvider")?.value ||
      "gemini";

    const endpoint =
      provider === "openai"
        ? "/api/chat"
        : "/api/gemini";

    const response =
      await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          message: text,
          messages: [
            {
              role: "user",
              content: text
            }
          ]
        })
      });

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        "GALAXY backend error"
      );
    }

    output.textContent =
      data.reply ||
      data.text ||
      data.output ||
      data.message ||
      "No output returned.";
  } catch (error) {
    output.textContent =
      `Error: ${error.message}`;
  }
}


/* =========================================================
   CLICK HANDLER
   ========================================================= */

function handleClick(event) {
  const viewButton =
    event.target.closest(
      "[data-view]"
    );

  if (viewButton) {
    switchView(
      viewButton.dataset.view
    );

    return;
  }

  const gameOpen =
    event.target.closest(
      "[data-game-open]"
    );

  if (gameOpen) {
    openGame(
      gameOpen.dataset.gameOpen
    );

    return;
  }

  const gameBack =
    event.target.closest(
      "[data-game-back]"
    );

  if (gameBack) {
    renderGamesHome();
    return;
  }

  const command =
    event.target.closest(
      "[data-game-command]"
    );

  if (command) {
    const [
      gameName,
      action
    ] =
      command.dataset.gameCommand.split(":");

    handleGameCommand(
      gameName,
      action
    );

    return;
  }

  const chessSquare =
    event.target.closest(
      "[data-chess-square]"
    );

  if (chessSquare) {
    const [row, col] =
      chessSquare.dataset.chessSquare
        .split(",")
        .map(Number);

    chessClickSquare(
      row,
      col
    );

    return;
  }

  const tttCell =
    event.target.closest(
      "[data-ttt-cell]"
    );

  if (tttCell) {
    tttClick(
      Number(
        tttCell.dataset.tttCell
      )
    );

    return;
  }

  const connectColumn =
    event.target.closest(
      "[data-connect-column]"
    );

  if (connectColumn) {
    connectClick(
      Number(
        connectColumn.dataset.connectColumn
      )
    );

    return;
  }

  const memoryCard =
    event.target.closest(
      "[data-memory-card]"
    );

  if (memoryCard) {
    memoryClick(
      Number(
        memoryCard.dataset.memoryCard
      )
    );

    return;
  }

  const shooterTarget =
    event.target.closest(
      "[data-shooter-target]"
    );

  if (shooterTarget) {
    shooterHit(event);
    return;
  }

  const shooterArena =
    event.target.closest(
      "[data-shooter-arena]"
    );

  if (shooterArena) {
    shooterMiss(event);
    return;
  }

  const actionButton =
    event.target.closest(
      "[data-action]"
    );

  if (!actionButton) return;

  const action =
    actionButton.dataset.action;

  if (action === "new-chat") {
    newChat();
    return;
  }

  /*
    IMPORTANT:
    SEND is also directly bound inside bindEvents().
    The direct listener stops propagation.
    This delegated fallback only runs if necessary.
  */
  if (action === "send") {
    sendMessage();
    return;
  }

  if (action === "attach") {
    $("#fileInput")?.click();
    return;
  }

  if (action === "web-search") {
    App.searchEnabled =
      !App.searchEnabled;

    actionButton.classList.toggle(
      "active",
      App.searchEnabled
    );

    toast(
      App.searchEnabled
        ? "Web search enabled"
        : "Web search disabled"
    );

    return;
  }

  if (action === "image") {
    toast(
      "GALAXY Image Studio"
    );

    switchView("studio");
    return;
  }

  if (action === "video") {
    toast(
      "GALAXY Video Studio"
    );

    switchView("studio");
    return;
  }

  if (action === "voice") {
    toast(
      "Voice mode can be connected next."
    );

    return;
  }

  if (action === "send-work") {
    sendWork();
  }
}


/* =========================================================
   CHANGE HANDLER
   ========================================================= */

function handleChange(event) {
  const modeSelect =
    event.target.closest(
      "[data-game-mode]"
    );

  if (modeSelect) {
    changeGameMode(
      modeSelect.dataset.gameMode,
      modeSelect.value
    );

    return;
  }

  const levelSelect =
    event.target.closest(
      "[data-game-level]"
    );

  if (levelSelect) {
    changeGameLevel(
      levelSelect.dataset.gameLevel,
      levelSelect.value
    );
  }
}


/* =========================================================
   KEYBOARD
   ========================================================= */

function handlePromptKeydown(event) {
  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {
    event.preventDefault();
    sendMessage();
  }
}


/* =========================================================
   BIND EVENTS
   ========================================================= */

function bindEvents() {
  /*
    General delegated click handler
  */
  document.addEventListener(
    "click",
    handleClick
  );

  /*
    Game mode + level changes
  */
  document.addEventListener(
    "change",
    handleChange
  );

  /*
    SEND ARROW FIX
    This directly binds the send button.
  */
  const sendButton =
    $("#sendButton");

  if (sendButton) {
    sendButton.type = "button";

    sendButton.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopPropagation();

        sendMessage();
      }
    );
  }

  /*
    Prompt typing
  */
  const promptInput =
    $("#promptInput");

  if (promptInput) {
    promptInput.addEventListener(
      "input",
      autoResizePrompt
    );

    promptInput.addEventListener(
      "keydown",
      handlePromptKeydown
    );
  }

  /*
    File upload
  */
  const fileInput =
    $("#fileInput");

  if (fileInput) {
    fileInput.addEventListener(
      "change",
      event => {
        handleFiles(
          event.target.files
        );

        event.target.value = "";
      }
    );
  }

  /*
    Protect composer if it is inside a form
  */
  const composer =
    $("#composer");

  if (
    composer &&
    composer.tagName === "FORM"
  ) {
    composer.addEventListener(
      "submit",
      event => {
        event.preventDefault();
        sendMessage();
      }
    );
  }
}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initGalaxy() {
  bindEvents();

  updateSendButtonState();
  autoResizePrompt();
  renderMessages();

  switchView("chat");

  console.log(
    "GALAXY AI loaded successfully."
  );
}

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initGalaxy
  );
} else {
  initGalaxy();
}
