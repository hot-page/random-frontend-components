console.log('initialzing theme-demo')

class ThemeDemo extends HTMLElement {

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this.copyLightDOMToShadow()

    this.observer = new MutationObserver(() => {
      this.copyLightDOMToShadow()
    })

    this.observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    })
  }

  disconnectedCallback() {
    this.observer?.disconnect()
  }

  copyLightDOMToShadow() {
    const theme = window.location.pathname.split('/')[1]
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="https://themes.hot.page/${theme}.css">
      <style>
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
