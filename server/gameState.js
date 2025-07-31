const EventEmitter = require("events");

const LEVELS = [
  { level: 1, feedRequired: 1_000, bossHp: 300,  bossTimeSec: 30 },
  { level: 2, feedRequired: 5_000, bossHp: 1_000, bossTimeSec: 45 },
  { level: 3, feedRequired: 15_000, bossHp: 3_000, bossTimeSec: 60 },
];

class GameState extends EventEmitter {
  constructor(io) {
    super();
    this.io = io;
    this.reset();
    setInterval(() => this.tick(), 100); // broadcast 10 fps
  }

  /* ---------- public API ---------- */
  getState() {
    return {
      levelIdx: this.levelIdx,
      phase: this.phase,
      feed: this.feed,
      bossHp: this.bossHp,
      bossEnds: this.bossEnds,
      topGifters: this.topGifters,
    };
  }

  addCoins(user, coins) {
    if (this.phase === "BOSS") {
      console.log(`Feeding paused - boss battle in progress`);
      return;        // feeding paused
    }
    console.log(`Adding ${coins} coins from ${user}. Current feed: ${this.feed} -> ${this.feed + coins}`);
    this.feed += coins;
    this.topGifters[user] = (this.topGifters[user] || 0) + coins;
    this.maybeStartBoss();
  }

  bossHit(user) {
    if (this.phase !== "BOSS") return;
    this.bossHp -= 1;
    this.io.emit("fx:bossHit", { user });
    if (this.bossHp <= 0) this.bossDefeated();
  }

  /* ---------- internals ---------- */
  reset() {
    this.levelIdx = 0;
    this.phase = "FEEDING";
    this.feed = 0;
    this.bossHp = 0;
    this.bossEnds = 0;
    this.topGifters = {};
  }

  maybeStartBoss() {
    const cfg = LEVELS[this.levelIdx];
    if (this.feed >= cfg.feedRequired) {
      this.phase   = "BOSS";
      this.bossHp  = cfg.bossHp;
      this.bossEnds = Date.now() + cfg.bossTimeSec * 1000;
      this.io.emit("fx:bossStart", { level: cfg.level });
    }
  }

  bossDefeated() {
    this.io.emit("fx:bossDefeat", { level: this.levelIdx + 1 });
    this.levelIdx = Math.min(this.levelIdx + 1, LEVELS.length - 1);
    this.feed = 0;
    this.phase = "FEEDING";
  }

  tick() {
    if (this.phase === "BOSS" && Date.now() > this.bossEnds) {
      this.io.emit("fx:bossFail", { level: this.levelIdx + 1 });
      this.phase = "FEEDING";
      this.feed = 0;
    }
    this.io.emit("state:update", this.getState());
  }
}

module.exports = { GameState, LEVELS }; 