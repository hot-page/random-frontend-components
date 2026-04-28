import { state, html, lightElement } from 'https://esm.sh/@hot-page/fun'
// import { state, html, lightElement } from 'https://localhost:8090/src/index.js'

const store = {
  corners: state(['superellipse(0)']),
  firstRadius: state(['100px']), // ,'100px','100px','100px']),
  secondRadius: state(['100px']), //,'100px','100px','100px']),
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
      const style = calcCSS() + ``
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
    const isX = this.getAttribute('axis') != 'y'
    const isTop = !this.getAttribute('corner').startsWith('bottom')
    const isLeft = !this.getAttribute('corner').endsWith('right')
    let index = 0
    if (!isLeft) index += 1
    if (!isTop) index += isLeft ? 3 : 1

    let clientAxis = isX ? 'clientX' : 'clientY'
    let offset
    let max

    const set = (event) => {
      let value = event[clientAxis] - offset
      if (!isLeft && isX) value = offset - event[clientAxis]
      if (!isTop && !isX) value = offset - event[clientAxis]
      value = Math.round(Math.min(max, Math.max(value, 0)))
      value = `${value}px`
      if (isX) {
        const values = [...store.firstRadius.get()]
        if (values.length < index) {
          values[1] ||= values[0]
          values[2] ||= values[0]
        }
        values[index] = value
        store.firstRadius.set(values) 
      } else {
        const values = [...store.secondRadius.get()]
        if (values.length < index) {
          values[1] ||= values[0]
          values[2] ||= values[0]
        }
        values[index] = value
        store.secondRadius.set(values)
      }
    }

    function onPointerDown(event) {
      const rect = this.closest('.shape').getBoundingClientRect()
      offset = isX
        ? (isLeft ? rect.left : rect.right)
        : (isTop ? rect.top : rect.bottom)
      max = (isX ? rect.width : rect.height) / 2
      this.setPointerCapture(event.pointerId)
      this.addEventListener('pointermove', onPointerMove)
      this.addEventListener('pointerup', onPointerUp)
    }

    function onPointerMove(event) {
      set(event)
    }

    function onPointerUp(event) {
      set(event)
      this.removeEventListener('pointermove', onPointerMove)
      this.removeEventListener('pointerup', onPointerUp)
    }

    this.addEventListener('pointerdown', onPointerDown)
    return () => {
      const length = isX
        ? store.firstRadius.get().length
        : store.secondRadius.get().length
      const isActive = index < length
      let readIndex
      if (isActive) {
        readIndex = index
        this.classList.add('active')
      } else {
        this.classList.remove('active')
        readIndex = !isLeft
          ? 0 // right side always reads 0
          : length >= 2
            ? 1 // reads 1 if it exists
            : 0 // otherwise 0
        console.log({ isLeft, isTop, index, readIndex })
      }
      const xRadius = parseInt(store.firstRadius.get()[readIndex])
      const yRadius = parseInt(store.secondRadius.get()[readIndex])
      let x = isX ? xRadius : 0
      let y = isX ? 0 : yRadius
      if (!isLeft || !isTop) {
        const rect = this.closest('.shape').getBoundingClientRect()
        if (!isLeft) {
          if (isX) x = rect.width - x
          else x = rect.width
        }
        if (!isTop) {
          if (!isX) y = rect.height - y
          else y = rect.height
        }
      }
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
    let start
    let radius

    const set = (event) => {
      const pos = event.clientX - start
      const n = kFromPos(pos, radius)
      // console.log(`SETS K radius: ${radius} pos: ${pos} n: ${n}`)
      store.corners.set([
        `superellipse(${n})`
      ])
    }

    function onPointerDown(event) {
      const rect = this.closest('.shape').getBoundingClientRect()
      start = rect.left
      radius = parseInt(store.firstRadius.get()[0] || 0)
      this.setPointerCapture(event.pointerId)
      this.addEventListener('pointermove', onPointerMove)
      this.addEventListener('pointerup', onPointerUp)
    }

    function onPointerMove(event) {
      set(event)
    }

    function onPointerUp(event) {
      set(event)
      this.removeEventListener('pointermove', onPointerMove)
      this.removeEventListener('pointerup', onPointerUp)
    }

    this.addEventListener('pointerdown', onPointerDown)
    return () => {
      radius = parseInt(store.firstRadius.get()[0] || 0)
      const corner = store.corners.get()[0]
      let pos
      if (corner == 'superellipse(Infinity)') pos = 0
      else if (corner == 'superellipse(-Infinity)') pos = radius
      else {
        const k = parseFloat(corner.match(/-?\d+.?\d*/)[0])
        pos = posFromK(k, radius)
        // console.log(`SETS POSITION radius: ${radius} k: ${k} pos: ${pos}`)
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
