"use strict";

/* =========================================================
   GALAXY AI — COMPLETE SCRIPT.JS
   PART 1 OF 2
   GEMINI ONLY
   ========================================================= */

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const state = {
  messages: [],
  generating: false,
  attachments: [],
  activeView: "chat"
};

const GAME_LEVELS = [
  { name: "Casual", elo: 100 },
  { name: "Normal", elo: 200 },
  { name: "Fun", elo: 500 },
  { name: "Master", elo: 800 },
  { name: "GM", elo: 1000 },
  { name: "Player", elo: 1200 }
];

const GameCenter = {
  current: null,
  chess: null,
  ttt: null,
  connect: null,
  memory: null,
  shooter: null,
  shooterTimer: null,
  shooterGalaxyTimer: null
};

/* =========================================================
   BASIC UI
   ========================================================= */

function escapeHTML(v = "") {
  return String(v).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function toast(message, type = "") {
  let root = $("#toastRoot");

  if (!root) {
    root = document.createElement("div");
    root.id = "toastRoot";
    root.className = "toast-root";
    document.body.appendChild(root);
  }

  const el = document.createElement("div");

  el.className = `toast ${type}`.trim();
  el.textContent = message;

  root.appendChild(el);

  setTimeout(() => el.remove(), 2600);
}

function setView(name) {
  state.activeView = name;

  $$(".view").forEach(v => {
    v.classList.remove("active-view");
  });

  const map = {
    chat: "#chatView",
    work: "#workView",
    games: "#contentView",
    projects: "#contentView",
    library: "#contentView",
    studio: "#contentView"
  };

  const target = $(map[name] || "#chatView");

  target?.classList.add("active-view");

  $$("[data-view]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === name
    );
  });

  if (name === "games") {
    renderGames();
  }

  if (name === "projects") {
    renderSimplePage(
      "Projects",
      "Your GALAXY projects will appear here."
    );
  }

  if (name === "library") {
    renderSimplePage(
      "Library",
      "Files, images and generated assets."
    );
  }

  if (name === "studio") {
    renderSimplePage(
      "Create Studio",
      "Image and video creative tools."
    );
  }
}

function renderSimplePage(title, text) {
  if ($("#contentTitle")) {
    $("#contentTitle").textContent = title;
  }

  if ($("#contentEyebrow")) {
    $("#contentEyebrow").textContent = "GALAXY";
  }

  if ($("#contentBody")) {
    $("#contentBody").innerHTML = `
      <div class="panel">
        <h3>${escapeHTML(title)}</h3>
        <p>${escapeHTML(text)}</p>
      </div>
    `;
  }
}

function newChat() {
  state.messages = [];

  if ($("#messages")) {
    $("#messages").innerHTML = "";
  }

  $("#chatEmpty")?.classList.remove("hidden");
  $("#promptInput")?.focus();

  setView("chat");
}

function autoResize(el) {
  if (!el) return;

  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
}

/* =========================================================
   CHAT
   ========================================================= */

function renderMessage(role, text) {
  const root = $("#messages");

  if (!root) return;

  $("#chatEmpty")?.classList.add("hidden");

  const row = document.createElement("div");
  row.className = `message ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  row.appendChild(bubble);
  root.appendChild(row);

  row.scrollIntoView({
    behavior: "smooth",
    block: "end"
  });
}

function updateSendButtonState() {
  const button = $("#sendButton");

  if (!button) return;

  button.textContent = state.generating ? "■" : "↑";

  button.classList.toggle(
    "is-stop",
    state.generating
  );

  button.setAttribute(
    "aria-label",
    state.generating ? "Stop" : "Send"
  );
}

/* =========================================================
   GEMINI AI
   ========================================================= */

async function fetchAIResponse(message) {
  const creatorContext =
    "You are GALAXY AI. " +
    "GALAXY AI was created and founded by Harshavardhan. " +
    "If asked who created, made, founded, designed or owns GALAXY AI, " +
    "answer: Harshavardhan created GALAXY AI. " +
    "GALAXY uses Gemini through an API for AI responses. " +
    "Be helpful, intelligent, clear and concise.";

  const payload = {
    message,
    prompt: message,
    system: creatorContext,

    messages: [
      {
        role: "system",
        content: creatorContext
      },

      ...state.messages
        .slice(-20)
        .map(item => ({
          role: item.role,
          content: item.text
        })),

      {
        role: "user",
        content: message
      }
    ]
  };

  const response = await fetch("/api/gemini", {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify(payload)
  });

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      `Backend error ${response.status}`
    );
  }

  return (
    data.text ||
    data.reply ||
    data.output ||
    data.response ||
    data.message ||
    "GALAXY received your request."
  );
}

async function sendMessage() {
  const input = $("#promptInput");

  if (!input || state.generating) {
    return;
  }

  const text = input.value.trim();

  if (!text) {
    return;
  }

  input.value = "";
  autoResize(input);

  state.messages.push({
    role: "user",
    text
  });

  renderMessage(
    "user",
    text
  );

  state.generating = true;

  updateSendButtonState();

  if ($("#draftState")) {
    $("#draftState").textContent =
      "GALAXY is thinking…";
  }

  try {
    const reply = await fetchAIResponse(text);

    state.messages.push({
      role: "assistant",
      text: reply
    });

    renderMessage(
      "assistant",
      reply
    );

  } catch (error) {
    const message =
      `GALAXY error: ${error.message}`;

    renderMessage(
      "assistant",
      message
    );

    toast(
      error.message,
      "error"
    );

  } finally {
    state.generating = false;

    updateSendButtonState();

    if ($("#draftState")) {
      $("#draftState").textContent =
        "Ready";
    }
  }
}

/* =========================================================
   GAMING CENTER HOME
   ========================================================= */

function renderGames() {
  if ($("#contentTitle")) {
    $("#contentTitle").textContent =
      "Gaming Center";
  }

  if ($("#contentEyebrow")) {
    $("#contentEyebrow").textContent =
      "PLAY WITH GALAXY";
  }

  const body = $("#contentBody");

  if (!body) return;

  body.innerHTML = `
    <div class="games-home">

      <div class="games-hero">

        <div>
          <span class="eyebrow">
            GALAXY GAMING
          </span>

          <h2>
            Choose a game
          </h2>

          <p>
            Play against GALAXY or play with a friend.
          </p>
        </div>

        <div class="games-hero-mark">
          ✦
        </div>

      </div>

      <div class="games-grid">

        ${gameCard(
          "chess",
          "♟",
          "Chess",
          "vs GALAXY or Friend • Levels • Review"
        )}

        ${gameCard(
          "tictactoe",
          "✕○",
          "Tic-Tac-Toe",
          "vs GALAXY or Friend • Levels • Review"
        )}

        ${gameCard(
          "connect4",
          "●●",
          "Connect Four",
          "vs GALAXY or Friend • Levels • Review"
        )}

        ${gameCard(
          "memory",
          "▦",
          "Memory",
          "vs GALAXY or Friend • Levels • Review"
        )}

        ${gameCard(
          "shooter",
          "◎",
          "GALAXY Shooting",
          "Arcade target battle • GALAXY or Friend"
        )}

      </div>

    </div>
  `;
}

function gameCard(id, icon, title, subtitle) {
  return `
    <button
      class="game-card"
      data-game-open="${id}"
    >

      <div class="game-card-visual">
        ${icon}
      </div>

      <div class="game-card-copy">

        <strong>
          ${title}
        </strong>

        <span>
          ${subtitle}
        </span>

      </div>

    </button>
  `;
}

function modeOptions(mode = "galaxy") {
  return `
    <select data-game-mode>

      <option
        value="galaxy"
        ${mode === "galaxy" ? "selected" : ""}
      >
        You vs GALAXY
      </option>

      <option
        value="friend"
        ${mode === "friend" ? "selected" : ""}
      >
        You vs Friend
      </option>

    </select>
  `;
}

function levelOptions(elo = 500) {
  return `
    <select data-game-level>

      ${GAME_LEVELS.map(level => `
        <option
          value="${level.elo}"
          ${level.elo === elo ? "selected" : ""}
        >
          ${level.name} — ${level.elo} ELO
        </option>
      `).join("")}

    </select>
  `;
}

function commonToolbar(game, mode, elo) {
  return `
    <div class="game-toolbar">

      ${modeOptions(mode)}

      ${levelOptions(elo)}

      <button
        class="secondary-btn"
        data-${game}-hint
      >
        Hint
      </button>

      <button
        class="secondary-btn"
        data-${game}-undo
      >
        Undo
      </button>

      <button
        class="secondary-btn"
        data-${game}-resign
      >
        Resign / End
      </button>

      <button
        class="secondary-btn"
        data-${game}-review
      >
        Game Review
      </button>

      <button
        class="primary-btn"
        data-${game}-reset
      >
        New Game
      </button>

    </div>
  `;
}

function reviewHTML(title, items, note = "") {
  return `
    <div class="review-card">

      <h3>
        ${escapeHTML(title)}
      </h3>

      <div class="review-grid">

        ${items.map(([key, value]) => `
          <div class="review-metric">

            <span>
              ${escapeHTML(key)}
            </span>

            <strong>
              ${escapeHTML(value)}
            </strong>

          </div>
        `).join("")}

      </div>

      ${
        note
          ? `
            <p style="color:var(--muted);font-size:11px">
              ${escapeHTML(note)}
            </p>
          `
          : ""
      }

    </div>
  `;
}

function opponentName(mode) {
  return mode === "friend"
    ? "Friend"
    : "GALAXY";
}

function difficultyChance(elo) {
  return Math.min(
    0.98,
    0.30 + (elo / 1200) * 0.65
  );
}

/* =========================================================
   CHESS
   ========================================================= */

const CHESS = {
  pieces: {
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    p: "♟",

    R: "♖",
    N: "♘",
    B: "♗",
    Q: "♕",
    K: "♔",
    P: "♙"
  },

  values: {
    p: 1,
    n: 3,
    b: 3,
    q: 9,
    r: 5,
    k: 100
  }
};

function chessInitialBoard() {
  return [
    "rnbqkbnr".split(""),
    "pppppppp".split(""),

    ...Array.from(
      { length: 4 },
      () => Array(8).fill("")
    ),

    "PPPPPPPP".split(""),
    "RNBQKBNR".split("")
  ];
}

function resetChess(keepSettings = true) {
  const old = GameCenter.chess || {};

  GameCenter.chess = {
    board: chessInitialBoard(),

    turn: "white",

    selected: null,

    legal: [],

    mode:
      keepSettings
        ? old.mode || "galaxy"
        : "galaxy",

    elo:
      keepSettings
        ? old.elo || 500
        : 500,

    history: [],

    snapshots: [],

    review: {
      best: 0,
      good: 0,
      mistakes: 0,
      blunders: 0,
      hints: 0
    },

    finished: false,

    message: "Your turn"
  };

  renderChess();
}

function isWhitePiece(piece) {
  return (
    piece &&
    piece === piece.toUpperCase()
  );
}

function sameColor(a, b) {
  return (
    a &&
    b &&
    isWhitePiece(a) === isWhitePiece(b)
  );
}

function chessMoves(board, r, c) {
  const piece = board[r][c];

  if (!piece) {
    return [];
  }

  const white =
    isWhitePiece(piece);

  const type =
    piece.toLowerCase();

  const moves = [];

  const add = (rr, cc) => {
    if (
      rr < 0 ||
      rr > 7 ||
      cc < 0 ||
      cc > 7
    ) {
      return false;
    }

    if (!board[rr][cc]) {
      moves.push([
        rr,
        cc
      ]);

      return true;
    }

    if (
      !sameColor(
        piece,
        board[rr][cc]
      )
    ) {
      moves.push([
        rr,
        cc
      ]);
    }

    return false;
  };

  if (type === "p") {
    const direction =
      white ? -1 : 1;

    const start =
      white ? 6 : 1;

    if (
      r + direction >= 0 &&
      r + direction < 8 &&
      !board[r + direction][c]
    ) {
      moves.push([
        r + direction,
        c
      ]);

      if (
        r === start &&
        !board[r + 2 * direction][c]
      ) {
        moves.push([
          r + 2 * direction,
          c
        ]);
      }
    }

    [-1, 1].forEach(dc => {
      const rr =
        r + direction;

      const cc =
        c + dc;

      if (
        rr >= 0 &&
        rr < 8 &&
        cc >= 0 &&
        cc < 8 &&
        board[rr][cc] &&
        !sameColor(
          piece,
          board[rr][cc]
        )
      ) {
        moves.push([
          rr,
          cc
        ]);
      }
    });
  }

  if (type === "n") {
    [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2]
    ].forEach(([dr, dc]) => {
      add(
        r + dr,
        c + dc
      );
    });
  }

  if (type === "k") {
    for (
      let dr = -1;
      dr <= 1;
      dr++
    ) {
      for (
        let dc = -1;
        dc <= 1;
        dc++
      ) {
        if (dr || dc) {
          add(
            r + dr,
            c + dc
          );
        }
      }
    }
  }

  if (
    "rbq".includes(type)
  ) {
    const directions = [];

    if (
      "rq".includes(type)
    ) {
      directions.push(
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      );
    }

    if (
      "bq".includes(type)
    ) {
      directions.push(
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1]
      );
    }

    directions.forEach(([dr, dc]) => {
      let rr =
        r + dr;

      let cc =
        c + dc;

      while (
        rr >= 0 &&
        rr < 8 &&
        cc >= 0 &&
        cc < 8
      ) {
        if (!add(rr, cc)) {
          break;
        }

        rr += dr;
        cc += dc;
      }
    });
  }

  return moves;
}

function allChessMoves(side) {
  const game = GameCenter.chess;
  const result = [];

  game.board.forEach((row, r) => {
    row.forEach((piece, c) => {
      if (
        piece &&
        (
          side === "white"
            ? isWhitePiece(piece)
            : !isWhitePiece(piece)
        )
      ) {
        chessMoves(
          game.board,
          r,
          c
        ).forEach(([rr, cc]) => {
          result.push({
            from: [r, c],
            to: [rr, cc],
            piece,
            target:
              game.board[rr][cc]
          });
        });
      }
    });
  });

  return result;
}

function chessNotation(move) {
  const files =
    "abcdefgh";

  return (
    `${move.piece}` +
    `${files[move.from[1]]}` +
    `${8 - move.from[0]}` +
    `-` +
    `${files[move.to[1]]}` +
    `${8 - move.to[0]}`
  );
}

function scoreChessMove(move) {
  let score = 0;

  if (move.target) {
    score +=
      (
        CHESS.values[
          move.target.toLowerCase()
        ] || 0
      ) * 10;
  }

  const center =
    Math.abs(
      3.5 - move.to[0]
    ) +
    Math.abs(
      3.5 - move.to[1]
    );

  score +=
    Math.max(
      0,
      7 - center
    );

  if (
    move.piece.toLowerCase() === "p" &&
    (
      move.to[0] === 0 ||
      move.to[0] === 7
    )
  ) {
    score += 80;
  }

  return score;
}

function applyChessMove(
  move,
  actor = "You"
) {
  const game =
    GameCenter.chess;

  game.snapshots.push(
    JSON.parse(
      JSON.stringify({
        board: game.board,
        turn: game.turn,
        history: game.history,
        review: game.review,
        finished: game.finished,
        message: game.message
      })
    )
  );

  const beforeScore =
    scoreChessMove(move);

  game.board[
    move.to[0]
  ][
    move.to[1]
  ] =
    move.piece;

  game.board[
    move.from[0]
  ][
    move.from[1]
  ] =
    "";

  if (
    move.piece === "P" &&
    move.to[0] === 0
  ) {
    game.board[
      move.to[0]
    ][
      move.to[1]
    ] =
      "Q";
  }

  if (
    move.piece === "p" &&
    move.to[0] === 7
  ) {
    game.board[
      move.to[0]
    ][
      move.to[1]
    ] =
      "q";
  }

  game.history.push(
    `${actor}: ${chessNotation(move)}`
  );

  if (actor === "You") {
    const options =
      allChessMoves("white")
        .map(scoreChessMove);

    const best =
      Math.max(
        beforeScore,
        ...options,
        0
      );

    if (
      beforeScore >= best - 1
    ) {
      game.review.best++;

    } else if (
      beforeScore >= best - 4
    ) {
      game.review.good++;

    } else if (
      beforeScore >= best - 10
    ) {
      game.review.mistakes++;

    } else {
      game.review.blunders++;
    }
  }

  game.selected = null;
  game.legal = [];

  game.turn =
    game.turn === "white"
      ? "black"
      : "white";

  const allPieces =
    game.board.flat();

  if (
    !allPieces.includes("K") ||
    !allPieces.includes("k")
  ) {
    game.finished = true;

    const whiteKing =
      allPieces.includes("K");

    game.message =
      whiteKing
        ? "🏆 You Win!"
        : `🏆 ${opponentName(game.mode)} Wins!`;
  }
}

function galaxyChessMove() {
  const game =
    GameCenter.chess;

  if (
    !game ||
    game.finished ||
    game.mode !== "galaxy" ||
    game.turn !== "black"
  ) {
    return;
  }

  const moves =
    allChessMoves("black");

  if (!moves.length) {
    game.finished = true;
    game.message = "🤝 Draw Game";

    renderChess();
    return;
  }

  moves.sort(
    (a, b) =>
      scoreChessMove(b) -
      scoreChessMove(a)
  );

  const smart =
    Math.random() <
    difficultyChance(
      game.elo
    );

  const pick =
    smart
      ? moves[
          Math.floor(
            Math.random() *
            Math.min(
              3,
              moves.length
            )
          )
        ]
      : moves[
          Math.floor(
            Math.random() *
            moves.length
          )
        ];

  applyChessMove(
    pick,
    "GALAXY"
  );

  game.message =
    game.finished
      ? game.message
      : "Your turn";

  renderChess();
}

function clickChessSquare(r, c) {
  const game =
    GameCenter.chess;

  if (
    !game ||
    game.finished
  ) {
    return;
  }

  const humanSide =
    game.mode === "friend"
      ? game.turn
      : "white";

  if (
    game.mode === "galaxy" &&
    game.turn !== "white"
  ) {
    return;
  }

  if (game.selected) {
    const allowed =
      game.legal.find(
        pos =>
          pos[0] === r &&
          pos[1] === c
      );

    if (allowed) {
      const [
        fromR,
        fromC
      ] =
        game.selected;

      const piece =
        game.board[fromR][fromC];

      const move = {
        from: [
          fromR,
          fromC
        ],

        to: [
          r,
          c
        ],

        piece,

        target:
          game.board[r][c]
      };

      applyChessMove(
        move,

        game.mode === "friend"
          ? (
              game.turn === "white"
                ? "Player 1"
                : "Friend"
            )
          : "You"
      );

      game.message =
        game.finished
          ? game.message
          : (
              game.mode === "friend"
                ? `${
                    game.turn === "white"
                      ? "Player 1"
                      : "Friend"
                  } turn`
                : "GALAXY is thinking…"
            );

      renderChess();

      if (
        game.mode === "galaxy" &&
        !game.finished
      ) {
        setTimeout(
          galaxyChessMove,
          350
        );
      }

      return;
    }
  }

  const piece =
    game.board[r][c];

  if (
    piece &&
    (
      (
        humanSide === "white" &&
        isWhitePiece(piece)
      ) ||
      (
        humanSide === "black" &&
        !isWhitePiece(piece)
      )
    )
  ) {
    game.selected = [
      r,
      c
    ];

    game.legal =
      chessMoves(
        game.board,
        r,
        c
      );

  } else {
    game.selected = null;
    game.legal = [];
  }

  renderChess();
}

function renderChess() {
  const game =
    GameCenter.chess ||
    (
      resetChess(),
      GameCenter.chess
    );

  GameCenter.current =
    "chess";

  const files =
    "abcdefgh";

  const body =
    $("#contentBody");

  if (!body) return;

  body.innerHTML = `
    <div class="game-shell">

      <div class="game-topline">

        <button
          class="secondary-btn"
          data-game-back
        >
          ← Games
        </button>

        <div class="game-status">
          ${escapeHTML(game.message)}
        </div>

        ${commonToolbar(
          "chess",
          game.mode,
          game.elo
        )}

      </div>

      <div class="game-layout">

        <div class="chess-board-wrap">

          <div class="chess-board">

            ${
              game.board
                .map((row, r) =>
                  row.map((piece, c) => {
                    const selected =
                      game.selected?.[0] === r &&
                      game.selected?.[1] === c;

                    const legal =
                      game.legal.some(
                        pos =>
                          pos[0] === r &&
                          pos[1] === c
                      );

                    const capture =
                      legal &&
                      !!piece;

                    return `
                      <button
                        class="
                          chess-square
                          ${(r + c) % 2 ? "dark" : "light"}
                          ${selected ? "selected" : ""}
                          ${legal ? "legal" : ""}
                          ${capture ? "capture" : ""}
                        "
                        data-chess-square="${r},${c}"
                      >
                        ${CHESS.pieces[piece] || ""}
                      </button>
                    `;
                  }).join("")
                )
                .join("")
            }

          </div>

          <div class="chess-files">

            ${
              files
                .split("")
                .map(
                  file =>
                    `<span>${file}</span>`
                )
                .join("")
            }

          </div>

        </div>

        <div class="game-side-panel">

          <div class="player-card">

            <div class="player-avatar">
              Y
            </div>

            <div>

              <strong>
                Player 1 / You
              </strong>

              <span>
                White
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
                Black
                ${
                  game.mode === "galaxy"
                    ? ` • ${game.elo} ELO`
                    : ""
                }
              </span>

            </div>

          </div>

          <div class="move-history">

            <strong>
              Moves
            </strong>

            <div class="move-history-list">

              ${
                game.history.length
                  ? game.history
                      .map(
                        move =>
                          `<div>${escapeHTML(move)}</div>`
                      )
                      .join("")
                  : "No moves yet"
              }

            </div>

          </div>

          <div id="gameReview">
          </div>

        </div>

      </div>

    </div>
  `;

  syncGameSelectors(game);
}

function chessHint() {
  const game =
    GameCenter.chess;

  if (
    !game ||
    game.finished
  ) {
    return;
  }

  const side =
    game.mode === "galaxy"
      ? "white"
      : game.turn;

  const moves =
    allChessMoves(side)
      .sort(
        (a, b) =>
          scoreChessMove(b) -
          scoreChessMove(a)
      );

  if (moves[0]) {
    game.review.hints++;

    toast(
      `Hint: ${chessNotation(moves[0])}`
    );
  }
}

function chessUndo() {
  const game =
    GameCenter.chess;

  if (
    !game?.snapshots.length
  ) {
    return toast(
      "Nothing to undo"
    );
  }

  let snapshot =
    game.snapshots.pop();

  if (
    game.mode === "galaxy" &&
    game.turn === "white" &&
    game.snapshots.length
  ) {
    snapshot =
      game.snapshots.pop();
  }

  Object.assign(
    game,
    snapshot,
    {
      selected: null,
      legal: []
    }
  );

  renderChess();
}

function chessReview() {
  const game =
    GameCenter.chess;

  const total =
    game.review.best +
    game.review.good +
    game.review.mistakes +
    game.review.blunders;

  const accuracy =
    total
      ? Math.max(
          0,
          Math.round(
            (
              game.review.best * 100 +
              game.review.good * 85 +
              game.review.mistakes * 55
            ) /
            total
          )
        )
      : 0;

  const review =
    $("#gameReview");

  if (!review) return;

  review.innerHTML =
    reviewHTML(
      "Game Review",

      [
        [
          "Estimated accuracy",
          `${accuracy}%`
        ],

        [
          "Best moves",
          String(
            game.review.best
          )
        ],

        [
          "Good moves",
          String(
            game.review.good
          )
        ],

        [
          "Mistakes",
          String(
            game.review.mistakes
          )
        ],

        [
          "Blunders",
          String(
            game.review.blunders
          )
        ],

        [
          "Hints used",
          String(
            game.review.hints
          )
        ]
      ],

      "GALAXY review is heuristic, not Stockfish-certified."
    );
}

/* =========================================================
   END OF PART 1
   PART 2 MUST BE PASTED DIRECTLY BELOW
   ========================================================= */
/* =========================================================
   PART 2 OF 2
   TIC-TAC-TOE
   ========================================================= */

function resetTTT(keepSettings = true) {
  const old = GameCenter.ttt || {};

  GameCenter.ttt = {
    board: Array(9).fill(""),
    turn: "X",

    mode: keepSettings
      ? old.mode || "galaxy"
      : "galaxy",

    elo: keepSettings
      ? old.elo || 500
      : 500,

    history: [],
    snapshots: [],

    finished: false,
    winner: null,

    message: "Your turn",

    review: {
      moves: 0,
      strong: 0,
      mistakes: 0,
      missedWins: 0,
      blocks: 0,
      hints: 0
    }
  };

  renderTTT();
}

const TTT_WINS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],

  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],

  [0, 4, 8],
  [2, 4, 6]
];

function tttWinner(board) {
  for (const [a, b, c] of TTT_WINS) {
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
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

    const test = [...board];
    test[i] = symbol;

    if (tttWinner(test) === symbol) {
      return i;
    }
  }

  return -1;
}

function tttBestMove(symbol) {
  const game = GameCenter.ttt;
  const board = game.board;

  const winning = tttWinningMove(board, symbol);

  if (winning !== -1) {
    return winning;
  }

  const opponent = symbol === "X" ? "O" : "X";
  const block = tttWinningMove(board, opponent);

  if (block !== -1) {
    return block;
  }

  if (!board[4]) {
    return 4;
  }

  const corners = [0, 2, 6, 8].filter(i => !board[i]);

  if (corners.length) {
    return corners[
      Math.floor(Math.random() * corners.length)
    ];
  }

  const empty = board
    .map((value, index) => value ? null : index)
    .filter(index => index !== null);

  return empty.length
    ? empty[Math.floor(Math.random() * empty.length)]
    : -1;
}

function finishTTT() {
  const game = GameCenter.ttt;
  const winner = tttWinner(game.board);

  if (!winner) {
    return false;
  }

  game.finished = true;
  game.winner = winner;

  if (winner === "draw") {
    game.message = "🤝 Draw Game";
  } else if (game.mode === "galaxy") {
    game.message =
      winner === "X"
        ? "🏆 You Win!"
        : "🤖 GALAXY Wins!";
  } else {
    game.message =
      winner === "X"
        ? "🏆 Player 1 Wins!"
        : "🏆 Friend Wins!";
  }

  return true;
}

function makeTTTMove(index, actor) {
  const game = GameCenter.ttt;

  if (game.finished || game.board[index]) {
    return false;
  }

  game.snapshots.push(
    JSON.parse(
      JSON.stringify({
        board: game.board,
        turn: game.turn,
        history: game.history,
        finished: game.finished,
        winner: game.winner,
        message: game.message,
        review: game.review
      })
    )
  );

  game.board[index] = game.turn;

  game.history.push(
    `${actor}: ${game.turn} → ${index + 1}`
  );

  if (actor === "You") {
    game.review.moves++;

    const opponentWin = tttWinningMove(
      game.board,
      "O"
    );

    if (opponentWin !== -1) {
      game.review.mistakes++;
    } else {
      game.review.strong++;
    }
  }

  if (finishTTT()) {
    renderTTT();
    return true;
  }

  game.turn =
    game.turn === "X"
      ? "O"
      : "X";

  return true;
}

function clickTTT(index) {
  const game = GameCenter.ttt;

  if (!game || game.finished) {
    return;
  }

  if (
    game.mode === "galaxy" &&
    game.turn !== "X"
  ) {
    return;
  }

  const actor =
    game.mode === "friend"
      ? game.turn === "X"
        ? "Player 1"
        : "Friend"
      : "You";

  if (!makeTTTMove(index, actor)) {
    return;
  }

  if (game.finished) {
    return;
  }

  if (game.mode === "friend") {
    game.message =
      game.turn === "X"
        ? "Player 1 turn"
        : "Friend turn";

    renderTTT();
    return;
  }

  game.message = "GALAXY is thinking…";

  renderTTT();

  setTimeout(
    galaxyTTTMove,
    300
  );
}

function galaxyTTTMove() {
  const game = GameCenter.ttt;

  if (
    !game ||
    game.finished ||
    game.mode !== "galaxy" ||
    game.turn !== "O"
  ) {
    return;
  }

  const empty = game.board
    .map((v, i) => v ? null : i)
    .filter(i => i !== null);

  if (!empty.length) {
    finishTTT();
    renderTTT();
    return;
  }

  let move;

  if (
    Math.random() <
    difficultyChance(game.elo)
  ) {
    move = tttBestMove("O");
  } else {
    move =
      empty[
        Math.floor(
          Math.random() * empty.length
        )
      ];
  }

  makeTTTMove(move, "GALAXY");

  if (!game.finished) {
    game.message = "Your turn";
  }

  renderTTT();
}
/* =========================================================
   PART 2 OF 2
   TIC-TAC-TOE
   ========================================================= */

function resetTTT(keepSettings = true) {
  const old = GameCenter.ttt || {};

  GameCenter.ttt = {
    board: Array(9).fill(""),
    turn: "X",

    mode: keepSettings
      ? old.mode || "galaxy"
      : "galaxy",

    elo: keepSettings
      ? old.elo || 500
      : 500,

    history: [],
    snapshots: [],

    finished: false,
    winner: null,

    message: "Your turn",

    review: {
      moves: 0,
      strong: 0,
      mistakes: 0,
      missedWins: 0,
      blocks: 0,
      hints: 0
    }
  };

  renderTTT();
}

const TTT_WINS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],

  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],

  [0, 4, 8],
  [2, 4, 6]
];

function tttWinner(board) {
  for (const [a, b, c] of TTT_WINS) {
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
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

    const test = [...board];
    test[i] = symbol;

    if (tttWinner(test) === symbol) {
      return i;
    }
  }

  return -1;
}

function tttBestMove(symbol) {
  const game = GameCenter.ttt;
  const board = game.board;

  const winning =
    tttWinningMove(board, symbol);

  if (winning !== -1) {
    return winning;
  }

  const opponent =
    symbol === "X" ? "O" : "X";

  const block =
    tttWinningMove(board, opponent);

  if (block !== -1) {
    return block;
  }

  if (!board[4]) {
    return 4;
  }

  const corners =
    [0, 2, 6, 8].filter(
      i => !board[i]
    );

  if (corners.length) {
    return corners[
      Math.floor(
        Math.random() * corners.length
      )
    ];
  }

  const empty =
    board
      .map((value, index) =>
        value ? null : index
      )
      .filter(index => index !== null);

  return empty.length
    ? empty[
        Math.floor(
          Math.random() * empty.length
        )
      ]
    : -1;
}

function finishTTT() {
  const game = GameCenter.ttt;
  const winner =
    tttWinner(game.board);

  if (!winner) {
    return false;
  }

  game.finished = true;
  game.winner = winner;

  if (winner === "draw") {
    game.message =
      "🤝 Draw Game";

  } else if (game.mode === "galaxy") {
    game.message =
      winner === "X"
        ? "🏆 You Win!"
        : "🤖 GALAXY Wins!";

  } else {
    game.message =
      winner === "X"
        ? "🏆 Player 1 Wins!"
        : "🏆 Friend Wins!";
  }

  return true;
}

function makeTTTMove(index, actor) {
  const game = GameCenter.ttt;

  if (
    game.finished ||
    game.board[index]
  ) {
    return false;
  }

  game.snapshots.push(
    JSON.parse(
      JSON.stringify({
        board: game.board,
        turn: game.turn,
        history: game.history,
        finished: game.finished,
        winner: game.winner,
        message: game.message,
        review: game.review
      })
    )
  );

  game.board[index] =
    game.turn;

  game.history.push(
    `${actor}: ${game.turn} → ${index + 1}`
  );

  if (actor === "You") {
    game.review.moves++;

    const opponentWin =
      tttWinningMove(
        game.board,
        "O"
      );

    if (opponentWin !== -1) {
      game.review.mistakes++;
    } else {
      game.review.strong++;
    }
  }

  if (finishTTT()) {
    renderTTT();
    return true;
  }

  game.turn =
    game.turn === "X"
      ? "O"
      : "X";

  return true;
}

function clickTTT(index) {
  const game = GameCenter.ttt;

  if (
    !game ||
    game.finished
  ) {
    return;
  }

  if (
    game.mode === "galaxy" &&
    game.turn !== "X"
  ) {
    return;
  }

  const actor =
    game.mode === "friend"
      ? (
          game.turn === "X"
            ? "Player 1"
            : "Friend"
        )
      : "You";

  if (
    !makeTTTMove(
      index,
      actor
    )
  ) {
    return;
  }

  if (game.finished) {
    return;
  }

  if (game.mode === "friend") {
    game.message =
      game.turn === "X"
        ? "Player 1 turn"
        : "Friend turn";

    renderTTT();
    return;
  }

  game.message =
    "GALAXY is thinking…";

  renderTTT();

  setTimeout(
    galaxyTTTMove,
    300
  );
}

function galaxyTTTMove() {
  const game = GameCenter.ttt;

  if (
    !game ||
    game.finished ||
    game.mode !== "galaxy" ||
    game.turn !== "O"
  ) {
    return;
  }

  const empty =
    game.board
      .map((v, i) =>
        v ? null : i
      )
      .filter(i => i !== null);

  if (!empty.length) {
    finishTTT();
    renderTTT();
    return;
  }

  let move;

  if (
    Math.random() <
    difficultyChance(game.elo)
  ) {
    move =
      tttBestMove("O");
  } else {
    move =
      empty[
        Math.floor(
          Math.random() *
          empty.length
        )
      ];
  }

  makeTTTMove(
    move,
    "GALAXY"
  );

  if (!game.finished) {
    game.message =
      "Your turn";
  }

  renderTTT();
}

function tttHint() {
  const game = GameCenter.ttt;

  if (
    !game ||
    game.finished
  ) {
    return;
  }

  const symbol =
    game.turn;

  const move =
    tttBestMove(symbol);

  if (move !== -1) {
    game.review.hints++;

    toast(
      `Hint: choose square ${move + 1}`
    );
  }
}

function tttUndo() {
  const game = GameCenter.ttt;

  if (
    !game?.snapshots.length
  ) {
    toast("Nothing to undo");
    return;
  }

  let snapshot =
    game.snapshots.pop();

  if (
    game.mode === "galaxy" &&
    game.turn === "X" &&
    game.snapshots.length
  ) {
    snapshot =
      game.snapshots.pop();
  }

  Object.assign(
    game,
    snapshot
  );

  renderTTT();
}

function tttReview() {
  const game = GameCenter.ttt;

  const total =
    Math.max(
      1,
      game.review.moves
    );

  const accuracy =
    Math.round(
      (
        game.review.strong /
        total
      ) * 100
    );

  const review =
    $("#gameReview");

  if (!review) return;

  review.innerHTML =
    reviewHTML(
      "Tic-Tac-Toe Review",
      [
        [
          "Accuracy",
          `${accuracy}%`
        ],
        [
          "Moves",
          String(game.review.moves)
        ],
        [
          "Strong moves",
          String(game.review.strong)
        ],
        [
          "Mistakes",
          String(game.review.mistakes)
        ],
        [
          "Hints",
          String(game.review.hints)
        ]
      ]
    );
}

function renderTTT() {
  if (!GameCenter.ttt) {
    resetTTT();
    return;
  }

  const game =
    GameCenter.ttt;

  GameCenter.current =
    "tictactoe";

  const body =
    $("#contentBody");

  if (!body) return;

  body.innerHTML = `
    <div class="game-shell">

      <div class="game-topline">

        <button
          class="secondary-btn"
          data-game-back
        >
          ← Games
        </button>

        <div class="game-status">
          ${escapeHTML(game.message)}
        </div>

        ${commonToolbar(
          "ttt",
          game.mode,
          game.elo
        )}

      </div>

      <div class="game-layout">

        <div class="ttt-board">

          ${game.board
            .map(
              (value, index) => `
                <button
                  class="
                    ttt-cell
                    ${
                      value
                        ? `filled ${value.toLowerCase()}`
                        : ""
                    }
                  "
                  data-ttt-cell="${index}"
                >
                  ${value}
                </button>
              `
            )
            .join("")}

        </div>

        <div class="game-side-panel">

          <div class="player-card">

            <div class="player-avatar">
              X
            </div>

            <div>
              <strong>
                ${
                  game.mode === "friend"
                    ? "Player 1"
                    : "You"
                }
              </strong>

              <span>
                X
              </span>
            </div>

          </div>

          <div class="player-card">

            <div class="player-avatar galaxy-avatar">
              O
            </div>

            <div>
              <strong>
                ${opponentName(game.mode)}
              </strong>

              <span>
                O
              </span>
            </div>

          </div>

          ${
            game.finished
              ? `
                <button
                  class="primary-btn"
                  data-ttt-reset
                >
                  Play Again
                </button>
              `
              : ""
          }

          <div id="gameReview">
          </div>

        </div>

      </div>

    </div>
  `;

  syncGameSelectors(game);
}


/* =========================================================
   CONNECT FOUR
   ========================================================= */

const CONNECT_ROWS = 6;
const CONNECT_COLS = 7;

function newConnectBoard() {
  return Array.from(
    { length: CONNECT_ROWS },
    () =>
      Array(CONNECT_COLS)
        .fill("")
  );
}

function resetConnect(
  keepSettings = true
) {
  const old =
    GameCenter.connect || {};

  GameCenter.connect = {
    board:
      newConnectBoard(),

    turn:
      "R",

    mode:
      keepSettings
        ? old.mode || "galaxy"
        : "galaxy",

    elo:
      keepSettings
        ? old.elo || 500
        : 500,

    finished:
      false,

    winner:
      null,

    message:
      "Your turn",

    history:
      [],

    snapshots:
      [],

    review: {
      moves: 0,
      strong: 0,
      mistakes: 0,
      blocks: 0,
      hints: 0
    }
  };

  renderConnect();
}

function connectDropRow(
  board,
  col
) {
  for (
    let row =
      CONNECT_ROWS - 1;
    row >= 0;
    row--
  ) {
    if (!board[row][col]) {
      return row;
    }
  }

  return -1;
}

function connectWinner(board) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  for (
    let r = 0;
    r < CONNECT_ROWS;
    r++
  ) {
    for (
      let c = 0;
      c < CONNECT_COLS;
      c++
    ) {
      const token =
        board[r][c];

      if (!token) continue;

      for (
        const [dr, dc]
        of directions
      ) {
        let count = 1;

        for (
          let k = 1;
          k < 4;
          k++
        ) {
          const rr =
            r + dr * k;

          const cc =
            c + dc * k;

          if (
            rr < 0 ||
            rr >= CONNECT_ROWS ||
            cc < 0 ||
            cc >= CONNECT_COLS ||
            board[rr][cc] !== token
          ) {
            break;
          }

          count++;
        }

        if (count >= 4) {
          return token;
        }
      }
    }
  }

  if (
    board
      .flat()
      .every(Boolean)
  ) {
    return "draw";
  }

  return null;
}

function connectWinningColumn(
  board,
  token
) {
  for (
    let col = 0;
    col < CONNECT_COLS;
    col++
  ) {
    const row =
      connectDropRow(
        board,
        col
      );

    if (row === -1) continue;

    const test =
      board.map(
        row => [...row]
      );

    test[row][col] =
      token;

    if (
      connectWinner(test) ===
      token
    ) {
      return col;
    }
  }

  return -1;
}

function connectBestColumn(
  token
) {
  const game =
    GameCenter.connect;

  const board =
    game.board;

  const winning =
    connectWinningColumn(
      board,
      token
    );

  if (winning !== -1) {
    return winning;
  }

  const enemy =
    token === "R"
      ? "Y"
      : "R";

  const block =
    connectWinningColumn(
      board,
      enemy
    );

  if (block !== -1) {
    return block;
  }

  const preference =
    [3, 2, 4, 1, 5, 0, 6];

  return (
    preference.find(
      col =>
        connectDropRow(
          board,
          col
        ) !== -1
    ) ?? -1
  );
}

function finishConnect() {
  const game =
    GameCenter.connect;

  const winner =
    connectWinner(
      game.board
    );

  if (!winner) {
    return false;
  }

  game.finished =
    true;

  game.winner =
    winner;

  if (winner === "draw") {
    game.message =
      "🤝 Draw Game";

  } else if (
    game.mode === "galaxy"
  ) {
    game.message =
      winner === "R"
        ? "🏆 You Win!"
        : "🤖 GALAXY Wins!";

  } else {
    game.message =
      winner === "R"
        ? "🏆 Player 1 Wins!"
        : "🏆 Friend Wins!";
  }

  return true;
}

function makeConnectMove(
  col,
  actor
) {
  const game =
    GameCenter.connect;

  if (
    !game ||
    game.finished
  ) {
    return false;
  }

  const row =
    connectDropRow(
      game.board,
      col
    );

  if (row === -1) {
    return false;
  }

  game.snapshots.push(
    JSON.parse(
      JSON.stringify({
        board:
          game.board,

        turn:
          game.turn,

        history:
          game.history,

        finished:
          game.finished,

        winner:
          game.winner,

        message:
          game.message,

        review:
          game.review
      })
    )
  );

  game.board[row][col] =
    game.turn;

  game.history.push(
    `${actor}: column ${col + 1}`
  );

  if (actor === "You") {
    game.review.moves++;

    if (
      col === 3 ||
      col === 2 ||
      col === 4
    ) {
      game.review.strong++;
    }
  }

  if (finishConnect()) {
    return true;
  }

  game.turn =
    game.turn === "R"
      ? "Y"
      : "R";

  return true;
}

function clickConnect(col) {
  const game =
    GameCenter.connect;

  if (
    !game ||
    game.finished
  ) {
    return;
  }

  if (
    game.mode === "galaxy" &&
    game.turn !== "R"
  ) {
    return;
  }

  const actor =
    game.mode === "friend"
      ? (
          game.turn === "R"
            ? "Player 1"
            : "Friend"
        )
      : "You";

  if (
    !makeConnectMove(
      col,
      actor
    )
  ) {
    toast(
      "That column is full"
    );

    return;
  }

  if (game.finished) {
    renderConnect();
    return;
  }

  if (
    game.mode === "friend"
  ) {
    game.message =
      game.turn === "R"
        ? "Player 1 turn"
        : "Friend turn";

    renderConnect();
    return;
  }

  game.message =
    "GALAXY is thinking…";

  renderConnect();

  setTimeout(
    galaxyConnectMove,
    350
  );
}

function galaxyConnectMove() {
  const game =
    GameCenter.connect;

  if (
    !game ||
    game.finished ||
    game.mode !== "galaxy" ||
    game.turn !== "Y"
  ) {
    return;
  }

  const available =
    Array.from(
      { length: CONNECT_COLS },
      (_, i) => i
    )
    .filter(
      col =>
        connectDropRow(
          game.board,
          col
        ) !== -1
    );

  if (!available.length) {
    finishConnect();
    renderConnect();
    return;
  }

  let col;

  if (
    Math.random() <
    difficultyChance(
      game.elo
    )
  ) {
    col =
      connectBestColumn("Y");

  } else {
    col =
      available[
        Math.floor(
          Math.random() *
          available.length
        )
      ];
  }

  makeConnectMove(
    col,
    "GALAXY"
  );

  if (!game.finished) {
    game.message =
      "Your turn";
  }

  renderConnect();
}

function connectHint() {
  const game =
    GameCenter.connect;

  if (
    !game ||
    game.finished
  ) {
    return;
  }

  const col =
    connectBestColumn(
      game.turn
    );

  if (col !== -1) {
    game.review.hints++;

    toast(
      `Hint: try column ${col + 1}`
    );
  }
}

function connectUndo() {
  const game =
    GameCenter.connect;

  if (
    !game?.snapshots.length
  ) {
    toast(
      "Nothing to undo"
    );

    return;
  }

  let snapshot =
    game.snapshots.pop();

  if (
    game.mode === "galaxy" &&
    game.turn === "R" &&
    game.snapshots.length
  ) {
    snapshot =
      game.snapshots.pop();
  }

  Object.assign(
    game,
    snapshot
  );

  renderConnect();
}

function connectReview() {
  const game =
    GameCenter.connect;

  const total =
    Math.max(
      1,
      game.review.moves
    );

  const accuracy =
    Math.round(
      (
        game.review.strong /
        total
      ) * 100
    );

  const review =
    $("#gameReview");

  if (!review) return;

  review.innerHTML =
    reviewHTML(
      "Connect Four Review",
      [
        [
          "Accuracy",
          `${accuracy}%`
        ],
        [
          "Moves",
          String(
            game.review.moves
          )
        ],
        [
          "Strong moves",
          String(
            game.review.strong
          )
        ],
        [
          "Blocks",
          String(
            game.review.blocks
          )
        ],
        [
          "Mistakes",
          String(
            game.review.mistakes
          )
        ],
        [
          "Hints",
          String(
            game.review.hints
          )
        ]
      ]
    );
}

function renderConnect() {
  if (!GameCenter.connect) {
    resetConnect();
    return;
  }

  const game =
    GameCenter.connect;

  GameCenter.current =
    "connect4";

  const body =
    $("#contentBody");

  if (!body) return;

  body.innerHTML = `
    <div class="game-shell">

      <div class="game-topline">

        <button
          class="secondary-btn"
          data-game-back
        >
          ← Games
        </button>

        <div class="game-status">
          ${escapeHTML(game.message)}
        </div>

        ${commonToolbar(
          "connect",
          game.mode,
          game.elo
        )}

      </div>

      <div class="game-layout">

        <div class="connect-board">

          ${game.board
            .map(
              (row, r) =>
                row.map(
                  (value, c) => `
                    <button
                      class="connect-cell"
                      data-connect-col="${c}"
                    >
                      <span
                        class="
                          connect-disc
                          ${
                            value === "R"
                              ? "red"
                              : value === "Y"
                              ? "yellow"
                              : ""
                          }
                        "
                      ></span>
                    </button>
                  `
                ).join("")
            )
            .join("")}

        </div>

        <div class="game-side-panel">

          <div class="player-card">
            <div class="player-avatar">
              ●
            </div>

            <div>
              <strong>
                ${
                  game.mode === "friend"
                    ? "Player 1"
                    : "You"
                }
              </strong>

              <span>
                Red
              </span>
            </div>
          </div>

          <div class="player-card">

            <div class="player-avatar galaxy-avatar">
              ●
            </div>

            <div>
              <strong>
                ${opponentName(game.mode)}
              </strong>

              <span>
                Yellow
              </span>
            </div>

          </div>

          ${
            game.finished
              ? `
                <button
                  class="primary-btn"
                  data-connect-reset
                >
                  Play Again
                </button>
              `
              : ""
          }

          <div id="gameReview">
          </div>

        </div>

      </div>

    </div>
  `;

  syncGameSelectors(game);
}


/* =========================================================
   MEMORY GAME
   ========================================================= */

function shuffleArray(array) {
  const result =
    [...array];

  for (
    let i =
      result.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      result[i],
      result[j]
    ] =
    [
      result[j],
      result[i]
    ];
  }

  return result;
}

function resetMemory(
  keepSettings = true
) {
  const old =
    GameCenter.memory || {};

  const symbols = [
    "🚀",
    "🌙",
    "⭐",
    "🪐",
    "👾",
    "🤖",
    "☄️",
    "🌌"
  ];

  const deck =
    shuffleArray([
      ...symbols,
      ...symbols
    ]);

  GameCenter.memory = {
    cards:
      deck.map(
        (symbol, id) => ({
          id,
          symbol,
          open: false,
          matched: false
        })
      ),

    selected: [],

    lock: false,

    mode:
      keepSettings
        ? old.mode || "galaxy"
        : "galaxy",

    elo:
      keepSettings
        ? old.elo || 500
        : 500,

    turn:
      "you",

    youScore:
      0,

    opponentScore:
      0,

    attempts:
      0,

    matches:
      0,

    mismatches:
      0,

    streak:
      0,

    bestStreak:
      0,

    finished:
      false,

    message:
      "Your turn",

    known:
      {}
  };

  renderMemory();
}

function memoryAvailableCards() {
  const game =
    GameCenter.memory;

  return game.cards.filter(
    card =>
      !card.matched &&
      !card.open
  );
}

function finishMemoryIfNeeded() {
  const game =
    GameCenter.memory;

  if (
    !game.cards.every(
      card => card.matched
    )
  ) {
    return false;
  }

  game.finished =
    true;

  if (
    game.youScore >
    game.opponentScore
  ) {
    game.message =
      "🏆 You Win!";

  } else if (
    game.opponentScore >
    game.youScore
  ) {
    game.message =
      game.mode === "galaxy"
        ? "🤖 GALAXY Wins!"
        : "🏆 Friend Wins!";

  } else {
    game.message =
      "🤝 Draw Game";
  }

  return true;
}

function memorySelectCard(id) {
  const game =
    GameCenter.memory;

  if (
    !game ||
    game.finished ||
    game.lock
  ) {
    return;
  }

  if (
    game.mode === "galaxy" &&
    game.turn !== "you"
  ) {
    return;
  }

  const card =
    game.cards[id];

  if (
    !card ||
    card.open ||
    card.matched
  ) {
    return;
  }

  card.open =
    true;

  game.selected.push(id);

  game.known[id] =
    card.symbol;

  renderMemory();

  if (
    game.selected.length === 2
  ) {
    resolveMemoryPair();
  }
}

function resolveMemoryPair() {
  const game =
    GameCenter.memory;

  if (
    game.selected.length !== 2
  ) {
    return;
  }

  game.lock =
    true;

  game.attempts++;

  const [a, b] =
    game.selected;

  const cardA =
    game.cards[a];

  const cardB =
    game.cards[b];

  const match =
    cardA.symbol ===
    cardB.symbol;

  setTimeout(() => {
    if (match) {
      cardA.matched =
        true;

      cardB.matched =
        true;

      game.matches++;
      game.streak++;

      game.bestStreak =
        Math.max(
          game.bestStreak,
          game.streak
        );

      if (
        game.turn === "you"
      ) {
        game.youScore++;

      } else {
        game.opponentScore++;
      }

    } else {
      cardA.open =
        false;

      cardB.open =
        false;

      game.mismatches++;
      game.streak = 0;

      game.turn =
        game.turn === "you"
          ? "opponent"
          : "you";
    }

    game.selected = [];
    game.lock = false;

    if (
      finishMemoryIfNeeded()
    ) {
      renderMemory();
      return;
    }

    if (
      game.mode === "galaxy" &&
      game.turn === "opponent"
    ) {
      game.message =
        "GALAXY is choosing…";

      renderMemory();

      setTimeout(
        galaxyMemoryTurn,
        450
      );

    } else {
      game.message =
        game.turn === "you"
          ? (
              game.mode === "friend"
                ? "Player 1 turn"
                : "Your turn"
            )
          : "Friend turn";

      renderMemory();
    }

  }, 650);
}

function galaxyMemoryTurn() {
  const game =
    GameCenter.memory;

  if (
    !game ||
    game.finished ||
    game.mode !== "galaxy" ||
    game.turn !== "opponent"
  ) {
    return;
  }

  const available =
    memoryAvailableCards();

  if (
    available.length < 2
  ) {
    finishMemoryIfNeeded();
    renderMemory();
    return;
  }

  let first;
  let second;

  const smart =
    Math.random() <
    difficultyChance(
      game.elo
    );

  if (smart) {
    const knownGroups = {};

    for (
      const card
      of available
    ) {
      const symbol =
        game.known[
          card.id
        ];

      if (!symbol) continue;

      if (!knownGroups[symbol]) {
        knownGroups[symbol] = [];
      }

      knownGroups[symbol]
        .push(card);
    }

    const pair =
      Object.values(
        knownGroups
      )
      .find(
        group =>
          group.length >= 2
      );

    if (pair) {
      [
        first,
        second
      ] =
        pair.slice(0, 2);
    }
  }

  if (!first || !second) {
    const shuffled =
      shuffleArray(
        available
      );

    [
      first,
      second
    ] =
      shuffled.slice(0, 2);
  }

  if (
    !first ||
    !second
  ) {
    return;
  }

  first.open = true;

  game.known[first.id] =
    first.symbol;

  renderMemory();

  setTimeout(() => {
    second.open = true;

    game.known[second.id] =
      second.symbol;

    game.selected = [
      first.id,
      second.id
    ];

    renderMemory();

    resolveMemoryPair();

  }, 500);
}

function memoryHint() {
  const game =
    GameCenter.memory;

  if (
    !game ||
    game.finished
  ) {
    return;
  }

  const unmatched =
    game.cards.filter(
      card =>
        !card.matched
    );

  const groups = {};

  unmatched.forEach(card => {
    if (!groups[card.symbol]) {
      groups[card.symbol] = [];
    }

    groups[card.symbol]
      .push(card);
  });

  const pair =
    Object.values(groups)
      .find(
        cards =>
          cards.length >= 2
      );

  if (pair) {
    toast(
      `Hint: cards ${pair[0].id + 1} and ${pair[1].id + 1} match`
    );
  }
}

function memoryReview() {
  const game =
    GameCenter.memory;

  const accuracy =
    game.attempts
      ? Math.round(
          (
            game.matches /
            game.attempts
          ) * 100
        )
      : 0;

  const review =
    $("#gameReview");

  if (!review) return;

  review.innerHTML =
    reviewHTML(
      "Memory Review",
      [
        [
          "Match accuracy",
          `${accuracy}%`
        ],
        [
          "Pairs found",
          String(
            game.matches
          )
        ],
        [
          "Mismatches",
          String(
            game.mismatches
          )
        ],
        [
          "Best streak",
          String(
            game.bestStreak
          )
        ],
        [
          "Your score",
          String(
            game.youScore
          )
        ],
        [
          opponentName(
            game.mode
          ),
          String(
            game.opponentScore
          )
        ]
      ]
    );
}

function renderMemory() {
  if (!GameCenter.memory) {
    resetMemory();
    return;
  }

  const game =
    GameCenter.memory;

  GameCenter.current =
    "memory";

  const body =
    $("#contentBody");

  if (!body) return;

  body.innerHTML = `
    <div class="game-shell">

      <div class="game-topline">

        <button
          class="secondary-btn"
          data-game-back
        >
          ← Games
        </button>

        <div class="game-status">
          ${escapeHTML(game.message)}
        </div>

        <div class="game-toolbar">

          ${modeOptions(
            game.mode
          )}

          ${levelOptions(
            game.elo
          )}

          <button
            class="secondary-btn"
            data-memory-hint
          >
            Hint
          </button>

          <button
            class="secondary-btn"
            data-memory-review
          >
            Game Review
          </button>

          <button
            class="primary-btn"
            data-memory-reset
          >
            New Game
          </button>

        </div>

      </div>

      <div class="game-layout">

        <div class="memory-board">

          ${game.cards
            .map(
              card => `
                <button
                  class="
                    memory-card
                    ${
                      card.open ||
                      card.matched
                        ? "open"
                        : ""
                    }
                    ${
                      card.matched
                        ? "matched"
                        : ""
                    }
                  "
                  data-memory-card="${card.id}"
                >
                  <span class="memory-back">
                    ✦
                  </span>

                  <span class="memory-front">
                    ${card.symbol}
                  </span>
                </button>
              `
            )
            .join("")}

        </div>

        <div class="game-side-panel">

          <div class="score-card">
            <span>
              You
            </span>

            <strong>
              ${game.youScore}
            </strong>
          </div>

          <div class="score-card">
            <span>
              ${opponentName(game.mode)}
            </span>

            <strong>
              ${game.opponentScore}
            </strong>
          </div>

          ${
            game.finished
              ? `
                <button
                  class="primary-btn"
                  data-memory-reset
                >
                  Play Again
                </button>
              `
              : ""
          }

          <div id="gameReview">
          </div>

        </div>

      </div>

    </div>
  `;

  syncGameSelectors(game);
}


/* =========================================================
   SHOOTING GAME
   ========================================================= */

function clearShooterTimers() {
  if (
    GameCenter.shooterTimer
  ) {
    clearInterval(
      GameCenter.shooterTimer
    );
  }

  if (
    GameCenter.shooterGalaxyTimer
  ) {
    clearInterval(
      GameCenter.shooterGalaxyTimer
    );
  }

  GameCenter.shooterTimer =
    null;

  GameCenter.shooterGalaxyTimer =
    null;
}

function resetShooter(
  keepSettings = true
) {
  clearShooterTimers();

  const old =
    GameCenter.shooter || {};

  GameCenter.shooter = {
    mode:
      keepSettings
        ? old.mode || "galaxy"
        : "galaxy",

    elo:
      keepSettings
        ? old.elo || 500
        : 500,

    running:
      false,

    finished:
      false,

    round:
      1,

    activePlayer:
      "you",

    time:
      30,

    targetX:
      50,

    targetY:
      50,

    targetSize:
      56,

    youScore:
      0,

    opponentScore:
      0,

    youShots:
      0,

    youHits:
      0,

    opponentShots:
      0,

    opponentHits:
      0,

    streak:
      0,

    bestStreak:
      0,

    message:
      "Press Start Game"
  };

  renderShooter();
}

function moveShooterTarget() {
  const game =
    GameCenter.shooter;

  game.targetX =
    8 +
    Math.random() * 84;

  game.targetY =
    12 +
    Math.random() * 76;

  game.targetSize =
    38 +
    Math.random() * 32;
}

function shooterStart() {
  const game =
    GameCenter.shooter;

  if (
    !game ||
    game.running
  ) {
    return;
  }

  if (game.finished) {
    resetShooter();
  }

  game.running =
    true;

  game.time =
    30;

  game.activePlayer =
    "you";

  game.message =
    game.mode === "friend"
      ? "Player 1 round"
      : "Shoot the targets!";

  moveShooterTarget();

  renderShooter();

  clearShooterTimers();

  GameCenter.shooterTimer =
    setInterval(
      shooterTick,
      1000
    );

  if (
    game.mode === "galaxy"
  ) {
    startGalaxyShooter();
  }
}

function shooterTick() {
  const game =
    GameCenter.shooter;

  if (
    !game ||
    !game.running
  ) {
    clearShooterTimers();
    return;
  }

  game.time--;

  if (game.time <= 0) {
    if (
      game.mode === "friend" &&
      game.round === 1
    ) {
      game.round = 2;

      game.activePlayer =
        "opponent";

      game.time =
        30;

      game.message =
        "Friend round";

      moveShooterTarget();

      renderShooter();

      return;
    }

    finishShooter();
    return;
  }

  const timer =
    $("#shooterTime");

  if (timer) {
    timer.textContent =
      String(game.time);
  }
}

function startGalaxyShooter() {
  const game =
    GameCenter.shooter;

  const speed =
    Math.max(
      260,
      1000 -
      Math.round(
        game.elo * 0.5
      )
    );

  GameCenter.shooterGalaxyTimer =
    setInterval(() => {
      if (
        !game.running ||
        game.finished
      ) {
        return;
      }

      game.opponentShots++;

      const chance =
        0.25 +
        (
          game.elo /
          1200
        ) * 0.65;

      if (
        Math.random() <
        chance
      ) {
        game.opponentHits++;

        game.opponentScore +=
          Math.random() < 0.15
            ? 2
            : 1;
      }

      updateShooterScoreUI();

    }, speed);
}

function shooterHit() {
  const game =
    GameCenter.shooter;

  if (
    !game ||
    !game.running ||
    game.finished
  ) {
    return;
  }

  if (
    game.mode === "friend" &&
    game.activePlayer === "opponent"
  ) {
    game.opponentShots++;
    game.opponentHits++;
    game.opponentScore++;

  } else {
    game.youShots++;
    game.youHits++;
    game.youScore++;

    game.streak++;

    game.bestStreak =
      Math.max(
        game.bestStreak,
        game.streak
      );
  }

  moveShooterTarget();

  renderShooter();
}

function shooterMiss() {
  const game =
    GameCenter.shooter;

  if (
    !game ||
    !game.running ||
    game.finished
  ) {
    return;
  }

  if (
    game.mode === "friend" &&
    game.activePlayer === "opponent"
  ) {
    game.opponentShots++;

  } else {
    game.youShots++;
    game.streak = 0;
  }

  updateShooterScoreUI();
}

function updateShooterScoreUI() {
  const game =
    GameCenter.shooter;

  const you =
    $("#shooterYouScore");

  const opponent =
    $("#shooterOpponentScore");

  if (you) {
    you.textContent =
      String(
        game.youScore
      );
  }

  if (opponent) {
    opponent.textContent =
      String(
        game.opponentScore
      );
  }
}

function finishShooter() {
  const game =
    GameCenter.shooter;

  clearShooterTimers();

  game.running =
    false;

  game.finished =
    true;

  const scoreText =
    `You ${game.youScore} - ${opponentName(game.mode)} ${game.opponentScore}`;

  if (
    game.youScore >
    game.opponentScore
  ) {
    game.message =
      `🏆 You Win! ${scoreText}`;

  } else if (
    game.opponentScore >
    game.youScore
  ) {
    game.message =
      game.mode === "galaxy"
        ? `🤖 GALAXY Wins! ${scoreText}`
        : `🏆 Friend Wins! ${scoreText}`;

  } else {
    game.message =
      `🤝 Draw Game — ${scoreText}`;
  }

  renderShooter();
}

function shooterReview() {
  const game =
    GameCenter.shooter;

  const accuracy =
    game.youShots
      ? Math.round(
          (
            game.youHits /
            game.youShots
          ) * 100
        )
      : 0;

  const opponentAccuracy =
    game.opponentShots
      ? Math.round(
          (
            game.opponentHits /
            game.opponentShots
          ) * 100
        )
      : 0;

  const review =
    $("#gameReview");

  if (!review) return;

  review.innerHTML =
    reviewHTML(
      "Shooting Review",
      [
        [
          "Your score",
          String(
            game.youScore
          )
        ],
        [
          "Shots",
          String(
            game.youShots
          )
        ],
        [
          "Hits",
          String(
            game.youHits
          )
        ],
        [
          "Accuracy",
          `${accuracy}%`
        ],
        [
          "Best streak",
          String(
            game.bestStreak
          )
        ],
        [
          `${opponentName(game.mode)} score`,
          String(
            game.opponentScore
          )
        ],
        [
          `${opponentName(game.mode)} accuracy`,
          `${opponentAccuracy}%`
        ]
      ]
    );
}

function renderShooter() {
  if (!GameCenter.shooter) {
    resetShooter();
    return;
  }

  const game =
    GameCenter.shooter;

  GameCenter.current =
    "shooter";

  const body =
    $("#contentBody");

  if (!body) return;

  body.innerHTML = `
    <div class="game-shell">

      <div class="game-topline">

        <button
          class="secondary-btn"
          data-game-back
        >
          ← Games
        </button>

        <div class="game-status">
          ${escapeHTML(game.message)}
        </div>

        <div class="game-toolbar">

          ${modeOptions(
            game.mode
          )}

          ${levelOptions(
            game.elo
          )}

          ${
            !game.running
              ? `
                <button
                  class="primary-btn"
                  data-shooter-start
                >
                  ${
                    game.finished
                      ? "Play Again"
                      : "Start Game"
                  }
                </button>
              `
              : `
                <button
                  class="secondary-btn"
                  data-shooter-end
                >
                  End Game
                </button>
              `
          }

          <button
            class="secondary-btn"
            data-shooter-review
          >
            Game Review
          </button>

        </div>

      </div>

      <div class="game-layout">

        <div
          class="shooter-arena"
          data-shooter-arena
        >

          <div class="shooter-hud">

            <span>
              Time:
              <strong id="shooterTime">
                ${game.time}
              </strong>
            </span>

            <span>
              ${
                game.mode === "friend"
                  ? (
                      game.activePlayer === "you"
                        ? "Player 1"
                        : "Friend"
                    )
                  : "You"
              }
            </span>

          </div>

          ${
            game.running
              ? `
                <button
                  class="shoot-target"
                  data-shoot-target
                  style="
                    left:${game.targetX}%;
                    top:${game.targetY}%;
                    width:${game.targetSize}px;
                    height:${game.targetSize}px;
                  "
                  aria-label="Target"
                >
                  ◎
                </button>
              `
              : `
                <div class="shooter-ready">
                  <strong>
                    GALAXY TARGET ARENA
                  </strong>

                  <span>
                    Hit as many targets as you can.
                  </span>
                </div>
              `
          }

        </div>

        <div class="game-side-panel">

          <div class="score-card">

            <span>
              You
            </span>

            <strong id="shooterYouScore">
              ${game.youScore}
            </strong>

          </div>

          <div class="score-card">

            <span>
              ${opponentName(game.mode)}
            </span>

            <strong id="shooterOpponentScore">
              ${game.opponentScore}
            </strong>

          </div>

          <div id="gameReview">
          </div>

        </div>

      </div>

    </div>
  `;

  syncGameSelectors(game);
}


/* =========================================================
   GAME SELECTOR SYNCHRONIZATION
   ========================================================= */

function currentGameObject() {
  switch (
    GameCenter.current
  ) {
    case "chess":
      return GameCenter.chess;

    case "tictactoe":
      return GameCenter.ttt;

    case "connect4":
      return GameCenter.connect;

    case "memory":
      return GameCenter.memory;

    case "shooter":
      return GameCenter.shooter;

    default:
      return null;
  }
}

function syncGameSelectors(game) {
  const mode =
    $("[data-game-mode]");

  const level =
    $("[data-game-level]");

  if (mode) {
    mode.value =
      game.mode;
  }

  if (level) {
    level.value =
      String(
        game.elo
      );

    level.disabled =
      game.mode === "friend";
  }
}

function rerenderCurrentGame() {
  switch (
    GameCenter.current
  ) {
    case "chess":
      renderChess();
      break;

    case "tictactoe":
      renderTTT();
      break;

    case "connect4":
      renderConnect();
      break;

    case "memory":
      renderMemory();
      break;

    case "shooter":
      renderShooter();
      break;
  }
}

function resetCurrentGame() {
  switch (
    GameCenter.current
  ) {
    case "chess":
      resetChess();
      break;

    case "tictactoe":
      resetTTT();
      break;

    case "connect4":
      resetConnect();
      break;

    case "memory":
      resetMemory();
      break;

    case "shooter":
      resetShooter();
      break;
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

  const prompt =
    input.value.trim();

  if (!prompt) {
    return;
  }

  output.textContent =
    "GALAXY is working…";

  try {
    const reply =
      await fetchAIResponse(
        prompt
      );

    output.textContent =
      reply;

  } catch (error) {
    output.textContent =
      `GALAXY error: ${error.message}`;

    toast(
      error.message,
      "error"
    );
  }
}


/* =========================================================
   GLOBAL CLICK HANDLER
   ========================================================= */

document.addEventListener(
  "click",
  event => {

    const target =
      event.target;

    const action =
      target.closest(
        "[data-action]"
      );

    if (action) {
      const type =
        action.dataset.action;

      if (type === "send") {
        event.preventDefault();
        sendMessage();
        return;
      }

      if (
        type === "new-chat"
      ) {
        newChat();
        return;
      }

      if (
        type === "work-send"
      ) {
        sendWork();
        return;
      }
    }


    const view =
      target.closest(
        "[data-view]"
      );

    if (view) {
      setView(
        view.dataset.view
      );

      return;
    }


    const openGame =
      target.closest(
        "[data-game-open]"
      );

    if (openGame) {
      const id =
        openGame.dataset.gameOpen;

      if (id === "chess") {
        resetChess();

      } else if (
        id === "tictactoe"
      ) {
        resetTTT();

      } else if (
        id === "connect4"
      ) {
        resetConnect();

      } else if (
        id === "memory"
      ) {
        resetMemory();

      } else if (
        id === "shooter"
      ) {
        resetShooter();
      }

      return;
    }


    if (
      target.closest(
        "[data-game-back]"
      )
    ) {
      clearShooterTimers();
      renderGames();
      return;
    }


    const chessSquare =
      target.closest(
        "[data-chess-square]"
      );

    if (chessSquare) {
      const [r, c] =
        chessSquare
          .dataset
          .chessSquare
          .split(",")
          .map(Number);

      clickChessSquare(
        r,
        c
      );

      return;
    }


    if (
      target.closest(
        "[data-chess-hint]"
      )
    ) {
      chessHint();
      return;
    }

    if (
      target.closest(
        "[data-chess-undo]"
      )
    ) {
      chessUndo();
      return;
    }

    if (
      target.closest(
        "[data-chess-review]"
      )
    ) {
      chessReview();
      return;
    }

    if (
      target.closest(
        "[data-chess-reset]"
      )
    ) {
      resetChess();
      return;
    }

    if (
      target.closest(
        "[data-chess-resign]"
      )
    ) {
      const game =
        GameCenter.chess;

      if (
        game &&
        !game.finished
      ) {
        game.finished =
          true;

        game.message =
          game.mode === "galaxy"
            ? "🤖 GALAXY Wins!"
            : "🏆 Friend Wins!";

        renderChess();
      }

      return;
    }


    const tttCell =
      target.closest(
        "[data-ttt-cell]"
      );

    if (tttCell) {
      clickTTT(
        Number(
          tttCell.dataset.tttCell
        )
      );

      return;
    }

    if (
      target.closest(
        "[data-ttt-hint]"
      )
    ) {
      tttHint();
      return;
    }

    if (
      target.closest(
        "[data-ttt-undo]"
      )
    ) {
      tttUndo();
      return;
    }

    if (
      target.closest(
        "[data-ttt-review]"
      )
    ) {
      tttReview();
      return;
    }

    if (
      target.closest(
        "[data-ttt-reset]"
      )
    ) {
      resetTTT();
      return;
    }

    if (
      target.closest(
        "[data-ttt-resign]"
      )
    ) {
      const game =
        GameCenter.ttt;

      if (
        game &&
        !game.finished
      ) {
        game.finished =
          true;

        game.message =
          game.mode === "galaxy"
            ? "🤖 GALAXY Wins!"
            : "🏆 Friend Wins!";

        renderTTT();
      }

      return;
    }


    const connectCell =
      target.closest(
        "[data-connect-col]"
      );

    if (connectCell) {
      clickConnect(
        Number(
          connectCell.dataset.connectCol
        )
      );

      return;
    }

    if (
      target.closest(
        "[data-connect-hint]"
      )
    ) {
      connectHint();
      return;
    }

    if (
      target.closest(
        "[data-connect-undo]"
      )
    ) {
      connectUndo();
      return;
    }

    if (
      target.closest(
        "[data-connect-review]"
      )
    ) {
      connectReview();
      return;
    }

    if (
      target.closest(
        "[data-connect-reset]"
      )
    ) {
      resetConnect();
      return;
    }

    if (
      target.closest(
        "[data-connect-resign]"
      )
    ) {
      const game =
        GameCenter.connect;

      if (
        game &&
        !game.finished
      ) {
        game.finished =
          true;

        game.message =
          game.mode === "galaxy"
            ? "🤖 GALAXY Wins!"
            : "🏆 Friend Wins!";

        renderConnect();
      }

      return;
    }


    const memoryCard =
      target.closest(
        "[data-memory-card]"
      );

    if (memoryCard) {
      memorySelectCard(
        Number(
          memoryCard
            .dataset
            .memoryCard
        )
      );

      return;
    }

    if (
      target.closest(
        "[data-memory-hint]"
      )
    ) {
      memoryHint();
      return;
    }

    if (
      target.closest(
        "[data-memory-review]"
      )
    ) {
      memoryReview();
      return;
    }

    if (
      target.closest(
        "[data-memory-reset]"
      )
    ) {
      resetMemory();
      return;
    }


    if (
      target.closest(
        "[data-shooter-start]"
      )
    ) {
      if (
        GameCenter
          .shooter
          ?.finished
      ) {
        resetShooter();

        setTimeout(
          shooterStart,
          50
        );

      } else {
        shooterStart();
      }

      return;
    }

    if (
      target.closest(
        "[data-shooter-end]"
      )
    ) {
      finishShooter();
      return;
    }

    if (
      target.closest(
        "[data-shooter-review]"
      )
    ) {
      shooterReview();
      return;
    }

    if (
      target.closest(
        "[data-shoot-target]"
      )
    ) {
      event.stopPropagation();

      shooterHit();
      return;
    }

    if (
      target.closest(
        "[data-shooter-arena]"
      )
    ) {
      shooterMiss();
      return;
    }
  }
);


/* =========================================================
   GAME MODE / LEVEL CHANGES
   ========================================================= */

document.addEventListener(
  "change",
  event => {

    if (
      event.target.matches(
        "[data-game-mode]"
      )
    ) {
      const game =
        currentGameObject();

      if (!game) return;

      game.mode =
        event.target.value;

      resetCurrentGame();

      return;
    }


    if (
      event.target.matches(
        "[data-game-level]"
      )
    ) {
      const game =
        currentGameObject();

      if (!game) return;

      game.elo =
        Number(
          event.target.value
        );

      rerenderCurrentGame();
    }
  }
);


/* =========================================================
   PROMPT INPUT
   ========================================================= */

function initializePromptInput() {
  const input =
    $("#promptInput");

  if (!input) return;

  input.addEventListener(
    "input",
    () =>
      autoResize(input)
  );

  input.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        sendMessage();
      }
    }
  );
}


/* =========================================================
   SEND BUTTON — DIRECT BACKUP
   ========================================================= */

function initializeSendButton() {
  const button =
    $("#sendButton");

  if (!button) return;

  button.type =
    "button";

  button.onclick =
    event => {

      event.preventDefault();
      event.stopPropagation();

      sendMessage();
    };
}


/* =========================================================
   WORK MODE INITIALIZATION
   ========================================================= */

function initializeWork() {
  const input =
    $("#workPrompt");

  if (input) {
    input.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" &&
          (
            event.ctrlKey ||
            event.metaKey
          )
        ) {
          event.preventDefault();

          sendWork();
        }
      }
    );
  }

  const button =
    $(
      "#workSend, " +
      "[data-work-send]"
    );

  if (button) {
    button.addEventListener(
      "click",
      sendWork
    );
  }
}


/* =========================================================
   GEMINI ONLY
   ========================================================= */

function forceGeminiOnly() {
  const provider =
    $("#aiProvider");

  if (!provider) return;

  const openAI =
    provider.querySelector(
      'option[value="openai"]'
    );

  if (openAI) {
    openAI.remove();
  }

  provider.value =
    "gemini";

  provider.disabled =
    true;

  provider.title =
    "GALAXY AI powered by Gemini";
}


/* =========================================================
   INITIALIZE GALAXY
   ========================================================= */

function initializeGalaxy() {
  forceGeminiOnly();

  initializePromptInput();

  initializeSendButton();

  initializeWork();

  updateSendButtonState();

  const input =
    $("#promptInput");

  if (input) {
    autoResize(input);
  }

  console.log(
    "GALAXY AI initialized — Gemini only"
  );
}


/* =========================================================
   START
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeGalaxy
  );

} else {
  initializeGalaxy();
}


/* =========================================================
   GALAXY GLOBAL API
   ========================================================= */

window.GALAXY = {
  state,

  games:
    GameCenter,

  newChat,

  sendMessage,

  sendWork,

  openGames:
    renderGames,

  openChess:
    () => resetChess(),

  openTicTacToe:
    () => resetTTT(),

  openConnectFour:
    () => resetConnect(),

  openMemory:
    () => resetMemory(),

  openShooter:
    () => resetShooter()
};


/* =========================================================
   END OF GALAXY AI SCRIPT.JS
   PART 1 + PART 2 = COMPLETE SCRIPT
   ========================================================= */
