const STATUS_STYLES = {
  New: 'bg-[#4C6FFF] text-white',
  Best: 'bg-[#FF4B8B] text-white',
  Old: 'bg-[#9CA3AF] text-white',
}

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] ?? 'bg-gray-200 text-gray-700'} ${className}`}
    >
      {status}
    </span>
  )
}

export function StatusDot({ status, size = 10 }) {
  const colors = {
    New: '#4C6FFF',
    Best: '#FF4B8B',
    Old: '#9CA3AF',
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
