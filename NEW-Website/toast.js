/* ════════════════════════════════════════════════════════════
   toast.js  —  Shared Toast Notification System
   ใช้ร่วมกันทุกหน้า: index.html, myhistory.html, about_us.html
   ════════════════════════════════════════════════════════════

   API:
     toast('ข้อความ')                    → สีเทา (info)
     toast('ข้อความ', 'success')         → สีเขียว ✔
     toast('ข้อความ', 'error')           → สีแดง ✕
     toast('ข้อความ', 'warning')         → สีส้ม ⚠
     toast('ข้อความ', 'info', 5000)      → กำหนด duration (ms)
*/

(function () {

  /* ── inject CSS ── */
  const style = document.createElement('style');
  style.textContent = `
    #toast-container {
      position: fixed;
      top: 76px;          /* ใต้ nav bar */
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      max-width: min(400px, calc(100vw - 40px));
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid transparent;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2);
      pointer-events: all;
      cursor: default;
      min-width: 260px;
      font-family: 'Mitr', 'Sarabun', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #000000;

      /* entrance animation */
      animation: toast-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      position: relative;
      overflow: hidden;
    }

    .toast.removing {
      animation: toast-out 0.28s ease forwards;
    }

    @keyframes toast-in {
      from { opacity:0; transform:translateX(60px) scale(0.92); }
      to   { opacity:1; transform:translateX(0)    scale(1); }
    }
    @keyframes toast-out {
      from { opacity:1; transform:translateX(0)    scale(1);    max-height:100px; margin-bottom:0; }
      to   { opacity:0; transform:translateX(60px) scale(0.92); max-height:0;     margin-bottom:-10px; }
    }

    /* progress bar */
    .toast-progress {
      position: absolute;
      bottom: 0; left: 0;
      height: 3px;
      border-radius: 0 0 14px 14px;
      animation: toast-progress linear forwards;
    }
    @keyframes toast-progress {
      from { width: 100%; }
      to   { width: 0%; }
    }

    /* type colors */
    .toast-success {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.35);
    }
    .toast-success .toast-progress { background: #10b981; }

    .toast-error {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.35);
    }
    .toast-error .toast-progress { background: #ef4444; }

    .toast-warning {
      background: rgba(255, 107, 53, 0.15);
      border-color: rgba(255, 107, 53, 0.35);
    }
    .toast-warning .toast-progress { background: #ff6b35; }

    .toast-info {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.35);
    }
    .toast-info .toast-progress { background: #3b82f6; }

    .toast-default {
      background: rgba(26, 26, 37, 0.95);
      border-color: rgba(232, 197, 71, 0.2);
    }
    .toast-default .toast-progress { background: #e8c547; }

    /* icon */
    .toast-icon {
      font-size: 18px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* message */
    .toast-body { flex: 1; }
    .toast-title {
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 2px;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .toast-msg { font-size: 14px; }

    /* close btn */
    .toast-close {
      background: none; border: none; cursor: pointer;
      color: rgba(240,240,240,0.5); font-size: 16px;
      padding: 0 0 0 4px; line-height: 1; flex-shrink: 0;
      transition: color 0.15s;
      margin-top: 1px;
    }
    .toast-close:hover { color: #f0f0f0; }

    @media (max-width: 480px) {
      #toast-container {
        top: auto;
        bottom: 20px;
        left: 16px;
        right: 16px;
        max-width: 100%;
      }
      .toast { min-width: unset; }
    }
  `;
  document.head.appendChild(style);

  /* ── create container ── */
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  /* ── type config ── */
  const TYPES = {
    success: { icon: '✔', label: 'สำเร็จ' },
    error:   { icon: '✕', label: 'ข้อผิดพลาด' },
    warning: { icon: '⚠', label: 'แจ้งเตือน' },
    info:    { icon: 'ℹ', label: 'ข้อมูล' },
    default: { icon: '🔔', label: '' },
  };

  /* ── main function ── */
  window.toast = function (message, type = 'default', duration = 4000) {
    const cfg  = TYPES[type] || TYPES.default;
    const el   = document.createElement('div');
    el.className = `toast toast-${type}`;

    el.innerHTML = `
      <div class="toast-icon">${cfg.icon}</div>
      <div class="toast-body">
        ${cfg.label ? `<div class="toast-title">${cfg.label}</div>` : ''}
        <div class="toast-msg">${message}</div>
      </div>
      <button class="toast-close" onclick="this.closest('.toast')._remove()">✕</button>
      <div class="toast-progress" style="animation-duration:${duration}ms"></div>
    `;

    /* remove helper */
    el._remove = function () {
      el.classList.add('removing');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    };

    /* click to dismiss */
    el.addEventListener('click', function (e) {
      if (!e.target.classList.contains('toast-close')) el._remove();
    });

    container.appendChild(el);

    /* auto remove */
    setTimeout(() => { if (el.isConnected) el._remove(); }, duration);

    return el;
  };

  /* ── shortcuts ── */
  window.toastSuccess = (msg, dur) => toast(msg, 'success', dur);
  window.toastError   = (msg, dur) => toast(msg, 'error',   dur || 5000);
  window.toastWarning = (msg, dur) => toast(msg, 'warning', dur || 5000);
  window.toastInfo    = (msg, dur) => toast(msg, 'info',    dur);

})();