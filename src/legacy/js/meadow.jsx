/* =====================================================================
   Meadow (the Focus tab) — study sessions. Deploy your team and LeetCode opens; the
   session timer (src/study.js) runs while the PokéLeet Tracker reports
   LeetCode as the active tab, and your team battles daily-seeded
   mini-bosses only for that time. Combat runs in the store; this page
   visualizes it: big boss sprite, HP bar, team gathered round.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState, useEffect, useRef } = React;
  const RARITY = window.PixelMon.RARITY;
  const Study = window.Study;

  // 6 slots arranged around the boss (percent positions in the field)
  const RING = [
    { x:24, y:40 }, { x:24, y:66 }, { x:38, y:78 },
    { x:76, y:40 }, { x:76, y:66 }, { x:62, y:78 },
  ];
  const IDLE = [
    { x:18, y:30 }, { x:34, y:62 }, { x:50, y:36 },
    { x:66, y:64 }, { x:80, y:34 }, { x:46, y:72 },
  ];

  const pad =(n)=> String(n).padStart(2,'0');
  // 1:02:03 / 25:13
  function clock(ms){
    const t = Math.max(0, Math.floor(ms/1000)), h = Math.floor(t/3600), m = Math.floor(t/60)%60, s = t%60;
    return h ? h+':'+pad(m)+':'+pad(s) : m+':'+pad(s);
  }
  // 1h 05m / 25m / 40s
  function short(ms){
    const t = Math.max(0, Math.round(ms/1000));
    if(t < 60) return t+'s';
    const m = Math.round(t/60);
    return m >= 60 ? Math.floor(m/60)+'h '+pad(m%60)+'m' : m+'m';
  }

  // ---- Tracker status (side panel) ----
  function TrackerStatus({ tracker }){
    const cfg = {
      checking:    { color:'var(--ink-faint)', label:'Looking for the Tracker…' },
      connected:   { color:'var(--sage-deep)', label:'Tracker connected',
        text:'The timer runs while LeetCode is your active tab.' },
      missing:     { color:'var(--hard)', label:'Tracker not found',
        text:'Study sessions need the PokéLeet Tracker extension. Open chrome://extensions, turn on Developer mode, click Load unpacked and pick the extension folder inside your PokéLeet folder. Then reload this page.' },
      outdated:    { color:'var(--coin-deep)', label:'Tracker needs a reload',
        text:'Your Tracker (v'+tracker.version+') is older than this PokéLeet (v'+tracker.expectedVersion+'). On chrome://extensions click the reload icon on PokéLeet Tracker, then reload this page.' },
      gone:        { color:'var(--coin-deep)', label:'Tracker was reloaded',
        text:'Reload this page to reconnect to it.' },
      unavailable: { color:'var(--ink-faint)', label:'Not available in the demo',
        text:'Study sessions need PokéLeet running on your computer, plus its Tracker browser extension.' },
    }[tracker.state];
    const reload = tracker.state==='missing' || tracker.state==='outdated' || tracker.state==='gone';
    const repo = window.AppConfig.repoUrl;
    return e('div',{ className:'chip-card', style:{ padding:'10px 12px' } },
      e('div',{ style:{ display:'flex', alignItems:'center', gap:7 } },
        e('span',{ className: tracker.state==='connected' ? 'live-dot' : '', style:{ width:9, height:9, borderRadius:'50%', background:cfg.color, flex:'none' } }),
        e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:10, color:'var(--wood-dark)' } }, cfg.label),
        e('span',{ style:{ flex:1 } }),
        reload ? e('button',{ className:'iconbtn', style:{ padding:'4px 8px', fontSize:9 }, onClick:()=>window.location.reload() }, 'Reload') : null),
      cfg.text ? e('div',{ style:{ fontSize:12, color:'var(--ink-soft)', lineHeight:1.45, marginTop:6 } }, cfg.text,
        tracker.state==='unavailable' && repo ? e('span',{}, ' ', e('a',{ href:repo, target:'_blank', rel:'noopener noreferrer', style:{ color:'var(--lav-deep)', fontWeight:600 } }, 'Get PokéLeet ↗')) : null) : null
    );
  }

  // ---- idle: deploy (field centre) ----
  function DeployCard({ team, tracker }){
    const [busy, setBusy] = useState(false);
    const blocker = tracker.state==='unavailable' ? 'Study sessions only run in the local app.'
      : tracker.state==='checking' ? 'Looking for the Tracker…'
      : !tracker.ready ? 'Set up the Tracker to start (see the side panel).'
      : team.length===0 ? 'Add Pokémon to your team first!'
      : null;
    async function deploy(){
      if(blocker || busy) return;
      setBusy(true);
      try{ await window.Store.deployTeam(); } finally { setBusy(false); }
    }
    return e('div',{ className:'panel cream study-card' },
      e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Ready to focus?'),
      e('div',{ style:{ fontSize:13, color:'var(--ink-soft)', lineHeight:1.45, marginBottom:14 } },
        'Deploy your team and LeetCode opens. They battle for Coins while LeetCode is your active tab.'),
      e('button',{ className:'btn green', disabled:!!blocker || busy, onClick:deploy,
        style:{ width:'100%', fontSize:13, padding:'12px 18px' } }, '▶ Deploy Team'),
      blocker ? e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', textAlign:'center', marginTop:9 } }, blocker) : null
    );
  }

  // ---- ended: summary (field centre) ----
  const END_TEXT = {
    paused: 'Ended after 5 minutes away from LeetCode.',
    cap:    'You hit the 3-hour limit. Great session!',
    manual: 'You ended the session.',
  };
  function SummaryCard({ s }){
    const tallying = s.settledMs < s.focusMs;
    const stat = (label, value, icon)=> e('div',{ className:'stile' },
      e('div',{ className:'lab' }, label),
      e('div',{ className:'val', style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:5 } }, icon||null, value));
    return e('div',{ className:'panel cream study-card' },
      e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Session complete'),
      e('div',{ style:{ fontSize:13, color:'var(--ink-soft)', marginBottom:12 } }, END_TEXT[s.endReason] || ''),
      e('div',{ style:{ textAlign:'center', marginBottom:12 } },
        e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', textTransform:'uppercase' } }, 'Time on LeetCode'),
        e('div',{ className:'study-clock', style:{ fontSize:34 } }, clock(s.focusMs))),
      tallying
        ? e('div',{ style:{ fontFamily:"'VT323'", fontSize:17, color:'var(--ink-faint)', textAlign:'center', padding:'12px 0' } }, 'Tallying your team’s battles…')
        : e('div',{ style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 } },
            stat('Bosses defeated', s.earned.kills),
            stat('Team EXP', '+'+s.earned.exp),
            stat('Coins', '+'+s.earned.coins, e(Coin,{size:13})),
            stat('Shards', '+'+s.earned.shards, e(Shard,{size:14}))),
      e('button',{ className:'btn green', disabled:tallying, style:{ width:'100%' }, onClick:()=>window.Store.dismissSession() }, 'Done')
    );
  }

  // ---- active: paused notice (field top) ----
  function PausedNotice({ s, tracker, now }){
    const opening = s.focusMs===0 && now - s.startedAt < 5000;
    const why = opening ? 'Opening LeetCode…'
      : tracker.ready ? 'Paused — LeetCode isn’t your active tab'
      : 'Paused — the Tracker isn’t connected';
    return e('div',{ className:'panel cream paused-notice' },
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color:'var(--wood-dark)' } }, (opening?'':'❚❚ ')+why),
      opening ? null : e('div',{ style:{ fontSize:13, color:'var(--ink-soft)', margin:'5px 0 9px' } },
        'Session ends in ', e('b',{}, clock(Study.endsAt(s) - now)), ' unless you go back.'),
      opening || !tracker.ready ? null
        : e('button',{ className:'btn green', style:{ fontSize:10, padding:'7px 14px' }, onClick:()=>window.Store.backToLeetCode() }, 'Back to LeetCode ↗'));
  }

  function Meadow(){
    const st = window.useStore();
    const { zone, weather } = window.DATA.daySeed(window.Store.TODAY);
    const team = window.Derived.teamList();
    const s = window.Store.study();
    const trackerStatus = window.Tracker.status();
    const tracker = { ...trackerStatus, ready: window.Tracker.ready() };
    const active = Study.isActive(s);
    const running = Study.isRunning(s);
    const boss = active && s.combat ? s.combat.boss : null;
    const now = Date.now();

    // re-render for the timer and live log (ephemeral, not in store state)
    const [, force] = useState(0);
    useEffect(()=>{ const id=setInterval(()=>force(x=>x+1), 250); return ()=>clearInterval(id); }, []);

    const tufts = useRef(Array.from({length:26}).map(()=>({ x:Math.random()*96, y:Math.random()*92, s:0.7+Math.random() }))).current;
    const log = window.Store.meadowLog;
    const weatherMatch = team.some(m=> window.PixelMon.byId(m.sp).type===weather.type);

    return e('div',{ style:{ height:'100%', minHeight:0, display:'grid', gridTemplateColumns:'1fr 320px', gap:14, overflow:'hidden' } },
      // FIELD
      e('div',{ className:'panel', style:{ padding:8, position:'relative', overflow:'hidden', minHeight:0 } },
        e('div',{ className:'meadow-field'+(active && !running ? ' paused' : ''), style:{ background:'linear-gradient(160deg, '+zone.accent+'55, var(--mint))' } },
          tufts.map((t,i)=> e('div',{ key:i, className:'grass-tuft', style:{ left:t.x+'%', top:t.y+'%', transform:'scale('+t.s+')' } })),

          // BIG boss in the centre
          boss ? e('div',{ className:'boss-wrap', style:{ left:'50%', top:'46%' } },
            e('div',{ className: boss.tier==='legend'?'boss-legend glow-pulse':boss.tier==='elite'?'boss-elite glow-pulse':'glow-pulse' },
              e(Creature,{ species:boss.sp, shiny:boss.shiny, size: boss.tier==='legend'?190:boss.tier==='elite'?168:148 })),
            // boss nameplate + HP
            e('div',{ style:{ position:'absolute', top:-46, left:'50%', transform:'translateX(-50%)', width:230, textAlign:'center' } },
              e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:4, flexWrap:'wrap' } },
                boss.tier!=='normal' ? e('span',{ className:'type-tag', style:{ background: boss.tier==='legend'?'var(--coin)':'var(--lav)', color:'#fff', fontSize:8 } }, boss.tier==='legend'?'⭐ LEGENDARY':'✨ ELITE') : null,
                e('span',{ className:'type-tag', style:{ background:RARITY[boss.rarity].color, color:'#fff', fontSize:8 } }, RARITY[boss.rarity].label),
                e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color:'var(--wood-dark)', textShadow:'0 1px 0 #fff' } }, (boss.shiny?'✨':'')+boss.name+'  Lv'+boss.level)),
              e('div',{ className:'hpbar' }, e('i',{ style:{ width:Math.max(0, boss.hp/boss.maxHp*100)+'%' } })))
          ) : null,

          // team gathered around boss (or idling)
          team.map((m,i)=>{
            const p = boss ? RING[i] : IDLE[i];
            return e('div',{ key:m.iid, className:'wanderer', style:{ left:p.x+'%', top:p.y+'%' } },
              e('div',{ style:{ position:'relative' } },
                e(Creature,{ inst:m, size:46, bob:running || !active }),
                e('div',{ style:{ position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)', fontFamily:"'Silkscreen'", fontSize:7, color:'var(--wood-dark)', background:'rgba(255,255,255,.75)', padding:'1px 3px', borderRadius:3, whiteSpace:'nowrap' } }, 'Lv'+m.level)));
          }),

          // floating damage numbers (per-tick, per-pokemon)
          boss && running ? (window.Store.dmgEvents||[]).filter(d=> now-d.t < 850).map(d=>{
            const p = RING[d.slot] || RING[0];
            const jx = ((d.id.charCodeAt(0)||0)%16) - 8;
            return e('div',{ key:d.id, className:'float-dmg'+(d.crit?' crit':''),
              style:{ left:'calc('+p.x+'% + '+jx+'px)', top:(p.y-7)+'%' } },
              (d.crit?'✷':'')+'-'+d.dmg);
          }) : null,

          // header signs
          e('div',{ style:{ position:'absolute', top:10, left:10, display:'flex', gap:8, alignItems:'center' } },
            e('div',{ className:'wood-sign', style:{ padding:'6px 12px', fontFamily:"'Silkscreen'", fontSize:11 } }, zone.name),
            e('div',{ className:'wood-sign', style:{ padding:'6px 10px', fontSize:14 } }, weather.icon+' '+weather.name)),

          // session timer
          active ? e('div',{ className:'wood-sign', style:{ position:'absolute', top:10, right:10, padding:'6px 12px', display:'flex', alignItems:'center', gap:8 } },
            running ? e('span',{ className:'live-dot' }) : e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--coin-deep)' } }, '❚❚'),
            e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color: running?'var(--sage-deep)':'var(--coin-deep)' } }, running?'STUDYING':'PAUSED'),
            e('span',{ className:'study-clock', style:{ fontSize:20 } }, clock(Study.focusTime(s, now)))) : null,

          active && !running ? e(PausedNotice,{ s, tracker, now }) : null,
          !s ? e(DeployCard,{ team, tracker }) : null,
          s && !active ? e(SummaryCard,{ s }) : null,

          // control
          active ? e('div',{ style:{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)' } },
            e('button',{ className:'btn', onClick:()=>window.Store.endSession() }, 'End Session')) : null
        )
      ),
      // SIDE
      e('div',{ className:'panel cream', style:{ display:'flex', flexDirection:'column', gap:12, minHeight:0, overflow:'hidden' } },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Study Session'),
        e(TrackerStatus,{ tracker }),
        active ? e('div',{ className:'chip-card', style:{ padding:'10px 12px' } },
          e('div',{ style:{ display:'flex', justifyContent:'space-between', fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', textTransform:'uppercase', marginBottom:4 } },
            e('span',{}, 'This session'), e('span',{}, short(s.startedAt + Study.SESSION_CAP - now)+' left')),
          e('div',{ style:{ fontSize:13, color:'var(--ink-soft)', marginBottom:6 } },
            e('b',{ style:{ color:'var(--coin-deep)' } }, s.earned.coins+'c'), ' · '+s.earned.shards+' shards · '+s.earned.kills+' KO'),
          e('button',{ className:'study-target', title:'Bring LeetCode to the front', onClick:()=>window.Store.backToLeetCode() }, 'Back to LeetCode ↗')) : null,
        e('div',{ className:'chip-card', style:{ padding:'10px 12px' } },
          e('div',{ style:{ display:'flex', alignItems:'center', gap:6, marginBottom:6 } },
            e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color:'var(--wood-dark)' } }, zone.name),
            e('span',{ style:{ flex:1 } }),
            zone.types.map(t=> e(TypeTag,{ key:t, type:t }))),
          e('div',{ style:{ fontSize:12, color: weatherMatch?'var(--sage-deep)':'var(--ink-soft)', display:'flex', alignItems:'center', gap:6 } },
            weather.icon, e('span',{}, weather.note + (weatherMatch?'  — active!':'')))),
        e('div',{ style:{ display:'flex', gap:8 } },
          e('div',{ className:'stile', style:{ flex:1, padding:'8px 4px' } }, e('div',{ className:'lab' }, 'Studied today'),
            e('div',{ className:'val' }, short(st.meadow.studyToday))),
          e('div',{ className:'stile', style:{ flex:1, padding:'8px 4px' } }, e('div',{ className:'lab' }, 'Coins today'),
            e('div',{ className:'val', style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, color:'var(--coin-deep)' } }, e(Coin,{size:13}), st.meadow.coinsToday)),
          e('div',{ className:'stile', style:{ flex:1, padding:'8px 4px' } }, e('div',{ className:'lab' }, 'Bosses KO’d'),
            e('div',{ className:'val' }, st.meadow.kills))),
        e('div',{ className:'chip-card', style:{ padding:'8px 12px', flex:1, minHeight:0, overflowY:'auto' } },
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', marginBottom:6 } }, 'BATTLE LOG'),
          (!log || log.length===0)
            ? e('div',{ style:{ fontSize:14, color:'var(--ink-faint)', fontFamily:"'VT323'" } }, active ? 'Your team is heading out…' : 'Deploy your team to battle mini-bosses while you study.')
            : log.map((l)=> e('div',{ key:l.id, className:'log-line', style:{ color: l.k==='spawn'?'var(--lav-deep)':l.k==='away'?'var(--coin-deep)':'var(--ink-soft)' } }, '› '+l.t)))
      )
    );
  }
  window.Meadow = Meadow;
})();
