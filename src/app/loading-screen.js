import { byId } from '../game/species'

// What the loading screen remembers in this browser: the trainer's lead
// Pokémon (the save hasn't loaded yet when the screen shows, so it's the lead
// from the last visit, Bulbasaur until there is one) and the best Shard catch.
const PARTNER_KEY = 'pokeleet:loading:partner'
const BEST_KEY = 'pokeleet:loading:best'
const FIRST_PARTNER = { sp: 'bulbasaur', shiny: false, form: null }

let savedPartner = null // as last written, so it's only written when it changes

export function loadingPartner() {
  try {
    const partner = JSON.parse(localStorage.getItem(PARTNER_KEY) || 'null')
    if (partner && byId(partner.sp)) return partner
  } catch {
    // private window, or not ours: the first partner
  }
  return FIRST_PARTNER
}

export function rememberLoadingPartner(state) {
  const lead = state.owned.find((o) => o.iid === state.team[0])
  if (!lead) return
  const partner = JSON.stringify({ sp: lead.sp, shiny: lead.shiny, form: lead.form })
  if (partner === savedPartner) return
  savedPartner = partner
  try {
    localStorage.setItem(PARTNER_KEY, partner)
  } catch {
    // private window: Bulbasaur again next time
  }
}

export function bestCatch() {
  try {
    return Math.max(0, parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0)
  } catch {
    return 0
  }
}

export function saveBestCatch(n) {
  try {
    localStorage.setItem(BEST_KEY, String(n))
  } catch {
    // private window: forgotten
  }
}
