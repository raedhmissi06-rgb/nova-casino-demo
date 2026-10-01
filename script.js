/* =========================================================
   NOVA CASINO DEMO
   Main JavaScript
   Virtual Credits Only
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const NOVA_CONFIG = {
  startingBalance: 10000,

  slots: {
    minimumBet: 10,
    maximumBet: 1000,
    symbols: ["🍒", "🍋", "🍊", "🍇", "💎", "7️⃣"],
    spinDuration: 1200,
    jackpotMultiplier: 25
  },

  crash: {
    minimumBet: 10,
    maximumBet: 1000,
    minimumMultiplier: 1.01,
    maximumDemoMultiplier: 100
  },

  roulette: {
    minimumBet: 10,
    maximumBet: 1000
  },

  storageKey: "novaCasinoDemo"
};


/* =========================================================
   APPLICATION STATE
   ========================================================= */

const state = {
  balance: NOVA_CONFIG.startingBalance,

  currentGame: null,

  slots: {
    spinning: false,
    bet: 100,
    reels: ["🍒", "🍒", "🍒"],
    lastWin: 0
  },

  crash: {
    running: false,
    crashed: false,
    multiplier: 1.00,
    bet: 100,
    currentBet: 0,
    interval: null,
    crashPoint: 0
  },

  roulette: {
    spinning: false,
    bet: 100,
    selectedType: null,
    selectedValue: null
  },

  history: [],

  soundEnabled: true
};


/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return document.querySelectorAll(selector);
}


/* =========================================================
   STORAGE
   ========================================================= */

function saveState() {
  try {
    const data = {
      balance: state.balance,
      history: state.history,
      soundEnabled: state.soundEnabled
    };

    localStorage.setItem(
      NOVA_CONFIG.storageKey,
      JSON.stringify(data)
    );
  } catch (error) {
    console.warn("Could not save Nova state:", error);
  }
}


function loadState() {
  try {
    const saved = localStorage.getItem(
      NOVA_CONFIG.storageKey
    );

    if (!saved) {
      return;
    }

    const data = JSON.parse(saved);

    if (
      typeof data.balance === "number" &&
      Number.isFinite(data.balance) &&
      data.balance >= 0
    ) {
      state.balance = data.balance;
    }

    if (Array.isArray(data.history)) {
      state.history = data.history.slice(0, 30);
    }

    if (typeof data.soundEnabled === "boolean") {
      state.soundEnabled = data.soundEnabled;
    }

  } catch (error) {
    console.warn("Could not load Nova state:", error);
  }
}


/* =========================================================
   BALANCE
   ========================================================= */

function formatCredits(value) {
  return Math.floor(value).toLocaleString("en-US");
}


function updateBalance() {
  const balanceElement = $("#balance");

  if (balanceElement) {
    balanceElement.textContent =
      formatCredits(state.balance);
  }

  const balanceElements =
    $all("[data-balance]");

  balanceElements.forEach(element => {
    element.textContent =
      formatCredits(state.balance);
  });

  saveState();
}


function addCredits(amount) {
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return false;
  }

  state.balance += Math.floor(amount);

  updateBalance();

  return true;
}


function removeCredits(amount) {
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return false;
  }

  if (state.balance < amount) {
    showNotification(
      "Not enough virtual credits.",
      "error"
    );

    return false;
  }

  state.balance -= Math.floor(amount);

  updateBalance();

  return true;
}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function createNotificationContainer() {
  let container =
    $("#notification-container");

  if (container) {
    return container;
  }

  container = document.createElement("div");

  container.id =
    "notification-container";

  container.style.position =
    "fixed";

  container.style.top =
    "90px";

  container.style.right =
    "20px";

  container.style.zIndex =
    "99999";

  container.style.display =
    "flex";

  container.style.flexDirection =
    "column";

  container.style.gap =
    "10px";

  document.body.appendChild(container);

  return container;
}


function showNotification(message, type = "info") {
  const container =
    createNotificationContainer();

  const notification =
    document.createElement("div");

  notification.textContent = message;

  notification.style.minWidth = "240px";
  notification.style.padding = "14px 18px";
  notification.style.borderRadius = "10px";
  notification.style.fontSize = "14px";
  notification.style.fontWeight = "700";
  notification.style.background = "#111";
  notification.style.border = "1px solid #333";
  notification.style.boxShadow =
    "0 10px 30px rgba(0,0,0,.4)";
  notification.style.transition =
    "all .3s ease";

  if (type === "success") {
    notification.style.borderColor =
      "#d4af37";

    notification.style.color =
      "#d4af37";
  }

  if (type === "error") {
    notification.style.borderColor =
      "#e50914";

    notification.style.color =
      "#ff5a63";
  }

  if (type === "info") {
    notification.style.color =
      "#fff";
  }

  container.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform =
      "translateX(30px)";

    setTimeout(() => {
      notification.remove();
    }, 300);

  }, 2800);
}


/* =========================================================
   MODAL SYSTEM
   ========================================================= */

function createGameModal() {
  let modal = $("#nova-game-modal");

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");

  modal.id = "nova-game-modal";

  modal.innerHTML = `
    <div class="nova-modal-backdrop"></div>

    <div class="nova-modal">

      <button
        class="nova-modal-close"
        id="nova-modal-close"
        aria-label="Close"
      >
        ×
      </button>

      <div id="nova-modal-content"></div>

    </div>
  `;

  document.body.appendChild(modal);

  const style = document.createElement("style");

  style.textContent = `
    #nova-game-modal {
      position: fixed;
      inset: 0;
      z-index: 9990;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .nova-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,.82);
      backdrop-filter: blur(10px);
    }

    .nova-modal {
      position: relative;
      z-index: 2;
      width: min(900px, 100%);
      max-height: 90vh;
      overflow-y: auto;
      background:
        radial-gradient(
          circle at top,
          rgba(229,9,20,.12),
          transparent 50%
        ),
        #0b0b0b;
      border: 1px solid rgba(212,175,55,.35);
      border-radius: 18px;
      box-shadow:
        0 30px 100px rgba(0,0,0,.8);
      padding: 30px;
    }

    .nova-modal-close {
      position: absolute;
      top: 14px;
      right: 18px;
      width: 38px;
      height: 38px;
      border: 1px solid #333;
      border-radius: 50%;
      background: #111;
      color: white;
      font-size: 25px;
      cursor: pointer;
      z-index: 5;
    }

    .nova-modal-close:hover {
      border-color: #e50914;
      color: #e50914;
    }

    .nova-game-title {
      text-align: center;
      margin-bottom: 25px;
    }

    .nova-game-title small {
      color: #d4af37;
      letter-spacing: 4px;
    }

    .nova-game-title h2 {
      margin-top: 8px;
      font-size: 38px;
    }

    .nova-game-panel {
      background: #101010;
      border: 1px solid #242424;
      border-radius: 15px;
      padding: 25px;
    }

    .nova-bet-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 25px;
    }

    .nova-bet-row button,
    .nova-control {
      border: 1px solid #333;
      background: #161616;
      color: white;
      padding: 11px 17px;
      border-radius: 7px;
      cursor: pointer;
    }

    .nova-bet-row button:hover,
    .nova-control:hover {
      border-color: #d4af37;
    }

    .nova-bet-input {
      width: 130px;
      padding: 12px;
      text-align: center;
      border-radius: 7px;
      border: 1px solid #333;
      background: #050505;
      color: white;
      outline: none;
    }

    .nova-primary {
      background: linear-gradient(
        135deg,
        #e50914,
        #850008
      ) !important;

      border: none !important;

      color: white !important;

      font-weight: 900;

      box-shadow:
        0 0 25px rgba(229,9,20,.2);
    }

    .nova-primary:hover {
      box-shadow:
        0 0 35px rgba(229,9,20,.5);
    }

    .nova-slots {
      display: grid;
      grid-template-columns:
        repeat(3, 1fr);
      gap: 12px;
      margin: 30px 0;
    }

    .nova-reel {
      min-height: 130px;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        linear-gradient(
          145deg,
          #1a1a1a,
          #070707
        );
      border: 1px solid #333;
      border-radius: 12px;
      font-size: 55px;
      box-shadow:
        inset 0 0 30px rgba(0,0,0,.5);
    }

    .nova-reel.spinning {
      animation:
        novaShake .1s infinite;
    }

    @keyframes novaShake {
      0% {
        transform: translateY(-2px);
      }
      50% {
        transform: translateY(2px);
      }
      100% {
        transform: translateY(-2px);
      }
    }

    .nova-result {
      min-height: 28px;
      text-align: center;
      color: #aaa;
      font-weight: 700;
      margin-top: 15px;
    }

    .nova-win {
      color: #d4af37 !important;
      text-shadow:
        0 0 15px rgba(212,175,55,.5);
    }

    .nova-crash-display {
      text-align: center;
      padding: 45px 20px;
    }

    .nova-multiplier {
      font-size: clamp(55px, 12vw, 100px);
      font-weight: 900;
      color: #d4af37;
      text-shadow:
        0 0 30px rgba(212,175,55,.25);
    }

    .nova-crash-status {
      margin-top: 10px;
      color: #888;
    }

    .nova-roulette-wheel {
      width: 240px;
      height: 240px;
      margin: 20px auto;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        conic-gradient(
          #e50914 0deg 30deg,
          #111 30deg 60deg,
          #e50914 60deg 90deg,
          #111 90deg 120deg,
          #e50914 120deg 150deg,
          #111 150deg 180deg,
          #e50914 180deg 210deg,
          #111 210deg 240deg,
          #e50914 240deg 270deg,
          #111 270deg 300deg,
          #e50914 300deg 330deg,
          #111 330deg 360deg
        );
      border: 8px solid #d4af37;
      box-shadow:
        0 0 40px rgba(212,175,55,.15);
      transition: transform 2.5s
        cubic-bezier(.15,.8,.2,1);
    }

    .nova-wheel-center {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #080808;
      border: 3px solid #d4af37;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
    }

    .nova-choice-grid {
      display: grid;
      grid-template-columns:
        repeat(2, 1fr);
      gap: 10px;
      margin-top: 20px;
    }

    .nova-choice {
      padding: 13px;
      border-radius: 8px;
      border: 1px solid #333;
      background: #141414;
      color: white;
      cursor: pointer;
    }

    .nova-choice.active {
      border-color: #d4af37;
      color: #d4af37;
    }

    .nova-history {
      margin-top: 25px;
      max-height: 220px;
      overflow-y: auto;
    }

    .nova-history-item {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid #222;
      color: #888;
      font-size: 13px;
    }

    @media(max-width:600px) {
      .nova-modal {
        padding: 20px;
      }

      .nova-reel {
        min-height: 95px;
        font-size: 40px;
      }

      .nova-roulette-wheel {
        width: 190px;
        height: 190px;
      }
    }
  `;

  document.head.appendChild(style);

  $("#nova-modal-close").addEventListener(
    "click",
    closeGame
  );

  $(".nova-modal-backdrop").addEventListener(
    "click",
    closeGame
  );

  return modal;
}


function openModal(content) {
  const modal =
    createGameModal();

  const contentElement =
    $("#nova-modal-content");

  contentElement.innerHTML =
    content;

  modal.style.display =
    "flex";

  document.body.style.overflow =
    "hidden";
}


function closeGame() {
  const modal =
    $("#nova-game-modal");

  if (!modal) {
    return;
  }

  modal.style.display =
    "none";

  document.body.style.overflow =
    "";

  stopCrashGame();
}


/* =========================================================
   SCROLL
   ========================================================= */

function scrollToGames() {
  const games =
    $("#games");

  if (!games) {
    return;
  }

  games.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* =========================================================
   GAME NAVIGATION
   ========================================================= */

function openGame(game) {

  state.currentGame =
    game;

  createGameModal();

  if (game === "slots") {
    openSlots();
    return;
  }

  if (game === "crash") {
    openCrash();
    return;
  }

  if (game === "roulette") {
    openRoulette();
    return;
  }

  showNotification(
    "Unknown game.",
    "error"
  );
}


/* =========================================================
   SLOTS
   ========================================================= */

function openSlots() {

  const content = `
    <div class="nova-game-title">
      <small>NOVA ORIGINAL</small>
      <h2>🎰 NOVA SLOTS</h2>
      <p style="color:#777;margin-top:8px;">
        Virtual credits only
      </p>
    </div>

    <div class="nova-game-panel">

      <div class="nova-slots">

        <div class="nova-reel" id="slot-reel-1">
          ${state.slots.reels[0]}
        </div>

        <div class="nova-reel" id="slot-reel-2">
          ${state.slots.reels[1]}
        </div>

        <div class="nova-reel" id="slot-reel-3">
          ${state.slots.reels[2]}
        </div>

      </div>

      <div
        id="slots-result"
        class="nova-result"
      >
        Match three symbols for a reward.
      </div>

      <div class="nova-bet-row">

        <button onclick="changeSlotsBet(-50)">
          −50
        </button>

        <button onclick="changeSlotsBet(-10)">
          −10
        </button>

        <input
          id="slots-bet"
          class="nova-bet-input"
          type="number"
          min="10"
          max="1000"
          step="10"
          value="${state.slots.bet}"
        >

        <button onclick="changeSlotsBet(10)">
          +10
        </button>

        <button onclick="changeSlotsBet(50)">
          +50
        </button>

      </div>

      <div class="nova-bet-row">

        <button
          class="nova-primary"
          id="slots-spin"
          onclick="spinSlots()"
        >
          SPIN
        </button>

      </div>

      <div style="
        text-align:center;
        margin-top:18px;
        color:#666;
        font-size:12px;
      ">
        Balance:
        <strong
          style="color:#d4af37;"
          id="slots-balance"
        >
          ${formatCredits(state.balance)}
        </strong>
      </div>

    </div>
  `;

  openModal(content);
}


function getSlotsBet() {

  const input =
    $("#slots-bet");

  if (!input) {
    return state.slots.bet;
  }

  let bet =
    Number(input.value);

  if (!Number.isFinite(bet)) {
    bet = 100;
  }

  bet = Math.floor(bet / 10) * 10;

  bet = Math.max(
    NOVA_CONFIG.slots.minimumBet,
    bet
  );

  bet = Math.min(
    NOVA_CONFIG.slots.maximumBet,
    bet
  );

  return bet;
}


function changeSlotsBet(amount) {

  const input =
    $("#slots-bet");

  if (!input) {
    return;
  }

  let value =
    Number(input.value);

  if (!Number.isFinite(value)) {
    value = 100;
  }

  value += amount;

  value = Math.max(
    NOVA_CONFIG.slots.minimumBet,
    value
  );

  value = Math.min(
    NOVA_CONFIG.slots.maximumBet,
    value
  );

  input.value =
    value;
}


function randomSlotSymbol() {

  const symbols =
    NOVA_CONFIG.slots.symbols;

  return symbols[
    Math.floor(
      Math.random() * symbols.length
    )
  ];
}


function calculateSlotWin(reels, bet) {

  const [
    first,
    second,
    third
  ] = reels;

  if (
    first === second &&
    second === third
  ) {

    if (first === "7️⃣") {
      return bet *
        NOVA_CONFIG.slots.jackpotMultiplier;
    }

    if (first === "💎") {
      return bet * 10;
    }

    if (first === "🍒") {
      return bet * 7;
    }

    return bet * 5;
  }

  if (
    first === second ||
    second === third ||
    first === third
  ) {
    return bet * 2;
  }

  return 0;
}


async function spinSlots() {

  if (state.slots.spinning) {
    return;
  }

  const bet =
    getSlotsBet();

  state.slots.bet =
    bet;

  if (bet > state.balance) {

    showNotification(
      "Not enough virtual credits.",
      "error"
    );

    return;
  }

  if (!removeCredits(bet)) {
    return;
  }

  state.slots.spinning =
    true;

  const button =
    $("#slots-spin");

  if (button) {
    button.disabled = true;
    button.textContent =
      "SPINNING...";
  }

  const reels =
    $all(".nova-reel");

  reels.forEach(reel => {
    reel.classList.add(
      "spinning"
    );
  });

  const result =
    [
      randomSlotSymbol(),
      randomSlotSymbol(),
      randomSlotSymbol()
    ];

  const start =
    Date.now();

  const animation =
    setInterval(() => {

      reels.forEach(reel => {
        reel.textContent =
          randomSlotSymbol();
      });

      if (
        Date.now() - start >=
        NOVA_CONFIG.slots.spinDuration
      ) {

        clearInterval(animation);

        finishSlotsSpin(
          result,
          bet
        );

      }

    }, 100);

}


function finishSlotsSpin(
  result,
  bet
) {

  state.slots.reels =
    result;

  const reels =
    $all(".nova-reel");

  reels.forEach(
    (reel, index) => {

      reel.classList.remove(
        "spinning"
      );

      reel.textContent =
        result[index];
    }
  );

  const win =
    calculateSlotWin(
      result,
      bet
    );

  state.slots.lastWin =
    win;

  const resultElement =
    $("#slots-result");

  if (win > 0) {

    addCredits(win);

    if (resultElement) {
      resultElement.textContent =
        `🎉 WIN +${formatCredits(win)} CREDITS!`;

      resultElement.classList.add(
        "nova-win"
      );
    }

    showNotification(
      `You won ${formatCredits(win)} virtual credits!`,
      "success"
    );

    addHistory(
      "Slots",
      win,
      "win"
    );

  } else {

    if (resultElement) {
      resultElement.textContent =
        "No match this time. Try again.";
    }

    addHistory(
      "Slots",
      -bet,
      "loss"
    );
  }

  const button =
    $("#slots-spin");

  if (button) {
    button.disabled = false;
    button.textContent =
      "SPIN";
  }

  state.slots.spinning =
    false;

  updateBalance();

  const localBalance =
    $("#slots-balance");

  if (localBalance) {
    localBalance.textContent =
      formatCredits(state.balance);
  }
}


/* =========================================================
   CRASH
   ========================================================= */

function openCrash() {

  const content = `
    <div class="nova-game-title">
      <small>NOVA ORIGINAL</small>
      <h2>🚀 NOVA CRASH</h2>
      <p style="color:#777;margin-top:8px;">
        Virtual credits only
      </p>
    </div>

    <div class="nova-game-panel">

      <div class="nova-crash-display">

        <div
          class="nova-multiplier"
          id="crash-multiplier"
        >
          1.00x
        </div>

        <div
          class="nova-crash-status"
          id="crash-status"
        >
          Place a virtual bet to start.
        </div>

      </div>

      <div class="nova-bet-row">

        <button onclick="changeCrashBet(-50)">
          −50
        </button>

        <button onclick="changeCrashBet(-10)">
          −10
        </button>

        <input
          id="crash-bet"
          class="nova-bet-input"
          type="number"
          min="10"
          max="1000"
          step="10"
          value="${state.crash.bet}"
        >

        <button onclick="changeCrashBet(10)">
          +10
        </button>

        <button onclick="changeCrashBet(50)">
          +50
        </button>

      </div>

      <div class="nova-bet-row">

        <button
          class="nova-primary"
          id="crash-action"
          onclick="startCrashGame()"
        >
          START
        </button>

      </div>

      <div style="
        text-align:center;
        margin-top:18px;
        color:#666;
        font-size:12px;
      ">
        Balance:
        <strong
          style="color:#d4af37;"
          id="crash-balance"
        >
          ${formatCredits(state.balance)}
        </strong>
      </div>

    </div>
  `;

  openModal(content);
}


function getCrashBet() {

  const input =
    $("#crash-bet");

  if (!input) {
    return state.crash.bet;
  }

  let bet =
    Number(input.value);

  if (!Number.isFinite(bet)) {
    bet = 100;
  }

  bet =
    Math.floor(bet / 10) * 10;

  bet =
    Math.max(
      NOVA_CONFIG.crash.minimumBet,
      bet
    );

  bet =
    Math.min(
      NOVA_CONFIG.crash.maximumBet,
      bet
    );

  return bet;
}


function changeCrashBet(amount) {

  const input =
    $("#crash-bet");

  if (!input) {
    return;
  }

  let value =
    Number(input.value);

  if (!Number.isFinite(value)) {
    value = 100;
  }

  value += amount;

  value =
    Math.max(
      NOVA_CONFIG.crash.minimumBet,
      value
    );

  value =
    Math.min(
      NOVA_CONFIG.crash.maximumBet,
      value
    );

  input.value =
    value;
}


function generateCrashPoint() {

  const random =
    Math.random();

  if (random < 0.03) {
    return 1.01;
  }

  const value =
    1 / (1 - random);

  return Math.min(
    NOVA_CONFIG.crash.maximumDemoMultiplier,
    Math.max(
      1.01,
      value
    )
  );
}


function startCrashGame() {

  if (state.crash.running) {
    cashOutCrash();
    return;
  }

  const bet =
    getCrashBet();

  if (bet > state.balance) {

    showNotification(
      "Not enough virtual credits.",
      "error"
    );

    return;
  }

  if (!removeCredits(bet)) {
    return;
  }

  state.crash.running =
    true;

  state.crash.crashed =
    false;

  state.crash.multiplier =
    1.00;

  state.crash.currentBet =
    bet;

  state.crash.crashPoint =
    generateCrashPoint();

  const multiplier =
    $("#crash-multiplier");

  const status =
    $("#crash-status");

  const button =
    $("#crash-action");

  if (button) {
    button.textContent =
      "CASH OUT";
  }

  if (status) {
    status.textContent =
      "Multiplier is rising...";
  }

  let startTime =
    Date.now();

  state.crash.interval =
    setInterval(() => {

      const elapsed =
        (Date.now() - startTime) /
        1000;

      state.crash.multiplier =
        1 +
        Math.pow(
          elapsed,
          1.35
        ) *
        0.35;

      if (multiplier) {
        multiplier.textContent =
          state.crash.multiplier.toFixed(2) +
          "x";
      }

      if (
        state.crash.multiplier >=
        state.crash.crashPoint
      ) {

        crashGame();

      }

    }, 50);
}


function cashOutCrash() {

  if (!state.crash.running) {
    return;
  }

  const multiplier =
    state.crash.multiplier;

  const bet =
    state.crash.currentBet;

  const payout =
    Math.floor(
      bet * multiplier
    );

  stopCrashGame();

  addCredits(payout);

  const multiplierElement =
    $("#crash-multiplier");

  const status =
    $("#crash-status");

  const button =
    $("#crash-action");

  if (multiplierElement) {
    multiplierElement.textContent =
      multiplier.toFixed(2) +
      "x";
  }

  if (status) {
    status.textContent =
      `Cashed out for ${formatCredits(payout)} credits!`;
  }

  if (button) {
    button.textContent =
      "START";
  }

  showNotification(
    `Cash out: ${formatCredits(payout)} credits`,
    "success"
  );

  addHistory(
    "Crash",
    payout,
    "win"
  );

  updateBalance();

  const localBalance =
    $("#crash-balance");

  if (localBalance) {
    localBalance.textContent =
      formatCredits(state.balance);
  }
}


function crashGame() {

  if (!state.crash.running) {
    return;
  }

  const point =
    state.crash.crashPoint;

  stopCrashGame();

  state.crash.crashed =
    true;

  const multiplier =
    $("#crash-multiplier");

  const status =
    $("#crash-status");

  const button =
    $("#crash-action");

  if (multiplier) {
    multiplier.textContent =
      point.toFixed(2) +
      "x";
  }

  if (status) {
    status.textContent =
      `💥 CRASHED at ${point.toFixed(2)}x`;
  }

  if (button) {
    button.textContent =
      "START";
  }

  addHistory(
    "Crash",
    -state.crash.currentBet,
    "loss"
  );

  showNotification(
    `Crash at ${point.toFixed(2)}x`,
    "error"
  );

  updateBalance();

  const localBalance =
    $("#crash-balance");

  if (localBalance) {
    localBalance.textContent =
      formatCredits(state.balance);
  }
}


function stopCrashGame() {

  if (state.crash.interval) {

    clearInterval(
      state.crash.interval
    );

    state.crash.interval =
      null;
  }

  state.crash.running =
    false;
}


/* =========================================================
   ROULETTE
   ========================================================= */

function openRoulette() {

  const content = `
    <div class="nova-game-title">
      <small>NOVA ORIGINAL</small>
      <h2>🎡 NOVA ROULETTE</h2>
      <p style="color:#777;margin-top:8px;">
        Virtual credits only
      </p>
    </div>

    <div class="nova-game-panel">

      <div
        class="nova-roulette-wheel"
        id="roulette-wheel"
      >
        <div class="nova-wheel-center">
          NOVA
        </div>
      </div>

      <div
        id="roulette-result"
        class="nova-result"
      >
        Select a virtual bet.
      </div>

      <div class="nova-choice-grid">

        <button
          class="nova-choice"
          onclick="selectRoulette('red')"
          id="roulette-red"
        >
          🔴 RED
        </button>

        <button
          class="nova-choice"
          onclick="selectRoulette('black')"
          id="roulette-black"
        >
          ⚫ BLACK
        </button>

        <button
          class="nova-choice"
          onclick="selectRoulette('even')"
          id="roulette-even"
        >
          EVEN
        </button>

        <button
          class="nova-choice"
          onclick="selectRoulette('odd')"
          id="roulette-odd"
        >
          ODD
        </button>

      </div>

      <div class="nova-bet-row">

        <button onclick="changeRouletteBet(-50)">
          −50
        </button>

        <button onclick="changeRouletteBet(-10)">
          −10
        </button>

        <input
          id="roulette-bet"
          class="nova-bet-input"
          type="number"
          min="10"
          max="1000"
          step="10"
          value="${state.roulette.bet}"
        >

        <button onclick="changeRouletteBet(10)">
          +10
        </button>

        <button onclick="changeRouletteBet(50)">
          +50
        </button>

      </div>

      <div class="nova-bet-row">

        <button
          class="nova-primary"
          onclick="spinRoulette()"
          id="roulette-spin"
        >
          SPIN
        </button>

      </div>

      <div style="
        text-align:center;
        margin-top:18px;
        color:#666;
        font-size:12px;
      ">
        Balance:
        <strong
          style="color:#d4af37;"
          id="roulette-balance"
        >
          ${formatCredits(state.balance)}
        </strong>
      </div>

    </div>
  `;

  openModal(content);
}


function getRouletteBet() {

  const input =
    $("#roulette-bet");

  if (!input) {
    return state.roulette.bet;
  }

  let bet =
    Number(input.value);

  if (!Number.isFinite(bet)) {
    bet = 100;
  }

  bet =
    Math.floor(bet / 10) * 10;

  bet =
    Math.max(
      NOVA_CONFIG.roulette.minimumBet,
      bet
    );

  bet =
    Math.min(
      NOVA_CONFIG.roulette.maximumBet,
      bet
    );

  return bet;
}


function changeRouletteBet(amount) {

  const input =
    $("#roulette-bet");

  if (!input) {
    return;
  }

  let value =
    Number(input.value);

  if (!Number.isFinite(value)) {
    value = 100;
  }

  value += amount;

  value =
    Math.max(
      NOVA_CONFIG.roulette.minimumBet,
      value
    );

  value =
    Math.min(
      NOVA_CONFIG.roulette.maximumBet,
      value
    );

  input.value =
    value;
}


function selectRoulette(type) {

  state.roulette.selectedType =
    type;

  const choices =
    $all(".nova-choice");

  choices.forEach(choice => {
    choice.classList.remove(
      "active"
    );
  });

  const element =
    $("#roulette-" + type);

  if (element) {
    element.classList.add(
      "active"
    );
  }

  const result =
    $("#roulette-result");

  if (result) {
    result.textContent =
      `Selected: ${type.toUpperCase()}`;
  }
}


function rouletteNumber() {

  return Math.floor(
    Math.random() * 37
  );
}


function rouletteColor(number) {

  if (number === 0) {
    return "green";
  }

  const redNumbers = [
    1, 3, 5, 7, 9,
    12, 14, 16, 18,
    19, 21, 23, 25,
    27, 30, 32, 34,
    36
  ];

  return redNumbers.includes(number)
    ? "red"
    : "black";
}


function rouletteMatches(
  number,
  selection
) {

  if (selection === "red") {
    return rouletteColor(number) === "red";
  }

  if (selection === "black") {
    return rouletteColor(number) === "black";
  }

  if (selection === "even") {
    return number !== 0 &&
      number % 2 === 0;
  }

  if (selection === "odd") {
    return number !== 0 &&
      number % 2 !== 0;
  }

  return false;
}


function roulettePayout(
  selection,
  bet
) {

  if (
    selection === "red" ||
    selection === "black"
  ) {
    return bet * 2;
  }

  if (
    selection === "even" ||
    selection === "odd"
  ) {
    return bet * 2;
  }

  return 0;
}


function spinRoulette() {

  if (state.roulette.spinning) {
    return;
  }

  if (!state.roulette.selectedType) {

    showNotification(
      "Select RED, BLACK, EVEN or ODD first.",
      "error"
    );

    return;
  }

  const bet =
    getRouletteBet();

  state.roulette.bet =
    bet;

  if (bet > state.balance) {

    showNotification(
      "Not enough virtual credits.",
      "error"
    );

    return;
  }

  if (!removeCredits(bet)) {
    return;
  }

  state.roulette.spinning =
    true;

  const button =
    $("#roulette-spin");

  if (button) {
    button.disabled = true;
    button.textContent =
      "SPINNING...";
  }

  const number =
    rouletteNumber();

  const color =
    rouletteColor(number);

  const wheel =
    $("#roulette-wheel");

  if (wheel) {

    const rotations =
      5 + Math.floor(
        Math.random() * 4
      );

    const degrees =
      rotations * 360 +
      Math.floor(
        Math.random() * 360
      );

    wheel.style.transform =
      `rotate(${degrees}deg)`;
  }

  setTimeout(() => {

    finishRoulette(
      number,
      color,
      bet
    );

  }, 2600);
}


function finishRoulette(
  number,
  color,
  bet
) {

  state.roulette.spinning =
    false;

  const button =
    $("#roulette-spin");

  if (button) {
    button.disabled = false;
    button.textContent =
      "SPIN";
  }

  const matches =
    rouletteMatches(
      number,
      state.roulette.selectedType
    );

  const result =
    $("#roulette-result");

  if (matches) {

    const payout =
      roulettePayout(
        state.roulette.selectedType,
        bet
      );

    addCredits(payout);

    if (result) {
      result.textContent =
        `🎉 ${number} ${color.toUpperCase()} — WIN +${formatCredits(payout)} CREDITS`;
      result.classList.add(
        "nova-win"
      );
    }

    showNotification(
      `Roulette win: ${formatCredits(payout)} credits`,
      "success"
    );

    addHistory(
      "Roulette",
      payout,
      "win"
    );

  } else {

    if (result) {
      result.textContent =
        `Result: ${number} ${color.toUpperCase()} — LOSS`;
    }

    addHistory(
      "Roulette",
      -bet,
      "loss"
    );
  }

  updateBalance();

  const localBalance =
    $("#roulette-balance");

  if (localBalance) {
    localBalance.textContent =
      formatCredits(state.balance);
  }
}


/* =========================================================
   HISTORY
   ========================================================= */

function addHistory(
  game,
  amount,
  type
) {

  state.history.unshift({
    game,
    amount,
    type,
    time: new Date().toISOString()
  });

  state.history =
    state.history.slice(0, 30);

  saveState();
}


function getHistoryText() {

  if (
    !Array.isArray(state.history) ||
    state.history.length === 0
  ) {
    return `
      <p style="color:#666;text-align:center;">
        No games played yet.
      </p>
    `;
  }

  return state.history
    .map(item => {

      const sign =
        item.amount >= 0
          ? "+"
          : "";

      const color =
        item.amount >= 0
          ? "#d4af37"
          : "#e50914";

      const date =
        new Date(
          item.time
        ).toLocaleTimeString();

      return `
        <div class="nova-history-item">

          <span>
            ${item.game}
          </span>

          <span style="color:${color};">
            ${sign}${formatCredits(item.amount)}
          </span>

          <span>
            ${date}
          </span>

        </div>
      `;

    })
    .join("");
}


/* =========================================================
   RESET DEMO
   ========================================================= */

function resetDemo() {

  const confirmed =
    window.confirm(
      "Reset your demo balance to 10,000 credits?"
    );

  if (!confirmed) {
    return;
  }

  stopCrashGame();

  state.balance =
    NOVA_CONFIG.startingBalance;

  state.history = [];

  state.slots.lastWin =
    0;

  state.slots.bet =
    100;

  state.crash.bet =
    100;

  state.roulette.bet =
    100;

  saveState();

  updateBalance();

  showNotification(
    "Demo account reset.",
    "success"
  );
}


/* =========================================================
   DEMO RESET BUTTON
   ========================================================= */

function createResetButton() {

  if ($("#nova-reset-demo")) {
    return;
  }

  const button =
    document.createElement("button");

  button.id =
    "nova-reset-demo";

  button.textContent =
    "Reset Demo";

  button.style.position =
    "fixed";

  button.style.bottom =
    "18px";

  button.style.left =
    "18px";

  button.style.zIndex =
    "9000";

  button.style.padding =
    "9px 14px";

  button.style.border =
    "1px solid #333";

  button.style.borderRadius =
    "7px";

  button.style.background =
    "#0d0d0d";

  button.style.color =
    "#777";

  button.style.fontSize =
    "11px";

  button.style.cursor =
    "pointer";

  button.addEventListener(
    "click",
    resetDemo
  );

  document.body.appendChild(
    button
  );
}


/* =========================================================
   KEYBOARD CONTROLS
   ========================================================= */

function setupKeyboard() {

  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {
        closeGame();
      }

      if (
        event.key === "Enter" &&
        state.currentGame === "slots" &&
        !state.slots.spinning
      ) {
        const button =
          $("#slots-spin");

        if (button) {
          button.click();
        }
      }

    }
  );
}


/* =========================================================
   SAFE NUMBER UTILITIES
   ========================================================= */

function clamp(
  value,
  minimum,
  maximum
) {

  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );
}


/* =========================================================
   BUTTON PROTECTION
   ========================================================= */

function preventDoubleClicks() {

  document.addEventListener(
    "click",
    event => {

      const target =
        event.target;

      if (
        target.tagName === "BUTTON" &&
        target.dataset.locked === "true"
      ) {
        event.preventDefault();
      }

    }
  );
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initializeNova() {

  loadState();

  updateBalance();

  createResetButton();

  setupKeyboard();

  preventDoubleClicks();

  console.log(
    "NOVA Casino Demo initialized successfully."
  );

  console.log(
    "Virtual balance:",
    state.balance
  );
}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.NovaCasino = {
  state,
  openGame,
  closeGame,
  spinSlots,
  startCrashGame,
  cashOutCrash,
  spinRoulette,
  selectRoulette,
  resetDemo,
  addCredits,
  removeCredits
};


/* =========================================================
   START APPLICATION
   ========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeNova
  );

} else {

  initializeNova();

    }
