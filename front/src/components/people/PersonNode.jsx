const STATUS_CONFIG = {
  old: {
    label: '오래 안 봄',
    node: 44,
    growth: 4,
    border: 'border-people-status-old',
    color: '#8B8B8B',
  },
  new: {
    label: '새 관계',
    node: 58,
    growth: 8,
    border: 'border-people-status-new',
    color: '#F5C84B',
  },
  normal: {
    label: '보통',
    node: 58,
    growth: 8,
    border: 'border-people-status-normal',
    color: '#32B768',
  },
  best: {
    label: '가까움',
    node: 72,
    growth: 10,
    border: 'border-people-status-best',
    color: '#613FE7',
  },
}

const LINEAR_GROWTH_LIMIT = 50
const GROWTH_BASE_COUNT = 12

function normalizeStatus(status) {
  const normalized = String(status || 'normal').toLowerCase()
  if (normalized === 'best' || normalized === 'new' || normalized === 'old') return normalized
  return 'normal'
}

function getPersonCount(person) {
  return Number(person.count ?? person.meeting_count ?? person.visit_count ?? 0) || 0
}

function getRelationNameBorderClass(relation) {
  const normalized = String(relation || '').toLowerCase()
  if (normalized.includes('가족') || normalized.includes('family')) return 'border-relation-family'
  if (normalized.includes('친구') || normalized.includes('friend')) return 'border-relation-friend'
  if (normalized.includes('직장') || normalized.includes('work') || normalized.includes('company')) return 'border-relation-work'
  return 'border-relation-etc'
}

function getRelationColor(relation) {
  const normalized = String(relation || '').toLowerCase()
  if (normalized.includes('가족') || normalized.includes('family')) return '#FF8BB3'
  if (normalized.includes('친구') || normalized.includes('friend')) return '#5A8DEE'
  if (normalized.includes('직장') || normalized.includes('work') || normalized.includes('company')) return '#37B778'
  return '#9C8BFF'
}

function getNodeSize(person, config) {
  const count = Math.max(0, getPersonCount(person))
  const linearGrowth = Math.min(count, LINEAR_GROWTH_LIMIT) * (config.growth / GROWTH_BASE_COUNT)
  const logGrowth = count > LINEAR_GROWTH_LIMIT
    ? Math.log1p(count - LINEAR_GROWTH_LIMIT) * (config.growth / 4)
    : 0
  const growth = linearGrowth + logGrowth
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
  relationColor: customRelationColor,
}) {
  const status = normalizeStatus(person.status)
  const config = STATUS_CONFIG[status]
  const nodeSize = getNodeSize(person, config)
  const outerSize = nodeSize + 12
  const image = person.photo_url ?? person.photoUrl ?? null
  const nameBorderClass = getRelationNameBorderClass(person.relation)
  const relationColor = customRelationColor || getRelationColor(person.relation)
  const isActive = isConnecting || isSelected || isDragging

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
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 touch-none select-none flex-col items-center transition-transform duration-200 ${isDragging ? 'z-20 scale-105 cursor-grabbing' : 'z-10 cursor-pointer'}`}
      style={{ left: x, top: y, width: Math.max(86, outerSize + 28) }}
      aria-label={person.name}
    >
      <span className={`!mb-1 max-w-full truncate rounded-full border bg-white/75 !px-2.5 !py-[2px] text-center text-[10px] font-semibold leading-4 text-[#31275f] shadow-[0_8px_18px_rgba(47,36,108,0.10)] backdrop-blur ${nameBorderClass}`}>
        {person.name}
      </span>
      <span className="relative flex flex-col items-center">
        <span
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: outerSize + 12,
            height: outerSize + 12,
            background: `radial-gradient(circle, ${relationColor}2e 0%, ${relationColor}14 54%, transparent 72%)`,
            boxShadow: isActive
              ? `0 0 0 1px ${relationColor}66, 0 0 34px ${relationColor}8a, 0 16px 34px rgba(47, 36, 108, 0.18)`
              : '0 12px 26px rgba(47, 36, 108, 0.14)',
          }}
        >
          {isActive && (
            <span
              className="people-node-orbit absolute inset-0 rounded-full border border-dashed"
              style={{ borderColor: `${relationColor}88` }}
            />
          )}
          <span
            className={`flex items-center justify-center rounded-full border bg-white ${config.border}`}
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
        </span>
        <span
          className="people-status-orb -mt-3 rounded-full border border-white/90"
          style={{
            backgroundColor: config.color,
            boxShadow: `0 0 16px ${config.color}99, 0 8px 18px rgba(47,36,108,0.14)`,
          }}
          aria-label={config.label}
          title={config.label}
        />
      </span>
    </button>
  )
}
