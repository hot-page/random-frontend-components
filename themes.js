import { shadowElement, lightElement, html, state } from 'https://cdn.jsdelivr.net/npm/@hot-page/fun@0.0.1/dist/index.js'


let theme = window.location.pathname.split('/')[1]
const hasLiveUpdates = window.parent && !window.location.search.includes('theRealThingAndNotSomeClientRenderedBS')
if (hasLiveUpdates) theme = window.parent.location.pathname.split('/')[1]
const themeCSSFile = `https://themes.hot.page/${theme}.css`

console.log('Creating theme components for', theme)

const colors = state({})
;(async function () {
  const response = await fetch(themeCSSFile)
  const cssText = await response.text()
  const collectedColors = {}
  const rootMatch = cssText.match(/:root\s*\{([\s\S]*?)\}/)
  if (rootMatch) {
    const rootBlock = rootMatch[1]
    // Match each --property: value; line
    const propRegex = /(--[\w-]+)\s*:\s*([^;]+);/g
    let match
    while ((match = propRegex.exec(rootBlock)) !== null) {
      collectedColors[match[1]] = match[2].trim()
    }
  }
  colors.set(collectedColors)
})()


lightElement(
  ['color'],
  function ThemeSwatch({ color }) {
    return () => {
      const name = `--${color.get()}`
      return html`
        <div>
          <p class="selector">${name}</p>
          <div
            class="swatch"
            style="background-color: ${colors.get()[name]}">
          </div>
        </div>
      `
    }
  },
)




shadowElement(
  `
    :host {
      all: initial;
      display: block;
    }
    iframe {
      display: block;
      width: 100%;
      border: none;
      overflow: hidden;
    }
  `,
  function ThemeDemo({ effect }) {
    const iframeId = Math.random().toString(36).slice(2)
    const key = state(0)

    const observer = new MutationObserver(() => key.set(key.get() + 1))

    effect(() => {
      observer.observe(this, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      })
      return () => observer.disconnect()
    })

    effect(() => {
      const onMessage = (event) => {
        if (event.data?.type === 'theme-demo-height' && event.data?.id === iframeId) {
          const iframe = this.shadowRoot.querySelector('iframe')
          if (iframe) {
            iframe.style.height = event.data.height + 'px'
          }
        }
      }
      window.addEventListener('message', onMessage)
      return () => window.removeEventListener('message', onMessage)
    })

    return () => {
      key.get() // subscribe to re-renders

      let styleTags = []

      // This is run in HotUpdates preview frame so grab inline styles and
      // listen for live updates
      if (hasLiveUpdates) {
        const ids = [...this.querySelectorAll('[id]')].map(el => el.id)
        styleTags = [...document.querySelectorAll('style')]
          .filter(tag => ids.some(id => tag.textContent.includes(id)))
        styleTags.forEach(el => observer.observe(el, {
          characterData: true,
          subtree: true,
          childList: true,
        }))
      }

      const themeLink = `<link rel="stylesheet" href="${themeCSSFile}">`
      const pageLink = hasLiveUpdates ? '' : `<link rel="stylesheet" href="${window.location.origin}${window.location.pathname}.css">`
      const inlineStyles = styleTags.map(tag => tag.textContent).join('\n')
      const parentOrigin = window.location.origin === 'null' ? '*' : window.location.origin

      const srcdoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  ${themeLink}
  ${pageLink}
  <style>
    ${inlineStyles}
    body {
      display: flow-root;
    }
  </style>
</head>
<body>
  ${this.innerHTML}
  <script>
    (function() {
      var id = ${JSON.stringify(iframeId)};
      var parentOrigin = ${JSON.stringify(parentOrigin)};
      function postHeight() {
        var height = document.body.scrollHeight;
        window.parent.postMessage({ type: 'theme-demo-height', id: id, height: height }, parentOrigin || '*');
      }
      var observer = new ResizeObserver(postHeight);
      observer.observe(document.body);
      postHeight();
    })();
  <\/script>
</body>
</html>`

      return html`<iframe scrolling="no" .srcdoc=${srcdoc}></iframe>`
    }
  }
)
