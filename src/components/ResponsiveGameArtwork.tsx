import type { ImgHTMLAttributes } from 'react'

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  sizes?: string
}

const optimizedPath = (src: string, width: 420 | 840) => {
  const filename = src.split('/').pop()?.replace(/\.(png|jpe?g)$/i, '')
  return filename ? `/assets/games/optimized/${filename}-${width}.avif` : ''
}

/**
 * Delivers smaller, high-quality AVIF artwork to supported browsers while
 * preserving the original image as the visual and compatibility fallback.
 */
export default function ResponsiveGameArtwork({ src, sizes = '(max-width: 768px) 50vw, 310px', ...props }: Props) {
  const canOptimize = /^\/assets\/games\/.*\.(png|jpe?g)$/i.test(src)
  if (!canOptimize) return <img src={src} sizes={sizes} {...props} />

  return <picture style={{ display: 'contents' }}>
    <source
      type="image/avif"
      srcSet={`${optimizedPath(src, 420)} 420w, ${optimizedPath(src, 840)} 840w`}
      sizes={sizes}
    />
    <img src={src} sizes={sizes} {...props} />
  </picture>
}
