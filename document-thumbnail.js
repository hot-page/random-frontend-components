import { html, lightElement } from 'https://cdn.jsdelivr.net/npm/@hot-page/fun@0.0.1/dist/index.js'


const sizes = {
  portrait: '190x338',
  card: '300x240',
  banner: '500x200',
  social: '1200x630',
  'full-page': '200x600',
}
const defaultSize = 'card'

lightElement(
  ['path', 'size', 'site', 'alt'],
  function DocumentThumbnail({ path, size, site, alt }) {
    return () => {
      const documentPath = (path.get() || '').replace(/^\/?/, '/')
      const siteName = site.get()
      const sizeName = size.get() || defaultSize

      if (!siteName) {
        console.warn('document-thumbnail needs a site', this)
        return html``
      }
      if (!sizes[sizeName]) {
        const names = Object.keys(sizes).join(', ')
        console.warn(`document-thumbnail size must be one of ${names}`, this)
        return html``
      }

      const [width, height] = sizes[sizeName].split('x')
      const src = encodeURI(`/api/document-thumbnails/${sizes[sizeName]}/${siteName}${documentPath}`)

      return html`
        <img
          src=${src}
          alt=${alt.get() || ''}
          width=${width}
          height=${height}
          loading="lazy">
      `
    }
  },
)
