// ---------------- pixel sparkle (the shiny marker) ----------------
// Hand-placed pixels drawn at the sprites' own pixel size, so it sits with them instead of
// looking like an emoji. 'g' gold edge, 'y' pale gold, 'w' white core; a 1px amber outline
// is added around each shape. The frames take turns (CSS .px-spark in theme.css) to twinkle
// big -> mid -> small -> mid, with a tiny second star blinking off-beat.
const SPARK_FRAMES = {
  big: [
    '.....g.....',
    '.....g.....',
    '.....g.....',
    '....gyg....',
    '...gyyyg...',
    'gggyywyyggg',
    '...gyyyg...',
    '....gyg....',
    '.....g.....',
    '.....g.....',
    '.....g.....',
  ],
  mid: [
    '...........',
    '...........',
    '.....g.....',
    '.....g.....',
    '....gyg....',
    '..ggywygg..',
    '....gyg....',
    '.....g.....',
    '.....g.....',
    '...........',
    '...........',
  ],
  small: [
    '...........',
    '...........',
    '...........',
    '...........',
    '.....g.....',
    '....gwg....',
    '.....g.....',
    '...........',
    '...........',
    '...........',
    '...........',
  ],
  twin: ['.g.', 'gwg', '.g.'],
}

const SPARK_AT = {
  big: [6, 1],
  mid: [6, 1],
  small: [6, 1],
  twin: [1, 12],
}

// grid offset of each frame
const SPARK_W = 18,
  SPARK_H = 16

const STAR_VIEW = '5 0 13 13'

// the main star + outline
const SPARK_COLOR = {
  line: '#b07818',
  g: '#f4bf3a',
  y: '#ffe9a3',
  w: '#ffffff',
}

const cellPath = (cells) => cells.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join('')

const SPARK_PATHS = Object.fromEntries(
  Object.entries(SPARK_FRAMES).map(([name, rows]) => {
    const [ox, oy] = SPARK_AT[name]
    const by = {
        g: [],
        y: [],
        w: [],
      },
      on = new Set()
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (!by[ch]) return
        by[ch].push([ox + x, oy + y])
        on.add(ox + x + ',' + (oy + y))
      }),
    )
    const line = new Map()
    for (const key of on) {
      const [x, y] = key.split(',').map(Number)
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const k = x + dx + ',' + (y + dy)
        if (!on.has(k)) line.set(k, [x + dx, y + dy])
      }
    }
    return [
      name,
      {
        line: cellPath([...line.values()]),
        g: cellPath(by.g),
        y: cellPath(by.y),
        w: cellPath(by.w),
      },
    ]
  }),
)

// unit = screen px per sparkle pixel. `still` shows just the big star (no twinkle);
// `inline` sits in a line of text instead of the sprite's top-right corner.
export function PixelSparkle({
  unit = 1,
  inline = false,
  still = false,
  twin = !inline && !still,
  title,
  style,
}) {
  const frames = still ? ['big'] : twin ? ['big', 'mid', 'small', 'twin'] : ['big', 'mid', 'small']
  const [view, w, hgt] = twin
    ? [`0 0 ${SPARK_W} ${SPARK_H}`, SPARK_W, SPARK_H]
    : [STAR_VIEW, 13, 13]
  return (
    <span
      className={'px-spark' + (inline ? ' inline' : '') + (still ? ' still' : '')}
      title={title}
      aria-label={title}
      role={title ? 'img' : undefined}
      style={{
        width: w * unit,
        height: hgt * unit,
        ...style,
      }}
    >
      <svg
        width={w * unit}
        height={hgt * unit}
        viewBox={view}
        aria-hidden={true}
        shapeRendering="crispEdges"
      >
        {frames.map((name) => (
          <g key={name} className={'f-' + name}>
            {['line', 'g', 'y', 'w'].map((c) =>
              SPARK_PATHS[name][c] ? (
                <path key={c} d={SPARK_PATHS[name][c]} fill={SPARK_COLOR[c]} />
              ) : null,
            )}
          </g>
        ))}
      </svg>
    </span>
  )
}
