export default function ClusterLogo({ size = 64 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="cluster logo"
    >
      <path
        d="M32 8C18.745 8 8 18.745 8 32C8 45.255 18.745 56 32 56"
        stroke="#5B40E4"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M32 20C38.627 20 44 25.373 44 32C44 38.627 38.627 44 32 44"
        stroke="#5B40E4"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="50" cy="16" r="5" fill="#5B40E4" />
    </svg>
  )
}
