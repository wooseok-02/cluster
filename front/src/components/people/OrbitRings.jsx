const ORBIT_RINGS = [
  { radius: 155, opacity: 0.28, dash: '2 10' },
  { radius: 295, opacity: 0.22, dash: '3 12' },
  { radius: 430, opacity: 0.18, dash: '2 14' },
  { radius: 555, opacity: 0.14, dash: '4 16' },
]

const GUIDE_DOTS = [
  { x: 525, y: 228, color: '#bcb4ef' },
  { x: 364, y: 300, color: '#5a8dee' },
  { x: 334, y: 416, color: '#ff8bb3' },
  { x: 558, y: 416, color: '#ff8bb3' },
  { x: 612, y: 280, color: '#5a8dee' },
  { x: 625, y: 612, color: '#5a8dee' },
  { x: 215, y: 695, color: '#c7c1ec' },
  { x: 530, y: 730, color: '#c7c1ec' },
]

export default function OrbitRings({ size = 900, center = 450 }) {
  const scale = 1.24

  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="people-orbit-field" cx="50%" cy="50%" r="54%">
            <stop offset="0%" stopColor="#613FE7" stopOpacity="0.13" />
            <stop offset="44%" stopColor="#8B8BFF" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="people-orbit-stroke" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#5A8DEE" stopOpacity="0.16" />
            <stop offset="52%" stopColor="#613FE7" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#FF8BB3" stopOpacity="0.14" />
          </linearGradient>
        </defs>
        <circle cx={center} cy={center} r="640" fill="url(#people-orbit-field)" />
        {ORBIT_RINGS.map((ring) => (
          <circle
            key={ring.radius}
            cx={center}
            cy={center}
            r={ring.radius}
            fill="none"
            stroke="url(#people-orbit-stroke)"
            strokeWidth="1.4"
            strokeDasharray={ring.dash}
            strokeOpacity={ring.opacity}
          />
        ))}
      </svg>

      {GUIDE_DOTS.map((dot) => (
        <span
          key={`${dot.x}-${dot.y}`}
          className="pointer-events-none absolute h-[5px] w-[5px] rounded-full"
          style={{
            left: center + (dot.x - 450) * scale,
            top: center + (dot.y - 450) * scale,
            backgroundColor: dot.color,
            boxShadow: `0 0 14px ${dot.color}`,
          }}
        />
      ))}
    </>
  )
}
