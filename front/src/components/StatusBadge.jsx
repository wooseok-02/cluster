const STATUS_STYLES = {
  new: 'bg-[#4C6FFF] text-white',
  best: 'bg-[#FF4B8B] text-white',
  old: 'bg-[#9CA3AF] text-white',
}

const STATUS_LABELS = {
  new: 'New',
  best: 'Best',
  old: 'Old',
}

export default function StatusBadge({ status, className = '' }) {
  if (!status || !STATUS_STYLES[status]) return null
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export function StatusDot({ status, size = 10 }) {
  const colors = {
    new: '#4C6FFF',
    best: '#FF4B8B',
    old: '#9CA3AF',
  }
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: colors[status] ?? '#9CA3AF',
      }}
    />
  )
}
