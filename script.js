"use strict";

/* ============================================================
   GALAXY AI — COMPLETE SCRIPT.JS
   Chat + Work + Gaming Center + Arena + GALAXY PALS
   ============================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const clamp = (n, a, b) =>
  Math.max(a, Math.min(b, n));

const escapeHTML = (v = "") =>
  String(v).replace(
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

const clone = v =>
  JSON.parse(
    JSON.stringify(v)
  );

const rand = (a, b) =>
  a + Math.random() * (b - a);

const pick = a =>
  a[
    Math.floor(
      Math.random() * a.length
    )
  ];

const storage = {
  get(k, f = null) {
    try {
      const v =
        localStorage.getItem(k);

      return v == null
        ? f
        : JSON.parse(v);

    } catch {
      return f;
    }
  },

  set(k, v) {
    try {
      localStorage.setItem(
        k,
        JSON.stringify(v)
      );
    } catch {}
  },

  del(k) {
    try {
      localStorage.removeItem(k);
    } catch {}
  }
};


/* ============================================================
   GLOBAL STATE
   ============================================================ */

const state = {
  messages: [],
  generating: false,
  activeView: "chat"
};

const GameCenter = {
  current: null,

  chess: null,
  ttt: null,
  connect: null,
  memory: null,
  snake: null,
  chicken: null,
  arena: null,
  pals: null,

  timers: new Set()
};

const GAME_LEVELS = [
  100,
  200,
  500,
  800,
  1000,
  1200
];


/* ============================================================
   BASIC UI
   ============================================================ */

function toast(
  message,
  type = ""
) {

  let root =
    $("#toastRoot");

  if (!root) {

    root =
      document.createElement(
        "div"
      );

    root.id =
      "toastRoot";

    root.className =
      "toast-root";

    document.body.appendChild(
      root
    );
  }

  const el =
    document.createElement(
      "div"
    );

  el.className =
    `toast ${type}`.trim();

  el.textContent =
    message;

  root.appendChild(el);

  setTimeout(
    () => el.remove(),
    2600
  );
}


function clearGameTimers() {

  for (
    const timer of
    GameCenter.timers
  ) {

    clearInterval(timer);
    clearTimeout(timer);
  }

  GameCenter.timers.clear();
}


function trackTimer(timer) {

  GameCenter.timers.add(
    timer
  );

  return timer;
}


function setView(name) {

  state.activeView =
    name;

  $$(".view").forEach(
    view => {
      view.classList.remove(
        "active-view"
      );
    }
  );

  const map = {
    chat: "#chatView",
    work: "#workView",
    games: "#contentView",
    projects: "#contentView",
    library: "#contentView",
    studio: "#contentView"
  };

  $(
    map[name] ||
    "#chatView"
  )?.classList.add(
    "active-view"
  );

  $$("[data-view]").forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.view ===
          name
      );
    }
  );


  if (
    name !== "games"
  ) {
    cleanup3D();
  }


  if (
    name === "games"
  ) {

    renderGames();

  } else if (
    name === "projects"
  ) {

    renderSimplePage(
      "Projects",
      "Your GALAXY projects will appear here."
    );

  } else if (
    name === "library"
  ) {

    renderSimplePage(
      "Library",
      "Files, images and generated assets."
    );

  } else if (
    name === "studio"
  ) {

    renderSimplePage(
      "Create Studio",
      "Image and video creative tools."
    );
  }
}


function renderSimplePage(
  title,
  text
) {

  if (
    $("#contentTitle")
  ) {
    $("#contentTitle")
      .textContent =
      title;
  }

  if (
    $("#contentEyebrow")
  ) {
    $("#contentEyebrow")
      .textContent =
      "GALAXY";
  }

  if (
    $("#contentBody")
  ) {

    $("#contentBody")
      .innerHTML = `

        <div class="panel">

          <h3>
            ${escapeHTML(title)}
          </h3>

          <p>
            ${escapeHTML(text)}
          </p>

        </div>

      `;
  }
}


function newChat() {

  state.messages = [];

  if (
    $("#messages")
  ) {

    $("#messages")
      .innerHTML =
      "";
  }

  $("#chatEmpty")
    ?.classList
    .remove(
      "hidden"
    );

  $("#promptInput")
    ?.focus();

  setView(
    "chat"
  );
}


function autoResize(el) {

  if (!el) {
    return;
  }

  el.style.height =
    "auto";

  el.style.height =
    `${Math.min(
      el.scrollHeight,
      180
    )}px`;
}


/* ============================================================
   CHAT
   ============================================================ */

function renderMessage(
  role,
  text
) {

  const root =
    $("#messages");

  if (!root) {
    return;
  }

  $("#chatEmpty")
    ?.classList
    .add(
      "hidden"
    );

  const row =
    document.createElement(
      "div"
    );

  row.className =
    `message ${role}`;

  const bubble =
    document.createElement(
      "div"
    );

  bubble.className =
    "bubble";

  bubble.textContent =
    text;

  row.appendChild(
    bubble
  );

  root.appendChild(
    row
  );

  row.scrollIntoView({
    behavior: "smooth",
    block: "end"
  });
}


function updateSendButtonState() {

  const button =
    $("#sendButton");

  if (!button) {
    return;
  }

  button.textContent =
    state.generating
      ? "■"
      : "↑";

  button.classList.toggle(
    "is-stop",
    state.generating
  );

  button.setAttribute(
    "aria-label",
    state.generating
      ? "Stop"
      : "Send"
  );
}


/* ============================================================
   GEMINI
   ============================================================ */

async function fetchAIResponse(
  message,
  includeHistory = true
) {

  const creatorContext =
    "You are GALAXY AI. " +
    "GALAXY AI was created and founded by Harshavardhan. " +
    "If asked who created, made, founded, designed or owns GALAXY AI, " +
    "answer: Harshavardhan created GALAXY AI. " +
    "GALAXY uses Gemini through an API for AI responses. " +
    "Be helpful, intelligent, clear and concise.";


  const payload = {

    message,

    prompt:
      message,

    mode:
      includeHistory
        ? "chat"
        : "work",

    system:
      creatorContext,

    messages: [

      {
        role: "system",
        content:
          creatorContext
      },

      ...(
        includeHistory

          ? state.messages
              .slice(
                0,
                -1
              )
              .slice(
                -20
              )
              .map(
                item => ({
                  role:
                    item.role,

                  content:
                    item.text
                })
              )

          : []
      ),

      {
        role: "user",
        content:
          message
      }
    ]
  };


  const response =
    await fetch(
      "/api/gemini",
      {

        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(
            payload
          )
      }
    );


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if (
    !response.ok
  ) {

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


  input.value =
    "";

  autoResize(
    input
  );


  state.messages.push({
    role: "user",
    text
  });


  renderMessage(
    "user",
    text
  );


  state.generating =
    true;

  updateSendButtonState();


  if (
    $("#draftState")
  ) {

    $("#draftState")
      .textContent =
      "GALAXY is thinking…";
  }


  try {

    const reply =
      await fetchAIResponse(
        text
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
      `GALAXY error: ${error.message}`
    );

    toast(
      error.message,
      "error"
    );

  } finally {

    state.generating =
      false;

    updateSendButtonState();


    if (
      $("#draftState")
    ) {

      $("#draftState")
        .textContent =
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
      `GALAXY error: ${error.message}`;

    toast(
      error.message,
      "error"
    );
  }
}


/* ============================================================
   GAMING CENTER
   ============================================================ */

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

      <div
        class="game-card-visual"
      >
        ${icon}
      </div>


      <div
        class="game-card-copy"
      >

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


function renderGames() {

  cleanup3D();

  clearGameTimers();

  GameCenter.current =
    null;


  if (
    $("#contentTitle")
  ) {

    $("#contentTitle")
      .textContent =
      "Gaming Center";
  }


  if (
    $("#contentEyebrow")
  ) {

    $("#contentEyebrow")
      .textContent =
      "PLAY WITH GALAXY";
  }


  const body =
    $("#contentBody");

  if (!body) {
    return;
  }


  body.innerHTML = `

    <div
      class="games-home"
    >

      <div
        class="games-hero"
      >

        <div>

          <span
            class="eyebrow"
          >
            GALAXY GAMING
          </span>

          <h2>
            Choose a game
          </h2>

          <p>
            Classic games,
            3D arena combat
            and creature survival.
          </p>

        </div>

        <div
          class="games-hero-mark"
        >
          ✦
        </div>

      </div>


      <div
        class="games-grid"
      >

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
          "vs GALAXY or Friend"
        )}

        ${gameCard(
          "connect4",
          "●●",
          "Connect Four",
          "vs GALAXY or Friend"
        )}

        ${gameCard(
          "memory",
          "▦",
          "Memory",
          "Match pairs • Score"
        )}

        ${gameCard(
          "arena",
          "⌖",
          "GALAXY Arena",
          "3D FPS • Bots • FFA • Practice"
        )}

        ${gameCard(
          "snake",
          "◉",
          "Snake",
          "Single player • Levels • High score"
        )}

        ${gameCard(
          "chicken",
          "🐔",
          "Chicken Crossing",
          "Road • Safe grass • Levels"
        )}

        ${gameCard(
          "pals",
          "✦",
          "GALAXY PALS",
          "3D creature survival • Capture • Craft • Build"
        )}

      </div>

    </div>

  `;
}


function gameTop(
  title,
  message,
  extra = ""
) {

  return `

    <div
      class="game-topline"
    >

      <button
        class="secondary-btn"
        data-game-back
      >
        ← Games
      </button>


      <div
        class="game-status"
      >
        ${escapeHTML(message)}
      </div>


      ${extra}

    </div>

  `;
}


function modeSelect(game) {

  return `

    <div
      class="game-toolbar"
    >

      <select
        data-mode
      >

        <option
          value="galaxy"
          ${
            game.mode ===
            "galaxy"
              ? "selected"
              : ""
          }
        >
          You vs GALAXY
        </option>

        <option
          value="friend"
          ${
            game.mode ===
            "friend"
              ? "selected"
              : ""
          }
        >
          You vs Friend
        </option>

      </select>


      <select
        data-level
        ${
          game.mode ===
          "friend"
            ? "disabled"
            : ""
        }
      >

        ${
          GAME_LEVELS
            .map(
              level => `

                <option
                  ${
                    level ===
                    game.elo
                      ? "selected"
                      : ""
                  }
                >
                  ${level}
                </option>

              `
            )
            .join("")
        }

      </select>

    </div>

  `;
}


/* ============================================================
   CHESS
   ============================================================ */

const CHESS_P = {

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


const CHESS_V = {

  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100
};


function chessBoard() {

  return [

    "rnbqkbnr"
      .split(""),

    "pppppppp"
      .split(""),

    ...Array.from(
      {
        length: 4
      },
      () =>
        Array(8)
          .fill("")
    ),

    "PPPPPPPP"
      .split(""),

    "RNBQKBNR"
      .split("")
  ];
}


const white =
  piece =>
    piece &&
    piece ===
      piece.toUpperCase();


const same =
  (
    a,
    b
  ) =>
    a &&
    b &&
    white(a) ===
      white(b);


function chessMoves(
  board,
  r,
  c
) {

  const piece =
    board[r][c];

  if (!piece) {
    return [];
  }


  const isWhite =
    white(piece);

  const type =
    piece.toLowerCase();

  const moves =
    [];


  const add =
    (
      rr,
      cc
    ) => {

      if (
        rr < 0 ||
        rr > 7 ||
        cc < 0 ||
        cc > 7
      ) {
        return false;
      }


      if (
        !board[rr][cc]
      ) {

        moves.push([
          rr,
          cc
        ]);

        return true;
      }


      if (
        !same(
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


  if (
    type === "p"
  ) {

    const direction =
      isWhite
        ? -1
        : 1;

    const start =
      isWhite
        ? 6
        : 1;


    if (
      r + direction >= 0 &&
      r + direction < 8 &&
      !board[
        r + direction
      ][c]
    ) {

      moves.push([
        r + direction,
        c
      ]);


      if (
        r === start &&
        !board[
          r +
          2 *
          direction
        ][c]
      ) {

        moves.push([
          r +
          2 *
          direction,
          c
        ]);
      }
    }


    [-1, 1]
      .forEach(
        dc => {

          const rr =
            r +
            direction;

          const cc =
            c +
            dc;


          if (
            rr >= 0 &&
            rr < 8 &&
            cc >= 0 &&
            cc < 8 &&
            board[rr][cc] &&
            !same(
              piece,
              board[rr][cc]
            )
          ) {

            moves.push([
              rr,
              cc
            ]);
          }
        }
      );
  }


  if (
    type === "n"
  ) {

    [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2]
    ]
      .forEach(
        ([dr, dc]) =>
          add(
            r + dr,
            c + dc
          )
      );
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
            r + dr,
            c + dc
          );
        }
      }
    }
  }


  if (
    "rbq"
      .includes(type)
  ) {

    const directions =
      [];


    if (
      "rq"
        .includes(type)
    ) {

      directions.push(
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      );
    }


    if (
      "bq"
        .includes(type)
    ) {

      directions.push(
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1]
      );
    }


    directions.forEach(
      ([dr, dc]) => {

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

          if (
            !add(
              rr,
              cc
            )
          ) {
            break;
          }

          rr += dr;
          cc += dc;
        }
      }
    );
  }


  return moves;
}


function allChess(side) {

  const game =
    GameCenter.chess;

  const result =
    [];


  game.board.forEach(
    (
      row,
      r
    ) => {

      row.forEach(
        (
          piece,
          c
        ) => {

          if (
            piece &&
            (
              (
                side ===
                "white"
              ) ===
              white(piece)
            )
          ) {

            chessMoves(
              game.board,
              r,
              c
            )
              .forEach(
                to => {

                  result.push({

                    from: [
                      r,
                      c
                    ],

                    to,

                    p:
                      piece,

                    target:
                      game.board[
                        to[0]
                      ][
                        to[1]
                      ]
                  });
                }
              );
          }
        }
      );
    }
  );


  return result;
}


function scoreChess(move) {

  return (

    (
      move.target

        ? (
            CHESS_V[
              move.target
                .toLowerCase()
            ] ||
            0
          ) *
          10

        : 0
    )

    +

    Math.max(
      0,
      7 -
      (
        Math.abs(
          3.5 -
          move.to[0]
        )
        +
        Math.abs(
          3.5 -
          move.to[1]
        )
      )
    )
  );
}


function resetChess(
  keep = true
) {

  const old =
    GameCenter.chess ||
    {};


  GameCenter.chess = {

    board:
      chessBoard(),

    turn:
      "white",

    selected:
      null,

    legal:
      [],

    mode:
      keep
        ? old.mode ||
          "galaxy"
        : "galaxy",

    elo:
      keep
        ? old.elo ||
          500
        : 500,

    history:
      [],

    snapshots:
      [],

    finished:
      false,

    message:
      "Your turn"
  };


  renderChess();
}


function applyChess(
  move,
  actor
) {

  const game =
    GameCenter.chess;


  game.snapshots.push(
    clone({

      board:
        game.board,

      turn:
        game.turn,

      history:
        game.history,

      finished:
        game.finished,

      message:
        game.message
    })
  );


  game.board[
    move.to[0]
  ][
    move.to[1]
  ] =
    move.p;


  game.board[
    move.from[0]
  ][
    move.from[1]
  ] =
    "";


  if (
    move.p === "P" &&
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
    move.p === "p" &&
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
    `${actor}: ${move.from.join(",")} → ${move.to.join(",")}`
  );


  game.selected =
    null;

  game.legal =
    [];


  game.turn =
    game.turn ===
    "white"
      ? "black"
      : "white";


  const pieces =
    game.board.flat();


  if (
    !pieces.includes(
      "K"
    ) ||
    !pieces.includes(
      "k"
    )
  ) {

    game.finished =
      true;

    game.message =
      pieces.includes(
        "K"
      )
        ? "🏆 You Win!"
        : `🏆 ${
            game.mode ===
            "friend"
              ? "Friend"
              : "GALAXY"
          } Wins!`;
  }
}


function clickChess(
  r,
  c
) {

  const game =
    GameCenter.chess;


  if (
    !game ||
    game.finished ||
    (
      game.mode ===
      "galaxy" &&
      game.turn !==
      "white"
    )
  ) {
    return;
  }


  if (
    game.selected
  ) {

    const allowed =
      game.legal.some(
        position =>
          position[0] === r &&
          position[1] === c
      );


    if (allowed) {

      const [
        fromR,
        fromC
      ] =
        game.selected;


      const piece =
        game.board[
          fromR
        ][
          fromC
        ];


      applyChess(
        {

          from: [
            fromR,
            fromC
          ],

          to: [
            r,
            c
          ],

          p:
            piece,

          target:
            game.board[r][c]
        },

        game.mode ===
        "friend"
          ? (
              game.turn ===
              "white"
                ? "Player 1"
                : "Friend"
            )
          : "You"
      );


      game.message =
        game.finished

          ? game.message

          : (
              game.mode ===
              "friend"

                ? `${
                    game.turn ===
                    "white"
                      ? "Player 1"
                      : "Friend"
                  } turn`

                : "GALAXY is thinking…"
            );


      renderChess();


      if (
        game.mode ===
        "galaxy" &&
        !game.finished
      ) {

        trackTimer(
          setTimeout(
            galaxyChess,
            250
          )
        );
      }


      return;
    }
  }


  const piece =
    game.board[r][c];


  const side =
    game.mode ===
    "friend"
      ? game.turn
      : "white";


  if (
    piece &&
    (
      (
        side === "white"
      ) ===
      white(piece)
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

    game.selected =
      null;

    game.legal =
      [];
  }


  renderChess();
}


function galaxyChess() {

  const game =
    GameCenter.chess;


  if (
    !game ||
    game.finished
  ) {
    return;
  }


  const moves =
    allChess(
      "black"
    );


  if (
    !moves.length
  ) {

    game.finished =
      true;

    game.message =
      "Draw";

    renderChess();

    return;
  }


  moves.sort(
    (
      a,
      b
    ) =>
      scoreChess(b) -
      scoreChess(a)
  );


  const smart =
    Math.random() <
    clamp(
      0.25 +
      game.elo /
      1600,
      0.25,
      0.95
    );


  const move =
    smart

      ? pick(
          moves.slice(
            0,
            Math.min(
              4,
              moves.length
            )
          )
        )

      : pick(
          moves
        );


  applyChess(
    move,
    "GALAXY"
  );


  game.message =
    game.finished
      ? game.message
      : "Your turn";


  renderChess();
}


function renderChess() {

  const game =
    GameCenter.chess;


  if (!game) {

    resetChess();

    return;
  }


  GameCenter.current =
    "chess";


  const body =
    $("#contentBody");


  body.innerHTML = `

    <div
      class="game-shell"
    >

      ${
        gameTop(
          "Chess",
          game.message,
          modeSelect(game)
        )
      }


      <div
        class="game-layout"
      >

        <div
          class="chess-board-wrap"
        >

          <div
            class="chess-board"
          >

            ${
              game.board
                .map(
                  (
                    row,
                    r
                  ) =>

                    row
                      .map(
                        (
                          piece,
                          c
                        ) => {

                          const selected =
                            game.selected?.[0] === r &&
                            game.selected?.[1] === c;


                          const legal =
                            game.legal.some(
                              position =>
                                position[0] === r &&
                                position[1] === c
                            );


                          return `

                            <button

                              class="
                                chess-square
                                ${
                                  (r + c) %
                                  2
                                    ? "dark"
                                    : "light"
                                }

                                ${
                                  selected
                                    ? "selected"
                                    : ""
                                }

                                ${
                                  legal
                                    ? "legal"
                                    : ""
                                }

                                ${
                                  legal &&
                                  piece
                                    ? "capture"
                                    : ""
                                }
                              "

                              data-chess="${r},${c}"

                            >

                              ${
                                piece

                                  ? `
                                    <span
                                      class="
                                        chess-piece
                                        ${
                                          white(
                                            piece
                                          )
                                            ? "silver-piece"
                                            : "gold-piece"
                                        }
                                      "
                                    >
                                      ${CHESS_P[piece]}
                                    </span>
                                  `

                                  : ""
                              }

                            </button>

                          `;
                        }
                      )
                      .join("")
                )
                .join("")
            }

          </div>

        </div>


        <div
          class="game-side-panel"
        >

          <div
            class="player-card"
          >

            <strong>
              You
            </strong>

            <span>
              White
            </span>

          </div>


          <div
            class="player-card"
          >

            <strong>
              ${
                game.mode ===
                "friend"
                  ? "Friend"
                  : "GALAXY"
              }
            </strong>

            <span>
              Black •
              ${game.elo} ELO
            </span>

          </div>


          <div
            class="move-history"
          >

            <strong>
              Moves
            </strong>

            <div
              class="move-history-list"
            >

              ${
                game.history
                  .map(
                    escapeHTML
                  )
                  .map(
                    move =>
                      `<div>${move}</div>`
                  )
                  .join("")
                ||
                "No moves yet"
              }

            </div>

          </div>


          <button
            class="secondary-btn"
            data-chess-undo
          >
            Undo
          </button>


          <button
            class="primary-btn"
            data-chess-reset
          >
            New Game
          </button>

        </div>

      </div>

    </div>

  `;
}


/* ============================================================
   TIC TAC TOE
   ============================================================ */

const TWIN = [

  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],

  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],

  [0, 4, 8],
  [2, 4, 6]
];


function tWinner(board) {

  for (
    const [
      a,
      b,
      c
    ] of TWIN
  ) {

    if (
      board[a] &&
      board[a] ===
      board[b] &&
      board[a] ===
      board[c]
    ) {

      return board[a];
    }
  }


  return board.every(
    Boolean
  )
    ? "draw"
    : null;
}


function tBest(
  board,
  symbol
) {

  for (
    let i = 0;
    i < 9;
    i++
  ) {

    if (
      !board[i]
    ) {

      const test =
        [...board];

      test[i] =
        symbol;


      if (
        tWinner(test) ===
        symbol
      ) {

        return i;
      }
    }
  }


  const enemy =
    symbol === "X"
      ? "O"
      : "X";


  for (
    let i = 0;
    i < 9;
    i++
  ) {

    if (
      !board[i]
    ) {

      const test =
        [...board];

      test[i] =
        enemy;


      if (
        tWinner(test) ===
        enemy
      ) {

        return i;
      }
    }
  }


  if (
    !board[4]
  ) {

    return 4;
  }


  return (
    pick(
      board
        .map(
          (
            value,
            index
          ) =>
            value
              ? null
              : index
        )
        .filter(
          value =>
            value !==
            null
        )
    )
    ??
    -1
  );
}


function resetTTT(
  keep = true
) {

  const old =
    GameCenter.ttt ||
    {};


  GameCenter.ttt = {

    board:
      Array(9)
        .fill(""),

    turn:
      "X",

    mode:
      keep
        ? old.mode ||
          "galaxy"
        : "galaxy",

    elo:
      keep
        ? old.elo ||
          500
        : 500,

    finished:
      false,

    message:
      "Your turn",

    snapshots:
      []
  };


  renderTTT();
}


function tMove(index) {

  const game =
    GameCenter.ttt;


  if (
    !game ||
    game.finished ||
    game.board[index] ||
    (
      game.mode ===
      "galaxy" &&
      game.turn !==
      "X"
    )
  ) {
    return;
  }


  game.snapshots.push(
    clone(game)
  );


  game.board[index] =
    game.turn;


  const winner =
    tWinner(
      game.board
    );


  if (winner) {

    game.finished =
      true;


    game.message =

      winner === "draw"

        ? "Draw"

        : (
            winner === "X"

              ? "🏆 You Win!"

              : `🏆 ${
                  game.mode ===
                  "friend"
                    ? "Friend"
                    : "GALAXY"
                } Wins!`
          );


    renderTTT();

    return;
  }


  game.turn =
    game.turn === "X"
      ? "O"
      : "X";


  if (
    game.mode ===
    "friend"
  ) {

    game.message =
      `${
        game.turn ===
        "X"
          ? "Player 1"
          : "Friend"
      } turn`;

    renderTTT();

    return;
  }


  game.message =
    "GALAXY is thinking…";

  renderTTT();


  trackTimer(
    setTimeout(
      () => {

        const move =

          Math.random() <
          clamp(
            0.25 +
            game.elo /
            1500,
            0.25,
            0.95
          )

            ? tBest(
                game.board,
                "O"
              )

            : pick(
                game.board
                  .map(
                    (
                      value,
                      i
                    ) =>
                      value
                        ? null
                        : i
                  )
                  .filter(
                    value =>
                      value !==
                      null
                  )
              );


        if (
          move == null
        ) {
          return;
        }


        game.board[move] =
          "O";


        const result =
          tWinner(
            game.board
          );


        if (result) {

          game.finished =
            true;

          game.message =
            result ===
            "draw"
              ? "Draw"
              : "🤖 GALAXY Wins!";

        } else {

          game.turn =
            "X";

          game.message =
            "Your turn";
        }


        renderTTT();

      },
      240
    )
  );
}


function renderTTT() {

  const game =
    GameCenter.ttt;


  if (!game) {

    resetTTT();

    return;
  }


  GameCenter.current =
    "tictactoe";


  $("#contentBody")
    .innerHTML = `

      <div
        class="game-shell"
      >

        ${
          gameTop(
            "Tic-Tac-Toe",
            game.message,
            modeSelect(game)
          )
        }


        <div
          class="game-layout"
        >

          <div
            class="ttt-board"
          >

            ${
              game.board
                .map(
                  (
                    value,
                    index
                  ) => `

                    <button

                      class="
                        ttt-cell
                        ${
                          value
                            ? `filled ${value.toLowerCase()}`
                            : ""
                        }
                      "

                      data-ttt="${index}"

                    >
                      ${value}
                    </button>

                  `
                )
                .join("")
            }

          </div>


          <div
            class="game-side-panel"
          >

            <button
              class="primary-btn"
              data-ttt-reset
            >
              New Game
            </button>

          </div>

        </div>

      </div>

    `;
}


/* ============================================================
   CONNECT FOUR
   ============================================================ */

function newC4() {

  return Array.from(
    {
      length: 6
    },
    () =>
      Array(7)
        .fill("")
  );
}


function cRow(
  board,
  col
) {

  for (
    let row = 5;
    row >= 0;
    row--
  ) {

    if (
      !board[row][col]
    ) {

      return row;
    }
  }


  return -1;
}


function cWin(board) {

  for (
    let r = 0;
    r < 6;
    r++
  ) {

    for (
      let c = 0;
      c < 7;
      c++
    ) {

      const symbol =
        board[r][c];

      if (!symbol) {
        continue;
      }


      for (
        const [
          dr,
          dc
        ] of
        [
          [0, 1],
          [1, 0],
          [1, 1],
          [1, -1]
        ]
      ) {

        let count =
          1;


        for (
          let k = 1;
          k < 4;
          k++
        ) {

          const rr =
            r +
            dr *
            k;

          const cc =
            c +
            dc *
            k;


          if (
            rr < 0 ||
            rr > 5 ||
            cc < 0 ||
            cc > 6 ||
            board[rr][cc] !==
            symbol
          ) {
            break;
          }


          count++;
        }


        if (
          count >= 4
        ) {

          return symbol;
        }
      }
    }
  }


  return board
    .flat()
    .every(Boolean)

      ? "draw"

      : null;
}


function cBest(
  board,
  symbol
) {

  for (
    let c = 0;
    c < 7;
    c++
  ) {

    const row =
      cRow(
        board,
        c
      );

    if (
      row < 0
    ) {
      continue;
    }


    const test =
      board.map(
        row =>
          [...row]
      );

    test[row][c] =
      symbol;


    if (
      cWin(test) ===
      symbol
    ) {

      return c;
    }
  }


  const enemy =
    symbol === "R"
      ? "Y"
      : "R";


  for (
    let c = 0;
    c < 7;
    c++
  ) {

    const row =
      cRow(
        board,
        c
      );

    if (
      row < 0
    ) {
      continue;
    }


    const test =
      board.map(
        row =>
          [...row]
      );

    test[row][c] =
      enemy;


    if (
      cWin(test) ===
      enemy
    ) {

      return c;
    }
  }


  return (
    [
      3,
      2,
      4,
      1,
      5,
      0,
      6
    ]
      .find(
        col =>
          cRow(
            board,
            col
          ) >= 0
      )
    ??
    -1
  );
}


function resetConnect(
  keep = true
) {

  const old =
    GameCenter.connect ||
    {};


  GameCenter.connect = {

    board:
      newC4(),

    turn:
      "R",

    mode:
      keep
        ? old.mode ||
          "galaxy"
        : "galaxy",

    elo:
      keep
        ? old.elo ||
          500
        : 500,

    finished:
      false,

    message:
      "Your turn"
  };


  renderConnect();
}


function cMove(col) {

  const game =
    GameCenter.connect;


  if (
    !game ||
    game.finished ||
    (
      game.mode ===
      "galaxy" &&
      game.turn !==
      "R"
    )
  ) {
    return;
  }


  const row =
    cRow(
      game.board,
      col
    );


  if (
    row < 0
  ) {

    toast(
      "Column full"
    );

    return;
  }


  game.board[row][col] =
    game.turn;


  let winner =
    cWin(
      game.board
    );


  if (winner) {

    game.finished =
      true;


    game.message =

      winner === "draw"

        ? "Draw"

        : (
            winner === "R"

              ? "🏆 You Win!"

              : `🏆 ${
                  game.mode ===
                  "friend"
                    ? "Friend"
                    : "GALAXY"
                } Wins!`
          );


    renderConnect();

    return;
  }


  game.turn =
    game.turn === "R"
      ? "Y"
      : "R";


  if (
    game.mode ===
    "friend"
  ) {

    game.message =
      `${
        game.turn ===
        "R"
          ? "Player 1"
          : "Friend"
      } turn`;

    renderConnect();

    return;
  }


  game.message =
    "GALAXY is thinking…";

  renderConnect();


  trackTimer(
    setTimeout(
      () => {

        const move =

          Math.random() <
          clamp(
            0.25 +
            game.elo /
            1500,
            0.25,
            0.95
          )

            ? cBest(
                game.board,
                "Y"
              )

            : pick(
                [
                  ...Array(7)
                    .keys()
                ]
                  .filter(
                    col =>
                      cRow(
                        game.board,
                        col
                      ) >= 0
                  )
              );


        const row =
          cRow(
            game.board,
            move
          );


        if (
          row >= 0
        ) {

          game.board[row][move] =
            "Y";
        }


        winner =
          cWin(
            game.board
          );


        if (winner) {

          game.finished =
            true;

          game.message =
            winner === "draw"
              ? "Draw"
              : "🤖 GALAXY Wins!";

        } else {

          game.turn =
            "R";

          game.message =
            "Your turn";
        }


        renderConnect();

      },
      260
    )
  );
}


function renderConnect() {

  const game =
    GameCenter.connect;


  if (!game) {

    resetConnect();

    return;
  }


  GameCenter.current =
    "connect4";


  $("#contentBody")
    .innerHTML = `

      <div
        class="game-shell"
      >

        ${
          gameTop(
            "Connect Four",
            game.message,
            modeSelect(game)
          )
        }


        <div
          class="game-layout"
        >

          <div
            class="connect-board"
          >

            ${
              game.board
                .map(
                  row =>
                    row
                      .map(
                        (
                          value,
                          col
                        ) => `

                          <button

                            class="
                              connect-cell
                              ${
                                value ===
                                "R"
                                  ? "red"
                                  : (
                                      value ===
                                      "Y"
                                        ? "yellow"
                                        : ""
                                    )
                              }
                            "

                            data-c4="${col}"

                            aria-label="Column ${col + 1}"

                          >
                            <span></span>
                          </button>

                        `
                      )
                      .join("")
                )
                .join("")
            }

          </div>


          <div
            class="game-side-panel"
          >

            <button
              class="primary-btn"
              data-c4-reset
            >
              New Game
            </button>

          </div>

        </div>

      </div>

    `;
}


/* ============================================================
   MEMORY
   ============================================================ */

const MEM_ICONS = [
  "✦",
  "☀",
  "☁",
  "☂",
  "★",
  "◆",
  "●",
  "▲"
];


function resetMemory() {

  const values = [
    ...MEM_ICONS,
    ...MEM_ICONS
  ]
    .sort(
      () =>
        Math.random() -
        0.5
    );


  GameCenter.memory = {

    cards:
      values.map(
        (
          value,
          index
        ) => ({
          v: value,
          i: index,
          open: false,
          done: false
        })
      ),

    first:
      null,

    locked:
      false,

    moves:
      0,

    pairs:
      0,

    message:
      "Find all pairs"
  };


  renderMemory();
}


function memClick(index) {

  const game =
    GameCenter.memory;

  const card =
    game.cards[index];


  if (
    !game ||
    game.locked ||
    card.open ||
    card.done
  ) {
    return;
  }


  card.open =
    true;


  if (
    game.first == null
  ) {

    game.first =
      index;

    renderMemory();

    return;
  }


  game.moves++;


  const first =
    game.cards[
      game.first
    ];


  if (
    first.v ===
    card.v
  ) {

    first.done =
      true;

    card.done =
      true;

    game.pairs++;

    game.first =
      null;


    game.message =
      game.pairs === 8
        ? `🏆 Completed in ${game.moves} moves`
        : "Match!";


    renderMemory();

  } else {

    game.locked =
      true;

    renderMemory();


    trackTimer(
      setTimeout(
        () => {

          first.open =
            false;

          card.open =
            false;

          game.first =
            null;

          game.locked =
            false;

          game.message =
            "Try again";

          renderMemory();

        },
        650
      )
    );
  }
}


function renderMemory() {

  const game =
    GameCenter.memory;


  if (!game) {

    resetMemory();

    return;
  }


  GameCenter.current =
    "memory";


  $("#contentBody")
    .innerHTML = `

      <div
        class="game-shell"
      >

        ${
          gameTop(
            "Memory",
            game.message
          )
        }


        <div
          class="game-layout"
        >

          <div
            class="memory-board"
          >

            ${
              game.cards
                .map(
                  card => `

                    <button

                      class="
                        memory-card
                        ${
                          card.open ||
                          card.done
                            ? "open"
                            : ""
                        }

                        ${
                          card.done
                            ? "matched"
                            : ""
                        }
                      "

                      data-mem="${card.i}"

                    >

                      ${
                        card.open ||
                        card.done
                          ? card.v
                          : "?"
                      }

                    </button>

                  `
                )
                .join("")
            }

          </div>


          <div
            class="game-side-panel"
          >

            <div
              class="score-card"
            >

              <span>
                Moves
              </span>

              <strong>
                ${game.moves}
              </strong>

            </div>


            <div
              class="score-card"
            >

              <span>
                Pairs
              </span>

              <strong>
                ${game.pairs}/8
              </strong>

            </div>


            <button
              class="primary-btn"
              data-mem-reset
            >
              New Game
            </button>

          </div>

        </div>

      </div>

    `;
}


/* ============================================================
   SNAKE
   ============================================================ */

const SNAKE_KEY =
  "galaxy.snake.high.v2";


function resetSnake(
  level =
    GameCenter.snake?.level ||
    3
) {

  clearGameTimers();


  GameCenter.snake = {

    grid:
      20,

    snake: [
      [10, 10],
      [9, 10],
      [8, 10]
    ],

    dir: [
      1,
      0
    ],

    next: [
      1,
      0
    ],

    food: [
      15,
      10
    ],

    score:
      0,

    high:
      Number(
        storage.get(
          SNAKE_KEY,
          0
        )
      ) ||
      0,

    running:
      false,

    over:
      false,

    level,

    message:
      "Press Start"
  };


  renderSnake();
}


function snakeFood(game) {

  do {

    game.food = [

      Math.floor(
        Math.random() *
        game.grid
      ),

      Math.floor(
        Math.random() *
        game.grid
      )
    ];

  } while (
    game.snake.some(
      ([x, y]) =>
        x ===
        game.food[0] &&
        y ===
        game.food[1]
    )
  );
}


function snakeTick() {

  const game =
    GameCenter.snake;


  if (
    !game?.running ||
    game.over
  ) {
    return;
  }


  game.dir =
    game.next;


  const head =
    game.snake[0];


  const next = [

    head[0] +
    game.dir[0],

    head[1] +
    game.dir[1]
  ];


  if (
    next[0] < 0 ||
    next[0] >=
    game.grid ||
    next[1] < 0 ||
    next[1] >=
    game.grid ||
    game.snake.some(
      ([x, y]) =>
        x === next[0] &&
        y === next[1]
    )
  ) {

    game.over =
      true;

    game.running =
      false;

    game.message =
      "Game Over";

    renderSnake();

    return;
  }


  game.snake.unshift(
    next
  );


  if (
    next[0] ===
    game.food[0] &&
    next[1] ===
    game.food[1]
  ) {

    game.score +=
      10 *
      game.level;


    game.high =
      Math.max(
        game.high,
        game.score
      );


    storage.set(
      SNAKE_KEY,
      game.high
    );


    snakeFood(
      game
    );

  } else {

    game.snake.pop();
  }


  renderSnakeBoard();
}


function snakeStart() {

  const game =
    GameCenter.snake;


  if (
    !game ||
    game.over
  ) {

    resetSnake();

    return;
  }


  if (
    game.running
  ) {
    return;
  }


  game.running =
    true;

  game.message =
    "Running";


  const speeds = {

    1: 260,
    2: 210,
    3: 165,
    4: 125,
    5: 90
  };


  trackTimer(
    setInterval(
      snakeTick,
      speeds[
        game.level
      ]
    )
  );


  renderSnake();
}


function snakeDir(
  dx,
  dy
) {

  const game =
    GameCenter.snake;


  if (!game) {
    return;
  }


  if (
    game.dir[0] ===
    -dx &&
    game.dir[1] ===
    -dy
  ) {
    return;
  }


  game.next = [
    dx,
    dy
  ];


  if (
    !game.running
  ) {
    snakeStart();
  }
}


function snakeCells() {

  const game =
    GameCenter.snake;


  let html =
    "";


  for (
    let y = 0;
    y <
    game.grid;
    y++
  ) {

    for (
      let x = 0;
      x <
      game.grid;
      x++
    ) {

      const index =
        game.snake
          .findIndex(
            point =>
              point[0] === x &&
              point[1] === y
          );


      const food =
        game.food[0] === x &&
        game.food[1] === y;


      html += `

        <span

          class="
            snake-cell

            ${
              index === 0
                ? "snake-head"
                : (
                    index > 0
                      ? "snake-body"
                      : (
                          food
                            ? "snake-food"
                            : ""
                        )
                  )
            }
          "

        ></span>

      `;
    }
  }


  return html;
}


function renderSnakeBoard() {

  const board =
    $("#snakeBoard");


  if (board) {

    board.innerHTML =
      snakeCells();
  }


  if (
    $("#snakeScore")
  ) {

    $("#snakeScore")
      .textContent =
      GameCenter.snake.score;
  }


  if (
    $("#snakeHigh")
  ) {

    $("#snakeHigh")
      .textContent =
      GameCenter.snake.high;
  }
}


function renderSnake() {

  const game =
    GameCenter.snake;


  if (!game) {

    resetSnake();

    return;
  }


  GameCenter.current =
    "snake";


  $("#contentBody")
    .innerHTML = `

      <div
        class="
          game-shell
          snake-game
        "
      >

        ${
          gameTop(
            "Snake",
            game.message
          )
        }


        <div
          class="chicken-hud"
        >

          <span>
            Score
            <strong
              id="snakeScore"
            >
              ${game.score}
            </strong>
          </span>


          <span>
            High
            <strong
              id="snakeHigh"
            >
              ${game.high}
            </strong>
          </span>


          <label>

            Level

            <select
              data-snake-level
            >

              ${
                [
                  1,
                  2,
                  3,
                  4,
                  5
                ]
                  .map(
                    value => `

                      <option
                        ${
                          value ===
                          game.level
                            ? "selected"
                            : ""
                        }
                      >
                        ${value}
                      </option>

                    `
                  )
                  .join("")
              }

            </select>

          </label>


          <button
            class="secondary-btn"
            data-snake-start
          >
            ${
              game.running
                ? "Running"
                : "Start"
            }
          </button>


          <button
            class="primary-btn"
            data-snake-new
          >
            New Game
          </button>

        </div>


        <div

          id="snakeBoard"

          class="snake-board"

          style="
            grid-template-columns:
            repeat(20,1fr);
          "

        >

          ${snakeCells()}

        </div>


        <div
          class="chicken-controls"
        >

          <button
            data-snake-dir="up"
          >
            ▲
          </button>

          <button
            data-snake-dir="left"
          >
            ◀
          </button>

          <button
            data-snake-dir="down"
          >
            ▼
          </button>

          <button
            data-snake-dir="right"
          >
            ▶
          </button>

        </div>

      </div>

    `;
}


/* ============================================================
   CHICKEN CROSSING
   ============================================================ */

const CHICK_Y = [
  6,
  22,
  36.5,
  51,
  65.5,
  80,
  94.5
];


const CHICK_ROADS =
  new Set([
    1,
    3,
    5
  ]);


const CHICK_KEY =
  "galaxy.chicken.high.v2";


function chickCars(level) {

  const cars =
    [];


  [1, 3, 5]
    .forEach(
      (
        row,
        roadIndex
      ) => {

        [-1, 1]
          .forEach(
            (
              direction,
              lane
            ) => {

              cars.push({

                row,

                y:
                  CHICK_Y[row] +
                  (
                    lane
                      ? 3
                      : -3
                  ),

                x:
                  rand(
                    0,
                    100
                  ),

                dir:
                  roadIndex %
                  2
                    ? direction
                    : -direction,

                speed:
                  0.5 +
                  level *
                  0.12 +
                  roadIndex *
                  0.07,

                type:
                  (
                    roadIndex +
                    lane
                  ) %
                  3 ===
                  0

                    ? "bus"

                    : (
                        (
                          roadIndex +
                          lane
                        ) %
                        3 ===
                        1

                          ? "truck"

                          : "car"
                      )
              });
            }
          );
      }
    );


  return cars;
}


function resetChicken(
  level =
    GameCenter.chicken?.level ||
    3
) {

  clearGameTimers();


  GameCenter.chicken = {

    row:
      6,

    x:
      50,

    score:
      0,

    high:
      Number(
        storage.get(
          CHICK_KEY,
          0
        )
      ) ||
      0,

    level,

    running:
      false,

    over:
      false,

    message:
      "Ready — cross each road",

    cars:
      chickCars(level)
  };


  renderChicken();
}


function chickenCollide(game) {

  if (
    !CHICK_ROADS.has(
      game.row
    )
  ) {

    return false;
  }


  return game.cars.some(
    car =>

      Math.abs(
        car.y -
        CHICK_Y[
          game.row
        ]
      ) < 5

      &&

      Math.abs(
        car.x -
        game.x
      ) <

      (
        car.type ===
        "bus"

          ? 13

          : (
              car.type ===
              "truck"
                ? 11
                : 8
            )
      )
  );
}


function chickenTick() {

  const game =
    GameCenter.chicken;


  if (
    !game?.running ||
    game.over
  ) {

    return;
  }


  game.cars.forEach(
    car => {

      car.x +=
        car.dir *
        car.speed;


      if (
        car.x > 114
      ) {

        car.x =
          -14;
      }


      if (
        car.x < -14
      ) {

        car.x =
          114;
      }
    }
  );


  if (
    chickenCollide(game)
  ) {

    game.over =
      true;

    game.running =
      false;

    game.message =
      "Hit! Game Over";

    renderChicken();

    return;
  }


  renderChickenStage();
}


function chickenStart() {

  const game =
    GameCenter.chicken;


  if (
    !game ||
    game.over
  ) {

    resetChicken();

    return;
  }


  if (
    game.running
  ) {

    return;
  }


  game.running =
    true;

  game.message =
    "Cross the roads";


  trackTimer(
    setInterval(
      chickenTick,

      {
        1: 80,
        2: 65,
        3: 50,
        4: 38,
        5: 28
      }[
        game.level
      ]
    )
  );


  renderChicken();
}


function chickenMove(
  dx,
  dr
) {

  const game =
    GameCenter.chicken;


  if (
    !game ||
    game.over
  ) {

    return;
  }


  if (
    !game.running
  ) {

    chickenStart();
  }


  game.x =
    clamp(
      game.x +
      dx,
      4,
      96
    );


  game.row =
    clamp(
      game.row +
      dr,
      0,
      6
    );


  if (
    chickenCollide(game)
  ) {

    game.over =
      true;

    game.running =
      false;

    game.message =
      "Hit! Game Over";

    renderChicken();

    return;
  }


  if (
    game.row === 0
  ) {

    game.score +=
      100 *
      game.level;


    game.high =
      Math.max(
        game.high,
        game.score
      );


    storage.set(
      CHICK_KEY,
      game.high
    );


    game.row =
      6;

    game.x =
      50;

    game.message =
      "Crossed! Go again";

  } else {

    game.message =
      CHICK_ROADS.has(
        game.row
      )
        ? "Cross the road"
        : "Safe on grass";
  }


  renderChickenStage();
}


function chickWorld() {

  return `

    <div
      class="chicken-world"
    >

      <div
        class="
          chicken-zone
          chicken-grass
        "
      >
        <span
          class="chicken-safe-label"
        >
          FINISH
        </span>
      </div>


      <div
        class="
          chicken-zone
          chicken-road-section
        "
      ></div>


      <div
        class="
          chicken-zone
          chicken-grass
        "
      >
        <span
          class="chicken-safe-label"
        >
          SAFE GRASS
        </span>
      </div>


      <div
        class="
          chicken-zone
          chicken-road-section
        "
      ></div>


      <div
        class="
          chicken-zone
          chicken-grass
        "
      >
        <span
          class="chicken-safe-label"
        >
          SAFE GRASS
        </span>
      </div>


      <div
        class="
          chicken-zone
          chicken-road-section
        "
      ></div>


      <div
        class="
          chicken-zone
          chicken-grass
        "
      >
        <span
          class="chicken-safe-label"
        >
          START
        </span>
      </div>

    </div>

  `;
}


function chickCarsHTML(game) {

  return game.cars
    .map(
      (
        car,
        index
      ) => `

        <div

          class="
            chicken-car

            ${
              car.type ===
              "bus"

                ? "chicken-bus"

                : (
                    car.type ===
                    "truck"

                      ? "chicken-truck"

                      : "chicken-small-car"
                  )
            }
          "

          data-chick-car="${index}"

          style="
            left:${car.x}%;
            top:${car.y}%;
          "

        ></div>

      `
    )
    .join("");
}


function renderChickenStage() {

  const game =
    GameCenter.chicken;


  const player =
    $("#chickenPlayer");


  if (player) {

    player.style.left =
      `${game.x}%`;

    player.style.top =
      `${CHICK_Y[
        game.row
      ]}%`;
  }


  game.cars.forEach(
    (
      car,
      index
    ) => {

      const element =
        $(
          `[data-chick-car="${index}"]`
        );


      if (element) {

        element.style.left =
          `${car.x}%`;
      }
    }
  );


  if (
    $("#chickScore")
  ) {

    $("#chickScore")
      .textContent =
      game.score;
  }


  if (
    $("#chickHigh")
  ) {

    $("#chickHigh")
      .textContent =
      game.high;
  }
}


function renderChicken() {

  const game =
    GameCenter.chicken;


  if (!game) {

    resetChicken();

    return;
  }


  GameCenter.current =
    "chicken";


  $("#contentBody")
    .innerHTML = `

      <div
        class="
          game-shell
          chicken-game
        "
      >

        ${
          gameTop(
            "Chicken Crossing",
            game.message
          )
        }


        <div
          class="chicken-hud"
        >

          <span>

            Score

            <strong
              id="chickScore"
            >
              ${game.score}
            </strong>

          </span>


          <span>

            High

            <strong
              id="chickHigh"
            >
              ${game.high}
            </strong>

          </span>


          <label>

            Level

            <select
              data-chick-level
            >

              ${
                [
                  1,
                  2,
                  3,
                  4,
                  5
                ]
                  .map(
                    value => `

                      <option
                        ${
                          value ===
                          game.level
                            ? "selected"
                            : ""
                        }
                      >
                        ${value}
                      </option>

                    `
                  )
                  .join("")
              }

            </select>

          </label>


          <button
            class="secondary-btn"
            data-chick-start
          >
            ${
              game.running
                ? "Running"
                : "Start"
            }
          </button>


          <button
            class="primary-btn"
            data-chick-new
          >
            New Game
          </button>

        </div>


        <div
          class="
            chicken-stage
            retro-game-board
          "
        >

          ${chickWorld()}

          ${chickCarsHTML(game)}


          <div

            id="chickenPlayer"

            class="chicken-player"

            style="
              left:${game.x}%;
              top:${CHICK_Y[game.row]}%;
            "

          ></div>

        </div>


        <div
          class="chicken-controls"
        >

          <button
            data-chick-dir="up"
          >
            ▲
          </button>

          <button
            data-chick-dir="left"
          >
            ◀
          </button>

          <button
            data-chick-dir="down"
          >
            ▼
          </button>

          <button
            data-chick-dir="right"
          >
            ▶
          </button>

        </div>

      </div>

    `;
}


/* ============================================================
   THREE JS LOADER
   ============================================================ */

let THREE_PROMISE =
  null;


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


const THREE_ACTIVE = {

  kind:
    null,

  raf:
    0,

  renderer:
    null,

  scene:
    null,

  camera:
    null,

  canvas:
    null,

  cleanup:
    []
};


function cleanup3D() {

  if (
    THREE_ACTIVE.raf
  ) {

    cancelAnimationFrame(
      THREE_ACTIVE.raf
    );
  }


  THREE_ACTIVE.raf =
    0;


  THREE_ACTIVE.cleanup
    .splice(0)
    .forEach(
      fn => {

        try {
          fn();
        } catch {}
      }
    );


  try {

    THREE_ACTIVE.renderer
      ?.dispose();

  } catch {}


  if (
    document.pointerLockElement
  ) {

    document
      .exitPointerLock
      ?.();
  }


  Object.assign(
    THREE_ACTIVE,
    {

      kind:
        null,

      renderer:
        null,

      scene:
        null,

      camera:
        null,

      canvas:
        null
    }
  );
}


function on3D(
  target,
  type,
  fn,
  options
) {

  target.addEventListener(
    type,
    fn,
    options
  );


  THREE_ACTIVE.cleanup.push(
    () =>
      target.removeEventListener(
        type,
        fn,
        options
      )
  );
}


/* ============================================================
   GALAXY ARENA
   ============================================================ */

const ARENA_WEAPONS = [

  {
    name:
      "Vortex AR",

    damage:
      28,

    rate:
      110,

    mag:
      30,

    reserve:
      120,

    spread:
      0.006,

    reload:
      1300
  },


  {
    name:
      "Pulse SMG",

    damage:
      19,

    rate:
      75,

    mag:
      36,

    reserve:
      144,

    spread:
      0.012,

    reload:
      1150
  },


  {
    name:
      "Nova Shotgun",

    damage:
      13,

    rate:
      620,

    mag:
      8,

    reserve:
      40,

    spread:
      0.045,

    reload:
      1500,

    pellets:
      8
  },


  {
    name:
      "Eclipse Sniper",

    damage:
      92,

    rate:
      900,

    mag:
      5,

    reserve:
      25,

    spread:
      0.001,

    reload:
      1800
  }
];


const ARENA_MODES = {

  ffa: {
    name: "Free For All",
    bots: 7,
    target: 20,
    time: 300
  },

  duel: {
    name: "1v1 Duel",
    bots: 1,
    target: 10,
    time: 240
  },

  gun: {
    name: "Gun Game",
    bots: 6,
    target: 8,
    time: 360
  },

  practice: {
    name: "Practice Range",
    bots: 6,
    target: 999,
    time: 9999
  }
};


const ARENA_PROFILE_KEY =
  "galaxy.arena.profile.v2";


function arenaProfile() {

  return {

    level:
      1,

    xp:
      0,

    coins:
      0,

    kills:
      0,

    deaths:
      0,

    wins:
      0,

    ...storage.get(
      ARENA_PROFILE_KEY,
      {}
    )
  };
}


function openArena() {

  cleanup3D();


  GameCenter.current =
    "arena";


  const profile =
    arenaProfile();


  if (
    $("#contentTitle")
  ) {

    $("#contentTitle")
      .textContent =
      "GALAXY Arena";
  }


  if (
    $("#contentEyebrow")
  ) {

    $("#contentEyebrow")
      .textContent =
      "3D FPS";
  }


  $("#contentBody")
    .innerHTML = `

      <div
        class="arena-shell"
      >

        <div
          class="arena-home"
        >

          <section
            class="arena-hero"
          >

            <span
              class="arena-hero-badge"
            >
              FAST 3D FPS
            </span>


            <h2>
              GALAXY ARENA
            </h2>


            <p>

              Mouse aim,
              WASD,
              sprint,
              jump,
              reload,
              headshots,
              bots and
              instant respawns.

            </p>


            <div
              class="arena-hero-actions"
            >

              <button
                class="arena-primary"
                data-arena-start
              >
                PLAY
              </button>


              <button
                class="arena-secondary"
                data-game-back
              >
                ← GAMING CENTER
              </button>

            </div>

          </section>


          <aside
            class="arena-side"
          >

            <section
              class="arena-card"
            >

              <h3>
                Mode
              </h3>


              <div
                class="arena-mode-list"
              >

                ${
                  Object.entries(
                    ARENA_MODES
                  )
                    .map(
                      (
                        [
                          id,
                          mode
                        ]
                      ) => `

                        <button

                          class="
                            arena-mode-button
                            ${
                              id ===
                              "ffa"
                                ? "active"
                                : ""
                            }
                          "

                          data-arena-mode="${id}"

                        >

                          <span
                            class="arena-mode-icon"
                          >

                            ${
                              id ===
                              "duel"

                                ? "1v1"

                                : (
                                    id ===
                                    "gun"

                                      ? "↟"

                                      : (
                                          id ===
                                          "practice"

                                            ? "◎"

                                            : "⌖"
                                        )
                                  )
                            }

                          </span>


                          <span
                            class="arena-mode-copy"
                          >

                            <strong>
                              ${mode.name}
                            </strong>

                            <span>
                              ${mode.bots} bots
                            </span>

                          </span>

                        </button>

                      `
                    )
                    .join("")
                }

              </div>

            </section>


            <section
              class="arena-card"
            >

              <h3>
                Profile
              </h3>


              <div
                class="arena-stat-grid"
              >

                <div
                  class="arena-stat"
                >
                  <span>
                    LEVEL
                  </span>
                  <strong>
                    ${profile.level}
                  </strong>
                </div>


                <div
                  class="arena-stat"
                >
                  <span>
                    COINS
                  </span>
                  <strong>
                    ${profile.coins}
                  </strong>
                </div>


                <div
                  class="arena-stat"
                >
                  <span>
                    KILLS
                  </span>
                  <strong>
                    ${profile.kills}
                  </strong>
                </div>


                <div
                  class="arena-stat"
                >
                  <span>
                    WINS
                  </span>
                  <strong>
                    ${profile.wins}
                  </strong>
                </div>

              </div>

            </section>

          </aside>

        </div>

      </div>

    `;


  GameCenter.arena = {
    mode: "ffa"
  };
}


async function startArena() {

  cleanup3D();


  const mode =
    GameCenter.arena?.mode ||
    "ffa";


  const config =
    ARENA_MODES[mode];


  const body =
    $("#contentBody");


  body.innerHTML = `

    <div
      class="arena-shell"
    >

      <div
        class="arena-game"
        id="arenaGame"
      >

        <canvas
          id="arenaCanvas"
          class="arena-canvas"
        ></canvas>


        <div
          class="arena-vignette"
        ></div>


        <div
          class="arena-crosshair"
        ></div>


        <div
          class="arena-hud-top"
        >

          <div
            class="arena-score-pill"
          >
            KILLS
            <strong
              id="aKills"
            >
              0
            </strong>
          </div>


          <div
            class="arena-timer"
            id="aTimer"
          >
            05:00
          </div>


          <div
            class="arena-score-pill"
          >
            HP
            <strong
              id="aHp"
            >
              100
            </strong>
          </div>

        </div>


        <div
          class="arena-hud-bottom-right"
        >

          <div
            class="arena-weapon-name"
            id="aWeapon"
          >
            Vortex AR
          </div>


          <div
            class="arena-ammo"
          >

            <strong
              id="aAmmo"
            >
              30
            </strong>

            <span
              id="aReserve"
            >
              /120
            </span>

          </div>

        </div>


        <div
          class="arena-center-message"
          id="aMsg"
        >

          <strong>
            CLICK TO DEPLOY
          </strong>

          <span>
            WASD • Mouse •
            LMB fire •
            R reload •
            Shift sprint •
            Space jump
          </span>

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


    const camera =
      new THREE.PerspectiveCamera(
        75,
        1,
        0.05,
        120
      );


    const renderer =
      new THREE.WebGLRenderer({

        canvas,

        antialias:
          true
      });


    Object.assign(
      THREE_ACTIVE,
      {

        kind:
          "arena",

        renderer,

        scene,

        camera,

        canvas
      }
    );


    scene.background =
      new THREE.Color(
        0x0b1018
      );


    scene.fog =
      new THREE.Fog(
        0x0b1018,
        25,
        70
      );


    scene.add(
      new THREE
        .HemisphereLight(
          0xbad8ff,
          0x25311f,
          1.8
        )
    );


    const directional =
      new THREE
        .DirectionalLight(
          0xffffff,
          1.4
        );


    directional.position.set(
      10,
      20,
      8
    );


    scene.add(
      directional
    );


    const floor =
      new THREE.Mesh(

        new THREE
          .PlaneGeometry(
            60,
            60
          ),

        new THREE
          .MeshStandardMaterial({
            color:
              0x293239,

            roughness:
              0.95
          })
      );


    floor.rotation.x =
      -Math.PI /
      2;


    scene.add(
      floor
    );


    scene.add(
      new THREE.GridHelper(
        60,
        30,
        0x52606a,
        0x39444b
      )
    );


    const obstacles = [

      [-10, -8, 7, 2, 3],
      [10, 8, 7, 2, 3],
      [0, 0, 5, 5, 3],
      [-16, 8, 3, 7, 4],
      [16, -8, 3, 7, 4],
      [0, 15, 10, 2, 2],
      [0, -15, 10, 2, 2]
    ];


    const walls =
      [];


    for (
      const [
        x,
        z,
        w,
        d,
        h
      ] of obstacles
    ) {

      const mesh =
        new THREE.Mesh(

          new THREE
            .BoxGeometry(
              w,
              h,
              d
            ),

          new THREE
            .MeshStandardMaterial({
              color:
                0x58636d,

              roughness:
                0.85
            })
        );


      mesh.position.set(
        x,
        h / 2,
        z
      );


      mesh.userData.wall =
        true;


      scene.add(
        mesh
      );


      walls.push(
        mesh
      );
    }


    for (
      const [
        x,
        z,
        w,
        d
      ] of
      [
        [0, -30, 60, 1],
        [0, 30, 60, 1],
        [-30, 0, 1, 60],
        [30, 0, 1, 60]
      ]
    ) {

      const mesh =
        new THREE.Mesh(

          new THREE
            .BoxGeometry(
              w,
              4,
              d
            ),

          new THREE
            .MeshStandardMaterial({
              color:
                0x353e45
            })
        );


      mesh.position.set(
        x,
        2,
        z
      );


      scene.add(
        mesh
      );


      walls.push(
        mesh
      );
    }


    const player = {

      x:
        0,

      z:
        12,

      yaw:
        Math.PI,

      pitch:
        0,

      hp:
        100,

      kills:
        0,

      deaths:
        0,

      alive:
        true,

      weapon:
        0,

      ammo:
        ARENA_WEAPONS
          .map(
            weapon => ({
              mag:
                weapon.mag,

              res:
                weapon.reserve
            })
          ),

      last:
        0,

      reloading:
        false,

      jump:
        0,

      ground:
        true
    };


    const keys =
      new Set();


    const ray =
      new THREE
        .Raycaster();


    const bots =
      [];


    camera.position.set(
      player.x,
      1.7,
      player.z
    );


    scene.add(
      camera
    );


    const weaponGroup =
      new THREE.Group();


    const gun =
      new THREE.Mesh(

        new THREE
          .BoxGeometry(
            0.18,
            0.16,
            0.7
          ),

        new THREE
          .MeshStandardMaterial({

            color:
              0x303842,

            metalness:
              0.3
          })
      );


    gun.position.set(
      0.28,
      -0.24,
      -0.7
    );


    weaponGroup.add(
      gun
    );


    camera.add(
      weaponGroup
    );


    function blocked(
      x,
      z,
      radius = 0.42
    ) {

      if (
        Math.abs(x) > 28 ||
        Math.abs(z) > 28
      ) {

        return true;
      }


      return obstacles.some(
        (
          [
            ox,
            oz,
            w,
            d
          ]
        ) =>

          x + radius >
            ox -
            w / 2

          &&

          x - radius <
            ox +
            w / 2

          &&

          z + radius >
            oz -
            d / 2

          &&

          z - radius <
            oz +
            d / 2
      );
    }


    function moveEntity(
      entity,
      dx,
      dz,
      radius = 0.42
    ) {

      if (
        !blocked(
          entity.x +
          dx,
          entity.z,
          radius
        )
      ) {

        entity.x +=
          dx;
      }


      if (
        !blocked(
          entity.x,
          entity.z +
          dz,
          radius
        )
      ) {

        entity.z +=
          dz;
      }
    }


    function botMesh(index) {

      const group =
        new THREE.Group();


      const body =
        new THREE.Mesh(

          new THREE
            .CapsuleGeometry(
              0.38,
              0.65,
              4,
              8
            ),

          new THREE
            .MeshStandardMaterial({
              color:
                index %
                2
                  ? 0x8d5965
                  : 0x6172aa
            })
        );


      const head =
        new THREE.Mesh(

          new THREE
            .SphereGeometry(
              0.23,
              12,
              10
            ),

          new THREE
            .MeshStandardMaterial({
              color:
                0xcba98e
            })
        );


      body.position.y =
        0.95;


      head.position.y =
        1.68;


      group.add(
        body,
        head
      );


      return {
        group,
        body,
        head
      };
    }


    const spawns = [

      [0, -12],
      [14, 14],
      [-14, -14],
      [14, -14],
      [-14, 14],
      [20, 8],
      [-20, -8]
    ];


    for (
      let i = 0;
      i <
      config.bots;
      i++
    ) {

      const model =
        botMesh(i);


      const [
        x,
        z
      ] =
        spawns[
          i %
          spawns.length
        ];


      const bot = {

        name:
          `BOT ${i + 1}`,

        x,

        z,

        hp:
          100,

        alive:
          true,

        respawn:
          0,

        next:
          performance.now() +
          rand(
            700,
            1400
          ),

        kills:
          0,

        group:
          model.group,

        body:
          model.body,

        head:
          model.head
      };


      bot.body.userData = {
        bot,
        part:
          "body"
      };


      bot.head.userData = {
        bot,
        part:
          "head"
      };


      bot.group.position.set(
        x,
        0,
        z
      );


      scene.add(
        bot.group
      );


      bots.push(
        bot
      );
    }


    const profile =
      arenaProfile();


    const end =
      Date.now() +
      config.time *
      1000;


    let running =
      true;


    let last =
      performance.now();


    function hud() {

      const weapon =
        ARENA_WEAPONS[
          player.weapon
        ];


      const ammo =
        player.ammo[
          player.weapon
        ];


      if (
        $("#aKills")
      ) {

        $("#aKills")
          .textContent =
          player.kills;
      }


      if (
        $("#aHp")
      ) {

        $("#aHp")
          .textContent =
          Math.max(
            0,
            Math.ceil(
              player.hp
            )
          );
      }


      if (
        $("#aWeapon")
      ) {

        $("#aWeapon")
          .textContent =
          weapon.name;
      }


      if (
        $("#aAmmo")
      ) {

        $("#aAmmo")
          .textContent =
          ammo.mag;
      }


      if (
        $("#aReserve")
      ) {

        $("#aReserve")
          .textContent =
          `/${ammo.res}`;
      }
    }


    function reload() {

      const weapon =
        ARENA_WEAPONS[
          player.weapon
        ];


      const ammo =
        player.ammo[
          player.weapon
        ];


      if (
        player.reloading ||
        ammo.mag >=
        weapon.mag ||
        !ammo.res
      ) {

        return;
      }


      player.reloading =
        true;


      setTimeout(
        () => {

          if (
            THREE_ACTIVE.kind !==
            "arena"
          ) {
            return;
          }


          const amount =
            Math.min(
              weapon.mag -
              ammo.mag,
              ammo.res
            );


          ammo.mag +=
            amount;

          ammo.res -=
            amount;

          player.reloading =
            false;

          hud();

        },
        weapon.reload
      );
    }


    function respawnPlayer() {

      player.x =
        0;

      player.z =
        12;

      player.hp =
        100;

      player.alive =
        true;

      hud();
    }


    function shoot() {

      if (
        !running ||
        !player.alive ||
        player.reloading
      ) {
        return;
      }


      const weapon =
        ARENA_WEAPONS[
          player.weapon
        ];


      const ammo =
        player.ammo[
          player.weapon
        ];


      const now =
        performance.now();


      if (
        now -
        player.last <
        weapon.rate
      ) {
        return;
      }


      if (
        ammo.mag <= 0
      ) {

        reload();

        return;
      }


      player.last =
        now;

      ammo.mag--;


      const targets = [

        ...walls,

        ...bots.flatMap(
          bot =>
            bot.alive
              ? [
                  bot.body,
                  bot.head
                ]
              : []
        )
      ];


      for (
        let pellet = 0;
        pellet <
        (
          weapon.pellets ||
          1
        );
        pellet++
      ) {

        ray.setFromCamera(

          new THREE.Vector2(

            rand(
              -weapon.spread,
              weapon.spread
            ),

            rand(
              -weapon.spread,
              weapon.spread
            )
          ),

          camera
        );


        const hit =
          ray.intersectObjects(
            targets,
            false
          )[0];


        const bot =
          hit
            ?.object
            ?.userData
            ?.bot;


        if (
          bot &&
          bot.alive
        ) {

          bot.hp -=

            weapon.damage

            *

            (
              hit.object.userData
                .part ===
              "head"

                ? 1.75

                : 1
            );


          if (
            bot.hp <= 0
          ) {

            bot.alive =
              false;

            bot.group.visible =
              false;

            bot.respawn =
              performance.now() +
              1800;


            player.kills++;

            profile.kills++;

            profile.xp +=
              20;

            profile.coins +=
              5;


            if (
              mode ===
              "gun"
            ) {

              player.weapon =
                (
                  player.weapon +
                  1
                ) %
                ARENA_WEAPONS.length;
            }


            if (
              player.kills >=
              config.target &&
              mode !==
              "practice"
            ) {

              running =
                false;

              profile.wins++;

              profile.coins +=
                50;


              $("#aMsg")
                .innerHTML = `

                  <strong>
                    VICTORY
                  </strong>

                  <span>
                    ${player.kills}
                    kills
                  </span>

                  <button
                    class="arena-primary"
                    data-arena-home
                  >
                    ARENA HOME
                  </button>

                `;
            }


            storage.set(
              ARENA_PROFILE_KEY,
              profile
            );
          }
        }
      }


      hud();
    }


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
          canvas ||
          !player.alive
        ) {
          return;
        }


        player.yaw -=
          event.movementX *
          0.0022;


        player.pitch =
          clamp(

            player.pitch -
            event.movementY *
            0.0022,

            -1.25,
            1.25
          );
      }
    );


    on3D(
      document,
      "mousedown",
      event => {

        if (
          THREE_ACTIVE.kind !==
          "arena"
        ) {
          return;
        }


        if (
          event.button === 0
        ) {

          shoot();
        }
      }
    );


    on3D(
      document,
      "keydown",
      event => {

        if (
          THREE_ACTIVE.kind !==
          "arena"
        ) {
          return;
        }


        keys.add(
          event.code
        );


        if (
          event.code ===
          "KeyR"
        ) {

          reload();
        }


        if (
          /^Digit[1-4]$/
            .test(
              event.code
            )
        ) {

          player.weapon =
            Number(
              event.code
                .slice(-1)
            ) -
            1;

          hud();
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
      window,
      "resize",
      resize
    );


    function resize() {

      const width =
        canvas
          .parentElement
          .clientWidth ||
        800;


      const height =
        canvas
          .parentElement
          .clientHeight ||
        600;


      renderer.setSize(
        width,
        height,
        false
      );


      camera.aspect =
        width /
        height;


      camera
        .updateProjectionMatrix();
    }


    resize();

    hud();


    function loop(now) {

      if (
        THREE_ACTIVE.kind !==
        "arena"
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


      last =
        now;


      if (running) {

        const forward =
          (
            keys.has(
              "KeyW"
            )
              ? 1
              : 0
          )
          -
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
          )
          -
          (
            keys.has(
              "KeyA"
            )
              ? 1
              : 0
          );


        const speed =
          keys.has(
            "ShiftLeft"
          )
            ? 8
            : 5.2;


        const sin =
          Math.sin(
            player.yaw
          );


        const cos =
          Math.cos(
            player.yaw
          );


        moveEntity(

          player,

          (
            -sin *
            forward
            +
            cos *
            right
          ) *
          speed *
          dt,

          (
            -cos *
            forward
            -
            sin *
            right
          ) *
          speed *
          dt
        );


        if (
          keys.has(
            "Space"
          ) &&
          player.ground
        ) {

          player.jump =
            5.8;

          player.ground =
            false;
        }


        let cameraHeight =
          1.7;


        if (
          !player.ground
        ) {

          player.jump -=
            15 *
            dt;


          cameraHeight +=
            player.jump *
            dt;


          if (
            cameraHeight <=
            1.7
          ) {

            cameraHeight =
              1.7;

            player.ground =
              true;

            player.jump =
              0;
          }
        }


        camera.position.set(
          player.x,
          cameraHeight,
          player.z
        );


        camera.rotation.order =
          "YXZ";


        camera.rotation.y =
          player.yaw;


        camera.rotation.x =
          player.pitch;


        for (
          const bot of
          bots
        ) {

          if (
            !bot.alive
          ) {

            if (
              now >=
              bot.respawn
            ) {

              bot.hp =
                100;

              bot.alive =
                true;

              bot.group.visible =
                true;


              const spawn =
                pick(
                  spawns
                );


              bot.x =
                spawn[0];

              bot.z =
                spawn[1];


              bot.group.position.set(
                bot.x,
                0,
                bot.z
              );
            }


            continue;
          }


          const dx =
            player.x -
            bot.x;


          const dz =
            player.z -
            bot.z;


          const distance =
            Math.hypot(
              dx,
              dz
            ) ||
            1;


          moveEntity(

            bot,

            dx /
            distance *
            2.2 *
            dt,

            dz /
            distance *
            2.2 *
            dt,

            0.4
          );


          bot.group.position.set(
            bot.x,
            0,
            bot.z
          );


          bot.group.rotation.y =
            Math.atan2(
              dx,
              dz
            ) +
            Math.PI;


          if (
            mode !==
            "practice" &&
            player.alive &&
            distance < 18 &&
            now >
            bot.next
          ) {

            if (
              Math.random() <
              0.42
            ) {

              player.hp -=
                rand(
                  6,
                  12
                );


              if (
                player.hp <= 0
              ) {

                player.deaths++;

                profile.deaths++;

                player.alive =
                  false;


                setTimeout(
                  respawnPlayer,
                  1800
                );
              }
            }


            bot.next =
              now +
              rand(
                600,
                1100
              );


            hud();
          }
        }


        if (
          mode !==
          "practice"
        ) {

          const remaining =
            end -
            Date.now();


          if (
            $("#aTimer")
          ) {

            $("#aTimer")
              .textContent =

              `${String(
                Math.max(
                  0,
                  Math.floor(
                    remaining /
                    60000
                  )
                )
              ).padStart(
                2,
                "0"
              )}`

              +

              ":"

              +

              `${String(
                Math.max(
                  0,
                  Math.floor(
                    remaining /
                    1000
                  ) %
                  60
                )
              ).padStart(
                2,
                "0"
              )}`;
          }


          if (
            remaining <= 0
          ) {

            running =
              false;


            $("#aMsg")
              .innerHTML = `

                <strong>
                  MATCH OVER
                </strong>

                <span>
                  ${player.kills}
                  kills
                </span>

                <button
                  class="arena-primary"
                  data-arena-home
                >
                  ARENA HOME
                </button>

              `;
          }
        }
      }


      renderer.render(
        scene,
        camera
      );


      THREE_ACTIVE.raf =
        requestAnimationFrame(
          loop
        );
    }


    THREE_ACTIVE.raf =
      requestAnimationFrame(
        loop
      );

  } catch (error) {

    console.error(
      error
    );


    body.innerHTML = `

      <div
        class="arena-card"
      >

        <h3>
          Arena could not start
        </h3>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

        <button
          class="arena-primary"
          data-arena-home
        >
          Back
        </button>

      </div>

    `;
  }
}


/* ============================================================
   GALAXY PALS
   ============================================================ */

const PALS_SAVE =
  "galaxy.pals.save.v2";


const PALS_CREATURES = [

  {
    id: "emberfox",
    name: "Emberfox",
    element: "Flame",
    emoji: "🦊",
    color: 0xe86c4a,
    hp: 85,
    atk: 18,
    speed: 2.8,
    rarity: 1
  },

  {
    id: "mossbun",
    name: "Mossbun",
    element: "Nature",
    emoji: "🐰",
    color: 0x6ebf72,
    hp: 95,
    atk: 14,
    speed: 2.4,
    rarity: 1
  },

  {
    id: "aquafin",
    name: "Aquafin",
    element: "Tide",
    emoji: "🐟",
    color: 0x52a8e8,
    hp: 82,
    atk: 17,
    speed: 2.6,
    rarity: 1
  },

  {
    id: "voltkit",
    name: "Voltkit",
    element: "Spark",
    emoji: "🐱",
    color: 0xe7cd4d,
    hp: 78,
    atk: 20,
    speed: 3.1,
    rarity: 2
  },

  {
    id: "stonehorn",
    name: "Stonehorn",
    element: "Earth",
    emoji: "🦬",
    color: 0x9b8065,
    hp: 135,
    atk: 22,
    speed: 1.8,
    rarity: 2
  },

  {
    id: "frostwing",
    name: "Frostwing",
    element: "Frost",
    emoji: "🦅",
    color: 0x9ad8ef,
    hp: 92,
    atk: 24,
    speed: 3.2,
    rarity: 2
  },

  {
    id: "shadebat",
    name: "Shadebat",
    element: "Dark",
    emoji: "🦇",
    color: 0x765d9c,
    hp: 75,
    atk: 26,
    speed: 3.4,
    rarity: 2
  },

  {
    id: "lumel",
    name: "Lumel",
    element: "Light",
    emoji: "🦌",
    color: 0xe9df9a,
    hp: 110,
    atk: 21,
    speed: 2.7,
    rarity: 3
  },

  {
    id: "ironape",
    name: "Ironape",
    element: "Metal",
    emoji: "🦍",
    color: 0x7c8a94,
    hp: 150,
    atk: 30,
    speed: 2,
    rarity: 3
  },

  {
    id: "bloomtail",
    name: "Bloomtail",
    element: "Nature",
    emoji: "🦚",
    color: 0x7dd3a2,
    hp: 100,
    atk: 23,
    speed: 2.8,
    rarity: 3
  },

  {
    id: "cinderdrake",
    name: "Cinderdrake",
    element: "Flame",
    emoji: "🐉",
    color: 0xcc4734,
    hp: 170,
    atk: 36,
    speed: 2.5,
    rarity: 4
  },

  {
    id: "tidetitan",
    name: "Tidetitan",
    element: "Tide",
    emoji: "🐋",
    color: 0x367cb8,
    hp: 200,
    atk: 34,
    speed: 1.7,
    rarity: 4
  },

  {
    id: "stormgryph",
    name: "Stormgryph",
    element: "Spark",
    emoji: "🦅",
    color: 0xd4bd3c,
    hp: 165,
    atk: 38,
    speed: 3,
    rarity: 4
  },

  {
    id: "glacierox",
    name: "Glacierox",
    element: "Frost",
    emoji: "🐂",
    color: 0x83c4dc,
    hp: 210,
    atk: 32,
    speed: 1.6,
    rarity: 4
  },

  {
    id: "voidlion",
    name: "Voidlion",
    element: "Dark",
    emoji: "🦁",
    color: 0x4f3b70,
    hp: 190,
    atk: 42,
    speed: 2.7,
    rarity: 5
  },

  {
    id: "solara",
    name: "Solara",
    element: "Light",
    emoji: "🪽",
    color: 0xf0cc73,
    hp: 185,
    atk: 40,
    speed: 3.3,
    rarity: 5
  }
];


const PALS_ORBS = [

  {
    id: "basic",
    name: "Basic Orb",
    emoji: "🔵",
    bonus: 1,
    cost: {
      wood: 2,
      stone: 2
    }
  },

  {
    id: "mega",
    name: "Mega Orb",
    emoji: "🟢",
    bonus: 1.45,
    cost: {
      wood: 3,
      stone: 4,
      ore: 2
    }
  },

  {
    id: "giga",
    name: "Giga Orb",
    emoji: "🟡",
    bonus: 1.9,
    cost: {
      stone: 5,
      ore: 5
    }
  },

  {
    id: "ultra",
    name: "Ultra Orb",
    emoji: "🟣",
    bonus: 2.5,
    cost: {
      ore: 8,
      crystal: 2
    }
  },

  {
    id: "stellar",
    name: "Stellar Orb",
    emoji: "⚪",
    bonus: 3.3,
    cost: {
      ore: 12,
      crystal: 6
    }
  }
];


function palsDefault() {

  return {

    level:
      1,

    xp:
      0,

    hp:
      100,

    stamina:
      100,

    hunger:
      100,

    coins:
      0,

    inventory: {

      wood:
        18,

      stone:
        14,

      ore:
        4,

      crystal:
        0,

      berry:
        6,

      orbs: [
        8,
        2,
        0,
        0,
        0
      ]
    },

    party:
      [],

    box:
      [],

    orb:
      0,

    bases:
      [],

    day:
      1,

    time:
      0.28,

    x:
      0,

    z:
      8,

    quests: {
      capture: 0,
      gather: 0
    }
  };
}


function palsSave(game) {

  storage.set(
    PALS_SAVE,
    {
      ...game,
      wild: undefined,
      nodes: undefined,
      three: undefined
    }
  );
}


function openPals() {

  cleanup3D();


  GameCenter.current =
    "pals";


  const game = {

    ...palsDefault(),

    ...storage.get(
      PALS_SAVE,
      {}
    )
  };


  GameCenter.pals =
    game;


  if (
    $("#contentTitle")
  ) {

    $("#contentTitle")
      .textContent =
      "GALAXY PALS";
  }


  if (
    $("#contentEyebrow")
  ) {

    $("#contentEyebrow")
      .textContent =
      "3D CREATURE SURVIVAL";
  }


  $("#contentBody")
    .innerHTML = `

      <div
        class="pals-shell"
      >

        <div
          class="pals-home"
        >

          <section
            class="pals-hero"
          >

            <span
              class="pals-hero-badge"
            >
              OPEN-WORLD CREATURE SURVIVAL
            </span>


            <h2>
              GALAXY PALS
            </h2>


            <p>

              Explore a 3D world,
              weaken and capture
              original GALAXY creatures,
              gather resources,
              craft capture Orbs,
              build a base
              and grow your party.

            </p>


            <div
              class="pals-hero-actions"
            >

              <button
                class="pals-primary"
                data-pals-play
              >
                PLAY WORLD
              </button>


              <button
                class="pals-secondary"
                data-pals-new
              >
                NEW WORLD
              </button>


              <button
                class="pals-secondary"
                data-game-back
              >
                ← GAMING CENTER
              </button>

            </div>

          </section>


          <aside
            class="pals-side"
          >

            <section
              class="pals-card"
            >

              <h3>
                Save
              </h3>


              <div
                class="pals-stat-grid"
              >

                <div
                  class="pals-stat"
                >
                  <span>
                    LEVEL
                  </span>
                  <strong>
                    ${game.level}
                  </strong>
                </div>


                <div
                  class="pals-stat"
                >
                  <span>
                    CAPTURED
                  </span>
                  <strong>
                    ${game.box.length}
                  </strong>
                </div>


                <div
                  class="pals-stat"
                >
                  <span>
                    BASES
                  </span>
                  <strong>
                    ${game.bases.length}
                  </strong>
                </div>


                <div
                  class="pals-stat"
                >
                  <span>
                    DAY
                  </span>
                  <strong>
                    ${game.day}
                  </strong>
                </div>

              </div>

            </section>


            <section
              class="pals-card"
            >

              <h3>
                Controls
              </h3>

              <p>

                WASD move •
                Mouse look •
                Shift sprint •
                Left click attack •
                E gather •
                Q throw Orb •
                1–5 Orb tier •
                F summon party Pal •
                C craft •
                B build •
                I inventory

              </p>

            </section>

          </aside>

        </div>

      </div>

    `;
}


function palsSpecies(id) {

  return PALS_CREATURES
    .find(
      creature =>
        creature.id === id
    );
}


function palsInvText(game) {

  return (
    `Wood ${game.inventory.wood}` +
    ` • Stone ${game.inventory.stone}` +
    ` • Ore ${game.inventory.ore}` +
    ` • Crystal ${game.inventory.crystal}` +
    ` • Berries ${game.inventory.berry}`
  );
}


async function startPals() {

  cleanup3D();


  const game =
    GameCenter.pals ||
    palsDefault();


  GameCenter.pals =
    game;


  const body =
    $("#contentBody");


  body.innerHTML = `

    <div
      class="pals-shell"
    >

      <div
        class="pals-world"
        id="palsWorld"
      >

        <canvas
          id="palsCanvas"
          class="pals-canvas"
        ></canvas>


        <div
          class="pals-vignette"
        ></div>


        <div
          class="pals-hud-top"
        >

          <div
            class="pals-zone"
          >
            Verdant Reach
          </div>


          <div
            class="pals-clock"
            id="pTime"
          >
            DAY ${game.day}
          </div>


          <div
            class="pals-level"
          >
            LV
            <strong
              id="pLevel"
            >
              ${game.level}
            </strong>
          </div>

        </div>


        <div
          class="pals-party"
          id="pParty"
        ></div>


        <div
          class="pals-minimap"
        >
          <span
            class="pals-minimap-player"
          ></span>
        </div>


        <div
          class="pals-feed"
          id="pFeed"
        ></div>


        <div
          class="pals-crosshair"
        ></div>


        <div
          class="pals-interact"
          id="pInteract"
        >
          Click world to control camera
        </div>


        <div
          class="pals-hud-left"
        >

          <div
            class="pals-bar-row"
          >

            <span>
              HP
            </span>

            <div
              class="pals-bar"
            >
              <span
                class="pals-health-fill"
                id="pHP"
              ></span>
            </div>

            <strong
              id="pHPN"
            >
              100
            </strong>

          </div>


          <div
            class="pals-bar-row"
          >

            <span>
              STAM
            </span>

            <div
              class="pals-bar"
            >
              <span
                class="pals-stamina-fill"
                id="pST"
              ></span>
            </div>

            <strong
              id="pSTN"
            >
              100
            </strong>

          </div>


          <div
            class="pals-bar-row"
          >

            <span>
              FOOD
            </span>

            <div
              class="pals-bar"
            >
              <span
                class="pals-hunger-fill"
                id="pHU"
              ></span>
            </div>

            <strong
              id="pHUN"
            >
              100
            </strong>

          </div>

        </div>


        <div
          class="pals-hud-right"
        >

          <div
            id="pInvText"
          >
            ${palsInvText(game)}
          </div>

        </div>


        <div
          class="pals-sphere-wheel"
          id="pOrbs"
        >

          ${
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

                    ${orb.emoji}
                    <br>
                    ${orb.name}
                    <br>

                    x${
                      game.inventory
                        .orbs[index]
                      ||
                      0
                    }

                  </div>

                `
              )
              .join("")
          }

        </div>

      </div>

    </div>

  `;


  try {

    const THREE =
      await loadThree();


    const canvas =
      $("#palsCanvas");


    const scene =
      new THREE.Scene();


    const camera =
      new THREE
        .PerspectiveCamera(
          70,
          1,
          0.1,
          180
        );


    const renderer =
      new THREE
        .WebGLRenderer({

          canvas,

          antialias:
            true
        });


    Object.assign(
      THREE_ACTIVE,
      {

        kind:
          "pals",

        renderer,

        scene,

        camera,

        canvas
      }
    );


    renderer.shadowMap.enabled =
      true;


    scene.background =
      new THREE.Color(
        0x86c9ef
      );


    scene.fog =
      new THREE.Fog(
        0x9dd0df,
        45,
        125
      );


    const hemi =
      new THREE
        .HemisphereLight(
          0xcdefff,
          0x405329,
          1.6
        );


    scene.add(
      hemi
    );


    const sun =
      new THREE
        .DirectionalLight(
          0xfff0cf,
          1.7
        );


    sun.position.set(
      30,
      50,
      15
    );


    sun.castShadow =
      true;


    scene.add(
      sun
    );


    const ground =
      new THREE.Mesh(

        new THREE
          .PlaneGeometry(
            180,
            180,
            1,
            1
          ),

        new THREE
          .MeshStandardMaterial({
            color:
              0x557d49,

            roughness:
              1
          })
      );


    ground.rotation.x =
      -Math.PI /
      2;


    ground.receiveShadow =
      true;


    scene.add(
      ground
    );


    const zones = [

      {
        x: -45,
        z: -35,
        color: 0x789f5b
      },

      {
        x: 45,
        z: -38,
        color: 0x6f987a
      },

      {
        x: -38,
        z: 42,
        color: 0xb0a267
      },

      {
        x: 48,
        z: 44,
        color: 0x7295a8
      }
    ];


    for (
      const zone of
      zones
    ) {

      const mesh =
        new THREE.Mesh(

          new THREE
            .CircleGeometry(
              28,
              32
            ),

          new THREE
            .MeshStandardMaterial({
              color:
                zone.color,

              roughness:
                1
            })
        );


      mesh.rotation.x =
        -Math.PI /
        2;


      mesh.position.set(
        zone.x,
        0.02,
        zone.z
      );


      scene.add(
        mesh
      );
    }


    for (
      let i = 0;
      i < 55;
      i++
    ) {

      const trunk =
        new THREE.Mesh(

          new THREE
            .CylinderGeometry(
              0.25,
              0.38,
              rand(
                2.3,
                4.8
              ),
              7
            ),

          new THREE
            .MeshStandardMaterial({
              color:
                0x6d4b31
            })
        );


      trunk.position.set(
        rand(
          -80,
          80
        ),
        1.5,
        rand(
          -80,
          80
        )
      );


      scene.add(
        trunk
      );


      const crown =
        new THREE.Mesh(

          new THREE
            .SphereGeometry(
              rand(
                1.1,
                2.3
              ),
              8,
              7
            ),

          new THREE
            .MeshStandardMaterial({
              color:
                pick([
                  0x4f7a43,
                  0x5d8c4b,
                  0x6a9655
                ])
            })
        );


      crown.position.set(
        trunk.position.x,
        rand(
          3,
          5
        ),
        trunk.position.z
      );


      scene.add(
        crown
      );
    }


    const nodes =
      [];


    function addNode(
      type,
      x,
      z
    ) {

      const color =

        type === "wood"

          ? 0x7b5434

          : (
              type ===
              "stone"

                ? 0x777b80

                : (
                    type ===
                    "ore"

                      ? 0x675f58

                      : 0x6ec4d9
                  )
            );


      const geometry =

        type === "wood"

          ? new THREE
              .CylinderGeometry(
                0.5,
                0.65,
                2.4,
                7
              )

          : new THREE
              .DodecahedronGeometry(
                type ===
                "crystal"
                  ? 0.85
                  : 1.1
              );


      const mesh =
        new THREE.Mesh(

          geometry,

          new THREE
            .MeshStandardMaterial({

              color,

              roughness:
                0.75,

              metalness:
                type ===
                "ore"
                  ? 0.25
                  : 0
            })
        );


      mesh.position.set(
        x,
        type ===
        "wood"
          ? 1.2
          : 0.9,
        z
      );


      scene.add(
        mesh
      );


      nodes.push({

        type,

        x,

        z,

        amount:
          type ===
          "wood"

            ? 5

            : (
                type ===
                "stone"

                  ? 4

                  : (
                      type ===
                      "ore"
                        ? 3
                        : 2
                    )
              ),

        mesh
      });
    }


    for (
      let i = 0;
      i < 24;
      i++
    ) {

      addNode(

        i < 9

          ? "wood"

          : (
              i < 17

                ? "stone"

                : (
                    i < 22
                      ? "ore"
                      : "crystal"
                  )
            ),

        rand(
          -70,
          70
        ),

        rand(
          -70,
          70
        )
      );
    }


    const player = {

      x:
        game.x ||
        0,

      z:
        game.z ||
        8,

      yaw:
        0,

      pitch:
        -0.12,

      attackAt:
        0
    };


    const keys =
      new Set();


    const wild =
      [];


    let companion =
      null;


    let feed =
      [];


    const playerMesh =
      new THREE.Group();


    const playerBody =
      new THREE.Mesh(

        new THREE
          .CapsuleGeometry(
            0.36,
            0.7,
            4,
            8
          ),

        new THREE
          .MeshStandardMaterial({
            color:
              0x3e6288
          })
      );


    const playerHead =
      new THREE.Mesh(

        new THREE
          .SphereGeometry(
            0.24,
            10,
            8
          ),

        new THREE
          .MeshStandardMaterial({
            color:
              0xd2ae92
          })
      );


    playerBody.position.y =
      1;


    playerHead.position.y =
      1.75;


    playerMesh.add(
      playerBody,
      playerHead
    );


    scene.add(
      playerMesh
    );


    function creatureMesh(
      species,
      scale = 1
    ) {

      const group =
        new THREE.Group();


      const body =
        new THREE.Mesh(

          new THREE
            .SphereGeometry(
              0.55 *
              scale,
              10,
              8
            ),

          new THREE
            .MeshStandardMaterial({

              color:
                species.color,

              roughness:
                0.75
            })
        );


      const head =
        new THREE.Mesh(

          new THREE
            .SphereGeometry(
              0.38 *
              scale,
              10,
              8
            ),

          new THREE
            .MeshStandardMaterial({

              color:
                species.color,

              roughness:
                0.75
            })
        );


      body.position.y =
        0.65 *
        scale;


      head.position.set(
        0,
        0.95 *
        scale,
        -0.35 *
        scale
      );


      group.add(
        body,
        head
      );


      const eyeMaterial =
        new THREE
          .MeshBasicMaterial({
            color:
              0xffffff
          });


      for (
        const side of
        [
          -0.13,
          0.13
        ]
      ) {

        const eye =
          new THREE.Mesh(

            new THREE
              .SphereGeometry(
                0.045 *
                scale,
                6,
                5
              ),

            eyeMaterial
          );


        eye.position.set(
          side,
          0.99 *
          scale,
          -0.68 *
          scale
        );


        group.add(
          eye
        );
      }


      return {
        group,
        body,
        head
      };
    }


    function spawnCreature(
      index
    ) {

      const species =
        pick(
          PALS_CREATURES
            .filter(
              creature =>
                creature.rarity <=
                Math.min(
                  5,
                  1 +
                  Math.floor(
                    game.level /
                    4
                  ) +
                  2
                )
            )
        );


      const model =
        creatureMesh(
          species,
          1 +
          species.rarity *
          0.04
        );


      const x =
        rand(
          -65,
          65
        );


      const z =
        rand(
          -65,
          65
        );


      const creature = {

        id:
          `wild${index}`,

        species,

        x,

        z,

        hp:
          species.hp,

        max:
          species.hp,

        alive:
          true,

        direction:
          rand(
            0,
            Math.PI *
            2
          ),

        next:
          performance.now() +
          rand(
            700,
            2000
          ),

        group:
          model.group,

        body:
          model.body,

        head:
          model.head
      };


      creature.body.userData = {
        creature
      };


      creature.head.userData = {
        creature
      };


      creature.group.position.set(
        x,
        0,
        z
      );


      scene.add(
        creature.group
      );


      wild.push(
        creature
      );
    }


    for (
      let i = 0;
      i < 18;
      i++
    ) {

      spawnCreature(i);
    }


    const ray =
      new THREE
        .Raycaster();


    function feedMsg(message) {

      feed.unshift({

        message,

        time:
          performance.now()
      });


      feed =
        feed.slice(
          0,
          5
        );


      renderFeed();
    }


    function renderFeed() {

      const element =
        $("#pFeed");


      if (!element) {
        return;
      }


      element.innerHTML =
        feed
          .filter(
            item =>
              performance.now() -
              item.time <
              5500
          )
          .map(
            item => `

              <div
                class="pals-feed-row"
              >
                ${escapeHTML(
                  item.message
                )}
              </div>

            `
          )
          .join("");
    }


    function renderParty() {

      const element =
        $("#pParty");


      if (!element) {
        return;
      }


      element.innerHTML =

        game.party
          .slice(
            0,
            5
          )
          .map(
            id => {

              const species =
                palsSpecies(id);


              return `

                <div
                  class="pals-party-row"
                >

                  <div
                    class="pals-party-icon"
                  >
                    ${
                      species?.emoji ||
                      "✦"
                    }
                  </div>


                  <div
                    class="pals-party-copy"
                  >

                    <strong>
                      ${
                        species?.name ||
                        id
                      }
                    </strong>

                    <span>
                      Lv ${game.level}
                      •
                      ${
                        species?.element ||
                        ""
                      }
                    </span>

                    <div
                      class="pals-party-hp"
                    >
                      <span
                        style="width:100%"
                      ></span>
                    </div>

                  </div>

                </div>

              `;
            }
          )
          .join("")

        ||

        `

          <div
            class="pals-party-row"
          >
            No Pals in party
          </div>

        `;
    }


    function hud() {

      game.hp =
        clamp(
          game.hp,
          0,
          100
        );


      game.stamina =
        clamp(
          game.stamina,
          0,
          100
        );


      game.hunger =
        clamp(
          game.hunger,
          0,
          100
        );


      for (
        const [
          id,
          value
        ] of
        [
          ["pHP", game.hp],
          ["pST", game.stamina],
          ["pHU", game.hunger]
        ]
      ) {

        if (
          $("#" + id)
        ) {

          $("#" + id)
            .style.width =
            value +
            "%";
        }
      }


      if (
        $("#pHPN")
      ) {

        $("#pHPN")
          .textContent =
          Math.round(
            game.hp
          );
      }


      if (
        $("#pSTN")
      ) {

        $("#pSTN")
          .textContent =
          Math.round(
            game.stamina
          );
      }


      if (
        $("#pHUN")
      ) {

        $("#pHUN")
          .textContent =
          Math.round(
            game.hunger
          );
      }


      if (
        $("#pInvText")
      ) {

        $("#pInvText")
          .textContent =
          palsInvText(game);
      }


      if (
        $("#pLevel")
      ) {

        $("#pLevel")
          .textContent =
          game.level;
      }


      const orbHUD =
        $("#pOrbs");


      if (orbHUD) {

        orbHUD.innerHTML =
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

                  ${orb.emoji}

                  <br>

                  ${orb.name}

                  <br>

                  x${
                    game.inventory
                      .orbs[index]
                    ||
                    0
                  }

                </div>

              `
            )
            .join("");
      }


      renderParty();
    }


    function nearestNode() {

      return nodes
        .filter(
          node =>
            node.amount >
            0
        )
        .sort(
          (
            a,
            b
          ) =>

            Math.hypot(
              a.x -
              player.x,
              a.z -
              player.z
            )

            -

            Math.hypot(
              b.x -
              player.x,
              b.z -
              player.z
            )
        )[0];
    }


    function nearestCreature() {

      return wild
        .filter(
          creature =>
            creature.alive
        )
        .sort(
          (
            a,
            b
          ) =>

            Math.hypot(
              a.x -
              player.x,
              a.z -
              player.z
            )

            -

            Math.hypot(
              b.x -
              player.x,
              b.z -
              player.z
            )
        )[0];
    }


    function gather() {

      const node =
        nearestNode();


      if (
        !node ||
        Math.hypot(
          node.x -
          player.x,
          node.z -
          player.z
        ) >
        3.2
      ) {

        feedMsg(
          "Move closer to a resource"
        );

        return;
      }


      node.amount--;


      game.inventory[
        node.type
      ] =
        (
          game.inventory[
            node.type
          ] ||
          0
        ) +
        1;


      game.quests.gather++;


      feedMsg(
        `+1 ${node.type}`
      );


      if (
        node.amount <= 0
      ) {

        node.mesh.visible =
          false;
      }


      hud();

      palsSave(game);
    }


    function attack() {

      const now =
        performance.now();


      if (
        now -
        player.attackAt <
        420
      ) {

        return;
      }


      player.attackAt =
        now;


      ray.setFromCamera(
        new THREE.Vector2(
          0,
          0
        ),
        camera
      );


      const targets =
        wild
          .filter(
            creature =>
              creature.alive
          )
          .flatMap(
            creature => [
              creature.body,
              creature.head
            ]
          );


      const hit =
        ray.intersectObjects(
          targets,
          false
        )[0];


      const creature =
        hit
          ?.object
          ?.userData
          ?.creature;


      if (
        creature &&
        hit.distance <
        24
      ) {

        creature.hp -=
          18 +
          game.level *
          1.2;


        feedMsg(
          `${creature.species.name} ${Math.max(
            0,
            Math.round(
              creature.hp
            )
          )}/${creature.max} HP`
        );


        if (
          creature.hp <= 0
        ) {

          creature.alive =
            false;

          creature.group.visible =
            false;


          game.xp +=
            25 *
            creature.species
              .rarity;


          feedMsg(
            `${creature.species.name} defeated`
          );


          levelUp();
        }
      }
    }


    function capture() {

      const creature =
        nearestCreature();


      if (
        !creature ||
        Math.hypot(
          creature.x -
          player.x,
          creature.z -
          player.z
        ) >
        14
      ) {

        feedMsg(
          "No creature in capture range"
        );

        return;
      }


      const tier =
        game.orb;


      if (
        (
          game.inventory
            .orbs[tier]
          ||
          0
        ) <= 0
      ) {

        feedMsg(
          `No ${PALS_ORBS[tier].name}s`
        );

        return;
      }


      game.inventory
        .orbs[tier]--;


      const orb =
        PALS_ORBS[tier];


      const hpFactor =
        1 -
        (
          creature.hp /
          creature.max
        ) *
        0.72;


      const rarePenalty =
        1 /
        (
          1 +
          creature.species
            .rarity *
          0.3
        );


      const chance =
        clamp(

          (
            0.28 +
            hpFactor
          )

          *

          orb.bonus

          *

          rarePenalty,

          0.05,
          0.95
        );


      feedMsg(
        `${orb.name} thrown — ${Math.round(
          chance *
          100
        )}% chance`
      );


      setTimeout(
        () => {

          if (
            THREE_ACTIVE.kind !==
            "pals"
          ) {
            return;
          }


          if (
            Math.random() <
            chance
          ) {

            creature.alive =
              false;

            creature.group.visible =
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
              40 *
              creature.species
                .rarity;


            game.quests.capture++;


            feedMsg(
              `Captured ${creature.species.name}!`
            );


            levelUp();

          } else {

            creature.hp =
              Math.max(
                1,
                creature.hp -
                4
              );


            feedMsg(
              `${creature.species.name} escaped!`
            );
          }


          hud();

          palsSave(game);

        },
        700
      );


      hud();
    }


    function levelUp() {

      while (
        game.xp >=
        game.level *
        120
      ) {

        game.xp -=
          game.level *
          120;

        game.level++;

        game.hp =
          100;


        feedMsg(
          `Level ${game.level}!`
        );
      }
    }


    function craft() {

      const orb =
        PALS_ORBS[
          game.orb
        ];


      const cost =
        orb.cost;


      for (
        const [
          resource,
          amount
        ] of
        Object.entries(
          cost
        )
      ) {

        if (
          (
            game.inventory[
              resource
            ] ||
            0
          ) <
          amount
        ) {

          feedMsg(
            `Need ${amount} ${resource}`
          );

          return;
        }
      }


      for (
        const [
          resource,
          amount
        ] of
        Object.entries(
          cost
        )
      ) {

        game.inventory[
          resource
        ] -=
          amount;
      }


      game.inventory.orbs[
        game.orb
      ] =
        (
          game.inventory.orbs[
            game.orb
          ] ||
          0
        ) +
        1;


      feedMsg(
        `Crafted ${orb.name}`
      );


      hud();

      palsSave(game);
    }


    function build() {

      if (
        game.inventory.wood <
        10 ||
        game.inventory.stone <
        6
      ) {

        feedMsg(
          "Need 10 wood + 6 stone"
        );

        return;
      }


      game.inventory.wood -=
        10;

      game.inventory.stone -=
        6;


      const hut =
        new THREE.Group();


      const base =
        new THREE.Mesh(

          new THREE
            .BoxGeometry(
              3.2,
              0.3,
              3.2
            ),

          new THREE
            .MeshStandardMaterial({
              color:
                0x806044
            })
        );


      const roof =
        new THREE.Mesh(

          new THREE
            .ConeGeometry(
              2.4,
              1.7,
              4
            ),

          new THREE
            .MeshStandardMaterial({
              color:
                0x5d4031
            })
        );


      roof.position.y =
        1.25;


      roof.rotation.y =
        Math.PI /
        4;


      hut.add(
        base,
        roof
      );


      const x =
        player.x -
        Math.sin(
          player.yaw
        ) *
        4;


      const z =
        player.z -
        Math.cos(
          player.yaw
        ) *
        4;


      hut.position.set(
        x,
        0.15,
        z
      );


      scene.add(
        hut
      );


      game.bases.push({
        x,
        z
      });


      feedMsg(
        "Base shelter built"
      );


      hud();

      palsSave(game);
    }


    function summon() {

      if (
        !game.party.length
      ) {

        feedMsg(
          "Capture a creature first"
        );

        return;
      }


      if (companion) {

        scene.remove(
          companion.mesh
        );

        companion =
          null;

        feedMsg(
          "Companion recalled"
        );

        return;
      }


      const species =
        palsSpecies(
          game.party[0]
        );


      const model =
        creatureMesh(
          species,
          1.1
        );


      companion = {
        species,
        mesh:
          model.group
      };


      scene.add(
        companion.mesh
      );


      feedMsg(
        `${species.name} summoned`
      );
    }


    function inventoryOverlay() {

      let overlay =
        $("#palsOverlay");


      if (overlay) {

        overlay.remove();

        return;
      }


      const world =
        $("#palsWorld");


      world.insertAdjacentHTML(
        "beforeend",
        `

          <div

            class="pals-inventory-overlay"

            id="palsOverlay"

          >

            <div
              class="pals-panel"
            >

              <div
                class="pals-panel-head"
              >

                <h3>
                  Inventory & Pal Box
                </h3>

                <button
                  class="pals-secondary"
                  data-pals-close
                >
                  Close
                </button>

              </div>


              <div
                class="pals-panel-body"
              >

                <div
                  class="pals-toolbar"
                >
                  <button>
                    Resources:
                    ${escapeHTML(
                      palsInvText(
                        game
                      )
                    )}
                  </button>
                </div>


                <h3>
                  Captured Pals
                  (${game.box.length})
                </h3>


                <div
                  class="pals-grid"
                >

                  ${
                    game.box.length

                      ? game.box
                          .map(
                            id => {

                              const species =
                                palsSpecies(
                                  id
                                );


                              return `

                                <div
                                  class="pals-creature-card"
                                >

                                  <div
                                    class="pals-creature-icon"
                                  >
                                    ${
                                      species?.emoji ||
                                      "✦"
                                    }
                                  </div>

                                  <strong>
                                    ${
                                      species?.name ||
                                      id
                                    }
                                  </strong>

                                  <small>
                                    ${
                                      species?.element ||
                                      ""
                                    }
                                    •
                                    Rarity
                                    ${
                                      species?.rarity ||
                                      1
                                    }
                                  </small>

                                </div>

                              `;
                            }
                          )
                          .join("")

                      : "No captured creatures yet."
                  }

                </div>

              </div>

            </div>

          </div>

        `
      );
    }


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
          0.0024;


        player.pitch =
          clamp(

            player.pitch -
            event.movementY *
            0.0016,

            -0.55,
            0.35
          );
      }
    );


    on3D(
      document,
      "keydown",
      event => {

        if (
          THREE_ACTIVE.kind !==
          "pals"
        ) {
          return;
        }


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

          hud();
        }


        if (
          event.code ===
          "KeyE"
        ) {
          gather();
        }


        if (
          event.code ===
          "KeyQ"
        ) {
          capture();
        }


        if (
          event.code ===
          "KeyC"
        ) {
          craft();
        }


        if (
          event.code ===
          "KeyB"
        ) {
          build();
        }


        if (
          event.code ===
          "KeyF"
        ) {
          summon();
        }


        if (
          event.code ===
          "KeyI"
        ) {

          inventoryOverlay();


          if (
            document.pointerLockElement
          ) {

            document
              .exitPointerLock
              ?.();
          }
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
          THREE_ACTIVE.kind ===
          "pals" &&
          event.button === 0 &&
          document.pointerLockElement ===
          canvas
        ) {

          attack();
        }
      }
    );


    on3D(
      window,
      "resize",
      resize
    );


    function resize() {

      const width =
        canvas
          .parentElement
          .clientWidth ||
        900;


      const height =
        canvas
          .parentElement
          .clientHeight ||
        650;


      renderer.setSize(
        width,
        height,
        false
      );


      camera.aspect =
        width /
        height;


      camera
        .updateProjectionMatrix();
    }


    resize();

    hud();


    let last =
      performance.now();


    let saveAt =
      last;


    function loop(now) {

      if (
        THREE_ACTIVE.kind !==
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


      last =
        now;


      const forward =
        (
          keys.has(
            "KeyW"
          )
            ? 1
            : 0
        )
        -
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
        )
        -
        (
          keys.has(
            "KeyA"
          )
            ? 1
            : 0
        );


      const sprinting =
        (
          keys.has(
            "ShiftLeft"
          )
          ||
          keys.has(
            "ShiftRight"
          )
        )
        &&
        game.stamina >
        1;


      const speed =
        sprinting
          ? 6.4
          : 3.8;


      const sin =
        Math.sin(
          player.yaw
        );


      const cos =
        Math.cos(
          player.yaw
        );


      player.x =
        clamp(

          player.x +

          (
            -sin *
            forward

            +

            cos *
            right
          )

          *

          speed

          *

          dt,

          -84,
          84
        );


      player.z =
        clamp(

          player.z +

          (
            -cos *
            forward

            -

            sin *
            right
          )

          *

          speed

          *

          dt,

          -84,
          84
        );


      if (
        sprinting &&
        (
          forward ||
          right
        )
      ) {

        game.stamina -=
          16 *
          dt;

      } else {

        game.stamina +=
          10 *
          dt;
      }


      game.hunger -=
        0.45 *
        dt;


      if (
        game.hunger <
        20
      ) {

        game.hp -=
          1.2 *
          dt;
      }


      game.time +=
        dt *
        0.003;


      if (
        game.time >=
        1
      ) {

        game.time -=
          1;

        game.day++;
      }


      const daylight =
        0.25 +
        0.75 *
        Math.max(
          0,
          Math.sin(
            game.time *
            Math.PI
          )
        );


      sun.intensity =
        0.35 +
        daylight *
        1.45;


      scene.background
        .setHSL(
          0.56,
          0.45,
          0.16 +
          daylight *
          0.48
        );


      scene.fog.color
        .copy(
          scene.background
        );


      playerMesh.position.set(
        player.x,
        0,
        player.z
      );


      playerMesh.rotation.y =
        player.yaw;


      const cameraDistance =
        5.6;


      const cameraHeight =
        2.8;


      camera.position.set(

        player.x +

        Math.sin(
          player.yaw
        ) *
        cameraDistance,

        cameraHeight +
        player.pitch *
        2.5,

        player.z +

        Math.cos(
          player.yaw
        ) *
        cameraDistance
      );


      camera.lookAt(
        player.x,
        1.35,
        player.z
      );


      if (companion) {

        const targetX =
          player.x +
          Math.cos(
            player.yaw
          ) *
          2.2;


        const targetZ =
          player.z -
          Math.sin(
            player.yaw
          ) *
          2.2;


        companion.mesh
          .position.x +=

          (
            targetX -
            companion.mesh
              .position.x
          )

          *

          Math.min(
            1,
            dt *
            3
          );


        companion.mesh
          .position.z +=

          (
            targetZ -
            companion.mesh
              .position.z
          )

          *

          Math.min(
            1,
            dt *
            3
          );


        companion.mesh
          .rotation.y =
          player.yaw;
      }


      for (
        const creature of
        wild
      ) {

        if (
          !creature.alive
        ) {

          continue;
        }


        if (
          now >
          creature.next
        ) {

          creature.direction +=
            rand(
              -1.2,
              1.2
            );


          creature.next =
            now +
            rand(
              900,
              2200
            );
        }


        creature.x =
          clamp(

            creature.x +

            Math.sin(
              creature.direction
            )

            *

            creature.species
              .speed

            *

            0.28

            *

            dt,

            -80,
            80
          );


        creature.z =
          clamp(

            creature.z +

            Math.cos(
              creature.direction
            )

            *

            creature.species
              .speed

            *

            0.28

            *

            dt,

            -80,
            80
          );


        creature.group
          .position
          .set(
            creature.x,
            0,
            creature.z
          );


        creature.group
          .rotation.y =
          creature.direction;
      }


      const node =
        nearestNode();


      const creature =
        nearestCreature();


      const message =
        $("#pInteract");


      if (message) {

        const nodeDistance =
          node
            ? Math.hypot(
                node.x -
                player.x,
                node.z -
                player.z
              )
            : 99;


        const creatureDistance =
          creature
            ? Math.hypot(
                creature.x -
                player.x,
                creature.z -
                player.z
              )
            : 99;


        message.textContent =

          nodeDistance <
          3.2

            ? `E Gather ${node.type}`

            : (
                creatureDistance <
                14

                  ? `${creature.species.name} • ${Math.max(
                      0,
                      Math.round(
                        creature.hp
                      )
                    )}/${creature.max} HP • Q Throw ${PALS_ORBS[game.orb].name}`

                  : "Explore • E gather • Q capture • C craft • B build • F summon"
              );
      }


      if (
        $("#pTime")
      ) {

        $("#pTime")
          .textContent =

          `DAY ${game.day} • `

          +

          (
            game.time <
            0.25 ||
            game.time >
            0.75

              ? "NIGHT"

              : "DAYLIGHT"
          );
      }


      hud();

      renderFeed();


      if (
        now -
        saveAt >
        5000
      ) {

        game.x =
          player.x;

        game.z =
          player.z;


        palsSave(
          game
        );


        saveAt =
          now;
      }


      renderer.render(
        scene,
        camera
      );


      THREE_ACTIVE.raf =
        requestAnimationFrame(
          loop
        );
    }


    THREE_ACTIVE.raf =
      requestAnimationFrame(
        loop
      );

  } catch (error) {

    console.error(
      error
    );


    body.innerHTML = `

      <div
        class="pals-card"
      >

        <h3>
          GALAXY PALS could not start
        </h3>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

        <button
          class="pals-primary"
          data-pals-home
        >
          Back
        </button>

      </div>

    `;
  }
}


/* ============================================================
   GLOBAL EVENTS
   ============================================================ */

document.addEventListener(
  "click",
  event => {

    const target =
      event.target instanceof
      Element
        ? event.target
        : null;


    if (!target) {
      return;
    }


    const action =
      target.closest(
        "[data-action]"
      );


    if (action) {

      const type =
        action.dataset.action;


      if (
        type === "send"
      ) {

        sendMessage();

        return;
      }


      if (
        type ===
        "new-chat"
      ) {

        newChat();

        return;
      }


      if (
        type ===
        "work-send"
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


    if (
      target.closest(
        "[data-game-back]"
      )
    ) {

      renderGames();

      return;
    }


    const open =
      target.closest(
        "[data-game-open]"
      );


    if (open) {

      const id =
        open.dataset.gameOpen;


      if (
        id === "chess"
      ) {
        resetChess();
        return;
      }


      if (
        id === "tictactoe"
      ) {
        resetTTT();
        return;
      }


      if (
        id === "connect4"
      ) {
        resetConnect();
        return;
      }


      if (
        id === "memory"
      ) {
        resetMemory();
        return;
      }


      if (
        id === "snake"
      ) {
        resetSnake();
        return;
      }


      if (
        id === "chicken"
      ) {
        resetChicken();
        return;
      }


      if (
        id === "arena"
      ) {
        openArena();
        return;
      }


      if (
        id === "pals"
      ) {
        openPals();
        return;
      }
    }


    const chess =
      target.closest(
        "[data-chess]"
      );


    if (chess) {

      const [
        r,
        c
      ] =
        chess.dataset
          .chess
          .split(",")
          .map(Number);


      clickChess(
        r,
        c
      );

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
        "[data-chess-undo]"
      )
    ) {

      const game =
        GameCenter.chess;


      if (
        game
          ?.snapshots
          .length
      ) {

        Object.assign(
          game,
          game.snapshots.pop(),
          {
            selected: null,
            legal: []
          }
        );


        renderChess();
      }


      return;
    }


    const ttt =
      target.closest(
        "[data-ttt]"
      );


    if (ttt) {

      tMove(
        Number(
          ttt.dataset.ttt
        )
      );

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


    const connect =
      target.closest(
        "[data-c4]"
      );


    if (connect) {

      cMove(
        Number(
          connect.dataset.c4
        )
      );

      return;
    }


    if (
      target.closest(
        "[data-c4-reset]"
      )
    ) {

      resetConnect();

      return;
    }


    const memory =
      target.closest(
        "[data-mem]"
      );


    if (memory) {

      memClick(
        Number(
          memory.dataset.mem
        )
      );

      return;
    }


    if (
      target.closest(
        "[data-mem-reset]"
      )
    ) {

      resetMemory();

      return;
    }


    if (
      target.closest(
        "[data-snake-start]"
      )
    ) {

      snakeStart();

      return;
    }


    if (
      target.closest(
        "[data-snake-new]"
      )
    ) {

      resetSnake();

      return;
    }


    const snakeDirection =
      target.closest(
        "[data-snake-dir]"
      );


    if (snakeDirection) {

      const direction = {

        up: [
          0,
          -1
        ],

        down: [
          0,
          1
        ],

        left: [
          -1,
          0
        ],

        right: [
          1,
          0
        ]

      }[
        snakeDirection
          .dataset
          .snakeDir
      ];


      snakeDir(
        ...direction
      );

      return;
    }


    if (
      target.closest(
        "[data-chick-start]"
      )
    ) {

      chickenStart();

      return;
    }


    if (
      target.closest(
        "[data-chick-new]"
      )
    ) {

      resetChicken();

      return;
    }


    const chickenDirection =
      target.closest(
        "[data-chick-dir]"
      );


    if (
      chickenDirection
    ) {

      const direction = {

        up: [
          0,
          -1
        ],

        down: [
          0,
          1
        ],

        left: [
          -8,
          0
        ],

        right: [
          8,
          0
        ]

      }[
        chickenDirection
          .dataset
          .chickDir
      ];


      chickenMove(
        ...direction
      );

      return;
    }


    const arenaMode =
      target.closest(
        "[data-arena-mode]"
      );


    if (arenaMode) {

      GameCenter.arena.mode =
        arenaMode
          .dataset
          .arenaMode;


      $$(
        "[data-arena-mode]"
      )
        .forEach(
          button => {

            button.classList.toggle(
              "active",
              button ===
              arenaMode
            );
          }
        );


      return;
    }


    if (
      target.closest(
        "[data-arena-start]"
      )
    ) {

      startArena();

      return;
    }


    if (
      target.closest(
        "[data-arena-home]"
      )
    ) {

      openArena();

      return;
    }


    if (
      target.closest(
        "[data-pals-play]"
      )
    ) {

      startPals();

      return;
    }


    if (
      target.closest(
        "[data-pals-new]"
      )
    ) {

      storage.del(
        PALS_SAVE
      );

      GameCenter.pals =
        palsDefault();

      openPals();

      return;
    }


    if (
      target.closest(
        "[data-pals-home]"
      )
    ) {

      openPals();

      return;
    }


    if (
      target.closest(
        "[data-pals-close]"
      )
    ) {

      target
        .closest(
          "#palsOverlay"
        )
        ?.remove();

      return;
    }
  }
);


/* ============================================================
   SELECT CHANGES
   ============================================================ */

document.addEventListener(
  "change",
  event => {

    const target =
      event.target;


    if (
      !(
        target instanceof
        HTMLSelectElement
      )
    ) {
      return;
    }


    if (
      target.matches(
        "[data-mode]"
      )
    ) {

      const game = {

        chess:
          GameCenter.chess,

        tictactoe:
          GameCenter.ttt,

        connect4:
          GameCenter.connect

      }[
        GameCenter.current
      ];


      if (game) {

        game.mode =
          target.value;


        if (
          GameCenter.current ===
          "chess"
        ) {

          resetChess();
        }


        if (
          GameCenter.current ===
          "tictactoe"
        ) {

          resetTTT();
        }


        if (
          GameCenter.current ===
          "connect4"
        ) {

          resetConnect();
        }
      }
    }


    if (
      target.matches(
        "[data-level]"
      )
    ) {

      const game = {

        chess:
          GameCenter.chess,

        tictactoe:
          GameCenter.ttt,

        connect4:
          GameCenter.connect

      }[
        GameCenter.current
      ];


      if (game) {

        game.elo =
          Number(
            target.value
          );
      }
    }


    if (
      target.matches(
        "[data-snake-level]"
      )
    ) {

      resetSnake(
        Number(
          target.value
        )
      );
    }


    if (
      target.matches(
        "[data-chick-level]"
      )
    ) {

      resetChicken(
        Number(
          target.value
        )
      );
    }
  }
);


/* ============================================================
   KEYBOARD FOR SNAKE + CHICKEN
   ============================================================ */

document.addEventListener(
  "keydown",
  event => {

    if (
      GameCenter.current ===
      "snake"
    ) {

      const direction = {

        ArrowUp: [
          0,
          -1
        ],

        KeyW: [
          0,
          -1
        ],

        ArrowDown: [
          0,
          1
        ],

        KeyS: [
          0,
          1
        ],

        ArrowLeft: [
          -1,
          0
        ],

        KeyA: [
          -1,
          0
        ],

        ArrowRight: [
          1,
          0
        ],

        KeyD: [
          1,
          0
        ]

      }[
        event.code
      ];


      if (direction) {

        event.preventDefault();

        snakeDir(
          ...direction
        );
      }
    }


    if (
      GameCenter.current ===
      "chicken"
    ) {

      const direction = {

        ArrowUp: [
          0,
          -1
        ],

        KeyW: [
          0,
          -1
        ],

        ArrowDown: [
          0,
          1
        ],

        KeyS: [
          0,
          1
        ],

        ArrowLeft: [
          -8,
          0
        ],

        KeyA: [
          -8,
          0
        ],

        ArrowRight: [
          8,
          0
        ],

        KeyD: [
          8,
          0
        ]

      }[
        event.code
      ];


      if (direction) {

        event.preventDefault();

        chickenMove(
          ...direction
        );
      }
    }
  }
);


/* ============================================================
   INITIALIZE
   ============================================================ */

function initializeGalaxy() {

  const input =
    $("#promptInput");


  if (input) {

    input.addEventListener(
      "input",
      () =>
        autoResize(
          input
        )
    );


    input.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          sendMessage();
        }
      }
    );


    autoResize(
      input
    );
  }


  $("#sendButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        sendMessage();
      }
    );


  $("#workPrompt")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter" &&
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


  const provider =
    $("#aiProvider");


  if (provider) {

    provider.value =
      "gemini";

    provider.disabled =
      true;
  }


  updateSendButtonState();


  console.log(
    "GALAXY AI initialized — Games + Arena + GALAXY PALS"
  );
}


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


/* ============================================================
   GLOBAL API
   ============================================================ */

window.GALAXY = {

  state,

  games:
    GameCenter,

  newChat,

  sendMessage,

  sendWork,

  openGames:
    renderGames,

  openArena,

  openPals
};
