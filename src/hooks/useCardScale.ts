import { useState, useEffect } from 'react'

/**
 * Returns a CSS transform scale factor for game cards.
 *
 * Mobile-first scaling:
 * - On phones (<=480px): card fits within viewport minus 48px padding,
 *   capped at 0.82 to feel comfortable (not overwhelming)
 * - On tablets (<=768px): card fits within viewport minus 40px padding
 * - On desktop (>768px): returns 1 (no scaling)
 *
 * @param cardWidth The card's natural pixel width
 */
export function useCardScale(cardWidth: number): number {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth
      if (vw <= 480) {
        // Phone: generous padding, cap scale to avoid overwhelming the screen
        const available = vw - 48
        const raw = available < cardWidth ? available / cardWidth : 1
        setScale(Math.min(raw, 0.82))
      } else if (vw <= 768) {
        // Tablet: moderate padding
        const available = vw - 40
        setScale(available < cardWidth ? available / cardWidth : 1)
      } else {
        // Desktop: no scaling
        setScale(1)
      }
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [cardWidth])

  return scale
}

/**
 * Returns inline styles for a proportionally-scaled card container.
 * Wrap your card's outermost div with these styles.
 *
 * @param width Natural card width in px
 * @param height Natural card height in px
 */
export function useScaledCard(width: number, height: number) {
  const scale = useCardScale(width)

  return {
    /** Apply to the outer wrapper to reserve the correct space */
    wrapperStyle: {
      width: `${width * scale}px`,
      height: `${height * scale}px`,
      flexShrink: 0 as const,
    },
    /** Apply to the inner card div to scale it */
    cardStyle: {
      width: `${width}px`,
      height: `${height}px`,
      transform: scale < 1 ? `scale(${scale})` : undefined,
      transformOrigin: 'top center' as const,
    },
    scale,
  }
}
