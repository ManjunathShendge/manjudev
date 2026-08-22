/**
 * Refreshes the project screenshots in public/projects.
 *
 *   node scripts/capture-shots.mjs
 *
 * Uses the Edge/Chrome already installed on your machine via playwright-core,
 * so there is no browser download. Install the driver once:
 *
 *   npm i -D playwright-core
 *
 * Each page is walked top to bottom before the shot is taken, so lazy images
 * and scroll-reveal animations have fired. Pages that return an error are
 * skipped rather than saved — a screenshot of a 500 is worse than no shot.
 *
 * Projects with no public URL (Gym Class Booking, Task Manager) are not listed
 * here; drop their images into public/projects/ by hand.
 */
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const OUT = new URL('../public/projects', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
mkdirSync(OUT, { recursive: true })

/** file name -> page and the scroll depth (0–1) to capture at */
const SHOTS = [
  { file: 'tripnexus-1', url: 'https://tripnexus.netlify.app', at: 0 },
  { file: 'tripnexus-2', url: 'https://tripnexus.netlify.app', at: 0.28 },
  { file: 'tripnexus-3', url: 'https://tripnexus.netlify.app', at: 0.55 },
  { file: 'orelp-1', url: 'https://orelp.com/', at: 0.02 },
  { file: 'orelp-2', url: 'https://orelp.com/', at: 0.16 },
  { file: 'orelp-3', url: 'https://orelp.com/', at: 0.3 },
  { file: 'syniaa', url: 'https://syniaa.netlify.app/', at: 0 },
  { file: 'dpsfloral', url: 'https://dpsfloralflowers.netlify.app/', at: 0 },
  { file: 'nxdigi', url: 'https://nxdigi.netlify.app/', at: 0 },
  { file: 'jsonbuilder', url: 'https://custome-json-builder.netlify.app/', at: 0 },
]

const browser = await chromium.launch({ channel: 'msedge', headless: true })

for (const shot of SHOTS) {
  let saved = false
  for (let attempt = 1; attempt <= 2 && !saved; attempt++) {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1.5,
    })
    try {
      await page.goto(shot.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.waitForTimeout(5000)

      const text = await page.evaluate(() => document.body.innerText.slice(0, 120))
      if (/couldn.t load|server error|404|not found/i.test(text)) {
        throw new Error('error page returned')
      }

      // walk the page so lazy content loads
      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      for (let y = 0; y < height; y += 500) {
        await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y)
        await page.waitForTimeout(320)
      }

      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(height * shot.at))
      await page.waitForTimeout(2600)
      await page.screenshot({ path: `${OUT}/${shot.file}.jpg`, type: 'jpeg', quality: 82 })
      console.log(`✓ ${shot.file}`)
      saved = true
    } catch (e) {
      console.log(`✗ ${shot.file} (attempt ${attempt}): ${e.message.split('\n')[0]}`)
    }
    await page.close()
  }
}

await browser.close()
