const STATUS_CONFIG = {
  old: {
    label: 'Old',
    node: 44,
    growth: 4,
    badge: 'bg-people-status-old',
    ring: 'ring-people-status-old',
    text: 'text-[6px]',
    badgePadding: '!px-[6px]',
  },
  new: {
    label: 'New',
    node: 58,
    growth: 8,
    badge: 'bg-people-status-new',
    ring: 'ring-people-status-new',
    text: 'text-[8px]',
    badgePadding: '!px-[8px]',
  },
  normal: {
    label: 'Normal',
    node: 58,
    growth: 8,
    badge: 'bg-people-status-normal',
    ring: 'ring-people-status-normal',
    text: 'text-[7px]',
    badgePadding: '!px-[8px]',
  },
  best: {
    label: 'Best',
    node: 72,
    growth: 10,
    badge: 'bg-people-status-best',
    ring: 'ring-people-status-best',
    text: 'text-[10px]',
    badgePadding: '!px-[10px]',
  },
}

function normalizeStatus(status) {
  const normalized = String(status || 'normal').toLowerCase()
  if (normalized === 'best' || normalized === 'new' || normalized === 'old') return normalized
  return 'normal'
}

function getPersonCount(person) {
  return Number(person.count ?? person.meeting_count ?? person.visit_count ?? 0) || 0
}

function getNodeSize(person, config) {
  const growth = Math.min(getPersonCount(person), 12) * (config.growth / 12)
  return Math.round(config.node + growth)
}

function DefaultAvatar({ size }) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full bg-primary-light text-primary"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.22" />
        <path d="M4.5 20C4.5 16.4 7.85 13.8 12 13.8C16.15 13.8 19.5 16.4 19.5 20" fill="currentColor" opacity="0.22" />
        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5 20C5 16.7 8.1 14.4 12 14.4C15.9 14.4 19 16.7 19 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export default function PersonNode({
  person,
  x,
  y,
  onClick,
  onDoubleClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  suppressClickRef,
  isConnecting,
  isDragging,
  isSelected,
}) {
  const status = normalizeStatus(person.status)
  const config = STATUS_CONFIG[status]
  const nodeSize = getNodeSize(person, config)
  const outerSize = nodeSize + 12
  const image = person.photo_url ?? person.photoUrl ?? null

  const handleClick = () => {
    if (suppressClickRef?.current) return
    onClick?.(person)
  }

  const handleDoubleClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onDoubleClick?.(person)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 touch-none flex-col items-center ${isDragging ? 'z-20 cursor-grabbing' : 'z-10 cursor-pointer'}`}
      style={{ left: x, top: y, width: Math.max(86, outerSize + 28) }}
      aria-label={person.name}
    >
      <span className="!mb-1 max-w-full truncate rounded-full bg-white/80 !px-2 text-center text-[10px] font-medium leading-4 text-text-main shadow-sm">
        {person.name}
      </span>
      <span className="relative flex flex-col items-center">
        <span
          className={`flex items-center justify-center rounded-full shadow-md ring-2 ${config.ring} ${
            isConnecting || isSelected ? config.badge : 'bg-white'
          }`}
          style={{ width: outerSize, height: outerSize }}
        >
          <span
            className="block overflow-hidden rounded-full bg-primary-light"
            style={{ width: nodeSize, height: nodeSize }}
          >
            {image ? (
              <img src={image} alt={person.name} className="h-full w-full object-cover" draggable="false" />
            ) : (
              <DefaultAvatar size={nodeSize} />
            )}
          </span>
        </span>
        <span
          className={`-mt-3 rounded-full !py-[1px] text-center font-bold leading-4 text-white ${config.badge} ${config.badgePadding} ${config.text}`}
        >
          {config.label}
        </span>
      </span>
    </button>
  )
}
