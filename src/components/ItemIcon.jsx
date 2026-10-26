import { useState } from 'react'

// ---- item icon (Shop + Summon): a pixel item sprite on a standard tile ----
// item: { sprite: pokemondb item slug, emoji: shown if the sprite can't load }
export function ItemIcon({ item, size }) {
  const [broken, setBroken] = useState(false)
  return (
    <div
      className="item-icon"
      style={{
        width: size,
        height: size,
      }}
    >
      {broken ? (
        <span
          style={{
            fontSize: Math.round(size * 0.5),
          }}
        >
          {item.emoji}
        </span>
      ) : (
        <img
          src={`https://img.pokemondb.net/sprites/items/${item.sprite}.png`}
          alt=""
          draggable={false}
          width={Math.round(size * 0.8)}
          height={Math.round(size * 0.8)}
          onError={() => setBroken(true)}
        />
      )}
    </div>
  )
}
