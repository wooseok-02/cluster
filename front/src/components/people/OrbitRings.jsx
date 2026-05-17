const ORBIT_RINGS = [
  { radius: 155, className: 'stroke-relation-family' },
  { radius: 295, className: 'stroke-relation-etc/90' },
  { radius: 430, className: 'stroke-relation-friend/80' },
  { radius: 555, className: 'stroke-gray-400/70' },
]

const GUIDE_DOTS = [
  { x: 525, y: 228, className: 'bg-gray-400/75' },
  { x: 364, y: 300, className: 'bg-relation-friend' },
  { x: 334, y: 416, className: 'bg-relation-family' },
  { x: 558, y: 416, className: 'bg-relation-family' },
  { x: 612, y: 280, className: 'bg-relation-friend' },
  { x: 625, y: 612, className: 'bg-relation-friend/85' },
  { x: 215, y: 695, className: 'bg-gray-400/70' },
  { x: 530, y: 730, className: 'bg-gray-400/65' },
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
        {ORBIT_RINGS.map((ring) => (
          <circle
            key={ring.radius}
            cx={center}
            cy={center}
            r={ring.radius}
            fill="none"
            strokeWidth="1.6"
            strokeDasharray="3 4"
            className={ring.className}
          />
        ))}
      </svg>

      {GUIDE_DOTS.map((dot) => (
        <span
          key={`${dot.x}-${dot.y}`}
          className={`pointer-events-none absolute h-[5px] w-[5px] rounded-full ${dot.className}`}
          style={{
            left: center + (dot.x - 450) * scale,
            top: center + (dot.y - 450) * scale,
          }}
        />
      ))}
    </>
  )
}
