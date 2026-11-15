type ViewBox = [number, number, number, number]

type CityPoint = {
  name: string
  point: [number, number]
  visited: boolean
  count: number
}
type ProvincePayload = {
  short: string
  adcode: number
  visited: boolean
  cities: CityPoint[]
}
type Trip = { date: string; description: string; href: string }
type MapPayload = {
  base: string
  provinces: ProvincePayload[]
  records: Record<string, Trip[]>
}
type BoundaryCity = { name: string; adcode: number; d: string }
type BoundaryPayload = { province: string; adcode: number; cities: BoundaryCity[] }

const SVG_NS = 'http://www.w3.org/2000/svg'
const MAX_SCALE = 8
const NATIONAL_THRESHOLD = 1.25
const CITY_SCALE_THRESHOLD = 2.4
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const parseViewBox = (value: string | null): ViewBox => {
  const parts = (value ?? '0 0 1000 820').split(/[\s,]+/).map(Number)
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 1000, parts[3] ?? 820]
}

export function initTravelMap() {
  document.querySelectorAll<HTMLElement>('[data-travel-map]').forEach((root) => {
    const payloadNode = root.querySelector<HTMLScriptElement>('[data-map-payload]')
    if (!payloadNode?.textContent) return

    let payload: MapPayload
    try {
      payload = JSON.parse(payloadNode.textContent)
    } catch {
      return
    }

    const stage = root.querySelector<HTMLElement>('[data-map-stage]')
    const svg = root.querySelector<SVGSVGElement>('[data-map-svg]')
    const backButton = root.querySelector<HTMLButtonElement>('[data-map-back]')
    const cityCellsLayer = root.querySelector<SVGGElement>('[data-city-cells]')
    const recordPanel = root.querySelector<HTMLElement>('[data-city-record]')
    const recordCity = root.querySelector<HTMLElement>('[data-record-city]')
    const recordList = root.querySelector<HTMLElement>('[data-record-list]')
    const recordClose = root.querySelector<HTMLButtonElement>('[data-record-close]')
    if (!stage || !svg || !cityCellsLayer) return

    const fullViewBox = parseViewBox(svg.getAttribute('viewBox'))
    const fullAspect = fullViewBox[2] / fullViewBox[3]
    let view: ViewBox = [...fullViewBox]
    let activeProvince: string | null = null
    let displayedProvince: string | null = null
    let focusAnchor: [number, number] = [fullViewBox[2] / 2, fullViewBox[3] / 2]
    let syncTimer = 0
    let animationId = 0
    let pan: { id: number; x: number; y: number; view: ViewBox; moved: boolean } | null = null
    const pointers = new Map<number, { x: number; y: number }>()
    let pinchDistance = 0
    let suppressClick = false

    const provinceData = new Map<string, ProvincePayload>()
    for (const province of payload.provinces) provinceData.set(province.short, province)

    const provinceElements = new Map<string, { path: SVGPathElement; label: SVGTextElement }>()
    for (const path of [...root.querySelectorAll<SVGPathElement>('.tm-province')]) {
      const short = path.dataset.province ?? ''
      const label = root.querySelector<SVGTextElement>(
        `.tm-province-label[data-province="${short}"]`
      )
      if (label) provinceElements.set(short, { path, label })
    }

    const provinceLabelData = [...root.querySelectorAll<SVGTextElement>('.tm-province-label')].map(
      (label) => ({
        label,
        baseX: Number(label.dataset.baseX ?? 0),
        baseY: Number(label.dataset.baseY ?? 0),
        offsetX: Number(label.dataset.offsetX ?? 0),
        offsetY: Number(label.dataset.offsetY ?? 0),
        mobileOffsetX: Number(label.dataset.mobileOffsetX ?? 0),
        mobileOffsetY: Number(label.dataset.mobileOffsetY ?? 0)
      })
    )

    const boundaryCache = new Map<number, Promise<BoundaryPayload | null>>()
    const cellGroups = new Map<string, SVGGElement>()

    const stageRect = () => stage.getBoundingClientRect()
    const unit = () => view[2] / Math.max(1, stage.clientWidth)
    const scaleFor = (viewBox: ViewBox) => fullViewBox[2] / viewBox[2]

    const updateScaleVars = () => {
      const u = unit()
      const mobile = stage.clientWidth < 600
      root.style.setProperty('--tm-province-font', `${(mobile ? 10 : 11) * u}px`)
      root.style.setProperty('--tm-city-font', `${10 * u}px`)
      root.style.setProperty('--tm-label-halo', `${3 * u}px`)
      root.style.setProperty('--tm-marker-scale', String(u))
      for (const entry of provinceLabelData) {
        const offsetX = entry.offsetX + (mobile ? entry.mobileOffsetX : 0)
        const offsetY = entry.offsetY + (mobile ? entry.mobileOffsetY : 0)
        entry.label.setAttribute('x', String(entry.baseX + offsetX * u))
        entry.label.setAttribute('y', String(entry.baseY + offsetY * u))
      }
    }

    const applyView = (next: ViewBox) => {
      const nextScale = clamp(fullViewBox[2] / next[2], 1, MAX_SCALE)
      const width = fullViewBox[2] / nextScale
      const height = width / fullAspect
      const x = clamp(next[0], 0, fullViewBox[2] - width)
      const y = clamp(next[1], 0, fullViewBox[3] - height)
      view = [x, y, width, height]
      svg.setAttribute('viewBox', view.map((value) => value.toFixed(2)).join(' '))
      updateScaleVars()
      const zoomed = scaleFor(view) > 1.01 || Boolean(activeProvince)
      root.classList.toggle('is-zoomed', zoomed)
      if (backButton) backButton.hidden = !zoomed
    }

    const stopAnimation = () => {
      if (animationId) cancelAnimationFrame(animationId)
      animationId = 0
    }

    const animateTo = (target: ViewBox, onDone?: () => void) => {
      stopAnimation()
      const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) {
        applyView(target)
        onDone?.()
        return
      }
      const start = [...view] as ViewBox
      const startTime = performance.now()
      const duration = 430
      const tick = (now: number) => {
        const t = clamp((now - startTime) / duration, 0, 1)
        const e = easeInOutCubic(t)
        applyView(start.map((value, index) => value + (target[index] - value) * e) as ViewBox)
        if (t < 1) {
          animationId = requestAnimationFrame(tick)
        } else {
          animationId = 0
          onDone?.()
        }
      }
      animationId = requestAnimationFrame(tick)
    }

    const fitNational = () => applyView([...fullViewBox])

    const highlightProvince = (short: string | null) => {
      for (const [name, entry] of provinceElements) {
        entry.path.classList.toggle('is-active', name === short)
      }
    }

    const clearCityCells = () => {
      cityCellsLayer.replaceChildren()
      cellGroups.clear()
    }

    const loadBoundaries = (adcode: number): Promise<BoundaryPayload | null> => {
      let promise = boundaryCache.get(adcode)
      if (!promise) {
        promise = fetch(`${payload.base}data/cities/${adcode}.json`)
          .then((response) => (response.ok ? (response.json() as Promise<BoundaryPayload>) : null))
          .catch(() => null)
        boundaryCache.set(adcode, promise)
      }
      return promise
    }

    const renderCityCells = (short: string) => {
      const province = provinceData.get(short)
      if (!province) return
      clearCityCells()
      for (const city of province.cities) {
        const group = document.createElementNS(SVG_NS, 'g')
        group.setAttribute('class', `tm-city-cell${city.visited ? ' is-visited' : ''}`)
        group.dataset.city = city.name
        group.dataset.visited = city.visited ? 'true' : 'false'
        group.dataset.count = String(city.count)

        const boundary = document.createElementNS(SVG_NS, 'path')
        boundary.setAttribute('class', 'tm-city-boundary')
        group.append(boundary)

        const label = document.createElementNS(SVG_NS, 'text')
        label.setAttribute('class', 'tm-city-cell-label')
        label.setAttribute('x', String(city.point[0]))
        label.setAttribute('y', String(city.point[1]))
        label.setAttribute('text-anchor', 'middle')
        label.setAttribute('dominant-baseline', 'middle')
        label.textContent = city.name
        group.append(label)

        if (city.visited) {
          const marker = document.createElementNS(SVG_NS, 'g')
          marker.setAttribute('class', 'tm-city-cell-marker')
          const rings = Math.min(city.count, 5)
          for (let i = 0; i < rings; i++) {
            const ring = document.createElementNS(SVG_NS, 'circle')
            ring.setAttribute('class', 'tm-city-cell-ring')
            ring.setAttribute('cx', String(city.point[0]))
            ring.setAttribute('cy', String(city.point[1]))
            ring.setAttribute('r', String(4 + i * 2.3))
            ring.style.setProperty('--ring-opacity', (0.68 - i * 0.08).toFixed(2))
            marker.append(ring)
          }
          const dot = document.createElementNS(SVG_NS, 'circle')
          dot.setAttribute('class', 'tm-city-cell-dot')
          dot.setAttribute('cx', String(city.point[0]))
          dot.setAttribute('cy', String(city.point[1]))
          dot.setAttribute('r', '3.4')
          marker.append(dot)
          group.append(marker)

          group.addEventListener('click', (event) => {
            event.stopPropagation()
            openRecord(short, city, event.clientX, event.clientY)
          })
        }

        cityCellsLayer.append(group)
        cellGroups.set(city.name, group)
      }

      loadBoundaries(province.adcode).then((payload) => applyBoundaries(short, payload))
    }

    const applyBoundaries = (short: string, payload: BoundaryPayload | null) => {
      if (!payload || displayedProvince !== short) return
      for (const city of payload.cities) {
        const group = cellGroups.get(city.name)
        const boundary = group?.querySelector<SVGPathElement>('.tm-city-boundary')
        if (boundary) boundary.setAttribute('d', city.d)
      }
    }

    const focusedProvinceFromView = (): string | null => {
      const [ax, ay] = focusAnchor
      let point: DOMPoint | null = null
      try {
        point = new DOMPoint(ax, ay)
      } catch {
        point = null
      }
      for (const [short, entry] of provinceElements) {
        if (point && entry.path.isPointInFill(point)) return short
      }
      let best: string | null = null
      let bestDist = Infinity
      for (const [short, entry] of provinceElements) {
        const box = entry.path.getBBox()
        const dx = ax - (box.x + box.width / 2)
        const dy = ay - (box.y + box.height / 2)
        const dist = dx * dx + dy * dy
        if (dist < bestDist) {
          bestDist = dist
          best = short
        }
      }
      return best
    }

    const syncCityCells = () => {
      const target =
        activeProvince ??
        (scaleFor(view) >= CITY_SCALE_THRESHOLD ? focusedProvinceFromView() : null)
      if (target === displayedProvince) return
      displayedProvince = target
      if (target) renderCityCells(target)
      else clearCityCells()
    }

    const scheduleSync = () => {
      window.clearTimeout(syncTimer)
      syncTimer = window.setTimeout(syncCityCells, 160)
    }

    const enterProvince = (short: string) => {
      const entry = provinceElements.get(short)
      if (!entry) return
      const bbox = entry.path.getBBox()
      if (!bbox.width || !bbox.height) return
      const rect = stageRect()
      const targetScale = clamp(
        Math.min(rect.width / bbox.width, rect.height / bbox.height) * 0.86,
        1,
        MAX_SCALE
      )
      const targetWidth = fullViewBox[2] / targetScale
      const targetHeight = targetWidth / fullAspect
      const centerX = bbox.x + bbox.width / 2
      const centerY = bbox.y + bbox.height / 2
      const target: ViewBox = [
        centerX - targetWidth / 2,
        centerY - targetHeight / 2,
        targetWidth,
        targetHeight
      ]

      stopAnimation()
      activeProvince = short
      closeRecord()
      highlightProvince(short)
      root.classList.add('is-province-view')

      animateTo(target, () => syncCityCells())
    }

    const goNational = (animate: boolean) => {
      stopAnimation()
      activeProvince = null
      closeRecord()
      clearCityCells()
      displayedProvince = null
      highlightProvince(null)
      root.classList.remove('is-province-view')
      if (animate) animateTo([...fullViewBox], () => syncCityCells())
      else {
        fitNational()
        syncCityCells()
      }
    }

    const positionFloating = (element: HTMLElement, clientX: number, clientY: number) => {
      const rect = stageRect()
      const width = element.offsetWidth
      const height = element.offsetHeight
      let x = clientX - rect.left + 18
      let y = clientY - rect.top + 18
      if (x + width > rect.width - 12) x = clientX - rect.left - width - 18
      if (y + height > rect.height - 12) y = clientY - rect.top - height - 18
      x = clamp(x, 12, Math.max(12, rect.width - width - 12))
      y = clamp(y, 12, Math.max(12, rect.height - height - 12))
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    const openRecord = (short: string, city: CityPoint, clientX: number, clientY: number) => {
      if (!recordPanel) return
      const trips = payload.records[`${short}|${city.name}`] ?? []
      if (!trips.length) return
      if (recordCity) recordCity.textContent = city.name
      if (recordList) {
        recordList.replaceChildren()
        for (const trip of trips) {
          const li = document.createElement('li')
          const link = document.createElement('a')
          link.href = trip.href
          const time = document.createElement('time')
          time.textContent = trip.date
          const text = document.createElement('span')
          text.textContent = trip.description
          link.append(time, text)
          li.append(link)
          recordList.append(li)
        }
      }
      for (const [name, group] of cellGroups) {
        group.classList.toggle('is-selected', name === city.name)
      }
      recordPanel.hidden = false
      positionFloating(recordPanel, clientX, clientY)
    }

    const closeRecord = () => {
      for (const group of cellGroups.values()) group.classList.remove('is-selected')
      if (recordPanel) recordPanel.hidden = true
    }

    // ---- Province click (zoom in / toggle back) ----
    for (const [short, entry] of provinceElements) {
      entry.path.addEventListener('click', (event) => {
        event.stopPropagation()
        if (suppressClick) {
          suppressClick = false
          return
        }
        if (activeProvince === short) goNational(true)
        else enterProvince(short)
      })
    }

    backButton?.addEventListener('click', () => goNational(true))
    recordClose?.addEventListener('click', closeRecord)

    document.addEventListener('click', (event) => {
      if (recordPanel?.hidden) return
      const target = event.target as Element
      if (target.closest('[data-city-record], .tm-city-cell, [data-map-back]')) return
      closeRecord()
    })

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return
      if (recordPanel && !recordPanel.hidden) closeRecord()
      else if (activeProvince) goNational(true)
    })

    // ---- Wheel zoom / drag pan / pinch (secondary) ----
    const zoomAt = (clientX: number, clientY: number, factor: number) => {
      const rect = stageRect()
      if (!rect.width || !rect.height) return
      const fx = clamp((clientX - rect.left) / rect.width, 0, 1)
      const fy = clamp((clientY - rect.top) / rect.height, 0, 1)
      const worldX = view[0] + fx * view[2]
      const worldY = view[1] + fy * view[3]
      focusAnchor = [worldX, worldY]
      const nextScale = clamp(scaleFor(view) * factor, 1, MAX_SCALE)
      const width = fullViewBox[2] / nextScale
      const height = width / fullAspect
      applyView([worldX - fx * width, worldY - fy * height, width, height])
    }

    stage.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault()
        stopAnimation()
        const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1)
        const factor = Math.exp(-delta * 0.0015)
        if (Number.isFinite(factor)) zoomAt(event.clientX, event.clientY, factor)
        if (activeProvince && scaleFor(view) < NATIONAL_THRESHOLD) goNational(false)
        else scheduleSync()
      },
      { passive: false }
    )

    const distanceBetween = () => {
      const [a, b] = [...pointers.values()]
      if (!a || !b) return 0
      return Math.hypot(a.x - b.x, a.y - b.y)
    }

    stage.addEventListener('pointerdown', (event) => {
      const target = event.target as Element
      if (target.closest('button, a, .tm-city-cell, [data-city-record]')) return
      if (event.pointerType === 'mouse' && event.button !== 0) return
      stopAnimation()
      suppressClick = false
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pointers.size === 1) {
        pan = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          view: [...view] as ViewBox,
          moved: false
        }
        root.classList.add('is-panning')
      } else {
        pan = null
        pinchDistance = distanceBetween()
      }
    })

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

      if (pointers.size >= 2) {
        const distance = distanceBetween()
        if (pinchDistance > 0 && distance > 0) {
          const [a, b] = [...pointers.values()]
          const midX = a && b ? (a.x + b.x) / 2 : event.clientX
          const midY = a && b ? (a.y + b.y) / 2 : event.clientY
          zoomAt(midX, midY, distance / pinchDistance)
        }
        pinchDistance = distance
        return
      }

      if (!pan || pan.id !== event.pointerId) return
      const dx = event.clientX - pan.x
      const dy = event.clientY - pan.y
      if (Math.abs(dx) + Math.abs(dy) > 2) {
        pan.moved = true
        suppressClick = true
      }
      const rect = stageRect()
      const fx = clamp((event.clientX - rect.left) / rect.width, 0, 1)
      const fy = clamp((event.clientY - rect.top) / rect.height, 0, 1)
      focusAnchor = [pan.view[0] + fx * pan.view[2], pan.view[1] + fy * pan.view[3]]
      const u = pan.view[2] / Math.max(1, rect.width)
      applyView([pan.view[0] - dx * u, pan.view[1] - dy * u, pan.view[2], pan.view[3]])
    }

    const handlePointerEnd = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId) && pan?.id !== event.pointerId) return
      pointers.delete(event.pointerId)
      if (pan?.id === event.pointerId) {
        pan = null
        root.classList.remove('is-panning')
        if (activeProvince && scaleFor(view) < NATIONAL_THRESHOLD) goNational(false)
        else scheduleSync()
      }
      if (pointers.size < 2) pinchDistance = 0
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerEnd)
    window.addEventListener('pointercancel', handlePointerEnd)

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => updateScaleVars())
      observer.observe(stage)
    }

    updateScaleVars()
    fitNational()
  })
}
