/* ═══════════════════════════════════════════════════════
   spinner.js  —  Global Loading Spinner
   วางก่อน api.js และ index.js ทุกหน้า

   API:
     showSpinner()                        → ข้อความ default
     showSpinner('ข้อความ')              → custom message
     showSpinner('ข้อความ', 'sub text')  → + sub
     hideSpinner()                        → ซ่อน
═══════════════════════════════════════════════════════ */
(function () {
  const css = document.createElement('style');
  css.textContent = `
    #gspinner {
      position:fixed; inset:0; z-index:99998;
      display:flex; align-items:center; justify-content:center;
      background:rgba(10,10,15,0.70); backdrop-filter:blur(5px);
      opacity:0; pointer-events:none; transition:opacity 0.2s ease;
    }
    #gspinner.on { opacity:1; pointer-events:all; }
    .gsp-box {
      background:var(--card,#1a1a25);
      border:1px solid var(--border,rgba(232,197,71,0.15));
      border-radius:20px; padding:30px 40px;
      display:flex; flex-direction:column; align-items:center; gap:18px;
      box-shadow:0 20px 60px rgba(0,0,0,0.5);
      min-width:190px; text-align:center;
      animation:gsp-pop 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes gsp-pop {
      from{transform:scale(0.82);opacity:0}
      to  {transform:scale(1);   opacity:1}
    }
    .gsp-ring{width:52px;height:52px;position:relative;}
    .gsp-ring::before,.gsp-ring::after{content:'';position:absolute;inset:0;border-radius:50%;}
    .gsp-ring::before{border:3px solid rgba(232,197,71,0.10);}
    .gsp-ring::after{
      border:3px solid transparent;
      border-top-color:var(--accent,#e8c547);
      border-right-color:var(--accent,#e8c547);
      animation:gsp-spin 0.72s cubic-bezier(0.5,0.1,0.5,0.9) infinite;
    }
    @keyframes gsp-spin{to{transform:rotate(360deg)}}
    .gsp-dot{
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%);
      width:9px;height:9px;
      background:var(--accent,#e8c547); border-radius:50%;
      animation:gsp-pulse 0.72s ease-in-out infinite alternate;
    }
    @keyframes gsp-pulse{
      from{transform:translate(-50%,-50%) scale(0.65);opacity:0.5}
      to  {transform:translate(-50%,-50%) scale(1.1); opacity:1}
    }
    .gsp-msg{
      font-family:'Mitr','Sarabun',sans-serif;
      font-size:15px;font-weight:500;color:var(--text,#f0f0f0);
    }
    .gsp-msg::after{
      content:'';
      animation:gsp-dots 1.3s steps(4,end) infinite;
    }
    @keyframes gsp-dots{
      0% {content:''}  25%{content:'.'}
      50%{content:'..'}75%{content:'...'}
    }
    .gsp-sub{
      font-family:'Mitr','Sarabun',sans-serif;
      font-size:12px;color:var(--muted,#888);margin-top:-10px;
    }
    @media(max-width:480px){
      .gsp-box{padding:24px 30px;min-width:160px;}
      .gsp-ring{width:42px;height:42px;}
    }
  `;
  document.head.appendChild(css);

  const overlay = document.createElement('div');
  overlay.id = 'gspinner';
  overlay.innerHTML = `
    <div class="gsp-box">
      <div class="gsp-ring"><div class="gsp-dot"></div></div>
      <div>
        <div class="gsp-msg" id="gsp-msg">กำลังโหลด</div>
        <div class="gsp-sub" id="gsp-sub"></div>
      </div>
    </div>`;

  const attach = () => document.body.appendChild(overlay);
  if (document.body) attach();
  else document.addEventListener('DOMContentLoaded', attach);

  let _n = 0;

  window.showSpinner = function(msg='กำลังโหลด', sub='') {
    _n++;
    document.getElementById('gsp-msg').textContent = msg;
    document.getElementById('gsp-sub').textContent = sub;
    overlay.classList.add('on');
  };

  window.hideSpinner = function() {
    _n = Math.max(0, _n-1);
    if (_n===0) overlay.classList.remove('on');
  };
})();