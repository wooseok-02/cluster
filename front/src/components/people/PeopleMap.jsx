import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OrbitRings from './OrbitRings'
import PersonNode from './PersonNode'
import ZoomControls from './ZoomControls'

const MAP_SIZE = 1600
const MAP_CENTER = MAP_SIZE / 2
const FIGMA_CENTER = 450
const POSITION_SCALE = 1.24
const MIN_ZOOM = 0.55
const MAX_ZOOM = 1.8
const ZOOM_STEP = 0.15
const NODE_LONG_PRESS_MS = 450
const NODE_CLICK_DELAY_MS = 220
const TAP_MOVE_THRESHOLD = 14
const EMPTY_DOUBLE_TAP_MS = 420
const EMPTY_DOUBLE_TAP_DISTANCE = 44
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

const DEFAULT_RELATION_SETTINGS = [
  { name: '가족', color: '#FF8BB3' },
  { name: '친구', color: '#5A8DEE' },
  { name: '직장', color: '#37B778' },
  { name: '기타', color: '#9C8BFF' },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getPosition(index) {
  if (FIGMA_POSITIONS[index]) {
    return {
      x: MAP_CENTER + (FIGMA_POSITIONS[index].x - FIGMA_CENTER) * POSITION_SCALE,
      y: MAP_CENTER + (FIGMA_POSITIONS[index].y - FIGMA_CENTER) * POSITION_SCALE,
    }
  }

  const extraIndex = index - FIGMA_POSITIONS.length
  const ring = 455 + (extraIndex % 3) * 75
  const angle = -Math.PI / 2 + extraIndex * 0.72

  return {
    x: MAP_CENTER + Math.cos(angle) * ring,
    y: MAP_CENTER + Math.sin(angle) * ring,
  }
}

function getInitialView(peopleCount) {
  return {
    x: peopleCount > 6 ? -605 : -565,
    y: peopleCount > 6 ? -545 : -500,
    zoom: peopleCount > 6 ? 0.88 : 0.96,
  }
}

function getPersonId(person) {
  return String(person.id)
}

function getRelationName(person) {
  return String(person.relation || '기타').trim() || '기타'
}

function getRelationMeta(relationName, relationSettings = DEFAULT_RELATION_SETTINGS) {
  return relationSettings.find((relation) => relation.name === relationName) || {
    name: relationName,
    color: '#9C8BFF',
  }
}

function getConnectionKey(fromId, toId) {
  return `${fromId}->${toId}`
}

function getConnectionPath(from, to) {
  const centerPull = { x: MAP_CENTER, y: MAP_CENTER }
  const controlA = {
    x: from.x + (centerPull.x - from.x) * 0.28,
    y: from.y + (centerPull.y - from.y) * 0.28,
  }
  const controlB = {
    x: to.x + (centerPull.x - to.x) * 0.28,
    y: to.y + (centerPull.y - to.y) * 0.28,
  }

  return `M ${from.x} ${from.y} C ${controlA.x} ${controlA.y}, ${controlB.x} ${controlB.y}, ${to.x} ${to.y}`
}

function getRectFromPoints(start, end) {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }
}

function isPointInRect(point, rect) {
  if (!rect) return false
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

function getClusterFields(positionedPeople, relationSettings) {
  const groups = positionedPeople.reduce((acc, person) => {
    const relationName = getRelationName(person)
    if (!acc[relationName]) acc[relationName] = []
    acc[relationName].push(person.mapPosition)
    return acc
  }, {})

  return Object.entries(groups)
    .filter(([, positions]) => positions.length >= 2)
    .map(([relationName, positions]) => {
      const relation = getRelationMeta(relationName, relationSettings)
      const xs = positions.map((position) => position.x)
      const ys = positions.map((position) => position.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      const width = Math.max(230, maxX - minX + 210)
      const height = Math.max(180, maxY - minY + 180)

      return {
        key: relationName,
        label: relation.name,
        color: relation.color,
        x: minX + (maxX - minX) / 2,
        y: minY + (maxY - minY) / 2,
        width,
        height,
      }
    })
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
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ positions, connections }))
  } catch {
    // Layout persistence is optional; interaction should keep working if storage is blocked.
  }
}

function capturePointer(target, pointerId) {
  try {
    if (!target.hasPointerCapture(pointerId)) {
      target.setPointerCapture(pointerId)
    }
  } catch {
    // Some browsers can reject pointer capture after a gesture changes target.
  }
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
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white"
      style={{
        left: MAP_CENTER,
        top: MAP_CENTER,
        width: 96,
        height: 96,
        boxShadow: '0 0 0 1px rgba(97, 63, 231, 0.24), 0 0 46px rgba(97, 63, 231, 0.24), 0 18px 42px rgba(47, 36, 108, 0.16)',
      }}
      aria-label="내 프로필 사진 변경"
    >
      <span className="pointer-events-none absolute inset-[-18px] rounded-full border border-primary/20" />
      <span className="pointer-events-none absolute inset-[-32px] rounded-full border border-dashed border-primary/15" />
      <span className="relative block h-[78px] w-[78px] overflow-hidden rounded-full bg-primary-light">
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

export default function PeopleMap({
  people,
  currentUser,
  myPhotoUrl,
  onPhotoClick,
  uploading,
  relationSettings = DEFAULT_RELATION_SETTINGS,
}) {
  const navigate = useNavigate()
  const viewportRef = useRef(null)
  const pointersRef = useRef(new Map())
  const dragRef = useRef(null)
  const nodeDragRef = useRef(null)
  const selectionDragRef = useRef(null)
  const groupDragRef = useRef(null)
  const lastEmptyTapRef = useRef(null)
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
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectionRect, setSelectionRect] = useState(null)
  const [selectedPersonIds, setSelectedPersonIds] = useState([])

  const clearSelection = () => {
    setSelectionMode(false)
    setSelectionRect(null)
    setSelectedPersonIds([])
    lastEmptyTapRef.current = null
  }

  const constrainView = (nextView) => {
    if (!viewportRef.current) return nextView

    const rect = viewportRef.current.getBoundingClientRect()
    const scaledSize = MAP_SIZE * nextView.zoom
    const bottomSafeArea = 88
    const getAxisValue = (viewportSize, currentValue) => {
      if (scaledSize <= viewportSize) return (viewportSize - scaledSize) / 2
      const padding = viewportSize * 0.75
      return clamp(currentValue, viewportSize - scaledSize - padding, padding)
    }

    return {
      ...nextView,
      x: getAxisValue(rect.width, nextView.x),
      y: getAxisValue(rect.height - bottomSafeArea, nextView.y),
    }
  }

  const positionedPeople = useMemo(
    () => people.map((person, index) => {
      const id = getPersonId(person)
      return { ...person, mapPosition: customPositions[id] || getPosition(index) }
    }),
    [customPositions, people],
  )

  const relationMetaByName = useMemo(() => {
    return relationSettings.reduce((acc, relation) => {
      acc[relation.name] = relation
      return acc
    }, {})
  }, [relationSettings])

  const clusterFields = useMemo(
    () => getClusterFields(positionedPeople, relationSettings),
    [positionedPeople, relationSettings],
  )

  const positionById = useMemo(() => {
    return positionedPeople.reduce((acc, person) => {
      acc[getPersonId(person)] = person.mapPosition
      return acc
    }, {})
  }, [positionedPeople])

  const getPeopleInRect = (rect) => {
    if (!rect || rect.width < 8 || rect.height < 8) return []
    return positionedPeople
      .filter((person) => isPointInRect(person.mapPosition, rect))
      .map((person) => getPersonId(person))
  }

  const getGroupDragState = (event, ids = selectedPersonIds) => {
    const startPoint = getMapPointFromPointer(event)
    const idsToMove = ids.filter((personId) => positionById[personId])

    return {
      pointerId: event.pointerId,
      startPoint,
      rect: selectionRect,
      positions: idsToMove.reduce((acc, personId) => {
        acc[personId] = positionById[personId]
        return acc
      }, {}),
    }
  }

  const updateGroupDrag = (event) => {
    if (!groupDragRef.current || groupDragRef.current.pointerId !== event.pointerId) return false

    const nextPoint = getMapPointFromPointer(event)
    const dx = nextPoint.x - groupDragRef.current.startPoint.x
    const dy = nextPoint.y - groupDragRef.current.startPoint.y
    const nextPositions = Object.entries(groupDragRef.current.positions).reduce((acc, [personId, position]) => {
      acc[personId] = { x: position.x + dx, y: position.y + dy }
      return acc
    }, {})

    setCustomPositions((current) => ({
      ...current,
      ...nextPositions,
    }))

    if (groupDragRef.current.rect) {
      setSelectionRect({
        ...groupDragRef.current.rect,
        x: groupDragRef.current.rect.x + dx,
        y: groupDragRef.current.rect.y + dy,
      })
    }

    suppressClickRef.current = true
    return true
  }

  useEffect(() => {
    return () => {
      window.clearTimeout(nodeLongPressTimerRef.current)
      window.clearTimeout(nodeClickTimerRef.current)
    }
  }, [])

  useEffect(() => {
    saveStoredLayout(customPositions, connections)
  }, [connections, customPositions])

  useEffect(() => {
    const handleResize = () => {
      setView((current) => constrainView(current))
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const setZoom = (nextZoom, origin = null) => {
    setView((current) => {
      const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
      if (!origin || !viewportRef.current || zoom === current.zoom) {
        return constrainView({ ...current, zoom })
      }

      const rect = viewportRef.current.getBoundingClientRect()
      const originX = origin.x - rect.left
      const originY = origin.y - rect.top
      const mapX = (originX - current.x) / current.zoom
      const mapY = (originY - current.y) / current.zoom

      return constrainView({
        zoom,
        x: originX - mapX * zoom,
        y: originY - mapY * zoom,
      })
    })
  }

  const handlePointerDown = (event) => {
    if (nodeDragRef.current) return
    capturePointer(event.currentTarget, event.pointerId)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    const point = getMapPointFromPointer(event)
    if (pointersRef.current.size === 1 && selectionRect && selectedPersonIds.length > 0) {
      if (isPointInRect(point, selectionRect)) {
        groupDragRef.current = getGroupDragState(event)
        suppressClickRef.current = true
        return
      }

      clearSelection()
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, NODE_CLICK_DELAY_MS)
      return
    }

    if (selectionMode && pointersRef.current.size === 1) {
      selectionDragRef.current = {
        pointerId: event.pointerId,
        startPoint: point,
      }
      setSelectionRect({ x: point.x, y: point.y, width: 0, height: 0 })
      setSelectedPersonIds([])
      return
    }

    if (pointersRef.current.size === 1) {
      dragRef.current = { x: event.clientX, y: event.clientY, view, moved: false }
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
    if (!pointersRef.current.has(event.pointerId)) return

    if (selectionDragRef.current && selectionDragRef.current.pointerId === event.pointerId) {
      const nextRect = getRectFromPoints(selectionDragRef.current.startPoint, getMapPointFromPointer(event))
      setSelectionRect(nextRect)
      setSelectedPersonIds(getPeopleInRect(nextRect))
      suppressClickRef.current = true
      return
    }

    if (updateGroupDrag(event)) return

    if (!dragRef.current) return

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
      if (Math.abs(dx) <= TAP_MOVE_THRESHOLD && Math.abs(dy) <= TAP_MOVE_THRESHOLD) return

      dragRef.current.moved = true
      suppressClickRef.current = true
      setView(constrainView({
        ...dragRef.current.view,
        x: dragRef.current.view.x + dx,
        y: dragRef.current.view.y + dy,
      }))
    }
  }

  const handlePointerEnd = (event) => {
    const wasMapDrag = Boolean(dragRef.current?.moved)
    pointersRef.current.delete(event.pointerId)

    if (selectionDragRef.current && selectionDragRef.current.pointerId === event.pointerId) {
      const nextRect = getRectFromPoints(selectionDragRef.current.startPoint, getMapPointFromPointer(event))
      const nextSelectedIds = getPeopleInRect(nextRect)
      setSelectionRect(nextSelectedIds.length > 0 ? nextRect : null)
      setSelectedPersonIds(nextSelectedIds)
      setSelectionMode(false)
      selectionDragRef.current = null
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, NODE_CLICK_DELAY_MS)
      return
    }

    if (groupDragRef.current && groupDragRef.current.pointerId === event.pointerId) {
      groupDragRef.current = null
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, NODE_CLICK_DELAY_MS)
      return
    }

    if (!suppressClickRef.current && !wasMapDrag) {
      const previousTap = lastEmptyTapRef.current
      const currentTap = { time: Date.now(), x: event.clientX, y: event.clientY }
      if (
        previousTap &&
        currentTap.time - previousTap.time < EMPTY_DOUBLE_TAP_MS &&
        Math.hypot(currentTap.x - previousTap.x, currentTap.y - previousTap.y) < EMPTY_DOUBLE_TAP_DISTANCE
      ) {
        setSelectionMode(true)
        setSelectionRect(null)
        setSelectedPersonIds([])
        lastEmptyTapRef.current = null
        suppressClickRef.current = true
      } else {
        lastEmptyTapRef.current = currentTap
      }
    }

    dragRef.current = null
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, NODE_CLICK_DELAY_MS)
  }

  const handleWheel = (event) => {
    event.preventDefault()
    const direction = event.deltaY > 0 ? -1 : 1
    setZoom(view.zoom + direction * ZOOM_STEP, { x: event.clientX, y: event.clientY })
  }

  const handleReset = () => setView(constrainView(initialView))

  const getMapPointFromPointer = (event) => {
    const rect = viewportRef.current.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left - view.x) / view.zoom,
      y: (event.clientY - rect.top - view.y) / view.zoom,
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
              const reverseKey = getConnectionKey(nextConnection.toId, nextConnection.fromId)
              setConnections((current) => {
                const existingConnection = current.find((connection) => {
                  const key = getConnectionKey(connection.fromId, connection.toId)
                  return key === nextKey || key === reverseKey
                })

                if (existingConnection) {
                  return current.filter((connection) => {
                    const key = getConnectionKey(connection.fromId, connection.toId)
                    return key !== nextKey && key !== reverseKey
                  })
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
    capturePointer(event.currentTarget, event.pointerId)
    window.clearTimeout(nodeLongPressTimerRef.current)

    const personId = getPersonId(person)
    if (selectionRect) {
      if (selectedPersonIds.includes(personId)) {
        groupDragRef.current = getGroupDragState(event)
        suppressClickRef.current = true
        return
      }

      clearSelection()
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, NODE_CLICK_DELAY_MS)
      return
    }

    nodeDragRef.current = {
      pointerId: event.pointerId,
      personId,
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
    if (updateGroupDrag(event)) {
      event.stopPropagation()
      return
    }

    if (!nodeDragRef.current || nodeDragRef.current.pointerId !== event.pointerId) return
    event.stopPropagation()
    if (!nodeDragRef.current.active) return

    const personId = nodeDragRef.current.personId
    const nextPosition = getMapPointFromPointer(event)
    setCustomPositions((current) => ({
      ...current,
      [personId]: nextPosition,
    }))
  }

  const handlePersonPointerUp = (event) => {
    if (groupDragRef.current && groupDragRef.current.pointerId === event.pointerId) {
      event.stopPropagation()
      groupDragRef.current = null
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, NODE_CLICK_DELAY_MS)
      return
    }

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
      }, NODE_CLICK_DELAY_MS)
    }
  }

  return (
    <section
      className="relative min-h-0 flex-1 select-none overflow-hidden bg-[#fbfaff]"
      style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
      aria-label="People map"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_43%,rgba(97,63,231,0.13),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f4f1ff_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(circle,rgba(82,68,142,0.18)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="pointer-events-none absolute left-[30px] top-[18px] z-20 flex flex-col gap-1 rounded-[18px] border border-white/80 bg-white/62 !px-3 !py-2 shadow-[0_12px_28px_rgba(47,36,108,0.08)] backdrop-blur">
        {relationSettings.slice(0, 5).map((item) => (
          <span key={item.name} className="flex items-center gap-1 text-[9px] leading-none text-text-sub">
            <span
              className="h-[7px] w-[7px] rounded-full"
              style={{
                backgroundColor: item.color,
                boxShadow: `0 0 10px ${item.color}77`,
              }}
            />
            {item.name}
          </span>
        ))}
      </div>

      <ZoomControls
        onZoomIn={() => setZoom(view.zoom + ZOOM_STEP)}
        onZoomOut={() => setZoom(view.zoom - ZOOM_STEP)}
        onReset={handleReset}
      />

      {selectionMode && (
        <div className="pointer-events-none absolute left-[30px] top-[70px] z-20 rounded-full bg-primary-light/90 !px-3 !py-1 text-[10px] font-semibold leading-4 text-primary shadow-sm">
          영역 선택
        </div>
      )}

      <div
        ref={viewportRef}
        className="h-full w-full touch-none select-none overflow-hidden"
        style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onWheel={handleWheel}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div
          className="relative h-[1600px] w-[1600px] select-none origin-top-left"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
        >
          <OrbitRings size={MAP_SIZE} center={MAP_CENTER} />
          {clusterFields.map((field) => (
            <div
              key={field.key}
              className="people-cluster-field pointer-events-none absolute"
              style={{
                left: field.x,
                top: field.y,
                width: field.width,
                height: field.height,
                '--cluster-color': field.color,
              }}
            >
              <span className="people-cluster-label">
                {field.label}
              </span>
            </div>
          ))}
          {selectionRect && (
            <div
              className="pointer-events-none absolute rounded-[22px] border border-primary/35 bg-white/24 shadow-[0_0_36px_rgba(97,63,231,0.18)] backdrop-blur-[2px]"
              style={{
                left: selectionRect.x,
                top: selectionRect.y,
                width: selectionRect.width,
                height: selectionRect.height,
              }}
            />
          )}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} aria-hidden="true">
            <defs>
              <linearGradient id="people-connection-gradient" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#5A8DEE" stopOpacity="0.16" />
                <stop offset="52%" stopColor="#613FE7" stopOpacity="0.72" />
                <stop offset="100%" stopColor="#FF8BB3" stopOpacity="0.16" />
              </linearGradient>
            </defs>
            {connections.map((connection) => {
              const from = positionById[connection.fromId]
              const to = positionById[connection.toId]
              if (!from || !to) return null
              return (
                <path
                  key={getConnectionKey(connection.fromId, connection.toId)}
                  d={getConnectionPath(from, to)}
                  className="people-connection-line"
                  fill="none"
                  stroke="url(#people-connection-gradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
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
              isSelected={selectedPersonIds.includes(getPersonId(person))}
              relationColor={relationMetaByName[getRelationName(person)]?.color}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
