import { useState, useEffect } from 'react'

/**
 * Returns a CSS transform scale factor for game cards.
 * On desktop (>480px), returns 1 (no scaling).
 * On mobile, scales down to fit within viewport - 32px padding.
 *
 * @param cardWidth The card's natural pixel width
 */
export function useCardScale(cardWidth: number): number {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const calc = () => {
      const available = window.innerWidth - 32
      setScale(available < cardWidth ? available / cardWidth : 1)
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
