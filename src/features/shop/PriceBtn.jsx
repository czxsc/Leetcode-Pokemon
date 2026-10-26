import { Coin } from '../../components/icons'

// A Shop buy button showing the item's price in Coins.
export function PriceBtn({ item, disabled, onClick, label }) {
  return (
    <button
      className={'btn ' + item.btn}
      disabled={disabled}
      style={{
        fontSize: 11,
      }}
      onClick={onClick}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        {label ? label + ' ·' : null}
        <Coin size={13} />
        {item.price.toLocaleString()}
      </span>
    </button>
  )
}
