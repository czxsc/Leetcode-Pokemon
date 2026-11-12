import { useRef, useState } from 'react'
import * as Catalog from '../../../shared/catalog'
import { store, useStore } from '../../state/store'
import { hintStyle } from './shared'

// ---------- problem editor ----------
export function ProblemEditor({ problem, defaultTag, onClose, onSaved }) {
  const st = useStore()
  const [start] = useState(() => ({
    title: problem ? problem.title : '',
    difficulty: problem ? problem.difficulty : 'Medium',
    tags: problem ? problem.tags : defaultTag ? [defaultTag] : [],
    language: problem ? problem.language : st.preferredLanguage,
    url: problem ? problem.url : '',
    code: problem ? problem.code : '',
  }))
  const [title, setTitle] = useState(start.title)
  const [difficulty, setDifficulty] = useState(start.difficulty)
  const [tags, setTags] = useState(start.tags)
  const [newTags, setNewTags] = useState([]) // typed here; created on save
  const [tagDraft, setTagDraft] = useState('')
  const [language, setLanguage] = useState(start.language)
  const [url, setUrl] = useState(start.url)
  const [code, setCode] = useState(start.code)
  const [lookup, setLookup] = useState(null) // { busy } | { ok, text } while finding on LeetCode
  const lookupSeq = useRef(0)
  const allTags = store.tags().concat(newTags)
  const slug = Catalog.slugify(title)
  const clash = slug
    ? st.problems.find((p) => p.id !== (problem && problem.id) && Catalog.slugify(p.title) === slug)
    : null
  const canSave = !!title.trim() && !clash
  const lang = Catalog.languageById(language)
  const dirty =
    JSON.stringify({
      title,
      difficulty,
      tags,
      language,
      url,
      code,
    }) !== JSON.stringify(start)
  function toggleTag(id) {
    setTags(tags.includes(id) ? tags.filter((t) => t !== id) : [...tags, id])
  }
  function addDraftTag() {
    const name = Catalog.oneLine(tagDraft).slice(0, 40)
    const id = Catalog.slugify(name, 40)
    if (!id) return
    if (!allTags.some((t) => t.id === id))
      setNewTags([
        ...newTags,
        {
          id,
          name,
          custom: true,
        },
      ])
    if (!tags.includes(id)) setTags([...tags, id])
    setTagDraft('')
  }
  // Fill in title, difficulty and tags from a LeetCode link. PokéLeet's
  // server does the asking (LeetCode blocks calls from other pages), so it
  // works in the local and cloud apps but not the browser-only demo.
  async function find(link) {
    const leetSlug = Catalog.leetcodeSlug(link)
    if (!leetSlug) {
      setLookup({
        ok: false,
        text: 'Enter a LeetCode problem link, like https://leetcode.com/problems/two-sum/',
      })
      return
    }
    if (store.saveStatus().mode === 'browser') {
      setLookup({
        ok: false,
        text: 'Find needs the full version of PokéLeet (it asks LeetCode through your local server). Fill the details in by hand here.',
      })
      return
    }
    const seq = ++lookupSeq.current
    setLookup({
      busy: true,
      text: 'Looking it up on LeetCode…',
    })
    let q
    try {
      q = await store.lookupProblem(leetSlug)
    } catch (err) {
      if (seq === lookupSeq.current) setLookup({ ok: false, text: err.message })
      return
    }
    if (seq !== lookupSeq.current) return
    const found = []
    for (const topic of q.tags) {
      const t = Catalog.leetcodeTopicTag(topic)
      if (t.id && !found.some((f) => f.id === t.id)) found.push(t)
    }
    const known = store.tags()
    const created = found
      .filter((t) => !known.some((k) => k.id === t.id))
      .map((t) => ({
        ...t,
        custom: true,
      }))
    setTitle(q.title.slice(0, 120))
    if (Catalog.DIFFICULTIES.includes(q.difficulty)) setDifficulty(q.difficulty)
    setUrl(q.url)
    setTags(found.map((t) => t.id))
    setNewTags((prev) => prev.concat(created.filter((t) => !prev.some((p) => p.id === t.id))))
    const extra = [
      created.length
        ? `${created.length} new tag${created.length === 1 ? '' : 's'} (${created.map((t) => t.name).join(', ')}) will be added when you save`
        : '',
      q.paidOnly ? 'this is a Premium problem' : '',
    ]
      .filter(Boolean)
      .join('; ')
    setLookup({
      ok: true,
      text: `Found #${q.number} ${q.title}${extra ? ' — ' + extra : ''}.`,
    })
  }
  function onUrlPaste(ev) {
    const text = ev.clipboardData && ev.clipboardData.getData('text')
    if (Catalog.leetcodeSlug(text)) find(text)
  }
  function save() {
    if (!canSave) return
    const ids = tags
      .filter((id) => allTags.some((t) => t.id === id))
      .map((id) => {
        const created = newTags.find((t) => t.id === id)
        return created ? store.addTag(created.name) : id
      })
      .filter(Boolean)
    const fields = {
      title,
      difficulty,
      tags: ids,
      language,
      url,
      code,
    }
    if (problem) {
      store.updateProblem(problem.id, fields)
      onSaved(problem.id)
    } else onSaved(store.createProblem(fields))
  }
  function cancel() {
    if (!dirty || window.confirm('Discard your changes to this problem?')) onClose()
  }
  function onCodeKey(ev) {
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault()
      save()
      return
    }
    if (ev.key !== 'Tab' || ev.shiftKey) return
    ev.preventDefault()
    const el = ev.target,
      from = el.selectionStart,
      to = el.selectionEnd
    setCode(code.slice(0, from) + '    ' + code.slice(to))
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = from + 4
    })
  }
  const folders = tags.length ? tags : [Catalog.UNTAGGED_FOLDER]
  const fileName = (slug || 'problem-name') + '.' + lang.ext
  const where = !code.trim()
    ? 'No solution yet? Save it anyway and it stays on your list as a to-do.'
    : store.saveStatus().mode !== 'local'
      ? 'In the full version (clone it from GitHub), your solution is also saved as a file in a folder for each tag.'
      : [
          'Your solution will be saved to ',
          <b key="p">{'solutions/' + folders[0] + '/' + fileName}</b>,
          folders.length > 1
            ? ` and ${folders.length - 1} more tag folder${folders.length === 2 ? '' : 's'}.`
            : '.',
        ]
  return (
    <div className="modal-veil">
      <div className="panel modal editor" onClick={(ev) => ev.stopPropagation()}>
        <button className="modal-x" title="Close" onClick={cancel}>
          ×
        </button>
        <div className="panel-title">
          <span className="dot" />
          {problem ? 'Edit Problem' : 'New Problem'}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 12,
          }}
        >
          <div
            className="field"
            style={{
              flex: 1,
            }}
          >
            <label>Title</label>
            <input
              value={title}
              autoFocus={!problem}
              maxLength={120}
              placeholder="e.g. Two Sum"
              onChange={(ev) => setTitle(ev.target.value)}
            />
          </div>
          <div className="field">
            <label>Difficulty</label>
            <div className="seg">
              {Catalog.DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={'seg-btn ' + d.toLowerCase() + (difficulty === d ? ' on' : '')}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
        {clash ? (
          <div className="form-error">{`You already have “${clash.title}” — edit that one instead.`}</div>
        ) : null}
        <div className="field">
          <label>LeetCode Link (optional)</label>
          <div
            style={{
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              value={url}
              placeholder="https://leetcode.com/problems/two-sum/"
              style={{
                flex: 1,
                minWidth: 0,
              }}
              onChange={(ev) => setUrl(ev.target.value)}
              onPaste={onUrlPaste}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter') {
                  ev.preventDefault()
                  find(url)
                }
              }}
            />
            <button
              className="btn"
              type="button"
              disabled={!url.trim() || !!(lookup && lookup.busy)}
              title="Fill in the title, difficulty and tags from LeetCode"
              onClick={() => find(url)}
            >
              {lookup && lookup.busy ? 'Finding…' : 'Find'}
            </button>
          </div>
          {lookup && !lookup.busy ? (
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: lookup.ok ? 'var(--sage-deep)' : 'var(--hard)',
              }}
            >
              {(lookup.ok ? '✔ ' : '✖ ') + lookup.text}
            </div>
          ) : null}
        </div>
        <div className="field">
          <label>Tags</label>
          <div className="tag-picker">
            {allTags.map((t) => (
              <button
                key={t.id}
                type="button"
                className={'tag-toggle' + (tags.includes(t.id) ? ' on' : '')}
                onClick={() => toggleTag(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 6,
            }}
          >
            <input
              value={tagDraft}
              maxLength={40}
              placeholder="New tag…"
              style={{
                flex: 1,
              }}
              onChange={(ev) => setTagDraft(ev.target.value)}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter') {
                  ev.preventDefault()
                  addDraftTag()
                }
              }}
            />
            <button
              className="iconbtn"
              type="button"
              disabled={!Catalog.slugify(tagDraft, 40)}
              onClick={addDraftTag}
            >
              + Add Tag
            </button>
          </div>
        </div>
        <div className="field">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <label htmlFor="solution-code">Solution</label>
            <select
              value={language}
              title="Language"
              aria-label="Language"
              style={{
                fontSize: 13,
                padding: '4px 6px',
              }}
              onChange={(ev) => setLanguage(ev.target.value)}
            >
              {Catalog.LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            id="solution-code"
            className="code-input"
            value={code}
            spellCheck={false}
            rows={7}
            placeholder="Paste your accepted solution here…"
            onChange={(ev) => setCode(ev.target.value)}
            onKeyDown={onCodeKey}
          />
        </div>
        <div
          style={{
            ...hintStyle,
            marginBottom: 12,
          }}
        >
          {where}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              flex: 1,
              fontFamily: "'Silkscreen'",
              fontSize: 8,
              color: 'var(--ink-faint)',
            }}
          >
            Ctrl+Enter to save
          </span>
          <button className="btn" onClick={cancel}>
            Cancel
          </button>
          <button className="btn green" disabled={!canSave} onClick={save}>
            {problem ? 'Save' : 'Add Problem'}
          </button>
        </div>
      </div>
    </div>
  )
}
