import * as Catalog from '../../../shared/catalog'
import * as D from '../../game/derived'
import { store, useStore } from '../../state/store'
import { ALL, colStyle, ellipsis, scrollBody } from './shared'

// ---------- LEFT: tag menu (new tags are added from the problem editor) ----------
function TagItem({ item, active, onSelect, onDelete }) {
  return (
    <button
      className={'cat-item' + (active ? ' active' : '') + (item.count ? '' : ' empty')}
      onClick={onSelect}
      style={{
        width: '100%',
        textAlign: 'left',
        background: active ? undefined : 'transparent',
        border: '2px solid ' + (active ? 'var(--sage-deep)' : 'transparent'),
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span className="cname" style={ellipsis}>
            {item.name}
          </span>
          {item.custom ? (
            <span
              className="type-tag"
              style={{
                background: 'var(--lav)',
                color: '#fff',
                fontSize: 7,
                padding: '1px 4px',
              }}
            >
              MINE
            </span>
          ) : null}
          <span
            className="ccount"
            style={{
              marginLeft: 'auto',
            }}
          >
            {item.solved + '/' + item.count}
          </span>
        </div>
        <div
          className="minibar"
          style={{
            marginTop: 5,
          }}
        >
          <i
            style={{
              width: item.pct * 100 + '%',
              background: item.color,
            }}
          />
        </div>
      </div>
      {onDelete ? (
        <span
          title="Delete tag"
          onClick={(ev) => {
            ev.stopPropagation()
            onDelete()
          }}
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 12,
            color: 'var(--ink-faint)',
            cursor: 'pointer',
            padding: '0 2px',
          }}
        >
          ×
        </span>
      ) : null}
    </button>
  )
}

// one menu row's numbers for a subset of problems
function menuItem(id, name, probs, extra) {
  const solved = probs.filter(D.isSolved).length
  return {
    id,
    name,
    solved,
    count: probs.length,
    pct: probs.length ? solved / probs.length : 0,
    ...extra,
  }
}

export function TagMenu({ by, setBy, sel, setSel }) {
  const st = useStore() // re-render when tags/problems change
  const stats = D.tagStats(st)
  const all = menuItem(ALL, 'All Problems', st.problems)
  const diffs = Catalog.DIFFICULTIES.map((d) =>
    menuItem(
      d,
      d,
      st.problems.filter((p) => p.difficulty === d),
      {
        color: 'var(--' + d.toLowerCase() + ')',
      },
    ),
  )
  const pickBy = (next) => {
    if (next !== by) {
      setBy(next)
      setSel(ALL)
    }
  }
  function removeTag(tag) {
    const note = tag.count
      ? ` It will be removed from ${tag.count} problem${tag.count === 1 ? '' : 's'} (the problems stay).`
      : ''
    if (!window.confirm(`Delete the tag "${tag.name}"?${note}`)) return
    if (sel === tag.id) setSel(ALL)
    store.removeTag(tag.id)
  }
  return (
    <div className="panel" style={colStyle}>
      <div className="panel-title">
        <span className="dot" />
        {by === 'tag' ? 'Tags' : 'Difficulty'}
      </div>
      <div
        className="seg seg-mini"
        style={{
          marginBottom: 10,
        }}
      >
        {[
          ['tag', 'By Tag'],
          ['difficulty', 'By Difficulty'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={'seg-btn' + (by === id ? ' on' : '')}
            onClick={() => pickBy(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={scrollBody}>
        <TagItem item={all} active={sel === ALL} onSelect={() => setSel(ALL)} />
        <div
          style={{
            height: 1,
            background: 'var(--card-line)',
            margin: '4px 6px 8px',
          }}
        />
        {by === 'tag'
          ? stats.map((c) => (
              <TagItem
                key={c.id}
                item={c}
                active={sel === c.id}
                onSelect={() => setSel(c.id)}
                onDelete={c.custom ? () => removeTag(c) : null}
              />
            ))
          : diffs.map((d) => (
              <TagItem key={d.id} item={d} active={sel === d.id} onSelect={() => setSel(d.id)} />
            ))}
      </div>
    </div>
  )
}
