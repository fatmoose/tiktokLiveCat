const fs = require("fs");
const path = require("path");

const rows = fs
  .readFileSync(path.join(__dirname, "data/tiktok_gifts_us_2025-06-26.csv"), "utf8")
  .trim()
  .split("\n")
  .slice(1);

const GIFT_TABLE = Object.fromEntries(
  rows.map(r => {
    const [name, coins] = r.split(",");
    return [name.trim(), Number(coins)];
  }),
);

const LIKE_COINS = 0.2;

function giftToCoins({ gift_name, gift_repeat_count = 1 }) {
  return (GIFT_TABLE[gift_name] || 0) * gift_repeat_count;
}

module.exports = { GIFT_TABLE, LIKE_COINS, giftToCoins }; 