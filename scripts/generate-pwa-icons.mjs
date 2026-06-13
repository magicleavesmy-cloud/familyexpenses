import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

const crc32 = (buffers) => {
  let crc = 0xffffffff
  buffers.forEach((buffer) => {
    for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  })
  return (crc ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  const crc = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  crc.writeUInt32BE(crc32([typeBuffer, data]))
  return Buffer.concat([length, typeBuffer, data, crc])
}

const isRoundedRect = (x, y, size, radius) => {
  const dx = x < radius ? radius - x : x > size - radius ? x - (size - radius) : 0
  const dy = y < radius ? radius - y : y > size - radius ? y - (size - radius) : 0
  return dx * dx + dy * dy <= radius * radius
}

const makeIcon = (size, output) => {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  const radius = size * 0.22
  const center = size / 2

  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x += 1) {
      const i = row + 1 + x * 4
      const inShape = isRoundedRect(x, y, size - 1, radius)
      if (!inShape) {
        raw[i + 3] = 0
        continue
      }

      const gradient = y / size
      raw[i] = Math.round(255 - gradient * 20)
      raw[i + 1] = Math.round(140 - gradient * 40)
      raw[i + 2] = Math.round(42 - gradient * 24)
      raw[i + 3] = 255

      const dx = x - center
      const dy = y - center
      const circle = Math.sqrt(dx * dx + dy * dy)
      if (circle < size * 0.29) {
        raw[i] = 255
        raw[i + 1] = 248
        raw[i + 2] = 240
      }

      const bolt =
        x > size * 0.45 && x < size * 0.6 && y > size * 0.26 && y < size * 0.49 ||
        x > size * 0.36 && x < size * 0.56 && y > size * 0.45 && y < size * 0.58 ||
        x > size * 0.42 && x < size * 0.54 && y > size * 0.56 && y < size * 0.76

      if (bolt) {
        raw[i] = 255
        raw[i + 1] = 122
        raw[i + 2] = 26
      }
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])

  writeFileSync(output, png)
}

makeIcon(180, 'public/apple-touch-icon.png')
makeIcon(192, 'public/pwa-192.png')
makeIcon(512, 'public/pwa-512.png')
