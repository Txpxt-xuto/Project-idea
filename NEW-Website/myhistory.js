/* ══════════════════════════════════════════════════════════
   MY BOOKINGS PAGE  (+ ADMIN MODE)
   ══════════════════════════════════════════════════════════ */

let _mbFname = '', _mbLname = '';
let _cancelTarget = null;
let _isAdmin = false;
let _allBookingsCache = [];

document.getElementById('mybookings-search-section').style.display = 'block';
document.getElementById('mybookings-results').style.display = 'none';
document.getElementById('mb-fname').value = '';
document.getElementById('mb-lname').value = '';

/* ── helpers ── */
function carImageFromName(name){
  if(typeof CARS !== 'undefined'){
    const found = CARS.find(c => c.name === name || name.includes(c.name.split(' ')[0]));
    if(found && found.image) return found.image;
  }
  // fallback — เปลี่ยน URL ตรงนี้ตามแต่ละคัน
  const map = {
    'fortuner':'https://img2.pic.in.th/IMG_6890c21ea56e7b207fbb.png',
    'cr-v':    'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png',
    'alphard': 'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png',
    'mu-x':    'https://img1.pic.in.th/images/IMG_6897.png',
    'civic':   'https://img1.pic.in.th/images/IMG_6901.png',
    'innova':  'https://img2.pic.in.th/IMG_6879.webp',
    'cx-5':    'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png',
    'everest': 'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png',
    'serena':  'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png',
    'xpander': 'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png',
    'vios':    'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png',
    'camry':   'https://img1.pic.in.th/images/IMG_6891.png',
  };
  const n = name.toLowerCase();
  for(const [key,url] of Object.entries(map)) if(n.includes(key)) return url;
  return 'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png';
}
function carEmojiFromName(name){ return '🚗'; }

function fmtDateTH(s){
  if(!s || s==='-') return '—';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric' });
}

function bookingStatus(startDate, endDate){
  const now = new Date(); now.setHours(0,0,0,0);
  const s   = new Date(startDate + 'T00:00:00');
  const e   = new Date(endDate   + 'T00:00:00');
  if(now < s)  return 'upcoming';
  if(now <= e) return 'active';
  return 'past';
}

/* ══════════════════════════════════════════════════════════
   MAIN LOOKUP
   ══════════════════════════════════════════════════════════ */
async function lookupBookings(){
  const fname = document.getElementById('mb-fname').value.trim();
  const lname = document.getElementById('mb-lname').value.trim();
  if(!fname||!lname){ toast('กรุณากรอกชื่อและนามสกุล', 'warning'); return; }

  _mbFname = fname; _mbLname = lname;

  const list = document.getElementById('mybookings-list');
  list.innerHTML = `<div class="mybookings-empty"><div class="icon">⏳</div><p>กำลังค้นหา...</p></div>`;
  document.getElementById('mybookings-search-section').style.display = 'none';
  document.getElementById('mybookings-results').style.display = 'block';
  showSpinner('กำลังค้นหาประวัติการจอง');

  const alive = await API.isServerAlive();
  if(!alive){
    hideSpinner();
    list.innerHTML = `<div class="mybookings-empty"><div class="icon">🔴</div>
      <p>ไม่สามารถเชื่อมต่อ server ได้<br><small>กรุณาตรวจสอบว่า server กำลังรันอยู่</small></p></div>`;
    return;
  }

  /* ── ADMIN MODE ── */
  if(fname === 'admin' && lname === 'ME'){ //ตั้งชื่อแอดมินตามที่จะใช้
    _isAdmin = true;
    document.getElementById('mb-display-name').innerHTML =
      `<span style="color:var(--accent2)">🔑 Admin Dashboard</span>`;
    document.getElementById('mb-display-count').textContent = '';
    await loadAdminDashboard();
    return;
  }

  /* ── NORMAL USER ── */
  _isAdmin = false;
  removeAdminUI();
  const data = await API.myBookings(fname, lname);
  hideSpinner();
  document.getElementById('mb-display-name').textContent = `${fname} ${lname}`;

  if(!data.ok || !data.bookings || data.bookings.length === 0){
    document.getElementById('mb-display-count').textContent = '';
    list.innerHTML = `<div class="mybookings-empty"><div class="icon">🔍</div>
      <p>ไม่พบประวัติการจองสำหรับรายชื่อนี้<br><small>กรุณาตรวจสอบชื่อ-นามสกุลให้ถูกต้อง</small></p></div>`;
    return;
  }

  document.getElementById('mb-display-count').textContent = `· พบ ${data.bookings.length} รายการ`;
  renderUserBookings(data.bookings);
}

function renderUserBookings(bookings){
  const list = document.getElementById('mybookings-list');
  const statusLabel = { upcoming:'⏳ รอรับรถ', active:'🟢 กำลังเช่า', past:'✔ เสร็จสิ้น' };
  const statusClass = { upcoming:'badge-upcoming', active:'badge-active', past:'badge-past' };

  list.innerHTML = bookings.map((b, idx) => {
    const status    = bookingStatus(b.startDate, b.endDate);
    const carImg   = carImageFromName(b.car);
    const days      = Math.max(1, Math.ceil(
      (new Date(b.endDate+'T00:00:00') - new Date(b.startDate+'T00:00:00')) / 86400000));
    const canCancel = (status === 'upcoming');
    return `
    <div class="booking-card" style="animation-delay:${idx*0.06}s">
      <div class="booking-card-icon"><img src="${carImg}" alt="${b.car}" class="booking-car-img"></div>
      <div class="booking-card-info">
        <div class="booking-card-carname">${b.car}</div>
        <div class="booking-card-dates">📅 ${fmtDateTH(b.startDate)} → ${fmtDateTH(b.endDate)}</div>
        <div class="booking-card-meta">
          <span class="booking-meta-chip">🕐 ${days} วัน</span>
          <span class="booking-meta-chip">📍 ${b.delivery||'-'}</span>
          <span class="booking-meta-chip">📝 จองวันที่ ${fmtDateTH(b.recordDate)}</span>
          ${b.total && b.total!=='-' ? `<span class="booking-meta-chip">💰 ${parseInt(b.total).toLocaleString()} ฿</span>` : ''}
        </div>
      </div>
      <div class="booking-card-actions">
        <span class="booking-status-badge ${statusClass[status]}">${statusLabel[status]}</span>
        ${canCancel ? `<button class="btn-cancel-booking"
          onclick="openCancelModal('${b.car.replace(/'/g,"\\'")}','${b.startDate}','${b.endDate}')">
          ✕ ยกเลิกการจอง</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
    ADMIN DASHBOARD
   ══════════════════════════════════════════════════════════ */
async function loadAdminDashboard(){
  const list = document.getElementById('mybookings-list');
  list.innerHTML = `<div class="mybookings-empty"><div class="icon">⏳</div><p>กำลังโหลดข้อมูลทั้งหมด...</p></div>`;
  showSpinner('กำลังโหลดข้อมูลทั้งหมด', 'กรุณารอสักครู่...');
  const data = await API.allBookings({});
  hideSpinner();
  if(!data.ok){
    list.innerHTML = `<div class="mybookings-empty"><div class="icon">❌</div><p>${data.error||'unknown error'}</p></div>`;
    return;
  }

  hideSpinner();
  _allBookingsCache = data.bookings || [];
  document.getElementById('mb-display-count').textContent = `· ทั้งหมด ${_allBookingsCache.length} รายการ`;
  injectAdminUI();
  renderAdminTable(_allBookingsCache);
}

function injectAdminUI(){
  if(!document.getElementById('admin-stats-bar')){
    const el = document.createElement('div');
    el.id = 'admin-stats-bar'; el.className = 'admin-stats-bar';
    document.getElementById('mybookings-results').insertBefore(el, document.getElementById('mybookings-list'));
  }
  if(!document.getElementById('admin-filter-bar')){
    const el = document.createElement('div');
    el.id = 'admin-filter-bar'; el.className = 'admin-filter-bar';
    el.innerHTML = `
      <div class="admin-filter-grid">
        <div class="form-group"><label>🚗 รุ่นรถ</label>
          <input type="text" id="af-car" placeholder="Toyota, Honda..." oninput="debounceAdminFilter()"></div>
        <div class="form-group"><label>📅 วันเริ่มต้น</label>
          <input type="date" id="af-from" onchange="debounceAdminFilter()"></div>
        <div class="form-group"><label>📅 วันสิ้นสุด</label>
          <input type="date" id="af-to" onchange="debounceAdminFilter()"></div>
        <div class="form-group"><label>🔖 สถานะ</label>
          <select id="af-status" onchange="debounceAdminFilter()">
            <option value="">ทั้งหมด</option>
            <option value="upcoming">⏳ รอรับรถ</option>
            <option value="active">🟢 กำลังเช่า</option>
            <option value="past">✔ เสร็จสิ้น</option>
          </select></div>
        <div class="form-group"><label>💳 วิธีชำระ</label>
          <select id="af-method" onchange="debounceAdminFilter()">
            <option value="">ทั้งหมด</option>
            <option value="credit">💳 บัตรเครดิต</option>
            <option value="qr">📱 พร้อมเพย์</option>
            <option value="bank">🏦 โอนเงิน</option>
          </select></div>
        <div class="form-group"><label>📍 สถานที่</label>
          <input type="text" id="af-location" placeholder="BKK, Mahachai..." oninput="debounceAdminFilter()"></div>
      </div>
      <div class="admin-filter-actions">
        <button class="btn-reset" onclick="resetAdminFilters()">↺ รีเซ็ต</button>
        <button class="btn-csv" onclick="exportAdminCSV()">Export CSV</button>
      </div>`;
    document.getElementById('mybookings-results').insertBefore(el, document.getElementById('mybookings-list'));
  }
  updateStatsBanner(_allBookingsCache);
}

function updateStatsBanner(bookings){
  const el = document.getElementById('admin-stats-bar');
  if(!el) return;
  const upcoming = bookings.filter(b=>b.status==='upcoming').length;
  const active   = bookings.filter(b=>b.status==='active').length;
  const past     = bookings.filter(b=>b.status==='past').length;
  const revenue  = bookings.reduce((s,b)=>s+(parseInt(b.total)||0), 0);

  // --- ส่วนที่เพิ่มใหม่: จัดการรูปแบบการแสดงผลรายได้ ---
  let displayRevenue;
  if (revenue >= 1000000) {
    // ถ้าเกิน 1 ล้าน หารด้วยล้านแล้วเอาทศนิยม 1 ตำแหน่ง (เช่น 1.2M) หรือถ้าอยากได้เลขกลมๆ ก็ใช้ .toFixed(0)
    displayRevenue = (revenue / 1000000).toFixed(1) + 'M';
  } else {
    // ถ้าไม่ถึงล้าน แสดงแบบใส่ comma ปกติ
    displayRevenue = revenue.toLocaleString();
  }
  // ------------------------------------------

  el.innerHTML = `
    <div class="admin-stat-chip" onclick="applyAdminFilter('status','')">
      <div class="asc-num">${bookings.length}</div><div class="asc-label">รายการทั้งหมด</div></div>
    <div class="admin-stat-chip chip-upcoming" onclick="applyAdminFilter('status','upcoming')">
      <div class="asc-num">${upcoming}</div><div class="asc-label">⏳ รอรับรถ</div></div>
    <div class="admin-stat-chip chip-active" onclick="applyAdminFilter('status','active')">
      <div class="asc-num">${active}</div><div class="asc-label">🟢 กำลังเช่า</div></div>
    <div class="admin-stat-chip chip-past" onclick="applyAdminFilter('status','past')">
      <div class="asc-num">${past}</div><div class="asc-label">✔ เสร็จสิ้น</div></div>
    <div class="admin-stat-chip chip-revenue">
      <div class="asc-num">${displayRevenue}</div><div class="asc-label">฿ รายรับรวม</div></div>`;
}

function renderAdminTable(bookings){
  const list = document.getElementById('mybookings-list');
  document.getElementById('mb-display-count').textContent = `· แสดง ${bookings.length} รายการ`;
  updateStatsBanner(bookings);

  if(!bookings.length){
    list.innerHTML = `<div class="mybookings-empty"><div class="icon">🔍</div><p>ไม่พบข้อมูลตามเงื่อนไข</p></div>`;
    return;
  }

  const statusLabel = { upcoming:'⏳ รอรับรถ', active:'🟢 กำลังเช่า', past:'✔ เสร็จสิ้น' };
  const statusClass = { upcoming:'badge-upcoming', active:'badge-active', past:'badge-past' };
  const mIcon = { 'credit':'💳', 'qr':'📱', 'bank':'🏦' };

  list.innerHTML = `
  <div class="admin-table-wrap">
    <table class="admin-table">
      <thead><tr>
        <th style="text-align: center;">ลำดับ</th><th style="text-align: center;">รุ่นรถ</th><th style="text-align: center;">ชื่อ-นามสกุล</th><th style="text-align: center;">เลขประจำตัว</th>
        <th style="text-align: center;">เบอร์ / อีเมล</th><th style="text-align: center;">วันเช่า</th><th style="text-align: center;">สถานที่</th><th style="text-align: center;">วันที่จอง</th>
        <th style="text-align: center;">วิธีชำระ</th><th style="text-align: center;">ชื่อบนบัตรหรือชื่อบัญชี</th><th style="text-align: center;">หมายเลขบัตรหรือรหัสอ้างอิง</th>
        <th style="text-align: center;">เวลาหรือcvv</th><th style="text-align: center;">วันเดือนปีหรือวันหมดอายุ</th><th style="text-align: center;">จำนวนเงิน</th><th style="text-align: center;">สถานะ</th><th style="text-align: center;">จัดการ</th>
      </tr></thead>
      <tbody>
        ${bookings.map((b,i) => `
        <tr class="admin-row ${b.status}" style="animation-delay:${Math.min(i,30)*0.03}s">
          <td class="admin-row-num">${i+1}</td>
          <td><span class="admin-car"><img src="${carImageFromName(b.car)}" alt="${b.car}" class="admin-car-img"> ${b.car}</span></td>
          <td><div class="admin-customer-name">${b.fname} ${b.lname}</div></td><td><code>${b.id||'-'}</code></td>
          <td class="admin-contact">
            <div>${b.phone||'-'}</div>
            <div style="text-align: center;font-size:11px;color:var(--muted)">${b.email||'-'}</div></td>
          <td>
            <div style="text-align: center;color:var(--accent);font-size:13px">${fmtDateTH(b.startDate)}</div>
            <div style="text-align: center;font-size:12px;color:var(--muted)">→ ${fmtDateTH(b.endDate)}</div></td>
          <td style="text-align: center;font-size:12px">${b.location||'-'}</td>
          <td style="text-align: center;font-size:12px;color:var(--muted)">${fmtDateTH(b.recordDate)}</td>
          <td style="text-align: center;font-size:13px">${mIcon[b.payMethod]||''} ${b.payMethod||'-'}</td>
          <td style="text-align: center;">${b.nameofcard||'-'}</td>
          <td style="text-align: center;">${b.numofcard||'-'}</td>
          <td style="text-align: center;">${b.cvv||'-'}</td>
          <td style="text-align: center;">${b.exp||'-'}</td>
          <td class="admin-total">${b.total&&b.total!=='-'?parseInt(b.total).toLocaleString()+' ฿':'-'}</td>
          <td><span class="booking-status-badge ${statusClass[b.status]||'badge-past'}">${statusLabel[b.status]||b.status}</span></td>
          <td><button class="btn-cancel-booking btn-cancel-admin"
            onclick="openCancelModal('${b.car.replace(/'/g,"\\'")}','${b.startDate}','${b.endDate}','${b.fname.replace(/'/g,"\\'")}','${b.lname.replace(/'/g,"\\'")}')">
            ✕ ยกเลิก</button></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

/* ── filters ── */
let _filterDebounce = null;
function debounceAdminFilter(){
  clearTimeout(_filterDebounce);
  _filterDebounce = setTimeout(applyClientFilter, 260);
}
function applyClientFilter(){
  const car    = (document.getElementById('af-car')?.value||'').toLowerCase();
  const from   = document.getElementById('af-from')?.value||'';
  const to     = document.getElementById('af-to')?.value||'';
  const status = document.getElementById('af-status')?.value||'';
  const method = document.getElementById('af-method')?.value||'';
  const loc    = (document.getElementById('af-location')?.value||'').toLowerCase();

  const filtered = _allBookingsCache.filter(b=>{
    if(car    && !b.car.toLowerCase().includes(car))           return false;
    if(from   && b.startDate < from)                           return false;
    if(to     && b.startDate > to)                             return false;
    if(status && b.status !== status)                          return false;
    if(method && b.payMethod !== method)                       return false;
    if(loc    && !(b.location||'').toLowerCase().includes(loc)) return false;
    return true;
  });

  renderAdminTable(filtered);
  document.querySelectorAll('.admin-filter-bar input,.admin-filter-bar select').forEach(el=>{
    el.style.borderColor = el.value ? 'var(--accent)' : '';
  });
}
function applyAdminFilter(key, value){
  if(key==='status'){
    const sel=document.getElementById('af-status');
    if(sel){ sel.value=value; applyClientFilter(); }
  }
}
function resetAdminFilters(){
  ['af-car','af-from','af-to','af-location'].forEach(id=>{
    const el=document.getElementById(id); if(el){el.value='';el.style.borderColor='';}
  });
  ['af-status','af-method'].forEach(id=>{
    const el=document.getElementById(id); if(el){el.value='';el.style.borderColor='';}
  });
  renderAdminTable(_allBookingsCache);
}
function exportAdminCSV(){
  const car    = (document.getElementById('af-car')?.value||'').toLowerCase();
  const from   = document.getElementById('af-from')?.value||'';
  const to     = document.getElementById('af-to')?.value||'';
  const status = document.getElementById('af-status')?.value||'';
  const method = document.getElementById('af-method')?.value||'';
  const loc    = (document.getElementById('af-location')?.value||'').toLowerCase();
  const filtered = _allBookingsCache.filter(b=>{
    if(car    && !b.car.toLowerCase().includes(car))           return false;
    if(from   && b.startDate < from)                           return false;
    if(to     && b.startDate > to)                             return false;
    if(status && b.status !== status)                          return false;
    if(method && b.payMethod !== method)                       return false;
    if(loc    && !(b.location||'').toLowerCase().includes(loc)) return false;
    return true;
  });
  const header=['รุ่นรถ','ชื่อ','นามสกุล','เบอร์','อีเมล','วันเริ่ม','วันสิ้นสุด','สถานที่','วันที่จอง','วิธีชำระ','ยอดรวม','สถานะ'];
  const rows=filtered.map(b=>[b.car,b.fname,b.lname,b.phone,b.email,
    b.startDate,b.endDate,b.location,b.recordDate,b.payMethod,b.total,b.status]
    .map(v=>`"${(v||'').replace(/"/g,'""')}"`).join(','));
  const csv='\uFEFF'+[header.join(','),...rows].join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=`bookings_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}
function removeAdminUI(){
  document.getElementById('admin-stats-bar')?.remove();
  document.getElementById('admin-filter-bar')?.remove();
}

/* ══════════════════════════════════════════════════════════
   RESET / CANCEL
   ══════════════════════════════════════════════════════════ */
function resetMyBookings(){
  _isAdmin=false; removeAdminUI();
  document.getElementById('mybookings-search-section').style.display='block';
  document.getElementById('mybookings-results').style.display='none';
  document.getElementById('mb-fname').value='';
  document.getElementById('mb-lname').value='';
  _mbFname=''; _mbLname='';
}
function openCancelModal(car, startDate, endDate, targetFname, targetLname){
  // admin mode: ระบุ fname/lname ของลูกค้า; user mode: ไม่ส่งมา → ใช้ _mbFname/_mbLname
  const fname = targetFname || _mbFname;
  const lname = targetLname || _mbLname;
  _cancelTarget = { car, startDate, endDate, fname, lname };
  document.getElementById('cancel-modal-desc').innerHTML=
    `คุณต้องการยกเลิกการจอง <strong style="font-weight: 500; color: #ff6b35">${car}</strong><br>
     ของ <strong>${fname} ${lname}</strong><br>
     วันที่ ${fmtDateTH(startDate)} → ${fmtDateTH(endDate)} ใช่หรือไม่?<br>
     <span style="color: #ff3535;font-size:13px;">การยกเลิกไม่สามารถเรียกคืนการจองได้และไม่มีการคืนเงิน</span>`;
  document.getElementById('cancel-modal-overlay').classList.add('open');
}
function closeCancelModal(){
  document.getElementById('cancel-modal-overlay').classList.remove('open');
  _cancelTarget=null;
}
async function confirmCancelBooking(){
  if(!_cancelTarget){closeCancelModal();return;}
  const btn=document.querySelector('#cancel-modal-overlay .btn-primary');
  btn.disabled=true; btn.textContent='⏳ กำลังยกเลิก...';

  let result;
  if(_isAdmin){
    // admin ยกเลิกการจองของลูกค้า → ใช้ adminCancel (ระบุชื่อลูกค้า + startDate)
    result = await API.adminCancel(_cancelTarget.fname, _cancelTarget.lname, _cancelTarget.startDate);
  } else {
    // ลูกค้ายกเลิกของตัวเอง → ใช้ cancel เดิม
    result = await API.cancel(_mbFname, _mbLname);
  }

  btn.disabled=false; btn.textContent='✔ ยืนยันยกเลิกการจอง';
  closeCancelModal();
  if(result.ok){
    toast('ยกเลิกการจองสำเร็จ', 'success');
    if(_isAdmin) await loadAdminDashboard(); else await lookupBookings();
  } else toast('เกิดข้อผิดพลาด: '+(result.error||'unknown'), 'error');
}