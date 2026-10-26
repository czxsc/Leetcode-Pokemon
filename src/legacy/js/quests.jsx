/* =====================================================================
   Quests — two tabs.
   Daily: log in, solve problems, daily refresher, and Focus time on
   LeetCode. Solve and Focus are step chains: claiming a step moves the
   quest up to its next, bigger goal (stars show the step). Claims grant
   Shards once per step per day.
   Progression: six chapters of one-time quests (js/chapters.jsx); a
   chapter opens once every quest in the one before it is claimed.
===================================================================== */
;(function () {
  const { useState } = React
  const claimedToday = (s) => s.problems.filter((p) => p.claimedAt === window.Store.TODAY).length
  const focusMinutesToday = (s) => Math.floor(s.meadow.studyToday / 60000)
  const step = (name, desc, goal, reward) => ({
    name,
    desc,
    goal,
    reward,
  })
  const QUESTS = [
    {
      id: 'login',
      progress: () => 1,
      steps: [step('Log In', 'Open PokéLeet today.', 1, 50)],
    },
    {
      id: 'solve',
      progress: claimedToday,
      steps: [
        step('Solve 1 Problem', 'Claim shards on any problem.', 1, 100),
        step('Solve 3 Problems', 'Claim shards on three problems.', 3, 150),
        step('Solve 5 Problems', 'Claim shards on five problems.', 5, 250),
      ],
    },
    {
      id: 'refresh',
      progress: (s) => (s.recallToday ? 1 : 0),
      steps: [step('Daily Refresher', 'Finish an Active Recall quiz.', 1, 150)],
    },
    {
      id: 'focus',
      unit: 'min',
      progress: focusMinutesToday,
      steps: [
        [30, '30 Minutes', 100],
        [60, '1 Hour', 150],
        [90, '1.5 Hours', 200],
        [120, '2 Hours', 300],
      ].map(([m, label, reward]) =>
        step(
          'Focus ' + label,
          'Spend ' + m + ' minutes on LeetCode during Focus sessions.',
          m,
          reward,
        ),
      ),
    },
  ]

  // where a quest chain stands today
  function questState(q, st) {
    const claimed = Math.min(q.steps.length, Number(st.quests[q.id]) || 0)
    const done = claimed >= q.steps.length
    const cur = q.steps[Math.min(claimed, q.steps.length - 1)]
    const value = q.progress(st)
    // every step whose goal is reached but not yet claimed
    const ready = q.steps.slice(claimed).filter((s) => value >= s.goal)
    return {
      claimed,
      done,
      cur,
      prog: Math.min(cur.goal, value),
      met: !done && value >= cur.goal,
      ready,
    }
  }
  function claimDaily(q, step, reward) {
    window.Store.grantQuest(q.id, step, reward)
    const st = window.Store.get()
    if (QUESTS.every((x) => questState(x, st).done)) window.Store.markPerfectDay()
  }
  function Stars({ level, total }) {
    return (
      <span
        title={'Step ' + level + ' of ' + total}
        style={{
          fontSize: 15,
          letterSpacing: 1,
          lineHeight: 1,
        }}
      >
        {Array.from({
          length: total,
        }).map((_, i) =>
          i < level ? (
            <span
              key={i}
              style={{
                color: 'var(--coin-deep)',
              }}
            >
              ★
            </span>
          ) : (
            <span
              key={i}
              style={{
                color: 'var(--ink-faint)',
                opacity: 0.6,
              }}
            >
              ☆
            </span>
          ),
        )}
      </span>
    )
  }

  // one quest card (daily and progression): done = claimed for good, met = ready to claim
  function QuestCard({
    name,
    badge,
    desc,
    prog,
    goal,
    unit,
    reward,
    done,
    met,
    locked,
    doneLabel,
    onClaim,
  }) {
    // locked quests keep their shape but hide the details until the chapter opens
    const hidden = locked
      ? {
          filter: 'blur(5px)',
          userSelect: 'none',
          pointerEvents: 'none',
        }
      : null
    return (
      <div
        className="chip-card"
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          opacity: done ? 0.7 : 1,
          borderColor: met && !locked ? 'var(--sage-deep)' : 'var(--card-line)',
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: done
              ? 'var(--sage)'
              : met && !locked
                ? 'var(--sage-lite)'
                : 'var(--cream-2)',
            border: '2px solid var(--card-line)',
          }}
        >
          <span
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 16,
              color: done ? '#fff' : 'var(--wood-dark)',
            }}
          >
            {done ? '✔' : locked ? '🔒' : '★'}
          </span>
        </div>
        <div
          aria-hidden={locked || undefined}
          style={{
            flex: 1,
            minWidth: 0,
            ...hidden,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 13,
                color: 'var(--ink)',
              }}
            >
              {name}
            </span>
            {badge}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--ink-faint)',
              marginBottom: 7,
            }}
          >
            {desc}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
            }}
          >
            <div
              className="minibar"
              style={{
                flex: 1,
                height: 8,
              }}
            >
              <i
                style={{
                  width: (prog / goal) * 100 + '%',
                  background: 'var(--sage-deep)',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 9,
                color: 'var(--ink-faint)',
                whiteSpace: 'nowrap',
              }}
            >
              {prog.toLocaleString() + '/' + goal.toLocaleString() + (unit ? ' ' + unit : '')}
            </span>
          </div>
        </div>
        <div
          aria-hidden={locked || undefined}
          style={{
            textAlign: 'center',
            flex: 'none',
            width: 96,
            ...hidden,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              marginBottom: 7,
            }}
          >
            <Shard size={15} />
            <span
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 13,
                color: 'var(--shard-deep)',
              }}
            >
              {reward}
            </span>
          </div>
          {done ? (
            <div
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 9,
                color: 'var(--sage-deep)',
              }}
            >
              {doneLabel}
            </div>
          ) : (
            <button
              className="btn green"
              disabled={!met || locked}
              style={{
                fontSize: 10,
                padding: '7px 12px',
              }}
              onClick={onClaim}
            >
              Claim
            </button>
          )}
        </div>
      </div>
    )
  }
  function DailyRow({ q, st }) {
    const { claimed, done, cur, prog, met } = questState(q, st)
    const chain = q.steps.length > 1
    return (
      <QuestCard
        name={cur.name}
        desc={cur.desc}
        prog={prog}
        goal={cur.goal}
        unit={q.unit}
        reward={cur.reward}
        done={done}
        met={met}
        badge={
          chain ? (
            <Stars level={Math.min(claimed + 1, q.steps.length)} total={q.steps.length} />
          ) : null
        }
        doneLabel={chain ? 'COMPLETE' : 'CLAIMED'}
        onClaim={() => claimDaily(q, claimed, cur.reward)}
      />
    )
  }
  const listStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    paddingRight: 4,
  }
  const labelStyle = {
    fontFamily: "'Silkscreen'",
    fontSize: 9,
    color: 'var(--ink-faint)',
    marginBottom: 8,
  }
  function TabBar({ tab, setTab, readyCount }) {
    return (
      <div
        className="seg seg-mini"
        style={{
          width: 280,
          flex: 'none',
        }}
      >
        {[
          ['daily', 'Daily'],
          ['progress', readyCount ? `Progression · ${readyCount}` : 'Progression'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={'seg-btn' + (tab === id ? ' on' : '')}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
    )
  }
  function DailySummary({ st }) {
    const states = QUESTS.map((q) => questState(q, st))
    const total = QUESTS.reduce((n, q) => n + q.steps.length, 0)
    const done = states.reduce((n, s) => n + s.claimed, 0)
    const unclaimed = states.reduce((n, s) => n + s.ready.reduce((r, x) => r + x.reward, 0), 0)
    return [
      <div key="t" className="panel-title">
        <span className="dot" />
        Today
      </div>,
      <div
        key="b"
        style={{
          textAlign: 'center',
          padding: '12px 0',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
          }}
        >
          <div className={done < total ? 'pokeball-spin' : ''}>
            <Pokeball size={72} />
          </div>
        </div>
        <div
          className="pixel-font"
          style={{
            fontSize: 22,
            color: 'var(--wood-dark)',
            marginTop: 14,
          }}
        >
          {done + ' / ' + total}
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--ink-faint)',
            marginTop: 5,
          }}
        >
          quest steps complete
        </div>
      </div>,
      <div
        key="u"
        className="chip-card"
        style={{
          padding: 14,
          textAlign: 'center',
        }}
      >
        <div style={labelStyle}>UNCLAIMED REWARDS</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
          }}
        >
          <Shard size={20} />
          <span
            className="pixel-font"
            style={{
              fontSize: 20,
              color: 'var(--shard-deep)',
            }}
          >
            {unclaimed}
          </span>
        </div>
      </div>,
    ]
  }
  function ChapterList({ chapters, sel, setSel }) {
    const total = chapters.reduce((n, c) => n + c.quests.length, 0)
    const done = chapters.reduce((n, c) => n + c.done, 0)
    return [
      <div key="t" className="panel-title">
        <span className="dot" />
        Chapters
      </div>,
      <div
        key="o"
        className="chip-card"
        style={{
          padding: '12px 14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            ...labelStyle,
          }}
        >
          <span>OVERALL</span>
          <span>{done + ' / ' + total}</span>
        </div>
        <div
          className="minibar"
          style={{
            height: 8,
          }}
        >
          <i
            style={{
              width: (done / total) * 100 + '%',
              background: 'var(--coin-deep)',
            }}
          />
        </div>
      </div>,
      <div
        key="l"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        {chapters.map((c) => (
          <button
            key={c.index}
            className={'cat-item' + (sel === c.index ? ' active' : '')}
            onClick={() => setSel(c.index)}
            style={{
              opacity: c.open ? 1 : 0.6,
            }}
          >
            <span className={'chapter-num' + (c.complete ? ' done' : '')}>
              {c.complete ? '✔' : c.open ? c.index + 1 : '🔒'}
            </span>
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
                <span
                  className="cname"
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {c.title}
                </span>
                {c.ready.length ? (
                  <span
                    className="type-tag"
                    style={{
                      background: 'var(--sage-deep)',
                      color: '#fff',
                      fontSize: 7,
                      padding: '1px 5px',
                    }}
                  >
                    {c.ready.length + ' READY'}
                  </span>
                ) : null}
                <span
                  className="ccount"
                  style={{
                    marginLeft: 'auto',
                  }}
                >
                  {c.done + '/' + c.quests.length}
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
                    width: (c.done / c.quests.length) * 100 + '%',
                  }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>,
    ]
  }
  function ChapterQuests({ ch, prev }) {
    const claimAll = () => ch.ready.forEach((x) => window.Store.claimAchievement(x.id, x.reward))
    return [
      <div
        key="h"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 10,
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
              fontSize: 14,
              color: 'var(--ink)',
            }}
          >
            {ch.blurb}
          </div>
          {ch.open ? null : (
            <div
              style={{
                fontSize: 13,
                color: 'var(--medium)',
                marginTop: 3,
              }}
            >
              {'🔒 Claim every quest in Chapter ' +
                (prev.index + 1) +
                ' (' +
                prev.title +
                ') to unlock.'}
            </div>
          )}
        </div>
        {ch.ready.length > 1 ? (
          <button
            className="btn green"
            style={{
              fontSize: 10,
              padding: '8px 12px',
            }}
            onClick={claimAll}
          >
            {'Claim All (' + ch.ready.length + ')'}
          </button>
        ) : null}
      </div>,
      <div key="l" style={listStyle}>
        {ch.quests.map((x) => (
          <QuestCard
            key={x.id}
            name={x.name}
            desc={x.desc}
            prog={x.prog}
            goal={x.goal}
            unit={x.unit}
            reward={x.reward}
            done={x.claimed}
            met={x.met}
            locked={!ch.open}
            doneLabel="CLAIMED"
            onClaim={() => window.Store.claimAchievement(x.id, x.reward)}
          />
        ))}
      </div>,
    ]
  }
  function Quests() {
    const st = window.useStore()
    const chapters = window.Chapters.status(st)
    const [tab, setTab] = useState('daily')
    // start on the furthest open chapter that still has something to do
    const [sel, setSel] = useState(() => {
      const c = chapters.find((c) => c.open && !c.complete)
      return c ? c.index : chapters.filter((c) => c.open).length - 1
    })
    const ch = chapters[sel]
    const readyCount = chapters.reduce((n, c) => n + c.ready.length, 0)
    return (
      <div
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 14,
        }}
      >
        <div
          className="panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              className="panel-title"
              style={{
                margin: 0,
                flex: 1,
              }}
            >
              <span className="dot" />
              {tab === 'daily' ? 'Daily Quests' : 'Chapter ' + (ch.index + 1) + ' · ' + ch.title}
            </div>
            <TabBar tab={tab} setTab={setTab} readyCount={readyCount} />
          </div>
          {tab === 'daily' ? (
            <div style={listStyle}>
              {QUESTS.map((q) => (
                <DailyRow key={q.id} q={q} st={st} />
              ))}
            </div>
          ) : (
            ChapterQuests({
              ch,
              prev: chapters[sel - 1],
            })
          )}
        </div>
        <div
          className="panel cream"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            minHeight: 0,
          }}
        >
          {tab === 'daily'
            ? DailySummary({
                st,
              })
            : ChapterList({
                chapters,
                sel,
                setSel,
              })}
        </div>
      </div>
    )
  }
  window.Quests = Quests
})()

export {}
