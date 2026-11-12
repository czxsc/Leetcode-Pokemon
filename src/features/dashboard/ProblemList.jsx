import { useEffect, useRef, useState } from 'react'
import * as Catalog from '../../../shared/catalog'
import { CodeBlock } from '../../components/CodeBlock'
import { Pokeball, Shard } from '../../components/icons'
import { todayLocal } from '../../game/dates'
import { isSolved } from '../../game/derived'
import { SHARD_BY_DIFF } from '../../game/rules'
import { store, useStore } from '../../state/store'
import { ProblemEditor } from './ProblemEditor'
import { ellipsis, scrollBody } from './shared'

// ---------- CENTER: problem list ----------
function ProblemRow({ p, open, onToggle, onEdit, hideTag, tagById }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const headRef = useRef(null)
  // e.g. a problem you just added: bring it into view when it opens
  useEffect(() => {
    if (open && headRef.current)
      headRef.current.scrollIntoView({
        block: 'nearest',
      })
  }, [open])
  const solved = isSolved(p)
  const hasCode = !!p.code.trim()
  const amount = SHARD_BY_DIFF[p.difficulty]
  const lang = Catalog.languageById(p.language)
  const tagNames = p.tags
    .filter((id) => id !== hideTag && tagById[id])
    .map((id) => tagById[id].name)
  const paths = store.saveStatus().mode === 'local' ? store.solutionPaths(p.id) : []
  return (
    <div className={'prow' + (open ? ' open' : '') + (solved ? '' : ' unsolved')}>
      <div
        ref={headRef}
        className="prow-head"
        style={{
          cursor: 'pointer',
        }}
        onClick={onToggle}
      >
        <span
          className="prow-check"
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 11,
            color: solved ? 'var(--sage-deep)' : 'var(--ink-faint)',
            width: 14,
          }}
        >
          {solved ? '✔' : '○'}
        </span>
        <span className="nm" title={p.title}>
          {p.title}
          {solved ? null : <span className="lock">· to do</span>}
        </span>
        {tagNames.slice(0, 2).map((n) => (
          <span key={n} className="tag-chip">
            {n}
          </span>
        ))}
        {tagNames.length > 2 ? (
          <span className="tag-chip" title={tagNames.slice(2).join(', ')}>
            {'+' + (tagNames.length - 2)}
          </span>
        ) : null}
        {p.claimed ? (
          <Shard
            size={15}
            style={{
              marginRight: 2,
            }}
          />
        ) : null}
        <span className={'pill ' + p.difficulty.toLowerCase()}>{p.difficulty}</span>
        <span
          className="prow-arrow"
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 12,
            color: 'var(--ink-faint)',
            width: 14,
            textAlign: 'center',
          }}
        >
          {open ? '▾' : '▸'}
        </span>
      </div>
      {open ? (
        <div className="code-wrap fade-in">
          {hasCode ? (
            <CodeBlock code={p.code} language={p.language} />
          ) : (
            <div className="code-empty">
              <div>
                {solved
                  ? 'Marked solved, but no solution is saved for it yet.'
                  : 'No solution yet — paste yours to mark this problem solved and unlock its Shard reward.'}
              </div>
              <button
                className="btn lav"
                style={{
                  fontSize: 10,
                  padding: '7px 12px',
                  marginTop: 10,
                }}
                onClick={onEdit}
              >
                + Add Solution
              </button>
            </div>
          )}
          {solved ? (
            <div className="code-bar">
              <button
                className={'coin' + (p.claimed ? ' claimed' : '')}
                title={p.claimed ? 'Claimed' : 'Claim reward'}
                onClick={() => store.claimProblem(p.id)}
              >
                {p.claimed ? '♦' : '?'}
              </button>
              <span className="earn">
                {p.claimed ? 'Shards claimed · +1 EXP to team' : `Claim +${amount} Shards`}
              </span>
              <span
                style={{
                  fontFamily: "'Silkscreen'",
                  fontSize: 9,
                  color: 'var(--shard-lite)',
                }}
              >
                Solved
              </span>
              <input
                type="date"
                value={p.solvedAt || ''}
                max={todayLocal()}
                onChange={(ev) => store.setSolveDate(p.id, ev.target.value)}
                title="Date this problem was solved — feeds your Training Log"
                style={{
                  fontFamily: "'Silkscreen'",
                  fontSize: 11,
                  padding: '4px 6px',
                  borderRadius: 6,
                  border: '2px solid var(--lav-deep)',
                  background: '#efeaf6',
                  color: '#3a3147',
                  colorScheme: 'light',
                }}
              />
            </div>
          ) : null}
          <div className="code-meta">
            <span className="lang">{lang.name}</span>
            {paths.length ? (
              <span className="path" title={paths.map((x) => 'solutions/' + x).join('\n')}>
                {'solutions/' + paths[0] + (paths.length > 1 ? `  +${paths.length - 1} more` : '')}
              </span>
            ) : null}
            <span
              style={{
                flex: 1,
              }}
            />
            {p.url ? (
              <a className="meta-btn" href={p.url} target="_blank" rel="noopener noreferrer">
                Open ↗
              </a>
            ) : null}
            {confirmDelete
              ? [
                  <span key="q" className="lang">
                    Delete?
                  </span>,
                  <button
                    key="y"
                    className="meta-btn danger"
                    onClick={() => store.deleteProblem(p.id)}
                  >
                    Yes
                  </button>,
                  <button key="n" className="meta-btn" onClick={() => setConfirmDelete(false)}>
                    No
                  </button>,
                ]
              : [
                  <button key="e" className="meta-btn" onClick={onEdit}>
                    Edit
                  </button>,
                  <button
                    key="d"
                    className="meta-btn danger"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete
                  </button>,
                ]}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function EmptyList({ tag, diff, query, onNew }) {
  const st = useStore()
  let text
  if (query) text = `No problems match “${query}”.`
  else if (st.problems.length && tag) text = `Nothing tagged ${tag.name} yet.`
  else if (st.problems.length && diff) text = `No ${diff} problems yet.`
  else
    text =
      'No problems yet! Solved something on LeetCode? Add it here with your solution and claim Shards to summon new friends.'
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '40px 24px',
        color: 'var(--ink-faint)',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          marginBottom: 12,
        }}
      >
        <Pokeball size={40} />
      </div>
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.5,
          maxWidth: 360,
          margin: '0 auto 16px',
        }}
      >
        {text}
      </div>
      {query ? null : (
        <button className="btn green" onClick={onNew}>
          + New Problem
        </button>
      )}
    </div>
  )
}

export function ProblemList({ by, sel }) {
  const st = useStore()
  const tags = store.tags()
  const tagById = Object.fromEntries(tags.map((t) => [t.id, t]))
  const tag = by === 'tag' ? tagById[sel] || null : null
  const diff = by === 'difficulty' && Catalog.DIFFICULTIES.includes(sel) ? sel : null
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)
  const [modal, setModal] = useState(null) // { problem? }
  const inView = tag
    ? st.problems.filter((p) => p.tags.includes(tag.id))
    : diff
      ? st.problems.filter((p) => p.difficulty === diff)
      : st.problems
  const q = query.trim().toLowerCase()
  const probs = (q ? inView.filter((p) => p.title.toLowerCase().includes(q)) : inView)
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  const solvedN = inView.filter(isSolved).length
  const openEditor = (problem) =>
    setModal({
      problem,
    })
  // Claim All covers every solved problem, not just the ones in this view
  const ready = st.problems.filter((p) => isSolved(p) && !p.claimed)
  const readyShards = ready.reduce((n, p) => n + (SHARD_BY_DIFF[p.difficulty] || 0), 0)
  return (
    <div className="panel card dash-col dash-list">
      {modal ? (
        <ProblemEditor
          problem={modal.problem}
          defaultTag={tag && tag.id}
          onClose={() => setModal(null)}
          onSaved={(id) => {
            setModal(null)
            setOpenId(id)
          }}
        />
      ) : null}
      <div className="plist-head">
        <div className="plist-title">
          <div
            className="pixel-font"
            style={{
              fontSize: 17,
              color: 'var(--wood-dark)',
              ...ellipsis,
            }}
          >
            {tag ? tag.name : diff ? diff + ' Problems' : 'All Problems'}
          </div>
          <div
            style={{
              fontSize: 14,
              color: 'var(--ink-faint)',
              marginTop: 3,
            }}
          >{`${solvedN} solved · ${inView.length} total`}</div>
        </div>
        <input
          className="search-input"
          value={query}
          placeholder="Search…"
          onChange={(ev) => setQuery(ev.target.value)}
        />
        <button className="iconbtn" onClick={() => openEditor(null)}>
          + New Problem
        </button>
        <button
          className="iconbtn"
          disabled={!ready.length}
          onClick={() => store.claimAllProblems()}
          title={
            ready.length
              ? `Claim Shards for all ${ready.length} solved problem${ready.length === 1 ? '' : 's'}`
              : 'No rewards to claim'
          }
        >
          Claim All
          {ready.length ? [' · ', <Shard key="s" size={12} />, readyShards.toLocaleString()] : null}
        </button>
      </div>
      <div style={scrollBody}>
        {probs.length === 0 ? (
          <EmptyList tag={tag} diff={diff} query={query.trim()} onNew={() => openEditor(null)} />
        ) : (
          [
            ...probs.map((p) => (
              <ProblemRow
                key={p.id}
                p={p}
                tagById={tagById}
                hideTag={tag && tag.id}
                open={openId === p.id}
                onToggle={() => setOpenId(openId === p.id ? null : p.id)}
                onEdit={() => openEditor(p)}
              />
            )),
            <div
              key="end"
              style={{
                textAlign: 'center',
                padding: '12px 0 4px',
                fontFamily: "'Silkscreen'",
                fontSize: 9,
                color: 'var(--ink-faint)',
              }}
            >
              — end of list —
            </div>,
          ]
        )}
      </div>
    </div>
  )
}
