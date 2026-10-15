import React, { useEffect, useState } from 'react'

interface ClickBurst {
  id: number
  x: number
  y: number
  isInteractive: boolean
}

let nextBurstId = 1

export function ClickBurstOverlay() {
  const [bursts, setBursts] = useState<ClickBurst[]>([])

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      // Only trigger on primary mouse click or touch
      if (e.button !== 0) return

      const target = e.target as HTMLElement | null
      const isInteractive = Boolean(
        target?.closest('button, a, label, input, [role="button"]'),
      )

      const id = nextBurstId++
      const newBurst: ClickBurst = {
        id,
        x: e.clientX,
        y: e.clientY,
        isInteractive,
      }

      setBursts((prev) => [...prev.slice(-8), newBurst])

      window.setTimeout(() => {
        setBursts((prev) => prev.filter((item) => item.id !== id))
      }, 480)
    }

    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
    >
      {bursts.map((burst) => (
        <div
          key={burst.id}
          style={{
            left: `${burst.x}px`,
            top: `${burst.y}px`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2"
        >
          {/* Expanding tactile ring */}
          <span
            className={`block rounded-full craft-click-ring ${
              burst.isInteractive
                ? 'w-9 h-9 border-[1.5px] border-emerald-500/55 bg-emerald-400/10'
                : 'w-7 h-7 border border-stone-500/35 bg-stone-400/5'
            }`}
          />

          {/* Micro Dong Son sun sparks on interactive click */}
          {burst.isInteractive &&
            [0, 60, 120, 180, 240, 300].map((deg) => (
              <span
                key={deg}
                style={
                  {
                    '--spark-angle': `${deg}deg`,
                  } as React.CSSProperties
                }
                className="craft-click-spark"
              />
            ))}
        </div>
      ))}
    </div>
  )
}
