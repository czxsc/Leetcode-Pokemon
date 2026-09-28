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
    pokedex:   ()=> e(window.Pokedex),
    shop:      ()=> e(window.Shop),
    map:       ()=> e(window.Meadow),
  };

  function App(){
    const [page, setPage] = useState('dashboard');
    const [demoNotice, setDemoNotice] = useState(()=> window.AppConfig.demo && !window.demoNoticeSeen());
    useEffect(()=>{
      if(window.Store && window.Store.startEngine) window.Store.startEngine();
      const onResize = ()=> fit();
      window.addEventListener('resize', onResize);
      fit();
      const fitSoon = setTimeout(fit, 60);
      const fitLater = setTimeout(fit, 300);
      return ()=>{
        window.removeEventListener('resize', onResize);
        clearTimeout(fitSoon);
        clearTimeout(fitLater);
        if(window.Store && window.Store.stopEngine) window.Store.stopEngine();
      };
    }, []);
    return e('div',{ style:{ position:'absolute', inset:0, display:'flex', flexDirection:'column', padding:16 } },
      e(TopNav,{ page, setPage, onDemo:()=>setDemoNotice(true) }),
      e('div',{ key:page, className:'fade-in', style:{ flex:1, minHeight:0 } },
        (PAGES[page] || PAGES.dashboard)()
      ),
      demoNotice ? e(window.DemoNotice,{ onClose:()=>setDemoNotice(false) }) : null,
      e(window.SaveBanner)
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
  window.LegacyApp = App;
})();
