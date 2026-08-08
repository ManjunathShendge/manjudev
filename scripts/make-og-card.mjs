/**
 * Regenerates public/og.png — the 1200×630 card link previewers show.
 *
 *   node scripts/make-og-card.mjs
 *
 * The card is screenshotted from real HTML using the site's own typefaces and
 * palette rather than drawn by hand, so the two cannot drift apart: change a
 * brand colour in index.css, change it here, re-run, and the preview matches.
 *
 * Fonts and the logo are inlined as data URIs because the page is loaded from
 * file:// — a browser will not fetch sibling files across that origin.
 *
 * Needs the same driver as capture-shots.mjs:  npm i -D playwright-core
 */
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const path = (rel) =>
  new URL(rel, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

const b64 = (rel) => readFileSync(path(rel)).toString('base64')
const font = (pkg, file) => b64(`../node_modules/@fontsource-variable/${pkg}/files/${file}`)

const OUT = path('../public/og.png')

// Latin subsets only. The card has no Cyrillic on it.
const unbounded = font('unbounded', 'unbounded-latin-wght-normal.woff2')
const sans = font('instrument-sans', 'instrument-sans-latin-wght-normal.woff2')
const mono = font('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')
// The 512px icon rather than logo.svg: same artwork, and the SVG is a 136KB
// raster wrapper. At 78px on the card the difference is invisible.
const logo = b64('../public/web-app-manifest-512x512.png')

const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  @font-face { font-family: "Unbounded"; src: url(data:font/woff2;base64,${unbounded}) format("woff2"); font-weight: 200 900; }
  @font-face { font-family: "Instrument"; src: url(data:font/woff2;base64,${sans}) format("woff2"); font-weight: 400 700; }
  @font-face { font-family: "JB"; src: url(data:font/woff2;base64,${mono}) format("woff2"); font-weight: 100 800; }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: #08070c;          /* --background */
    color: #ece8f5;               /* --foreground */
    font-family: Instrument, sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* Gold low on the right, violet high on the left — the same light the
     Hyperspeed road throws, without shipping WebGL into a screenshot. */
  .glow {
    position: absolute; inset: 0;
    background:
      radial-gradient(760px 420px at 84% 112%, rgba(232,183,92,0.20), transparent 62%),
      radial-gradient(560px 380px at 6% -12%, rgba(124,123,255,0.13), transparent 60%);
  }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(184,174,224,0.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(184,174,224,0.055) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(720px 520px at 78% 96%, #000 10%, transparent 76%);
  }

  .frame { position: absolute; inset: 56px; border: 1px solid rgba(184,174,224,0.10); }
  /* Corner ticks — the hairline vocabulary the chapter headings use. */
  .tick { position: absolute; width: 26px; height: 26px; border: 0 solid #e8b75c; opacity: .55; }
  .tl { top: -1px; left: -1px; border-top-width: 1px; border-left-width: 1px; }
  .br { bottom: -1px; right: -1px; border-bottom-width: 1px; border-right-width: 1px; }

  .inner {
    position: absolute; inset: 56px;
    padding: 62px 66px;
    display: flex; flex-direction: column; justify-content: space-between;
  }

  .top { display: flex; align-items: center; gap: 22px; }
  .mark { width: 78px; height: 78px; border-radius: 50%; box-shadow: 0 0 0 1px rgba(232,183,92,0.30); }
  .kicker {
    font-family: JB, monospace; font-weight: 500;
    font-size: 15px; letter-spacing: .20em; text-transform: uppercase; color: #e8b75c;
  }
  .sub {
    font-family: JB, monospace; font-size: 14px; letter-spacing: .13em;
    text-transform: uppercase; color: #6c667e; margin-top: 8px;
  }

  h1 {
    font-family: Unbounded, sans-serif; font-weight: 600;
    font-size: 74px; line-height: 1.02; letter-spacing: -0.035em;
  }
  h1 em { font-style: normal; color: #e8b75c; }
  .lede { margin-top: 24px; font-size: 25px; line-height: 1.42; color: #a29cb8; max-width: 830px; }

  .rule { height: 1px; background: linear-gradient(90deg, #ffd489, #b98a33 42%, transparent); margin-bottom: 22px; }
  .foot { display: flex; align-items: center; justify-content: space-between; }
  .foot span {
    font-family: JB, monospace; font-size: 15px; letter-spacing: .16em;
    text-transform: uppercase; color: #6c667e;
  }
  .foot .live { color: #e8b75c; }
</style></head>
<body>
  <div class="glow"></div>
  <div class="grid"></div>
  <div class="frame"><i class="tick tl"></i><i class="tick br"></i></div>

  <div class="inner">
    <div class="top">
      <img class="mark" src="data:image/png;base64,${logo}" alt="" />
      <div>
        <div class="kicker">Software Engineer</div>
        <div class="sub">Bengaluru, India</div>
      </div>
    </div>

    <div>
      <h1>Manjunath P<br /><em>Shendge</em></h1>
      <p class="lede">
        React and Next.js on the surface. APIs, schemas and data pipelines underneath.
      </p>
    </div>

    <div>
      <div class="rule"></div>
      <div class="foot">
        <span>Portfolio &nbsp;·&nbsp; Case studies &nbsp;·&nbsp; Writing</span>
        <span class="live">Open to roles &amp; freelance</span>
      </div>
    </div>
  </div>
</body></html>`

const card = join(tmpdir(), 'og-card.html')
writeFileSync(card, html, 'utf8')

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
})
await page.goto('file:///' + card.replace(/\\/g, '/'))
// Without this the screenshot can land on the fallback face.
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)
await page.screenshot({ path: OUT })
await browser.close()

console.log(`og.png — 1200×630, ${(readFileSync(OUT).length / 1024).toFixed(0)}KB`)
