export function Toast({ msg }) {
  return (
    <div
      className="fade-in"
      style={{
        position: 'absolute',
        bottom: 18,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        background: 'var(--sage-deep)',
        color: '#fff',
        fontFamily: "'Silkscreen'",
        fontSize: 11,
        padding: '10px 18px',
        borderRadius: 10,
        border: '2px solid #fff',
        boxShadow: '0 4px 0 rgba(124,90,61,.25)',
        whiteSpace: 'nowrap',
      }}
    >
      {msg}
    </div>
  )
}
