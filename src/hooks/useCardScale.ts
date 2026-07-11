import { useState, useEffect } from 'react'

/**
 * Returns a CSS transform scale factor for game cards.
 *
 * Scales to fit both width AND height on mobile,
 * ensuring cards never dominate the screen and leave
 * room for buttons, navigation, and game info.
 *
 * @param cardWidth The card's natural pixel width
 * @param cardHeight Optional card height for height-based scaling
 */
export function useCardScale(cardWidth: number, cardHeight?: number): number {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      if (vw <= 480) {
        // Phone: scale to fit width with padding
        const availW = vw - 48
        const widthScale = availW < cardWidth ? availW / cardWidth : 1
        // Also scale to fit height — leave room for nav, player chip, buttons, counter, gaps
        let heightScale = 1
        if (cardHeight) {
          const availH = vh - 340 // generous: nav + chip + buttons + counter + gaps + padding
          heightScale = availH < cardHeight ? availH / cardHeight : 1
        }
        setScale(Math.min(widthScale, heightScale))
      } else if (vw <= 768) {
        const availW = vw - 40
        const widthScale = availW < cardWidth ? availW / cardWidth : 1
        let heightScale = 1
        if (cardHeight) {
          const availH = vh - 260
          heightScale = availH < cardHeight ? availH / cardHeight : 1
        }
        setScale(Math.min(widthScale, heightScale))
      } else {
        setScale(1)
      }
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [cardWidth, cardHeight])

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
  const scale = useCardScale(width, height)

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
