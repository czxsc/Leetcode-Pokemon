/* =====================================================================
   Progression quests — six chapters, each unlocked by claiming every
   quest in the chapter before. Progress is read from saved state (and
   the lifetime counters in state.stats), so it counts work done before
   a chapter opens. Each quest pays once, ever (state.achievements).
   Exposes window.Chapters.
===================================================================== */
(function(){
  const PM = window.PixelMon;
  const D = ()=> window.Derived;
  const START_TEAM = 6;                                  // onboarding gives six friends
  const BUILTIN_TAGS = window.Catalog.tagList([]).length;

  // ---- progress readers ----
  const solved = ()=> D().solvedCounts();
  const claimedProblems = (s)=> s.problems.filter(p=>p.claimed).length;
  const focusMinutes = (s)=> Math.floor(s.meadow.studyTotal/60000);
  const caught = (s)=> Math.max(0, s.owned.length - START_TEAM);
  const species = ()=> D().ownedSpecies().size;
  const bestStreak = ()=> D().streakInfo().best;
  const ownsRarity = (...tiers)=> (s)=> s.owned.some(o=>{ const sp = PM.byId(o.sp); return sp && tiers.includes(sp.rarity); }) ? 1 : 0;
  const tagsSolved = (n, builtinOnly)=> ()=> D().tagStats().filter(t=> (!builtinOnly || !t.custom) && t.solved>=n).length;
  const fullyEvolved = ()=> D().teamList().filter(m=> !PM.evoOptions(PM.byId(m.sp)).length).length;

  const q = (id, name, desc, goal, progress, unit)=> ({ id, name, desc, goal, progress, unit });

  const CHAPTERS = [
    { title:'First Steps', blurb:'Learn the ropes: summon, solve, study.', reward:100, quests:[
      q('c1-draw',   'First Summon',   'Draw once on the Summon tab.',                1,  (s)=>s.totalPulls||0),
      q('c1-catch',  'New Friends',    'Catch 3 new Pokémon by summoning.',     3,  caught),
      q('c1-solve',  'First Solve',    'Add a problem with your solution.',           1,  ()=>solved().total),
      q('c1-claim',  'Payday',         'Claim the Shards for a solved problem.',      1,  claimedProblems),
      q('c1-focus',  'Study Session',  'Study for 10 minutes in a Focus session.',    10, focusMinutes, 'min'),
      q('c1-recall', 'Warm-Up',        'Finish an Active Recall quiz.',               1,  (s)=>Math.max(s.stats.recalls, s.recallBest>0?1:0)),
    ]},
    { title:'Rising Trainer', blurb:'Build habits and grow your team.', reward:200, quests:[
      q('c2-perfect','Perfect Day',    'Claim every daily quest in a single day.',    1,  (s)=>s.stats.perfectDays),
      q('c2-solve',  'Warming Up',     'Solve 3 problems.',                           3,  ()=>solved().total),
      q('c2-power',  'Growing Stronger','Reach 100 team Fighting Power.',             100,()=>D().teamPower()),
      q('c2-evolve', 'Evolution!',     'Evolve a Pokémon.',                      1,  (s)=>s.stats.evolutions),
      q('c2-streak', 'On a Roll',      'Solve problems 3 days in a row.',             3,  bestStreak, 'days'),
      q('c2-dex',    'Collector',      'Own 15 different Pokémon species.',      15, species),
    ]},
    { title:'Tag Explorer', blurb:'Branch out across topics and difficulties.', reward:300, quests:[
      q('c3-solve',  'Double Digits',  'Solve 10 problems.',                          10, ()=>solved().total),
      q('c3-tags',   'Branching Out',  'Solve a problem in 5 different tags.',        5,  tagsSolved(1, false)),
      q('c3-medium', 'Medium Rare',    'Solve 5 Medium problems.',                    5,  ()=>solved().med),
      q('c3-hard',   'Hard Mode',      'Solve a Hard problem.',                       1,  ()=>solved().hard),
      q('c3-epic',   'Epic Pull',      'Own an Epic or Legendary Pokémon.',      1,  ownsRarity('epic','legendary')),
      q('c3-focus',  'Deep Focus',     'Study for 5 hours in Focus sessions.',        300,focusMinutes, 'min'),
    ]},
    { title:'Seasoned Trainer', blurb:'Consistency pays off.', reward:400, quests:[
      q('c4-solve',  'Quarter Century','Solve 25 problems.',                          25, ()=>solved().total),
      q('c4-streak', 'Week Warrior',   'Solve problems 7 days in a row.',             7,  bestStreak, 'days'),
      q('c4-pity',   'Guaranteed',     'Hit pity: get a guaranteed Legendary or target pull.', 1, (s)=>s.stats.pityHits),
      q('c4-shiny',  'Shiny Hunter',   'Own a shiny Pokémon.',                   1,  (s)=>s.owned.some(o=>o.shiny)?1:0),
      q('c4-perfect','Dedicated',      'Have 5 perfect days of daily quests.',        5,  (s)=>s.stats.perfectDays),
      q('c4-power',  'Powerhouse',     'Reach 300 team Fighting Power.',              300,()=>D().teamPower()),
    ]},
    { title:'Elite Trainer', blurb:'Cover every topic and chase legends.', reward:500, quests:[
      q('c5-tags',   'Well-Rounded',   'Solve a problem in every built-in tag.',      BUILTIN_TAGS, tagsSolved(1, true)),
      q('c5-legend', 'Legend Found',   'Own a Legendary Pokémon.',               1,  ownsRarity('legendary')),
      q('c5-form',   'Transformation', 'Unlock a Mega or Gigantamax form.',           1,  (s)=>s.owned.some(o=>o.unlocked && (o.unlocked.mega||o.unlocked.gmax))?1:0),
      q('c5-evolve', 'Evolution Expert','Evolve 5 Pokémon.',                     5,  (s)=>s.stats.evolutions),
      q('c5-hard',   'Hard Hitter',    'Solve 5 Hard problems.',                      5,  ()=>solved().hard),
      q('c5-solve',  'Half Century',   'Solve 50 problems.',                          50, ()=>solved().total),
    ]},
    { title:'Pokémon Master', blurb:'The long game.', reward:750, quests:[
      q('c6-tags',   'Master of All',  'Solve 3 problems in every built-in tag.',     BUILTIN_TAGS, tagsSolved(3, true)),
      q('c6-team',   'Final Forms',    'Have a team of 6 that can’t evolve any further.', 6, fullyEvolved),
      q('c6-power',  'Champion',       'Reach 1,000 team Fighting Power.',            1000,()=>D().teamPower()),
      q('c6-streak', 'Unstoppable',    'Solve problems 30 days in a row.',            30, bestStreak, 'days'),
      q('c6-dex',    'Pokédex Pro','Own 100 different Pokémon species.',     100,species),
      q('c6-solve',  'Centurion',      'Solve 100 problems.',                         100,()=>solved().total),
    ]},
  ];

  // where each chapter stands: quests with live progress, claim state and whether it is open
  function status(st){
    let open = true;
    return CHAPTERS.map((ch, i)=>{
      const quests = ch.quests.map(x=>{
        const value = x.progress(st);
        const claimed = !!st.achievements[x.id];
        return { ...x, reward:ch.reward, value, prog:Math.min(x.goal, value), claimed, met: value>=x.goal };
      });
      const done = quests.filter(x=>x.claimed).length;
      const row = { ...ch, index:i, quests, done, complete: done===quests.length, open,
        ready: open ? quests.filter(x=> x.met && !x.claimed) : [] };
      open = open && row.complete;                       // the next chapter opens once this one is fully claimed
      return row;
    });
  }

  window.Chapters = { CHAPTERS, status };
})();
