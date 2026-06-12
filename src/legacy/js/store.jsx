/* =====================================================================
   Store v4 — localStorage game state + pub/sub.
   Shiny + mega/gmax forms (unlock + switch) + evolution-by-duplicate,
   tiered pity (epic@15 / legendary@40 / chosen-target@100), tiered
   meadow combat with per-mon damage events, dated solve log.
===================================================================== */
(function(){
  const KEY = 'pokeleet_v5';
  const BACKUP_VERSION = 1;
  const { OWNED, TEAM } = window.DATA;
  const PM = window.PixelMon;
  const RARITY = PM.RARITY;
  const CAP = window.DATA.LEVEL_CAP;
  const expToNext = window.DATA.expToNext;
  function getToday(){ return window.DateUtil.todayLocal(); }
  function daysAgo(n, base){ return window.DateUtil.daysAgo(n, base || getToday()); }

  // pity thresholds
  const EPIC_PITY = 15, LEGEND_PITY = 40, LEGEND_TARGET_PITY = 100, EPIC_TARGET_PITY = 60;

  function rollDailyState(base){
    const today = getToday();
    if(!base || base.lastDay === today) return base;
    return {
      ...base,
      quests: {},
      recallToday: false,
      meadow: { ...(base.meadow||{}), coinsToday: 0 },
      lastDay: today,
    };
  }

  // Give evolvable mons a few duplicate copies so the evolution flow is live.
  function applyDemoCopies(owned, team){
    return owned.map(o=>{
      const sp = PM.byId(o.sp);
      const canEvo = sp && (sp.evo || sp.id==='eevee');
      const copies = (o.copies!=null && o.copies>0) ? o.copies
        : !canEvo ? (o.copies||0) : (team.includes(o.iid) ? PM.EVO_COPIES : 3);
      return { ...o, copies };
    });
  }
  // ensure every instance has an `unlocked` form set (derive from any legacy form)
  function migrateForms(owned){
    return owned.map(o=>{
      let u = o.unlocked || {};
      if(o.form && !u[o.form]) u = { ...u, [o.form]:true };
      return { ...o, unlocked:u };
    });
  }

  // Seed dated solves for the statically-solved problems so the training log
  // is populated and accurate. Dense recent days -> nice current streak.
  function seedSolveDates(){
    const map = {};
    const solved = [];
    Object.values(window.DATA.PROBLEMS).forEach(arr=> arr.forEach(p=>{ if(p.solved) solved.push(p.id); }));
    solved.sort();
    solved.forEach((id,i)=>{
      let off = i<48 ? Math.floor(i/2) : 24 + (i-48)*3;   // 2/day for ~24 recent days, then spread
      if(off>117) off = 117;
      map[id] = daysAgo(off);
    });
    return map;
  }

  // A brand-new “starter” account: 5000 gems, six starter friends
  // (3 common + 3 rare), nothing solved yet.
  function starterOwned(){
    const mk=(iid,sp)=>({ iid, sp, level:5, exp:0, shiny:false, form:null, unlocked:{}, copies:0 });
    return [
      mk('c1','bulbasaur'), mk('c2','caterpie'), mk('c3','magikarp'),   // 3 common
      mk('c4','charmander'), mk('c5','squirtle'), mk('c6','eevee'),     // 3 rare
    ];
  }

  function seed(){
    const owned = starterOwned();
    return {
      shards: 5000, coins: 0, megaStones: 0, gmaxStones: 0,
      claims: {}, solved: {}, solveDates: {},
      claimDates: {},
      owned: migrateForms(owned),
      team: owned.map(o=>o.iid), demoEvo: true,
      quests: {}, recallBest: 0, recallToday: false,
      pity: 0, epicPity: 0, totalPulls: 0,
      guaranteedLegendary: null, guaranteedEpic: null,
      legendaryTargetPity: 0, epicTargetPityCount: 0,
      customProblems: {}, customCategories: [],
      repo: { owner:'', name:'', branch:'main' },
      syncedPaths: {}, lastSync: 0,
      meadow: { patrolling:false, coinsToday:0, kills:0, boss:null, nextSpawnAt:0, lastActive:0 },
      lastDay: getToday(), v: 5,
    };
  }

  let state = load();
  const subs = new Set();
  function load(){
    try{ const raw = localStorage.getItem(KEY);
      if(raw){ const s = JSON.parse(raw); if(s && s.v===5){
        const merged = Object.assign(seed(), s,
          { meadow: Object.assign(seed().meadow, s.meadow||{}), repo: Object.assign(seed().repo, s.repo||{}) });
        // non-destructive migrations for older saves
        if(typeof merged.megaStones!=='number') merged.megaStones = 2;
        if(typeof merged.gmaxStones!=='number') merged.gmaxStones = 1;
        if(typeof merged.epicPity!=='number') merged.epicPity = 0;
        if(typeof merged.targetPity!=='number') merged.targetPity = 0;
        if(!('guaranteedLegendary' in merged)) merged.guaranteedLegendary = merged.guaranteedTarget || null;
        if(!('guaranteedEpic' in merged)) merged.guaranteedEpic = null;
        if(typeof merged.legendaryTargetPity!=='number') merged.legendaryTargetPity = merged.targetPity || 0;
        if(typeof merged.epicTargetPityCount!=='number') merged.epicTargetPityCount = 0;
        if(!merged.claimDates) merged.claimDates = {};
        if(typeof merged.recallToday!=='boolean') merged.recallToday = false;
        if(!s.demoEvo){ merged.owned = applyDemoCopies(merged.owned, merged.team); merged.demoEvo = true; }
        merged.owned = migrateForms(merged.owned);
        if(!s.solveDates || !Object.keys(s.solveDates).length) merged.solveDates = seedSolveDates();
        delete merged.fetchedCode;
        delete merged.guaranteedTarget;
        delete merged.targetPity;
        return rollDailyState(merged);
      } }
    }catch(e){}
    return rollDailyState(seed());
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
    reset(){ stopEngine(); Store.dmgEvents=[]; set(seed()); },

    claimSolve(problemId, shardAmt){
      if(state.claims[problemId]) return;
      const solveDates = { ...state.solveDates };
      const claimDates = { ...state.claimDates };
      const today = getToday();
      if(!solveDates[problemId]) solveDates[problemId] = getToday();
      claimDates[problemId] = today;
      set({ ...state, claims:{ ...state.claims, [problemId]:true }, solveDates,
        claimDates,
        shards: state.shards + shardAmt, owned: mapExp(state.owned, state.team, 1) });
    },

    addShards(n){ set({ ...state, shards: state.shards+n }); },
    spendShards(n){ if(state.shards<n) return false; set({ ...state, shards: state.shards-n }); return true; },
    addCoins(n){ set({ ...state, coins: state.coins+n }); },
    spendCoins(n){ if(state.coins<n) return false; set({ ...state, coins: state.coins-n }); return true; },

    addCreature(speciesId, shiny){
      const iid = 'g'+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36);
      const inst = { iid, sp:speciesId, level:1, exp:0, shiny:!!shiny, form:null, unlocked:{}, copies:0 };
      set({ ...state, owned:[...state.owned, inst] });
      return inst;
    },
    setTeam(team){ set({ ...state, team: team.slice(0,6) }); },

    // ---- GACHA (cost deducted by caller) ----
    setLegendaryTarget(spId){ set({ ...state, guaranteedLegendary: spId||null, legendaryTargetPity: 0 }); },
    setEpicTarget(spId){ set({ ...state, guaranteedEpic: spId||null, epicTargetPityCount: 0 }); },
    gachaPull(count){
      let owned = state.owned.slice();
      let shards = state.shards;
      let legendPity = state.pity||0, epicPity = state.epicPity||0, totalPulls = state.totalPulls||0;
      let legendTargetPity = state.legendaryTargetPity||0, epicTargetPity = state.epicTargetPityCount||0;
      const legendTarget = state.guaranteedLegendary;
      const epicTarget = state.guaranteedEpic;
      const results = [];
      for(let i=0;i<count;i++){
        legendPity++; epicPity++; if(legendTarget) legendTargetPity++; if(epicTarget) epicTargetPity++; totalPulls++;
        let sp, pityHit=false, targetHit=false, targetTier=null;
        if(legendTarget && legendTargetPity>=LEGEND_TARGET_PITY){ sp = PM.byId(legendTarget); targetHit=true; targetTier='legendary'; }
        else if(epicTarget && epicTargetPity>=EPIC_TARGET_PITY){ sp = PM.byId(epicTarget); targetHit=true; targetTier='epic'; }
        else if(legendPity>=LEGEND_PITY){ sp = PM.randomOfTier('legendary'); pityHit=true; }
        else if(epicPity>=EPIC_PITY){ sp = (Math.random()<0.82) ? PM.randomOfTier('epic') : PM.randomOfTier('legendary'); }
        else { sp = PM.rollSpecies(); }
        if(sp.rarity==='legendary') legendPity = 0;
        if(sp.rarity==='epic' || sp.rarity==='legendary') epicPity = 0;
        if(legendTarget && sp.id===legendTarget) legendTargetPity = 0;
        if(epicTarget && sp.id===epicTarget) epicTargetPity = 0;
        const shiny = PM.rollShiny();

        const idx = owned.findIndex(o=> o.sp===sp.id && !!o.shiny===shiny);
        if(idx>=0){
          shards += 25;
          const evo = PM.evoTarget(PM.byId(sp.id));
          if(evo){
            const copies = Math.min(PM.EVO_COPIES, (owned[idx].copies||0)+1);
            owned[idx] = { ...owned[idx], copies };
            results.push({ speciesId:sp.id, shiny, rarity:sp.rarity, isDup:true, copies, need:PM.EVO_COPIES, refund:25, ready: copies>=PM.EVO_COPIES, pity:pityHit, target:targetHit, targetTier });
          } else {
            owned[idx] = addLevels(owned[idx], PM.DUP_LEVELS);
            results.push({ speciesId:sp.id, shiny, rarity:sp.rarity, isDup:true, levels:PM.DUP_LEVELS, refund:25, pity:pityHit, target:targetHit, targetTier });
          }
        } else {
          const iid = 'g'+Date.now().toString(36)+i+Math.floor(Math.random()*1296).toString(36);
          owned.push({ iid, sp:sp.id, level:1, exp:0, shiny, form:null, unlocked:{}, copies:0 });
          results.push({ speciesId:sp.id, shiny, rarity:sp.rarity, isNew:true, pity:pityHit, target:targetHit, targetTier });
        }
      }
      set({ ...state, owned, shards, pity:legendPity, epicPity, legendaryTargetPity:legendTargetPity, epicTargetPityCount:epicTargetPity, totalPulls });
      return results;
    },

    // ---- SHOP ----
    rareCandy(iid){ if(state.coins<200) return false; set({ ...state, coins:state.coins-200, owned: mapExp(state.owned,[iid],35) }); return true; },
    teamSnack(){ if(state.coins<500) return false; set({ ...state, coins:state.coins-500, owned: mapExp(state.owned, state.team,5) }); return true; },
    buyMegaStone(){ if(state.coins<1500) return false; set({ ...state, coins:state.coins-1500, megaStones:(state.megaStones||0)+1 }); return true; },
    buyGmaxStone(){ if(state.coins<1500) return false; set({ ...state, coins:state.coins-1500, gmaxStones:(state.gmaxStones||0)+1 }); return true; },

    // ---- forms: unlock with a stone, then switch freely ----
    useMegaStone(iid){
      const inst = state.owned.find(o=>o.iid===iid); const sp = inst && PM.byId(inst.sp);
      if(!inst || !sp || !sp.mega || (inst.unlocked&&inst.unlocked.mega) || (state.megaStones||0)<=0) return false;
      set({ ...state, megaStones: state.megaStones-1,
        owned: state.owned.map(o=> o.iid===iid?{ ...o, unlocked:{ ...(o.unlocked||{}), mega:true }, form:'mega' }:o) });
      return true;
    },
    useGmaxStone(iid){
      const inst = state.owned.find(o=>o.iid===iid); const sp = inst && PM.byId(inst.sp);
      if(!inst || !sp || !sp.gmax || (inst.unlocked&&inst.unlocked.gmax) || (state.gmaxStones||0)<=0) return false;
      set({ ...state, gmaxStones: state.gmaxStones-1,
        owned: state.owned.map(o=> o.iid===iid?{ ...o, unlocked:{ ...(o.unlocked||{}), gmax:true }, form:'gmax' }:o) });
      return true;
    },
    setForm(iid, form){
      const inst = state.owned.find(o=>o.iid===iid); if(!inst) return false;
      if(form && !(inst.unlocked && inst.unlocked[form])) return false;
      set({ ...state, owned: state.owned.map(o=> o.iid===iid?{ ...o, form: form||null }:o) });
      return true;
    },
    addMegaStones(n){ set({ ...state, megaStones:(state.megaStones||0)+n }); },
    addGmaxStones(n){ set({ ...state, gmaxStones:(state.gmaxStones||0)+n }); },
    buyEvolutionCopy(iid){
      const inst = state.owned.find(o=>o.iid===iid); if(!inst) return false;
      const sp = PM.byId(inst.sp); const evoChoices = sp && PM.evoOptions(sp);
      if(!sp || !evoChoices || !evoChoices.length || state.coins<800) return false;
      set({ ...state, coins:state.coins-800,
        owned: state.owned.map(o=> o.iid===iid ? { ...o, copies: Math.min(PM.EVO_COPIES, (o.copies||0)+1) } : o) });
      return true;
    },

    // ---- evolve by duplicate copies (player-initiated) ----
    evolveByDuplicates(iid, chosenEvo){
      const inst = state.owned.find(o=>o.iid===iid); if(!inst) return false;
      const sp = PM.byId(inst.sp); const options = sp && PM.evoOptions(sp);
      const evo = chosenEvo && options && options.includes(chosenEvo) ? chosenEvo : (sp && PM.evoTarget(sp));
      if(!evo || (inst.copies||0) < PM.EVO_COPIES) return false;
      set({ ...state, owned: state.owned.map(o=> o.iid===iid?{ ...o, sp:evo, copies:0, form:null, unlocked:{} }:o) });
      return true;
    },

    completeQuest(id){ if(state.quests[id]) return; set({ ...state, quests:{ ...state.quests,[id]:true } }); },
    grantQuest(id, shards){ if(state.quests[id]) return; set({ ...state, quests:{ ...state.quests,[id]:true }, shards:state.shards+shards }); },
    setRecallBest(n){ set({ ...state, recallBest: Math.max(state.recallBest, n), recallToday:true }); },

    // ---- PROBLEMS (custom + sync + dated solves) ----
    // ---- CATEGORIES (custom) ----
    addCategory(name){
      const slug = (name||'').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,16) || 'set';
      const id = 'cat-'+slug+'-'+Date.now().toString(36);
      const list = [...(state.customCategories||[]), { id, name: name.trim(), total:0, custom:true }];
      set({ ...state, customCategories:list });
      return id;
    },
    removeCategory(id){
      const customProblems = { ...state.customProblems }; delete customProblems[id];
      set({ ...state, customCategories:(state.customCategories||[]).filter(c=>c.id!==id), customProblems });
    },

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
      const solveDates = { ...state.solveDates }; delete solveDates[pid];
      set({ ...state, customProblems:{ ...state.customProblems, [catId]:list }, solved, solveDates });
    },
    setSolved(pid, val){
      const solved = { ...state.solved }; const solveDates = { ...state.solveDates };
      if(val){ solved[pid]=true; if(!solveDates[pid]) solveDates[pid]=getToday(); }
      else { delete solved[pid]; delete solveDates[pid]; }
      set({ ...state, solved, solveDates });
    },
    setSolveDate(pid, date){
      const solveDates = { ...state.solveDates };
      if(date) solveDates[pid] = date; else delete solveDates[pid];
      set({ ...state, solveDates });
    },
    setRepo(owner,name,branch){ set({ ...state, repo:{ owner, name, branch:branch||'main' } }); },
    applySync(solvedIds, paths){
      const solved = { ...state.solved }; const solveDates = { ...state.solveDates };
      const today = getToday();
      solvedIds.forEach(id=>{
        solved[id] = true;
        if(!solveDates[id]) solveDates[id] = today;
      });
      set({ ...state, solved, solveDates,
        syncedPaths:{ ...state.syncedPaths, ...paths },
        lastDay: today,
        lastSync:Date.now() });
    },
    exportData(){
      return JSON.stringify({
        type:'pokeleet-backup',
        version:BACKUP_VERSION,
        exportedAt:new Date().toISOString(),
        state,
      }, null, 2);
    },
    importData(raw){
      let parsed;
      try{ parsed = JSON.parse(raw); }catch(e){ throw new Error('Backup file is not valid JSON.'); }
      const nextState = parsed && parsed.type==='pokeleet-backup' ? parsed.state : parsed;
      if(!nextState || nextState.v !== 5) throw new Error('Backup format is not supported by this version.');
      const merged = Object.assign(seed(), nextState,
        { meadow: Object.assign(seed().meadow, nextState.meadow||{}), repo: Object.assign(seed().repo, nextState.repo||{}) });
      merged.owned = migrateForms(merged.owned);
      delete merged.fetchedCode;
      set(rollDailyState(merged));
    },

    // ---- MEADOW control ----
    startPatrol(){ if(state.meadow.patrolling) return; Store.dmgEvents=[]; set({ ...state, meadow:{ ...state.meadow, patrolling:true, nextSpawnAt: Date.now()+2200, lastActive:Date.now() } }); },
    stopPatrol(){ Store.dmgEvents=[]; set({ ...state, meadow:{ ...state.meadow, patrolling:false, boss:null } }); },
    meadowLog: [],
    dmgEvents: [],
  };

  // ---- live problem helpers ----
  function problemsFor(catId){ return (window.DATA.PROBLEMS[catId]||[]).concat(state.customProblems[catId]||[]); }
  function categories(){ return window.DATA.CATEGORIES.concat(state.customCategories||[]); }
  function allProblemsLive(){ return categories().flatMap(c=> problemsFor(c.id)); }
  Store.categories = categories;
  function isSolved(p){ return !!(p.solved || state.solved[p.id]); }
  function codeFor(p){
    const path = state.syncedPaths[p.id];
    return (path && window.LocalSolutionSync.resolveCode(path)) || p.code || '';
  }
  function solveDate(p){ return state.solveDates[p.id] || null; }
  Store.problemsFor = problemsFor; Store.allProblemsLive = allProblemsLive; Store.isSolved = isSolved; Store.codeFor = codeFor; Store.solveDate = solveDate;

  // ==================== GLOBAL MEADOW ENGINE =========================
  let engineTimer = null;
  const TICK_MS = 700;
  function pushLog(line,k){ Store.meadowLog = [{ t:line, k:k||'win', id:Math.random() }, ...Store.meadowLog].slice(0,40); }

  // tier roll: legendaries VERY infrequent
  function rollBoss(zone){
    const r = Math.random();
    let tier = r<0.025 ? 'legend' : r<0.18 ? 'elite' : 'normal';
    let pool;
    if(tier==='legend') pool = PM.SPECIES.filter(s=> s.rarity==='legendary');
    else if(tier==='elite') pool = PM.SPECIES.filter(s=> zone.types.some(t=>s.types.includes(t)) && (s.rarity==='rare'||s.rarity==='epic'));
    else pool = PM.SPECIES.filter(s=> zone.types.some(t=>s.types.includes(t)) && (s.rarity==='common'||s.rarity==='rare'));
    if(!pool || !pool.length) pool = PM.SPECIES.filter(s=> s.rarity==='common');
    if(!pool.length) pool = PM.SPECIES;
    const sp = pool[Math.floor(Math.random()*pool.length)];
    const shiny = Math.random() < (tier==='legend'?0.06:0.02);
    const tp = Math.max(20, window.Derived.teamPower());
    const hpMult = tier==='legend'?11 : tier==='elite'?4 : 1;
    const maxHp = Math.round(tp * (26+Math.random()*12) * hpMult);
    const lvl = (tier==='legend'?42:tier==='elite'?24:8) + Math.floor(Math.random()*(tier==='legend'?22:tier==='elite'?18:16));
    return { sp:sp.id, name:sp.name, rarity:sp.rarity, tier, shiny, level:lvl, maxHp, hp:maxHp, born:Date.now() };
  }

  // spawn gap (ms) — longer downtime so combat isn't back-to-back
  function spawnGap(){ return 7000 + Math.floor(Math.random()*6000); }   // 7–13s

  function tick(){
    const m = state.meadow; if(!m.patrolling) return;
    const { zone, weather } = window.DATA.daySeed(getToday());
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
    const mult = window.Derived.teamMultiplier();
    const team = window.Derived.teamList();
    // per-member damage with variation + crits -> floating numbers
    const evts = []; let total = 0;
    team.forEach((mem, idx)=>{
      const sp = PM.byId(mem.sp);
      const wBuff = (sp.types||[sp.type]).includes(weather.type) ? 1.4 : 1;
      let dmg = window.Derived.monPower(mem) * 0.18 * mult * wBuff * (0.78 + Math.random()*0.44);
      const crit = Math.random() < 0.16;
      if(crit) dmg *= 2;
      dmg = Math.max(1, Math.round(dmg));
      total += dmg;
      evts.push({ iid:mem.iid, slot:idx, dmg, crit, weather:wBuff>1, id:Math.random().toString(36).slice(2), t:now });
    });
    Store.dmgEvents = [...evts, ...Store.dmgEvents].slice(0, 48);
    let hp = m.boss.hp - total;
    if(hp <= 0){
      const rMult = RARITY[m.boss.rarity].mult;                       // 1 / 2 / 3 / 5
      const tierMult = m.boss.tier==='legend'?20 : m.boss.tier==='elite'?5 : 1;
      const lvlFactor = 0.5 + m.boss.level/40;                        // ~0.7 .. ~2.0
      const baseCoins = zone.coinFloor + Math.floor(Math.random()*(zone.coinCeil-zone.coinFloor+1));
      const variance = 0.8 + Math.random()*0.5;                       // ±
      const coins = Math.round(baseCoins * 0.35 * tierMult * lvlFactor * variance);
      const shardP = Math.min(0.95, zone.shardChance * tierMult);
      const shards = Math.random()<shardP ? Math.round((10 + Math.random()*30) * (rMult/2) * (m.boss.tier==='legend'?3:1)) : 0;
      const exp = m.boss.tier==='legend'?12 : m.boss.tier==='elite'?4 : 1;
      const tag = m.boss.tier==='legend'?'\u2b50 ':m.boss.tier==='elite'?'\u2728 ':'';
      pushLog('Defeated '+tag+m.boss.name+' (Lv'+m.boss.level+')!  +'+coins+'c'+(shards?'  +'+shards+'sh':''),'win');
      set({ ...state, coins:state.coins+coins, shards:state.shards+shards,
        owned: mapExp(state.owned, state.team, exp),
        meadow:{ ...m, boss:null, nextSpawnAt: now+spawnGap(), coinsToday:m.coinsToday+coins, kills:m.kills+1, lastActive:now } });
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
        const { zone } = window.DATA.daySeed(getToday());
        const avgFight = 165, kills = Math.floor(awaySec/avgFight);
        if(kills>0){
          const avgCoins = Math.round((zone.coinFloor+zone.coinCeil)/2 * 0.35 * 1.4);
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
    return categories().map(cat=>{
      const probs = problemsFor(cat.id);
      const solved = probs.filter(isSolved).length;
      return { ...cat, solved, count:probs.length, pct: probs.length?solved/probs.length:0 };
    });
  }

  // ---- dated training log ----
  function solveCountByDate(){
    const m = {}; const sd = state.solveDates||{};
    Object.values(sd).forEach(date=>{ if(date) m[date] = (m[date]||0)+1; });
    return m;
  }
  function trainingGrid(weeks){
    weeks = weeks||18;
    const counts = solveCountByDate();
    const todayDow = new Date(window.DateUtil.utcDateFromIso(getToday())).getUTCDay();           // 0 Sun .. 6 Sat
    const startOffset = (weeks-1)*7 + todayDow;
    const grid = [];
    for(let w=0; w<weeks; w++){
      const col = [];
      for(let d=0; d<7; d++){
        const off = startOffset - (w*7 + d);
        if(off < 0){ col.push(null); continue; }
        const date = daysAgo(off);
        col.push({ date, count: counts[date]||0 });
      }
      grid.push(col);
    }
    return { grid, counts };
  }
  function streakInfo(){
    const counts = solveCountByDate();
    let current = 0; for(let o=0;;o++){ if(counts[daysAgo(o)]) current++; else break; }
    let best=0, run=0; for(let o=220;o>=0;o--){ if(counts[daysAgo(o)]){ run++; best=Math.max(best,run); } else run=0; }
    return { current, best: Math.max(best,current), active: Object.keys(counts).length };
  }
  function ownedSpecies(){ const s=new Set(); state.owned.forEach(o=> s.add(o.sp)); return s; }
  function formSets(){
    const shiny=new Set(), mega=new Set(), gmax=new Set();
    state.owned.forEach(o=>{ if(o.shiny) shiny.add(o.sp); if(o.unlocked&&o.unlocked.mega) mega.add(o.sp); if(o.unlocked&&o.unlocked.gmax) gmax.add(o.sp); });
    return { shiny, mega, gmax };
  }

  function useStore(selector){
    const sel = selector || (s=>s);
    const [, force] = React.useReducer(x=>x+1, 0);
    React.useEffect(()=> Store.subscribe(force), []);
    return sel(state);
  }

  Store.startEngine = startEngine; Store.stopEngine = stopEngine;
  Store.daysAgo = daysAgo;
  Object.defineProperty(Store, 'TODAY', { get(){ return getToday(); } });
  window.Store = Store; window.useStore = useStore;
  window.Derived = { monPower, solvedCounts, weightedPoints, teamMultiplier,
    teamList, teamBasePower, teamPower, categoryStats, streakInfo, expToNext,
    trainingGrid, solveCountByDate, ownedSpecies, formSets };
})();
