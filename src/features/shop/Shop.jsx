import { useState } from 'react'
import { Coin } from '../../components/icons'
import { ItemIcon } from '../../components/ItemIcon'
import { Toast } from '../../components/Toast'
import { PRICES, expToNext, TRANSFORM_MIN_LEVEL, transformLevelFor } from '../../game/rules'
import { store, useStore } from '../../state/store'
import { ITEMS } from '../summon/items'
import { FeedModal } from './FeedModal'
import { PriceBtn } from './PriceBtn'

// ---- item catalogue (prices: game/rules.ts) ----
const withPrice = (item) => ({
  ...item,
  price: PRICES[item.id],
})

// Stones work from this level range: the lowest for any species, the highest for two-evolution lines
const STONE_LEVELS = `Lv ${TRANSFORM_MIN_LEVEL}–${transformLevelFor(2)}`

// Rate Booster, Great / Ultra Ball, Generation Ticket — used from the Summon tab (defined in features/summon/items.js)
const GACHA_ITEMS = ITEMS.map((it) =>
  withPrice({
    ...it,
    bag: (st) => st.items[it.id] || 0,
    tag: it.line,
    buy: () => store.buyGachaItem(it.id) && it.name + ' added to your bag!',
  }),
)

const BAG_ITEMS = [
  {
    id: 'snack',
    name: 'Team Snack',
    sprite: 'lava-cookie',
    emoji: '🍮',
    btn: 'green',
    desc: '+5 EXP to all 6 current team members',
    buy: () => store.teamSnack() && '+5 EXP to all team members!',
  },
  {
    id: 'mega',
    name: 'Mega Stone',
    sprite: 'key-stone',
    emoji: '🔮',
    btn: 'lav',
    desc: 'Unlock a Mega Evolution from a Pokémon’s detail card, from ' + STONE_LEVELS,
    bag: (st) => st.megaStones || 0,
    tag: 'var(--lav)',
    buy: () => store.buyStone('mega') && 'Mega Stone added to your bag!',
  },
  {
    id: 'gmax',
    name: 'Gigantamax Stone',
    sprite: 'red-shard',
    emoji: '🌀',
    btn: 'pink',
    desc: 'Unlock a Gigantamax form from a Pokémon’s detail card, from ' + STONE_LEVELS,
    bag: (st) => st.gmaxStones || 0,
    tag: 'var(--pink)',
    buy: () => store.buyStone('gmax') && 'Gigantamax Stone added to your bag!',
  },
].map(withPrice)

// `eligible(inst, st)` returns null when the item can be used on that Pokémon, else a short reason.
const POKEMON_ITEMS = [
  {
    id: 'candy',
    name: 'Rare Candy',
    sprite: 'rare-candy',
    emoji: '🍬',
    btn: '',
    desc: '+35 EXP to one Pokémon of your choice',
    eligible: () => null,
    info: (inst) => {
      const need = expToNext(inst.level)
      return {
        bar: inst.exp / need,
        text: inst.exp + ' / ' + need + ' EXP to Lv' + (inst.level + 1),
      }
    },
    buy: (iid) => store.rareCandy(iid),
    done: (inst, sp) => {
      const after = store.get().owned.find((o) => o.iid === inst.iid).level
      return after > inst.level ? sp.name + ' grew to Lv' + after + '!' : '+35 EXP to ' + sp.name
    },
  },
  {
    id: 'shiny',
    name: 'Shiny Candy',
    sprite: 'shiny-charm',
    emoji: '✨',
    btn: 'gold',
    desc: 'Make a Pokémon shiny — its normal form can be pulled again as new',
    eligible: (inst, st) => {
      if (inst.shiny) return 'Already shiny'
      if (st.owned.some((o) => o.sp === inst.sp && o.shiny)) return 'You already have a shiny one'
      return null
    },
    info: () => ({
      text: 'Will become shiny',
    }),
    buy: (iid) => store.shinyCandy(iid),
    done: (inst, sp) => sp.name + ' is now shiny!',
  },
].map(withPrice)

function ItemCard({ item, st, onBuy }) {
  return (
    <div className="chip-card shop-item">
      <ItemIcon item={item} size={58} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 13,
            color: 'var(--ink)',
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--ink-faint)',
            marginTop: 6,
            lineHeight: 1.45,
          }}
        >
          {item.desc}
        </div>
      </div>
      {/* price, with how many are already in the bag underneath */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 7,
          flex: 'none',
        }}
      >
        <PriceBtn item={item} disabled={st.coins < item.price} onClick={onBuy} />
        {item.bag ? (
          <span
            className="type-tag"
            style={{
              background: item.tag,
              color: '#fff',
              whiteSpace: 'nowrap',
            }}
          >
            {'in bag: ' + item.bag(st)}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function Shop() {
  const st = useStore()
  const [feeding, setFeeding] = useState(null) // Pokémon item whose picker is open
  const [toast, setToast] = useState(null)
  const flash = (m) => {
    setToast(m)
    setTimeout(() => setToast(null), 1800)
  }
  return (
    <div
      style={{
        height: '100%',
        position: 'relative',
      }}
    >
      <div className="panel shop-panel">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingBottom: 18,
            borderBottom: '2px dashed var(--card-line)',
          }}
        >
          <div
            style={{
              flex: 1,
            }}
          >
            <div
              className="panel-title"
              style={{
                margin: 0,
              }}
            >
              <span className="dot" />
              Trainer Shop
            </div>
          </div>
          <div className="cur-badge">
            <Coin size={16} />
            {st.coins.toLocaleString()}
          </div>
        </div>
        {/* one grid: Pokémon items open the "feed to" picker, everything else goes straight into the bag */}
        <div className="shop-grid">
          {POKEMON_ITEMS.map((item) => (
            <ItemCard key={item.id} item={item} st={st} onBuy={() => setFeeding(item)} />
          ))}
          {[...BAG_ITEMS, ...GACHA_ITEMS].map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              st={st}
              onBuy={() => {
                const msg = item.buy()
                if (msg) flash(msg)
              }}
            />
          ))}
        </div>
      </div>
      {feeding ? (
        <FeedModal
          item={feeding}
          onClose={() => setFeeding(null)}
          onDone={(msg) => {
            setFeeding(null)
            flash(msg)
          }}
        />
      ) : null}
      {toast ? <Toast msg={toast} /> : null}
    </div>
  )
}
