const STATUS_CONFIG = {
  old: {
    label: 'Old',
    node: 48,
    badge: 'bg-people-status-old',
    ring: 'ring-people-status-old',
    text: 'text-[6px]',
    badgePadding: '!px-[6px]',
  },
  new: {
    label: 'New',
    node: 60,
    badge: 'bg-people-status-new',
    ring: 'ring-people-status-new',
    text: 'text-[8px]',
    badgePadding: '!px-[8px]',
  },
  normal: {
    label: 'Normal',
    node: 60,
    badge: 'bg-people-status-normal',
    ring: 'ring-people-status-normal',
    text: 'text-[7px]',
    badgePadding: '!px-[8px]',
  },
  best: {
    label: 'Best',
    node: 72,
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

export default function PersonNode({ person, x, y, onClick, suppressClickRef }) {
  const status = normalizeStatus(person.status)
  const config = STATUS_CONFIG[status]
  const image = person.photo_url ?? person.photoUrl ?? null

  const handleClick = () => {
    if (suppressClickRef?.current) return
    onClick?.(person)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
      style={{ left: x, top: y, width: Math.max(72, config.node + 20) }}
      aria-label={person.name}
    >
      <span className="relative flex flex-col items-center">
        <span
          className={`block overflow-hidden rounded-full bg-white shadow-md ring-2 ${config.ring}`}
          style={{ width: config.node, height: config.node }}
        >
          {image ? (
            <img src={image} alt={person.name} className="h-full w-full object-cover" draggable="false" />
          ) : (
            <InitialAvatar name={person.name} size={config.node} />
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
