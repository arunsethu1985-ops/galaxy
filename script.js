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
"Full 3D creatures • Capture • Mounts • Bosses"
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
GALAXY PALS BRIDGE
============================================================ */

const PALS_SAVE =
"galaxy.pals.real3d.v1";


function palsDefault() {

return {};

}


function openPals() {

if (
window.GALAXY_PALS_3D?.openPals
) {

return window.GALAXY_PALS_3D.openPals();

}

toast(
"GALAXY PALS 3D is loading…"
);

}


function startPals() {

if (
window.GALAXY_PALS_3D?.startPals
) {

return window.GALAXY_PALS_3D.startPals();

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
KEYBOARD
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


/* ============================================================
GALAXY PALS — FULL REAL 3D SYSTEM
============================================================ */

(() => {

"use strict";


const q =
(s, r = document) =>
r.querySelector(s);


const clamp3 =
(n, a, b) =>
Math.max(
a,
Math.min(
b,
n
)
);


const rand3 =
(a, b) =>
a +
Math.random() *
(b - a);


const pick3 =
a =>
a[
Math.floor(
Math.random() *
a.length
)
];


const safe =
(v = "") =>
String(v).replace(
/[&<>"']/g,
m => ({

"&": "&amp;",

"<": "&lt;",

">": "&gt;",

'"': "&quot;",

"'": "&#39;"

})[m]
);


const SAVE_KEY =
"galaxy.pals.real3d.v1";


/* ============================================================
ORIGINAL GALAXY PAL ROSTER
============================================================ */

const PAL_DEFS = [

{

id: "emberfox",

name: "Emberfox",

element: "Fire",

model:
"/assets/pals/emberfox.glb",

scale: 1.05,

hp: 110,

speed: 3.5,

rarity: 1,

mount: "ground"

},

{

id: "frostwolf",

name: "Frostwolf",

element: "Ice",

model:
"/assets/pals/frostwolf.glb",

scale: 1.18,

hp: 145,

speed: 4.0,

rarity: 2,

mount: "ground"

},

{

id: "voltlynx",

name: "Voltlynx",

element: "Electric",

model:
"/assets/pals/voltlynx.glb",

scale: 1.0,

hp: 120,

speed: 4.3,

rarity: 2,

mount: "ground"

},

{

id: "aquafin",

name: "Aquafin",

element: "Water",

model:
"/assets/pals/aquafin.glb",

scale: 1.25,

hp: 160,

speed: 3.2,

rarity: 2,

mount: "swim"

},

{

id: "stonehorn",

name: "Stonehorn",

element: "Ground",

model:
"/assets/pals/stonehorn.glb",

scale: 1.35,

hp: 210,

speed: 2.5,

rarity: 2,

mount: "ground"

},

{

id: "stormgryph",

name: "Stormgryph",

element: "Electric",

model:
"/assets/pals/stormgryph.glb",

scale: 1.35,

hp: 180,

speed: 4.8,

rarity: 4,

mount: "flying"

},

{

id: "cinderdrake",

name: "Cinderdrake",

element: "Fire",

model:
"/assets/pals/cinderdrake.glb",

scale: 1.55,

hp: 250,

speed: 4.1,

rarity: 4,

mount: "flying"

},

{

id: "glacierox",

name: "Glacierox",

element: "Ice",

model:
"/assets/pals/glacierox.glb",

scale: 1.5,

hp: 280,

speed: 2.4,

rarity: 4,

mount: "ground"

},

{

id: "voidlion",

name: "Voidlion",

element: "Dark",

model:
"/assets/pals/voidlion.glb",

scale: 1.3,

hp: 230,

speed: 4.4,

rarity: 5,

mount: "ground"

},

{

id: "bloomdeer",

name: "Bloomdeer",

element: "Grass",

model:
"/assets/pals/bloomdeer.glb",

scale: 1.1,

hp: 135,

speed: 3.8,

rarity: 2,

mount: "ground"

},

{

id: "moonowl",

name: "Moonowl",

element: "Dark",

model:
"/assets/pals/moonowl.glb",

scale: 1.05,

hp: 125,

speed: 4.2,

rarity: 3,

mount: "flying"

},

{

id: "starwyrm",

name: "Starwyrm",

element: "Dragon",

model:
"/assets/pals/starwyrm.glb",

scale: 2.15,

hp: 650,

speed: 4.0,

rarity: 5,

mount: "flying",

boss: true

}

];


/* ============================================================
CAPTURE ORBS
============================================================ */

const ORBS = [

{

name:
"Basic Orb",

bonus:
1.0,

color:
0x4ea8ff

},

{

name:
"Mega Orb",

bonus:
1.35,

color:
0x56d879

},

{

name:
"Giga Orb",

bonus:
1.75,

color:
0xe1c447

},

{

name:
"Hyper Orb",

bonus:
2.2,

color:
0xa06ae9

},

{

name:
"Ultra Orb",

bonus:
2.8,

color:
0xffb44d

}

];


const RUNTIME = {

running: false,

raf: 0,

cleanups: [],

mixers: [],

creatures: [],

projectiles: [],

companion: null,

mounted: false,

target: null,

heldOrb: null,

orbCharging: false,

chargeStarted: 0

};


/* ============================================================
SAVE
============================================================ */

function defaultSave() {

return {

level: 1,

xp: 0,

hp: 100,

stamina: 100,

hunger: 100,

x: 0,

y: 0,

z: 8,

selectedOrb: 0,

orbs: [
18,
6,
2,
1,
0
],

party: [],

box: []

};

}


function loadSave() {

try {

return {

...defaultSave(),

...(
JSON.parse(
localStorage.getItem(
SAVE_KEY
)
) ||
{}
)

};

} catch {

return defaultSave();

}

}


function saveGame(game) {

try {

localStorage.setItem(
SAVE_KEY,
JSON.stringify(game)
);

} catch {}

}


/* ============================================================
RUNTIME CLEANUP
============================================================ */

function addListener(
el,
type,
fn,
options
) {

el.addEventListener(
type,
fn,
options
);

RUNTIME.cleanups.push(
() =>
el.removeEventListener(
type,
fn,
options
)
);

}


function stopPals3D() {

RUNTIME.running =
false;

cancelAnimationFrame(
RUNTIME.raf
);

RUNTIME.cleanups
.splice(0)
.forEach(
fn => {

try {

fn();

} catch {}

}
);

RUNTIME.mixers.length =
0;

RUNTIME.creatures.length =
0;

RUNTIME.projectiles.length =
0;

RUNTIME.companion =
null;

RUNTIME.target =
null;

RUNTIME.heldOrb =
null;

RUNTIME.orbCharging =
false;

try {

if (
document.pointerLockElement
) {

document.exitPointerLock();

}

} catch {}

}


/* ============================================================
LOAD THREE + GLTF
============================================================ */

async function load3DModules() {

const THREE =
await import(
"https://cdn.jsdelivr.net/npm/three@0.160.0/+esm"
);

const {
GLTFLoader
} =
await import(
"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm"
);

const SkeletonUtils =
await import(
"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/SkeletonUtils.js/+esm"
);

return {

THREE,

GLTFLoader,

cloneSkinned:
SkeletonUtils.clone

};

}


/* ============================================================
ANIMATION SYSTEM
============================================================ */

function findClip(
clips,
names
) {

const lower =
clips.map(
c => ({

clip: c,

name:
c.name.toLowerCase()

})
);

for (
const wanted of
names
) {

const found =
lower.find(
x =>
x.name.includes(
wanted
)
);

if (found) {

return found.clip;

}

}

return clips[0] ||
null;

}


function playAction(
entity,
state
) {

if (
!entity.mixer ||
!entity.clips?.length
) {

return;

}

if (
entity.animState ===
state
) {

return;

}

entity.animState =
state;

const map = {

idle: [
"idle",
"breath",
"stand"
],

walk: [
"walk",
"move"
],

run: [
"run",
"sprint",
"gallop"
],

fly: [
"fly",
"flight"
],

attack: [
"attack",
"bite",
"skill",
"hit"
],

hurt: [
"hurt",
"damage"
],

sleep: [
"sleep"
]

};

const clip =
findClip(
entity.clips,
map[state] ||
[state]
);

if (!clip) {

return;

}

const next =
entity.mixer.clipAction(
clip
);

if (

entity.currentAction &&

entity.currentAction !==
next

) {

entity.currentAction.fadeOut(
0.15
);

}

next
.reset()
.fadeIn(
0.15
)
.play();

entity.currentAction =
next;

}


/* ============================================================
3D PLAYER FALLBACK
============================================================ */

function createFallbackPlayer(THREE) {

const g =
new THREE.Group();

const mat =
new THREE
.MeshStandardMaterial({

color:
0x334b6a,

roughness:
0.75

});

const skin =
new THREE
.MeshStandardMaterial({

color:
0xd6ad8a,

roughness:
0.8

});

const body =
new THREE.Mesh(

new THREE
.CapsuleGeometry(
0.32,
0.9,
6,
10
),

mat

);

body.position.y =
1.1;

const head =
new THREE.Mesh(

new THREE
.SphereGeometry(
0.24,
18,
14
),

skin

);

head.position.y =
1.92;

g.add(
body,
head
);

g.traverse(
o => {

if (
o.isMesh
) {

o.castShadow =
true;

}

}
);

return g;

}


/* ============================================================
3D CAPTURE ORB
============================================================ */

function createOrb(
THREE,
tier
) {

const def =
ORBS[tier];

const group =
new THREE.Group();

const shell =
new THREE.Mesh(

new THREE
.SphereGeometry(
0.18,
20,
16
),

new THREE
.MeshStandardMaterial({

color:
def.color,

metalness:
0.35,

roughness:
0.22,

emissive:
def.color,

emissiveIntensity:
0.18

})

);

const ring =
new THREE.Mesh(

new THREE
.TorusGeometry(
0.185,
0.022,
8,
26
),

new THREE
.MeshStandardMaterial({

color:
0xffffff,

metalness:
0.55,

roughness:
0.25

})

);

ring.rotation.x =
Math.PI /
2;

group.add(
shell,
ring
);

group.traverse(
o => {

if (
o.isMesh
) {

o.castShadow =
true;

}

}
);

return group;

}


/* ============================================================
PALS HOME
============================================================ */

function openPalsHome() {

stopPals3D();

if (
typeof GameCenter !==
"undefined"
) {

GameCenter.current =
"pals";

}

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
"FULL 3D CREATURE SURVIVAL";

}

const game =
loadSave();

const body =
q(
"#contentBody"
);

if (!body) {

return;

}

body.innerHTML = `

<div class="gp3d-home">

<section class="gp3d-hero">

<span class="gp3d-kicker">
GALAXY PALS • FULL 3D
</span>

<h2>
Creature Survival World
</h2>

<p>
Real GLB creature models,
third-person movement,
physical capture Orbs,
mounts,
flying Pals
and bosses.
</p>

<div class="gp3d-actions">

<button
class="gp3d-primary"
data-gp3d-start
>
PLAY 3D WORLD
</button>

<button
class="gp3d-secondary"
data-gp3d-reset
>
RESET SAVE
</button>

</div>

</section>

<aside class="gp3d-summary">

<div>

<strong>
${game.box.length}
</strong>

<span>
Captured
</span>

</div>

<div>

<strong>
${game.party.length}/5
</strong>

<span>
Party
</span>

</div>

<div>

<strong>
LV ${game.level}
</strong>

<span>
Player
</span>

</div>

</aside>

</div>

`;

}


/* ============================================================
START FULL 3D WORLD
============================================================ */

async function startPals3D() {

stopPals3D();

if (
typeof GameCenter !==
"undefined"
) {

GameCenter.current =
"pals";

}

const body =
q(
"#contentBody"
);

if (!body) {

return;

}

body.innerHTML = `

<div
class="gp3d-world"
id="gp3dWorld"
>

<canvas
id="gp3dCanvas"
></canvas>

<div
class="gp3d-vignette"
></div>

<div
class="gp3d-top"
>

<div
class="gp3d-pill"
id="gp3dZone"
>
Verdant Wilds
</div>

<div
class="gp3d-pill"
id="gp3dClock"
>
DAY 1 • 08:00
</div>

<div
class="gp3d-pill"
id="gp3dLevel"
>
LV 1
</div>

</div>

<div
class="gp3d-crosshair"
></div>

<div
class="gp3d-target"
id="gp3dTarget"
hidden
></div>

<div
class="gp3d-feed"
id="gp3dFeed"
></div>

<div
class="gp3d-party"
id="gp3dParty"
></div>

<div
class="gp3d-bars"
>

<div>

<span>
HP
</span>

<i>
<b
id="gp3dHP"
></b>
</i>

<strong
id="gp3dHPText"
>
100
</strong>

</div>

<div>

<span>
STAMINA
</span>

<i>
<b
id="gp3dSTA"
></b>
</i>

<strong
id="gp3dSTAText"
>
100
</strong>

</div>

<div>

<span>
FOOD
</span>

<i>
<b
id="gp3dFood"
></b>
</i>

<strong
id="gp3dFoodText"
>
100
</strong>

</div>

</div>

<div
class="gp3d-orbs"
id="gp3dOrbs"
></div>

<div
class="gp3d-help"
>
Click world • WASD move • Shift sprint • Left click attack • Hold Q aim Orb • Release Q throw • F summon • E mount • 1–5 Orb
</div>

<div
class="gp3d-loading"
id="gp3dLoading"
>
Loading 3D world…
</div>

</div>

`;

const game =
loadSave();

const {

THREE,

GLTFLoader,

cloneSkinned

} =
await load3DModules();

const canvas =
q(
"#gp3dCanvas"
);

const host =
q(
"#gp3dWorld"
);

const loader =
new GLTFLoader();


/* ============================================================
SCENE
============================================================ */

const scene =
new THREE.Scene();

scene.background =
new THREE.Color(
0x92cdeb
);

scene.fog =
new THREE
.FogExp2(
0xa5d1df,
0.0058
);

const camera =
new THREE
.PerspectiveCamera(
66,
1,
0.1,
420
);

const renderer =
new THREE
.WebGLRenderer({

canvas,

antialias:
true,

alpha:
false

});

renderer.shadowMap.enabled =
true;

renderer.shadowMap.type =
THREE.PCFSoftShadowMap;

renderer.outputColorSpace =
THREE.SRGBColorSpace;

renderer.toneMapping =
THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure =
1.05;


const hemi =
new THREE
.HemisphereLight(
0xe8f7ff,
0x405337,
1.5
);

scene.add(
hemi
);


const sun =
new THREE
.DirectionalLight(
0xffefd0,
2.2
);

sun.position.set(
45,
65,
25
);

sun.castShadow =
true;

sun.shadow.mapSize.set(
2048,
2048
);

scene.add(
sun
);


const world =
new THREE.Group();

scene.add(
world
);


/* ============================================================
3D GROUND
============================================================ */

const ground =
new THREE.Mesh(

new THREE
.PlaneGeometry(
360,
360,
1,
1
),

new THREE
.MeshStandardMaterial({

color:
0x5b844a,

roughness:
0.96

})

);

ground.rotation.x =
-Math.PI /
2;

ground.receiveShadow =
true;

world.add(
ground
);


/* ============================================================
3D WATER
============================================================ */

const water =
new THREE.Mesh(

new THREE
.CircleGeometry(
26,
64
),

new THREE
.MeshPhysicalMaterial({

color:
0x4d9bc7,

transparent:
true,

opacity:
0.72,

roughness:
0.12,

metalness:
0.02,

clearcoat:
0.6

})

);

water.rotation.x =
-Math.PI /
2;

water.position.set(
55,
0.05,
-45
);

world.add(
water
);


/* ============================================================
3D TREES AND ROCKS
============================================================ */

for (
let i = 0;
i < 120;
i++
) {

const x =
rand3(
-165,
165
);

const z =
rand3(
-165,
165
);

if (
Math.hypot(
x,
z
) < 14
) {

continue;

}

if (
Math.random() <
0.68
) {

const tree =
new THREE.Group();

const h =
rand3(
3.5,
7.5
);

const trunk =
new THREE.Mesh(

new THREE
.CylinderGeometry(
0.28,
0.52,
h,
10
),

new THREE
.MeshStandardMaterial({

color:
0x6b482e,

roughness:
1

})

);

trunk.position.y =
h /
2;

trunk.castShadow =
true;

tree.add(
trunk
);

for (
let j = 0;
j < 3;
j++
) {

const crown =
new THREE.Mesh(

new THREE
.IcosahedronGeometry(
rand3(
1.15,
2.15
),
1
),

new THREE
.MeshStandardMaterial({

color:
pick3([
0x3f7139,
0x4c8142,
0x5a8f49
]),

roughness:
0.95

})

);

crown.position.set(

rand3(
-0.45,
0.45
),

h *
0.72 +
j *
0.55,

rand3(
-0.45,
0.45
)

);

crown.castShadow =
true;

tree.add(
crown
);

}

tree.position.set(
x,
0,
z
);

world.add(
tree
);

} else {

const rock =
new THREE.Mesh(

new THREE
.DodecahedronGeometry(
rand3(
0.6,
2
)
),

new THREE
.MeshStandardMaterial({

color:
0x777b74,

roughness:
0.96

})

);

rock.position.set(

x,

rand3(
0.4,
1
),

z

);

rock.rotation.set(

rand3(
0,
2
),

rand3(
0,
2
),

rand3(
0,
2
)

);

rock.castShadow =
true;

rock.receiveShadow =
true;

world.add(
rock
);

}

}


/* ============================================================
PLAYER
============================================================ */

const player = {

x:
game.x ||
0,

y:
game.y ||
0,

z:
game.z ||
8,

yaw:
0,

pitch:
-0.12,

hp:
game.hp ??
100,

stamina:
game.stamina ??
100,

hunger:
game.hunger ??
100,

model:
null,

mixer:
null,

clips: [],

currentAction:
null,

animState:
"",

speed:
4.7

};


try {

const gltf =
await loader.loadAsync(
"/assets/player/player.glb"
);

player.model =
gltf.scene;

player.clips =
gltf.animations ||
[];

player.mixer =
new THREE.AnimationMixer(
player.model
);

RUNTIME.mixers.push(
player.mixer
);

player.model.scale.setScalar(
1
);

player.model.traverse(
o => {

if (
o.isMesh
) {

o.castShadow =
true;

o.receiveShadow =
true;

}

}
);

playAction(
player,
"idle"
);

} catch {

player.model =
createFallbackPlayer(
THREE
);

}

world.add(
player.model
);


/* ============================================================
LOAD EVERY PAL MODEL
============================================================ */

const palCache =
new Map();

const failedModels =
[];


for (
const def of
PAL_DEFS
) {

try {

const gltf =
await loader.loadAsync(
def.model
);

gltf.scene.traverse(
o => {

if (
o.isMesh
) {

o.castShadow =
true;

o.receiveShadow =
true;

if (
o.material?.map
) {

o.material.map.colorSpace =
THREE.SRGBColorSpace;

}

}

}
);

palCache.set(
def.id,
{

scene:
gltf.scene,

clips:
gltf.animations ||
[]

}
);

} catch {

failedModels.push(
def.model
);

}

}


/* ============================================================
DO NOT CREATE COLORED BALL FALLBACK PALS
============================================================ */

if (
!palCache.size
) {

q(
"#gp3dLoading"
).innerHTML = `

<strong>
3D PAL MODELS ARE MISSING
</strong>

<br><br>

Add your original GLB files inside:

<br>

<code>
/assets/pals/
</code>

<br><br>

and add:

<br>

<code>
/assets/player/player.glb
</code>

<br><br>

GALAXY intentionally does not replace missing Pals with colored balls.

`;

return;

}


q(
"#gp3dLoading"
)?.remove();


const creatures =
RUNTIME.creatures;


/* ============================================================
SPAWN 3D PAL
============================================================ */

function spawnCreature(
def,
x,
z,
level = 1
) {

const cached =
palCache.get(
def.id
);

if (!cached) {

return null;

}

const model =
cloneSkinned(
cached.scene
);

model.scale.setScalar(

def.scale *

(
def.boss
? 1.35
: 1
)

);

model.position.set(
x,
0,
z
);

world.add(
model
);

const creature = {

def,

model,

clips:
cached.clips,

mixer:
cached.clips.length

? new THREE
.AnimationMixer(
model
)

: null,

currentAction:
null,

animState:
"",

x,

y:
0,

z,

hp:
def.hp *
(
def.boss
? 2.2
: 1
),

maxHp:
def.hp *
(
def.boss
? 2.2
: 1
),

level,

direction:
rand3(
0,
Math.PI *
2
),

changeAt:
performance.now() +
rand3(
1200,
3200
),

alive:
true,

aggressive:
false,

boss:
!!def.boss

};

if (
creature.mixer
) {

RUNTIME.mixers.push(
creature.mixer
);

}

model.traverse(
o => {

if (
o.isMesh
) {

o.userData.gpCreature =
creature;

}

}
);

playAction(

creature,

def.mount ===
"flying"
? "fly"
: "idle"

);

creatures.push(
creature
);

return creature;

}


/* ============================================================
SPAWN EACH DIFFERENT SPECIES
============================================================ */

const availableDefs =
PAL_DEFS.filter(
d =>
palCache.has(
d.id
)
);


availableDefs.forEach(
(
def,
index
) => {

const a =
index /
availableDefs.length *
Math.PI *
2;

const r =
def.boss
? 110
: 35 +
(index % 5) *
15;

spawnCreature(

def,

Math.sin(a) *
r +
rand3(
-5,
5
),

Math.cos(a) *
r +
rand3(
-5,
5
),

def.boss

? 25

: Math.floor(
rand3(
2,
12
)
)

);

}
);


/* EXTRA WILD PALS */

for (
let i = 0;
i < 12;
i++
) {

const def =
pick3(
availableDefs.filter(
d =>
!d.boss
)
);

if (def) {

spawnCreature(

def,

rand3(
-120,
120
),

rand3(
-120,
120
),

Math.floor(
rand3(
2,
15
)
)

);

}

}


/* ============================================================
INPUT / TARGETING
============================================================ */

const keys =
new Set();

const raycaster =
new THREE.Raycaster();

const feed =
[];

let lastSave =
performance.now();

let worldTime =
8;


function feedMsg(text) {

feed.unshift({

text,

t:
performance.now()

});

feed.splice(
5
);

}


function getCaptureChance(c) {

const weaken =
1 -
c.hp /
c.maxHp;

const orb =
ORBS[
game.selectedOrb
] ||
ORBS[0];

return clamp3(

(
0.16 +
weaken *
0.72
)

*

orb.bonus

/

(
1 +
c.def.rarity *
0.22 +
c.level *
0.015
),

0.03,

0.95

);

}


function findTarget() {

raycaster.setFromCamera(

new THREE.Vector2(
0,
0
),

camera

);

const meshes =
[];

creatures.forEach(
c => {

if (
!c.alive
) {

return;

}

c.model.traverse(
o => {

if (
o.isMesh
) {

meshes.push(
o
);

}

}
);

}
);

const hit =
raycaster.intersectObjects(
meshes,
false
)[0];

RUNTIME.target =

hit &&
hit.distance < 30

? hit.object
.userData
.gpCreature ||
null

: null;

}


/* ============================================================
COMBAT
============================================================ */

function attackTarget() {

const c =
RUNTIME.target;

if (
!c?.alive
) {

return;

}

c.hp =
Math.max(

0,

c.hp -
(
18 +
game.level *
1.5
)

);

c.aggressive =
true;

playAction(
c,
"hurt"
);

feedMsg(
`${c.def.name} HP ${Math.ceil(c.hp)}`
);

if (
c.hp <= 0
) {

c.alive =
false;

c.model.visible =
false;

feedMsg(
`${c.def.name} defeated`
);

} else {

setTimeout(
() => {

if (
c.alive
) {

playAction(

c,

c.def.mount ===
"flying"
? "fly"
: "run"

);

}

},
350
);

}

}


/* ============================================================
HOLD Q — SHOW 3D ORB
============================================================ */

function beginOrbCharge() {

if (
RUNTIME.orbCharging ||
RUNTIME.mounted
) {

return;

}

const tier =
game.selectedOrb ||
0;

if (
(
game.orbs[tier] ||
0
) <= 0
) {

feedMsg(
"No capture Orbs"
);

return;

}

RUNTIME.orbCharging =
true;

RUNTIME.chargeStarted =
performance.now();

const orb =
createOrb(
THREE,
tier
);

RUNTIME.heldOrb =
orb;

scene.add(
orb
);

}


/* ============================================================
ORB IN PLAYER HAND
============================================================ */

function updateHeldOrb() {

if (
!RUNTIME.heldOrb
) {

return;

}

const dir =
new THREE.Vector3();

camera.getWorldDirection(
dir
);

const right =
new THREE.Vector3()
.crossVectors(
dir,
camera.up
)
.normalize();

RUNTIME.heldOrb.position
.copy(
camera.position
)
.add(
dir.clone()
.multiplyScalar(
1.15
)
)
.add(
right.multiplyScalar(
0.42
)
)
.add(
new THREE.Vector3(
0,
-0.35,
0
)
);

RUNTIME.heldOrb.rotation.y +=
0.05;

}


/* ============================================================
RELEASE Q — PHYSICALLY THROW ORB
============================================================ */

function releaseOrb() {

if (

!RUNTIME.orbCharging ||

!RUNTIME.heldOrb

) {

return;

}

const tier =
game.selectedOrb ||
0;

if (
(
game.orbs[tier] ||
0
) <= 0
) {

return;

}

game.orbs[tier]--;

const charge =
clamp3(

(
performance.now() -
RUNTIME.chargeStarted
) /
900,

0.25,

1

);

const dir =
new THREE.Vector3();

camera.getWorldDirection(
dir
);

const orb =
RUNTIME.heldOrb;

RUNTIME.heldOrb =
null;

RUNTIME.orbCharging =
false;

RUNTIME.projectiles.push({

mesh:
orb,

velocity:
dir
.multiplyScalar(
13 +
13 *
charge
)
.add(
new THREE.Vector3(
0,
3.2 +
2 *
charge,
0
)
),

life:
5,

tier

});

feedMsg(
`${ORBS[tier].name} thrown`
);

}


/* ============================================================
CAPTURE RESULT
============================================================ */

function resolveCapture(
c,
projectile
) {

projectile.dead =
true;

projectile.mesh.visible =
false;

const chance =
getCaptureChance(
c
);

c.model.visible =
false;

feedMsg(
`Capturing ${c.def.name}… ${Math.round(
chance *
100
)}%`
);

setTimeout(
() => {

if (
Math.random() <
chance
) {

c.alive =
false;

game.box.push(
c.def.id
);

if (
game.party.length <
5
) {

game.party.push(
c.def.id
);

}

game.xp +=
40 *
c.def.rarity;

feedMsg(
`${c.def.name} captured!`
);

saveGame(
game
);

} else {

c.model.visible =
true;

c.aggressive =
true;

playAction(

c,

c.def.mount ===
"flying"
? "fly"
: "run"

);

feedMsg(
`${c.def.name} escaped!`
);

}

},
950
);

}


/* ============================================================
UPDATE 3D ORB PROJECTILES
============================================================ */

function updateProjectiles(dt) {

for (
const p of
RUNTIME.projectiles
) {

if (
p.dead
) {

continue;

}

p.velocity.y -=
9.8 *
dt;

p.mesh.position
.addScaledVector(
p.velocity,
dt
);

p.mesh.rotation.x +=
dt *
8;

p.mesh.rotation.z +=
dt *
5;

p.life -=
dt;

let hit =
null;

for (
const c of
creatures
) {

if (
!c.alive ||
!c.model.visible
) {

continue;

}

if (

p.mesh.position
.distanceTo(
c.model.position
) <

(
c.boss
? 2.2
: 1.35
)

) {

hit =
c;

break;

}

}

if (hit) {

resolveCapture(
hit,
p
);

continue;

}

if (

p.life <= 0 ||

p.mesh.position.y <
0.12

) {

p.dead =
true;

}

}

RUNTIME.projectiles =
RUNTIME.projectiles.filter(
p => {

if (
p.dead
) {

scene.remove(
p.mesh
);

return false;

}

return true;

}
);

}


/* ============================================================
SUMMON COMPANION
============================================================ */

function summonCompanion() {

if (
RUNTIME.mounted
) {

return;

}

if (
RUNTIME.companion
) {

world.remove(
RUNTIME.companion.model
);

RUNTIME.companion =
null;

feedMsg(
"Companion recalled"
);

return;

}

const id =
game.party[0];

const def =
PAL_DEFS.find(
d =>
d.id === id
);

const cached =
def
? palCache.get(
def.id
)
: null;

if (
!def ||
!cached
) {

feedMsg(
"Capture a Pal first"
);

return;

}

const model =
cloneSkinned(
cached.scene
);

model.scale.setScalar(
def.scale
);

model.position.set(

player.x +
2,

player.y,

player.z +
2

);

world.add(
model
);

const companion = {

def,

model,

clips:
cached.clips,

mixer:
cached.clips.length

? new THREE
.AnimationMixer(
model
)

: null,

currentAction:
null,

animState:
"",

alive:
true

};

if (
companion.mixer
) {

RUNTIME.mixers.push(
companion.mixer
);

}

playAction(

companion,

def.mount ===
"flying"
? "fly"
: "idle"

);

RUNTIME.companion =
companion;

feedMsg(
`${def.name} summoned`
);

}


/* ============================================================
MOUNT PAL
============================================================ */

function toggleMount() {

const c =
RUNTIME.companion;

if (
!c ||
!c.def.mount
) {

feedMsg(
"Summon a mountable Pal first"
);

return;

}

if (

!RUNTIME.mounted &&

c.model.position
.distanceTo(
player.model.position
) > 5

) {

feedMsg(
"Move closer to your Pal"
);

return;

}

RUNTIME.mounted =
!RUNTIME.mounted;

player.model.visible =
!RUNTIME.mounted;

feedMsg(

RUNTIME.mounted

? `Mounted ${c.def.name}`

: `Dismounted ${c.def.name}`

);

}


/* ============================================================
COMPANION / MOUNT MOVEMENT
============================================================ */

function updateCompanion(
dt,
moveForward,
moveRight,
sprint
) {

const c =
RUNTIME.companion;

if (!c) {

return;

}

if (
RUNTIME.mounted
) {

const speed =

c.def.mount ===
"flying"

? 11

: sprint
? 10
: 7;

const sin =
Math.sin(
player.yaw
);

const cos =
Math.cos(
player.yaw
);

c.model.position.x +=

(
-sin *
moveForward

+

cos *
moveRight
)

*

speed

*

dt;

c.model.position.z +=

(
-cos *
moveForward

-

sin *
moveRight
)

*

speed

*

dt;

if (
c.def.mount ===
"flying"
) {

if (
keys.has(
"Space"
)
) {

c.model.position.y +=
6 *
dt;

}

if (
keys.has(
"ControlLeft"
)
) {

c.model.position.y -=
6 *
dt;

}

c.model.position.y =
clamp3(
c.model.position.y,
0.2,
35
);

playAction(
c,
"fly"
);

} else {

c.model.position.y =
0;

playAction(

c,

(
moveForward ||
moveRight
)

? (
sprint
? "run"
: "walk"
)

: "idle"

);

}

c.model.rotation.y =
player.yaw;

player.x =
c.model.position.x;

player.y =
c.model.position.y;

player.z =
c.model.position.z;

return;

}


const tx =
player.x +
Math.cos(
player.yaw
) *
2.5;

const tz =
player.z -
Math.sin(
player.yaw
) *
2.5;

const dx =
tx -
c.model.position.x;

const dz =
tz -
c.model.position.z;

const d =
Math.hypot(
dx,
dz
);

if (
d > 1.5
) {

c.model.position.x +=
dx *
Math.min(
1,
dt *
3.2
);

c.model.position.z +=
dz *
Math.min(
1,
dt *
3.2
);

c.model.rotation.y =
Math.atan2(
dx,
dz
);

playAction(

c,

c.def.mount ===
"flying"
? "fly"
: "run"

);

} else {

playAction(

c,

c.def.mount ===
"flying"
? "fly"
: "idle"

);

}

if (
c.def.mount ===
"flying"
) {

c.model.position.y =

1.8 +

Math.sin(
performance.now() *
0.002
) *
0.25;

}

}


/* ============================================================
WILD PAL AI
============================================================ */

function updateWild(
dt,
now
) {

creatures.forEach(
c => {

if (
!c.alive ||
!c.model.visible
) {

return;

}

const dx =
player.x -
c.x;

const dz =
player.z -
c.z;

const dist =
Math.hypot(
dx,
dz
);

if (
c.aggressive &&
dist < 28
) {

c.direction =
Math.atan2(
dx,
dz
);

const s =
c.def.speed *
(
c.boss
? 1.05
: 0.85
);

c.x +=
Math.sin(
c.direction
) *
s *
dt;

c.z +=
Math.cos(
c.direction
) *
s *
dt;

playAction(

c,

c.def.mount ===
"flying"
? "fly"
: "run"

);

if (

dist < 2.5 &&

Math.random() <
dt *
0.65

) {

player.hp =
Math.max(

0,

player.hp -
(
c.boss
? 16
: 6
)

);

playAction(
c,
"attack"
);

feedMsg(
`${c.def.name} hit you`
);

}

} else {

if (
now >
c.changeAt
) {

c.direction +=
rand3(
-1.3,
1.3
);

c.changeAt =
now +
rand3(
1600,
3800
);

}

const s =
c.def.speed *
0.16;

c.x +=
Math.sin(
c.direction
) *
s *
dt;

c.z +=
Math.cos(
c.direction
) *
s *
dt;

playAction(

c,

c.def.mount ===
"flying"
? "fly"
: "walk"

);

}

c.model.position.x =
c.x;

c.model.position.z =
c.z;

c.model.rotation.y =
c.direction;

if (
c.def.mount ===
"flying"
) {

c.model.position.y =

c.boss

? 7

: 2.2 +
Math.sin(
now *
0.0015 +
c.x
) *
0.4;

}

}
);

}


/* ============================================================
HUD
============================================================ */

function renderHUD() {

const bar =
(
id,
value
) => {

const el =
q(id);

if (el) {

el.style.width =
`${clamp3(
value,
0,
100
)}%`;

}

};

bar(
"#gp3dHP",
player.hp
);

bar(
"#gp3dSTA",
player.stamina
);

bar(
"#gp3dFood",
player.hunger
);


if (
q(
"#gp3dHPText"
)
) {

q(
"#gp3dHPText"
).textContent =
Math.round(
player.hp
);

}

if (
q(
"#gp3dSTAText"
)
) {

q(
"#gp3dSTAText"
).textContent =
Math.round(
player.stamina
);

}

if (
q(
"#gp3dFoodText"
)
) {

q(
"#gp3dFoodText"
).textContent =
Math.round(
player.hunger
);

}

if (
q(
"#gp3dLevel"
)
) {

q(
"#gp3dLevel"
).textContent =
`LV ${game.level}`;

}


const target =
RUNTIME.target;

const targetEl =
q(
"#gp3dTarget"
);

if (
target?.alive
) {

targetEl.hidden =
false;

targetEl.innerHTML = `

<div>

<strong>
${safe(
target.def.name
)}
${
target.boss
? " • BOSS"
: ""
}
</strong>

<span>
LV ${target.level}
•
${safe(
target.def.element
)}
</span>

</div>

<i>

<b
style="
width:
${
100 *
target.hp /
target.maxHp
}%
"
></b>

</i>

<small>
Capture ${
Math.round(
getCaptureChance(
target
) *
100
)
}%
</small>

`;

} else {

targetEl.hidden =
true;

}


q(
"#gp3dFeed"
).innerHTML =
feed
.filter(
x =>
performance.now() -
x.t <
5500
)
.map(
x =>
`<div>${safe(
x.text
)}</div>`
)
.join("");


q(
"#gp3dOrbs"
).innerHTML =
ORBS.map(
(
o,
i
) => `

<div
class="
${
i ===
game.selectedOrb
? "active"
: ""
}
"
>

<strong>
${i + 1}
</strong>

<span>
${safe(
o.name
)}
</span>

<small>
x${
game.orbs[i] ||
0
}
</small>

</div>

`
)
.join("");


q(
"#gp3dParty"
).innerHTML =
game.party
.slice(
0,
5
)
.map(
id => {

const def =
PAL_DEFS.find(
d =>
d.id === id
);

return def

? `

<div>

<strong>
${safe(
def.name
)}
</strong>

<span>
${safe(
def.element
)}
•
${safe(
def.mount ||
"companion"
)}
</span>

</div>

`

: "";

}
)
.join("");

}


/* ============================================================
RESIZE
============================================================ */

function resize() {

if (
!host?.isConnected
) {

return;

}

renderer.setSize(

host.clientWidth,

host.clientHeight,

false

);

camera.aspect =
host.clientWidth /
host.clientHeight;

camera
.updateProjectionMatrix();

}


/* ============================================================
INPUT
============================================================ */

addListener(
canvas,
"click",
() =>
canvas
.requestPointerLock
?.()
);


addListener(
document,
"mousemove",
e => {

if (
document.pointerLockElement !==
canvas
) {

return;

}

player.yaw -=
e.movementX *
0.0024;

player.pitch =
clamp3(

player.pitch -
e.movementY *
0.0017,

-0.5,

0.28

);

}
);


addListener(
document,
"keydown",
e => {

if (
!host?.isConnected
) {

return;

}

keys.add(
e.code
);

if (
/^Digit[1-5]$/
.test(
e.code
)
) {

game.selectedOrb =
Number(
e.code.slice(-1)
) -
1;

}

if (
e.code ===
"KeyQ" &&
!e.repeat
) {

beginOrbCharge();

}

if (
e.code ===
"KeyF" &&
!e.repeat
) {

summonCompanion();

}

if (
e.code ===
"KeyE" &&
!e.repeat
) {

toggleMount();

}

}
);


addListener(
document,
"keyup",
e => {

keys.delete(
e.code
);

if (
e.code ===
"KeyQ"
) {

releaseOrb();

}

}
);


addListener(
document,
"mousedown",
e => {

if (

e.button === 0 &&

document.pointerLockElement ===
canvas &&

!RUNTIME.orbCharging

) {

attackTarget();

}

}
);


addListener(
window,
"resize",
resize
);


resize();


/* ============================================================
MAIN 3D LOOP
============================================================ */

RUNTIME.running =
true;

let last =
performance.now();


function loop(now) {

if (

!RUNTIME.running ||

!canvas.isConnected

) {

stopPals3D();

return;

}

const dt =
clamp3(

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


const sprint =

keys.has(
"ShiftLeft"
)

&&

player.stamina >
2;


/* PLAYER WALKING */

if (
!RUNTIME.mounted
) {

const speed =
sprint
? 7.5
: player.speed;

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
forward

+

cos *
right
)

*

speed

*

dt;

player.z +=

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

dt;

player.x =
clamp3(
player.x,
-170,
170
);

player.z =
clamp3(
player.z,
-170,
170
);

player.y =
0;

player.model.position.set(
player.x,
player.y,
player.z
);

player.model.rotation.y =
player.yaw;

playAction(

player,

(
forward ||
right
)

? (
sprint
? "run"
: "walk"
)

: "idle"

);

}


/* SURVIVAL */

player.stamina =
clamp3(

player.stamina +

(
sprint &&
(
forward ||
right
)

? -18

: 13
)

*

dt,

0,

100

);


player.hunger =
clamp3(

player.hunger -
0.12 *
dt,

0,

100

);


if (
player.hunger <
8
) {

player.hp =
Math.max(

0,

player.hp -
0.45 *
dt

);

}


/* WORLD */

updateCompanion(
dt,
forward,
right,
sprint
);

updateWild(
dt,
now
);

updateProjectiles(
dt
);

findTarget();

updateHeldOrb();


RUNTIME.mixers.forEach(
m => {

try {

m.update(dt);

} catch {}

}
);


/* THIRD-PERSON CAMERA */

const camTargetY =

RUNTIME.mounted &&
RUNTIME.companion

? RUNTIME.companion
.model
.position.y +
1.8

: 1.55;


const camDistance =
RUNTIME.mounted
? 9.5
: 6.7;


camera.position.set(

player.x +
Math.sin(
player.yaw
) *
camDistance,

player.y +
3.4 +
player.pitch *
3.2,

player.z +
Math.cos(
player.yaw
) *
camDistance

);


camera.lookAt(
player.x,
camTargetY,
player.z
);


/* DAY / NIGHT */

worldTime +=
dt *
0.12;

if (
worldTime >=
24
) {

worldTime -=
24;

}

const daylight =
clamp3(

Math.sin(
(
worldTime -
6
) /
24 *
Math.PI *
2
) *
0.5 +
0.55,

0.14,

1

);


sun.intensity =
0.35 +
daylight *
2;


hemi.intensity =
0.28 +
daylight *
1.2;


sun.position.set(

Math.sin(
worldTime /
24 *
Math.PI *
2
) *
70,

18 +
daylight *
60,

Math.cos(
worldTime /
24 *
Math.PI *
2
) *
70

);


if (
q(
"#gp3dClock"
)
) {

q(
"#gp3dClock"
).textContent =

`DAY 1 • ${
String(
Math.floor(
worldTime
)
)
.padStart(
2,
"0"
)
}:${
String(
Math.floor(
(
worldTime %
1
) *
60
)
)
.padStart(
2,
"0"
)
}`;

}


renderHUD();


renderer.render(
scene,
camera
);


/* AUTO SAVE */

if (
now -
lastSave >
5000
) {

Object.assign(

game,

{

x:
player.x,

y:
player.y,

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

saveGame(
game
);

lastSave =
now;

}


RUNTIME.raf =
requestAnimationFrame(
loop
);

}


feedMsg(
"Full 3D GALAXY PALS world loaded"
);


if (
failedModels.length
) {

feedMsg(
`${failedModels.length} Pal model file(s) missing`
);

}


RUNTIME.raf =
requestAnimationFrame(
loop
);

}


/* ============================================================
EXPOSE 3D PALS
============================================================ */

window.openPals =
openPalsHome;

window.startPals =
startPals3D;


window.GALAXY_PALS_3D = {

openPals:
openPalsHome,

startPals:
startPals3D,

stop:
stopPals3D,

PAL_DEFS

};


/* ============================================================
PALS BUTTON EVENTS
============================================================ */

document.addEventListener(
"click",
e => {

const b =
e.target.closest(
"[data-gp3d-start],[data-gp3d-reset]"
);

if (!b) {

return;

}

if (
b.hasAttribute(
"data-gp3d-start"
)
) {

startPals3D();

}

if (
b.hasAttribute(
"data-gp3d-reset"
)
) {

localStorage.removeItem(
SAVE_KEY
);

openPalsHome();

}

}
);


})();
