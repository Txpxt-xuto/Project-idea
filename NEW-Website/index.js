const CARS = [
  { id:1,  serverNumber:1,  name:'Toyota Fortuner',       type:'SUV',   seats:7,  fuel:'diesel', price:2200, emoji:'🚚', image:'https://img2.pic.in.th/IMG_6890c21ea56e7b207fbb.png', available:true },
  { id:2,  serverNumber:2,  name:'Honda CR-V',            type:'SUV',   seats:5,  fuel:'95',     price:1800, emoji:'🚓', image:'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png', available:true },
  { id:3,  serverNumber:3,  name:'Toyota Alphard',        type:'MPV',   seats:13, fuel:'95',     price:3500, emoji:'🚐', image:'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png', available:false, limited:true },
  { id:4,  serverNumber:4,  name:'Isuzu MU-X',            type:'PPV',   seats:7,  fuel:'diesel', price:1900, emoji:'🚍', image:'https://img1.pic.in.th/images/IMG_6897.png', available:true },
  { id:5,  serverNumber:5,  name:'Honda Civic',           type:'Sedan', seats:5,  fuel:'95',     price:1100, emoji:'🚗', image:'https://img1.pic.in.th/images/IMG_6901.png', available:true },
  { id:6,  serverNumber:6,  name:'Toyota Innova',         type:'MPV',   seats:7,  fuel:'diesel', price:1600, emoji:'🚌', image:'https://img2.pic.in.th/IMG_6879.webp', available:true },
  { id:7,  serverNumber:7,  name:'Mazda CX-5',            type:'SUV',   seats:5,  fuel:'95',     price:2000, emoji:'🏎️', image:'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png', available:true },
  { id:8,  serverNumber:8,  name:'Ford Everest',          type:'SUV',   seats:7,  fuel:'diesel', price:2400, emoji:'🚙', image:'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png', available:false, limited:true },
  { id:9,  serverNumber:9,  name:'Nissan Serena',         type:'MPV',   seats:13, fuel:'95',     price:1700, emoji:'🚎', image:'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png', available:true },
  { id:10, serverNumber:10, name:'Mitsubishi Xpander',    type:'MPV',   seats:13, fuel:'95',     price:1300, emoji:'🚖', image:'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png', available:true },
  { id:11, serverNumber:11, name:'Toyota Vios',           type:'Sedan', seats:5,  fuel:'95',     price:850,  emoji:'🚕', image:'https://img2.pic.in.th/IMG_6877c91e15254a1c9056.png', available:true },
  { id:12, serverNumber:12, name:'Toyota Camry',          type:'Sedan', seats:5,  fuel:'95',     price:900,  emoji:'🚘', image:'https://img1.pic.in.th/images/IMG_6891.png', available:true },
];

let filters = { seats: 'all', fuel: 'all', price: 'all' };
let selectedCar = null;
let startDate = '', endDate = '', numDays = 1;
let mode = 0;
let paymentCompleted = false;  /* guard สำหรับ page-success */


window.onload = function() {
  buildMarquee();

  /* intercept ทุก <a href> ที่จะ reload หน้า */
  document.addEventListener('click', function(e) {
    if (!paymentCompleted) return;
    const anchor = e.target.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (href && href !== '#' && !href.startsWith('javascript')) {
      e.preventDefault();
      toast('กรุณาจดหมายเลขการจองไว้ก่อน แล้วกดปุ่ม "กลับสู่หน้าหลัก" เพื่อออกจากหน้านี้', 'warning', 6000);
    }
  }, true);

  /* ── delivery select: ถ้าเลือก custom-map ให้เปิดแผนที่ ── */
  const deliverySelect = document.getElementById('delivery');
  if (deliverySelect) {
    deliverySelect.addEventListener('change', function() {
      if (this.value === 'custom-map') {
        openDeliveryMap();
      } else {
        /* ซ่อน result box ถ้าเปลี่ยนไปตัวเลือกอื่น */
        document.getElementById('map-result-box').style.display = 'none';
      }
    });
  }

  /* ── รับ postMessage จาก delivery-map.html ── */
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'DELIVERY_LOCATION') return;
    const { lat, lng, dist, fee, label } = e.data;

    /* เก็บพิกัดไว้ใน dataset ของ select */
    const sel = document.getElementById('delivery');
    if (sel) {
      sel.value = 'custom-map';
      sel.dataset.customLat  = lat;
      sel.dataset.customLng  = lng;
      sel.dataset.customDist = dist;
      sel.dataset.customFee  = fee;
    }

    /* แสดง result box */
    const box = document.getElementById('map-result-box');
    if (box) {
      box.style.display = 'block';
      document.getElementById('map-result-label').textContent =
        `${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`;
      document.getElementById('map-result-dist').textContent = dist;
      document.getElementById('map-result-fee').textContent  = parseInt(fee).toLocaleString();
    }
  });
};

/* เปิด delivery map ใน popup window */
function openDeliveryMap() {
  const w = Math.min(560, window.screen.width);
  const h = Math.min(680, window.screen.height);
  const left = (window.screen.width  - w) / 2;
  const top  = (window.screen.height - h) / 2;
  window.open(
    'delivery-map.html',
    'DeliveryMap',
    `width=${w},height=${h},left=${left},top=${top},` +
    'resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no'
  );
}

function showPage(name) {
  /* Guard 1: success เปิดได้เฉพาะหลังชำระเงิน */
  if (name === 'success' && !paymentCompleted) return;

  /* Guard 2: ถ้า success แสดงอยู่ ห้าม navigate ออก
     จะออกได้เฉพาะ goBackHome() ที่ reset paymentCompleted=false ก่อน */
  if (paymentCompleted && name !== 'success') return;

  /* ซ่อนทุกหน้า — ข้าม page-success ไม่แตะเลย */
  document.querySelectorAll('.page').forEach(p => {
    if (p.id === 'page-success') return;
    p.classList.remove('active');
    p.style.display = 'none';
  });

  if (name === 'success') {
    /* ลบ inline attribute ที่ HTML ตั้งไว้ แล้วค่อย display */
    const el = document.getElementById('page-success');
    if (el) {
      el.removeAttribute('style');
      el.style.display = 'flex';
      el.classList.add('active');
    }
  } else {
    const target = document.getElementById('page-' + name);
    if (!target) return;
    target.style.display = 'block';
    target.classList.add('active');
  }

  window.scrollTo(0, 0);
}

/* กดปุ่มกลับหน้าหลักจากหน้า success — reset state ทั้งหมด */
function goBackHome() {
  /* ต้อง reset paymentCompleted ก่อน showPage เสมอ
     เพราะ Guard 2 ใน showPage จะบล็อกถ้า paymentCompleted=true */
  paymentCompleted = false;

  /* ซ่อน success ด้วยมือ */
  const successEl = document.getElementById('page-success');
  if (successEl) {
    successEl.classList.remove('active');
    successEl.style.display = 'none';
    successEl.style.setProperty('display', 'none', 'important');
  }

  selectedCar = null;
  startDate = ''; endDate = '';
  numDays = 1; mode = 0;
  filters = { seats:'all', fuel:'all', price:'all' };
  CARS.forEach(c => { c.available = true; });

  ['modal-start','modal-end','start-date','end-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  showPage('home');
}
function setFilter(type, value, el) {
  filters[type] = value;
  document.querySelectorAll(`[data-filter="${type}"]`).forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  if(mode==0) renderCars();
  else showcar();
}

function resetFilters() {
  filters = { seats: 'all', fuel: 'all', price: 'all' };
  document.querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('active', c.dataset.value === 'all');
  });
  if(mode==0) renderCars();
  else showcar();
}

function selectCar(id) {
  selectedCar = CARS.find(c => c.id === id);
  if (!selectedCar) return;

  // mode=1 (ดูรถทั้งหมด): ต้องเลือกวันก่อน
  if (mode === 1) {
    openDateModal();
    return;
  }

  goToPayment();
}

function goToPayment() {
  // 1. Check: ถ้ายังไม่ได้เลือกรถ ให้หยุดทำงานทันที (ป้องกัน Error)
  if (!selectedCar) {
    toast("กรุณาเลือกรถก่อนดำเนินการครับ", "warning");
    return;
  }

  let deliverycost = 1000;
  const fmt = d => new Date(d).toLocaleDateString('th-TH', {day:'numeric', month:'short', year:'numeric'});

  // 2. แสดงรูปภาพและข้อมูลรถ
  const iconEl = document.getElementById('sum-icon');
  if (iconEl) {
    // ถ้าใช้แท็ก <img> ให้ใช้ .src แต่ถ้าใช้ <div> ให้ใช้ .innerHTML แบบเดิมที่คุณเขียนได้ครับ
    iconEl.innerHTML = `<img src="${selectedCar.image}" alt="${selectedCar.name}" style="width:100px;height:auto;object-fit:contain;border-radius:8px;">`;
  }
  
  document.getElementById('sum-name').textContent = selectedCar.name;
  document.getElementById('sum-type').textContent = selectedCar.type;
  document.getElementById('sum-start').textContent = fmt(startDate);
  document.getElementById('sum-end').textContent = fmt(endDate);
  document.getElementById('sum-days').textContent = totalDays + ' วัน';

  // 3. ตรวจสอบค่า Delivery ตาม Mode (ใช้ ID ให้ตรงกับ HTML ของคุณ)
  let deliveryValue = "";
  if (mode === 0) {
    // หน้าแรก (Home)
    const delEl = document.getElementById('delivery');
    deliveryValue = delEl ? delEl.value : "";
  } else {
    // จาก Modal
    const delModEl = document.getElementById('modal-delivery');
    deliveryValue = delModEl ? delModEl.value : "";
  }

  if (deliveryValue === "Self-Pickup") { deliverycost = 0 }
  if (deliveryValue === "custom-map") { deliverycost = Number(document.getElementById('map-result-fee').textContent) }
  console.log(deliverycost.id)
  let days = totalDays;
  let sDay = 0;

  while(true) {
    if (days - 30 >= 0) { sDay += 16; days -= 30; }
    else if (days - 7 >= 0) { sDay += 5; days -= 7; }
    else { sDay += days; break; }
  }

  document.getElementById('sum-per-day').textContent = selectedCar.price.toLocaleString() + ' ฿';
  document.getElementById('sum-delivery').textContent = deliverycost.toLocaleString() + ' ฿';
  const totalAmount = (selectedCar.price * sDay) + 3000 + deliverycost;
  document.getElementById('sum-total').textContent = totalAmount.toLocaleString() + ' ฿';

  showPage('payment');
}

// ===== DATE MODAL (สำหรับ mode=1) =====
function openDateModal() {
  // ใส่ข้อมูลรถที่เลือกใน modal
  document.getElementById('modal-car-emoji').innerHTML = `<img src="${selectedCar.image}" alt="${selectedCar.name}" style="width:64px;height:52px;object-fit:contain;border-radius:8px;">`;
  document.getElementById('modal-car-name').textContent = selectedCar.name;
  document.getElementById('modal-car-type').textContent = selectedCar.type;
  document.getElementById('modal-car-price').textContent = selectedCar.price.toLocaleString() + ' ฿ / วัน';

  // ตั้ง default วันใน modal
  const today = new Date();
  const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
  const aftr = new Date(today); aftr.setDate(aftr.getDate() + 3);
  const toISO = d => d.toISOString().split('T')[0];

  document.getElementById('modal-start').value = toISO(tmr);
  document.getElementById('modal-end').value = toISO(aftr);
  updateModalNights();
  document.getElementById('date-modal-overlay').classList.add('open');
}

function closeDateModal() {
  document.getElementById('date-modal-overlay').classList.remove('open');
}

function updateModalNights() {
  const s = document.getElementById('modal-start').value;
  const e = document.getElementById('modal-end').value;
  const delivery = document.getElementById('modal-delivery').value;
  const info = document.getElementById('modal-nights-info');
  let deliverycost=1000;
  if (s && e && e > s) {
    const totaldays = Math.ceil((new Date(e) - new Date(s)) / 86400000);
    days=totaldays;
    saleDay=0;
    while(true)
    {
      if(days-30>=0) 
      {
        saleDay=saleDay+16;
        days=days-30;
      }
      else if(days-7>=0) 
      {
        saleDay=saleDay+5;
        days=days-7;
      }
      else 
      {
        saleDay=saleDay+days;
        break;
      }
    }
    
    if (delivery==="Self-Pickup") { deliverycost=0; }
    if (delivery === "custom-map") { deliverycost = Number(document.getElementById('map-result-fee').textContent) }

    const total = (selectedCar ? selectedCar.price * saleDay + 3000 + deliverycost : 0).toLocaleString();
    info.textContent = `${totaldays} วัน · รวม ${total} ฿ (รวมประกัน 3,000 ฿)`;
    info.style.color = 'var(--accent)';
  } else {
    info.textContent = e && e <= s ? '⚠ วันคืนรถต้องเป็นวันหลังวันรับรถ' : '';
    info.style.color = 'var(--accent2)';
  }
}

function confirmDateModal() {
  const s = document.getElementById('modal-start').value;
  const e = document.getElementById('modal-end').value;
  const delivery = document.getElementById('modal-delivery').value;

  if (!s || !e) { toast('กรุณาเลือกวันที่รับและคืนรถ', 'warning'); return; }
  if (new Date(e) < new Date(s)) { toast('วันคืนรถต้องเป็นวันหลังจากการรับรถ', 'warning'); return; }
  
  startDate = s; 
  endDate = e;

  const ms = new Date(e) - new Date(s);
  totalDays = Math.max(1, Math.ceil(ms / 86400000)); 

  closeDateModal();
  goToPayment();
}

function selectPayMethod(el, method) {
  document.querySelectorAll('.pay-method').forEach(m => {
    m.classList.remove('selected');
    m.setAttribute('data-method', m.getAttribute('data-method') || method);
  });
  el.classList.add('selected');
  el.setAttribute('data-method', method);
  document.getElementById('credit-section').style.display = method === 'credit' ? 'block' : 'none';
  document.getElementById('qr-section').style.display   = method === 'qr'   ? 'block' : 'none';
  document.getElementById('bank-section').style.display = method === 'bank' ? 'block' : 'none';
}

function formatCard(input) {
  let v = input.value.replace(/\D/g,'').substring(0,16);
  input.value = v.replace(/(.{4})/g,'$1  ').trim();
}

function formatEslip(input) {
  // 1. ลบทุกอย่างที่ไม่ใช่ตัวเลข
  let v = input.value.replace(/\D/g, '');
  
  let formatted = "";

  // ตรวจสอบหลักที่ 1 (ต้องไม่เกิน 2)
  if (v.length >= 1) {
    let d1 = v[0];
    if (parseInt(d1) > 2) d1 = '2'; // ถ้าเกิน 2 ให้แก้เป็น 2
    formatted += d1;
  }

  // ตรวจสอบหลักที่ 2
  if (v.length >= 2) {
    let d2 = v[1];
    // ถ้าหลักแรกเป็น 2 หลักที่สองต้องไม่เกิน 4
    if (formatted[0] === '2') {
      if (parseInt(d2) > 3) d2 = '3';
    }
    formatted += d2;
  }

  // ตรวจสอบหลักที่ 3 (หลักแรกของนาที ต้องไม่เกิน 5)
  if (v.length >= 3) {
    let d3 = v[2];
    if (parseInt(d3) > 5) d3 = '5';
    formatted += ':' + d3;
  }

  // หลักที่ 4 และ 5 (ใส่ตามปกติ)
  if (v.length >= 4) {
    formatted += v.substring(3, 5);
  }

  input.value = formatted;
}

function formatMY(input) {
  // 1. ลบทุกอย่างที่ไม่ใช่ตัวเลข
  let v = input.value.replace(/\D/g, '');
  let out = "";

  // --- จัดการ เดือน (MM) ---
  if (v.length >= 1) {
    let m1 = v[0];
    if (parseInt(m1) > 1) m1 = '1'; // เดือนหลักแรกห้ามเกิน 1
    out += m1;
  }
  
  if (v.length >= 2) {
    let m2 = v[1];
    // ถ้าหลักแรกเป็น 1 (ต.ค. - ธ.ค.) หลักที่สองห้ามเกิน 2
    if (out[0] === '1' && parseInt(m2) > 2) m2 = '2';
    // เดือน 00 ไม่มีจริง ให้ปรับเป็น 01
    if (out[0] === '0' && m2 === '0') m2 = '1';
    out += m2 + '/';
  }

  // --- จัดการ ปี (YYYY) ---
  if (v.length >= 3) {
    // ดึงตัวเลขตั้งแต่หลักที่ 3 เป็นต้นไป (สูงสุด 2 ตัวสำหรับปี)
    out += v.substring(2, 4);
  }

  input.value = out;
}

function formatDMY(input) {
  // 1. ลบทุกอย่างที่ไม่ใช่ตัวเลข
  let v = input.value.replace(/\D/g, '');
  let out = "";

  // --- จัดการ วัน (DD) ---
  if (v.length >= 1) {
    let d1 = v[0];
    if (parseInt(d1) > 3) d1 = '3'; // วันที่หลักแรกไม่เกิน 3
    out += d1;
  }

  if (v.length >= 2) {
    let d2 = v[1];
    if (out[0] === '3' && parseInt(d2) > 1) d2 = '1'; // ถ้าหลักแรกเป็น 3 หลักที่สองห้ามเกิน 1
    if (out[0] === '0' && d2 === '0') d2 = '1';       // วันที่ 00 ไม่มีอยู่จริง ให้เป็น 01
    out += d2 + '/';
  }

  // --- จัดการ เดือน (MM) ---
  if (v.length >= 3) {
    let m1 = v[2];
    if (parseInt(m1) > 1) m1 = '1'; // เดือนหลักแรกไม่เกิน 1
    out += m1;
  }
  
  if (v.length >= 4) {
    let m2 = v[3];
    let day = parseInt(out.substring(0, 2));
    let month = parseInt(out[3] + m2);

    if (out[3] === '1' && parseInt(m2) > 2) m2 = '2';
    else if (out[3] === '0' && m2 === '0') m2 = '1';

    month = parseInt(out[3] + m2);

    if (day === 31) {
      if ([2, 4, 6, 9, 11].includes(month)) {
        m2 = '1'; // บังคับให้เป็นเดือน 01
      }
    }

    if (day === 30) {
      if ([2].includes(month)) {
        m2 = '1'; // บังคับให้เป็นเดือน 01
      }
    }

    out += m2 + '/';
  }

  // --- จัดการ ปี (YYYY) ---
  if (v.length >= 5) {
    out += v.substring(4, 8); // ปีใส่ได้ 4 หลัก (5-8)
  }

  input.value = out;
}

// Set default dates
const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
const dayAfter = new Date(today); dayAfter.setDate(dayAfter.getDate()+3);
const toISO = d => d.toISOString().split('T')[0];
document.getElementById('start-date').value = toISO(tomorrow);
document.getElementById('end-date').value = toISO(dayAfter);

// Build marquee
function buildMarquee() {
  const track = document.getElementById('marquee-track');
  if (!track) return;
  // Duplicate for seamless loop
  const items = [...CARS, ...CARS];
  track.innerHTML = items.map(c => `
    <div class="marquee-card">
      <div class="marquee-car-icon"><img src="${c.image}" alt="${c.name}" class="marquee-car-img"></div>
      <div>
        <div class="marquee-car-name"><span style="font-size:15px; font-family:'Mitr',sans-serif;font-weight:500;color:var(--text)">${c.name}</span></div>
        <div class="marquee-car-sub"><span style="font-size:13px;">${c.type}</span></div>
        <div class="marquee-car-price">${c.price.toLocaleString()} <span style="font-size:13px;font-family:'Mitr',sans-serif;font-weight:400;color:var(--muted)">฿/วัน</span></div>
      </div>
    </div>
  `).join('');
}

// FAQ
const items = document.querySelectorAll(".faq-btn");
function toggleAccordion() {
  const itemToggle = this.getAttribute('aria-expanded');
  
  for (i = 0; i < items.length; i++) {
    items[i].setAttribute('aria-expanded', 'false');
  }
  
  if (itemToggle == 'false') {
    this.setAttribute('aria-expanded', 'true');
  }
}

items.forEach(item => item.addEventListener('click', toggleAccordion));
function showcar() {
  mode=1;
  document.getElementById('display-dates').textContent = '' ;
  document.getElementById('display-days').textContent = '';
  const grid = document.getElementById('cars-grid');
  const filtered = CARS.filter(c => {
    
    if (filters.seats !== 'all' && String(c.seats) !== filters.seats) return false;
    if (filters.fuel !== 'all' && c.fuel !== filters.fuel) return false;
    if (filters.price === 'low' && c.price >= 1200) return false;
    if (filters.price === 'mid' && (c.price < 1200 || c.price > 2000)) return false;
    if (filters.price === 'high' && c.price <= 2000) return false;
    return true;
  });

  document.getElementById('result-count').textContent = `พบ ${filtered.length} คัน`;

  if (!filtered.length) {
    grid.innerHTML = `<div class="no-results"><div class="icon">🔍</div><p>ไม่พบรถตามเงื่อนไข<br>กรุณาปรับตัวกรอง</p></div>`;
    return;
  }

  const fuelLabel = f => f === '95' ? '⛽ เบนซิน 95' : '🛢 ดีเซล';
  const total = c => (c.price * 5 ).toLocaleString();

  grid.innerHTML = filtered.map(c => `
    <div class="car-card" onclick="selectCar(${c.id})">
      <div class="car-img-wrap">
        <img src="${c.image}" alt="${c.name}" class="car-photo">
        <div class="car-badge ${c.available ? 'badge-available' : 'badge-limited'}">
          ${c.available ? '✔ ว่าง' : '✖ เต็ม'}
        </div>
      </div>
      <div class="car-info">
        <div class="car-name">${c.name}</div>
        <div class="car-type">${c.type}</div>
        <div class="car-specs">
          <div class="spec">👥 ${c.seats} ที่นั่ง</div>
          <div class="spec">${fuelLabel(c.fuel)}</div>
          <div class="spec">🔄 Auto</div>
          <div class="spec">❄️ A/C</div>
        </div>
        <div class="car-price-row">
          <div>
            <div class="price">${c.price.toLocaleString()} <span>฿ / วัน</span></div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;">${total(c)} ฿ / สัปดาห์ </div>
          </div>
          <button class="btn-select">เลือกคัน</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderCars() {
  const grid = document.getElementById('cars-grid');
  const filtered = CARS.filter(c => {
    if (!c.available) return false;
    if (filters.seats !== 'all' && String(c.seats) !== filters.seats) return false;
    if (filters.fuel !== 'all' && c.fuel !== filters.fuel) return false;
    if (filters.price === 'low' && c.price >= 1200) return false;
    if (filters.price === 'mid' && (c.price < 1200 || c.price > 2000)) return false;
    if (filters.price === 'high' && c.price <= 2000) return false;
    return true;
  });

  document.getElementById('result-count').textContent = `พบ ${filtered.length} คัน`;

  if (!filtered.length) {
    grid.innerHTML = `<div class="no-results"><div class="icon">🔍</div><p>ไม่พบรถตามเงื่อนไข<br>กรุณาปรับตัวกรอง</p></div>`;
    return;
  }
  totalDays=numDays;
  saleDay=0;
  while(true)
  {
    if(numDays-30>=0) 
    {
      saleDay=saleDay+16;
      numDays=numDays-30;
    }
    else if(numDays-7>=0) 
    {
      saleDay=saleDay+5;
      numDays=numDays-7;
    }
    else 
    {
      saleDay=saleDay+numDays;
      break;
    }
  }
  const fuelLabel = f => f === '95' ? '⛽ เบนซิน 95' : '🛢 ดีเซล';
  const total = c => (c.price * saleDay).toLocaleString();

  grid.innerHTML = filtered.map(c => `
    <div class="car-card" onclick="selectCar(${c.id})">
      <div class="car-img-wrap">
        <img src="${c.image}" alt="${c.name}" class="car-photo">
        <div class="car-badge ${c.available ? 'badge-available' : 'badge-limited'}">
          ${c.available ? '✔ ว่าง' : '✖ เต็ม'}
        </div>
      </div>
      <div class="car-info">
        <div class="car-name">${c.name}</div>
        <div class="car-type">${c.type}</div>
        <div class="car-specs">
          <div class="spec">👥 ${c.seats} ที่นั่ง</div>
          <div class="spec">${fuelLabel(c.fuel)}</div>
          <div class="spec">🔄 Auto</div>
          <div class="spec">❄️ A/C</div>
        </div>
        <div class="car-price-row">
          <div>
            <div class="price">${c.price.toLocaleString()} <span>฿ / วัน</span></div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;">รวม ${totalDays} วัน = ${total(c)} ฿</div>
          </div>
          <button class="btn-select">เลือกคัน</button>
        </div>
      </div>
    </div>
  `).join('');
}
/* ══════════════════════════════════════════════════════════
   MAP MODAL  —  inline Leaflet + OSRM
   ══════════════════════════════════════════════════════════ */

/* inject CSS */
(function(){
  const s = document.createElement('style');
  s.textContent = `
    .btn-map-open {
      display:inline-flex;align-items:center;gap:6px;
      padding:8px 16px;border-radius:10px;
      background:var(--card);border:1px solid var(--border);
      color:var(--text);font-family:'Mitr',sans-serif;font-size:13px;
      font-weight:500;cursor:pointer;transition:all 0.15s;white-space:nowrap;
    }
    .btn-map-open:hover{border-color:var(--accent);color:var(--accent);background:rgba(232,197,71,0.06);}

    .map-modal-box {
      background:var(--card);border:1px solid var(--border);
      border-radius:20px;width:100%;max-width:820px;
      max-height:90vh;display:flex;flex-direction:column;
      overflow:hidden;position:relative;
      box-shadow:0 24px 64px rgba(0,0,0,0.55);
      animation:modal-fade-in 0.22s ease;
    }
    .map-modal-box::before{
      content:'';position:absolute;top:0;left:0;right:0;height:3px;
      background:linear-gradient(90deg,var(--accent),var(--accent2));
    }
    .map-modal-header{
      display:flex;align-items:flex-start;justify-content:space-between;
      padding:18px 22px 14px;flex-shrink:0;
    }
    .map-modal-title{font-size:17px;font-weight:600;color:var(--text);}
    .map-modal-sub{font-size:12px;color:var(--muted);margin-top:3px;}
    #inline-map{
      flex:1;min-height:360px;max-height:420px;
      border-top:1px solid var(--border);border-bottom:1px solid var(--border);
    }
    .map-info-bar{
      display:flex;gap:16px;flex-shrink:0;
      padding:14px 22px;background:var(--surface);
      border-bottom:1px solid var(--border);flex-wrap:wrap;
    }
    .map-info-col{min-width:110px;}
    .map-info-label{font-size:10px;text-transform:uppercase;font-weight:700;
      letter-spacing:1px;color:var(--muted);margin-bottom:4px;}
    .map-info-value{font-size:14px;font-weight:600;color:var(--text);}
    .map-info-value.accent{color:var(--accent);}
    .map-info-value.accent2{color:var(--accent2);}
    .map-spinner{
      width:20px;height:20px;border:2px solid var(--border);
      border-top-color:var(--accent);border-radius:50%;
      animation:map-spin 0.7s linear infinite;
    }
    @keyframes map-spin{to{transform:rotate(360deg)}}
    .map-modal-actions{display:flex;gap:10px;padding:14px 22px;flex-shrink:0;}
    .map-btn-reset{
      padding:10px 16px;background:transparent;
      border:1px solid var(--border);color:var(--muted);
      border-radius:10px;font-family:'Mitr',sans-serif;font-size:13px;
      cursor:pointer;transition:all 0.15s;white-space:nowrap;
    }
    .map-btn-reset:hover{border-color:var(--accent2);color:var(--accent2);}
    .map-btn-gmaps{
      padding:10px 16px;background:transparent;
      border:1px solid var(--border);color:var(--muted);
      border-radius:10px;font-family:'Mitr',sans-serif;font-size:13px;
      cursor:pointer;transition:all 0.15s;white-space:nowrap;
    }
    .map-btn-gmaps:not(:disabled):hover{border-color:var(--accent);color:var(--accent);}
    .map-btn-gmaps:disabled{opacity:0.4;cursor:not-allowed;}
    .leaflet-popup-content-wrapper{
      font-family:'Mitr',sans-serif;font-size:13px;font-weight:600;border-radius:10px;
    }
    @media(max-width:600px){
      .map-modal-box{border-radius:16px;}
      #inline-map{min-height:240px;max-height:300px;}
      .map-info-bar{gap:10px;padding:10px 14px;}
      .map-modal-actions{flex-wrap:wrap;padding:10px 14px;}
      .map-btn-reset,.map-btn-gmaps{flex:1;text-align:center;}
    }
  `;
  document.head.appendChild(s);
})();

/* ── Config ── */
const SHOP_MAP   = { lat: 13.577892, lng: 100.295456 };
const MAP_RATE   = 20;
const MAP_BASE   = 200;

/* ── State ── */
let _mapInited    = false;
let _inlineMap    = null;
let _custMarker   = null;
let _routeLayer   = null;
let _mapCustCoords = null;
let _mapRouteData  = null;

/* ── Open / Close ── */
function openMapModal() {
  document.getElementById('map-modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    if (!_mapInited) initInlineMap();
    else _inlineMap.invalidateSize();
  }, 80);
}
function closeMapModal() {
  document.getElementById('map-modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function handleMapModalOutsideClick(e) {
  if (e.target === document.getElementById('map-modal-overlay')) closeMapModal();
}

/* ── Init Leaflet (lazy load) ── */
function initInlineMap() {
  if (typeof L === 'undefined') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = _buildMap;
    document.head.appendChild(script);
  } else {
    _buildMap();
  }
}

function _buildMap() {
  if (L.Icon && L.Icon.Default && L.Icon.Default.prototype._getIconUrl) {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }

  _inlineMap = L.map('inline-map', { zoomControl:true })
    .setView([SHOP_MAP.lat, SHOP_MAP.lng], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19, attribution:'© OpenStreetMap'
  }).addTo(_inlineMap);

  /* Shop marker 
  const shopIcon = L.divIcon({
    html:`<div style="width:32px;height:32px;background:#e8c547;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(232,197,71,.45);"><span style="transform:rotate(45deg);font-size:14px;">🏠</span></div>`,
    className:'', iconAnchor:[16,32], popupAnchor:[0,-34]
  });
  L.marker([SHOP_MAP.lat, SHOP_MAP.lng], { icon:shopIcon })
    .addTo(_inlineMap)
    .bindPopup(`<b>${SHOP_MAP.name}</b><br>จุดรับ-คืนรถ`)
    .openPopup();*/

  /* Customer pin icon */
  const custIcon = L.divIcon({
    html:`<div style="width:32px;height:32px;background:#ff6b35;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(255,107,53,.45);"><span style="transform:rotate(45deg);font-size:14px;">📌</span></div>`,
    className:'', iconAnchor:[16,32], popupAnchor:[0,-34]
  });

  _inlineMap.on('click', function(e) {
    const {lat,lng} = e.latlng;
    _mapCustCoords = [lat,lng];
    if (_custMarker) { _custMarker.setLatLng([lat,lng]); }
    else {
      _custMarker = L.marker([lat,lng],{icon:custIcon,draggable:true})
        .addTo(_inlineMap).bindPopup('<b>ตำแหน่งของคุณ</b>');
      _custMarker.on('dragend', ev => {
        const p = ev.target.getLatLng();
        _mapCustCoords = [p.lat, p.lng];
        _calcMapRoute(p.lat, p.lng);
      });
    }
    _custMarker.openPopup();
    document.getElementById('mi-coord').textContent = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
    document.getElementById('btn-open-gmaps').disabled = false;
    _calcMapRoute(lat, lng);
  });

  _mapInited = true;
}

/* ── OSRM ── */
async function _calcMapRoute(lat, lng) {
  document.getElementById('mi-spinner').style.display = 'flex';
  ['mi-dist','mi-dur','mi-fee'].forEach(id => document.getElementById(id).textContent = '...');
  document.getElementById('btn-map-confirm').disabled = true;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/`+
                `${SHOP_MAP.lng},${SHOP_MAP.lat};${lng},${lat}`+
                `?overview=full&geometries=geojson`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.code!=='Ok'||!data.routes?.length) {
      document.getElementById('mi-dist').textContent='ไม่พบเส้นทาง'; return;
    }
    const route  = data.routes[0];
    const distKm = (route.distance/1000).toFixed(1);
    const durMin = Math.round(route.duration/60);
    const fee    = Math.max(MAP_BASE, Math.round(distKm*MAP_RATE/10)*10);
    const coords = route.geometry.coordinates.map(c=>[c[1],c[0]]);
    _mapRouteData = { distance:route.distance, duration:route.duration, dist:distKm, fee };
    if (_routeLayer) _inlineMap.removeLayer(_routeLayer);
    _routeLayer = L.polyline(coords,{color:'#e8c547',weight:4,opacity:0.85,dashArray:'10 6'});
    _inlineMap.setView([lat, lng], 16);
    document.getElementById('mi-dist').textContent = `${distKm} กม.`;
    document.getElementById('mi-dur').textContent  = durMin>=60 ? `${Math.floor(durMin/60)}ชม. ${durMin%60}น.` : `${durMin} น.`;
    document.getElementById('mi-fee').textContent  = `${fee.toLocaleString()} ฿`;
    document.getElementById('btn-map-confirm').disabled = false;
  } catch(err) {
    console.error('[MapModal]',err);
    document.getElementById('mi-dist').textContent='เกิดข้อผิดพลาด';
  } finally {
    document.getElementById('mi-spinner').style.display='none';
  }
}

/* ── Actions ── */
function resetInlineMap() {
  if (_custMarker){_inlineMap.removeLayer(_custMarker);_custMarker=null;}
  if (_routeLayer){_inlineMap.removeLayer(_routeLayer);_routeLayer=null;}
  _mapCustCoords=null;_mapRouteData=null;
  ['mi-coord','mi-dist','mi-dur','mi-fee'].forEach((id,i)=>
    document.getElementById(id).textContent=i===0?'คลิกบนแผนที่':'—');
  document.getElementById('btn-map-confirm').disabled=true;
  document.getElementById('btn-open-gmaps').disabled=true;
  _inlineMap.setView([SHOP_MAP.lat,SHOP_MAP.lng],11);
}

function openGmapsFromModal() {
  if (!_mapCustCoords) return;
  window.open(`https://www.google.com/maps/dir/${SHOP_MAP.lat},${SHOP_MAP.lng}/${_mapCustCoords[0]},${_mapCustCoords[1]}`,'_blank');
}

function confirmMapLocation() {
  if (!_mapCustCoords||!_mapRouteData) return;
  const [lat,lng] = _mapCustCoords;
  const sel = document.getElementById('delivery');
  if (sel) {
    sel.value='custom-map';
    sel.dataset.customLat  = lat;
    sel.dataset.customLng  = lng;
    sel.dataset.customDist = _mapRouteData.dist;
    sel.dataset.customFee  = _mapRouteData.fee;
  }
  const box = document.getElementById('map-result-box');
  if (box) {
    box.style.display='block';
    document.getElementById('map-result-label').textContent=`${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`;
    document.getElementById('map-result-dist').textContent=_mapRouteData.dist;
    document.getElementById('map-result-fee').textContent=parseInt(_mapRouteData.fee).toLocaleString();
  }
  closeMapModal();
}
/* ═══════════════════════════════════════
    STAT COUNTER ANIMATION (ease-out)
   ═══════════════════════════════════════ */
(function () {
  const DURATION = 1800; // ms

  function easeOut(t) {
    // cubic ease-out: เร็วตอนต้น ช้าตอนท้าย
    return 1 - Math.pow(1 - t, 1);
  }

  function animateCounter(el) {
    const target   = parseFloat(el.dataset.target);
    const suffix   = el.dataset.suffix  || '';
    const fmt      = el.dataset.format  || '';       // 'K' → หารด้วย 1000
    const decimals = parseInt(el.dataset.decimal) || 0;
    const start    = performance.now();

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased    = easeOut(progress);
      const current  = target * eased;

      let display;
      if (fmt === 'K') {
        // แสดงเป็น K เมื่อถึง 1000
        display = current >= 1000
          ? (current / 1000).toFixed(decimals) + 'K'
          : Math.round(current).toString();
      } else {
        display = decimals > 0
          ? current.toFixed(decimals)
          : Math.round(current).toString();
      }

      el.textContent = display + suffix;

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // เริ่ม animate เมื่อ .stats เข้า viewport (IntersectionObserver)
  const statEls = document.querySelectorAll('.stat-num[data-target]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    statEls.forEach(el => observer.observe(el));
  } else {
    // fallback: รันทันที
    statEls.forEach(animateCounter);
  }
})();