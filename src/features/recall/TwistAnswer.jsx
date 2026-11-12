// Twist questions: the classic solution is already in the editor, and you change the lines the new
// rule needs. There are too many valid answers to auto-grade most of them, so after checking you
// compare your changes with a model answer's and decide whether yours counts.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { highlight } from '../../lib/highlight'
import { changedLineCount, diffLines } from './quiz'

const INDENT = '    '

function DiffView({ title, from, to }) {
  const rows = diffLines(from, to)
  return (
    <div className="recall-diff">
      <div className="recall-diff-title">{title}</div>
      <div className="code-wrap recall-diff-body">
        <pre>
          {rows.map((row, i) => (
            <span
              key={i}
              className={'recall-diff-row ' + row.type}
              dangerouslySetInnerHTML={{
                __html:
                  (row.type === 'add' ? '+ ' : row.type === 'del' ? '- ' : '  ') +
                  highlight(row.text, 'python'),
              }}
            />
          ))}
        </pre>
      </div>
    </div>
  )
}

export function TwistAnswer({ cur, quiz, onCheck, onOverride }) {
  const [text, setText] = useState(cur.base)
  const ref = useRef(null)
  const nextCursor = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.focus()
  }, [])
  // set before the browser paints or takes another key press, or fast typing lands in the wrong spot
  useLayoutEffect(() => {
    if (nextCursor.current !== null && ref.current) {
      ref.current.selectionStart = ref.current.selectionEnd = nextCursor.current
      nextCursor.current = null
    }
  })

  // puts `insert` at the cursor (or over the selection), leaving the cursor after it
  function insertAt(el, insert) {
    const { selectionStart: a, selectionEnd: b } = el
    nextCursor.current = a + insert.length
    setText(text.slice(0, a) + insert + text.slice(b))
  }

  function onKeyDown(ev) {
    const el = ev.target
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault()
      if (!quiz.answered && text !== cur.base) onCheck(text)
    } else if (ev.key === 'Tab') {
      ev.preventDefault()
      insertAt(el, INDENT)
    } else if (ev.key === 'Enter') {
      // keep the current indent, and go one deeper after a line ending in ':'
      ev.preventDefault()
      const line = text.slice(0, el.selectionStart).split('\n').pop()
      const indent = line.match(/^\s*/)[0]
      insertAt(el, '\n' + indent + (line.trimEnd().endsWith(':') ? INDENT : ''))
    }
  }

  if (quiz.answered) {
    const attempted = text !== cur.base
    return (
      <div className="recall-twist-result">
        {quiz.correct || attempted ? (
          <div className="recall-twist-verdict">
            <span
              className="recall-verdict"
              style={{ color: quiz.correct ? 'var(--sage-deep)' : 'var(--ink-soft)' }}
            >
              {quiz.correct
                ? quiz.overridden
                  ? '✔ Counted!'
                  : '✔ Correct!'
                : 'Same idea as the model answer?'}
            </span>
            {!quiz.correct ? (
              <button
                className="iconbtn"
                onClick={onOverride}
                title="Your code solves the twist? Count it."
              >
                Mine works too — count it
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="recall-diffs">
          {attempted ? <DiffView title="Your changes" from={cur.base} to={text} /> : null}
          <DiffView title="Model answer" from={cur.base} to={cur.a} />
        </div>
      </div>
    )
  }

  const lines = changedLineCount(cur.base, cur.a)
  return (
    <div className="recall-twist-editor">
      <div className="field" style={{ margin: 0 }}>
        <textarea
          ref={ref}
          className="code-input"
          value={text}
          rows={text.split('\n').length + 1}
          spellCheck={false}
          onChange={(ev) => setText(ev.target.value)}
          onKeyDown={onKeyDown}
          style={{ resize: 'none', fontSize: 18 }}
        />
      </div>
      <div className="recall-twist-actions">
        <span className="recall-twist-hint">
          {'A model answer changes about ' + lines + (lines === 1 ? ' line' : ' lines')}
        </span>
        <button
          className="btn"
          style={{ fontSize: 11 }}
          disabled={text === cur.base}
          onClick={() => setText(cur.base)}
        >
          Reset
        </button>
        <button className="btn" style={{ fontSize: 11 }} onClick={() => onCheck(cur.base)}>
          Show Answer
        </button>
        <button
          className="btn green"
          style={{ fontSize: 11 }}
          disabled={text === cur.base}
          onClick={() => onCheck(text)}
        >
          Check
        </button>
      </div>
    </div>
  )
}
