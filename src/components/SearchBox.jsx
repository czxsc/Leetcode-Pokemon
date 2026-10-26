// full-width search field for pickers: magnifier on the left, × to clear once there's text
export function SearchBox({ value, onChange, placeholder, autoFocus }) {
  return (
    <div className="search-box">
      <svg
        className="search-box-icon"
        width={14}
        height={14}
        viewBox="0 0 14 14"
        aria-hidden={true}
        shapeRendering="crispEdges"
      >
        <rect x={2} y={0} width={6} height={2} />
        <rect x={2} y={8} width={6} height={2} />
        <rect x={0} y={2} width={2} height={6} />
        <rect x={8} y={2} width={2} height={6} />
        <rect x={9} y={9} width={2} height={2} />
        <rect x={11} y={11} width={3} height={3} />
      </svg>
      <input
        className="search-input"
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(ev) => onChange(ev.target.value)}
        onKeyDown={(ev) => {
          if (ev.key === 'Escape' && value) {
            ev.stopPropagation()
            onChange('')
          }
        }}
      />
      {value ? (
        <button className="search-box-clear" aria-label="Clear search" onClick={() => onChange('')}>
          ×
        </button>
      ) : null}
    </div>
  )
}
