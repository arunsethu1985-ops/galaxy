"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

const esc = (s = "") =>
  String(s).replace(
    /[&<>"']/g,
    m =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[m]
  );

const store = {
  get(k, f = null) {
    try {
      const v = localStorage.getItem(k);
      return v == null ? f : JSON.parse(v);
    } catch {
      return f;
    }
  },

  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  }
};

const state = {
  messages: [],
  generating: false,
  view: "chat"
};

const GameCenter = {
  current: null,
  snake: null,
  chicken: null,
  pals: null,
  raf: 0,
  cleanup: []
};

const on3D = (el, type, fn, options) => {
  el.addEventListener(type, fn, options);

  GameCenter.cleanup.push(() =>
    el.removeEventListener(type, fn, options)
  );
};

function cleanup3D() {
  cancelAnimationFrame(GameCenter.raf);

  GameCenter.cleanup
    .splice(0)
    .forEach(fn => {
      try {
        fn();
      } catch {}
    });

  try {
    document.exitPointerLock?.();
  } catch {}

  GameCenter.current = null;
}

function toast(msg) {
  const root = $("#toastRoot");

  if (!root) {
    return;
  }

  const el = document.createElement("div");

  el.className = "toast";
  el.textContent = msg;

  root.appendChild(el);

  setTimeout(() => el.remove(), 2200);
}

function setView(name) {
  state.view = name;

  $$(".view").forEach(view =>
    view.classList.remove("active-view")
  );

  const selector =
    {
      chat: "#chatView",
      work: "#workView",
      games: "#contentView",
      projects: "#contentView",
      library: "#contentView",
      studio: "#contentView"
    }[name] || "#chatView";

  $(selector)?.classList.add("active-view");

  $$("[data-view]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === name
    );
  });

  if (name !== "games") {
    cleanup3D();
  }

  if (name === "games") {
    renderGames();
  } else if (
    ["projects", "library", "studio"].includes(name)
  ) {
    simplePage(name);
  }
}

function simplePage(name) {
  const title =
    name[0].toUpperCase() +
    name.slice(1);

  if ($("#contentTitle")) {
    $("#contentTitle").textContent = title;
  }

  if ($("#contentEyebrow")) {
    $("#contentEyebrow").textContent =
      "GALAXY";
  }

  if ($("#contentBody")) {
    $("#contentBody").innerHTML = `
      <div class="panel">

        <h3>${title}</h3>

        <p>
          ${
            name === "projects"
              ? "Your GALAXY projects will appear here."
              : name === "library"
              ? "Files, images and generated assets."
              : "Creative tools."
          }
        </p>

      </div>
    `;
  }
}

function newChat() {
  state.messages = [];

  if ($("#messages")) {
    $("#messages").innerHTML = "";
  }

  $("#chatEmpty")
    ?.classList
    .remove("hidden");

  setView("chat");

  $("#promptInput")
    ?.focus();
}

function autoResize(el) {
  if (!el) return;

  el.style.height = "auto";

  el.style.height =
    Math.min(
      el.scrollHeight,
      180
    ) + "px";
}

function renderMessage(role, text) {
  const root = $("#messages");

  if (!root) {
    return;
  }

  $("#chatEmpty")
    ?.classList
    .add("hidden");

  const row =
    document.createElement("div");

  row.className =
    `message ${role}`;

  const bubble =
    document.createElement("div");

  bubble.className = "bubble";
  bubble.textContent = text;

  row.appendChild(bubble);
  root.appendChild(row);

  row.scrollIntoView({
    block: "end",
    behavior: "smooth"
  });
}

async function fetchAIResponse(
  message,
  useHistory = true
) {
  const system =
    "You are GALAXY AI. " +
    "GALAXY AI was created and founded by Harshavardhan. " +
    "Be helpful, intelligent, clear and concise.";

  const messages = [
    {
      role: "system",
      content: system
    },

    ...(
      useHistory
        ? state.messages
            .slice(0, -1)
            .slice(-20)
            .map(item => ({
              role: item.role,
              content: item.text
            }))
        : []
    ),

    {
      role: "user",
      content: message
    }
  ];

  const response =
    await fetch(
      "/api/gemini",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          message,
          prompt: message,
          mode:
            useHistory
              ? "chat"
              : "work",
          system,
          messages,
          history: messages
        })
      }
    );

  const data =
    await response
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
  const input =
    $("#promptInput");

  if (
    !input ||
    state.generating
  ) {
    return;
  }

  const text =
    input.value.trim();

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

  if ($("#draftState")) {
    $("#draftState").textContent =
      "GALAXY is thinking…";
  }

  try {
    const reply =
      await fetchAIResponse(
        text,
        true
      );

    state.messages.push({
      role: "assistant",
      text: reply
    });

    renderMessage(
      "assistant",
      reply
    );
  } catch (error) {
    renderMessage(
      "assistant",
      "GALAXY error: " +
      error.message
    );
  } finally {
    state.generating = false;

    if ($("#draftState")) {
      $("#draftState").textContent =
        "Ready";
    }
  }
}

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
    output.textContent =
      await fetchAIResponse(
        prompt,
        false
      );
  } catch (error) {
    output.textContent =
      "GALAXY error: " +
      error.message;
  }
}

/* =========================================================
   GAMING CENTER
   ========================================================= */

function gameCard(
  id,
  icon,
  title,
  subtitle
) {
  return `
    <button
      class="game-card"
      data-game-open="${id}"
    >

      <div class="game-card-visual">
        ${icon}
      </div>

      <div class="game-card-copy">
        <strong>${title}</strong>
        <span>${subtitle}</span>
      </div>

    </button>
  `;
}

function renderGames() {
  cleanup3D();

  GameCenter.current = null;

  if ($("#contentTitle")) {
    $("#contentTitle").textContent =
      "Gaming Center";
  }

  if ($("#contentEyebrow")) {
    $("#contentEyebrow").textContent =
      "PLAY WITH GALAXY";
  }

  $("#contentBody").innerHTML = `

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
            Classic games,
            Arena and a creature-survival world.
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
          "Play a simple chess match"
        )}

        ${gameCard(
          "tictactoe",
          "✕○",
          "Tic-Tac-Toe",
          "vs GALAXY or Friend"
        )}

        ${gameCard(
          "connect4",
          "●●",
          "Connect Four",
          "vs GALAXY"
        )}

        ${gameCard(
          "memory",
          "▦",
          "Memory",
          "Match the pairs"
        )}

        ${gameCard(
          "arena",
          "⌖",
          "GALAXY Arena",
          "3D training range"
        )}

        ${gameCard(
          "snake",
          "◉",
          "Snake",
          "Levels and high score"
        )}

        ${gameCard(
          "chicken",
          "🐔",
          "Chicken Crossing",
          "Road and safe grass"
        )}

        ${gameCard(
          "pals",
          "✦",
          "GALAXY PALS",
          "30+ visibly different original creatures"
        )}

      </div>

    </div>
  `;
}

function gameTop(
  title,
  message = ""
) {
  return `
    <div class="game-topline">

      <button
        class="secondary-btn"
        data-game-back
      >
        ← Games
      </button>

      <div class="game-status">
        ${esc(message || title)}
      </div>

    </div>
  `;
}

/* =========================================================
   TIC TAC TOE
   ========================================================= */

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

let ttt = null;

function tttWinner(board) {
  for (
    const [a, b, c]
    of TTT_WINS
  ) {
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a];
    }
  }

  return board.every(Boolean)
    ? "draw"
    : null;
}

function openTTT() {
  ttt = {
    board:
      Array(9).fill(""),
    finished: false,
    message: "Your turn"
  };

  renderTTT();
}

function renderTTT() {
  GameCenter.current =
    "tictactoe";

  $("#contentBody").innerHTML = `
    <div class="game-shell">

      ${gameTop(
        "Tic-Tac-Toe",
        ttt.message
      )}

      <div class="ttt-board">

        ${
          ttt.board
            .map(
              (value, index) => `
                <button
                  class="ttt-cell"
                  data-ttt="${index}"
                >
                  ${value}
                </button>
              `
            )
            .join("")
        }

      </div>

      <button
        class="primary-btn"
        data-ttt-reset
      >
        New Game
      </button>

    </div>
  `;
}

function tttMove(index) {
  if (
    ttt.finished ||
    ttt.board[index]
  ) {
    return;
  }

  ttt.board[index] = "X";

  let winner =
    tttWinner(ttt.board);

  if (winner) {
    ttt.finished = true;

    ttt.message =
      winner === "draw"
        ? "Draw"
        : "You win";

    renderTTT();

    return;
  }

  const empty =
    ttt.board
      .map(
        (value, i) =>
          value
            ? null
            : i
      )
      .filter(
        value =>
          value !== null
      );

  let ai =
    empty.find(i => {
      const copy =
        [...ttt.board];

      copy[i] = "O";

      return (
        tttWinner(copy) === "O"
      );
    });

  if (ai == null) {
    ai =
      empty.find(i => {
        const copy =
          [...ttt.board];

        copy[i] = "X";

        return (
          tttWinner(copy) === "X"
        );
      });
  }

  if (ai == null) {
    ai =
      empty.includes(4)
        ? 4
        : pick(empty);
  }

  if (ai != null) {
    ttt.board[ai] = "O";
  }

  winner =
    tttWinner(ttt.board);

  if (winner) {
    ttt.finished = true;

    ttt.message =
      winner === "draw"
        ? "Draw"
        : "GALAXY wins";
  }

  renderTTT();
}

/* =========================================================
   CONNECT FOUR
   ========================================================= */

let connect4 = null;

function openConnect4() {
  connect4 = {
    board:
      Array.from(
        { length: 6 },
        () =>
          Array(7).fill("")
      ),

    finished: false,

    message:
      "Your turn"
  };

  renderConnect4();
}

function connect4Win(
  board,
  player
) {
  for (
    let row = 0;
    row < 6;
    row++
  ) {
    for (
      let col = 0;
      col < 7;
      col++
    ) {
      for (
        const [dr, dc]
        of [
          [0, 1],
          [1, 0],
          [1, 1],
          [1, -1]
        ]
      ) {
        if (
          [0, 1, 2, 3]
            .every(
              step =>
                board[
                  row +
                  dr *
                  step
                ]?.[
                  col +
                  dc *
                  step
                ] === player
            )
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

function connectDrop(
  col,
  player
) {
  for (
    let row = 5;
    row >= 0;
    row--
  ) {
    if (
      !connect4.board[row][col]
    ) {
      connect4.board[row][col] =
        player;

      return true;
    }
  }

  return false;
}

function connectMove(col) {
  if (
    connect4.finished ||
    !connectDrop(
      col,
      "R"
    )
  ) {
    return;
  }

  if (
    connect4Win(
      connect4.board,
      "R"
    )
  ) {
    connect4.finished = true;
    connect4.message =
      "You win";

    renderConnect4();

    return;
  }

  const choices =
    [
      3,
      2,
      4,
      1,
      5,
      0,
      6
    ]
      .filter(
        col =>
          !connect4.board[0][col]
      );

  if (choices.length) {
    connectDrop(
      pick(
        choices.slice(
          0,
          Math.min(
            3,
            choices.length
          )
        )
      ),
      "Y"
    );
  }

  if (
    connect4Win(
      connect4.board,
      "Y"
    )
  ) {
    connect4.finished = true;
    connect4.message =
      "GALAXY wins";
  }

  renderConnect4();
}

function renderConnect4() {
  GameCenter.current =
    "connect4";

  $("#contentBody").innerHTML = `
    <div class="game-shell">

      ${gameTop(
        "Connect Four",
        connect4.message
      )}

      <div class="connect-board">

        ${
          connect4.board
            .flatMap(
              row =>
                row.map(
                  (
                    value,
                    col
                  ) => `
                    <button
                      class="
                        connect-cell
                        ${
                          value === "R"
                            ? "red"
                            : value === "Y"
                            ? "yellow"
                            : ""
                        }
                      "
                      data-c4="${col}"
                    >
                      <span></span>
                    </button>
                  `
                )
            )
            .join("")
        }

      </div>

      <button
        class="primary-btn"
        data-c4-reset
      >
        New Game
      </button>

    </div>
  `;
}

/* =========================================================
   MEMORY
   ========================================================= */

let memory = null;

function openMemory() {
  const values = [
    "✦",
    "☾",
    "◆",
    "⚡",
    "❄",
    "🔥",
    "🌿",
    "💧"
  ];

  memory = {
    cards:
      [
        ...values,
        ...values
      ].sort(
        () =>
          Math.random() -
          0.5
      ),

    open: [],

    done:
      new Set(),

    moves: 0,

    lock: false
  };

  renderMemory();
}

function memoryFlip(index) {
  if (
    memory.lock ||
    memory.done.has(index) ||
    memory.open.includes(index)
  ) {
    return;
  }

  memory.open.push(index);

  if (
    memory.open.length === 2
  ) {
    memory.moves++;

    const [a, b] =
      memory.open;

    if (
      memory.cards[a] ===
      memory.cards[b]
    ) {
      memory.done.add(a);
      memory.done.add(b);

      memory.open = [];

      renderMemory();
    } else {
      memory.lock = true;

      renderMemory();

      setTimeout(
        () => {
          memory.open = [];
          memory.lock = false;

          renderMemory();
        },
        600
      );
    }
  } else {
    renderMemory();
  }
}

function renderMemory() {
  GameCenter.current =
    "memory";

  $("#contentBody").innerHTML = `
    <div class="game-shell">

      ${gameTop(
        "Memory",
        `Moves ${memory.moves}`
      )}

      <div class="memory-board">

        ${
          memory.cards
            .map(
              (
                value,
                index
              ) => `
                <button
                  class="
                    memory-card
                    ${
                      memory.open.includes(
                        index
                      ) ||
                      memory.done.has(
                        index
                      )
                        ? "flipped"
                        : ""
                    }
                  "
                  data-memory="${index}"
                >
                  <span>
                    ${
                      memory.open.includes(
                        index
                      ) ||
                      memory.done.has(
                        index
                      )
                        ? value
                        : "?"
                    }
                  </span>
                </button>
              `
            )
            .join("")
        }

      </div>

      <button
        class="primary-btn"
        data-memory-reset
      >
        New Game
      </button>

    </div>
  `;
}

/* =========================================================
   SNAKE
   ========================================================= */

function openSnake() {
  GameCenter.snake = {
    size: 20,

    body: [
      [10, 10],
      [9, 10]
    ],

    direction:
      [1, 0],

    nextDirection:
      [1, 0],

    food:
      [15, 10],

    score: 0,

    over: false,

    timer: null
  };

  renderSnake();
  runSnake();
}

function newSnakeFood(game) {
  do {
    game.food = [
      Math.floor(
        rand(
          0,
          game.size
        )
      ),

      Math.floor(
        rand(
          0,
          game.size
        )
      )
    ];
  } while (
    game.body.some(
      point =>
        point[0] ===
          game.food[0] &&
        point[1] ===
          game.food[1]
    )
  );
}

function runSnake() {
  clearInterval(
    GameCenter.snake.timer
  );

  GameCenter.snake.timer =
    setInterval(
      () => {
        const game =
          GameCenter.snake;

        if (
          !game ||
          game.over
        ) {
          return;
        }

        game.direction =
          game.nextDirection;

        const head = [
          game.body[0][0] +
            game.direction[0],

          game.body[0][1] +
            game.direction[1]
        ];

        if (
          head[0] < 0 ||
          head[1] < 0 ||
          head[0] >=
            game.size ||
          head[1] >=
            game.size ||
          game.body.some(
            point =>
              point[0] ===
                head[0] &&
              point[1] ===
                head[1]
          )
        ) {
          game.over = true;

          clearInterval(
            game.timer
          );

          renderSnake();

          return;
        }

        game.body.unshift(
          head
        );

        if (
          head[0] ===
            game.food[0] &&
          head[1] ===
            game.food[1]
        ) {
          game.score++;

          newSnakeFood(game);
        } else {
          game.body.pop();
        }

        renderSnake();
      },
      120
    );
}

function renderSnake() {
  GameCenter.current =
    "snake";

  const game =
    GameCenter.snake;

  $("#contentBody").innerHTML = `
    <div class="game-shell">

      ${
        gameTop(
          "Snake",
          game.over
            ? `Game over • ${game.score}`
            : `Score ${game.score}`
        )
      }

      <div class="snake-board">

        ${
          Array.from(
            {
              length:
                game.size *
                game.size
            },
            (_, index) => {
              const x =
                index %
                game.size;

              const y =
                Math.floor(
                  index /
                  game.size
                );

              const snake =
                game.body.some(
                  point =>
                    point[0] === x &&
                    point[1] === y
                );

              const food =
                game.food[0] === x &&
                game.food[1] === y;

              return `
                <div
                  class="
                    snake-cell
                    ${
                      snake
                        ? "snake-body"
                        : ""
                    }
                    ${
                      food
                        ? "snake-food"
                        : ""
                    }
                  "
                ></div>
              `;
            }
          )
          .join("")
        }

      </div>

      <button
        class="primary-btn"
        data-snake-reset
      >
        New Game
      </button>

    </div>
  `;
}

/* =========================================================
   CHICKEN CROSSING
   ========================================================= */

function openChicken() {
  GameCenter.chicken = {
    row: 6,
    col: 4,
    score: 0,

    cars:
      Array.from(
        { length: 10 },
        (_, index) => ({
          row:
            [1, 3, 5][
              index % 3
            ],

          x:
            rand(
              -1,
              8
            ),

          speed:
            rand(
              0.7,
              1.6
            ) *
            (
              index % 2
                ? 1
                : -1
            )
        })
      ),

    timer: null,

    over: false
  };

  renderChicken();
  runChicken();
}

function runChicken() {
  clearInterval(
    GameCenter.chicken.timer
  );

  GameCenter.chicken.timer =
    setInterval(
      () => {
        const game =
          GameCenter.chicken;

        if (
          !game ||
          game.over
        ) {
          return;
        }

        for (
          const car
          of game.cars
        ) {
          car.x +=
            car.speed *
            0.15;

          if (
            car.x > 9
          ) {
            car.x = -1;
          }

          if (
            car.x < -1
          ) {
            car.x = 9;
          }

          if (
            car.row ===
              game.row &&
            Math.abs(
              car.x -
              game.col
            ) < 0.55
          ) {
            game.over = true;

            clearInterval(
              game.timer
            );
          }
        }

        renderChicken();
      },
      90
    );
}

function chickenMove(
  dx,
  dy
) {
  const game =
    GameCenter.chicken;

  if (
    !game ||
    game.over
  ) {
    return;
  }

  game.col =
    clamp(
      game.col + dx,
      0,
      8
    );

  game.row =
    clamp(
      game.row + dy,
      0,
      6
    );

  if (
    game.row === 0
  ) {
    game.score++;
    game.row = 6;
    game.col = 4;
  }

  renderChicken();
}

function renderChicken() {
  GameCenter.current =
    "chicken";

  const game =
    GameCenter.chicken;

  $("#contentBody").innerHTML = `
    <div class="game-shell">

      ${
        gameTop(
          "Chicken Crossing",

          game.over
            ? `Hit! Score ${game.score}`
            : `Score ${game.score}`
        )
      }

      <div class="chicken-board">

        ${
          Array.from(
            {
              length: 63
            },
            (_, index) => {
              const col =
                index % 9;

              const row =
                Math.floor(
                  index / 9
                );

              const road =
                [1, 3, 5]
                  .includes(row);

              const player =
                game.row === row &&
                game.col === col;

              const car =
                game.cars.some(
                  vehicle =>
                    vehicle.row ===
                      row &&
                    Math.round(
                      vehicle.x
                    ) === col
                );

              return `
                <div
                  class="
                    chicken-cell
                    ${
                      road
                        ? "road"
                        : "grass"
                    }
                  "
                >
                  ${
                    player
                      ? "🐔"
                      : car
                      ? "🚗"
                      : ""
                  }
                </div>
              `;
            }
          )
          .join("")
        }

      </div>

      <p>
        Arrow keys / WASD
      </p>

      <button
        class="primary-btn"
        data-chicken-reset
      >
        New Game
      </button>

    </div>
  `;
}

/* =========================================================
   CHESS
   ========================================================= */

let chess = null;

const CHESS_SYMBOLS = {
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
};

function openChess() {
  chess = {
    board: [
      "rnbqkbnr",
      "pppppppp",
      "........",
      "........",
      "........",
      "........",
      "PPPPPPPP",
      "RNBQKBNR"
    ].map(
      row =>
        [...row]
          .map(
            char =>
              char === "."
                ? ""
                : char
          )
    ),

    selected: null,

    message:
      "Select a white piece"
  };

  renderChess();
}

function getChessMoves(
  row,
  col
) {
  const piece =
    chess.board[row][col];

  const white =
    piece &&
    piece ===
      piece.toUpperCase();

  const type =
    piece
      ?.toLowerCase();

  const moves = [];

  const add = (
    r,
    c
  ) => {
    if (
      r < 0 ||
      c < 0 ||
      r > 7 ||
      c > 7
    ) {
      return false;
    }

    const target =
      chess.board[r][c];

    if (!target) {
      moves.push([
        r,
        c
      ]);

      return true;
    }

    const sameSide =
      (
        target ===
        target.toUpperCase()
      ) === white;

    if (!sameSide) {
      moves.push([
        r,
        c
      ]);
    }

    return false;
  };

  if (
    type === "p"
  ) {
    const direction =
      white
        ? -1
        : 1;

    if (
      !chess.board[
        row +
        direction
      ]?.[col]
    ) {
      moves.push([
        row +
        direction,
        col
      ]);
    }

    for (
      const dc
      of [-1, 1]
    ) {
      const target =
        chess.board[
          row +
          direction
        ]?.[
          col +
          dc
        ];

      if (
        target &&
        (
          target ===
          target.toUpperCase()
        ) !== white
      ) {
        moves.push([
          row +
          direction,
          col +
          dc
        ]);
      }
    }
  }

  if (
    type === "n"
  ) {
    for (
      const [dr, dc]
      of [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2]
      ]
    ) {
      add(
        row + dr,
        col + dc
      );
    }
  }

  if (
    type === "k"
  ) {
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
        if (
          dr ||
          dc
        ) {
          add(
            row + dr,
            col + dc
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

    for (
      const [dr, dc]
      of directions
    ) {
      let r =
        row + dr;

      let c =
        col + dc;

      while (
        add(
          r,
          c
        )
      ) {
        r += dr;
        c += dc;
      }
    }
  }

  return moves;
}

function chessClick(
  row,
  col
) {
  const piece =
    chess.board[row][col];

  if (
    chess.selected
  ) {
    const [
      fromRow,
      fromCol
    ] =
      chess.selected;

    const legal =
      getChessMoves(
        fromRow,
        fromCol
      )
      .some(
        (
          [
            r,
            c
          ]
        ) =>
          r === row &&
          c === col
      );

    if (legal) {
      chess.board[row][col] =
        chess.board[
          fromRow
        ][
          fromCol
        ];

      chess.board[
        fromRow
      ][
        fromCol
      ] = "";

      chess.selected = null;

      chess.message =
        "Move complete";

      renderChess();

      return;
    }
  }

  if (
    piece &&
    piece ===
      piece.toUpperCase()
  ) {
    chess.selected = [
      row,
      col
    ];

    chess.message =
      "Choose destination";
  } else {
    chess.selected = null;
  }

  renderChess();
}

function renderChess() {
  GameCenter.current =
    "chess";

  $("#contentBody").innerHTML = `
    <div class="game-shell">

      ${
        gameTop(
          "Chess",
          chess.message
        )
      }

      <div class="chess-board">

        ${
          chess.board
            .map(
              (
                row,
                r
              ) =>
                row.map(
                  (
                    piece,
                    c
                  ) => `
                    <button
                      class="
                        chess-square
                        ${
                          (
                            r +
                            c
                          ) %
                          2
                            ? "dark"
                            : "light"
                        }
                        ${
                          chess.selected?.[0] ===
                            r &&
                          chess.selected?.[1] ===
                            c
                            ? "selected"
                            : ""
                        }
                      "
                      data-chess="${r},${c}"
                    >
                      <span class="chess-piece">
                        ${
                          piece
                            ? CHESS_SYMBOLS[piece]
                            : ""
                        }
                      </span>
                    </button>
                  `
                )
                .join("")
            )
            .join("")
        }

      </div>

      <button
        class="primary-btn"
        data-chess-reset
      >
        New Game
      </button>

    </div>
  `;
}

/* =========================================================
   THREE.JS
   ========================================================= */

let THREE_PROMISE = null;

function loadThree() {
  if (
    window.THREE
  ) {
    return Promise.resolve(
      window.THREE
    );
  }

  if (
    !THREE_PROMISE
  ) {
    THREE_PROMISE =
      import(
        "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"
      );
  }

  return THREE_PROMISE;
}

/* =========================================================
   GALAXY ARENA
   ========================================================= */

async function openArena() {
  cleanup3D();

  GameCenter.current =
    "arena";

  $("#contentBody").innerHTML = `
    <div class="arena-shell">

      <div class="arena-game">

        <canvas
          id="arenaCanvas"
          class="arena-canvas"
        ></canvas>

        <div class="arena-crosshair"></div>

        <div class="arena-center-message">
          Click to look • WASD to move
        </div>

      </div>

    </div>
  `;

  try {
    const THREE =
      await loadThree();

    const canvas =
      $("#arenaCanvas");

    const scene =
      new THREE.Scene();

    scene.background =
      new THREE.Color(
        0x7fa8c8
      );

    const camera =
      new THREE
        .PerspectiveCamera(
          70,
          1,
          0.1,
          200
        );

    const renderer =
      new THREE
        .WebGLRenderer({
          canvas,
          antialias: true
        });

    const ground =
      new THREE.Mesh(
        new THREE
          .PlaneGeometry(
            100,
            100
          ),

        new THREE
          .MeshStandardMaterial({
            color:
              0x6a7f62
          })
      );

    ground.rotation.x =
      -Math.PI / 2;

    scene.add(ground);

    scene.add(
      new THREE
        .HemisphereLight(
          0xffffff,
          0x334422,
          2
        )
    );

    for (
      let i = 0;
      i < 20;
      i++
    ) {
      const width =
        rand(1, 4);

      const height =
        rand(1, 5);

      const depth =
        rand(1, 4);

      const block =
        new THREE.Mesh(
          new THREE
            .BoxGeometry(
              width,
              height,
              depth
            ),

          new THREE
            .MeshStandardMaterial({
              color:
                0x777777
            })
        );

      block.position.set(
        rand(
          -40,
          40
        ),

        height / 2,

        rand(
          -40,
          40
        )
      );

      scene.add(block);
    }

    let x = 0;
    let z = 8;
    let yaw = 0;
    let pitch = 0;

    const keys =
      new Set();

    on3D(
      canvas,
      "click",
      () =>
        canvas
          .requestPointerLock
          ?.()
    );

    on3D(
      document,
      "mousemove",
      event => {
        if (
          document.pointerLockElement !==
          canvas
        ) {
          return;
        }

        yaw -=
          event.movementX *
          0.0025;

        pitch =
          clamp(
            pitch -
            event.movementY *
            0.002,

            -0.5,
            0.5
          );
      }
    );

    on3D(
      document,
      "keydown",
      event =>
        keys.add(
          event.code
        )
    );

    on3D(
      document,
      "keyup",
      event =>
        keys.delete(
          event.code
        )
    );

    function resize() {
      const parent =
        canvas.parentElement;

      renderer.setSize(
        parent.clientWidth,
        parent.clientHeight,
        false
      );

      camera.aspect =
        parent.clientWidth /
        parent.clientHeight;

      camera
        .updateProjectionMatrix();
    }

    on3D(
      window,
      "resize",
      resize
    );

    resize();

    let last =
      performance.now();

    function loop(now) {
      if (
        GameCenter.current !==
        "arena"
      ) {
        return;
      }

      const dt =
        Math.min(
          0.05,
          (
            now -
            last
          ) /
          1000
        );

      last = now;

      const forward =
        (
          keys.has("KeyW")
            ? 1
            : 0
        ) -
        (
          keys.has("KeyS")
            ? 1
            : 0
        );

      const right =
        (
          keys.has("KeyD")
            ? 1
            : 0
        ) -
        (
          keys.has("KeyA")
            ? 1
            : 0
        );

      const speed = 6;

      x +=
        (
          -Math.sin(yaw) *
            forward +
          Math.cos(yaw) *
            right
        ) *
        speed *
        dt;

      z +=
        (
          -Math.cos(yaw) *
            forward -
          Math.sin(yaw) *
            right
        ) *
        speed *
        dt;

      camera.position.set(
        x,
        1.7,
        z
      );

      camera.rotation.order =
        "YXZ";

      camera.rotation.y =
        yaw;

      camera.rotation.x =
        pitch;

      renderer.render(
        scene,
        camera
      );

      GameCenter.raf =
        requestAnimationFrame(
          loop
        );
    }

    GameCenter.raf =
      requestAnimationFrame(
        loop
      );
  } catch (error) {
    $("#contentBody").innerHTML = `
      <div class="panel">

        <h3>
          Arena could not start
        </h3>

        <p>
          ${esc(error.message)}
        </p>

      </div>
    `;
  }
}

/* =========================================================
   GALAXY PALS
   ========================================================= */

const PALS_SAVE =
  "galaxy.pals.v4";

const PALS_ORBS = [
  {
    name:
      "Basic Orb",
    bonus: 1
  },
  {
    name:
      "Mega Orb",
    bonus: 1.35
  },
  {
    name:
      "Giga Orb",
    bonus: 1.7
  },
  {
    name:
      "Hyper Orb",
    bonus: 2.1
  },
  {
    name:
      "Ultra Orb",
    bonus: 2.6
  }
];

const PALS = [

  [
    "emberfox",
    "Emberfox",
    "fox",
    "Fire",
    0xe76c45,
    0xffd06b,
    1,
    90,
    2.8,
    "🦊"
  ],

  [
    "mossbun",
    "Mossbun",
    "rabbit",
    "Grass",
    0x70b66a,
    0xe9ffd2,
    1,
    92,
    2.7,
    "🐰"
  ],

  [
    "voltlynx",
    "Voltlynx",
    "lynx",
    "Electric",
    0xe3c94e,
    0x2b2b35,
    2,
    96,
    3.2,
    "🐱"
  ],

  [
    "aquafin",
    "Aquafin",
    "shark",
    "Water",
    0x4d9fd4,
    0xc8f4ff,
    2,
    110,
    2.8,
    "🦈"
  ],

  [
    "stonehorn",
    "Stonehorn",
    "rhino",
    "Ground",
    0x8b7d6a,
    0xd8c4a5,
    2,
    145,
    2,
    "🦏"
  ],

  [
    "frostwolf",
    "Frostwolf",
    "wolf",
    "Ice",
    0xa3d7e8,
    0xffffff,
    3,
    125,
    3.4,
    "🐺"
  ],

  [
    "shadebat",
    "Shadebat",
    "bat",
    "Dark",
    0x544269,
    0xbda3e3,
    2,
    82,
    3.8,
    "🦇"
  ],

  [
    "ironape",
    "Ironape",
    "ape",
    "Metal",
    0x77828c,
    0x2d3439,
    3,
    165,
    2.1,
    "🦍"
  ],

  [
    "stormgryph",
    "Stormgryph",
    "gryphon",
    "Electric",
    0xd5b949,
    0x674b2d,
    4,
    170,
    3.6,
    "🦅"
  ],

  [
    "cinderdrake",
    "Cinderdrake",
    "dragon",
    "Fire",
    0xb94c37,
    0xff985d,
    4,
    190,
    3.1,
    "🐉"
  ],

  [
    "glacierox",
    "Glacierox",
    "ox",
    "Ice",
    0x8fc7da,
    0xeafcff,
    4,
    215,
    1.8,
    "🐂"
  ],

  [
    "voidlion",
    "Voidlion",
    "lion",
    "Dark",
    0x4d3b66,
    0xc57aff,
    5,
    205,
    3.2,
    "🦁"
  ],

  [
    "solara",
    "Solara",
    "phoenix",
    "Light",
    0xe4bd59,
    0xfff0a8,
    5,
    195,
    4,
    "🪽"
  ],

  [
    "bloomdeer",
    "Bloomdeer",
    "deer",
    "Grass",
    0x77b76a,
    0xf2b6db,
    2,
    118,
    3,
    "🦌"
  ],

  [
    "tidefin",
    "Tidefin",
    "whale",
    "Water",
    0x4f8eaa,
    0xa7e5ef,
    3,
    180,
    2,
    "🐋"
  ],

  [
    "sparkmouse",
    "Sparkmouse",
    "mouse",
    "Electric",
    0xf0d65d,
    0x8f6849,
    1,
    65,
    3.8,
    "🐭"
  ],

  [
    "flarepanda",
    "Flarepanda",
    "panda",
    "Fire",
    0x28282b,
    0xe77648,
    3,
    160,
    2,
    "🐼"
  ],

  [
    "moonowl",
    "Moonowl",
    "owl",
    "Dark",
    0x665678,
    0xcbb7e4,
    2,
    90,
    3.4,
    "🦉"
  ],

  [
    "thornzilla",
    "Thornzilla",
    "dino",
    "Grass",
    0x5e9b56,
    0x9fcb59,
    4,
    220,
    2.3,
    "🦖"
  ],

  [
    "shelltide",
    "Shelltide",
    "turtle",
    "Water",
    0x4d8e85,
    0x9fc496,
    2,
    160,
    1.5,
    "🐢"
  ],

  [
    "fluffhorn",
    "Fluffhorn",
    "sheep",
    "Neutral",
    0xe9e4d6,
    0x8a725e,
    1,
    105,
    2.2,
    "🐑"
  ],

  [
    "nightfang",
    "Nightfang",
    "wolf",
    "Dark",
    0x292d38,
    0x7b62a6,
    3,
    140,
    3.7,
    "🐺"
  ],

  [
    "skywhale",
    "Skywhale",
    "whale",
    "Air",
    0x86b9d2,
    0xf5fbff,
    5,
    230,
    2.5,
    "🐋"
  ],

  [
    "venomantis",
    "Venomantis",
    "mantis",
    "Poison",
    0x6eaa50,
    0xb6e95d,
    4,
    135,
    3,
    "🦗"
  ],

  [
    "starwyrm",
    "Starwyrm",
    "serpent",
    "Dragon",
    0x6554a4,
    0xf0c9ff,
    5,
    240,
    3.5,
    "🐲"
  ],

  [
    "sunmare",
    "Sunmare",
    "horse",
    "Light",
    0xe7b75b,
    0xfff2b0,
    3,
    155,
    4,
    "🐎"
  ],

  [
    "boghopper",
    "Boghopper",
    "frog",
    "Water",
    0x68a95e,
    0xb7e67d,
    1,
    88,
    2.6,
    "🐸"
  ],

  [
    "magmaboar",
    "Magmaboar",
    "boar",
    "Fire",
    0x743f32,
    0xff6b3c,
    3,
    175,
    2.5,
    "🐗"
  ],

  [
    "crystalstag",
    "Crystalstag",
    "stag",
    "Ice",
    0xa8d8e6,
    0xcba8ff,
    4,
    165,
    3.1,
    "🦌"
  ],

  [
    "webclaw",
    "Webclaw",
    "spider",
    "Dark",
    0x493d52,
    0xbd88df,
    3,
    120,
    3.2,
    "🕷️"
  ],

  [
    "rockgolem",
    "Rockgolem",
    "golem",
    "Ground",
    0x777368,
    0xb7aa8e,
    4,
    260,
    1.4,
    "🗿"
  ],

  [
    "frostpeng",
    "Frostpeng",
    "penguin",
    "Ice",
    0x222d39,
    0xeefaff,
    1,
    82,
    2.4,
    "🐧"
  ]

].map(
  (
    [
      id,
      name,
      form,
      element,
      body,
      accent,
      rarity,
      hp,
      speed,
      emoji
    ]
  ) => ({
    id,
    name,
    form,
    element,
    body,
    accent,
    rarity,
    hp,
    speed,
    emoji
  })
);

function palsDefault() {
  return store.get(
    PALS_SAVE,
    {
      level: 1,
      xp: 0,

      hp: 100,
      stamina: 100,
      hunger: 100,

      x: 0,
      z: 8,

      orb: 0,

      inventory: {
        wood: 20,
        stone: 16,
        ore: 6,

        orbs: [
          12,
          4,
          1,
          0,
          0
        ]
      },

      party: [],
      box: [],
      bases: []
    }
  );
}

function palsSave(game) {
  store.set(
    PALS_SAVE,
    game
  );
}

/* =========================================================
   CREATURE GEOMETRY HELPERS
   ========================================================= */

function palMaterial(
  THREE,
  color,
  extras = {}
) {
  return new THREE
    .MeshStandardMaterial({
      color,
      roughness: 0.68,
      ...extras
    });
}

function palSphere(
  THREE,
  radius,
  color,

  x = 0,
  y = 0,
  z = 0,

  sx = 1,
  sy = 1,
  sz = 1
) {
  const mesh =
    new THREE.Mesh(
      new THREE
        .SphereGeometry(
          radius,
          16,
          12
        ),

      palMaterial(
        THREE,
        color
      )
    );

  mesh.position.set(
    x,
    y,
    z
  );

  mesh.scale.set(
    sx,
    sy,
    sz
  );

  mesh.castShadow = true;

  return mesh;
}

function palBox(
  THREE,
  width,
  height,
  depth,
  color,

  x = 0,
  y = 0,
  z = 0
) {
  const mesh =
    new THREE.Mesh(
      new THREE
        .BoxGeometry(
          width,
          height,
          depth
        ),

      palMaterial(
        THREE,
        color
      )
    );

  mesh.position.set(
    x,
    y,
    z
  );

  mesh.castShadow = true;

  return mesh;
}

function palCone(
  THREE,
  radius,
  height,
  color,

  x = 0,
  y = 0,
  z = 0
) {
  const mesh =
    new THREE.Mesh(
      new THREE
        .ConeGeometry(
          radius,
          height,
          8
        ),

      palMaterial(
        THREE,
        color
      )
    );

  mesh.position.set(
    x,
    y,
    z
  );

  mesh.castShadow = true;

  return mesh;
}

function palCylinder(
  THREE,
  radiusTop,
  radiusBottom,
  height,
  color,

  x = 0,
  y = 0,
  z = 0
) {
  const mesh =
    new THREE.Mesh(
      new THREE
        .CylinderGeometry(
          radiusTop,
          radiusBottom,
          height,
          10
        ),

      palMaterial(
        THREE,
        color
      )
    );

  mesh.position.set(
    x,
    y,
    z
  );

  mesh.castShadow = true;

  return mesh;
}

function addEyes(
  THREE,
  group,
  y,
  z,
  spread = 0.18
) {
  for (
    const x
    of [
      -spread,
      spread
    ]
  ) {
    group.add(
      palSphere(
        THREE,
        0.065,
        0xffffff,
        x,
        y,
        z
      ),

      palSphere(
        THREE,
        0.028,
        0x101015,
        x,
        y,
        z - 0.065
      )
    );
  }
}

function addFourLegs(
  THREE,
  group,
  color,
  points = [
    [-0.38, -0.45],
    [0.38, -0.45],
    [-0.4, 0.45],
    [0.4, 0.45]
  ],
  length = 0.65
) {
  const result = [];

  for (
    const [
      x,
      z
    ]
    of points
  ) {
    const pivot =
      new THREE.Group();

    pivot.position.set(
      x,
      0.75,
      z
    );

    pivot.add(
      palBox(
        THREE,
        0.2,
        length,
        0.22,
        color,
        0,
        -length / 2,
        0
      )
    );

    group.add(pivot);

    result.push(pivot);
  }

  return result;
}

function makeWing(
  THREE,
  color,
  side
) {
  const wing =
    new THREE.Mesh(
      new THREE
        .ConeGeometry(
          0.48,
          1.5,
          3
        ),

      palMaterial(
        THREE,
        color
      )
    );

  wing.rotation.z =
    side *
    Math.PI /
    2;

  wing.scale.z =
    0.28;

  return wing;
}

/* =========================================================
   DIFFERENT PAL BODY BUILDERS
   ========================================================= */

function buildPal(
  THREE,
  species
) {
  const group =
    new THREE.Group();

  const bodyColor =
    species.body;

  const accent =
    species.accent;

  let legs = [];
  let wings = [];
  let tail = null;
  let head = null;
  let body = null;

  const addTail = (
    length = 0.9,
    thickness = 0.15,
    y = 1.05
  ) => {
    tail =
      new THREE.Group();

    tail.position.set(
      0,
      y,
      0.5
    );

    const mesh =
      palCylinder(
        THREE,
        thickness,
        thickness * 0.65,
        length,
        accent,
        0,
        0,
        length / 2
      );

    mesh.rotation.x =
      Math.PI / 2;

    tail.add(mesh);
    group.add(tail);
  };

  switch (
    species.form
  ) {

    /* FOX / WOLF / LYNX */
    case "fox":
    case "wolf":
    case "lynx": {
      body =
        palSphere(
          THREE,
          0.55,
          bodyColor,
          0,
          1,
          0,
          1.4,
          0.8,
          1.65
        );

      head =
        palSphere(
          THREE,
          0.38,
          bodyColor,
          0,
          1.55,
          -0.75,
          1,
          0.9,
          1
        );

      group.add(
        body,
        head
      );

      addEyes(
        THREE,
        group,
        1.63,
        -1.08
      );

      group.add(
        palCone(
          THREE,
          0.14,
          0.52,
          accent,
          -0.24,
          1.98,
          -0.72
        ),

        palCone(
          THREE,
          0.14,
          0.52,
          accent,
          0.24,
          1.98,
          -0.72
        ),

        palSphere(
          THREE,
          0.18,
          accent,
          0,
          1.45,
          -1.09,
          1.1,
          0.7,
          1
        )
      );

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor,
          undefined,
          0.68
        );

      addTail(
        species.form === "fox"
          ? 1.4
          : 1,

        0.18,
        1.05
      );

      if (
        species.form ===
        "lynx"
      ) {
        group.add(
          palCone(
            THREE,
            0.06,
            0.22,
            0x222222,
            -0.24,
            2.18,
            -0.72
          ),

          palCone(
            THREE,
            0.06,
            0.22,
            0x222222,
            0.24,
            2.18,
            -0.72
          )
        );
      }

      break;
    }

    /* RABBIT */
    case "rabbit": {
      body =
        palSphere(
          THREE,
          0.52,
          bodyColor,
          0,
          0.9,
          0,
          1.05,
          1.15,
          1.1
        );

      head =
        palSphere(
          THREE,
          0.38,
          bodyColor,
          0,
          1.55,
          -0.42
        );

      group.add(
        body,
        head
      );

      addEyes(
        THREE,
        group,
        1.65,
        -0.73,
        0.16
      );

      for (
        const x
        of [
          -0.18,
          0.18
        ]
      ) {
        const ear =
          palSphere(
            THREE,
            0.18,
            accent,
            x,
            2.23,
            -0.35,
            0.45,
            2.3,
            0.55
          );

        ear.rotation.z =
          x < 0
            ? -0.08
            : 0.08;

        group.add(ear);
      }

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor,

          [
            [-0.32, -0.18],
            [0.32, -0.18],
            [-0.38, 0.38],
            [0.38, 0.38]
          ],

          0.55
        );

      group.add(
        palSphere(
          THREE,
          0.18,
          0xffffff,
          0,
          0.9,
          0.65
        )
      );

      break;
    }

    /* RHINO */
    case "rhino": {
      body =
        palSphere(
          THREE,
          0.75,
          bodyColor,
          0,
          1,
          0,
          1.45,
          0.85,
          1.6
        );

      head =
        palSphere(
          THREE,
          0.5,
          bodyColor,
          0,
          1.35,
          -1,
          1.1,
          0.75,
          1.1
        );

      group.add(
        body,
        head,

        palCone(
          THREE,
          0.13,
          0.75,
          accent,
          0,
          1.55,
          -1.58
        )
      );

      addEyes(
        THREE,
        group,
        1.48,
        -1.45,
        0.2
      );

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor,

          [
            [-0.5, -0.5],
            [0.5, -0.5],
            [-0.5, 0.5],
            [0.5, 0.5]
          ],

          0.75
        );

      addTail(
        0.55,
        0.08,
        0.95
      );

      break;
    }

    /* BAT */
    case "bat": {
      body =
        palSphere(
          THREE,
          0.42,
          bodyColor,
          0,
          1.2,
          0,
          1,
          0.85,
          1.25
        );

      head =
        palSphere(
          THREE,
          0.31,
          bodyColor,
          0,
          1.62,
          -0.42
        );

      group.add(
        body,
        head
      );

      addEyes(
        THREE,
        group,
        1.68,
        -0.72,
        0.13
      );

      group.add(
        palCone(
          THREE,
          0.1,
          0.4,
          accent,
          -0.2,
          2,
          -0.4
        ),

        palCone(
          THREE,
          0.1,
          0.4,
          accent,
          0.2,
          2,
          -0.4
        )
      );

      for (
        const side
        of [-1, 1]
      ) {
        const pivot =
          new THREE.Group();

        pivot.position.set(
          side * 0.4,
          1.35,
          0
        );

        pivot.add(
          makeWing(
            THREE,
            accent,
            side
          )
        );

        group.add(pivot);

        wings.push(pivot);
      }

      break;
    }

    /* APE */
    case "ape": {
      body =
        palSphere(
          THREE,
          0.75,
          bodyColor,
          0,
          1.05,
          0,
          1.1,
          1.2,
          0.8
        );

      head =
        palSphere(
          THREE,
          0.43,
          bodyColor,
          0,
          1.95,
          -0.2
        );

      group.add(
        body,
        head,

        palSphere(
          THREE,
          0.28,
          accent,
          0,
          1.82,
          -0.5,
          1.2,
          0.65,
          0.7
        )
      );

      addEyes(
        THREE,
        group,
        2.02,
        -0.55,
        0.16
      );

      for (
        const side
        of [-1, 1]
      ) {
        const arm =
          new THREE.Group();

        arm.position.set(
          side * 0.7,
          1.35,
          0
        );

        const limb =
          palCylinder(
            THREE,
            0.18,
            0.2,
            1.25,
            bodyColor,
            0,
            -0.48,
            0
          );

        limb.rotation.z =
          side * 0.22;

        arm.add(limb);

        group.add(arm);

        legs.push(arm);
      }

      legs.push(
        ...addFourLegs(
          THREE,
          group,
          bodyColor,

          [
            [-0.3, 0.15],
            [0.3, 0.15]
          ],

          0.75
        )
      );

      break;
    }

    /* GRYPHON / PHOENIX */
    case "gryphon":
    case "phoenix": {
      body =
        palSphere(
          THREE,
          0.58,
          bodyColor,
          0,
          1.15,
          0,
          1,
          0.9,
          1.55
        );

      head =
        palSphere(
          THREE,
          0.34,
          bodyColor,
          0,
          1.75,
          -0.7
        );

      group.add(
        body,
        head,

        palCone(
          THREE,
          0.12,
          0.45,
          accent,
          0,
          1.7,
          -1.18
        )
      );

      addEyes(
        THREE,
        group,
        1.83,
        -0.98,
        0.14
      );

      for (
        const side
        of [-1, 1]
      ) {
        const pivot =
          new THREE.Group();

        pivot.position.set(
          side * 0.48,
          1.3,
          0
        );

        const wing =
          makeWing(
            THREE,
            accent,
            side
          );

        wing.scale.multiplyScalar(
          species.form ===
          "phoenix"
            ? 1.5
            : 1.2
        );

        pivot.add(wing);

        group.add(pivot);

        wings.push(pivot);
      }

      legs =
        addFourLegs(
          THREE,
          group,
          accent,

          [
            [-0.24, -0.15],
            [0.24, -0.15]
          ],

          0.55
        );

      addTail(
        species.form ===
        "phoenix"
          ? 1.5
          : 0.9,

        0.1,
        1.1
      );

      break;
    }

    /* DRAGON */
    case "dragon": {
      body =
        palSphere(
          THREE,
          0.68,
          bodyColor,
          0,
          1.15,
          0,
          1.15,
          0.85,
          1.7
        );

      head =
        palSphere(
          THREE,
          0.42,
          bodyColor,
          0,
          1.72,
          -0.9,
          1,
          0.8,
          1.2
        );

      group.add(
        body,
        head,

        palCone(
          THREE,
          0.12,
          0.5,
          accent,
          -0.23,
          2.15,
          -0.85
        ),

        palCone(
          THREE,
          0.12,
          0.5,
          accent,
          0.23,
          2.15,
          -0.85
        )
      );

      addEyes(
        THREE,
        group,
        1.82,
        -1.28,
        0.17
      );

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor,
          undefined,
          0.7
        );

      for (
        const side
        of [-1, 1]
      ) {
        const pivot =
          new THREE.Group();

        pivot.position.set(
          side * 0.5,
          1.45,
          0.1
        );

        pivot.add(
          makeWing(
            THREE,
            accent,
            side
          )
        );

        group.add(pivot);

        wings.push(pivot);
      }

      addTail(
        1.7,
        0.16,
        1.1
      );

      break;
    }

    /* OX / BOAR */
    case "ox":
    case "boar": {
      body =
        palSphere(
          THREE,
          0.72,
          bodyColor,
          0,
          0.95,
          0,
          1.45,
          0.9,
          1.55
        );

      head =
        palSphere(
          THREE,
          0.46,
          bodyColor,
          0,
          1.35,
          -1,
          1.1,
          0.85,
          1.1
        );

      group.add(
        body,
        head
      );

      addEyes(
        THREE,
        group,
        1.48,
        -1.4,
        0.18
      );

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor,
          undefined,
          0.68
        );

      if (
        species.form ===
        "ox"
      ) {
        group.add(
          palCone(
            THREE,
            0.13,
            0.65,
            accent,
            -0.38,
            1.75,
            -0.9
          ),

          palCone(
            THREE,
            0.13,
            0.65,
            accent,
            0.38,
            1.75,
            -0.9
          )
        );
      } else {
        group.add(
          palCone(
            THREE,
            0.08,
            0.32,
            accent,
            -0.18,
            1.18,
            -1.45
          ),

          palCone(
            THREE,
            0.08,
            0.32,
            accent,
            0.18,
            1.18,
            -1.45
          )
        );
      }

      addTail(
        0.45,
        0.07,
        0.95
      );

      break;
    }

    /* LION */
    case "lion": {
      body =
        palSphere(
          THREE,
          0.65,
          bodyColor,
          0,
          1,
          0,
          1.35,
          0.85,
          1.45
        );

      head =
        palSphere(
          THREE,
          0.45,
          accent,
          0,
          1.62,
          -0.75,
          1.3,
          1.3,
          1.1
        );

      group.add(
        body,
        head,

        palSphere(
          THREE,
          0.34,
          bodyColor,
          0,
          1.62,
          -0.84
        )
      );

      addEyes(
        THREE,
        group,
        1.72,
        -1.13,
        0.17
      );

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor
        );

      addTail(
        1.15,
        0.08,
        1
      );

      break;
    }

    /* DEER / STAG */
    case "deer":
    case "stag": {
      body =
        palSphere(
          THREE,
          0.56,
          bodyColor,
          0,
          1.1,
          0,
          1.2,
          0.85,
          1.55
        );

      const neck =
        palCylinder(
          THREE,
          0.24,
          0.32,
          0.95,
          bodyColor,
          0,
          1.55,
          -0.55
        );

      neck.rotation.x =
        -0.42;

      head =
        palSphere(
          THREE,
          0.34,
          bodyColor,
          0,
          2.05,
          -0.85,
          1,
          0.75,
          1.1
        );

      group.add(
        body,
        neck,
        head
      );

      addEyes(
        THREE,
        group,
        2.12,
        -1.17,
        0.14
      );

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor,
          undefined,
          0.85
        );

      for (
        const side
        of [-1, 1]
      ) {
        const horn =
          palCone(
            THREE,
            0.08,
            0.75,
            accent,
            side * 0.22,
            2.6,
            -0.8
          );

        horn.rotation.z =
          side * 0.2;

        group.add(horn);
      }

      addTail(
        0.45,
        0.1,
        1.15
      );

      break;
    }

    /* SHARK / WHALE */
    case "shark":
    case "whale": {
      body =
        palSphere(
          THREE,
          0.75,
          bodyColor,
          0,
          1.25,
          0,
          1.1,
          0.75,

          species.form ===
          "whale"
            ? 2.3
            : 1.8
        );

      head =
        palSphere(
          THREE,
          0.48,
          bodyColor,
          0,
          1.25,
          -1.15,
          1.2,
          0.75,
          1.2
        );

      group.add(
        body,
        head
      );

      addEyes(
        THREE,
        group,
        1.38,
        -1.54,
        0.22
      );

      const dorsal =
        palCone(
          THREE,
          0.18,
          0.9,
          accent,
          0,
          2,
          0.15
        );

      dorsal.rotation.x =
        Math.PI;

      group.add(dorsal);

      for (
        const side
        of [-1, 1]
      ) {
        const fin =
          palCone(
            THREE,
            0.14,
            0.8,
            accent,
            side * 0.78,
            1.25,
            0
          );

        fin.rotation.z =
          side *
          Math.PI /
          2;

        group.add(fin);
      }

      addTail(
        1.1,
        0.16,
        1.25
      );

      group.position.y =
        0.35;

      break;
    }

    /* MOUSE */
    case "mouse": {
      body =
        palSphere(
          THREE,
          0.35,
          bodyColor,
          0,
          0.55,
          0,
          1,
          0.8,
          1.3
        );

      head =
        palSphere(
          THREE,
          0.28,
          bodyColor,
          0,
          0.88,
          -0.42
        );

      group.add(
        body,
        head,

        palSphere(
          THREE,
          0.15,
          accent,
          -0.24,
          1.12,
          -0.38
        ),

        palSphere(
          THREE,
          0.15,
          accent,
          0.24,
          1.12,
          -0.38
        )
      );

      addEyes(
        THREE,
        group,
        0.96,
        -0.67,
        0.11
      );

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor,

          [
            [-0.2, -0.1],
            [0.2, -0.1],
            [-0.2, 0.2],
            [0.2, 0.2]
          ],

          0.28
        );

      addTail(
        1.2,
        0.045,
        0.55
      );

      break;
    }

    /* PANDA */
    case "panda": {
      body =
        palSphere(
          THREE,
          0.68,
          0xf2f2ed,
          0,
          1,
          0,
          1.1,
          1.15,
          0.9
        );

      head =
        palSphere(
          THREE,
          0.48,
          0xf2f2ed,
          0,
          1.82,
          -0.15
        );

      group.add(
        body,
        head,

        palSphere(
          THREE,
          0.17,
          0x222222,
          -0.34,
          2.15,
          -0.15
        ),

        palSphere(
          THREE,
          0.17,
          0x222222,
          0.34,
          2.15,
          -0.15
        ),

        palSphere(
          THREE,
          0.12,
          0x222222,
          -0.17,
          1.88,
          -0.52
        ),

        palSphere(
          THREE,
          0.12,
          0x222222,
          0.17,
          1.88,
          -0.52
        )
      );

      addEyes(
        THREE,
        group,
        1.9,
        -0.61,
        0.16
      );

      legs =
        addFourLegs(
          THREE,
          group,
          0x222222,
          undefined,
          0.65
        );

      break;
    }

    /* OWL */
    case "owl": {
      body =
        palSphere(
          THREE,
          0.5,
          bodyColor,
          0,
          1.15,
          0,
          1,
          1.2,
          0.9
        );

      head =
        palSphere(
          THREE,
          0.48,
          bodyColor,
          0,
          1.72,
          -0.12,
          1.1,
          1,
          0.85
        );

      group.add(
        body,
        head,

        palSphere(
          THREE,
          0.22,
          accent,
          -0.2,
          1.8,
          -0.42
        ),

        palSphere(
          THREE,
          0.22,
          accent,
          0.2,
          1.8,
          -0.42
        ),

        palCone(
          THREE,
          0.09,
          0.3,
          accent,
          0,
          1.62,
          -0.66
        )
      );

      addEyes(
        THREE,
        group,
        1.83,
        -0.61,
        0.16
      );

      for (
        const side
        of [-1, 1]
      ) {
        const pivot =
          new THREE.Group();

        pivot.position.set(
          side * 0.45,
          1.25,
          0
        );

        pivot.add(
          makeWing(
            THREE,
            accent,
            side
          )
        );

        group.add(pivot);

        wings.push(pivot);
      }

      break;
    }

    /* DINOSAUR */
    case "dino": {
      body =
        palSphere(
          THREE,
          0.72,
          bodyColor,
          0,
          1.05,
          0,
          1.2,
          1,
          1.8
        );

      head =
        palSphere(
          THREE,
          0.42,
          bodyColor,
          0,
          1.65,
          -1.1,
          1.1,
          0.75,
          1.2
        );

      group.add(
        body,
        head
      );

      addEyes(
        THREE,
        group,
        1.75,
        -1.48,
        0.16
      );

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor,

          [
            [-0.42, -0.35],
            [0.42, -0.35],
            [-0.45, 0.45],
            [0.45, 0.45]
          ],

          0.78
        );

      for (
        let i = 0;
        i < 5;
        i++
      ) {
        group.add(
          palCone(
            THREE,
            0.1,
            0.38,
            accent,
            0,
            1.75,
            -0.3 +
            i *
            0.27
          )
        );
      }

      addTail(
        1.8,
        0.18,
        1.05
      );

      break;
    }

    /* TURTLE */
    case "turtle": {
      body =
        palSphere(
          THREE,
          0.72,
          accent,
          0,
          0.65,
          0,
          1.2,
          0.45,
          1.35
        );

      const shell =
        palSphere(
          THREE,
          0.68,
          bodyColor,
          0,
          0.9,
          0.15,
          1.05,
          0.55,
          1.2
        );

      head =
        palSphere(
          THREE,
          0.3,
          bodyColor,
          0,
          0.72,
          -0.85
        );

      group.add(
        body,
        shell,
        head
      );

      addEyes(
        THREE,
        group,
        0.79,
        -1.12,
        0.12
      );

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor,

          [
            [-0.48, -0.25],
            [0.48, -0.25],
            [-0.48, 0.4],
            [0.48, 0.4]
          ],

          0.35
        );

      break;
    }

    /* SHEEP */
    case "sheep": {
      body =
        palSphere(
          THREE,
          0.72,
          0xf0eee5,
          0,
          1,
          0,
          1.25,
          1,
          1.3
        );

      head =
        palSphere(
          THREE,
          0.34,
          bodyColor,
          0,
          1.38,
          -0.78
        );

      group.add(
        body,
        head
      );

      addEyes(
        THREE,
        group,
        1.48,
        -1.07,
        0.14
      );

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor,
          undefined,
          0.55
        );

      for (
        const side
        of [-1, 1]
      ) {
        const horn =
          new THREE.Mesh(
            new THREE
              .TorusGeometry(
                0.18,
                0.05,
                7,
                12,
                Math.PI *
                1.4
              ),

            palMaterial(
              THREE,
              accent
            )
          );

        horn.position.set(
          side * 0.25,
          1.67,
          -0.72
        );

        horn.rotation.y =
          side * 0.6;

        group.add(horn);
      }

      break;
    }

    /* MANTIS */
    case "mantis": {
      body =
        palCylinder(
          THREE,
          0.22,
          0.28,
          1.25,
          bodyColor,
          0,
          1.2,
          0
        );

      body.rotation.x =
        Math.PI / 2;

      head =
        palSphere(
          THREE,
          0.28,
          bodyColor,
          0,
          1.65,
          -0.65,
          1.2,
          0.7,
          0.9
        );

      group.add(
        body,
        head
      );

      addEyes(
        THREE,
        group,
        1.78,
        -0.88,
        0.13
      );

      for (
        const side
        of [-1, 1]
      ) {
        const arm =
          palCylinder(
            THREE,
            0.06,
            0.08,
            0.9,
            accent,
            side * 0.32,
            1.5,
            -0.25
          );

        arm.rotation.z =
          side * 0.7;

        group.add(arm);
      }

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor,

          [
            [-0.3, 0.1],
            [0.3, 0.1],
            [-0.32, 0.45],
            [0.32, 0.45]
          ],

          0.65
        );

      break;
    }

    /* SERPENT */
    case "serpent": {
      for (
        let i = 0;
        i < 7;
        i++
      ) {
        group.add(
          palSphere(
            THREE,
            0.28 -
            i *
            0.018,

            bodyColor,

            0,
            0.55 +
            i *
            0.07,

            i *
            0.38,

            1,
            1,
            1.25
          )
        );
      }

      head =
        palSphere(
          THREE,
          0.38,
          bodyColor,
          0,
          1.05,
          -0.35,
          1.1,
          0.8,
          1.1
        );

      group.add(
        head,

        palCone(
          THREE,
          0.1,
          0.42,
          accent,
          -0.18,
          1.5,
          -0.32
        ),

        palCone(
          THREE,
          0.1,
          0.42,
          accent,
          0.18,
          1.5,
          -0.32
        )
      );

      addEyes(
        THREE,
        group,
        1.14,
        -0.7,
        0.14
      );

      break;
    }

    /* HORSE */
    case "horse": {
      body =
        palSphere(
          THREE,
          0.62,
          bodyColor,
          0,
          1.15,
          0,
          1.25,
          0.8,
          1.65
        );

      const neck =
        palCylinder(
          THREE,
          0.22,
          0.28,
          1.05,
          bodyColor,
          0,
          1.65,
          -0.62
        );

      neck.rotation.x =
        -0.42;

      head =
        palSphere(
          THREE,
          0.34,
          bodyColor,
          0,
          2.12,
          -0.95,
          1,
          0.75,
          1.2
        );

      group.add(
        body,
        neck,
        head,

        palCone(
          THREE,
          0.11,
          0.45,
          accent,
          -0.17,
          2.5,
          -0.9
        ),

        palCone(
          THREE,
          0.11,
          0.45,
          accent,
          0.17,
          2.5,
          -0.9
        )
      );

      addEyes(
        THREE,
        group,
        2.2,
        -1.27,
        0.14
      );

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor,
          undefined,
          0.9
        );

      addTail(
        1,
        0.12,
        1.2
      );

      break;
    }

    /* FROG */
    case "frog": {
      body =
        palSphere(
          THREE,
          0.55,
          bodyColor,
          0,
          0.55,
          0,
          1.25,
          0.65,
          1.05
        );

      head =
        palSphere(
          THREE,
          0.48,
          bodyColor,
          0,
          0.9,
          -0.3,
          1.15,
          0.7,
          1
        );

      group.add(
        body,
        head,

        palSphere(
          THREE,
          0.16,
          accent,
          -0.24,
          1.25,
          -0.42
        ),

        palSphere(
          THREE,
          0.16,
          accent,
          0.24,
          1.25,
          -0.42
        )
      );

      addEyes(
        THREE,
        group,
        1.28,
        -0.57,
        0.23
      );

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor,

          [
            [-0.4, -0.05],
            [0.4, -0.05],
            [-0.5, 0.35],
            [0.5, 0.35]
          ],

          0.35
        );

      break;
    }

    /* SPIDER */
    case "spider": {
      body =
        palSphere(
          THREE,
          0.52,
          bodyColor,
          0,
          0.55,
          0.2,
          1,
          0.8,
          1.1
        );

      head =
        palSphere(
          THREE,
          0.35,
          accent,
          0,
          0.55,
          -0.55
        );

      group.add(
        body,
        head
      );

      addEyes(
        THREE,
        group,
        0.65,
        -0.86,
        0.15
      );

      for (
        const side
        of [-1, 1]
      ) {
        for (
          let i = 0;
          i < 4;
          i++
        ) {
          const leg =
            palCylinder(
              THREE,
              0.045,
              0.06,
              0.95,
              bodyColor,

              side *
              (
                0.45 +
                i *
                0.06
              ),

              0.55,

              -0.35 +
              i *
              0.25
            );

          leg.rotation.z =
            side *
            (
              0.9 -
              0.13 *
              i
            );

          group.add(leg);
        }
      }

      break;
    }

    /* GOLEM */
    case "golem": {
      body =
        palBox(
          THREE,
          1.2,
          1.35,
          0.85,
          bodyColor,
          0,
          1.1,
          0
        );

      head =
        palBox(
          THREE,
          0.78,
          0.62,
          0.65,
          accent,
          0,
          2.05,
          -0.08
        );

      group.add(
        body,
        head
      );

      addEyes(
        THREE,
        group,
        2.1,
        -0.43,
        0.18
      );

      for (
        const side
        of [-1, 1]
      ) {
        group.add(
          palBox(
            THREE,
            0.35,
            1.05,
            0.4,
            bodyColor,
            side * 0.82,
            1.2,
            0
          )
        );
      }

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor,

          [
            [-0.34, 0.15],
            [0.34, 0.15]
          ],

          0.85
        );

      break;
    }

    /* PENGUIN */
    case "penguin": {
      body =
        palSphere(
          THREE,
          0.52,
          0x273545,
          0,
          0.9,
          0,
          0.9,
          1.3,
          0.85
        );

      const belly =
        palSphere(
          THREE,
          0.4,
          0xf4fbff,
          0,
          0.88,
          -0.32,
          0.75,
          1,
          0.45
        );

      head =
        palSphere(
          THREE,
          0.38,
          0x273545,
          0,
          1.55,
          -0.08
        );

      group.add(
        body,
        belly,
        head,

        palCone(
          THREE,
          0.09,
          0.28,
          accent,
          0,
          1.48,
          -0.47
        )
      );

      addEyes(
        THREE,
        group,
        1.65,
        -0.4,
        0.14
      );

      legs =
        addFourLegs(
          THREE,
          group,
          accent,

          [
            [-0.22, 0.05],
            [0.22, 0.05]
          ],

          0.3
        );

      break;
    }

    default: {
      body =
        palSphere(
          THREE,
          0.6,
          bodyColor,
          0,
          1,
          0
        );

      head =
        palSphere(
          THREE,
          0.35,
          accent,
          0,
          1.6,
          -0.5
        );

      group.add(
        body,
        head
      );

      legs =
        addFourLegs(
          THREE,
          group,
          bodyColor
        );
    }
  }

  group.userData = {
    species,
    body,
    head,
    legs,
    wings,
    tail,

    animationTime:
      Math.random() *
      10
  };

  group.traverse(
    object => {
      if (
        object.isMesh
      ) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    }
  );

  return group;
}

function animatePal(
  creature,
  dt,
  moving = true
) {
  const data =
    creature.model.userData;

  data.animationTime +=
    dt;

  const time =
    data.animationTime;

  if (
    data.body
  ) {
    data.body.position.y +=
      Math.sin(
        time *
        2
      ) *
      0.0007;
  }

  if (
    data.head
  ) {
    data.head.rotation.y =
      Math.sin(
        time *
        0.8
      ) *
      0.12;
  }

  if (
    data.tail
  ) {
    data.tail.rotation.y =
      Math.sin(
        time *
        3
      ) *
      0.35;
  }

  data.legs
    ?.forEach(
      (
        leg,
        index
      ) => {
        leg.rotation.x =
          moving

            ? Math.sin(
                time *
                6 +
                index *
                Math.PI
              ) *
              0.42

            : 0;
      }
    );

  data.wings
    ?.forEach(
      (
        wing,
        index
      ) => {
        wing.rotation.z =
          Math.sin(
            time *
            4
          ) *
          0.35 *
          (
            index
              ? 1
              : -1
          );
      }
    );
}

function createPlayerModel(
  THREE
) {
  const group =
    new THREE.Group();

  group.add(
    palBox(
      THREE,
      0.55,
      0.85,
      0.32,
      0x39516e,
      0,
      1.15,
      0
    ),

    palSphere(
      THREE,
      0.24,
      0xd4ad8e,
      0,
      1.83,
      0
    )
  );

  const legs = [];

  for (
    const x
    of [
      -0.17,
      0.17
    ]
  ) {
    const pivot =
      new THREE.Group();

    pivot.position.set(
      x,
      0.75,
      0
    );

    pivot.add(
      palBox(
        THREE,
        0.18,
        0.72,
        0.2,
        0x263448,
        0,
        -0.35,
        0
      )
    );

    group.add(pivot);

    legs.push(pivot);
  }

  group.userData = {
    legs,
    time: 0
  };

  return group;
}

/* =========================================================
   PALS HOME
   ========================================================= */

function openPals() {
  cleanup3D();

  GameCenter.current =
    "pals";

  const game =
    palsDefault();

  GameCenter.pals =
    game;

  $("#contentBody").innerHTML = `
    <div class="pals-shell">

      <div class="pals-home">

        <section class="pals-hero">

          <span class="pals-hero-badge">
            GALAXY PALS V4
          </span>

          <h2>
            30+ different creature silhouettes
          </h2>

          <p>
            Foxes, dragons, wolves, birds,
            rhinos, apes, sharks, turtles,
            golems and many more.
            No single body recolored everywhere.
          </p>

          <div class="pals-hero-actions">

            <button
              class="pals-primary"
              data-pals-start
            >
              PLAY WORLD
            </button>

            <button
              class="pals-secondary"
              data-pals-reset
            >
              RESET SAVE
            </button>

          </div>

        </section>

        <aside class="pals-side">

          <div class="pals-card">
            <strong>Captured</strong>
            <span>
              ${game.box.length}
            </span>
          </div>

          <div class="pals-card">
            <strong>Party</strong>
            <span>
              ${game.party.length}/5
            </span>
          </div>

        </aside>

      </div>

    </div>
  `;
}

/* =========================================================
   PALS 3D WORLD
   ========================================================= */

async function startPals() {
  cleanup3D();

  GameCenter.current =
    "pals";

  const game =
    GameCenter.pals ||
    palsDefault();

  GameCenter.pals =
    game;

  $("#contentBody").innerHTML = `
    <div class="pals-shell">

      <div
        class="pals-world"
        id="palsWorld"
      >

        <canvas
          id="palsCanvas"
          class="pals-canvas"
        ></canvas>

        <div class="pals-vignette"></div>

        <div class="pals-hud-top">

          <div
            class="pals-zone"
            id="palsZone"
          >
            Verdant Wilds
          </div>

          <div class="pals-clock">
            GALAXY PALS
          </div>

          <div class="pals-level">
            LV ${game.level}
          </div>

        </div>

        <div
          id="palsTarget"
          class="pals-target-card"
          hidden
        ></div>

        <div
          id="pParty"
          class="pals-party"
        ></div>

        <div
          id="palsFeed"
          class="pals-feed"
        ></div>

        <div class="pals-crosshair"></div>

        <div class="pals-interact">
          Click world • WASD move • Shift sprint •
          Click attack • Q capture • F summon •
          1–5 Orbs
        </div>

        <div class="pals-hud-left">

          <div class="pals-bar-row">
            <span>HEALTH</span>

            <div class="pals-bar">
              <span
                id="palsHP"
                class="pals-health-fill"
              ></span>
            </div>

            <strong id="palsHPText">
              100
            </strong>
          </div>

          <div class="pals-bar-row">
            <span>STAMINA</span>

            <div class="pals-bar">
              <span
                id="palsStamina"
                class="pals-stamina-fill"
              ></span>
            </div>

            <strong id="palsStaminaText">
              100
            </strong>
          </div>

          <div class="pals-bar-row">
            <span>FOOD</span>

            <div class="pals-bar">
              <span
                id="palsFood"
                class="pals-hunger-fill"
              ></span>
            </div>

            <strong id="palsFoodText">
              100
            </strong>
          </div>

        </div>

        <div
          id="palsOrbWheel"
          class="pals-sphere-wheel"
        ></div>

      </div>

    </div>
  `;

  try {
    const THREE =
      await loadThree();

    const canvas =
      $("#palsCanvas");

    const worldElement =
      $("#palsWorld");

    const scene =
      new THREE.Scene();

    scene.background =
      new THREE.Color(
        0x8bc7e2
      );

    scene.fog =
      new THREE
        .FogExp2(
          0x9dcfdd,
          0.0065
        );

    const camera =
      new THREE
        .PerspectiveCamera(
          65,
          1,
          0.1,
          300
        );

    const renderer =
      new THREE
        .WebGLRenderer({
          canvas,
          antialias: true
        });

    renderer.shadowMap.enabled =
      true;

    scene.add(
      new THREE
        .HemisphereLight(
          0xdff5ff,
          0x405337,
          1.7
        )
    );

    const sun =
      new THREE
        .DirectionalLight(
          0xfff0c9,
          2.2
        );

    sun.position.set(
      40,
      60,
      25
    );

    sun.castShadow = true;

    scene.add(sun);

    const world =
      new THREE.Group();

    scene.add(world);

    const ground =
      new THREE.Mesh(
        new THREE
          .PlaneGeometry(
            340,
            340
          ),

        palMaterial(
          THREE,
          0x5c874d
        )
      );

    ground.rotation.x =
      -Math.PI / 2;

    ground.receiveShadow =
      true;

    world.add(ground);

    /* WORLD TREES AND ROCKS */

    for (
      let i = 0;
      i < 120;
      i++
    ) {
      const x =
        rand(
          -155,
          155
        );

      const z =
        rand(
          -155,
          155
        );

      if (
        Math.hypot(
          x,
          z
        ) < 15
      ) {
        continue;
      }

      if (
        Math.random() <
        0.68
      ) {
        const tree =
          new THREE.Group();

        const height =
          rand(
            3,
            6
          );

        tree.add(
          palCylinder(
            THREE,
            0.22,
            0.42,
            height,
            0x67462d,
            0,
            height / 2,
            0
          )
        );

        for (
          let j = 0;
          j < 3;
          j++
        ) {
          tree.add(
            palSphere(
              THREE,
              rand(
                1.1,
                2
              ),

              pick([
                0x3f6f39,
                0x4d7d43,
                0x5a8848
              ]),

              rand(
                -0.35,
                0.35
              ),

              height *
                0.72 +
              j *
                0.5,

              rand(
                -0.35,
                0.35
              )
            )
          );
        }

        tree.position.set(
          x,
          0,
          z
        );

        world.add(tree);
      } else {
        const rock =
          new THREE.Mesh(
            new THREE
              .DodecahedronGeometry(
                rand(
                  0.6,
                  1.8
                )
              ),

            palMaterial(
              THREE,
              0x797b74
            )
          );

        rock.position.set(
          x,
          0.7,
          z
        );

        world.add(rock);
      }
    }

    /* PLAYER */

    const playerModel =
      createPlayerModel(
        THREE
      );

    world.add(
      playerModel
    );

    const player = {
      x:
        game.x || 0,

      z:
        game.z || 8,

      yaw: 0,
      pitch: -0.12,

      hp:
        game.hp ??
        100,

      stamina:
        game.stamina ??
        100,

      hunger:
        game.hunger ??
        100
    };

    const keys =
      new Set();

    const creatures = [];
    const feed = [];

    let target = null;
    let companion = null;

    /* =====================================================
       SPAWN ALL SPECIES
       ===================================================== */

    function spawnCreature(
      species,
      index
    ) {
      const model =
        buildPal(
          THREE,
          species
        );

      const angle =
        index /
        PALS.length *
        Math.PI *
        2;

      const radius =
        28 +
        (
          index % 6
        ) *
        11;

      const creature = {
        species,
        model,

        x:
          Math.sin(angle) *
            radius +
          rand(
            -6,
            6
          ),

        z:
          Math.cos(angle) *
            radius +
          rand(
            -6,
            6
          ),

        direction:
          rand(
            0,
            Math.PI *
            2
          ),

        changeDirectionAt:
          performance.now() +
          rand(
            1000,
            3000
          ),

        hp:
          species.hp,

        maxHp:
          species.hp,

        level:
          1 +
          Math.floor(
            rand(
              0,
              8 +
              game.level
            )
          ),

        alive: true
      };

      model.position.set(
        creature.x,
        0,
        creature.z
      );

      model.traverse(
        object => {
          if (
            object.isMesh
          ) {
            object.userData.creature =
              creature;
          }
        }
      );

      world.add(model);

      creatures.push(
        creature
      );
    }

    /* EVERY SPECIES IS GUARANTEED TO SPAWN */

    PALS.forEach(
      (
        species,
        index
      ) =>
        spawnCreature(
          species,
          index
        )
    );

    /* PLUS EXTRA RANDOM WILD CREATURES */

    for (
      let i = 0;
      i < 12;
      i++
    ) {
      spawnCreature(
        pick(PALS),
        PALS.length +
        i
      );
    }

    /* TARGETING */

    const raycaster =
      new THREE.Raycaster();

    function findTarget() {
      raycaster.setFromCamera(
        new THREE.Vector2(
          0,
          0
        ),
        camera
      );

      const meshes = [];

      creatures.forEach(
        creature => {
          if (
            !creature.alive
          ) {
            return;
          }

          creature.model
            .traverse(
              object => {
                if (
                  object.isMesh
                ) {
                  meshes.push(
                    object
                  );
                }
              }
            );
        }
      );

      const hit =
        raycaster
          .intersectObjects(
            meshes,
            false
          )[0];

      target =
        hit &&
        hit.distance < 22
          ? hit.object
              .userData
              .creature
          : null;
    }

    function captureChance(
      creature
    ) {
      const hpFactor =
        1 -
        creature.hp /
        creature.maxHp;

      return clamp(
        (
          0.18 +
          hpFactor *
          0.72
        ) *

        (
          PALS_ORBS[
            game.orb
          ]?.bonus ||
          1
        ) /

        (
          1 +
          creature.species
            .rarity *
          0.2 +

          creature.level *
          0.018
        ),

        0.03,
        0.94
      );
    }

    function attackTarget() {
      if (
        !target?.alive
      ) {
        return;
      }

      target.hp -=
        14 +
        game.level *
        1.5;

      if (
        target.hp <= 0
      ) {
        target.hp = 0;

        target.alive =
          false;

        target.model.visible =
          false;

        addFeed(
          target.species.name +
          " defeated"
        );
      } else {
        addFeed(
          `${target.species.name} HP ${Math.ceil(
            target.hp
          )}`
        );
      }
    }

    function captureTarget() {
      if (
        !target?.alive
      ) {
        return;
      }

      const orbIndex =
        game.orb || 0;

      if (
        (
          game.inventory
            .orbs[
              orbIndex
            ] ||
          0
        ) <= 0
      ) {
        addFeed(
          "No Orbs"
        );

        return;
      }

      game.inventory
        .orbs[
          orbIndex
        ]--;

      const creature =
        target;

      const probability =
        captureChance(
          creature
        );

      if (
        Math.random() <
        probability
      ) {
        creature.alive =
          false;

        creature.model.visible =
          false;

        game.box.push(
          creature.species.id
        );

        if (
          game.party.length <
          5
        ) {
          game.party.push(
            creature.species.id
          );
        }

        game.xp +=
          35 *
          creature.species
            .rarity;

        addFeed(
          "Captured " +
          creature.species.name
        );

        palsSave(game);
      } else {
        addFeed(
          creature.species.name +
          " escaped"
        );
      }
    }

    function summonPal() {
      if (companion) {
        world.remove(
          companion.model
        );

        companion = null;

        addFeed(
          "Companion recalled"
        );

        return;
      }

      const id =
        game.party[0];

      const species =
        PALS.find(
          pal =>
            pal.id === id
        );

      if (!species) {
        addFeed(
          "Capture a Pal first"
        );

        return;
      }

      const model =
        buildPal(
          THREE,
          species
        );

      world.add(model);

      companion = {
        model,
        species
      };

      addFeed(
        species.name +
        " summoned"
      );
    }

    function addFeed(text) {
      feed.unshift({
        text,
        time:
          performance.now()
      });

      feed.splice(5);
    }

    function updateHUD() {
      const setBar = (
        selector,
        value
      ) =>
        $(selector)
          ?.style
          .setProperty(
            "width",
            clamp(
              value,
              0,
              100
            ) +
            "%"
          );

      setBar(
        "#palsHP",
        player.hp
      );

      setBar(
        "#palsStamina",
        player.stamina
      );

      setBar(
        "#palsFood",
        player.hunger
      );

      if (
        $("#palsHPText")
      ) {
        $("#palsHPText")
          .textContent =
          Math.round(
            player.hp
          );
      }

      if (
        $("#palsStaminaText")
      ) {
        $("#palsStaminaText")
          .textContent =
          Math.round(
            player.stamina
          );
      }

      if (
        $("#palsFoodText")
      ) {
        $("#palsFoodText")
          .textContent =
          Math.round(
            player.hunger
          );
      }

      $("#palsFeed").innerHTML =
        feed
          .filter(
            item =>
              performance.now() -
              item.time <
              5500
          )
          .map(
            item => `
              <div class="pals-feed-row">
                ${esc(item.text)}
              </div>
            `
          )
          .join("");

      $("#palsOrbWheel").innerHTML =
        PALS_ORBS
          .map(
            (
              orb,
              index
            ) => `
              <div
                class="
                  pals-sphere
                  ${
                    index ===
                    game.orb
                      ? "active"
                      : ""
                  }
                "
              >

                <b>
                  ${index + 1}
                </b>

                <span>
                  ${orb.name}
                </span>

                <small>
                  x${
                    game.inventory
                      .orbs[
                        index
                      ] ||
                    0
                  }
                </small>

              </div>
            `
          )
          .join("");

      $("#pParty").innerHTML =
        game.party
          .slice(0, 5)
          .map(
            (
              id,
              index
            ) => {
              const species =
                PALS.find(
                  pal =>
                    pal.id === id
                );

              if (!species) {
                return "";
              }

              return `
                <div class="pals-party-row">

                  <div class="pals-party-icon">
                    ${species.emoji}
                  </div>

                  <div class="pals-party-copy">

                    <strong>
                      ${species.name}
                    </strong>

                    <span>
                      ${species.form}
                      •
                      ${species.element}
                    </span>

                    <div class="pals-party-hp">
                      <span></span>
                    </div>

                  </div>

                </div>
              `;
            }
          )
          .join("");

      const targetPanel =
        $("#palsTarget");

      if (
        target?.alive
      ) {
        targetPanel.hidden =
          false;

        targetPanel.innerHTML = `
          <div class="pals-target-title">

            <strong>
              ${target.species.name}
            </strong>

            <span>
              LV ${target.level}
              •
              ${target.species.form.toUpperCase()}
            </span>

          </div>

          <div class="pals-target-hp">

            <span
              style="
                width:
                ${
                  target.hp /
                  target.maxHp *
                  100
                }%
              "
            ></span>

          </div>

          <div class="pals-capture-chance">

            <span>
              Capture chance
            </span>

            <strong>
              ${
                Math.round(
                  captureChance(
                    target
                  ) *
                  100
                )
              }%
            </strong>

          </div>
        `;
      } else {
        targetPanel.hidden =
          true;
      }
    }

    /* INPUT */

    on3D(
      canvas,
      "click",
      () =>
        canvas
          .requestPointerLock
          ?.()
    );

    on3D(
      document,
      "mousemove",
      event => {
        if (
          document.pointerLockElement !==
          canvas
        ) {
          return;
        }

        player.yaw -=
          event.movementX *
          0.0025;

        player.pitch =
          clamp(
            player.pitch -
            event.movementY *
            0.0018,

            -0.5,
            0.3
          );
      }
    );

    on3D(
      document,
      "keydown",
      event => {
        keys.add(
          event.code
        );

        if (
          /^Digit[1-5]$/
            .test(
              event.code
            )
        ) {
          game.orb =
            Number(
              event.code
                .slice(-1)
            ) -
            1;
        }

        if (
          event.code ===
          "KeyQ"
        ) {
          captureTarget();
        }

        if (
          event.code ===
          "KeyF"
        ) {
          summonPal();
        }
      }
    );

    on3D(
      document,
      "keyup",
      event =>
        keys.delete(
          event.code
        )
    );

    on3D(
      document,
      "mousedown",
      event => {
        if (
          event.button === 0 &&
          document.pointerLockElement ===
          canvas
        ) {
          attackTarget();
        }
      }
    );

    function resize() {
      renderer.setSize(
        worldElement.clientWidth,
        worldElement.clientHeight,
        false
      );

      camera.aspect =
        worldElement.clientWidth /
        worldElement.clientHeight;

      camera
        .updateProjectionMatrix();
    }

    on3D(
      window,
      "resize",
      resize
    );

    resize();

    let last =
      performance.now();

    let saveTime =
      last;

    function loop(now) {
      if (
        GameCenter.current !==
        "pals"
      ) {
        return;
      }

      const dt =
        clamp(
          (
            now -
            last
          ) /
          1000,

          0,
          0.05
        );

      last = now;

      const forward =
        (
          keys.has(
            "KeyW"
          )
            ? 1
            : 0
        ) -
        (
          keys.has(
            "KeyS"
          )
            ? 1
            : 0
        );

      const right =
        (
          keys.has(
            "KeyD"
          )
            ? 1
            : 0
        ) -
        (
          keys.has(
            "KeyA"
          )
            ? 1
            : 0
        );

      const sprint =
        keys.has(
          "ShiftLeft"
        ) &&
        player.stamina >
        1;

      const speed =
        sprint
          ? 7.4
          : 4.2;

      const sin =
        Math.sin(
          player.yaw
        );

      const cos =
        Math.cos(
          player.yaw
        );

      player.x +=
        (
          -sin *
            forward +
          cos *
            right
        ) *
        speed *
        dt;

      player.z +=
        (
          -cos *
            forward -
          sin *
            right
        ) *
        speed *
        dt;

      player.x =
        clamp(
          player.x,
          -160,
          160
        );

      player.z =
        clamp(
          player.z,
          -160,
          160
        );

      player.stamina =
        clamp(
          player.stamina +
          (
            sprint &&
            (
              forward ||
              right
            )
              ? -18
              : 13
          ) *
          dt,

          0,
          100
        );

      player.hunger =
        clamp(
          player.hunger -
          0.18 *
          dt,

          0,
          100
        );

      playerModel.position.set(
        player.x,
        0,
        player.z
      );

      playerModel.rotation.y =
        player.yaw;

      const playerData =
        playerModel.userData;

      playerData.time +=
        dt;

      playerData.legs
        .forEach(
          (
            leg,
            index
          ) => {
            leg.rotation.x =
              (
                forward ||
                right
              )

                ? Math.sin(
                    playerData.time *
                    (
                      sprint
                        ? 12
                        : 8
                    ) +
                    index *
                    Math.PI
                  ) *
                  0.55

                : 0;
          }
        );

      /* THIRD PERSON CAMERA */

      camera.position.set(
        player.x +
        Math.sin(
          player.yaw
        ) *
        7,

        3.5 +
        player.pitch *
        3,

        player.z +
        Math.cos(
          player.yaw
        ) *
        7
      );

      camera.lookAt(
        player.x,
        1.5,
        player.z
      );

      /* CREATURE AI */

      creatures.forEach(
        creature => {
          if (
            !creature.alive
          ) {
            return;
          }

          if (
            now >
            creature
              .changeDirectionAt
          ) {
            creature.direction +=
              rand(
                -1.4,
                1.4
              );

            creature
              .changeDirectionAt =
              now +
              rand(
                1200,
                3200
              );
          }

          creature.x +=
            Math.sin(
              creature.direction
            ) *
            creature.species
              .speed *
            0.14 *
            dt;

          creature.z +=
            Math.cos(
              creature.direction
            ) *
            creature.species
              .speed *
            0.14 *
            dt;

          creature.model
            .position.x =
            creature.x;

          creature.model
            .position.z =
            creature.z;

          creature.model
            .rotation.y =
            creature.direction;

          animatePal(
            creature,
            dt,
            true
          );
        }
      );

      /* FOLLOWING PAL */

      if (companion) {
        const targetX =
          player.x +
          Math.cos(
            player.yaw
          ) *
          2;

        const targetZ =
          player.z -
          Math.sin(
            player.yaw
          ) *
          2;

        companion.model
          .position.x +=
          (
            targetX -
            companion.model
              .position.x
          ) *
          Math.min(
            1,
            dt *
            4
          );

        companion.model
          .position.z +=
          (
            targetZ -
            companion.model
              .position.z
          ) *
          Math.min(
            1,
            dt *
            4
          );

        animatePal(
          {
            model:
              companion.model
          },
          dt,
          true
        );
      }

      findTarget();

      updateHUD();

      if (
        now -
        saveTime >
        5000
      ) {
        Object.assign(
          game,
          {
            x:
              player.x,

            z:
              player.z,

            hp:
              player.hp,

            stamina:
              player.stamina,

            hunger:
              player.hunger
          }
        );

        palsSave(game);

        saveTime = now;
      }

      renderer.render(
        scene,
        camera
      );

      GameCenter.raf =
        requestAnimationFrame(
          loop
        );
    }

    GameCenter.raf =
      requestAnimationFrame(
        loop
      );

    addFeed(
      "32 original creature species loaded"
    );

    addFeed(
      "Different creature body constructions are active"
    );

    addFeed(
      "Weaken a creature then press Q to capture"
    );

  } catch (error) {
    console.error(error);

    $("#contentBody").innerHTML = `
      <div class="pals-card">

        <h3>
          GALAXY PALS failed to start
        </h3>

        <p>
          ${esc(error.message)}
        </p>

      </div>
    `;
  }
}

/* =========================================================
   OPEN GAME
   ========================================================= */

function openGame(id) {
  cleanup3D();

  const games = {
    chess:
      openChess,

    tictactoe:
      openTTT,

    connect4:
      openConnect4,

    memory:
      openMemory,

    arena:
      openArena,

    snake:
      openSnake,

    chicken:
      openChicken,

    pals:
      openPals
  };

  (
    games[id] ||
    renderGames
  )();
}

/* =========================================================
   GLOBAL CLICK HANDLER
   ========================================================= */

document.addEventListener(
  "click",
  event => {
    const target =
      event.target.closest(
        "button,[data-game-open],[data-view]"
      );

    if (!target) {
      return;
    }

    if (
      target.dataset.action ===
      "new-chat"
    ) {
      newChat();
    }

    if (
      target.dataset.action ===
      "send"
    ) {
      sendMessage();
    }

    if (
      target.dataset.action ===
      "work-send"
    ) {
      sendWork();
    }

    if (
      target.dataset.view
    ) {
      setView(
        target.dataset.view
      );
    }

    if (
      target.dataset.gameOpen
    ) {
      openGame(
        target.dataset
          .gameOpen
      );
    }

    if (
      target.hasAttribute(
        "data-game-back"
      )
    ) {
      renderGames();
    }

    if (
      target.dataset.ttt !=
      null
    ) {
      tttMove(
        Number(
          target.dataset.ttt
        )
      );
    }

    if (
      target.hasAttribute(
        "data-ttt-reset"
      )
    ) {
      openTTT();
    }

    if (
      target.dataset.c4 !=
      null
    ) {
      connectMove(
        Number(
          target.dataset.c4
        )
      );
    }

    if (
      target.hasAttribute(
        "data-c4-reset"
      )
    ) {
      openConnect4();
    }

    if (
      target.dataset.memory !=
      null
    ) {
      memoryFlip(
        Number(
          target.dataset
            .memory
        )
      );
    }

    if (
      target.hasAttribute(
        "data-memory-reset"
      )
    ) {
      openMemory();
    }

    if (
      target.hasAttribute(
        "data-snake-reset"
      )
    ) {
      openSnake();
    }

    if (
      target.hasAttribute(
        "data-chicken-reset"
      )
    ) {
      openChicken();
    }

    if (
      target.dataset.chess
    ) {
      const [
        row,
        col
      ] =
        target.dataset
          .chess
          .split(",")
          .map(Number);

      chessClick(
        row,
        col
      );
    }

    if (
      target.hasAttribute(
        "data-chess-reset"
      )
    ) {
      openChess();
    }

    if (
      target.hasAttribute(
        "data-pals-start"
      )
    ) {
      startPals();
    }

    if (
      target.hasAttribute(
        "data-pals-reset"
      )
    ) {
      localStorage.removeItem(
        PALS_SAVE
      );

      GameCenter.pals =
        palsDefault();

      openPals();
    }
  }
);

/* =========================================================
   KEYBOARD
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      GameCenter.current ===
      "snake"
    ) {
      const game =
        GameCenter.snake;

      const move =
        {
          ArrowUp:
            [0, -1],

          KeyW:
            [0, -1],

          ArrowDown:
            [0, 1],

          KeyS:
            [0, 1],

          ArrowLeft:
            [-1, 0],

          KeyA:
            [-1, 0],

          ArrowRight:
            [1, 0],

          KeyD:
            [1, 0]
        }[
          event.code
        ];

      if (
        move &&
        !(
          move[0] ===
            -game.direction[0] &&
          move[1] ===
            -game.direction[1]
        )
      ) {
        game.nextDirection =
          move;
      }
    }

    if (
      GameCenter.current ===
      "chicken"
    ) {
      const move =
        {
          ArrowUp:
            [0, -1],

          KeyW:
            [0, -1],

          ArrowDown:
            [0, 1],

          KeyS:
            [0, 1],

          ArrowLeft:
            [-1, 0],

          KeyA:
            [-1, 0],

          ArrowRight:
            [1, 0],

          KeyD:
            [1, 0]
        }[
          event.code
        ];

      if (move) {
        chickenMove(
          ...move
        );
      }
    }

    if (
      event.code ===
        "Enter" &&
      !event.shiftKey &&
      document.activeElement ===
        $("#promptInput")
    ) {
      event.preventDefault();

      sendMessage();
    }

    if (
      event.code ===
        "Enter" &&
      !event.shiftKey &&
      document.activeElement ===
        $("#workPrompt")
    ) {
      event.preventDefault();

      sendWork();
    }
  }
);

$("#promptInput")
  ?.addEventListener(
    "input",
    event =>
      autoResize(
        event.target
      )
  );

window.GALAXY = {
  state,
  GameCenter,
  setView,
  newChat,
  sendMessage,
  sendWork,
  renderGames,
  openPals,
  startPals
};

setView("chat");
