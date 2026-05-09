import { state, html, lightElement } from 'https://cdn.jsdelivr.net/npm/@hot-page/fun@0.0.3/dist/index.min.js'
// import { state, html, lightElement } from 'https://localhost:8090/src/index.ts'


const store = {
  corners: state(['superellipse(0)']),
  xRadius: state(['10%']),
  yRadius: state([]),
}


lightElement(function CornerShape({ effect }) {

  effect(() => {
    const observer = new ResizeObserver(() => {
      store.corners.set(store.corners.get().slice())
      store.xRadius.set(store.xRadius.get().slice())
      store.yRadius.set(store.yRadius.get().slice())
    })
    observer.observe(this.querySelector('.shape'))
    // return () => observer.disconnect()
  })

  return () => {
    return html`
      <div class="shape" style=${generateCSS()}>
        <radius-control edge="left" side="top" ></radius-control>
        <radius-control edge="top" side="left"></radius-control>
        <corner-control corner="top-left"></corner-control>
        <radius-control edge="right" side="top" axis="x"></radius-control>
        <radius-control edge="top" side="right"></radius-control>
        <corner-control corner="top-right"></corner-control>
        <radius-control edge="bottom" side="right"></radius-control>
        <radius-control edge="right" side="bottom"></radius-control>
        <corner-control corner="bottom-right"></corner-control>
        <radius-control edge="bottom" side="left"></radius-control>
        <radius-control edge="left" side="bottom"></radius-control>
        <corner-control corner="bottom-left"></corner-control>
      </div>
      <dot-label name="--dot-top-left-x-radius"></dot-label>
      <dot-label name="--dot-top-left-y-radius"></dot-label>
      <dot-label name="--dot-top-left-corner"></dot-label>
      <dot-label name="--dot-top-right-x-radius"></dot-label>
      <dot-label name="--dot-top-right-y-radius"></dot-label>
      <dot-label name="--dot-top-right-corner"></dot-label>
      <dot-label name="--dot-bottom-right-x-radius"></dot-label>
      <dot-label name="--dot-bottom-right-y-radius"></dot-label>
      <dot-label name="--dot-bottom-right-corner"></dot-label>
      <dot-label name="--dot-bottom-left-x-radius"></dot-label>
      <dot-label name="--dot-bottom-left-y-radius"></dot-label>
      <dot-label name="--dot-bottom-left-corner"></dot-label>
    `
  }
})


// Edge is the side this thing is positioned by
// Side is the cross axis
lightElement(function RadiusControl() {
  const edge = this.getAttribute('edge')
  const side = this.getAttribute('side')
  this.style[edge] = '-8px'
  this.style[side] = '-8px'
  if (['left','right'].includes(edge)) {
    this.style.anchorName = `--dot-${side}-${edge}-x-radius`
  } else {
    this.style.anchorName = `--dot-${edge}-${side}-y-radius`
  }
  // console.log({ edge, side, anchorName: this.style.anchorName })

  let index = 0
  if ([edge, side].includes('right')) index += 1
  if ([edge, side].includes('bottom')) {
    index += 1
    if ([edge, side].includes('left')) index += 2
  }

  useDrag(this, (event) => {
    const rect = this.closest('corner-shape').getBoundingClientRect()
    const axis = ['top','bottom'].includes(edge) ? 'y' : 'x'
    const key = axis === 'y' ? 'clientY' : 'clientX'
    const offsetPx = ['left','top'].includes(edge)
      ? event[key] - rect[edge]
      : rect[edge] - event[key]
    // console.log({ edge, rectEdge: rect[edge], key, eventValue: event[key], offsetPx })
    const state = axis === 'y' ? store.yRadius : store.xRadius
    const values = state.get().slice()
    if (values.length < index) {
      values[0] ||= store.yRadius.get()[0] || store.xRadius.get()[0]
      values[1] ||= store.xRadius.get()[1] || values[0]
      if (index > 2) values[2] ||= values[0]
    }
    const referenceValue = values[shorthandIndex(values, index)] || store.xRadius.get()[0]
    values[index] = formatRadius(offsetPx, rect, axis, referenceValue)
    state.set(values)
  })

  return () => {
    const axis = ['top','bottom'].includes(edge) ? 'y' : 'x'
    let values = axis === 'y' ? store.yRadius.get() : store.xRadius.get()

    const isActive = index < values.length
    this.classList.toggle('active', isActive)

    // Y values fallback to X
    if (!values.length) values = store.xRadius.get()

    const parent = this.closest('corner-shape')
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    // If yRadius was empty and fell back to xRadius values, use 'x' axis for conversion
    const resolvedAxis = (axis === 'y' && !store.yRadius.get().length) ? 'x' : axis
    const offset = parseRadius(values[shorthandIndex(values, index)], rect, resolvedAxis)
    let cssOffset = offset
    if (['right','bottom'].includes(edge)) cssOffset *= -1

    // console.log({ edge, side, cssOffset })
    this.style.transform = ['top','bottom'].includes(edge)
      ? `translateY(${cssOffset}px)`
      : `translateX(${cssOffset}px)`
  }
})


lightElement(function CornerControl() {
  const corner = this.getAttribute('corner')
  const [vertical, horizontal] = this.getAttribute('corner').split('-')
  this.style[vertical] = '-8px'
  this.style[horizontal] = '-8px'
  this.style.anchorName = `--dot-${corner}-corner`

  let index = 0
  if (corner == 'top-right') index = 1
  else if (corner == 'bottom-right') index = 2
  else if (corner == 'bottom-left') index = 3
  // console.log({ corner: this.getAttribute('corner'), index })

  useDrag(this, (event) => {
    const rect = this.closest('corner-shape').getBoundingClientRect()
    const xRadiusValues = store.xRadius.get()
    const xIndex = shorthandIndex(xRadiusValues, index)
    const xRadius = parseRadius(xRadiusValues[xIndex], rect, 'x')
    let yRadiusValues = store.yRadius.get()
    if (yRadiusValues.length == 0) yRadiusValues = xRadiusValues
    const yIndex = shorthandIndex(yRadiusValues, index)
    const yRadius = parseRadius(yRadiusValues[yIndex], rect, 'y')
    const x = horizontal == 'left'
      ? event.clientX - rect.left 
      : rect.right - event.clientX
    const y = vertical == 'top'
      ? event.clientY - rect.top
      : rect.bottom - event.clientY
    const normalizedX = xRadius > 0 ? x / xRadius : 0
    const normalizedY = yRadius > 0 ? y / yRadius : 0
    const pos = Math.max(normalizedX, normalizedY)
    const n = kFromPos(pos, 1)
    const value = Math.round(n * 100) / 100
    // console.log(`SETS K radius: ${radius} pos: ${pos} n: ${n}`)
    const values = store.corners.get().slice()
    if (values.length < index) {
      values[1] ||= values[0]
      values[2] ||= values[0]
    }
    values[index] = `superellipse(${value})`
    store.corners.set(values)
  })

  return () => {
    const parent = this.closest('corner-shape')
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    const values = store.corners.get()

    const isActive = index < values.length
    this.classList.toggle('active', isActive)

    const sIndex = shorthandIndex(values, index)
    const value = values[sIndex]
    // console.log({ corner, value, sIndex })
    const xRadiusValues = store.xRadius.get()
    const xIndex = shorthandIndex(xRadiusValues, index)
    const xRadius = parseRadius(xRadiusValues[xIndex], rect, 'x')
    let yRadiusValues = store.yRadius.get()
    if (yRadiusValues.length == 0) yRadiusValues = xRadiusValues
    const yIndex = shorthandIndex(yRadiusValues, index)
    const yRadius = parseRadius(yRadiusValues[yIndex], rect, 'y')
    let x
    let y
    if (value == 'superellipse(Infinity)') {
      x = y = 0
    } else if (value == 'superellipse(-Infinity)') {
      x = xRadius
      y = yRadius
    } else {
      const k = parseFloat(value.match(/-?\d+.?\d*/)[0])
      x = posFromK(k, xRadius)
      y = posFromK(k, yRadius)
    }
    if (horizontal == 'right') x *= -1
    if (vertical == 'bottom') y *= -1

    // console.log({ index, sIndex, xRadius, yRadius, x, y })
    this.style.translate = `${x}px ${y}px`
  }
})


lightElement(function DotLabel() {
  // console.log('dot label init', this.getAttribute('name'))
  this.style.positionAnchor = this.getAttribute('name')
  const parts = this.getAttribute('name').slice(6).split('-')
  this.style.positionArea = `${parts[1]} center`
  let index = 0
  if (parts.includes('right')) index += 1
  if (parts.includes('bottom')) {
    index += 1
    if (parts.includes('left')) index += 2
  }
  const type = parts[2]
  // console.log({ name: this.getAttribute('name'), parts, index, type })
  if (type == 'corner') {
    return () => {
      const values = store.corners.get()
      const isActive = index < values.length
      this.classList.toggle('active', isActive)
      return isActive ? values[index] : ''
    }
  } else if (type == 'x') {
    return () => {
      const values = store.xRadius.get()
      const isActive = index < values.length
      this.classList.toggle('active', isActive)
      return isActive ? values[index] : ''
    }
  } else {
    return () => {
      const values = store.yRadius.get()
      const isActive = index < values.length
      this.classList.toggle('active', isActive)
      return isActive ? values[index] : ''
    }
  }
})


lightElement(function CornerShapeSelect() {
  return () => {
    const corner = store.corners.get()[0]
    const radius = store.xRadius.get()[0]

    return html`
      <input
        value=${radius}
        @change=${e => store.xRadius.set([e.target.value])}>
      <select
        .value=${corner}
        @change=${e => store.corners.set([e.target.value])}>
        <button>
          ${corner}
        </button>
        <option value="square">square</option>
        <option value="round">round</option>
        <option value="scoop">scoop</option>
        <option value="bevel">bevel</option>
        <option value="notch">notch</option>
        <option value="squircle">squircle</option>
        <option value="superellipse()">superellipse()</option>
      </select>
    `
  }
})


lightElement(function CSSOutput() {
  return () => html`<output>${generateCSS()}</output>`
})


lightElement(['shape'], function CornerShapeExample({ shape }) {
  this.addEventListener('click', () => {
    const elem = document.querySelector('corner-shape .shape')
    elem.style = shape.get()
    elem.style.transition = 'all 300ms ease'
    elem.addEventListener(
      'transitionend',
      () => parseCSS(shape.get()),
      { once: true })
  })
  return () => {
    this.style = shape.get()
  }
})

function generateCSS() {
  const xRadius = store.xRadius.get().join(' ')
  const yRadius = store.yRadius.get().join(' ')
  const join = store.yRadius.get().length > 0 ? ' / ' : ''
  const borderRadius = `border-radius: ${xRadius}${join}${yRadius};`
  return `corner-shape: ${store.corners.get().join(' ')};\n${borderRadius}`
}

function parseCSS(css) {
  const cornerShapeMatch = css.match(/corner-shape:\s*([^;]+);/)
  const corners = cornerShapeMatch
    ? cornerShapeMatch[1].trim().split(/\s+/)
    : ['superellipse(0)']

  const borderRadiusMatch = css.match(/border-radius:\s*([^;]+);/)
  let xRadius = ['10%']
  let yRadius = []
  if (borderRadiusMatch) {
    const parts = borderRadiusMatch[1].trim().split('/')
    xRadius = parts[0].trim().split(/\s+/)
    yRadius = parts[1] ? parts[1].trim().split(/\s+/) : []
  }

  store.corners.set(corners)
  store.xRadius.set(xRadius)
  store.yRadius.set(yRadius)
}


// Convert a stored radius string (e.g. "100px" or "50%") to pixels.
// axis: 'x' uses rect.width, 'y' uses rect.height.
function parseRadius(value, rect, axis) {
  if (value == null) return 0
  if (value.endsWith('%')) return parseFloat(value) / 100 * (axis === 'y' ? rect.height : rect.width)
  return parseFloat(value)
}

// Convert a pixel offset back to the same unit as the reference value.
function formatRadius(px, rect, axis, referenceValue) {
  if (referenceValue != null && referenceValue.endsWith('%')) {
    const size = axis === 'y' ? rect.height : rect.width
    return `${Math.round(px / size * 1000) / 10}%`
  }
  return `${Math.round(px)}px`
}

function shorthandIndex(values, index) {
  if (index < values.length) return index
  // top-right and bottom-right fall back to top-left
  if (index < 3) return 0
  // bottom-left falls back to top-right or top-left
  if (index == 3) return values.length < 2 ? 0 : 1
  return 0
}


function kFromPos(pos, r) {
  if (pos <= 0) return Infinity; // square
  if (pos >= r) return -Infinity; // notch
  // pos > r/2 means concave (dot is near the edge, not the diagonal)
  const concave = pos > r / 2
  // For convex: pos = (1 - t) * r  →  t = 1 - pos/r
  // For concave: pos = t * r        →  t = pos/r
  const t = concave ? pos / r : 1 - pos / r
  const absK = Math.log2(-1 / Math.log2(t))
  return concave ? -absK : absK
}


function posFromK(k, r) {
  if (k === Infinity) return 0;
  if (k === -Infinity) return r;
  // half-corner coordinate from box corner along each axis:
  // convex: 0.5^(1/2^k) * r, concave: (1 - 0.5^(1/2^|k|)) * r
  const t = Math.pow(0.5, 1 / Math.pow(2, Math.abs(k)))
  return k >= 0 ? (1 - t) * r : t * r
}


function useDrag(element, onMove) {
  function onPointerDown(event) {
    element.setPointerCapture(event.pointerId)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', onPointerUp)
  }

  function onPointerMove(event) {
    onMove(event)
  }

  function onPointerUp(event) {
    onMove(event)
    element.removeEventListener('pointermove', onPointerMove)
    element.removeEventListener('pointerup', onPointerUp)
  }

  element.addEventListener('pointerdown', onPointerDown)
}
