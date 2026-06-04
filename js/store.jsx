/* =====================================================================
   Store v4 — localStorage game state + pub/sub.
   New: shiny + mega/gmax forms + evolution-by-duplicate, rarity-tier
   meadow bosses (slower idle), custom problems + GitHub sync.
===================================================================== */
(function(){
  const KEY = 'pokeleet_v4';
  const { OWNED, TEAM } = window.DATA;
  const PM = window.PixelMon;
  const RARITY = PM.RARITY;
  const CAP = window.DATA.LEVEL_CAP;
  const expToNext = window.DATA.expToNext;
  const TODAY = '2026-06-04';

  function seed(){
    return {
      shards: 1850, coins: 640,
      claims: {}, solved: {},
      owned: OWNED.map(o=>({...o})),
      team: TEAM.slice(),
      quests: {}, recallBest: 0,
      pity: 0, totalPulls: 0,
      customProblems: {},                 // catId -> [{id,name,diff,cat,code}]
      repo: { owner:'', name:'', branch:'main' },
      syncedPaths: {},                    // normalizedName -> repo path
      fetchedCode: {},                    // problemId -> code string
      lastSync: 0,
      meadow: { patrolling:false, coinsToday:0, kills:0, boss:null, nextSpawnAt:0, lastActive:0 },
      lastDay: TODAY, v: 4,
    };
  }

  let state = load();
  const subs = new Set();
  function load(){
    try{ const raw = localStorage.getItem(KEY);
      if(raw){ const s = JSON.parse(raw); if(s && s.v===4) return Object.assign(seed(), s,
        { meadow: Object.assign(seed().meadow, s.meadow||{}), repo: Object.assign(seed().repo, s.repo||{}) }); }
    }catch(e){}
    return seed();
  }
  function persist(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }
  function emit(){ persist(); subs.forEach(fn=>fn()); }
  function set(next){ state = next; emit(); }

  function addExpToInst(inst, amount){
    let { level, exp } = inst; exp += amount;
    while(level < CAP && exp >= expToNext(level)){ exp -= expToNext(level); level++; }
    if(level >= CAP){ level = CAP; exp = Math.min(exp, expToNext(CAP)); }
    return { ...inst, level, exp };
  }
  function addLevels(inst, n){
    let level = Math.min(CAP, inst.level + n);
    return { ...inst, level, exp: level>=CAP ? 0 : inst.exp };
  }
  function mapExp(owned, iids, amount){ const t=new Set(iids); return owned.map(o=> t.has(o.iid)?addExpToInst(o,amount):o); }

  const Store = {
    get(){ return state; },
    subscribe(fn){ subs.add(fn); return ()=>subs.delete(fn); },
    reset(){ stopEngine(); set(seed()); },

    claimSolve(problemId, shardAmt){
      if(state.claims[problemId]) return;
      set({ ...state, claims:{ ...state.claims, [problemId]:true },
        shards: state.shards + shardAmt, owned: mapExp(state.owned, state.team, 1) });
    },

    addShards(n){ set({ ...state, shards: state.shards+n }); },
    spendShards(n){ if(state.shards<n) return false; set({ ...state, shards: state.shards-n }); return true; },
    addCoins(n){ set({ ...state, coins: state.coins+n }); },
    spendCoins(n){ if(state.coins<n) return false; set({ ...state, coins: state.coins-n }); return true; },

    addCreature(speciesId, shiny){
      const iid = 'g'+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36);
      const inst = { iid, sp:speciesId, level:1, exp:0, shiny:!!shiny, form:null, copies:0 };
      set({ ...state, owned:[...state.owned, inst] });
      return inst;
    },
    setTeam(team){ set({ ...state, team: team.slice(0,6) }); },

    // ---- GACHA (cost deducted by caller) ----
    gachaPull(count){
      let owned = state.owned.slice();
      let shards = state.shards, pity = state.pity, totalPulls = state.totalPulls;
      const results = [];
      for(let i=0;i<count;i++){
        pity++; totalPulls++;
        let sp = (pity>=50) ? PM.randomOfTier('legendary') : PM.rollSpecies();
        const pityHit = pity>=50 && sp.rarity==='legendary';
        if(sp.rarity==='legendary') pity = 0;
        const shiny = PM.rollShiny();

        const idx = owned.findIndex(o=> o.sp===sp.id && !!o.shiny===shiny);
        if(idx>=0){
          shards += 25;                                   // small consolation
          const evo = PM.evoTarget(PM.byId(sp.id));
          if(evo){
            let copies = (owned[idx].copies||0)+1;
            if(copies >= PM.EVO_COPIES){
              owned[idx] = { ...owned[idx], sp:evo, copies:0 };
              results.push({ speciesId:sp.id, shiny, rarity:sp.rarity, isDup:true, evolvedTo:evo, pity:pityHit });
            } else {
              owned[idx] = { ...owned[idx], copies };
              results.push({ speciesId:sp.id, shiny, rarity:sp.rarity, isDup:true, copies, need:PM.EVO_COPIES, refund:25, pity:pityHit });
            }
          } else {
            owned[idx] = addLevels(owned[idx], PM.DUP_LEVELS);
            results.push({ speciesId:sp.id, shiny, rarity:sp.rarity, isDup:true, levels:PM.DUP_LEVELS, refund:25, pity:pityHit });
          }
        } else {
          const iid = 'g'+Date.now().toString(36)+i+Math.floor(Math.random()*1296).toString(36);
          owned.push({ iid, sp:sp.id, level:1, exp:0, shiny, form:null, copies:0 });
          results.push({ speciesId:sp.id, shiny, rarity:sp.rarity, isNew:true, pity:pityHit });
        }
      }
      set({ ...state, owned, shards, pity, totalPulls });
      return results;
    },

    // ---- SHOP ----
    rareCandy(iid){ if(state.coins<200) return false; set({ ...state, coins:state.coins-200, owned: mapExp(state.owned,[iid],20) }); return true; },
    teamSnack(){ if(state.coins<500) return false; set({ ...state, coins:state.coins-500, owned: mapExp(state.owned, state.team,5) }); return true; },
    megaStone(iid){
      const inst = state.owned.find(o=>o.iid===iid); const sp = inst && PM.byId(inst.sp);
      if(!inst || !PM.canTransform(sp) || inst.form) return false;
      if(state.coins<1500) return false;
      set({ ...state, coins:state.coins-1500, owned: state.owned.map(o=> o.iid===iid?{ ...o, form:PM.transformKind(sp) }:o) });
      return true;
    },

    completeQuest(id){ if(state.quests[id]) return; set({ ...state, quests:{ ...state.quests,[id]:true } }); },
    grantQuest(id, shards){ if(state.quests[id]) return; set({ ...state, quests:{ ...state.quests,[id]:true }, shards:state.shards+shards }); },
    setRecallBest(n){ if(n>state.recallBest) set({ ...state, recallBest:n }); },

    // ---- PROBLEMS (custom + sync) ----
    addProblem(catId, name, diff){
      const id = 'cust-'+catId+'-'+Date.now().toString(36);
      const list = state.customProblems[catId] ? state.customProblems[catId].slice() : [];
      list.push({ id, name, diff, cat:catId, code:'' });
      set({ ...state, customProblems:{ ...state.customProblems, [catId]:list } });
      return id;
    },
    removeProblem(catId, pid){
      const list = (state.customProblems[catId]||[]).filter(p=>p.id!==pid);
      const solved = { ...state.solved }; delete solved[pid];
      set({ ...state, customProblems:{ ...state.customProblems, [catId]:list }, solved });
    },
    setSolved(pid, val){ const solved={...state.solved}; if(val) solved[pid]=true; else delete solved[pid]; set({ ...state, solved }); },
    setRepo(owner,name,branch){ set({ ...state, repo:{ owner, name, branch:branch||'main' } }); },
    cacheCode(pid, code){ set({ ...state, fetchedCode:{ ...state.fetchedCode, [pid]:code } }); },
    applySync(solvedIds, paths){
      const solved = { ...state.solved }; solvedIds.forEach(id=> solved[id]=true);
      set({ ...state, solved, syncedPaths:{ ...state.syncedPaths, ...paths }, lastSync:Date.now() });
    },

    // ---- MEADOW control ----
    startPatrol(){ if(state.meadow.patrolling) return; set({ ...state, meadow:{ ...state.meadow, patrolling:true, lastActive:Date.now() } }); },
    stopPatrol(){ set({ ...state, meadow:{ ...state.meadow, patrolling:false, boss:null } }); },
    meadowLog: [],
  };

  // ---- live problem helpers (built-in + custom) ----
  function problemsFor(catId){ return (window.DATA.PROBLEMS[catId]||[]).concat(state.customProblems[catId]||[]); }
  function allProblemsLive(){ return window.DATA.CATEGORIES.flatMap(c=> problemsFor(c.id)); }
  function isSolved(p){ return !!(p.solved || state.solved[p.id]); }
  function codeFor(p){ return state.fetchedCode[p.id] || p.code || ''; }
  Store.problemsFor = problemsFor; Store.allProblemsLive = allProblemsLive; Store.isSolved = isSolved; Store.codeFor = codeFor;

  // ==================== GLOBAL MEADOW ENGINE =========================
  let engineTimer = null;
  const TICK_MS = 700;
  function pushLog(line,k){ Store.meadowLog = [{ t:line, k:k||'win', id:Math.random() }, ...Store.meadowLog].slice(0,40); }

  // boss tier roll: 78% normal, 17% elite, 5% legendary
  function rollBoss(zone){
    const r = Math.random();
    let tier = r<0.05?'legend' : r<0.22?'elite' : 'normal';
    let pool;
    if(tier==='legend') pool = PM.SPECIES.filter(s=> s.rarity==='legendary' || s.rarity==='epic');
    else if(tier==='elite') pool = PM.SPECIES.filter(s=> zone.types.some(t=>s.types.includes(t)) && (s.rarity==='rare'||s.rarity==='epic'));
    else pool = PM.SPECIES.filter(s=> zone.types.some(t=>s.types.includes(t)));
    if(!pool || !pool.length) pool = PM.SPECIES;
    const sp = pool[Math.floor(Math.random()*pool.length)];
    const shiny = Math.random() < 0.02;
    const tp = Math.max(20, window.Derived.teamPower());
    const mult = tier==='legend'?6 : tier==='elite'?3 : 1;
    const maxHp = Math.round(tp * (28+Math.random()*10) * mult);
    const lvl = (tier==='legend'?40:tier==='elite'?25:10) + Math.floor(Math.random()*20);
    return { sp:sp.id, name:sp.name, rarity:sp.rarity, tier, shiny, level:lvl, maxHp, hp:maxHp, born:Date.now() };
  }

  function tick(){
    const m = state.meadow; if(!m.patrolling) return;
    const { zone, weather } = window.DATA.daySeed(TODAY);
    const now = Date.now();
    if(!m.boss){
      if(now >= (m.nextSpawnAt||0)){
        const boss = rollBoss(zone);
        const tag = boss.tier==='legend'?'\u2b50 LEGENDARY ':boss.tier==='elite'?'\u2728 ELITE ':'';
        pushLog('A '+tag+'wild '+(boss.shiny?'\u2728shiny ':'')+boss.name+' appeared!','spawn');
        set({ ...state, meadow:{ ...m, boss, lastActive:now } });
      }
      return;
    }
    const tp = Math.max(10, window.Derived.teamPower());
    const teamTypes = window.Derived.teamList().map(x=> PM.byId(x.sp).type);
    const weatherBuff = teamTypes.includes(weather.type) ? 1.4 : 1;
    const dps = tp * 0.18 * weatherBuff * (0.9 + Math.random()*0.2);   // slower
    let hp = m.boss.hp - dps;
    if(hp <= 0){
      const tierMult = m.boss.tier==='legend'?8 : m.boss.tier==='elite'?3 : 1;
      const baseCoins = zone.coinFloor + Math.floor(Math.random()*(zone.coinCeil-zone.coinFloor+1));
      const coins = Math.round(baseCoins * 0.4 * tierMult * weatherBuff);   // slower coins
      const shardP = zone.shardChance * tierMult;
      const shards = Math.random()<shardP ? 20+Math.floor(Math.random()*40) : 0;
      const exp = m.boss.tier==='legend'?6 : m.boss.tier==='elite'?3 : 1;
      const tag = m.boss.tier==='legend'?'\u2b50 ':m.boss.tier==='elite'?'\u2728 ':'';
      pushLog('Defeated '+tag+m.boss.name+'!  +'+coins+'c'+(shards?'  +'+shards+' shards':''),'win');
      set({ ...state, coins:state.coins+coins, shards:state.shards+shards,
        owned: mapExp(state.owned, state.team, exp),
        meadow:{ ...m, boss:null, nextSpawnAt: now+2200, coinsToday:m.coinsToday+coins, kills:m.kills+1, lastActive:now } });
    } else {
      set({ ...state, meadow:{ ...m, boss:{ ...m.boss, hp }, lastActive:now } });
    }
  }

  function startEngine(){
    if(engineTimer) return;
    const m = state.meadow;
    if(m.patrolling && m.lastActive){
      const awaySec = Math.min(4*3600, (Date.now()-m.lastActive)/1000);
      if(awaySec > 60){
        const { zone } = window.DATA.daySeed(TODAY);
        const avgFight = 140, kills = Math.floor(awaySec/avgFight);
        if(kills>0){
          const avgCoins = Math.round((zone.coinFloor+zone.coinCeil)/2 * 0.4 * 1.4);
          const coins = kills*avgCoins;
          pushLog('While away: '+kills+' encounters cleared  \u00b7  +'+coins+'c','away');
          set({ ...state, coins:state.coins+coins, meadow:{ ...m, coinsToday:m.coinsToday+coins, kills:m.kills+kills, lastActive:Date.now() } });
        }
      }
    }
    engineTimer = setInterval(tick, TICK_MS);
  }
  function stopEngine(){ if(engineTimer){ clearInterval(engineTimer); engineTimer=null; } }

  // ---------------- derived ----------------
  function monPower(inst){
    const sp = PM.byId(inst.sp); if(!sp) return 0;
    let p = inst.level * RARITY[sp.rarity].mult;
    if(inst.form) p *= PM.FORM_BONUS[inst.form]||1;
    return Math.round(p);
  }
  function solvedCounts(){
    let easy=0, med=0, hard=0;
    allProblemsLive().forEach(p=>{ if(!isSolved(p)) return; if(p.diff==='Easy') easy++; else if(p.diff==='Medium') med++; else hard++; });
    return { easy, med, hard, total: easy+med+hard };
  }
  function weightedPoints(){ const c=solvedCounts(); return c.easy*1 + c.med*3 + c.hard*10; }
  function teamMultiplier(){ return Math.min(2, 1 + Math.floor(weightedPoints()/50)*0.05); }
  function teamList(){ const byId=Object.fromEntries(state.owned.map(o=>[o.iid,o])); return state.team.map(i=>byId[i]).filter(Boolean); }
  function teamBasePower(){ return teamList().reduce((s,m)=> s+monPower(m), 0); }
  function teamPower(){ return Math.round(teamBasePower()*teamMultiplier()); }
  function categoryStats(){
    return window.DATA.CATEGORIES.map(cat=>{
      const probs = problemsFor(cat.id);
      const solved = probs.filter(isSolved).length;
      return { ...cat, solved, count:probs.length, pct: probs.length?solved/probs.length:0 };
    });
  }
  function streakInfo(){
    const grid = window.DATA.STREAK; const flat=[];
    for(let d=0; d<7; d++) for(let w=0; w<grid.length; w++) flat.push(grid[w][d]);
    let cur=0; for(let i=flat.length-1;i>=0;i--){ if(flat[i]>0) cur++; else break; }
    let best=0,run=0; flat.forEach(v=>{ if(v>0){run++; best=Math.max(best,run);} else run=0; });
    return { current: Math.max(cur,12), best: Math.max(best,41), active: flat.filter(v=>v>0).length };
  }

  function useStore(selector){
    const sel = selector || (s=>s);
    const [, force] = React.useReducer(x=>x+1, 0);
    React.useEffect(()=> Store.subscribe(force), []);
    return sel(state);
  }

  Store.startEngine = startEngine; Store.stopEngine = stopEngine;
  window.Store = Store; window.useStore = useStore;
  window.Derived = { monPower, solvedCounts, weightedPoints, teamMultiplier,
    teamList, teamBasePower, teamPower, categoryStats, streakInfo, expToNext };
})();
