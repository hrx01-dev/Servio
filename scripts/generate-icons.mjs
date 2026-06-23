// Generates Servio's favicon / app-icon / PWA assets into `public/`.
//
// The brand mark mirrors the in-app logo (src/app/components/Navbar.tsx +
// Footer.tsx): a rounded square filled with the indigo->violet brand gradient
// (#4F46E5 -> #7C3AED, the --primary/--secondary tokens in src/styles/theme.css)
// carrying a white lightning bolt (the lucide "zap" glyph).
//
// It is intentionally dependency-free — a tiny software rasterizer plus raw
// PNG/ICO encoders — so `npm run icons` can regenerate every binary asset from
// this single source of truth without pulling native image tooling into CI.
//
// Usage: npm run icons   (or: node scripts/generate-icons.mjs)

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const OUT = fileURLToPath(new URL('../public/', import.meta.url))
mkdirSync(OUT, { recursive: true })

// ── Brand design tokens ─────────────────────────────────────────────────────
const C0 = [0x4f, 0x46, 0xe5] // #4F46E5 indigo  (top-left of the gradient)
const C1 = [0x7c, 0x3a, 0xed] // #7C3AED violet  (bottom-right)
const WHITE = [255, 255, 255]

// lucide "zap" glyph, points in its native 24x24 viewBox. Already centred on
// (12,12), so it drops straight into the icon centre.
const BOLT = [
  [13, 2], [3, 14], [12, 14], [11, 22], [21, 10], [12, 10],
]
const VIEWBOX = 24

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n)

// Diagonal top-left -> bottom-right gradient (matches Tailwind `bg-gradient-to-br`).
function gradient(x, y, size) {
  const t = clamp01((x + y) / (2 * size))
  return [
    Math.round(C0[0] + (C1[0] - C0[0]) * t),
    Math.round(C0[1] + (C1[1] - C0[1]) * t),
    Math.round(C0[2] + (C1[2] - C0[2]) * t),
  ]
}

// Signed distance to a rounded square spanning [0, size]; <= 0 means inside.
function roundedBoxSDF(x, y, size, r) {
  const half = size / 2
  const px = Math.abs(x - half) - (half - r)
  const py = Math.abs(y - half) - (half - r)
  const ax = Math.max(px, 0)
  const ay = Math.max(py, 0)
  return Math.hypot(ax, ay) + Math.min(Math.max(px, py), 0) - r
}

// Even-odd point-in-polygon test.
function inPolygon(px, py, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (((yi > py) !== (yj > py)) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// Renders the mark into a straight-alpha RGBA buffer. 4x4 supersampling gives
// anti-aliased edges on both the rounded corners and the bolt.
function render(size, { rounded = false, radiusRatio = 0.22, boltScale = 0.6 } = {}) {
  const r = rounded ? radiusRatio * size : 0
  const SS = 4
  const inv = 1 / SS
  const drawn = boltScale * size
  const scale = drawn / VIEWBOX
  const offset = (size - drawn) / 2

  const rgba = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let cover = 0, sumR = 0, sumG = 0, sumB = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = x + (sx + 0.5) * inv
          const fy = y + (sy + 0.5) * inv
          if (rounded && roundedBoxSDF(fx, fy, size, r) > 0) continue // transparent corner
          const vx = (fx - offset) / scale
          const vy = (fy - offset) / scale
          const col = inPolygon(vx, vy, BOLT) ? WHITE : gradient(fx, fy, size)
          cover++
          sumR += col[0]
          sumG += col[1]
          sumB += col[2]
        }
      }
      const idx = (y * size + x) * 4
      if (cover > 0) {
        rgba[idx] = Math.round(sumR / cover)
        rgba[idx + 1] = Math.round(sumG / cover)
        rgba[idx + 2] = Math.round(sumB / cover)
        rgba[idx + 3] = Math.round((cover / (SS * SS)) * 255)
      }
    }
  }
  return rgba
}

// ── PNG encoder (8-bit RGBA, single IDAT) ───────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typed = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typed, data])), 0)
  return Buffer.concat([len, typed, data, crc])
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── ICO encoder (PNG-compressed entries) ────────────────────────────────────
function encodeICO(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(images.length, 4)
  const entries = Buffer.alloc(16 * images.length)
  let offset = header.length + entries.length
  images.forEach((img, i) => {
    const e = i * 16
    entries[e] = img.size >= 256 ? 0 : img.size // width  (0 => 256)
    entries[e + 1] = img.size >= 256 ? 0 : img.size // height
    entries[e + 2] = 0 // palette colours
    entries[e + 3] = 0 // reserved
    entries.writeUInt16LE(1, e + 4) // colour planes
    entries.writeUInt16LE(32, e + 6) // bits per pixel
    entries.writeUInt32LE(img.buf.length, e + 8)
    entries.writeUInt32LE(offset, e + 12)
    offset += img.buf.length
  })
  return Buffer.concat([header, entries, ...images.map((i) => i.buf)])
}

function svg() {
  const drawn = 0.6 * 64
  const scale = drawn / VIEWBOX
  const offset = (64 - drawn) / 2
  const path = 'M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 Z'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Servio">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#4F46E5"/>
      <stop offset="1" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="${(0.22 * 64).toFixed(2)}" fill="url(#g)"/>
  <path transform="translate(${offset.toFixed(3)} ${offset.toFixed(3)}) scale(${scale.toFixed(4)})" d="${path}" fill="#fff"/>
</svg>
`
}

// ── Emit ────────────────────────────────────────────────────────────────────
const write = (name, buf) => {
  writeFileSync(new URL(name, new URL('../public/', import.meta.url)), buf)
  console.log(`  public/${name}  (${buf.length} bytes)`)
}

console.log('Generating Servio icon assets:')

// Rounded, transparent-corner marks for browser tabs.
const ico = [16, 32, 48].map((size) => ({
  size,
  buf: encodePNG(size, render(size, { rounded: true })),
}))
write('favicon.ico', encodeICO(ico))
write('favicon.svg', Buffer.from(svg(), 'utf8'))

// Full-bleed opaque marks for installs / home screens (the OS applies masking).
write('apple-touch-icon.png', encodePNG(180, render(180)))
write('icon-192.png', encodePNG(192, render(192)))
write('icon-512.png', encodePNG(512, render(512)))
// Maskable variant: smaller bolt so it survives the adaptive-icon safe zone.
write('icon-maskable-512.png', encodePNG(512, render(512, { boltScale: 0.46 })))

console.log('Done.')
