// Builds icons.css with only the icons the site uses (both weights share codepoints).
// Run: curl -sL https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css -o regular.css && node icons.js ../.. && rm regular.css
const fs = require("fs"), path = require("path");
const dir = process.argv[2];
const css = fs.readFileSync(path.join(__dirname, "regular.css"), "utf8");
const map = {};
for (const m of css.matchAll(/\.ph\.ph-([a-z0-9-]+):before \{\s*content: "([^"]+)";/g)) map[m[1]] = m[2];
const used = new Set();
for (const f of ["index.html", "desk.js"]) {
  const src = fs.readFileSync(path.join(dir, f), "utf8");
  for (const m of src.matchAll(/\bph-([a-z0-9-]+)/g)) if (m[1] !== "fill" && m[1] !== "bold") used.add(m[1]);
}
const missing = [...used].filter(n => !map[n]);
const base = (fam, file, cls) => `@font-face{font-family:"${fam}";src:url("./${file}") format("woff2");font-weight:normal;font-style:normal;font-display:block}\n` +
  `.${cls}{font-family:"${fam}"!important;speak:never;font-style:normal;font-weight:normal;font-variant:normal;text-transform:none;line-height:1;letter-spacing:0;-webkit-font-smoothing:antialiased;display:inline-block}\n`;
let out = "/* Phosphor Icons 2.1.1 (MIT, phosphoricons.com), only the glyphs this site uses. Rebuild from the full package CSS: node vendor/phosphor/icons.js docs (needs regular.css beside it) */\n" +
  base("Phosphor", "Phosphor.woff2", "ph") + base("Phosphor-Fill", "Phosphor-Fill.woff2", "ph-fill");
for (const n of [...used].filter(n => map[n]).sort()) out += `.ph-${n}:before{content:"${map[n]}"}\n`;
fs.writeFileSync(path.join(dir, "vendor/phosphor/icons.css"), out);
console.log("icons:", used.size - missing.length, "missing:", missing.join(", ") || "none");
