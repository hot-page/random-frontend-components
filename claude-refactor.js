// import { state, html, lightElement } from 'https://esm.sh/@hot-page/fun'
import { state, html, lightElement } from 'https://localhost:8090/src/index.js'

const store = {
  corners: state(['superellipse(0)']),
  firstRadius: state(['100px']), // ,'100px','100px','100px']),
  secondRadius: state(['100px']), //,'100px','100px','100px']),
}

// Each corner maps to its shorthand index and which rect edges are its origin.
// horizontalEdge/verticalEdge name the edge the radius is measured *from*.
const CORNERS = {
  'top-left':     { index: 0, horizontalEdge: 'left',  verticalEdge: 'top'    },
  'top-right':    { index: 1, horizontalEdge: 'right', verticalEdge: 'top'    },
  'bottom-right': { index: 2, horizontalEdge: 'right', verticalEdge: 'bottom' },
  'bottom-left':  { index: 3, horizontalEdge: 'left',  verticalEdge: 'bottom' },
}

// Write into a border-radius shorthand array, backfilling omitted values
// so the write at `index` has the effect you'd get from expanding the shorthand.
function setShorthandAt(store$, index, value) {
  const values = [...store$.get()]
  if (values.length <= index) {
    values[1] ??= values[0]
    values[2] ??= values[0]
  }
  values[index] = value
  store$.set(values)
}

// When a corner isn't explicitly set, border-radius shorthand reuses an
// earlier slot. Mirror that so inactive dots sit in the right place.
function readShorthandAt(values, index) {
  if (index < values.length) return index
  if (index === 1) return 0                     // top-right falls back to top-left
  if (index === 2) return values.length >= 2 ? 1 : 0  // bottom-right ↔ top-left
  if (index === 3) return 0                     // bottom-left falls back to top-left
  return 0
}

// Attach a simple pointer-drag handler. onStart receives the pointer event and
// returns a move handler (or falsy to cancel). The move handler is called on
// every move *and* on pointerup.
function attachDrag(element, onStart) {
  element.addEventListener('pointerdown', (event) => {
    const onMove = onStart.call(element, event)
    if (!onMove) return
    element.setPointerCapture(event.pointerId)
    const handleMove = (e) => onMove(e)
    const handleUp = (e) => {
      onMove(e)
      element.removeEventListener('pointermove', handleMove)
    }
    element.addEventListener('pointermove', handleMove)
    element.addEventListener('pointerup', handleUp, { once: true })
  })
}

function borderRadius() {
  const firstRadius = store.firstRadius.get().join(' ')
  const secondRadius = store.secondRadius.get().join(' ')
  const join = store.secondRadius.get().length > 0 ? ' / ' : ''
  return `border-radius: ${firstRadius}${join}${secondRadius};`
}

function calcCSS() {
  return `
corner-shape: ${store.corners.get().join(' ')};
${borderRadius()}
  `
}

lightElement(`
  :scope {
    display: block;
    width: 100%;
  }

  .shape {
    background: hsl(200 50% 50% / 0.2);
    width: 100%;
    aspect-ratio: 1;
    position: relative;
  }

  .shadow {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 1px solid rgb(0 0 0 / 0.5);
  }
`,
  function ShapeContainer() {
    return () => {
      const style = calcCSS()
      return html`
        <div class="shape" style=${style}>
          <radius-control corner="top-left" axis="x"></radius-control>
          <radius-control corner="top-left" axis="y"></radius-control>
          <super-control corner="top-left"></super-control>
          <radius-control corner="top-right" axis="x"></radius-control>
          <radius-control corner="top-right" axis="y"></radius-control>
          <!-- <super-control corner="top-right"></super-control> -->
          <radius-control corner="bottom-left" axis="x"></radius-control>
          <radius-control corner="bottom-left" axis="y"></radius-control>
          <!-- <super-control corner="bottom-left"></super-control> -->
          <radius-control corner="bottom-right" axis="x"></radius-control>
          <radius-control corner="bottom-right" axis="y"></radius-control>
          <!-- <super-control corner="bottom-right"></super-control> -->
        </div>
      `
    }
  },
)

const dotCSS = `
  display: block;
  position: absolute;
  top: 0px;
  left: 0px;
  width: 15px;
  aspect-ratio: 1;
  border-radius: 50%;
`

lightElement(`
  :scope {
    ${dotCSS}
    background: #aaa;
    &.active {
      background: green;
    }
  }`,

  function RadiusControl() {
    const corner = CORNERS[this.getAttribute('corner')]
    const axis = this.getAttribute('axis') === 'y' ? 'y' : 'x'
    const radiusStore = axis === 'x' ? store.firstRadius : store.secondRadius
    const clientProp = axis === 'x' ? 'clientX' : 'clientY'
    const originEdge = axis === 'x' ? corner.horizontalEdge : corner.verticalEdge
    // Dragging away from the origin edge should increase the radius.
    const direction = (originEdge === 'left' || originEdge === 'top') ? 1 : -1

    attachDrag(this, function onDragStart() {
      const rect = this.closest('.shape').getBoundingClientRect()
      const originPx = rect[originEdge]
      const maxRadius = (axis === 'x' ? rect.width : rect.height) / 2

      return (event) => {
        const delta = (event[clientProp] - originPx) * direction
        const clamped = Math.round(Math.min(maxRadius, Math.max(delta, 0)))
        setShorthandAt(radiusStore, corner.index, `${clamped}px`)
      }
    })

    return () => {
      const values = radiusStore.get()
      const isActive = corner.index < values.length
      this.classList.toggle('active', isActive)

      const readIndex = readShorthandAt(values, corner.index)
      const radiusPx = parseInt(values[readIndex]) || 0

      const rect = this.closest('.shape').getBoundingClientRect()
      // Position along the dragged axis: radius away from the origin edge.
      const along = originEdge === 'left' || originEdge === 'top'
        ? radiusPx
        : (axis === 'x' ? rect.width : rect.height) - radiusPx
      // Position on the other axis: pinned to the corner's edge.
      const across = axis === 'x'
        ? (corner.verticalEdge === 'top' ? 0 : rect.height)
        : (corner.horizontalEdge === 'left' ? 0 : rect.width)

      const x = axis === 'x' ? along : across
      const y = axis === 'x' ? across : along
      this.style.translate = `calc(-50% + ${x}px) calc(-50% + ${y}px)`
    }
  },
)

function kFromPos(pos, r) {
  if (pos <= 0) return Infinity; // square
  if (pos >= r) return -Infinity; // notch
  return Math.log2(Math.log(0.5) / Math.log(1 - pos / r));
}

function posFromK(k, r) {
  if (k === Infinity) return 0;
  if (k === -Infinity) return r;
  return r * (1 - Math.pow(0.5, 1 / Math.pow(2, k)));
}

let radius = 100
;[0,25,50,75,100].map(pos => {
  const n = kFromPos(pos, radius)
  console.log(`radius: ${radius} pos: ${pos} n: ${n}`)
})

lightElement(`
  :scope {
    ${dotCSS}
    background: CornFlowerBlue;
  }`,

  function SuperControl() {
    attachDrag(this, function onDragStart() {
      const rect = this.closest('.shape').getBoundingClientRect()
      const originPx = rect.left
      const radius = parseInt(store.firstRadius.get()[0] || 0)

      return (event) => {
        const pos = event.clientX - originPx
        const n = kFromPos(pos, radius)
        store.corners.set([`superellipse(${n})`])
      }
    })

    return () => {
      const radius = parseInt(store.firstRadius.get()[0] || 0)
      const corner = store.corners.get()[0]
      let pos
      if (corner == 'superellipse(Infinity)') pos = 0
      else if (corner == 'superellipse(-Infinity)') pos = radius
      else {
        const k = parseFloat(corner.match(/-?\d+.?\d*/)[0])
        pos = posFromK(k, radius)
      }
      this.style.translate = `calc(-50% + ${pos}px) calc(-50% + ${pos}px)`
    }
  },
)


lightElement(`
  select {
    appearance: base-select;
    padding: 4px 8px;
    line-height: 1;
    border: 1px solid var(--primary-color-900);
    font-family: inherit;
    background: var(--background-color);
    cursor: pointer;
    align-items: center;
    border-radius: 0;

    &:hover {
      background: var(--primary-color-300);
    }

    &:focus-visible {}

    &::picker(select) {
      anchor-name: --styled-select;
      appearance: base-select;
      top: calc(anchor(bottom) - 1px);
      border: 1px solid var(--primary-color-900);
      color: var(--primary-color-900);
      z-index: 100;
      transition:
        opacity 300ms ease-out,
        transform 200ms ease-out;
    }

    @starting-style {
      &::picker(select):popover-open {
        opacity: 0;
        transform: scale(1, 0.9);
      }
    }

    &::picker(select):popover-open {
      opacity: 1;
      transform: none;
    }

    &::picker-icon {
      content: url('data:image/svg+xml;chartset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33"><path fill="%235f347a" d="M16.5,24.8L4.2,11.3l2.9-3.1,9.5,10.3,9.5-10.3,2.9,3.1-12.3,13.5Z"/></svg>');
      position: relative;
      width: 12px;
      height: 16px;
      transform: rotate(90deg);
      transition: transform 200ms ease-out;
    }

    &:open::picker-icon {
      transform: rotate(0);
    }
  }

  option {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    padding: 6px 8px;
    /* background: var(--background-color); */

    img,
    svg {
      width: 32px;
      height: 32px;
    }

    /* 
    &:hover {
      background: var(--primary-color-300);
    }

    &:focus {
      background: var(--primary-color-900);
      color: white;
    }

    &:checked {
      font-weight: bold;
    }

    &::checkmark {
      display: none;
    }
    */
  }`,
  function CornerShape() {
    return () => {
      const corner = store.corners.get()[0]
      const radius = store.firstRadius.get()[0]

      return html`
        <input
          value=${radius}
          @change=${e => store.firstRadius.set([e.target.value])}>
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
  },
)

lightElement(
  function CSSOutput() {
    return () => html`
      <output>
        ${calcCSS()}
      </output>
    `
  },
)
