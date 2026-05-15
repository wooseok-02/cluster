import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OrbitRings from './OrbitRings'
import PersonNode from './PersonNode'
import ZoomControls from './ZoomControls'

const MAP_SIZE = 900
const MAP_CENTER = MAP_SIZE / 2
const MIN_ZOOM = 0.55
const MAX_ZOOM = 1.8
const ZOOM_STEP = 0.15
const NODE_LONG_PRESS_MS = 450
const NODE_CLICK_DELAY_MS = 220
const STORAGE_KEY = 'cluster.peopleMap.layout.v1'

const FIGMA_POSITIONS = [
  { x: 650, y: 230 },
  { x: 650, y: 575 },
  { x: 170, y: 450 },
  { x: 340, y: 145 },
  { x: 780, y: 160 },
  { x: 720, y: 760 },
  { x: 185, y: 645 },
  { x: 345, y: 565 },
  { x: 420, y: 735 },
  { x: 230, y: 250 },
  { x: 760, y: 360 },
  { x: 330, y: 350 },
]

const RELATION_LEGEND = [
  { label: '가족', className: 'bg-relation-family' },
  { label: '친구', className: 'bg-relation-friend' },
  { label: '직장', className: 'bg-relation-work' },
  { label: '기타', className: 'bg-relation-etc' },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getPosition(index) {
  if (FIGMA_POSITIONS[index]) return FIGMA_POSITIONS[index]

  const extraIndex = index - FIGMA_POSITIONS.length
  const ring = 365 + (extraIndex % 3) * 45
  const angle = -Math.PI / 2 + extraIndex * 0.72

  return {
    x: MAP_CENTER + Math.cos(angle) * ring,
    y: MAP_CENTER + Math.sin(angle) * ring,
  }
}

function getInitialView(peopleCount) {
  return {
    x: peopleCount > 6 ? -255 : -215,
    y: peopleCount > 6 ? -120 : -80,
    zoom: peopleCount > 6 ? 0.88 : 0.96,
  }
}

function getPersonId(person) {
  return String(person.id)
}

function getConnectionKey(fromId, toId) {
  return `${fromId}->${toId}`
}

function loadStoredLayout() {
  if (typeof window === 'undefined') return { positions: {}, connections: [] }

  try {
    const rawLayout = window.localStorage.getItem(STORAGE_KEY)
    if (!rawLayout) return { positions: {}, connections: [] }

    const parsed = JSON.parse(rawLayout)
    return {
      positions: parsed.positions && typeof parsed.positions === 'object' ? parsed.positions : {},
      connections: Array.isArray(parsed.connections) ? parsed.connections : [],
    }
  } catch {
    return { positions: {}, connections: [] }
  }
}

function saveStoredLayout(positions, connections) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ positions, connections }))
}

function CurrentUserNode({ user, myPhotoUrl, onPhotoClick, uploading, suppressClickRef }) {
  const label = user?.nick_name || user?.email || '나'

  const handleClick = () => {
    if (suppressClickRef.current) return
    onPhotoClick()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={uploading}
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary bg-white"
      style={{ left: MAP_CENTER, top: MAP_CENTER, width: 82, height: 82 }}
      aria-label="내 프로필 사진 변경"
    >
      <span className="relative block h-[70px] w-[70px] overflow-hidden rounded-full bg-primary-light">
        {myPhotoUrl ? (
          <img src={myPhotoUrl} alt={label} className="h-full w-full object-cover" draggable="false" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
            {label[0]}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-[10px] font-semibold text-white opacity-0 transition-opacity hover:opacity-100">
          {uploading ? '업로드' : '사진'}
        </span>
      </span>
    </button>
  )
}

export default function PeopleMap({ people, currentUser, myPhotoUrl, onPhotoClick, uploading }) {
  const navigate = useNavigate()
  const viewportRef = useRef(null)
  const pointersRef = useRef(new Map())
  const dragRef = useRef(null)
  const nodeDragRef = useRef(null)
  const nodeLongPressTimerRef = useRef(null)
  const nodeClickTimerRef = useRef(null)
  const suppressClickRef = useRef(false)
  const initialView = useMemo(() => getInitialView(people.length), [people.length])
  const storedLayout = useMemo(() => loadStoredLayout(), [])
  const [view, setView] = useState(initialView)
  const [customPositions, setCustomPositions] = useState(storedLayout.positions)
  const [connections, setConnections] = useState(storedLayout.connections)
  const [connectionSourceId, setConnectionSourceId] = useState(null)
  const [draggingPersonId, setDraggingPersonId] = useState(null)

  const positionedPeople = useMemo(
    () => people.map((person, index) => {
      const id = getPersonId(person)
      return { ...person, mapPosition: customPositions[id] || getPosition(index) }
    }),
    [customPositions, people],
  )

  const positionById = useMemo(() => {
    return positionedPeople.reduce((acc, person) => {
      acc[getPersonId(person)] = person.mapPosition
      return acc
    }, {})
  }, [positionedPeople])

  useEffect(() => {
    return () => {
      window.clearTimeout(nodeLongPressTimerRef.current)
      window.clearTimeout(nodeClickTimerRef.current)
    }
  }, [])

  useEffect(() => {
    saveStoredLayout(customPositions, connections)
  }, [connections, customPositions])

  const setZoom = (nextZoom, origin = null) => {
    setView((current) => {
      const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
      if (!origin || !viewportRef.current || zoom === current.zoom) {
        return { ...current, zoom }
      }

      const rect = viewportRef.current.getBoundingClientRect()
      const originX = origin.x - rect.left
      const originY = origin.y - rect.top
      const mapX = (originX - current.x) / current.zoom
      const mapY = (originY - current.y) / current.zoom

      return {
        zoom,
        x: originX - mapX * zoom,
        y: originY - mapY * zoom,
      }
    })
  }

  const handlePointerDown = (event) => {
    if (nodeDragRef.current) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    suppressClickRef.current = false

    if (pointersRef.current.size === 1) {
      dragRef.current = { x: event.clientX, y: event.clientY, view }
      return
    }

    const points = Array.from(pointersRef.current.values())
    if (points.length === 2) {
      dragRef.current = {
        pinchDistance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
        zoom: view.zoom,
        x: view.x,
        y: view.y,
      }
    }
  }

  const handlePointerMove = (event) => {
    if (nodeDragRef.current) return
    if (!pointersRef.current.has(event.pointerId) || !dragRef.current) return

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = Array.from(pointersRef.current.values())

    if (points.length === 2 && dragRef.current.pinchDistance) {
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
      const midpoint = {
        x: (points[0].x + points[1].x) / 2,
        y: (points[0].y + points[1].y) / 2,
      }
      setZoom(dragRef.current.zoom * (distance / dragRef.current.pinchDistance), midpoint)
      suppressClickRef.current = true
      return
    }

    if (points.length === 1 && dragRef.current.view) {
      const dx = event.clientX - dragRef.current.x
      const dy = event.clientY - dragRef.current.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) suppressClickRef.current = true
      setView({
        ...dragRef.current.view,
        x: dragRef.current.view.x + dx,
        y: dragRef.current.view.y + dy,
      })
    }
  }

  const handlePointerEnd = (event) => {
    pointersRef.current.delete(event.pointerId)
    dragRef.current = null
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 0)
  }

  const handleWheel = (event) => {
    event.preventDefault()
    const direction = event.deltaY > 0 ? -1 : 1
    setZoom(view.zoom + direction * ZOOM_STEP, { x: event.clientX, y: event.clientY })
  }

  const handleReset = () => setView(initialView)

  const getMapPointFromPointer = (event) => {
    const rect = viewportRef.current.getBoundingClientRect()
    return {
      x: clamp((event.clientX - rect.left - view.x) / view.zoom, 0, MAP_SIZE),
      y: clamp((event.clientY - rect.top - view.y) / view.zoom, 0, MAP_SIZE),
    }
  }

  const handlePersonClick = (person) => {
    if (suppressClickRef.current) return
    window.clearTimeout(nodeClickTimerRef.current)

    nodeClickTimerRef.current = window.setTimeout(() => {
      if (suppressClickRef.current) return

      const personId = getPersonId(person)
      if (connectionSourceId) {
        if (connectionSourceId !== personId) {
          const nextConnection = { fromId: connectionSourceId, toId: personId }
          const nextKey = getConnectionKey(nextConnection.fromId, nextConnection.toId)
          setConnections((current) => {
            if (current.some((connection) => getConnectionKey(connection.fromId, connection.toId) === nextKey)) {
              return current
            }
            return [...current, nextConnection]
          })
        }
        setConnectionSourceId(null)
        return
      }

      navigate(`/people/${person.id}`)
    }, NODE_CLICK_DELAY_MS)
  }

  const handlePersonDoubleClick = (person) => {
    window.clearTimeout(nodeClickTimerRef.current)
    suppressClickRef.current = true
    setConnectionSourceId((current) => {
      const personId = getPersonId(person)
      return current === personId ? null : personId
    })
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 0)
  }

  const handlePersonPointerDown = (person, event) => {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    window.clearTimeout(nodeLongPressTimerRef.current)

    nodeDragRef.current = {
      pointerId: event.pointerId,
      personId: getPersonId(person),
      active: false,
    }

    nodeLongPressTimerRef.current = window.setTimeout(() => {
      if (!nodeDragRef.current || nodeDragRef.current.pointerId !== event.pointerId) return
      nodeDragRef.current.active = true
      suppressClickRef.current = true
      setDraggingPersonId(nodeDragRef.current.personId)
    }, NODE_LONG_PRESS_MS)
  }

  const handlePersonPointerMove = (event) => {
    if (!nodeDragRef.current || nodeDragRef.current.pointerId !== event.pointerId) return
    event.stopPropagation()
    if (!nodeDragRef.current.active) return

    const nextPosition = getMapPointFromPointer(event)
    setCustomPositions((current) => ({
      ...current,
      [nodeDragRef.current.personId]: nextPosition,
    }))
  }

  const handlePersonPointerUp = (event) => {
    if (!nodeDragRef.current || nodeDragRef.current.pointerId !== event.pointerId) return
    event.stopPropagation()
    window.clearTimeout(nodeLongPressTimerRef.current)

    const wasDragging = nodeDragRef.current.active
    nodeDragRef.current = null
    setDraggingPersonId(null)

    if (wasDragging) {
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
    }
  }

  return (
    <section className="relative min-h-0 flex-1 overflow-hidden bg-white" aria-label="People map">
      <div className="pointer-events-none absolute left-[30px] top-[18px] z-20 flex flex-col gap-1">
        {RELATION_LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1 text-[9px] leading-none text-text-sub">
            <span className={`h-[7px] w-[7px] rounded-full ${item.className}`} />
            {item.label}
          </span>
        ))}
      </div>

      <ZoomControls
        onZoomIn={() => setZoom(view.zoom + ZOOM_STEP)}
        onZoomOut={() => setZoom(view.zoom - ZOOM_STEP)}
        onReset={handleReset}
      />

      <div
        ref={viewportRef}
        className="h-full w-full touch-none overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onWheel={handleWheel}
      >
        <div
          className="relative h-[900px] w-[900px] origin-top-left"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
          }}
        >
          <OrbitRings size={MAP_SIZE} center={MAP_CENTER} />
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} aria-hidden="true">
            <defs>
              <marker id="people-connection-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
                <path d="M0 0L10 5L0 10Z" className="fill-primary" />
              </marker>
            </defs>
            {connections.map((connection) => {
              const from = positionById[connection.fromId]
              const to = positionById[connection.toId]
              if (!from || !to) return null
              return (
                <line
                  key={getConnectionKey(connection.fromId, connection.toId)}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className="stroke-primary"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="3 4"
                  markerEnd="url(#people-connection-arrow)"
                />
              )
            })}
          </svg>
          <CurrentUserNode
            user={currentUser}
            myPhotoUrl={myPhotoUrl}
            onPhotoClick={onPhotoClick}
            uploading={uploading}
            suppressClickRef={suppressClickRef}
          />
          {positionedPeople.map((person) => (
            <PersonNode
              key={person.id}
              person={person}
              x={person.mapPosition.x}
              y={person.mapPosition.y}
              onClick={handlePersonClick}
              onDoubleClick={handlePersonDoubleClick}
              onPointerDown={(event) => handlePersonPointerDown(person, event)}
              onPointerMove={handlePersonPointerMove}
              onPointerUp={handlePersonPointerUp}
              suppressClickRef={suppressClickRef}
              isConnecting={connectionSourceId === getPersonId(person)}
              isDragging={draggingPersonId === getPersonId(person)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
