// Sprite images (pokemondb.net) and the type colors used when one fails to load.
export const TYPE_COLOR = {
  normal: '#d6c5a0',
  fire: '#efa06a',
  water: '#85bfe0',
  electric: '#efd277',
  grass: '#a6cf78',
  ice: '#a9dde0',
  fighting: '#e0908a',
  poison: '#c79bd6',
  ground: '#e6c98a',
  flying: '#bcd0ee',
  psychic: '#e89db8',
  bug: '#bcd07a',
  rock: '#c9b78c',
  ghost: '#b0a0d8',
  dragon: '#9aa0e0',
  dark: '#8a83a0',
  steel: '#b8c2cc',
  fairy: '#f0b9d4',
}

// ---------------- sprite urls ----------------
const BASE = 'https://img.pokemondb.net/sprites'

export function spriteUrl(sp, opts) {
  opts = opts || {}
  const sh = opts.shiny ? 'shiny' : 'normal'
  if (opts.form === 'mega') {
    const m = typeof sp.mega === 'string' ? sp.mega : sp.id + '-mega'
    return `${BASE}/omega-ruby-alpha-sapphire/dex/${sh}/${m}.png`
  }
  if (opts.form === 'gmax') {
    return `${BASE}/sword-shield/${sh}/${sp.id}-gigantamax.png`
  }
  if (sp.gen <= 5) return `${BASE}/black-white/anim/${sh}/${sp.id}.gif`
  return `${BASE}/sword-shield/${sh}/${sp.id}.png`
}

export function homeUrl(sp, shiny) {
  return `${BASE}/home/${shiny ? 'shiny' : 'normal'}/${sp.id}.png`
}
