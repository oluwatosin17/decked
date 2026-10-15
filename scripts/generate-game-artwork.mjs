import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const sourceDirectory = path.join(root, 'public/assets/games')
const outputDirectory = path.join(sourceDirectory, 'optimized')
const artwork = [
  'answer-or-drink.png',
  'back-to-us.png',
  'charades-plum.png',
  'choose-your-side.png',
  'dateable-or-dealbreaker.png',
  'dinner-table-v2.png',
  'do-you-know-me.png',
  'finger-down.png',
  'icebreaker.png',
  'imposter.png',
  'keep-a-straight-face.png',
  'mini-mystery-dossier.png',
  'never-have-i-ever.jpg',
  'not-me-your-honour.png',
  'spicy-opener.png',
  'take-a-sip.png',
  'think-fast-orange.png',
  'truth-or-dare.png',
  'two-truths-bluff-approved.png',
  'we-just-met.png',
  'who-said-that.png',
  'whot-cover.png',
]

await mkdir(outputDirectory, { recursive: true })

for (const filename of artwork) {
  const source = path.join(sourceDirectory, filename)
  const stem = filename.replace(/\.(png|jpe?g)$/i, '')
  await Promise.all([420, 840].map(width => sharp(source)
    .resize({ width, withoutEnlargement: true })
    .avif({ quality: 82, effort: 6, chromaSubsampling: '4:4:4' })
    .toFile(path.join(outputDirectory, `${stem}-${width}.avif`))))
}

console.log(`Generated ${artwork.length * 2} responsive game artwork files.`)
