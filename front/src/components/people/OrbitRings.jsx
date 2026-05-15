const ORBIT_RINGS = [
  { radius: 128, className: 'stroke-relation-family/70' },
  { radius: 235, className: 'stroke-relation-etc/70' },
  { radius: 335, className: 'stroke-relation-friend/65' },
  { radius: 430, className: 'stroke-gray-300/80' },
]

const GUIDE_DOTS = [
  { x: 525, y: 228, className: 'bg-gray-300' },
  { x: 364, y: 300, className: 'bg-relation-friend' },
  { x: 334, y: 416, className: 'bg-relation-family' },
  { x: 558, y: 416, className: 'bg-relation-family' },
  { x: 612, y: 280, className: 'bg-relation-friend' },
  { x: 625, y: 612, className: 'bg-relation-friend' },
  { x: 215, y: 695, className: 'bg-gray-300' },
  { x: 530, y: 730, className: 'bg-gray-300' },
]

export default function OrbitRings({ size = 900, center = 450 }) {
  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        {ORBIT_RINGS.map((ring) => (
          <circle
            key={ring.radius}
            cx={center}
            cy={center}
            r={ring.radius}
            fill="none"
            strokeWidth="1"
            strokeDasharray="3 4"
            className={ring.className}
          />
        ))}
      </svg>

      {GUIDE_DOTS.map((dot) => (
        <span
          key={`${dot.x}-${dot.y}`}
          className={`pointer-events-none absolute h-[5px] w-[5px] rounded-full ${dot.className}`}
          style={{ left: dot.x, top: dot.y }}
        />
      ))}
    </>
  )
}
