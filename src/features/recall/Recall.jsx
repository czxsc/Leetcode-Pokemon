import { useEffect, useRef, useState } from 'react'
import { CodeBlock } from '../../components/CodeBlock'
import { Creature } from '../../components/Creature'
import { Shard } from '../../components/icons'
import { store, useStore } from '../../state/store'
import { TAG_COLOR, TAG_LABEL } from './questions'
import { isRight, norm, pickQuiz } from './quiz'

const REWARD_PER = 50 // Shards per correct answer

// prompt text with `code` spans
function Prompt({ text }) {
  return (
    <div
      className="pixel-font"
      style={{
        fontSize: 18,
        color: 'var(--ink)',
        lineHeight: 1.5,
        textAlign: 'center',
      }}
    >
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith('`') ? (
          <code key={i} className="recall-code">
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </div>
  )
}

// keyed by question, so each one starts with an empty, focused box
function TypedAnswer({ cur, quiz, onCheck, onOverride }) {
  const [text, setText] = useState('')
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.focus()
  }, [])
  function onKeyDown(ev) {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault()
      if (!quiz.answered) onCheck(text)
      return
    }
    if (ev.key === 'Tab') {
      // indent for two-liners
      ev.preventDefault()
      const el = ev.target,
        { selectionStart: a, selectionEnd: b } = el
      setText(text.slice(0, a) + '    ' + text.slice(b))
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = a + 4
      })
    }
  }
  const lines = Math.max(2, cur.a.split('\n').length)
  return (
    <div
      style={{
        maxWidth: 640,
        width: '100%',
        margin: '0 auto',
      }}
    >
      <div
        className="field"
        style={{
          margin: 0,
        }}
      >
        <textarea
          ref={ref}
          className="code-input"
          value={text}
          rows={lines}
          spellCheck={false}
          readOnly={quiz.answered}
          placeholder={
            lines > 1
              ? 'Type your answer\u2026 (Tab indents, Shift+Enter for a new line)'
              : 'Type your answer\u2026'
          }
          onChange={(ev) => setText(ev.target.value)}
          onKeyDown={onKeyDown}
          style={{
            resize: 'none',
            fontSize: 19,
          }}
        />
      </div>
      {quiz.answered ? null : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 10,
          }}
        >
          <button
            className="btn"
            style={{
              fontSize: 11,
            }}
            onClick={() => onCheck('')}
          >
            Show Answer
          </button>
          <button
            className="btn green"
            style={{
              fontSize: 11,
            }}
            disabled={!text.trim()}
            onClick={() => onCheck(text)}
          >
            Check
          </button>
        </div>
      )}
      {quiz.answered ? (
        <div
          style={{
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 12,
              color: quiz.correct ? 'var(--sage-deep)' : 'var(--hard)',
              marginBottom: 8,
            }}
          >
            {quiz.correct
              ? quiz.overridden
                ? '\u2714 Counted!'
                : '\u2714 Correct!'
              : '\u2716 Not quite \u2014 one answer:'}
          </div>
          {quiz.correct && !quiz.overridden && norm(text) === norm(cur.a) ? null : (
            <div
              className="code-wrap"
              style={{
                borderRadius: 10,
                border: '2px solid var(--lav-deep)',
                textAlign: 'left',
                display: 'inline-block',
                minWidth: 320,
              }}
            >
              <CodeBlock code={cur.a} language="python" />
            </div>
          )}
          {!quiz.correct && text.trim() ? (
            <div
              style={{
                marginTop: 8,
              }}
            >
              <button
                className="iconbtn"
                onClick={onOverride}
                title="Your answer does the same thing? Count it."
              >
                Mine works too — count it
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function Recall() {
  const st = useStore((s) => ({
    recallBest: s.recallBest,
  }))
  const [quiz, setQuiz] = useState(null) // {qs, i, score, picked, answered, correct, overridden}
  const [done, setDone] = useState(null)
  function start() {
    setDone(null)
    setQuiz({
      qs: pickQuiz(),
      i: 0,
      score: 0,
      picked: null,
      answered: false,
      correct: false,
      overridden: false,
    })
  }
  function answer(correct, picked) {
    if (quiz.answered) return
    setQuiz({
      ...quiz,
      picked,
      answered: true,
      correct,
      score: quiz.score + (correct ? 1 : 0),
    })
  }
  function override() {
    if (!quiz.answered || quiz.correct) return
    setQuiz({
      ...quiz,
      correct: true,
      overridden: true,
      score: quiz.score + 1,
    })
  }
  function next() {
    if (quiz.i + 1 >= quiz.qs.length) {
      const reward = quiz.score * REWARD_PER
      store.addShards(reward)
      store.setRecallBest(quiz.score)
      setDone({
        score: quiz.score,
        total: quiz.qs.length,
        reward,
      })
      setQuiz(null)
    } else {
      setQuiz({
        ...quiz,
        i: quiz.i + 1,
        picked: null,
        answered: false,
        correct: false,
        overridden: false,
      })
    }
  }

  // ---------- intro ----------
  if (!quiz && !done) {
    return (
      <div
        className="panel cream"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <div className="mon-bob">
          <Creature species="psybloom" size={96} />
        </div>
        <div
          className="pixel-font"
          style={{
            fontSize: 22,
            color: 'var(--wood-dark)',
          }}
        >
          Active Recall
        </div>
        <div
          style={{
            fontSize: 15,
            color: 'var(--ink-soft)',
            maxWidth: 440,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          {'Practice some basic Python syntax, shortcuts and complexity refreshers. Earn '}
          {/* the number in Silkscreen: this body font draws a bold 5 like an S */}
          <b>
            <span
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 13,
              }}
            >
              {REWARD_PER}
            </span>
            {' Shards'}
          </b>
          {' per correct answer.'}
        </div>
        {st.recallBest > 0 ? (
          <div className="cur-badge">{'Best: ' + st.recallBest + '/10'}</div>
        ) : null}
        <button
          className="btn lav"
          style={{
            fontSize: 14,
            padding: '14px 28px',
          }}
          onClick={start}
        >
          Start Quiz
        </button>
      </div>
    )
  }

  // ---------- results ----------
  if (done) {
    const pct = done.score / done.total
    const mon = pct >= 0.8 ? 'aurigon' : pct >= 0.5 ? 'voltace' : 'sproutle'
    return (
      <div
        className="panel cream"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <div className="mon-bob">
          <Creature species={mon} size={96} />
        </div>
        <div
          className="pixel-font"
          style={{
            fontSize: 30,
            color: 'var(--wood-dark)',
          }}
        >
          {done.score + ' / ' + done.total}
        </div>
        <div
          style={{
            fontSize: 15,
            color: 'var(--ink-soft)',
          }}
        >
          {pct >= 0.8 ? 'Sharp as ever!' : pct >= 0.5 ? 'Solid refresher.' : 'Keep drilling!'}
        </div>
        <div
          className="chip-card"
          style={{
            padding: '12px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
          }}
        >
          <Shard size={22} />
          <span
            className="pixel-font"
            style={{
              fontSize: 20,
              color: 'var(--shard-deep)',
            }}
          >
            {'+' + done.reward}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10,
          }}
        >
          <button className="btn lav" onClick={start}>
            Again
          </button>
        </div>
      </div>
    )
  }

  // ---------- in quiz ----------
  const cur = quiz.qs[quiz.i]
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* progress header */}
      <div
        className="panel"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <span
          className="type-tag"
          style={{
            background: TAG_COLOR[cur.tag],
            fontSize: 9,
            padding: '4px 8px',
          }}
        >
          {TAG_LABEL[cur.tag]}
        </span>
        <div
          className="minibar"
          style={{
            flex: 1,
            height: 10,
          }}
        >
          <i
            style={{
              width: (quiz.i / quiz.qs.length) * 100 + '%',
              background: 'var(--lav)',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 11,
            color: 'var(--ink-faint)',
          }}
        >
          {quiz.i + 1 + '/' + quiz.qs.length}
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: "'Silkscreen'",
            fontSize: 11,
            color: 'var(--shard-deep)',
          }}
        >
          <Shard size={13} />
          {quiz.score * REWARD_PER}
        </span>
      </div>
      {/* question */}
      <div
        className="panel cream"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 18,
          padding: '28px 32px',
        }}
      >
        {cur.kind === 'typed' ? (
          <div
            className="code-wrap"
            style={{
              borderRadius: 10,
              border: '2px solid var(--lav-deep)',
              maxWidth: 640,
              width: '100%',
              margin: '0 auto',
            }}
          >
            <CodeBlock code={cur.code} language="python" />
          </div>
        ) : null}
        <Prompt text={cur.q} />
        {cur.kind === 'typed' ? (
          <TypedAnswer
            key={quiz.i}
            cur={cur}
            quiz={quiz}
            onCheck={(text) => answer(isRight(cur, text), null)}
            onOverride={override}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              maxWidth: 640,
              width: '100%',
              margin: '0 auto',
            }}
          >
            {cur.o.map((opt, idx) => {
              let bg = 'var(--card-2)',
                bd = 'var(--card-line)',
                col = 'var(--ink)'
              if (quiz.answered) {
                if (idx === cur.a) {
                  bg = 'var(--sage-lite)'
                  bd = 'var(--sage-deep)'
                } else if (idx === quiz.picked) {
                  bg = '#f4d2cd'
                  bd = 'var(--hard)'
                }
              }
              return (
                <button
                  key={idx}
                  disabled={quiz.answered}
                  onClick={() => answer(idx === cur.a, idx)}
                  className={!quiz.answered ? 'quiz-opt' : ''}
                  style={{
                    background: bg,
                    border: '3px solid ' + bd,
                    borderRadius: 12,
                    padding: '16px 14px',
                    fontFamily: "'VT323', monospace",
                    fontSize: 19,
                    color: col,
                    textAlign: 'center',
                    cursor: quiz.answered ? 'default' : 'pointer',
                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,.5)',
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}
        {cur.kind === 'choice' ? (
          quiz.answered ? (
            <div
              style={{
                textAlign: 'center',
                minHeight: 24,
              }}
            >
              <span
                style={{
                  fontFamily: "'Silkscreen'",
                  fontSize: 12,
                  color: quiz.correct ? 'var(--sage-deep)' : 'var(--hard)',
                }}
              >
                {quiz.correct ? '\u2714 Correct!' : '\u2716 Answer: ' + cur.o[cur.a]}
              </span>
            </div>
          ) : (
            <div
              style={{
                minHeight: 24,
              }}
            />
          )
        ) : null}
      </div>
      {/* footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <button
          className="btn lav"
          disabled={!quiz.answered}
          style={{
            fontSize: 13,
            padding: '12px 28px',
          }}
          onClick={next}
        >
          {quiz.i + 1 >= quiz.qs.length ? 'Finish' : 'Next \u2192'}
        </button>
      </div>
    </div>
  )
}
