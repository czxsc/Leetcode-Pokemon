/* =====================================================================
   Dashboard page — left tag menu / center problem list (create, edit,
   paste solutions, claim rewards) / right trainer card with power,
   streak commit grid and strong-weak topics.
===================================================================== */
;(function () {
  const { useEffect, useRef, useState } = React
  const Catalog = window.Catalog
  const ALL = '__all'
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // ---------- layout constants ----------
  const colStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  }
  const scrollBody = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingRight: 4,
  }
  const hintStyle = {
    fontSize: 13,
    color: 'var(--ink-faint)',
    lineHeight: 1.5,
    marginBottom: 14,
  }
  const ellipsis = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

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
    const solved = probs.filter(window.Store.isSolved).length
    return {
      id,
      name,
      solved,
      count: probs.length,
      pct: probs.length ? solved / probs.length : 0,
      ...extra,
    }
  }
  function TagMenu({ by, setBy, sel, setSel }) {
    const st = window.useStore() // re-render when tags/problems change
    const stats = window.Derived.tagStats()
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
      window.Store.removeTag(tag.id)
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

  // ---------- problem editor ----------
  function ProblemEditor({ problem, defaultTag, onClose, onSaved }) {
    const st = window.useStore()
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
    const allTags = window.Store.tags().concat(newTags)
    const slug = Catalog.slugify(title)
    const clash = slug
      ? st.problems.find(
          (p) => p.id !== (problem && problem.id) && Catalog.slugify(p.title) === slug,
        )
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
    // Fill in title, difficulty and tags from a LeetCode link. The local
    // server does the asking (LeetCode blocks calls from other pages), so
    // it only works in the full version.
    async function find(link) {
      const leetSlug = Catalog.leetcodeSlug(link)
      if (!leetSlug) {
        setLookup({
          ok: false,
          text: 'Enter a LeetCode problem link, like https://leetcode.com/problems/two-sum/',
        })
        return
      }
      if (window.Persistence.mode !== 'disk') {
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
        const res = await fetch('/api/leetcode?slug=' + encodeURIComponent(leetSlug), {
          headers: {
            Accept: 'application/json',
          },
        })
        const body = await res.json().catch(() => null)
        if (!res.ok || !body || !body.problem)
          throw new Error((body && body.error) || `Lookup failed (HTTP ${res.status}).`)
        q = body.problem
      } catch (err) {
        if (seq === lookupSeq.current)
          setLookup({
            ok: false,
            text:
              err instanceof TypeError
                ? 'Couldn’t reach the PokéLeet server — is it still running?'
                : err.message,
          })
        return
      }
      if (seq !== lookupSeq.current) return
      const found = []
      for (const topic of q.tags) {
        const t = Catalog.leetcodeTopicTag(topic)
        if (t.id && !found.some((f) => f.id === t.id)) found.push(t)
      }
      const known = window.Store.tags()
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
          return created ? window.Store.addTag(created.name) : id
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
        window.Store.updateProblem(problem.id, fields)
        onSaved(problem.id)
      } else onSaved(window.Store.createProblem(fields))
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
      : window.Persistence.mode !== 'disk'
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

  // ---------- data / backups ----------
  function DataModal({ onClose }) {
    const status = window.usePersistenceStatus()
    const [msg, setMsg] = useState(null)
    const fileRef = useRef(null)
    const disk = status.mode === 'disk'
    function exportBackup() {
      try {
        const blob = new Blob([window.Store.exportData()], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pokeleet-backup-${window.Store.TODAY}.json`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        setMsg({
          ok: true,
          text: 'Backup exported — it has your problems, solutions and game progress.',
        })
      } catch (err) {
        setMsg({
          ok: false,
          text: err.message || 'Could not export backup.',
        })
      }
    }
    function importBackup(ev) {
      const file = ev.target.files && ev.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          window.Store.importData(String(reader.result || ''))
          setMsg({
            ok: true,
            text: 'Backup imported successfully.',
          })
        } catch (err) {
          setMsg({
            ok: false,
            text: err.message || 'Could not import backup.',
          })
        }
      }
      reader.onerror = () =>
        setMsg({
          ok: false,
          text: 'Could not read the selected backup file.',
        })
      reader.readAsText(file)
      ev.target.value = ''
    }
    function askImport() {
      if (
        window.confirm('Importing a backup replaces your current problems and progress. Continue?')
      )
        fileRef.current && fileRef.current.click()
    }
    const saved = status.savedAt ? new Date(status.savedAt).toLocaleTimeString() : null
    return (
      <div className="modal-veil" onClick={onClose}>
        <div className="panel modal" onClick={(ev) => ev.stopPropagation()}>
          <div className="panel-title">
            <span className="dot" />
            Your Data
          </div>
          <div
            className="chip-card"
            style={{
              padding: '12px 14px',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 11,
                color: status.state === 'saved' ? 'var(--sage-deep)' : 'var(--hard)',
                marginBottom: 8,
              }}
            >
              {status.state !== 'saved'
                ? '✖ Not saving right now'
                : disk
                  ? '✔ Saved to disk automatically'
                  : '✔ Saved in this browser (demo)'}
            </div>
            {disk ? (
              <div>
                <div className="data-path">{status.location}</div>
                <div
                  style={{
                    ...hintStyle,
                    marginBottom: 0,
                    marginTop: 8,
                  }}
                >
                  {
                    'progress.json and library.json hold everything. Solved problems are also written to '
                  }
                  <b>{'solutions/<tag>/'}</b>
                  {' — one folder per tag — and a daily copy of your data is kept in '}
                  <b>backups/</b>.
                </div>
              </div>
            ) : (
              <div
                style={{
                  ...hintStyle,
                  marginBottom: 0,
                }}
              >
                {
                  'This is the online demo, so your progress is kept in this browser only. To save progress and a folder of your solutions on your own computer, clone PokéLeet from '
                }
                {window.AppConfig.repoUrl ? (
                  <a href={window.AppConfig.repoUrl} target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                ) : (
                  'GitHub'
                )}
                {' and run it with '}
                <b>npm start</b>.
              </div>
            )}
            {saved ? (
              <div
                style={{
                  fontFamily: "'Silkscreen'",
                  fontSize: 8,
                  color: 'var(--ink-faint)',
                  marginTop: 8,
                }}
              >
                {'last saved ' + saved}
              </div>
            ) : null}
            {status.error ? (
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--hard)',
                  marginTop: 8,
                }}
              >
                {status.error}
              </div>
            ) : null}
          </div>
          <div style={hintStyle}>
            Backups are a single JSON file you can keep anywhere or import on another computer.
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 14,
              flexWrap: 'wrap',
            }}
          >
            <button className="btn" type="button" onClick={exportBackup}>
              Export Backup
            </button>
            <button className="btn" type="button" onClick={askImport}>
              Import Backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={importBackup}
              style={{
                display: 'none',
              }}
            />
          </div>
          {msg ? (
            <div
              style={{
                fontSize: 13,
                color: msg.ok ? 'var(--sage-deep)' : 'var(--hard)',
                marginBottom: 12,
                fontFamily: "'Silkscreen'",
                lineHeight: 1.5,
              }}
            >
              {(msg.ok ? '✔ ' : '✖ ') + msg.text}
            </div>
          ) : null}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button className="btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

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
    const solved = window.Store.isSolved(p)
    const hasCode = !!p.code.trim()
    const amount = window.DATA.SHARD_BY_DIFF[p.difficulty]
    const lang = Catalog.languageById(p.language)
    const tagNames = p.tags
      .filter((id) => id !== hideTag && tagById[id])
      .map((id) => tagById[id].name)
    const paths = window.Persistence.mode === 'disk' ? window.Store.solutionPaths(p.id) : []
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
                  onClick={() => window.Store.claimProblem(p.id)}
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
                  max={window.Store.TODAY}
                  onChange={(ev) => window.Store.setSolveDate(p.id, ev.target.value)}
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
                  {'solutions/' +
                    paths[0] +
                    (paths.length > 1 ? `  +${paths.length - 1} more` : '')}
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
                      onClick={() => window.Store.deleteProblem(p.id)}
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
    const st = window.useStore()
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
  function ProblemList({ by, sel }) {
    const st = window.useStore()
    const tags = window.Store.tags()
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
    const solvedN = inView.filter(window.Store.isSolved).length
    const openEditor = (problem) =>
      setModal({
        problem,
      })
    // Claim All covers every solved problem, not just the ones in this view
    const ready = st.problems.filter((p) => window.Store.isSolved(p) && !p.claimed)
    const readyShards = ready.reduce(
      (n, p) => n + (window.DATA.SHARD_BY_DIFF[p.difficulty] || 0),
      0,
    )
    return (
      <div className="panel card" style={colStyle}>
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
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
            onClick={() => window.Store.claimAllProblems()}
            title={
              ready.length
                ? `Claim Shards for all ${ready.length} solved problem${ready.length === 1 ? '' : 's'}`
                : 'No rewards to claim'
            }
          >
            Claim All
            {ready.length
              ? [' · ', <Shard key="s" size={12} />, readyShards.toLocaleString()]
              : null}
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

  // ---------- RIGHT: trainer card ----------
  function CommitGrid() {
    const { grid } = window.Derived.trainingGrid(18)
    const lvl = (c) => (c <= 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : c === 3 ? 3 : 4)
    // month label above a column when its first in-range day starts a new month
    let lastMon = -1
    const monthRow = grid.map((wk, wi) => {
      const cell = wk.find((c) => c)
      let label = ''
      if (cell) {
        const mo = +cell.date.slice(5, 7) - 1
        if (mo !== lastMon) {
          label = MON[mo]
          lastMon = mo
        }
      }
      return (
        <div
          key={wi}
          style={{
            width: 13,
            fontFamily: "'Silkscreen'",
            fontSize: 7,
            color: 'var(--ink-faint)',
            textAlign: 'left',
          }}
        >
          {label}
        </div>
      )
    })
    const fmt = (d) => {
      const mo = +d.slice(5, 7) - 1,
        day = +d.slice(8, 10)
      return MON[mo] + ' ' + day
    }
    return (
      <div>
        <div
          style={{
            display: 'flex',
            gap: 2,
            marginBottom: 2,
            paddingLeft: 0,
          }}
        >
          {monthRow}
        </div>
        <div className="commit">
          {grid.map((wk, wi) => (
            <div className="wk" key={wi}>
              {wk.map((c, di) =>
                c ? (
                  <div
                    key={di}
                    className={'cl l' + lvl(c.count)}
                    title={
                      fmt(c.date) + (c.count ? '  ·  ' + c.count + ' solved' : '  ·  no solves')
                    }
                  />
                ) : (
                  <div
                    key={di}
                    className="cl"
                    style={{
                      opacity: 0,
                    }}
                  />
                ),
              )}
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            fontFamily: "'Silkscreen'",
            fontSize: 8,
            color: 'var(--ink-faint)',
          }}
        >
          less
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} className={'cl l' + l} />
          ))}
          more
          <span
            style={{
              marginLeft: 'auto',
            }}
          >
            hover a day
          </span>
        </div>
      </div>
    )
  }
  function TrainerName({ name }) {
    const [draft, setDraft] = useState(null) // null = not editing
    const skipBlur = useRef(false)
    if (draft === null) {
      return (
        <button
          className="trainer-name pixel-font"
          title="Rename your trainer"
          onClick={() => setDraft(name)}
        >
          {name}
          <span className="pencil">✎</span>
        </button>
      )
    }
    function commit() {
      if (skipBlur.current) {
        skipBlur.current = false
        return
      }
      window.Store.setTrainerName(draft)
      setDraft(null)
    }
    return (
      <input
        className="trainer-name-input"
        value={draft}
        autoFocus={true}
        maxLength={24}
        onChange={(ev) => setDraft(ev.target.value)}
        onBlur={commit}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter') ev.target.blur()
          if (ev.key === 'Escape') {
            skipBlur.current = true
            setDraft(null)
          }
        }}
      />
    )
  }
  function TrainerAvatar({ avatar, onMessage }) {
    const fileRef = useRef(null)
    async function pick(ev) {
      const file = ev.target.files && ev.target.files[0]
      ev.target.value = ''
      if (!file) return
      if (!/^image\//.test(file.type)) {
        onMessage('That file isn’t an image.')
        return
      }
      try {
        const dataUrl = await window.shrinkPhoto(file)
        onMessage(window.Store.setTrainerAvatar(dataUrl) ? null : 'Couldn’t use that image.')
      } catch (err) {
        onMessage(err.message || 'Couldn’t use that image.')
      }
    }
    return (
      <div className="trainer-avatar">
        <button
          type="button"
          className="avatar-upload"
          title="Upload a profile picture"
          aria-label="Upload a profile picture"
          onClick={() => fileRef.current && fileRef.current.click()}
        >
          <img
            src={avatar || (window.AppAssets && window.AppAssets.pokeAvatar)}
            alt="Trainer avatar"
            draggable={false}
            style={{
              imageRendering: avatar ? 'auto' : 'pixelated',
            }}
          />
          <span className="avatar-overlay" aria-hidden={true}>
            <svg
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 16V4" />
              <path d="M7 9l5-5 5 5" />
              <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
            </svg>
            <span className="avatar-overlay-label">upload</span>
          </span>
        </button>
        {avatar ? (
          <button
            type="button"
            className="avatar-reset"
            title="Use the default avatar"
            aria-label="Use the default avatar"
            onClick={() => {
              window.Store.setTrainerAvatar(null)
              onMessage(null)
            }}
          >
            ×
          </button>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={pick}
          style={{
            display: 'none',
          }}
        />
      </div>
    )
  }
  function TrainerCard() {
    const st = window.useStore()
    const D = window.Derived
    const [detail, setDetail] = useState(null)
    const [avatarMsg, setAvatarMsg] = useState(null)
    const [dataOpen, setDataOpen] = useState(false)
    const saveStatus = window.usePersistenceStatus()
    const power = D.teamPower()
    const mult = D.teamMultiplier()
    const streak = D.streakInfo()
    const counts = D.solvedCounts()
    const byId = Object.fromEntries(st.owned.map((o) => [o.iid, o]))
    const team = st.team.map((iid) => byId[iid]).filter(Boolean)
    const since = st.createdAt
      ? 'since ' + MON[+st.createdAt.slice(5, 7) - 1] + ' ' + st.createdAt.slice(0, 4)
      : ''

    // strongest = most solved; needs training = fewest solved (catalog order breaks ties)
    const stats = D.tagStats()
    const maxSolved = Math.max(1, ...stats.map((c) => c.solved))
    const strong = stats
      .filter((c) => c.solved > 0)
      .sort((a, b) => b.solved - a.solved)
      .slice(0, 3)
    const weak = stats
      .filter((c) => !strong.includes(c))
      .sort((a, b) => a.solved - b.solved)
      .slice(0, 3)
    const TopicRow = (c, kind) => (
      <div
        key={c.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 13,
            color: 'var(--ink)',
            ...ellipsis,
          }}
        >
          {c.name}
        </span>
        <div
          className="minibar"
          style={{
            width: 54,
          }}
        >
          <i
            style={{
              width: (c.solved / maxSolved) * 100 + '%',
              background: kind === 'weak' ? 'var(--medium)' : 'var(--sage-deep)',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 9,
            color: 'var(--ink-faint)',
            width: 30,
            textAlign: 'right',
          }}
        >
          {c.solved}
        </span>
      </div>
    )
    return (
      <div
        className="panel"
        style={{
          ...colStyle,
          gap: 0,
        }}
      >
        {detail ? <window.MonDetailModal iid={detail} onClose={() => setDetail(null)} /> : null}
        {dataOpen ? <DataModal onClose={() => setDataOpen(false)} /> : null}
        <div style={scrollBody}>
          {/* header */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              marginBottom: avatarMsg ? 6 : 12,
            }}
          >
            <TrainerAvatar avatar={st.trainer.avatar} onMessage={setAvatarMsg} />
            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <TrainerName name={st.trainer.name} />
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--ink-faint)',
                  marginTop: 3,
                }}
              >
                LeetCode Trainer
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--ink-faint)',
                  marginTop: 2,
                }}
              >
                {since}
              </div>
            </div>
          </div>
          {avatarMsg ? (
            <div
              className="form-error"
              style={{
                margin: '0 0 10px',
              }}
            >
              {'✖ ' + avatarMsg}
            </div>
          ) : null}
          {/* stat tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div
              className="stile"
              style={{
                gridColumn: '1 / -1',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  flex: 1,
                }}
              >
                <div className="lab">Team Fighting Power</div>
                <div
                  className="val"
                  style={{
                    fontSize: 24,
                  }}
                >
                  {power.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'Silkscreen'",
                  fontSize: 10,
                  color: 'var(--sage-deep)',
                  textAlign: 'right',
                }}
              >
                <div>{'×' + mult.toFixed(2)}</div>
                <div
                  style={{
                    color: 'var(--ink-faint)',
                    marginTop: 3,
                  }}
                >
                  team mult
                </div>
              </div>
            </div>
            <div className="stile">
              <div className="lab">Shards</div>
              <div
                className="val"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  color: 'var(--shard-deep)',
                }}
              >
                <Shard size={14} />
                {st.shards.toLocaleString()}
              </div>
            </div>
            <div className="stile">
              <div className="lab">Coins</div>
              <div
                className="val"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  color: 'var(--coin-deep)',
                }}
              >
                <Coin size={14} />
                {st.coins.toLocaleString()}
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 0,
            }}
          >
            <div
              className="stile"
              style={{
                flex: 1,
              }}
            >
              <div className="lab">Streak</div>
              <div
                className="val"
                style={{
                  fontSize: 14,
                }}
              >
                {streak.current + 'd'}
              </div>
              <div
                style={{
                  fontFamily: "'Silkscreen'",
                  fontSize: 8,
                  color: 'var(--ink-faint)',
                  marginTop: 2,
                }}
              >
                {'best ' + streak.best}
              </div>
            </div>
            <div
              className="stile"
              style={{
                flex: 1,
              }}
            >
              <div className="lab">Solved</div>
              <div
                className="val"
                style={{
                  fontSize: 14,
                }}
              >
                {counts.total}
              </div>
              <div
                style={{
                  fontFamily: "'Silkscreen'",
                  fontSize: 8,
                  color: 'var(--ink-faint)',
                  marginTop: 2,
                }}
              >{`${counts.easy}/${counts.med}/${counts.hard}`}</div>
            </div>
          </div>
          {/* team strip */}
          <div
            className="panel-title"
            style={{
              marginTop: 14,
              alignItems: 'center',
            }}
          >
            <span className="dot" />
            Active Team
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: "'Silkscreen'",
                fontSize: 8,
                color: 'var(--ink-faint)',
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              tap for details →
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 7,
              marginBottom: 6,
            }}
          >
            {team.map((m) => {
              const sp = window.PixelMon.byId(m.sp)
              const need = window.Derived.expToNext(m.level)
              const evoReady =
                (sp.evo || sp.id === 'eevee') && (m.copies || 0) >= window.PixelMon.EVO_COPIES
              const megaCap = window.PixelMon.canTransform(sp)
              return (
                <button
                  key={m.iid}
                  className="chip-card team-chip"
                  onClick={() => setDetail(m.iid)}
                  style={{
                    padding: '7px 4px 6px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    font: 'inherit',
                    width: '100%',
                  }}
                >
                  {evoReady ? (
                    <span
                      title="Ready to evolve"
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -5,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'var(--sage-deep)',
                        color: '#fff',
                        fontFamily: "'Silkscreen'",
                        fontSize: 9,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #fff',
                        boxShadow: '0 0 6px var(--sage)',
                      }}
                    >
                      ↑
                    </span>
                  ) : megaCap && !m.form ? (
                    <span
                      title="Can Mega-Evolve"
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -4,
                        width: 13,
                        height: 13,
                        borderRadius: '50%',
                        background: 'var(--lav)',
                        border: '2px solid #fff',
                      }}
                    />
                  ) : null}
                  <Creature inst={m} size={42} bob={true} />
                  <div
                    style={{
                      fontFamily: "'Silkscreen'",
                      fontSize: 8,
                      color: 'var(--ink)',
                      marginTop: 2,
                      ...ellipsis,
                    }}
                  >
                    {sp.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Silkscreen'",
                      fontSize: 8,
                      color: 'var(--ink-faint)',
                      marginBottom: 3,
                    }}
                  >
                    {'Lv' + m.level + ' · ⚔' + window.Derived.monPower(m)}
                  </div>
                  <div className="expbar">
                    <i
                      style={{
                        width: Math.round((m.exp / need) * 100) + '%',
                      }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
          {/* commit grid */}
          <div
            className="panel-title"
            style={{
              marginTop: 14,
            }}
          >
            <span className="dot" />
            Training Log
          </div>
          <div
            className="chip-card"
            style={{
              padding: '10px 10px 8px',
            }}
          >
            <CommitGrid />
          </div>
          {/* strong / weak */}
          <div
            className="panel-title"
            style={{
              marginTop: 14,
            }}
          >
            <span className="dot" />
            Strongest Topics
          </div>
          {strong.length ? (
            strong.map((c) => TopicRow(c, 'strong'))
          ) : (
            <div
              style={{
                fontSize: 13,
                color: 'var(--ink-faint)',
                marginBottom: 6,
              }}
            >
              Solve a few problems to see your best topics.
            </div>
          )}
          <div
            className="panel-title"
            style={{
              marginTop: 10,
            }}
          >
            <span
              className="dot"
              style={{
                background: 'var(--medium)',
              }}
            />
            Needs Training
          </div>
          {weak.map((c) => TopicRow(c, 'weak'))}
          {/* where the save lives, backups */}
          <div
            className="panel-title"
            style={{
              marginTop: 14,
            }}
          >
            <span
              className="dot"
              style={{
                background: 'var(--sky)',
              }}
            />
            Data
          </div>
          <div
            className="chip-card"
            style={{
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
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
                  fontFamily: "'Silkscreen'",
                  fontSize: 8,
                  color: 'var(--ink-faint)',
                }}
              >
                SAVED TO
              </div>
              {/* a data folder path is long, so show its last two folders (full path on hover) */}
              <div
                title={saveStatus.location}
                style={{
                  fontSize: 13,
                  color: 'var(--ink)',
                  marginTop: 3,
                  ...ellipsis,
                }}
              >
                {saveStatus.mode === 'disk'
                  ? '…/' +
                    String(saveStatus.location)
                      .split(/[\\/]+/)
                      .filter(Boolean)
                      .slice(-2)
                      .join('/')
                  : saveStatus.location}
              </div>
            </div>
            <button
              className="iconbtn"
              title="Where your data is saved, backups"
              onClick={() => setDataOpen(true)}
            >
              Backups
            </button>
          </div>
        </div>
      </div>
    )
  }
  function Dashboard() {
    const [by, setBy] = useState('tag') // 'tag' | 'difficulty'
    const [sel, setSel] = useState(ALL)
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '258px minmax(0,1fr) 318px',
          gap: 14,
          height: '100%',
          minHeight: 0,
        }}
      >
        <TagMenu by={by} setBy={setBy} sel={sel} setSel={setSel} />
        <ProblemList by={by} sel={sel} />
        <TrainerCard />
      </div>
    )
  }
  window.Dashboard = Dashboard
})()

export {}
