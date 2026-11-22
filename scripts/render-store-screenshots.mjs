#!/usr/bin/env node
// Render store-assets/*.png from the real popup.html and settings.html.
// Stubs chrome.* / browser.* and fills sample claim counts. Does not modify
// the extension.
//
//   npm install puppeteer-core
//   node scripts/render-store-screenshots.mjs
//
// Chrome: set CHROME_PATH if it is not on the default Linux/macOS/Windows path.
// Optional: PUPPETEER_CORE=/absolute/path/to/puppeteer-core.js

import { createServer } from "node:http";
import { readFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "store-assets");
const channels = {
  moonlight_static: 24,
  foxden_live: 11,
  night_market: 4,
};

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
    "C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe",
  ];
  for (const candidate of candidates) {
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // try the next path
    }
  }
  throw new Error("Chrome not found. Set CHROME_PATH.");
}

async function loadPuppeteer() {
  if (process.env.PUPPETEER_CORE) {
    return import(pathToFileURL(process.env.PUPPETEER_CORE).href);
  }
  return import("puppeteer-core");
}

function startServer() {
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    let path = decodeURIComponent(url.pathname);
    if (path === "/") path = "/popup.html";
    const file = join(root, path);
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      const body = readFileSync(file);
      res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

function stubSource(lang) {
  return `(() => {
    const store = { twitchAutoClaimerChannelData: ${JSON.stringify(channels)} };
    const chromeApi = {
      storage: {
        local: {
          get(keys, cb) {
            const result = {};
            if (keys == null) Object.assign(result, store);
            else if (typeof keys === "string") result[keys] = store[keys];
            else if (Array.isArray(keys)) {
              for (const key of keys) result[key] = store[key];
            } else if (typeof keys === "object") {
              for (const key of Object.keys(keys)) {
                result[key] = store[key] === undefined ? keys[key] : store[key];
              }
            }
            if (cb) cb(result);
            return Promise.resolve(result);
          },
          set(obj, cb) {
            Object.assign(store, obj);
            if (cb) cb();
            return Promise.resolve();
          },
          remove(key, cb) {
            delete store[key];
            if (cb) cb();
            return Promise.resolve();
          },
        },
        onChanged: { addListener() {} },
      },
      runtime: {
        getURL(path) { return path; },
        sendMessage() { return Promise.resolve(); },
        onMessage: { addListener() {} },
      },
      tabs: {
        create() {},
        query(_query, cb) {
          if (cb) cb([]);
          return Promise.resolve([]);
        },
      },
    };
    globalThis.chrome = chromeApi;
    globalThis.browser = { runtime: chromeApi.runtime, tabs: chromeApi.tabs };
    localStorage.setItem("twitchAutoClaimerLang", ${JSON.stringify(lang)});
    localStorage.setItem("twitchAutoClaimerEnabled", "true");
  })();`;
}

async function framePanel(page) {
  return page.evaluate(() => {
    const panelWidth = 340;
    const viewportH = 800;
    const viewportW = 1280;
    document.documentElement.style.background = "#0d0d0f";
    document.documentElement.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.position = "absolute";
    document.body.style.left = "50%";
    document.body.style.transformOrigin = "top center";
    document.body.style.marginLeft = -panelWidth / 2 + "px";

    const height = document.body.scrollHeight;
    let zoom = Math.min((viewportW - 160) / panelWidth, (viewportH - 96) / height);
    let bounds = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      document.body.style.top = "0px";
      document.body.style.transform = "scale(" + zoom + ")";
      const header = document.querySelector(".header").getBoundingClientRect();
      const footer = document.querySelector(".footer").getBoundingClientRect();
      const visual = footer.bottom - header.top;
      const top = Math.max(24, (viewportH - visual) / 2);
      document.body.style.top = top + "px";
      const header2 = document.querySelector(".header").getBoundingClientRect();
      const footer2 = document.querySelector(".footer").getBoundingClientRect();
      bounds = {
        zoom: Math.round(zoom * 1000) / 1000,
        top: Math.round(header2.top),
        bottom: Math.round(footer2.bottom),
        left: Math.round(header2.left),
        right: Math.round(header2.right),
      };
      if (footer2.bottom <= viewportH - 16 && header2.top >= 12) break;
      zoom *= 0.96;
    }
    return bounds;
  });
}

async function shoot(browser, origin, pagePath, lang, fileName, ready) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(stubSource(lang));
  await page.goto(origin + pagePath, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForFunction(ready, { timeout: 10000 });
  await new Promise((resolve) => setTimeout(resolve, 400));
  const bounds = await framePanel(page);
  console.log(fileName, JSON.stringify(bounds));
  const file = join(outDir, fileName);
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width: 1280, height: 800 },
    type: "png",
  });
  await page.close();
  return file;
}

const puppeteer = await loadPuppeteer();
const { server, port } = await startServer();
const origin = `http://127.0.0.1:${port}`;
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chromePath(),
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars", "--lang=en-US"],
});

try {
  const iconPage = await browser.newPage();
  await iconPage.setContent(
    `<img id="i" src="${origin}/icons/icon128.png"><img id="s" src="${origin}/icons/icon16.png"><img id="m" src="${origin}/icons/icon48.png">`,
    { waitUntil: "load" }
  );
  await new Promise((resolve) => setTimeout(resolve, 200));
  const decoded = await iconPage.evaluate(() => {
    function sample(id) {
      const img = document.getElementById(id);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let nonWhite = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) nonWhite++;
      }
      return { w: img.naturalWidth, h: img.naturalHeight, nonWhite };
    }
    return { icon128: sample("i"), icon16: sample("s"), icon48: sample("m") };
  });
  console.log("icon decode", JSON.stringify(decoded));
  await iconPage.close();

  const shots = [
    ["popup.html", "en", "popup-en-1280x800.png", () => document.querySelectorAll(".channel-name").length === 3 && document.getElementById("statusText").textContent === "Active"],
    ["popup.html", "zh", "popup-zh-TW-1280x800.png", () => document.querySelectorAll(".channel-name").length === 3 && document.getElementById("statusText").textContent === "監控中"],
    ["settings.html", "en", "settings-en-1280x800.png", () => document.getElementById("aboutText").style.display !== "none" && document.querySelector(".tagline").textContent.includes("Settings")],
    ["settings.html", "zh", "settings-zh-TW-1280x800.png", () => document.getElementById("aboutTextZh").style.display !== "none" && document.getElementById("backBtn").textContent.includes("返回")],
  ];
  for (const [pagePath, lang, fileName, ready] of shots) {
    const file = await shoot(browser, origin, "/" + pagePath, lang, fileName, ready);
    console.log(file);
  }
} finally {
  await browser.close();
  server.close();
}
