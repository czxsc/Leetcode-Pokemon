// Active Recall: pick a deck, answer 10 questions, read a short explanation after each one.
import { useEffect, useRef, useState } from 'react'
import { CodeBlock } from '../../components/CodeBlock'
import { Creature } from '../../components/Creature'
import { Shard } from '../../components/icons'
import { todayLocal } from '../../game/dates'
import { recallPayout, recallShardsLeft } from '../../game/recall'
import { RECALL_DAILY_SHARDS, RECALL_SHARDS_PER_ANSWER } from '../../game/rules'
import { store, useStore } from '../../state/store'
import { DECKS, deckQuestions, MIXED, TAG_COLOR, TAG_LABEL } from './questions'
import { isRight, norm, pickQuiz } from './quiz'
import { TwistAnswer } from './TwistAnswer'

// text with `code` spans
function InlineCode({ text }) {
  return text.split(/(`[^`]+`)/).map((part, i) =>
    part.startsWith('`') ? (
      <code key={i} className="recall-code">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  )
}

function Prompt({ text }) {
  return (
    <div className="recall-prompt">
      <InlineCode text={text} />
    </div>
  )
}

// pops up once a question is answered, right or wrong
function AnswerBox({ title, answer, why }) {
  return (
    <div className="recall-answer">
      <div className="recall-answer-head">
        <span className="recall-answer-title">{title}</span>
        {answer ? <span className="recall-answer-value">{answer}</span> : null}
      </div>
      <div className="recall-answer-text">
        <InlineCode text={why} />
      </div>
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
                minWidth: 'min(320px, 100%)',
                maxWidth: '100%',
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
          <AnswerBox title="Answer" why={cur.why} />
        </div>
      ) : null}
    </div>
  )
}

export function Recall() {
  const today = todayLocal()
  const st = useStore((s) => ({
    recallBest: s.recallBest,
    shardsLeft: recallShardsLeft(s, today),
    payoutFor: (correct) => recallPayout(s, correct, today),
  }))
  const earnedToday = RECALL_DAILY_SHARDS - st.shardsLeft
  const [quiz, setQuiz] = useState(null) // {qs, i, score, picked, answered, correct, overridden}
  const [done, setDone] = useState(null)
  const [deck, setDeck] = useState(MIXED.id)
  function start() {
    setDone(null)
    setQuiz({
      qs: pickQuiz(deck),
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
      const reward = store.finishRecall(quiz.score)
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
          // "safe" keeps the top reachable by scrolling on a short window
          justifyContent: 'safe center',
          overflowY: 'auto',
          gap: 20,
        }}
      >
        <div className="mon-bob">
          <Creature species="abra" size={96} />
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
            maxWidth: 620,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          {'Drill your skills: earn '}
          {/* the number in Silkscreen: this body font draws a bold 5 like an S */}
          <b>
            <span
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 13,
              }}
            >
              {RECALL_SHARDS_PER_ANSWER}
            </span>
            {' Shards'}
          </b>
          {' per correct answer, up to '}
          <b>
            <span
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 13,
              }}
            >
              {RECALL_DAILY_SHARDS.toLocaleString()}
            </span>
            {' a day'}
          </b>
          {'.'}
        </div>
        <div className="recall-decks">
          {[MIXED, ...DECKS].map((d) => (
            <button
              key={d.id}
              className={'recall-deck' + (deck === d.id ? ' on' : '')}
              aria-pressed={deck === d.id}
              onClick={() => setDeck(d.id)}
            >
              <span className="recall-deck-name">{d.label}</span>
              <span className="recall-deck-blurb">{d.blurb}</span>
              {d.tags ? (
                <span className="recall-deck-count">{deckQuestions(d).length + ' questions'}</span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="recall-badges">
          {st.recallBest > 0 ? (
            <div className="cur-badge recall-badge">{'Best: ' + st.recallBest + '/10'}</div>
          ) : null}
          <div className="cur-badge recall-badge">
            <Shard size={14} />
            {'Today: ' + earnedToday.toLocaleString() + '/' + RECALL_DAILY_SHARDS.toLocaleString()}
          </div>
        </div>
        {st.shardsLeft === 0 ? (
          <div className="recall-limit">
            Daily Shards all earned. Quizzes are still open for practice, and Shards refill
            tomorrow.
          </div>
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
    const mon = pct >= 0.8 ? 'alakazam' : pct >= 0.5 ? 'kadabra' : 'abra'
    return (
      <div
        className="panel cream"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // "safe" keeps the top reachable by scrolling on a short window
          justifyContent: 'safe center',
          overflowY: 'auto',
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
        {st.shardsLeft === 0 ? (
          <div className="recall-limit">
            Daily Shards all earned. Keep practicing, and Shards refill tomorrow.
          </div>
        ) : (
          <div className="cur-badge recall-badge">
            {'Today: ' + earnedToday.toLocaleString() + '/' + RECALL_DAILY_SHARDS.toLocaleString()}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            gap: 10,
          }}
        >
          <button className="btn" onClick={() => setDone(null)}>
            Change Deck
          </button>
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
        {/* what finishing now would pay; MAX says more right answers won't add to it */}
        <span
          title={st.shardsLeft === 0 ? 'Daily Shards all earned' : undefined}
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
          {st.payoutFor(quiz.score) + (st.payoutFor(quiz.score) >= st.shardsLeft ? ' MAX' : '')}
        </span>
      </div>
      {/* question */}
      <div
        className="panel cream recall-body"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          // "safe" keeps the top reachable by scrolling when a long question overflows
          justifyContent: 'safe center',
          gap: 18,
        }}
      >
        {cur.kind === 'twist' ? (
          <>
            <div className="recall-from">{'Starting from: ' + cur.from}</div>
            <Prompt text={cur.q} />
            {/* above the diffs, which can be long enough to scroll */}
            {quiz.answered ? <AnswerBox title="Why" why={cur.why} /> : null}
            <TwistAnswer
              key={quiz.i}
              cur={cur}
              quiz={quiz}
              onCheck={(text) => answer(isRight(cur, text), null)}
              onOverride={override}
            />
          </>
        ) : cur.kind === 'typed' ? (
          <>
            {cur.code ? (
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
            <TypedAnswer
              key={quiz.i}
              cur={cur}
              quiz={quiz}
              onCheck={(text) => answer(isRight(cur, text), null)}
              onOverride={override}
            />
          </>
        ) : (
          <div className={cur.code ? 'recall-split' : 'recall-stack'}>
            {cur.code ? (
              <div className="code-wrap recall-split-code">
                <CodeBlock code={cur.code} language="python" />
              </div>
            ) : null}
            <div className="recall-split-side">
              <Prompt text={cur.q} />
              <div
                className="recall-options"
                style={{
                  // long sentences read better stacked than squeezed into two columns
                  gridTemplateColumns: cur.o.some((opt) => opt.length > 28) ? '1fr' : '1fr 1fr',
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
                        padding: '12px 14px',
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
              {quiz.answered ? (
                <>
                  <div
                    className="recall-verdict"
                    style={{ color: quiz.correct ? 'var(--sage-deep)' : 'var(--hard)' }}
                  >
                    {quiz.correct ? '\u2714 Correct!' : '\u2716 Not quite'}
                  </div>
                  <AnswerBox title="Answer" answer={cur.o[cur.a]} why={cur.why} />
                </>
              ) : null}
            </div>
          </div>
        )}
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
