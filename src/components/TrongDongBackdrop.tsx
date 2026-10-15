import React from 'react'

export function TrongDongBackdrop() {
  // Generate 14-pointed Dong Son central star polygon points
  const starRays = 14
  const outerR = 78
  const innerR = 26
  const cx = 500
  const cy = 500
  const starPoints: string[] = []
  for (let i = 0; i < starRays * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (i * Math.PI) / starRays - Math.PI / 2
    const x = (cx + r * Math.cos(angle)).toFixed(2)
    const y = (cy + r * Math.sin(angle)).toFixed(2)
    starPoints.push(`${x},${y}`)
  }

  // Generate peacock/interray triangular motifs between star rays
  const interRayPaths: string[] = []
  for (let i = 0; i < starRays; i++) {
    const a1 = ((i * 2) * Math.PI) / starRays - Math.PI / 2
    const aMid = ((i * 2 + 1) * Math.PI) / starRays - Math.PI / 2
    const a2 = ((i * 2 + 2) * Math.PI) / starRays - Math.PI / 2
    const rBase = 82
    const rTip = 42
    const x1 = (cx + rBase * Math.cos((a1 + aMid) / 2)).toFixed(2)
    const y1 = (cy + rBase * Math.sin((a1 + aMid) / 2)).toFixed(2)
    const xTip = (cx + rTip * Math.cos(aMid)).toFixed(2)
    const yTip = (cy + rTip * Math.sin(aMid)).toFixed(2)
    const x2 = (cx + rBase * Math.cos((aMid + a2) / 2)).toFixed(2)
    const y2 = (cy + rBase * Math.sin((aMid + a2) / 2)).toFixed(2)
    interRayPaths.push(`M ${x1} ${y1} L ${xTip} ${yTip} L ${x2} ${y2} Z`)
  }

  // Generate sawtooth ring helper
  const makeSawtoothPath = (rInner: number, rOuter: number, teeth: number) => {
    const pts: string[] = []
    for (let i = 0; i < teeth * 2; i++) {
      const r = i % 2 === 0 ? rInner : rOuter
      const angle = (i * Math.PI) / teeth
      const x = (cx + r * Math.cos(angle)).toFixed(2)
      const y = (cy + r * Math.sin(angle)).toFixed(2)
      pts.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`)
    }
    return pts.join(' ') + ' Z'
  }

  // Generate tangential concentric circles (Vòng tròn đồng tâm chấm giữa)
  const makeCircleRing = (radius: number, count: number, dotR: number) => {
    const items = []
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count
      const x = Number((cx + radius * Math.cos(angle)).toFixed(2))
      const y = Number((cy + radius * Math.sin(angle)).toFixed(2))
      const innerR = Number((dotR * 0.45).toFixed(2))
      items.push({ x, y, dotR, innerR })
    }
    return items
  }

  const circleRingInner = makeCircleRing(156, 36, 8)
  const circleRingOuter = makeCircleRing(348, 56, 9)
  const circleRingEdge = makeCircleRing(448, 72, 8.5)

  // Generate 12 stylized Chim Lạc (Lạc birds flying counter-clockwise)
  const lacBirdAngles = Array.from({ length: 12 }, (_, i) => i * 30)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Subtle repeating geometric Dong Son tile across entire viewport */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.045]">
        <defs>
          <pattern
            id="dong-son-tile"
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            {/* Tangential circle with center dot */}
            <circle
              cx="32"
              cy="32"
              r="10"
              fill="none"
              stroke="#5C4028"
              strokeWidth="1.2"
            />
            <circle
              cx="32"
              cy="32"
              r="4.5"
              fill="none"
              stroke="#5C4028"
              strokeWidth="1"
            />
            <circle cx="32" cy="32" r="1.5" fill="#5C4028" />
            {/* Corner diamond frets */}
            <path
              d="M 0 32 L 16 32 M 48 32 L 64 32 M 32 0 L 32 16 M 32 48 L 32 64"
              stroke="#5C4028"
              strokeWidth="0.9"
              strokeDasharray="2 2"
            />
            <polygon
              points="0,0 6,0 0,6"
              fill="#5C4028"
            />
            <polygon
              points="64,0 58,0 64,6"
              fill="#5C4028"
            />
            <polygon
              points="0,64 6,64 0,58"
              fill="#5C4028"
            />
            <polygon
              points="64,64 58,64 64,58"
              fill="#5C4028"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dong-son-tile)" />
      </svg>

      {/* Warm bronze radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(214, 185, 138, 0.14) 0%, rgba(246, 245, 240, 0.04) 52%, transparent 80%)',
        }}
      />

      {/* Central Large Trống Đồng Đông Sơn Mandala */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 1000 1000"
          className="w-[1050px] h-[1050px] sm:w-[1280px] sm:h-[1280px] max-w-none opacity-[0.095] text-[#5C4028]"
          fill="none"
          stroke="currentColor"
        >
          {/* Concentric structural rings */}
          {[
            90, 96, 118, 124, 140, 172, 178, 200, 206, 224, 314, 322, 332, 364,
            370, 396, 402, 430, 466, 472, 492,
          ].map((r) => (
            <circle
              key={r}
              cx={cx}
              cy={cy}
              r={r}
              strokeWidth={r === 90 || r === 224 || r === 314 || r === 492 ? 2.4 : 1.2}
            />
          ))}

          {/* Central 14-ray Dong Son Sun Star */}
          <polygon
            points={starPoints.join(' ')}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx={cx} cy={cy} r="10" fill="#F6F5F0" />

          {/* Inter-ray triangular feathers */}
          {interRayPaths.map((d, idx) => (
            <path key={idx} d={d} strokeWidth="1.2" fill="currentColor" fillOpacity="0.25" />
          ))}

          {/* Sawtooth Band 1 (R: 98 -> 116) */}
          <path d={makeSawtoothPath(98, 116, 64)} strokeWidth="1.2" />

          {/* Short vertical hatches Band (R: 124 -> 140) */}
          <circle
            cx={cx}
            cy={cy}
            r={132}
            strokeWidth="14"
            strokeDasharray="2.2 5.5"
          />

          {/* Tangential Concentric Circles Band 1 (R: 156) */}
          {circleRingInner.map((c, idx) => (
            <g key={idx}>
              <circle cx={c.x} cy={c.y} r={c.dotR} strokeWidth="1.3" />
              <circle cx={c.x} cy={c.y} r={c.innerR} strokeWidth="1" />
              <circle cx={c.x} cy={c.y} r={1.8} fill="currentColor" />
            </g>
          ))}

          {/* Sawtooth Band 2 (R: 180 -> 198) */}
          <path d={makeSawtoothPath(180, 198, 84)} strokeWidth="1.2" />

          {/* Diamond fret Band (R: 206 -> 224) */}
          <path d={makeSawtoothPath(207, 223, 48)} strokeWidth="1.1" />
          <path
            d={makeSawtoothPath(223, 207, 48)}
            strokeWidth="1.1"
          />

          {/* Main Chim Lạc Band (R: 228 -> 310) — 12 Stylized Flying Lạc Birds */}
          {lacBirdAngles.map((deg) => (
            <g key={deg} transform={`rotate(${deg} ${cx} ${cy})`}>
              {/* Stylized Dong Son Lạc Bird flying at top (y ~ 232) */}
              <g transform="translate(500, 232)">
                {/* Long beak & crest */}
                <path
                  d="M -38 2 L -8 2 L 6 -8 L 36 0 L 12 4"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Swept wings */}
                <path
                  d="M -4 2 L -18 -22 L 8 -14 L 2 2"
                  fill="currentColor"
                  fillOpacity="0.35"
                  strokeWidth="1.8"
                />
                <path
                  d="M -2 4 L -14 26 L 10 16 L 4 4"
                  fill="currentColor"
                  fillOpacity="0.35"
                  strokeWidth="1.8"
                />
                {/* Long tail plumes & trailing legs */}
                <path
                  d="M 6 2 L 48 -6 M 6 4 L 52 2 M 4 6 L 42 14"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                {/* Eye dot */}
                <circle cx="-10" cy="1" r="2" fill="currentColor" />
              </g>
            </g>
          ))}

          {/* Hatch Band (R: 322 -> 332) */}
          <circle
            cx={cx}
            cy={cy}
            r={327}
            strokeWidth="9"
            strokeDasharray="2.5 5"
          />

          {/* Tangential Concentric Circles Band 2 (R: 348) */}
          {circleRingOuter.map((c, idx) => (
            <g key={idx}>
              <circle cx={c.x} cy={c.y} r={c.dotR} strokeWidth="1.3" />
              <circle cx={c.x} cy={c.y} r={c.innerR} strokeWidth="1" />
              <circle cx={c.x} cy={c.y} r={1.8} fill="currentColor" />
            </g>
          ))}

          {/* Sawtooth Band 3 (R: 372 -> 394) */}
          <path d={makeSawtoothPath(372, 394, 110)} strokeWidth="1.3" />

          {/* Geometric S-meander / Hatch Band (R: 402 -> 430) */}
          <circle
            cx={cx}
            cy={cy}
            r={416}
            strokeWidth="22"
            strokeDasharray="3 7"
          />

          {/* Outer Tangential Circles Band (R: 448) */}
          {circleRingEdge.map((c, idx) => (
            <g key={idx}>
              <circle cx={c.x} cy={c.y} r={c.dotR} strokeWidth="1.3" />
              <circle cx={c.x} cy={c.y} r={1.8} fill="currentColor" />
            </g>
          ))}

          {/* Outer Edge Sawtooth Band (R: 473 -> 490) */}
          <path d={makeSawtoothPath(473, 490, 140)} strokeWidth="1.2" />
        </svg>
      </div>
    </div>
  )
}
