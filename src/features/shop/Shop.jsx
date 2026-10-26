import { useState } from 'react'
import { Coin } from '../../components/icons'
import { ItemIcon } from '../../components/ItemIcon'
import { Toast } from '../../components/Toast'
import { PRICES, expToNext } from '../../game/rules'
import { store, useStore } from '../../state/store'
import { ITEMS } from '../summon/items'
import { FeedModal } from './FeedModal'
import { PriceBtn } from './PriceBtn'

// ---- item catalogue (prices: game/rules.ts) ----
const withPrice = (item) => ({
  ...item,
  price: PRICES[item.id],
})

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
    desc: 'Unlock a Mega Evolution from a friend’s detail card',
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
    desc: 'Unlock a Gigantamax form from a friend’s detail card',
    bag: (st) => st.gmaxStones || 0,
    tag: 'var(--pink)',
    buy: () => store.buyStone('gmax') && 'Gigantamax Stone added to your bag!',
  },
].map(withPrice)

// `eligible(inst, st)` returns null when the item can be used on that friend, else a short reason.
const FRIEND_ITEMS = [
  {
    id: 'candy',
    name: 'Rare Candy',
    sprite: 'rare-candy',
    emoji: '🍬',
    btn: '',
    desc: '+35 EXP to one friend of your choice',
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
    desc: 'Make a friend shiny — its normal form can be pulled again as new',
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
    <div
      className="chip-card"
      style={{
        padding: '22px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
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
  const [feeding, setFeeding] = useState(null) // friend item whose picker is open
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
      <div
        className="panel"
        style={{
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          overflowY: 'auto',
          padding: '26px 30px',
        }}
      >
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
        {/* one grid: friend items open the "feed to" picker, everything else goes straight into the bag */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))',
            gridAutoRows: 'minmax(132px, 1fr)',
            gap: 18,
          }}
        >
          {FRIEND_ITEMS.map((item) => (
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
