/* =====================================================================
   App shell — page routing, fixed-screen scaling, stub pages.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState, useEffect } = React;

  const PAGES = {
    dashboard: ()=> e(window.Dashboard),
    gacha:     ()=> e(window.Gacha),
    quests:    ()=> e(window.Quests),
    recall:    ()=> e(window.Recall),
    team:      ()=> e(window.Team),
    shop:      ()=> e(window.Shop),
    map:       ()=> e(window.Meadow),
  };

  function App(){
    const [page, setPage] = useState('dashboard');
    return e('div',{ style:{ position:'absolute', inset:0, display:'flex', flexDirection:'column', padding:16 } },
      e(TopNav,{ page, setPage }),
      e('div',{ key:page, className:'fade-in', style:{ flex:1, minHeight:0 } },
        (PAGES[page] || PAGES.dashboard)()
      )
    );
  }

  // ---- fit the 1280x800 screen into the viewport ----
  function fit(){
    const wrap = document.getElementById('screen-wrap');
    const screen = document.getElementById('screen');
    if(!wrap||!screen) return;
    const s = Math.min(wrap.clientWidth/1280, wrap.clientHeight/800);
    screen.style.transform = `scale(${s})`;
  }
  window.addEventListener('resize', fit);

  if(window.Store && window.Store.startEngine) window.Store.startEngine();
  ReactDOM.createRoot(document.getElementById('app')).render(e(App));
  fit(); setTimeout(fit, 60); setTimeout(fit, 300);
})();
