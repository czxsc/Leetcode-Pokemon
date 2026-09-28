/* =====================================================================
   Static game data — shard rewards, meadow zones, weather, shop items.
   Everything that changes as you play (problems, coins, collection,
   team) lives in the store and is saved by src/persistence.js.
===================================================================== */
(function(){
  const SHARD_BY_DIFF = { Easy:150, Medium:300, Hard:600 };

  // ---- meadow zones (4, daily-seeded) ----
  const ZONES = [
    { id:'forest', name:'Viridian Forest', desc:'Lush green woodland', types:['normal','bug'],
      coinFloor:10, coinCeil:40,  shardChance:0.04, candyChance:0.0,  accent:'#a6cf78' },
    { id:'moon',   name:'Mt. Moon',        desc:'Crystal-lit caverns',  types:['rock','psychic'],
      coinFloor:25, coinCeil:80,  shardChance:0.06, candyChance:0.05, accent:'#b0a0d8' },
    { id:'seafoam',name:'Seafoam Islands',  desc:'Icy coastal grottos',  types:['water','ice'],
      coinFloor:50, coinCeil:120, shardChance:0.12, candyChance:0.0,  accent:'#a9dde0' },
    { id:'victory',name:'Victory Road',     desc:'Dark mountain pass',   types:['dragon','psychic'],
      coinFloor:100,coinCeil:250, shardChance:0.20, candyChance:0.03, accent:'#9aa0e0' },
  ];

  // ---- daily weather modifiers (buff one type 1.5x) ----
  const WEATHER = [
    { id:'sunny',  icon:'☀️', name:'Sunny Day',  type:'fire',     note:'Fire types deal 1.5× damage' },
    { id:'rain',   icon:'☔',       name:'Rain',       type:'water',    note:'Water types deal 1.5× damage' },
    { id:'breeze', icon:'🍃', name:'Leaf Breeze', type:'grass',    note:'Grass types deal 1.5× damage' },
    { id:'storm',  icon:'⚡',       name:'Thunderhead', type:'electric', note:'Electric types deal 1.5× damage' },
    { id:'frost',  icon:'❄️', name:'Cold Snap',   type:'ice',      note:'Ice types deal 1.5× damage' },
    { id:'mist',   icon:'🌫️', name:'Psy Mist', type:'psychic', note:'Psychic types deal 1.5× damage' },
  ];

  // ---- shop items (spend coins) ----
  const SHOP = [
    { id:'candy', name:'Rare Candy',  cost:200, kind:'candy_one',  amount:35,
      desc:'+35 EXP to one chosen Pokémon. Your main upgrade lever.' },
    { id:'snack', name:'Team Snack',  cost:500, kind:'exp_all',    amount:5,
      desc:'+5 EXP to all 6 current team members.' },
    { id:'mega',  name:'Mega Stone', cost:1500, kind:'mega',
      desc:'Mega-Evolve OR Gigantamax one eligible Pokémon — new form + big power boost.' },
  ];

  // deterministic daily seed -> {zone, weather, encounterSec}
  function daySeed(dateStr){
    let h=0; for(let i=0;i<dateStr.length;i++){ h=(h*31+dateStr.charCodeAt(i))>>>0; }
    const zone = ZONES[h % ZONES.length];
    const weather = WEATHER[(h>>3) % WEATHER.length];
    const encounterSec = 60 + ((h>>6) % 61); // 60..120
    return { zone, weather, encounterSec, seed:h };
  }

  window.DATA = {
    SHARD_BY_DIFF, ZONES, WEATHER, SHOP, daySeed,
    LEVEL_CAP: 50,
    expToNext: (level)=> level * 10,       // level 1->2 costs 10, 9->10 costs 90
  };
})();
