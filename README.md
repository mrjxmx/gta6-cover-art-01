# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/mrjxmx/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/mrjxmx/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Neon Panels** is a cover art studio: it turns your own photos and a caption into GTA-style multi-panel poster art, exported as a PNG to share. Your photos are read on your own machine and never uploaded — the app is plain static files under `app/` and works fully offline.

- **Panel templates** — Poster Grid (five panels with a tall hero), Triptych, Split Duo and Full Hero, all in the white-gutter poster frame.
- **Your photos, your framing** — load photos by file picker or drag-and-drop, place a different photo in each panel or spread one photo unbroken across all of them, then drag to pan and scroll or slide to zoom each panel's crop.
- **Colour grades** — Vice Sunset, Neon Night, Noir and Golden Hour, each a photo filter plus painted light washes and a per-panel vignette.
- **Poster lettering** — a stacked multi-line caption in heavy capitals with a thick outline, a gradient fill (Sunset, Ice, Neon, Gold or White) and a drop shadow, plus a letterspaced tagline, at the top or bottom of the cover.
- **Exports** — one click to a PNG at 1920 × 1080, 1080 × 1080 or 1080 × 1350; the preview canvas is kept at the export size, so what you see is the PNG you get.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 for the studio

mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# hands the entry in: copies app/ and screenshots/ to out/ and writes out/dossier.json
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=fj3hte3r&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
