/**
 * api.js  —  RODCHAOMAHACHAI Frontend ↔ C Backend Bridge
 *
 * วิธีใช้: ใส่ <script src="api.js"></script> ก่อน <script src="index.js"></script>
 *
 * ฟังก์ชันที่ export (global):
 *   API.checkAvailability(startDate, endDate)  → Promise<{ ok, cars[] }>
 *   API.book(payload)                           → Promise<{ ok, refCode, totalCost }>
 *   API.cancel(firstName, lastName)             → Promise<{ ok, message }>
 *   API.isServerAlive()                         → Promise<boolean>
 */

const API = (() => {
  const BASE = 'http://localhost:8080';

  /* ─── ตรวจสอบว่า C server ทำงานอยู่ไหม ─── */
  async function isServerAlive() {
    try {
      const r = await fetch(`${BASE}/status`, { method: 'GET', signal: AbortSignal.timeout(2000) });
      const j = await r.json();
      return j.ok === true;
    } catch {
      return false;
    }
  }

  /* ─── ดึงสถานะรถว่าง/ไม่ว่างในช่วงวันที่ ─── */
  async function checkAvailability(startDate, endDate) {
    const r = await fetch(`${BASE}/availability?start=${startDate}&end=${endDate}`);
    return r.json();
  }

  /* ─── จองรถ ─── */
  async function book({ carNumber, startDate, endDate, firstName, lastName, phone, email, deliveryValue, total }) {
    const r = await fetch(`${BASE}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carNumber, startDate, endDate, firstName, lastName, phone, email, deliveryValue, total })
    });
    return r.json();
  }

  /* ─── ยกเลิกการจอง ─── */
  async function cancel(firstName, lastName) {
    const r = await fetch(`${BASE}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName })
    });
    return r.json();
  }

  /* ─── ดึงประวัติการจองของลูกค้า ─── */
  async function myBookings(firstName, lastName) {
    const r = await fetch(`${BASE}/mybookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName })
    });
    return r.json();
  }

  return { isServerAlive, checkAvailability, book, cancel, myBookings };
})();


/* ══════════════════════════════════════════════════════════
    ฟังก์ชัน integration กับ index.js ที่มีอยู่แล้ว
   ══════════════════════════════════════════════════════════ */

/**
 * ใช้แทน searchCars() เดิม
 * เรียก C backend แล้วอัปเดต CARS array + render
 */
async function searchCarsFromServer() {
  const s = document.getElementById('start-date').value;
  const e = document.getElementById('end-date').value;
  if (!s || !e) { alert('กรุณาเลือกวันที่รับและคืนรถ'); return; }
  if (e <= s)   { alert('วันคืนรถต้องเป็นวันหลังจากการรับรถ'); return; }

  startDate = s; endDate = e;
  const ms = new Date(e) - new Date(s);
  numDays = Math.max(1, Math.ceil(ms / 86400000));

  const fmt = d => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  document.getElementById('display-dates').textContent = fmt(s) + ' → ' + fmt(e);
  document.getElementById('display-days').textContent  = 'รวม ' + numDays + ' วัน';

  /* แสดง loading */
  document.getElementById('cars-grid').innerHTML =
    `<div class="no-results"><div class="icon">⏳</div><p>กำลังตรวจสอบรถว่าง...</p></div>`;
  showPage('cars');

  try {
    const alive = await API.isServerAlive();
    if (!alive) {
      /* Server ออฟไลน์ → ใช้ข้อมูล JS เดิม (offline mode) */
      console.warn('[API] C server offline — using local CARS data');
      renderCars();   /* ฟังก์ชันเดิมใน index.js */
      return;
    }

    const data = await API.checkAvailability(s, e);
    if (!data.ok) { alert('เกิดข้อผิดพลาด: ' + (data.error || 'unknown')); return; }

    /* sync สถานะ available จาก server เข้า CARS array */
    data.cars.forEach(serverCar => {
      const local = CARS.find(c => c.id === serverCar.pricePerDay && c.name.includes(serverCar.model.split(' ')[0]));
      /* match ด้วย number field แม่นกว่า */
      const byNum = CARS.find(c => c.serverNumber === serverCar.number);
      const target = byNum || local;
      if (target) target.available = serverCar.available;
    });

    renderCars();

  } catch (err) {
    console.error('[API] checkAvailability error:', err);
    renderCars(); /* fallback */
  }
}

/**
 * ใช้แทน confirmPayment() เดิม
 * ส่งข้อมูลไป C backend บันทึก CSV แล้วแสดงหน้า success
 */
async function confirmPaymentToServer() {
  /* เก็บข้อมูลจาก form */
  const inputs = document.querySelectorAll('#page-payment input');
  const fname   = inputs[0]?.value.trim() || '';
  const lname   = inputs[1]?.value.trim() || '';
  const phone   = inputs[2]?.value.trim() || '';
  const email   = inputs[3]?.value.trim() || '';
  const idCard  = inputs[4]?.value.trim() || '';

  if (!fname || !lname || !phone || !email) {
    alert('กรุณากรอกข้อมูลผู้เช่าให้ครบถ้วน');
    return;
  }

  /* ตรวจว่าเลือกรถแล้ว */
  if (!selectedCar) { alert('เกิดข้อผิดพลาด: ไม่ได้เลือกรถ'); return; }

  /* delivery */
  const deliveryValue = document.getElementById('delivery').value;

  const totalText = document.getElementById('sum-total').textContent;
  const totalValue = parseFloat(totalText.replace(/,/g, '').replace(/฿/g, '').trim());
  let total=totalValue;

  console.log(total)

  const btn = document.querySelector('#page-payment .btn-primary:last-of-type');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ กำลังบันทึก...'; }

  try {
    const alive = await API.isServerAlive();

    if (!alive) {
      /* offline fallback */
      console.warn('[API] C server offline — local confirm only');
      const ref = 'RM-' + Math.floor(100000 + Math.random() * 900000);
      document.getElementById('booking-ref-num').textContent = ref;
      paymentCompleted = true;
      showPage('success');
      return;
    }

    /* carNumber = field "number" ใน CAR.csv (ตรงกับ serverNumber ใน index.js) */
    const carNumber = selectedCar.serverNumber;
    if(!carNumber){
      alert('เกิดข้อผิดพลาด: ไม่พบหมายเลขรถ (serverNumber)');
      if(btn){ btn.disabled=false; btn.textContent='✔ ยืนยันการจองและชำระเงิน'; }
      return;
    }

    const result = await API.book({
      carNumber,
      startDate,
      endDate,
      firstName: fname,
      lastName:  lname,
      phone,
      email,
      deliveryValue,
      total
    });

    if (btn) { btn.disabled = false; btn.textContent = '✔ ยืนยันการจองและชำระเงิน'; }

    if (!result.ok) {
      alert('ไม่สามารถจองได้: ' + (result.error || 'unknown'));
      return;
    }

    document.getElementById('booking-ref-num').textContent = result.refCode;
    paymentCompleted = true;
    showPage('success');

  } catch (err) {
    console.error('[API] book error:', err);
    if (btn) { btn.disabled = false; btn.textContent = '✔ ยืนยันการจองและชำระเงิน'; }
    alert('ไม่สามารถเชื่อมต่อ server ได้ กรุณาลองใหม่');
  }
}

/* แสดง banner แจ้งสถานะ server เมื่อโหลดหน้า */
window.addEventListener('load', async () => {
  const alive = await API.isServerAlive();
  const banner = document.createElement('div');
  banner.id = 'server-status-banner';

  if (alive) {
    banner.style.cssText =
      'position:fixed;bottom:16px;right:16px;z-index:999;' +
      'background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.35);' +
      'color:#4ade80;padding:10px 18px;border-radius:10px;font-size:13px;' +
      'backdrop-filter:blur(8px);';
    banner.textContent = '🟢 ระบบฐานข้อมูลเชื่อมต่อสำเร็จ';
  } else {
    banner.style.cssText =
      'position:fixed;bottom:16px;right:16px;z-index:999;' +
      'background:rgba(255,107,53,0.12);border:1px solid rgba(255,107,53,0.35);' +
      'color:#ff6b35;padding:10px 18px;border-radius:10px;font-size:13px;' +
      'backdrop-filter:blur(8px);';
    banner.textContent = '🔴 ไม่สามารถเชื่อมต่อ server (offline mode)';
  }

  document.body.appendChild(banner);
  setTimeout(() => banner.style.opacity='0', 5000);
  setTimeout(() => banner.remove(), 5500);
});
