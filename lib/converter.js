const fs = require("fs");

const FILE = "./countries.json"; // your array JSON (Afghanistan, etc.)
const arr = JSON.parse(fs.readFileSync(FILE, "utf8"));

const byId = {};

arr.forEach((item) => {
  const id = item["country-code"];   // e.g. "004"
  const iso2 = item["alpha-2"];      // e.g. "AF"
  const name = item["name"];         // e.g. "Afghanistan"

  if (!id || !iso2) return;

  byId[id] = { iso2, name };
});

fs.writeFileSync("./country-map.json", JSON.stringify(byId, null, 2));

console.log("✓ country-map.json generated!");
