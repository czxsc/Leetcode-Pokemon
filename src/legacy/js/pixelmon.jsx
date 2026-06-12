/* =====================================================================
   PixelMon — Gen 1 Pokédex (151) on real pokemondb.net sprites.
   Normal forms (Gen 1-5): animated Black/White gifs (+ shiny variants).
   Mega / Gigantamax forms: static "home" / "sword-shield" PNGs.
   Fallback chain: primary -> home static -> coloured type blob.
   Exposes: window.PixelMon, window.Creature
===================================================================== */
(function(){
  const RARITY = {
    common:    { label:'Common',    mult:1, color:'#9bb07e', glow:'#d6eeb0' },
    rare:      { label:'Rare',      mult:2, color:'#85bfe0', glow:'#c3e3ec' },
    epic:      { label:'Epic',      mult:3, color:'#b0a0d8', glow:'#d8caf2' },
    legendary: { label:'Legendary', mult:5, color:'#ecc46c', glow:'#fbe7b0' },
  };
  const PULL_WEIGHTS = { common:60, rare:25, epic:10, legendary:5 };
  const SHINY_CHANCE = 0.10;                 // gacha shiny odds
  const FORM_BONUS = { mega:1.6, gmax:1.9 }; // power multiplier when transformed
  const EVO_COPIES = 3;                      // dupes needed to evolve
  const DUP_LEVELS = 5;                      // levels for a non-evolvable dupe

  const TYPE_COLOR = {
    normal:'#d6c5a0', fire:'#efa06a', water:'#85bfe0', electric:'#efd277',
    grass:'#a6cf78', ice:'#a9dde0', fighting:'#e0908a', poison:'#c79bd6',
    ground:'#e6c98a', flying:'#bcd0ee', psychic:'#e89db8', bug:'#bcd07a',
    rock:'#c9b78c', ghost:'#b0a0d8', dragon:'#9aa0e0', dark:'#8a83a0',
    steel:'#b8c2cc', fairy:'#f0b9d4',
  };

  // [slug, name, types(csv), rarity, gen, evoNext(0=none), mega(0|slug), gmax(0|1)]
  // Full roster lives in js/dex.jsx as window.POKEDEX (loaded before this file).
  const DEX = [
    ['bulbasaur','Bulbasaur','grass,poison','common',1,'ivysaur',0,0],
  ];


  const EEVEE_EVOS = window.EEVEE_EVOS || ['vaporeon','jolteon','flareon'];

  const SPECIES = (window.POKEDEX || DEX).map(d=>({
    id:d[0], name:d[1], types:d[2].split(','), type:d[2].split(',')[0],
    rarity:d[3], gen:d[4], evo:d[5]||null,
    mega: d[6] ? (typeof d[6]==='string'?d[6]:d[0]+'-mega') : null,
    gmax: !!d[7],
  }));
  const BY_ID = Object.fromEntries(SPECIES.map(s=>[s.id,s]));

  function byId(id){ return BY_ID[id]; }
  function tierPool(t){ return SPECIES.filter(s=>s.rarity===t); }
  function randomOfTier(t){ const p=tierPool(t); return p[Math.floor(Math.random()*p.length)]; }
  function rollSpecies(){
    const r = Math.random()*100; let acc=0;
    for(const t of ['legendary','epic','rare','common']){ acc += PULL_WEIGHTS[t]; if(r < acc) return randomOfTier(t); }
    return randomOfTier('common');
  }
  function rollShiny(){ return Math.random() < SHINY_CHANCE; }
  function evoTarget(sp){
    if(!sp) return null;
    if(sp.id==='eevee') return EEVEE_EVOS[Math.floor(Math.random()*EEVEE_EVOS.length)];
    return sp.evo;
  }
  function evoOptions(sp){
    if(!sp) return [];
    if(sp.id==='eevee') return EEVEE_EVOS.slice();
    return sp.evo ? [sp.evo] : [];
  }
  function canTransform(sp){ return !!(sp && (sp.mega || sp.gmax)); }
  function transformKind(sp){ return sp.mega ? 'mega' : sp.gmax ? 'gmax' : null; }
  // every transform form a species can take (in display order)
  function formsFor(sp){ const out=[]; if(sp&&sp.mega) out.push('mega'); if(sp&&sp.gmax) out.push('gmax'); return out; }
  function megaSlug(sp){ return (typeof sp.mega==='string') ? sp.mega : sp.id+'-mega'; }
  function formName(sp, form){
    if(form==='gmax') return 'Gigantamax '+sp.name;
    const suffix = (typeof sp.mega==='string' && sp.mega.endsWith('-x')) ? ' X'
      : (typeof sp.mega==='string' && sp.mega.endsWith('-y')) ? ' Y' : '';
    return 'Mega '+sp.name+suffix;
  }

  // ---------------- sprite urls ----------------
  const BASE = 'https://img.pokemondb.net/sprites';
  function spriteUrl(sp, opts){
    opts = opts||{};
    const sh = opts.shiny ? 'shiny' : 'normal';
    if(opts.form==='mega'){ const m = (typeof sp.mega==='string')?sp.mega:sp.id+'-mega'; return `${BASE}/omega-ruby-alpha-sapphire/dex/${sh}/${m}.png`; }
    if(opts.form==='gmax'){ return `${BASE}/sword-shield/${sh}/${sp.id}-gigantamax.png`; }
    if(sp.gen<=5) return `${BASE}/black-white/anim/${sh}/${sp.id}.gif`;
    return `${BASE}/sword-shield/${sh}/${sp.id}.png`;
  }
  function homeUrl(sp, shiny){ return `${BASE}/home/${shiny?'shiny':'normal'}/${sp.id}.png`; }

  // ---------------- React component ----------------
  function Creature(props){
    const { species, inst, size=48, bob=false, className='', style={} } = props;
    const sp = (typeof species==='object' && species) ? species : byId(species || (inst && inst.sp));
    const shiny = !!(props.shiny || (inst && inst.shiny));
    const form  = props.form || (inst && inst.form) || null;
    const [stage, setStage] = React.useState(0);   // 0 primary, 1 home static, 2 blob
    React.useEffect(()=>{ setStage(0); }, [sp && sp.id, shiny, form]);

    const box = { width:size, height:size, display:'inline-flex', alignItems:'center', justifyContent:'center', position:'relative', ...style };
    if(!sp) return React.createElement('div',{ style:box });

    if(stage>=2){
      return React.createElement('div',{ className, style:{ ...box,
        background:TYPE_COLOR[sp.type]||'#ccc', borderRadius:'50%',
        fontFamily:"'Silkscreen'", fontSize:size*0.4, color:'#fff', border:'2px solid rgba(0,0,0,.15)' } }, sp.name[0]);
    }
    const url = stage===0 ? spriteUrl(sp,{shiny,form}) : homeUrl(sp,shiny);
    return React.createElement('div',{ className:(bob?'mon-bob ':'')+className, style:box },
      shiny ? React.createElement('span',{ className:'shiny-spark', style:{ fontSize:Math.max(10,size*0.22) } }, '\u2728') : null,
      React.createElement('img',{ src:url, onError:()=> setStage(s=>s+1),
        style:{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', imageRendering: sp.gen<=5&&!form?'pixelated':'auto' },
        alt:sp.name, draggable:false })
    );
  }

  window.PixelMon = { SPECIES, RARITY, PULL_WEIGHTS, SHINY_CHANCE, FORM_BONUS, EVO_COPIES, DUP_LEVELS, TYPE_COLOR,
    byId, tierPool, randomOfTier, rollSpecies, rollShiny, evoTarget, evoOptions, canTransform, transformKind, formsFor, megaSlug, formName, spriteUrl };
  window.Creature = Creature;
})();
