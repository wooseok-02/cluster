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

function InitialAvatar({ name, size }) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-white font-bold text-text-main"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {name?.[0] || '?'}
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
}) {
  const status = normalizeStatus(person.status)
  const config = STATUS_CONFIG[status]
  const nodeSize = getNodeSize(person, config)
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
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 touch-none flex-col items-center gap-1 ${isDragging ? 'z-20 cursor-grabbing' : 'z-10 cursor-pointer'}`}
      style={{ left: x, top: y, width: Math.max(78, nodeSize + 24) }}
      aria-label={person.name}
    >
      <span className="relative flex flex-col items-center">
        <span
          className={`block overflow-hidden rounded-full bg-white shadow-md ring-2 ${config.ring} ${isConnecting ? 'ring-4' : ''}`}
          style={{ width: nodeSize, height: nodeSize }}
        >
          {image ? (
            <img src={image} alt={person.name} className="h-full w-full object-cover" draggable="false" />
          ) : (
            <InitialAvatar name={person.name} size={nodeSize} />
          )}
        </span>
        <span
          className={`-mt-3 rounded-full !py-[1px] text-center font-bold leading-4 text-white ${config.badge} ${config.badgePadding} ${config.text}`}
        >
          {config.label}
        </span>
      </span>
      <span className="max-w-full truncate text-center text-[10px] font-medium leading-4 text-text-main">
        {person.name}
      </span>
    </button>
  )
}
