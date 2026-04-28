import { lightElement, state, html } from 'https://esm.sh/@hot-page/fun'

const store = state({
  length: 32,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: false,
})

lightElement(
  function PasswordGenerator() {
    return () => generatePassword()
  },
)

lightElement(
  ['name'],
  function PasswordCheckbox({ name }) {
    this.addEventListener('input', (event) => {
      store.set({ ...store.get(), [name.get()]: event.target.checked })
    })
    return () => {
      const key = name.get()
      const value = store.get()[key]
      return html `<input type="checkbox" name=${key} .checked=${value}>`
    }
  },
)

lightElement(
  function PasswordLength() {
    this.addEventListener('input', (event) => {
      const value = parseInt(event.target.value)
      store.set({ ...store.get(), length: value })
    })
    return () => {
      const value = store.get().length
      return html `
        <input type="range" value=${value} min=8 max=256>
        <input type="number" value=${value} min=8 max=256>
      `
    }
  },
)

lightElement(
  function PasswordEntropy() {
    return () => measureEntropy().toLocaleString() + ' bits'
  },
)

lightElement(
  function PasswordPossibilities() {
    return () => bigIntToWords(2n ** BigInt(measureEntropy()))
  },
)

lightElement(
  function PasswordStrength() {
    return () => {
      const entropy = measureEntropy() - 40
      return html`
        <progress .value=${entropy} value="70" max="100" style="--pct: ${entropy}%"></progress>
        ${entropy >= 100 ? 'Strong' : entropy >= 50 ? 'Medium' : 'Weak'}
      `
    }
  },
)


function measureEntropy() {
  const { length } = store.get()
  const charset = getCharset()
  return Math.trunc(length * Math.log2(charset.length))
}

function getCharset() {
  const { uppercase, lowercase, numbers, symbols } = store.get()
  let charset = ''
  if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (numbers)   charset += '0123456789'
  if (symbols)   charset += '!@#$%^&*()_+-=[]{}'
  return charset
}

function generatePassword() {
  const { length } = store.get()
  const charset = getCharset()
  if (!charset) return
  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)
  return Array.from(randomValues, v => charset[v % charset.length]).join('')
}

function illionName(n) {
  if (n < 10) return ['million','billion','trillion','quadrillion','quintillion',
                      'sextillion','septillion','octillion','nonillion'][n - 1]

  const ones     = ['','un','duo','tre','quattuor','quin','sex','septen','octo','novem']
  const tens     = ['','dec','vigint','trigint','quadragint','quinquagint','sexagint','septuagint','octogint','nonagint']
  const hundreds = ['','cent','ducent','trecent','quadringent','quingent','sescent','septingent','octingent','nongent']

  return ones[n % 10] + tens[Math.floor(n / 10) % 10] + hundreds[Math.floor(n / 100)] + 'illion'
}

function groupName(i) {
  if (i === 0) return ''
  if (i === 1) return 'thousand'
  return illionName(i - 1)
}

function bigIntToWords(n) {
  if (n === 0n) return 'zero'

  const groups = []
  while (n > 0n) {
    groups.push(n % 1000n)
    n /= 1000n
  }
  groups.reverse()

  if (groups.length >= 2) groups.splice(0, 2, groups[0] * 1000n + groups[1])

  const value = Number(groups[0]).toLocaleString()
  const name  = groupName(groups.length - 1)
  return `${value} ${name}`.trim()
}
