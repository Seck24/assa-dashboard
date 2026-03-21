import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/icons')
mkdirSync(outDir, { recursive: true })

const sizes = [192, 512]

for (const size of sizes) {
  const padding = Math.round(size * 0.15)
  const textSize = Math.round(size * 0.22)
  const subSize = Math.round(size * 0.09)
  const gap = Math.round(size * 0.04)

  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#00A650"/>
  <text
    x="50%" y="48%"
    font-family="Arial Black, Arial, sans-serif"
    font-size="${textSize}"
    font-weight="900"
    fill="white"
    text-anchor="middle"
    dominant-baseline="middle"
    letter-spacing="${Math.round(size * 0.015)}"
  >ASSA</text>
  <text
    x="50%" y="${48 + Math.round((textSize / size) * 60) + gap}%"
    font-family="Arial, sans-serif"
    font-size="${subSize}"
    font-weight="400"
    fill="rgba(255,255,255,0.75)"
    text-anchor="middle"
    dominant-baseline="middle"
    letter-spacing="1"
  >Dashboard</text>
</svg>`

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(outDir, `icon-${size}.png`))

  console.log(`✓ icon-${size}.png`)
}

console.log('Icons generated!')
