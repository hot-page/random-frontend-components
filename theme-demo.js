console.log('initialzing theme-demo')

class ThemeDemo extends HTMLElement {

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this.observer = new MutationObserver(() => {
      console.log('Mutation observed, updating shadow DOM')
      this.copyLightDOMToShadow()
    })

    this.observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    })

    this.copyLightDOMToShadow()
  }

  disconnectedCallback() {
    this.observer?.disconnect()
  }

  copyLightDOMToShadow() {
    let theme = window.location.pathname.split('/')[1]
    let styleTags = []
    const hasLiveUpdates = !window.location.search.includes('theRealThingAndNotSomeClientRenderedBS')
    // This is run in HotUpdates preview frame so grab inline styles and 
    // listen for live updates
    if (window.parent && hasLiveUpdates) {
      theme = window.parent.location.pathname.split('/')[1]
      const ids = [...this.querySelectorAll('[id]')].map(el => el.id)
      styleTags = [...document.querySelectorAll('style')]
        .filter(tag => ids.some(id => tag.textContent.includes(id)))
      // Observe the tags that correspond to elements in this node
      styleTags.map(el => this.observer.observe(el, {
        characterData: true,
        subtree: true,
        childList: true,
      }))
    }
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="https://themes.hot.page/${theme}.css">
      ${hasLiveUpdates ? '' : `<link rel="stylesheet" href="${window.location.origin}${window.location.pathname}.css">`}
      <style>
        ${styleTags.map(tag => tag.textContent).join('\n')}

        :host {
          all: initial;
          display: block;
        }

        body {
          padding: 32px;
        }
      </style>
    `
    // Cannot create <body> element with .innerHTML 
    const body = document.createElement('body')
    body.innerHTML = this.innerHTML
    this.shadowRoot.appendChild(body)
  }
}

customElements.define('theme-demo', ThemeDemo)
