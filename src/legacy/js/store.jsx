/* =====================================================================
   Store v6 — game state + problem library + pub/sub.
   Every change is handed to window.Persistence, which saves it to disk
   (data/) or, in the online demo, to this browser's localStorage.
   Problems are created by the player (title, difficulty, tags, pasted
   solution); a problem counts as solved once it has a solution.
   Shiny + mega/gmax forms (unlock + switch) + evolution-by-duplicate,
   tiered pity (epic@15 / legendary@40 / chosen-target@100), study
   sessions that power tiered meadow combat, dated solve log.
===================================================================== */
(function(){
  const PM = window.PixelMon;
  const RARITY = PM.RARITY;
  const CAP = window.DATA.LEVEL_CAP;
  const expToNext = window.DATA.expToNext;
  const Catalog = window.Catalog;
  const Persistence = window.Persistence;
  const Study = window.Study;        // src/study.js — the study timer
  const Tracker = window.Tracker;    // src/tracker.js — is LeetCode the active tab?
  const BACKUP_TYPE = 'pokeleet-backup', BACKUP_VERSION = 2;
  function getToday(){ return window.DateUtil.todayLocal(); }
  function daysAgo(n, base){ return window.DateUtil.daysAgo(n, base || getToday()); }
  const isDate = (d)=> typeof d==='string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
  // custom trainer photo: a small data: URL (the dashboard shrinks uploads before saving)
  const AVATAR_MAX_CHARS = 400000;
  const isAvatar = (a)=> typeof a==='string' && a.length<=AVATAR_MAX_CHARS && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(a);

  // pity thresholds
  const EPIC_PITY = 15, LEGEND_PITY = 40, LEGEND_TARGET_PITY = 100, EPIC_TARGET_PITY = 60;

  function rollDailyState(base){
    const today = getToday();
    if(!base || base.lastDay === today) return base;
    return {
      ...base,
      quests: {},
      recallToday: false,
      meadow: { ...(base.meadow||{}), coinsToday: 0, studyToday: 0 },
      lastDay: today,
    };
  }

  // ensure every instance has an `unlocked` form set (derive from any legacy form)
  function migrateForms(owned){
    return owned.map(o=>{
      let u = o.unlocked || {};
      if(o.form && !u[o.form]) u = { ...u, [o.form]:true };
      return { ...o, unlocked:u };
    });
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

  // lifetime counters for progression quests
  const seedStats = ()=> ({ evolutions:0, pityHits:0, recalls:0, perfectDays:0, lastPerfectDay:null });

  // Gacha items: bought with Coins in the Shop, spent on a Single Draw from the Gacha tab.
  // A "ball" sets the draw's rarity (only one per draw); a Generation Ticket narrows it to one generation.
  const GACHA_ITEMS = ['rateBooster', 'greatBall', 'ultraBall', 'genTicket'];
  const BALL_ITEM = { boost:'rateBooster', great:'greatBall', ultra:'ultraBall' };
  const seedItems = ()=> Object.fromEntries(GACHA_ITEMS.map(k=> [k, 0]));
  // Shop prices in Coins (the Shop page reads these too)
  const PRICES = { candy:400, snack:900, mega:6000, gmax:6000, shiny:10000,
    greatBall:1500, genTicket:2000, rateBooster:2500, ultraBall:4000 };

  function seedProgress(){
    const owned = starterOwned();
    return {
      // false until the first-run onboarding picks a name and starting team (the six above are placeholders)
      onboarded: false,
      stats: seedStats(), achievements: {},
      trainer: { name:'Trainer' }, createdAt: getToday(), preferredLanguage: 'python',
      shards: 5000, coins: 0, megaStones: 0, gmaxStones: 0,
      items: seedItems(),
      owned, team: owned.map(o=>o.iid),
      quests: {}, recallBest: 0, recallToday: false,
      pity: 0, epicPity: 0, totalPulls: 0,
      guaranteedLegendary: null, guaranteedEpic: null,
      legendaryTargetPity: 0, epicTargetPityCount: 0,
      // study time in ms; the live session itself is kept by src/study.js
      meadow: { coinsToday:0, kills:0, studyToday:0, studyTotal:0 },
      lastDay: getToday(), v: 6,
    };
  }

  // Fill in anything missing from a saved (or imported) progress document.
  function normalizeProgress(saved){
    const seed = seedProgress();
    const meadow = saved.meadow || {};
    const count = (n)=> Number.isFinite(n) && n>0 ? n : 0;
    const p = Object.assign(seed, saved, {
      trainer: { ...seed.trainer, ...(saved.trainer||{}) },
      // (drops the old always-on patrol's fields)
      meadow: { coinsToday:count(meadow.coinsToday), kills:count(meadow.kills),
        studyToday:count(meadow.studyToday), studyTotal:count(meadow.studyTotal) },
      // saves from before onboarding existed already have a team, so they skip it
      onboarded: 'onboarded' in saved ? !!saved.onboarded : Array.isArray(saved.owned) && saved.owned.length>0,
      stats: { ...seed.stats, ...(saved.stats||{}) },
      items: Object.fromEntries(Object.keys(seed.items).map(k=> [k, count((saved.items||{})[k])])),
      achievements: { ...(saved.achievements||{}) },
      v: 6,
    });
    delete p.problems; delete p.customTags;
    if(!isAvatar(p.trainer.avatar)) delete p.trainer.avatar;
    p.owned = migrateForms(Array.isArray(p.owned) ? p.owned : []);
    p.team = (Array.isArray(p.team) ? p.team : []).filter(iid=> p.owned.some(o=>o.iid===iid)).slice(0,6);
    return p;
  }

  function normalizeProblem(p){
    const difficulty = Catalog.DIFFICULTIES.includes(p.difficulty) ? p.difficulty : 'Medium';
    let url = Catalog.oneLine(p.url);
    if(url && !/^https?:\/\//i.test(url)) url = 'https://'+url;
    return {
      id: String(p.id),
      title: Catalog.oneLine(p.title).slice(0,120) || 'Untitled',
      difficulty,
      tags: [...new Set((Array.isArray(p.tags)?p.tags:[]).filter(t=> typeof t==='string' && t))],
      language: Catalog.languageById(p.language).id,
      code: typeof p.code==='string' ? p.code.replace(/\r\n?/g,'\n') : '',
      url,
      createdAt: p.createdAt || new Date().toISOString(),
      solvedAt: isDate(p.solvedAt) ? p.solvedAt : null,
      claimed: !!p.claimed,
      claimedAt: isDate(p.claimedAt) ? p.claimedAt : null,
    };
  }

  function normalizeLibrary(saved){
    const customTags = Catalog.tagList(saved.customTags).filter(t=>t.custom).map(t=>({ id:t.id, name:t.name }));
    const problems = (Array.isArray(saved.problems)?saved.problems:[])
      .filter(p=> p && p.id!=null && typeof p.title==='string')
      .map(normalizeProblem);
    return { problems, customTags };
  }

  function buildState(progress, library){
    return rollDailyState({ ...normalizeProgress(progress||{}), ...normalizeLibrary(library||{}) });
  }

  // First launch on this storage: pick up a save from the old localStorage-only version.
  function initialState(){
    let { progress, library } = Persistence.initial;
    // online demo, first visit: start with example problems and some Coins
    if(!progress && !library && window.DemoSeed) ({ progress, library } = window.DemoSeed.createDemoData());
    if(!progress){
      const legacy = window.LegacyImport.readLegacyState();
      if(legacy) ({ progress, library } = window.LegacyImport.importLegacyState(legacy, library || {}));
    }
    return buildState(progress, library);
  }

  let state = initialState();
  const subs = new Set();
  function emit(){ Persistence.save(state); subs.forEach(fn=>fn()); }
  function set(next){ state = rollDailyState(next); emit(); }
  Persistence.save(state);   // creates the files on first launch / stores any migration

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
  function newId(){ return 'p-'+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36); }

  const Store = {
    get(){ return state; },
    subscribe(fn){ subs.add(fn); return ()=>subs.delete(fn); },

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
    // First run: name, optional photo, and the six species from PixelMon.rollStarterTeam (all Lv5).
    completeOnboarding({ name, avatar, species }){
      if(state.onboarded) return false;
      if(!Array.isArray(species) || species.length!==6 || !species.every(id=>PM.byId(id)) || !PM.STARTERS.includes(species[0])) return false;
      const stamp = Date.now().toString(36);
      const owned = species.map((sp,i)=>({ iid:'s'+i+stamp, sp, level:5, exp:0, shiny:false, form:null, unlocked:{}, copies:0 }));
      const trainer = { name: Catalog.oneLine(name).slice(0,24) || 'Trainer' };
      if(isAvatar(avatar)) trainer.avatar = avatar;
      set({ ...state, onboarded:true, trainer, owned, team:owned.map(o=>o.iid), createdAt:getToday() });
      return true;
    },
    setTrainerName(name){
      set({ ...state, trainer:{ ...state.trainer, name: Catalog.oneLine(name).slice(0,24) || 'Trainer' } });
    },
    // dataUrl = a data:image URL, or null to go back to the default avatar
    setTrainerAvatar(dataUrl){
      if(dataUrl!=null && !isAvatar(dataUrl)) return false;
      const trainer = { ...state.trainer };
      if(dataUrl) trainer.avatar = dataUrl; else delete trainer.avatar;
      set({ ...state, trainer });
      return true;
    },

    // ---- GACHA (cost deducted by caller) ----
    setLegendaryTarget(spId){ set({ ...state, guaranteedLegendary: spId||null, legendaryTargetPity: 0 }); },
    setEpicTarget(spId){ set({ ...state, guaranteedEpic: spId||null, epicTargetPityCount: 0 }); },
    // use (Single Draw only): { ball:'boost'|'great'|'ultra'|null, gen:1-8|null } spends one of each item.
    // If a pity or target guarantee lands on that draw it wins, and the items are kept.
    gachaPull(count, use){
      const items = { ...state.items };
      const ball = count===1 && use && BALL_ITEM[use.ball] && items[BALL_ITEM[use.ball]]>0 ? use.ball : null;
      const gen = count===1 && use && items.genTicket>0 && PM.GENERATIONS.some(g=> g.gen===use.gen) ? use.gen : null;
      let owned = state.owned.slice();
      let shards = state.shards;
      let legendPity = state.pity||0, epicPity = state.epicPity||0, totalPulls = state.totalPulls||0;
      let legendTargetPity = state.legendaryTargetPity||0, epicTargetPity = state.epicTargetPityCount||0;
      const legendTarget = state.guaranteedLegendary;
      const epicTarget = state.guaranteedEpic;
      const results = [];
      let pityHits = 0;
      for(let i=0;i<count;i++){
        legendPity++; epicPity++; if(legendTarget) legendTargetPity++; if(epicTarget) epicTargetPity++; totalPulls++;
        let sp, pityHit=false, targetHit=false, targetTier=null, used=[], kept=false;
        if(legendTarget && legendTargetPity>=LEGEND_TARGET_PITY){ sp = PM.byId(legendTarget); targetHit=true; targetTier='legendary'; }
        else if(epicTarget && epicTargetPity>=EPIC_TARGET_PITY){ sp = PM.byId(epicTarget); targetHit=true; targetTier='epic'; }
        else if(legendPity>=LEGEND_PITY){ sp = PM.randomOfTier('legendary'); pityHit=true; }
        else if(epicPity>=EPIC_PITY){ sp = (Math.random()<0.82) ? PM.randomOfTier('epic') : PM.randomOfTier('legendary'); kept = !!(ball||gen); }
        else {
          sp = PM.rollSpecies({ boost: ball==='boost', tier: ball==='great' ? 'rare' : ball==='ultra' ? 'epic' : null, gen });
          if(ball){ items[BALL_ITEM[ball]]--; used.push(BALL_ITEM[ball]); }
          if(gen){ items.genTicket--; used.push('genTicket'); }
        }
        if((pityHit || targetHit) && (ball || gen)) kept = true;
        const itemInfo = { used, usedGen: used.includes('genTicket') ? gen : null, kept };
        if(pityHit || targetHit) pityHits++;
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
            results.push({ speciesId:sp.id, shiny, rarity:sp.rarity, isDup:true, copies, need:PM.EVO_COPIES, refund:25, ready: copies>=PM.EVO_COPIES, pity:pityHit, target:targetHit, targetTier, ...itemInfo });
          } else {
            owned[idx] = addLevels(owned[idx], PM.DUP_LEVELS);
            results.push({ speciesId:sp.id, shiny, rarity:sp.rarity, isDup:true, levels:PM.DUP_LEVELS, refund:25, pity:pityHit, target:targetHit, targetTier, ...itemInfo });
          }
        } else {
          const iid = 'g'+Date.now().toString(36)+i+Math.floor(Math.random()*1296).toString(36);
          owned.push({ iid, sp:sp.id, level:1, exp:0, shiny, form:null, unlocked:{}, copies:0 });
          results.push({ speciesId:sp.id, shiny, rarity:sp.rarity, isNew:true, pity:pityHit, target:targetHit, targetTier, ...itemInfo });
        }
      }
      set({ ...state, owned, shards, items, pity:legendPity, epicPity, legendaryTargetPity:legendTargetPity, epicTargetPityCount:epicTargetPity, totalPulls,
        stats:{ ...state.stats, pityHits:state.stats.pityHits+pityHits } });
      return results;
    },

    // ---- SHOP ----
    rareCandy(iid){ if(state.coins<PRICES.candy) return false; set({ ...state, coins:state.coins-PRICES.candy, owned: mapExp(state.owned,[iid],35) }); return true; },
    teamSnack(){ if(state.coins<PRICES.snack) return false; set({ ...state, coins:state.coins-PRICES.snack, owned: mapExp(state.owned, state.team,5) }); return true; },
    buyMegaStone(){ if(state.coins<PRICES.mega) return false; set({ ...state, coins:state.coins-PRICES.mega, megaStones:(state.megaStones||0)+1 }); return true; },
    buyGmaxStone(){ if(state.coins<PRICES.gmax) return false; set({ ...state, coins:state.coins-PRICES.gmax, gmaxStones:(state.gmaxStones||0)+1 }); return true; },
    // Shiny Candy: turns one friend shiny (level, forms and copies stay). Its normal version is then
    // no longer owned, so the gacha pays it out as NEW again and both versions can be collected.
    // Refused when a shiny of that species is already owned.
    shinyCandy(iid){
      const inst = state.owned.find(o=>o.iid===iid);
      if(!inst || inst.shiny || state.coins<PRICES.shiny) return false;
      if(state.owned.some(o=> o.sp===inst.sp && o.shiny)) return false;
      set({ ...state, coins:state.coins-PRICES.shiny, owned: state.owned.map(o=> o.iid===iid ? { ...o, shiny:true } : o) });
      return true;
    },

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
    buyGachaItem(id){
      const price = GACHA_ITEMS.includes(id) ? PRICES[id] : null;
      if(price==null || state.coins<price) return false;
      set({ ...state, coins:state.coins-price, items:{ ...state.items, [id]:(state.items[id]||0)+1 } });
      return true;
    },

    // ---- evolve by duplicate copies (player-initiated) ----
    evolveByDuplicates(iid, chosenEvo){
      const inst = state.owned.find(o=>o.iid===iid); if(!inst) return false;
      const sp = PM.byId(inst.sp); const options = sp && PM.evoOptions(sp);
      const evo = chosenEvo && options && options.includes(chosenEvo) ? chosenEvo : (sp && PM.evoTarget(sp));
      if(!evo || (inst.copies||0) < PM.EVO_COPIES) return false;
      set({ ...state, owned: state.owned.map(o=> o.iid===iid?{ ...o, sp:evo, copies:0, form:null, unlocked:{} }:o),
        stats:{ ...state.stats, evolutions:state.stats.evolutions+1 } });
      return true;
    },

    completeQuest(id){ if(state.quests[id]) return; set({ ...state, quests:{ ...state.quests,[id]:true } }); },
    // quests are step chains: quests[id] counts the steps claimed today (a legacy `true` counts as 1).
    // Claims only step `step`, so a double click can't pay out twice.
    grantQuest(id, step, shards){
      const claimed = Number(state.quests[id]) || 0;
      if(step !== claimed) return;
      set({ ...state, quests:{ ...state.quests, [id]:claimed+1 }, shards:state.shards+shards });
    },
    // every daily quest claimed today (the Quests page decides) — counted once per day
    markPerfectDay(){
      if(state.stats.lastPerfectDay===getToday()) return;
      set({ ...state, stats:{ ...state.stats, perfectDays:state.stats.perfectDays+1, lastPerfectDay:getToday() } });
    },
    // progression quests are claimed once, ever
    claimAchievement(id, shards){
      if(state.achievements[id]) return;
      set({ ...state, achievements:{ ...state.achievements, [id]:getToday() }, shards:state.shards+shards });
    },
    setRecallBest(n){ set({ ...state, recallBest: Math.max(state.recallBest, n), recallToday:true,
      stats:{ ...state.stats, recalls:state.stats.recalls+1 } }); },

    // ---- PROBLEMS ----
    // fields: { title, difficulty, tags, language, url, code }
    createProblem(fields){
      const p = normalizeProblem({ ...fields, id:newId(), createdAt:new Date().toISOString() });
      if(p.code.trim()) p.solvedAt = getToday();
      set({ ...state, problems:[...state.problems, p], preferredLanguage:p.language });
      return p.id;
    },
    updateProblem(id, fields){
      const prev = state.problems.find(p=>p.id===id); if(!prev) return;
      const next = normalizeProblem({ ...prev, ...fields, id, createdAt:prev.createdAt });
      const hadCode = !!prev.code.trim(), hasCode = !!next.code.trim();
      if(hasCode && !next.solvedAt) next.solvedAt = getToday();
      if(hadCode && !hasCode) next.solvedAt = null;       // solution removed -> back to to-do
      set({ ...state, problems: state.problems.map(p=> p.id===id?next:p), preferredLanguage:next.language });
    },
    deleteProblem(id){ set({ ...state, problems: state.problems.filter(p=>p.id!==id) }); },
    claimProblem(id){
      const p = state.problems.find(x=>x.id===id);
      if(!p || p.claimed || !p.solvedAt) return;
      const amount = window.DATA.SHARD_BY_DIFF[p.difficulty] || 0;
      set({ ...state, shards: state.shards+amount, owned: mapExp(state.owned, state.team, 1),
        problems: state.problems.map(x=> x.id===id?{ ...x, claimed:true, claimedAt:getToday() }:x) });
    },
    // every solved, unclaimed problem at once: same rewards as claiming each (its Shards + 1 team EXP)
    claimAllProblems(){
      const ready = state.problems.filter(p=> p.solvedAt && !p.claimed);
      if(!ready.length) return 0;
      const shards = ready.reduce((n,p)=> n + (window.DATA.SHARD_BY_DIFF[p.difficulty]||0), 0);
      const ids = new Set(ready.map(p=>p.id));
      set({ ...state, shards: state.shards+shards, owned: mapExp(state.owned, state.team, ready.length),
        problems: state.problems.map(x=> ids.has(x.id)?{ ...x, claimed:true, claimedAt:getToday() }:x) });
      return shards;
    },
    setSolveDate(id, date){
      if(!isDate(date)) return;
      set({ ...state, problems: state.problems.map(p=> p.id===id && p.solvedAt?{ ...p, solvedAt:date }:p) });
    },

    // ---- TAGS (defaults come from the catalog; custom ones are saved) ----
    addTag(name){
      const clean = Catalog.oneLine(name).slice(0,40);
      const id = Catalog.slugify(clean, 40);
      if(!id) return null;
      if(!tags().some(t=>t.id===id)) set({ ...state, customTags:[...state.customTags, { id, name:clean }] });
      return id;
    },
    removeTag(id){
      if(!state.customTags.some(t=>t.id===id)) return;
      set({ ...state, customTags: state.customTags.filter(t=>t.id!==id),
        problems: state.problems.map(p=> p.tags.includes(id)?{ ...p, tags:p.tags.filter(t=>t!==id) }:p) });
    },

    // ---- BACKUPS ----
    exportData(){
      const { progress, library } = Persistence.splitState(state);
      return JSON.stringify({ type:BACKUP_TYPE, version:BACKUP_VERSION, exportedAt:new Date().toISOString(), progress, library }, null, 2);
    },
    importData(raw){
      let parsed;
      try{ parsed = JSON.parse(raw); }catch(err){ throw new Error('Backup file is not valid JSON.', { cause:err }); }
      let progress, library;
      if(parsed && parsed.type===BACKUP_TYPE && parsed.version===BACKUP_VERSION && parsed.progress && parsed.library){
        ({ progress, library } = parsed);
      } else {
        // backups from the old localStorage-only version
        const legacy = parsed && parsed.type===BACKUP_TYPE ? parsed.state : parsed;
        if(!window.LegacyImport.isLegacyState(legacy)) throw new Error('Backup format is not supported by this version.');
        ({ progress, library } = window.LegacyImport.importLegacyState(legacy, Persistence.splitState(state).library));
      }
      stopEngine(); Store.dmgEvents=[];
      set(buildState(progress, library));
      startEngine();
    },

    // ---- MEADOW: study sessions (the Focus tab) ----
    async deployTeam(){
      if(!Tracker.ready() || !teamList().length) return;
      let created = false;
      const s = await Study.change((cur)=>{
        // one session at a time; an ended one waits until its summary is dismissed
        if(cur && (Study.isActive(cur) || cur.settledMs < cur.focusMs)) return cur;
        created = true;
        return Study.create(STUDY_TARGET, Date.now(), { boss:null, wait:FIRST_SPAWN_MS, carry:0 });
      });
      if(created){ Store.meadowLog=[]; Store.dmgEvents=[]; }
      refreshStudy();
      Tracker.openLeetCode(s.target.url);
    },
    async endSession(){
      await Study.change((s)=> Study.end(s, Tracker.reading(), Date.now()));
      refreshStudy();
      settle();
    },
    // close the summary of a finished session
    async dismissSession(){
      await Study.change((s)=> s && !Study.isActive(s) && s.settledMs >= s.focusMs ? null : s);
      refreshStudy();
    },
    backToLeetCode(){ if(study) Tracker.openLeetCode(study.target.url); },
    study(){ return study; },
    meadowLog: [],
    dmgEvents: [],
  };

  // ---- live problem helpers ----
  function tags(){ return Catalog.tagList(state.customTags); }
  function isSolved(p){ return !!p.solvedAt; }
  function solveDate(p){ return p.solvedAt || null; }

  // where each solved problem's code is written: problemId -> ['arrays/two-sum.py', ...]
  let planInput = null, planCache = new Map();
  function solutionPaths(id){
    if(!planInput || planInput.problems!==state.problems || planInput.customTags!==state.customTags){
      planInput = { problems:state.problems, customTags:state.customTags };
      planCache = new Map();
      Catalog.solutionPlan(planInput).forEach(f=>{
        if(!planCache.has(f.problemId)) planCache.set(f.problemId, []);
        planCache.get(f.problemId).push(f.path);
      });
    }
    return planCache.get(id) || [];
  }
  Object.assign(Store, { tags, isSolved, solveDate, solutionPaths });

  // Another tab took over the data; stop the engine so this one goes quiet.
  Persistence.subscribe(()=>{ if(Persistence.status().state==='conflict') stopEngine(); });
  // Coming back to this tab: take what another tab or browser saved meanwhile.
  Persistence.onRemoteChange((docs)=>{
    const cur = Persistence.splitState(state);
    stopEngine(); Store.dmgEvents=[];
    state = buildState(docs.progress || cur.progress, docs.library || cur.library);
    Persistence.adopt(state);
    subs.forEach(fn=>fn());
  });
  // Battles run only in a visible tab, so two open tabs don't both pay out
  // (and save) at once. Study time spent with this tab hidden is fought
  // through all at once when you come back.
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') stopEngine(); });
  Persistence.onResume(()=> startEngine());

  // ==================== MEADOW: STUDY SESSIONS + BATTLES ====================
  // Every open tab, hidden or not, keeps the shared session (src/study.js)
  // up to date with the Tracker. Study time then turns into battles: live
  // while this tab is on screen, or in one go when it comes back into view.
  let study = Study.load();
  let engineTimer = null;
  const TICK_MS = 700;               // one round of attacks per 0.7s of study time
  const FIRST_SPAWN_MS = 2200;
  const STUDY_TARGET = { title:'LeetCode', url:'https://leetcode.com/problemset/' };   // what Deploy Team opens
  const HEARTBEAT_MS = 15000;
  const BULK_MS = 15000;             // settling more study time than this at once is summarized in the log
  function pushLog(line,k){ Store.meadowLog = [{ t:line, k:k||'win', id:Math.random() }, ...Store.meadowLog].slice(0,40); }
  function refreshStudy(){ study = Study.load(); subs.forEach(fn=>fn()); }

  // Time with no PokéLeet tab open doesn't count: on opening, check whether
  // any other tab was watching in the meantime (and note when this one closes).
  const joined = Study.joinTabs().then((others)=>{
    if(!others) return Study.change((s)=> Study.update(s, undefined, Date.now(), { unwatched:true }));
  });
  window.addEventListener('pagehide', ()=> Study.leave(Date.now()));

  // Apply the Tracker's latest report (and the pause limit / cap) to the session.
  function syncStudy(){
    return joined.then(()=>{
      if(!Study.isActive(Study.load())) return;
      return Study.change((s)=> Study.update(s, Tracker.reading(), Date.now()));
    }).then(refreshStudy);
  }

  // Turn study time not yet fought through into battles and rewards.
  let settling = false;
  async function settle(){
    if(settling || !engineTimer) return;
    settling = true;
    try{
      await joined;
      const s = Study.load(), now = Date.now();
      if(!s) return;
      const unfought = Study.focusTime(s, now) > s.settledMs;
      if(!unfought && (!Study.isActive(s) || now < Study.endsAt(s))) return;    // nothing to do yet
      let result = null;
      await Study.change((cur)=>{
        if(!cur) return cur;
        const t = Date.now();
        const next = Study.update(cur, Tracker.reading(), t);
        const total = Study.focusTime(next, t);
        if(total <= next.settledMs) return next;
        result = battle(next.combat, total - next.settledMs, t);
        const e = next.earned;
        return { ...next, settledMs:total, combat:result.combat,
          earned:{ kills:e.kills+result.kills, coins:e.coins+result.coins, shards:e.shards+result.shards, exp:e.exp+result.exp } };
      });
      if(result) payOut(result);
      refreshStudy();
    } finally {
      settling = false;
    }
  }

  function payOut(r){
    const m = state.meadow;
    set({ ...state, coins:state.coins+r.coins, shards:state.shards+r.shards,
      owned: r.exp ? mapExp(state.owned, state.team, r.exp) : state.owned,
      meadow:{ ...m, coinsToday:m.coinsToday+r.coins, kills:m.kills+r.kills,
        studyToday:m.studyToday+r.studied, studyTotal:m.studyTotal+r.studied } });
    if(r.events.length) Store.dmgEvents = [...r.events, ...Store.dmgEvents].slice(0, 48);
    if(r.studied <= BULK_MS){ r.log.forEach(l=> pushLog(l.t, l.k)); return; }
    // came back after a while: keep the highlights, summarize the rest
    r.log.filter(l=> l.k==='win' && l.tier!=='normal').forEach(l=> pushLog(l.t, l.k));
    const took = r.studied < 60000 ? Math.round(r.studied/1000)+'s' : Math.round(r.studied/60000)+'m';
    pushLog('While you studied ('+took+'): '+r.kills+' boss'+(r.kills===1?'':'es')+' defeated'+
      (r.coins?'  +'+r.coins+'c':'')+(r.shards?'  +'+r.shards+'sh':''), 'away');
  }

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

  // One round of attacks: per-member damage with variation + crits -> floating numbers.
  function strike(team, weather, now){
    const mult = window.Derived.teamMultiplier();
    const events = []; let total = 0;
    team.forEach((mem, idx)=>{
      const sp = PM.byId(mem.sp);
      const wBuff = (sp.types||[sp.type]).includes(weather.type) ? 1.4 : 1;
      let dmg = window.Derived.monPower(mem) * 0.18 * mult * wBuff * (0.78 + Math.random()*0.44);
      const crit = Math.random() < 0.16;
      if(crit) dmg *= 2;
      dmg = Math.max(1, Math.round(dmg));
      total += dmg;
      events.push({ iid:mem.iid, slot:idx, dmg, crit, weather:wBuff>1, id:Math.random().toString(36).slice(2), t:now });
    });
    return { total, events };
  }

  function defeat(boss, zone, r){
    const rMult = RARITY[boss.rarity].mult;                         // 1 / 2 / 3 / 5
    const tierMult = boss.tier==='legend'?20 : boss.tier==='elite'?5 : 1;
    const lvlFactor = 0.5 + boss.level/40;                          // ~0.7 .. ~2.0
    const baseCoins = zone.coinFloor + Math.floor(Math.random()*(zone.coinCeil-zone.coinFloor+1));
    const variance = 0.8 + Math.random()*0.5;                       // ±
    const coins = Math.round(baseCoins * 0.35 * tierMult * lvlFactor * variance);
    const shardP = Math.min(0.95, zone.shardChance * tierMult);
    const shards = Math.random()<shardP ? Math.round((10 + Math.random()*30) * (rMult/2) * (boss.tier==='legend'?3:1)) : 0;
    const tag = boss.tier==='legend'?'⭐ ':boss.tier==='elite'?'✨ ':'';
    r.coins += coins; r.shards += shards; r.kills++;
    r.exp += boss.tier==='legend'?12 : boss.tier==='elite'?4 : 1;
    r.log.push({ k:'win', tier:boss.tier, t:'Defeated '+tag+boss.name+' (Lv'+boss.level+')!  +'+coins+'c'+(shards?'  +'+shards+'sh':'') });
  }

  // Fight through `studied` ms of study time. combat = { boss, wait, carry }:
  // the current boss, study time left before the next one appears, and
  // study time already banked toward the next round of attacks.
  function battle(combat, studied, now){
    const { zone, weather } = window.DATA.daySeed(getToday());
    const team = window.Derived.teamList();
    const r = { studied, coins:0, shards:0, exp:0, kills:0, log:[], events:[] };
    let { boss, wait } = combat, time = combat.carry + studied;
    while(team.length){
      if(!boss){
        if(time < wait){ wait -= time; time = 0; break; }
        time -= wait; wait = 0;
        boss = rollBoss(zone);
        const tag = boss.tier==='legend'?'⭐ LEGENDARY ':boss.tier==='elite'?'✨ ELITE ':'';
        r.log.push({ k:'spawn', tier:boss.tier, t:'A '+tag+'wild '+(boss.shiny?'✨shiny ':'')+boss.name+' appeared!' });
        continue;
      }
      if(time < TICK_MS) break;
      time -= TICK_MS;
      const hit = strike(team, weather, now);
      if(time < TICK_MS) r.events = hit.events;       // only the latest round is animated
      boss = { ...boss, hp: boss.hp - hit.total };
      if(boss.hp <= 0){ defeat(boss, zone, r); boss = null; wait = spawnGap(); }
    }
    return { ...r, combat:{ boss, wait, carry: team.length ? time : 0 } };
  }

  function startEngine(){
    if(engineTimer || Persistence.status().state==='conflict' || document.visibilityState==='hidden') return;
    engineTimer = setInterval(settle, TICK_MS);
    settle();
  }
  function stopEngine(){ if(engineTimer){ clearInterval(engineTimer); engineTimer=null; } }

  // Keep the session current in every tab: on each Tracker report, on a
  // heartbeat (also asks the Tracker again, in case a report was missed),
  // and when another tab changes it.
  Tracker.subscribe(()=>{ syncStudy().then(settle); subs.forEach(fn=>fn()); });
  setInterval(()=>{ if(Study.isActive(study)){ Tracker.refresh(); syncStudy(); } }, HEARTBEAT_MS);
  Study.onChange(refreshStudy);
  syncStudy();

  // ---------------- derived ----------------
  function monPower(inst){
    const sp = PM.byId(inst.sp); if(!sp) return 0;
    let p = inst.level * RARITY[sp.rarity].mult;
    if(inst.form) p *= PM.FORM_BONUS[inst.form]||1;
    return Math.round(p);
  }
  function solvedCounts(){
    let easy=0, med=0, hard=0;
    state.problems.forEach(p=>{ if(!isSolved(p)) return; if(p.difficulty==='Easy') easy++; else if(p.difficulty==='Medium') med++; else hard++; });
    return { easy, med, hard, total: easy+med+hard };
  }
  function weightedPoints(){ const c=solvedCounts(); return c.easy*1 + c.med*3 + c.hard*10; }
  function teamMultiplier(){ return Math.min(2, 1 + Math.floor(weightedPoints()/50)*0.05); }
  function teamList(){ const byId=Object.fromEntries(state.owned.map(o=>[o.iid,o])); return state.team.map(i=>byId[i]).filter(Boolean); }
  function teamBasePower(){ return teamList().reduce((s,m)=> s+monPower(m), 0); }
  function teamPower(){ return Math.round(teamBasePower()*teamMultiplier()); }
  function tagStats(){
    return tags().map(tag=>{
      const probs = state.problems.filter(p=> p.tags.includes(tag.id));
      const solved = probs.filter(isSolved).length;
      return { ...tag, solved, count:probs.length, pct: probs.length?solved/probs.length:0 };
    });
  }

  // ---- dated training log ----
  function solveCountByDate(){
    const m = {};
    state.problems.forEach(p=>{ if(p.solvedAt) m[p.solvedAt] = (m[p.solvedAt]||0)+1; });
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
  Store.PRICES = PRICES;
  Store.daysAgo = daysAgo;
  Object.defineProperty(Store, 'TODAY', { get(){ return getToday(); } });
  window.Store = Store; window.useStore = useStore;
  window.Derived = { monPower, solvedCounts, weightedPoints, teamMultiplier,
    teamList, teamBasePower, teamPower, tagStats, streakInfo, expToNext,
    trainingGrid, solveCountByDate, ownedSpecies, formSets };
})();
