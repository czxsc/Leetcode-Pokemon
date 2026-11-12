// Sprite images (pokemondb.net, Pokémon Showdown) and the type colors used when one fails to load.
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
const SHOWDOWN = 'https://play.pokemonshowdown.com/sprites'

// pokemondb has no pixel art for many Gen 6+ species, any Gen 6+ shiny, or the forms, so those
// come from Showdown's gen5 set. Its slugs differ: tapu-koko is tapukoko, -mega-x is -megax.
function showdownUrl(slug, shiny) {
  return `${SHOWDOWN}/gen5${shiny ? '-shiny' : ''}/${slug}.png`
}

export function spriteUrl(sp, opts) {
  opts = opts || {}
  if (opts.form === 'mega') {
    const m = typeof sp.mega === 'string' ? sp.mega : sp.id + '-mega'
    return showdownUrl(m.replace(/-mega-([xy])$/, '-mega$1'), opts.shiny)
  }
  if (opts.form === 'gmax') return showdownUrl(`${sp.id}-gmax`, opts.shiny)
  if (sp.gen <= 5) {
    return `${BASE}/black-white/anim/${opts.shiny ? 'shiny' : 'normal'}/${sp.id}.gif`
  }
  return showdownUrl(sp.id.replace(/-/g, ''), opts.shiny)
}

export function homeUrl(sp, shiny) {
  return `${BASE}/home/${shiny ? 'shiny' : 'normal'}/${sp.id}.png`
}
