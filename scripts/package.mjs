#!/usr/bin/env node
// Build a store zip of the extension only.
// Usage: node scripts/package.mjs
// Output: dist/twitch-auto-claimer-<version>.zip
// The zip root is the extension (manifest.json at the top). Docs, scripts,
// store-assets, and git metadata are left out.

import { createWriteStream, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync, crc32 } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const version = manifest.version;
if (!version || typeof version !== "string") {
  console.error("manifest.json has no version");
  process.exit(1);
}

const files = [];

function addFile(absPath) {
  const name = relative(root, absPath).split(sep).join("/");
  files.push({ name, data: readFileSync(absPath) });
}

function addTree(dirName) {
  const abs = join(root, dirName);
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      const info = statSync(path);
      if (info.isDirectory()) walk(path);
      else if (info.isFile()) addFile(path);
    }
  };
  walk(abs);
}

addFile(join(root, "manifest.json"));
for (const entry of readdirSync(root)) {
  const path = join(root, entry);
  if (!statSync(path).isFile()) continue;
  if (entry.endsWith(".js") || entry.endsWith(".html")) addFile(path);
}
addTree("_locales");
addTree("icons");

files.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

const forbidden = /(\.md$)|(^\.git(\/|$))|(^scripts\/)|(^store-assets\/)|(^dist\/)/;
for (const file of files) {
  if (forbidden.test(file.name) || file.name.includes("..")) {
    console.error("Refusing to pack " + file.name);
    process.exit(1);
  }
}

const required = [
  "manifest.json",
  "background.js",
  "content.js",
  "popup.js",
  "settings.js",
  "popup.html",
  "settings.html",
  "_locales/en/messages.json",
  "_locales/zh_TW/messages.json",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
];
const names = new Set(files.map((file) => file.name));
for (const name of required) {
  if (!names.has(name)) {
    console.error("Missing " + name);
    process.exit(1);
  }
}

// Fixed DOS timestamp so the zip does not change just because the clock did.
// 2026-11-22 00:00:00 local, packed into the DOS date/time fields.
const dosTime = 0;
const dosDate = ((2026 - 1980) << 9) | (11 << 5) | 22;

function u16(n) {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(n);
  return buf;
}
function u32(n) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(n >>> 0);
  return buf;
}

const parts = [];
const central = [];
let offset = 0;

for (const file of files) {
  const name = Buffer.from(file.name, "utf8");
  const compressed = deflateRawSync(file.data);
  const crc = crc32(file.data) >>> 0;
  const local = Buffer.concat([
    u32(0x04034b50),
    u16(20),
    u16(0),
    u16(8),
    u16(dosTime),
    u16(dosDate),
    u32(crc),
    u32(compressed.length),
    u32(file.data.length),
    u16(name.length),
    u16(0),
    name,
    compressed,
  ]);
  parts.push(local);
  central.push(
    Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(8),
      u16(dosTime),
      u16(dosDate),
      u32(crc),
      u32(compressed.length),
      u32(file.data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ])
  );
  offset += local.length;
}

const centralBuf = Buffer.concat(central);
const eocd = Buffer.concat([
  u32(0x06054b50),
  u16(0),
  u16(0),
  u16(files.length),
  u16(files.length),
  u32(centralBuf.length),
  u32(offset),
  u16(0),
]);

const outDir = join(root, "dist");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `twitch-auto-claimer-${version}.zip`);
const handle = createWriteStream(outPath);
await new Promise((resolve, reject) => {
  handle.on("error", reject);
  handle.on("finish", resolve);
  handle.end(Buffer.concat([...parts, centralBuf, eocd]));
});

console.log(outPath);
for (const file of files) console.log("  " + file.name);
