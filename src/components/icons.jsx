// ---- Pokéball icon (pure CSS/divs) ----
export function Pokeball({ size = 20, className = '', style = {} }) {
  const b = Math.max(2, Math.round(size / 11))
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `${b}px solid #1c1922`,
        position: 'relative',
        overflow: 'hidden',
        background: '#fff',
        flex: 'none',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'var(--ball-red)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: b,
          transform: `translateY(${-b / 2}px)`,
          background: '#1c1922',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: size * 0.36,
          height: size * 0.36,
          transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          background: '#fff',
          border: `${b}px solid #1c1922`,
        }}
      />
    </div>
  )
}

// ---- shard glyph (teal crystal) ----
export function Shard({ size = 18, style = {} }) {
  const s = size
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 16 16"
      style={{
        flex: 'none',
        ...style,
      }}
    >
      <polygon
        points="8,1 14,6 8,15 2,6"
        fill="var(--shard)"
        stroke="var(--shard-deep)"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <polygon points="8,1 14,6 8,7" fill="var(--shard-lite)" />
      <line
        x1={8}
        y1={1}
        x2={8}
        y2={15}
        stroke="var(--shard-deep)"
        strokeWidth={0.8}
        opacity={0.5}
      />
    </svg>
  )
}

// ---- coin glyph (gold disc with P) ----
export function Coin({ size = 18, style = {} }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `${Math.max(2, size / 9)}px solid var(--coin-line)`,
        background: 'radial-gradient(circle at 38% 32%, #fbe7b0, var(--coin) 70%)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Silkscreen'",
        fontSize: size * 0.5,
        color: '#7a5a14',
        flex: 'none',
        ...style,
      }}
    >
      C
    </div>
  )
}
