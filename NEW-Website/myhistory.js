
/* ══════════════════════════════════════════════════════════
   MY BOOKINGS PAGE
   ══════════════════════════════════════════════════════════ */
 
// ข้อมูลที่ใช้ร่วมกันในหน้า mybookings
let _mbFname = '', _mbLname = '';
let _cancelTarget = null; // { firstName, lastName, startDate, car }
 
// emoji map จาก model ชื่อรถ
function carEmojiFromName(name){
  const n = name.toLowerCase();
  if(n.includes('fortuner')||n.includes('everest')||n.includes('mu-x')||n.includes('hilux')) return '🚙';
  if(n.includes('alphard')||n.includes('innova')||n.includes('serena')||n.includes('xpander')) return '🚐';
  if(n.includes('d-max')||n.includes('dmax')) return '🛻';
  if(n.includes('cx-5')||n.includes('mazda')) return '🏎';
  if(n.includes('cr-v')) return '🚘';
  return '🚗';
}
 
// แปลง YYYY-MM-DD → วันภาษาไทย
function fmtDateTH(s){
  if(!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric' });
}
 
// คำนวณสถานะการจองจากวันปัจจุบัน
function bookingStatus(startDate, endDate){
  const now  = new Date(); now.setHours(0,0,0,0);
  const s    = new Date(startDate + 'T00:00:00');
  const e    = new Date(endDate   + 'T00:00:00');
  if(now < s) return 'upcoming';   // ยังไม่ถึงวันรับ
  if(now <= e) return 'active';    // อยู่ระหว่างการเช่า
  return 'past';                   // เสร็จสิ้นแล้ว
}
 
async function lookupBookings(){
  const fname = document.getElementById('mb-fname').value.trim();
  const lname = document.getElementById('mb-lname').value.trim();
  if(!fname||!lname){ alert('กรุณากรอกชื่อและนามสกุล'); return; }
 
  _mbFname = fname; _mbLname = lname;
 
  const list = document.getElementById('mybookings-list');
  list.innerHTML = `<div class="mybookings-empty"><div class="icon">⏳</div><p>กำลังค้นหา...</p></div>`;
  document.getElementById('mybookings-search-section').style.display = 'none';
  document.getElementById('mybookings-results').style.display = 'block';
 
  const alive = await API.isServerAlive();
  if(!alive){
    list.innerHTML = `<div class="mybookings-empty"><div class="icon">🔴</div>
      <p>ไม่สามารถเชื่อมต่อ server ได้<br><small>กรุณาตรวจสอบว่า server กำลังรันอยู่</small></p></div>`;
    return;
  }
 
  const data = await API.myBookings(fname, lname);
 
  document.getElementById('mb-display-name').textContent = `${fname} ${lname}`;
 
  if(!data.ok || !data.bookings || data.bookings.length === 0){
    document.getElementById('mb-display-count').textContent = '';
    list.innerHTML = `<div class="mybookings-empty">
      <div class="icon">🔍</div>
      <p>ไม่พบประวัติการจองสำหรับชื่อนี้<br>
         <small>กรุณาตรวจสอบชื่อ-นามสกุลให้ถูกต้อง</small></p></div>`;
    return;
  }
 
  document.getElementById('mb-display-count').textContent =
    `· พบ ${data.bookings.length} รายการ`;
 
  const statusLabel = { upcoming:'⏳ รอรับรถ', active:'🟢 กำลังเช่า', past:'✔ เสร็จสิ้น' };
  const statusClass = { upcoming:'badge-upcoming', active:'badge-active', past:'badge-past' };
 
  list.innerHTML = data.bookings.map((b, idx) => {
    const status  = bookingStatus(b.startDate, b.endDate);
    const emoji   = carEmojiFromName(b.car);
    const days    = Math.max(1, Math.ceil(
      (new Date(b.endDate+'T00:00:00') - new Date(b.startDate+'T00:00:00')) / 86400000));
    const canCancel = (status === 'upcoming');
 
    return `
    <div class="booking-card" style="animation-delay:${idx*0.06}s">
      <div class="booking-card-icon">${emoji}</div>
      <div class="booking-card-info">
        <div class="booking-card-carname">${b.car}</div>
        <div class="booking-card-dates">
          📅 ${fmtDateTH(b.startDate)} → ${fmtDateTH(b.endDate)}
        </div>
        <div class="booking-card-meta">
          <span class="booking-meta-chip">🕐 ${days} วัน</span>
          <span class="booking-meta-chip">${b.delivery==='YES'?'🚚 มีบริการส่ง':'📍 รับเองที่ร้าน'}</span>
          <span class="booking-meta-chip">📝 จองวันที่ ${fmtDateTH(b.recordDate)}</span>
        </div>
      </div>
      <div class="booking-card-actions">
        <span class="booking-status-badge ${statusClass[status]}">${statusLabel[status]}</span>
        ${canCancel ? `
          <button class="btn-cancel-booking"
            onclick="openCancelModal('${b.car.replace(/'/g,"\\'")}','${b.startDate}','${b.endDate}')">
            ✕ ยกเลิกการจอง
          </button>` : ''}
      </div>
    </div>`;
  }).join('');
}
 
function resetMyBookings(){
  document.getElementById('mybookings-search-section').style.display = 'block';
  document.getElementById('mybookings-results').style.display = 'none';
  document.getElementById('mb-fname').value = '';
  document.getElementById('mb-lname').value = '';
  _mbFname = ''; _mbLname = '';
}
 
/* ── Cancel confirmation modal ── */
function openCancelModal(car, startDate, endDate){
  _cancelTarget = { car, startDate, endDate };
  document.getElementById('cancel-modal-desc').innerHTML =
    `คุณต้องการยกเลิกการจอง <strong>${car}</strong><br>
     วันที่ ${fmtDateTH(startDate)} → ${fmtDateTH(endDate)} ใช่หรือไม่?<br>
     <span style="color:var(--accent2);font-size:13px;">การยกเลิกไม่สามารถเรียกคืนได้และไม่มีการคืนเงิน</span>`;
  document.getElementById('cancel-modal-overlay').classList.add('open');
}
 
function closeCancelModal(){
  document.getElementById('cancel-modal-overlay').classList.remove('open');
  _cancelTarget = null;
}
 
async function confirmCancelBooking(){
  if(!_cancelTarget){ closeCancelModal(); return; }
  const btn = document.querySelector('#cancel-modal-overlay .btn-primary');
  btn.disabled = true; btn.textContent = '⏳ กำลังยกเลิก...';
 
  const result = await API.cancel(_mbFname, _mbLname);
 
  btn.disabled = false; btn.textContent = '✔ ยืนยันยกเลิกการจอง';
  closeCancelModal();
 
  if(result.ok){
    // reload รายการใหม่
    await lookupBookings();
  } else {
    alert('เกิดข้อผิดพลาด: ' + (result.error || 'unknown'));
  }
}
