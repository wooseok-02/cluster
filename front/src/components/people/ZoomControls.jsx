export default function ZoomControls({ onZoomIn, onZoomOut, onReset }) {
  return (
    <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
      <button
        type="button"
        onClick={onZoomIn}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-semibold text-primary shadow-md"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-semibold text-primary shadow-md"
        aria-label="Zoom out"
      >
        -
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-text-sub shadow-md"
        aria-label="Reset map"
      >
        1x
      </button>
    </div>
  )
}
