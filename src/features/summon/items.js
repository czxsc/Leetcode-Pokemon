import * as PM from '../../game/species'

// ---- gacha items (bought in the Shop, which shows the same list) ----
// ball: the rarity setting it arms (only one per draw); the Generation Ticket stacks with any of them.
// sprite: pokemondb item icon (see ItemIcon in ui.jsx); line: the bag tag color in the Shop
export const ITEMS = [
  {
    id: 'rateBooster',
    ball: 'boost',
    name: 'Rate Booster',
    short: 'Rate Booster',
    sprite: 'lucky-egg',
    emoji: '🍀',
    line: 'var(--sage-deep)',
    btn: 'green',
    desc: 'Next draw: Epic and Legendary odds doubled',
  },
  {
    id: 'greatBall',
    ball: 'great',
    name: 'Great Ball',
    short: 'Great Ball',
    sprite: 'great-ball',
    emoji: '🔵',
    line: '#4a86d4',
    btn: 'shard',
    desc: 'Next draw is guaranteed to be Rare',
  },
  {
    id: 'ultraBall',
    ball: 'ultra',
    name: 'Ultra Ball',
    short: 'Ultra Ball',
    sprite: 'ultra-ball',
    emoji: '🟡',
    line: '#34323c',
    btn: 'lav',
    desc: 'Next draw is guaranteed to be Epic',
  },
  {
    id: 'genTicket',
    name: 'Generation Ticket',
    short: 'Gen Ticket',
    sprite: 'eon-ticket',
    emoji: '🎟️',
    line: 'var(--pink-deep)',
    btn: 'pink',
    desc: 'Next draw comes from a generation you choose',
  },
]

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((it) => [it.id, it]))

export const genLabel = (gen) => {
  const g = PM.GENERATIONS.find((x) => x.gen === gen)
  return g ? 'Gen ' + gen + ' · ' + g.region : 'Gen ' + gen
}

// what an armed setup does to the next Single Draw, in words
export function describeArmed(ball, gen) {
  const what =
    ball === 'great'
      ? 'a guaranteed Rare'
      : ball === 'ultra'
        ? 'a guaranteed Epic'
        : ball === 'boost'
          ? 'doubled Epic & Legendary odds'
          : 'normal odds'
  return what + (gen ? ' from ' + genLabel(gen) : '')
}
