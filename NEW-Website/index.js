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
};

function showPage(name) {
  /* Guard 1: success เปิดได้เฉพาะหลังชำระเงิน */
  if (name === 'success' && !paymentCompleted) return;

  /* Guard 2: ถ้า success กำลังแสดงอยู่ ห้าม navigate ออก
     จะออกได้เฉพาะ goBackHome() ซึ่ง reset paymentCompleted ก่อนแล้วค่อยเรียก showPage */
  const successEl = document.getElementById('page-success');
  if (paymentCompleted && name !== 'success') return;

  /* ซ่อนทุกหน้า — ข้าม page-success ไม่แตะเลย
     (ถ้าแตะแล้ว display:none !important จะทำให้มันหายทันที) */
  document.querySelectorAll('.page').forEach(p => {
    if (p.id === 'page-success') return;
    p.classList.remove('active');
    p.style.setProperty('display', 'none', 'important');
  });

  const target = document.getElementById('page-' + name);
  if (!target) return;

  if (name === 'success') {
    /* ลบ inline style ที่ HTML ตั้งไว้ตอนโหลด แล้วเปิด */
    successEl.style.removeProperty('display');
  }

  target.classList.add('active');
  window.scrollTo(0, 0);
}

/* กดปุ่มกลับหน้าหลักจากหน้า success — reset state ทั้งหมด */
function goBackHome() {
  paymentCompleted = false;
  selectedCar = null;
  startDate = ''; endDate = ''; numDays = 1;
  mode = 0;
  /* ซ่อน success ก่อนแล้วค่อยแสดงหน้าหลัก */
  document.getElementById('page-success').style.setProperty('display','none','important');
  document.getElementById('page-success').classList.remove('active');
  showPage('home');
  /* reset car availability กลับเป็น default */
  CARS.forEach(c => { c.available = true; });
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
  let deliverycost=1000;
  const fmt = d => new Date(d).toLocaleDateString('th-TH', {day:'numeric',month:'short',year:'numeric'});
  document.getElementById('sum-icon').innerHTML = `<img src="${selectedCar.image}" alt="${selectedCar.name}" style="width:60px;height:48px;object-fit:contain;border-radius:8px;">`;
  document.getElementById('sum-name').textContent = selectedCar.name;
  document.getElementById('sum-type').textContent = selectedCar.type;
  document.getElementById('sum-start').textContent = fmt(startDate);
  document.getElementById('sum-end').textContent = fmt(endDate);
  document.getElementById('sum-days').textContent = numDays + ' วัน';

  if (mode == 0) {
    let delivery = document.getElementById('delivery').value;
    if (delivery === "Self-Pickup") {deliverycost = 0;}
  }
  else if (mode != 0) {
    let delivery = document.getElementById('modal-delivery').value;
    if (delivery === "Self-Pickup") {deliverycost = 0;}
  }

  let days = numDays;
  saleDay = 0;

  while(true)
  {
    if (days-30>=0) {
      saleDay+=16;
      days-=30;
    }
    else if (days-7>=0) {
      saleDay+=5;
      days-=7;
    }
    else {
      saleDay+=days;
      break;
    }
  }

  document.getElementById('sum-per-day').textContent = selectedCar.price.toLocaleString() + ' ฿';
  document.getElementById('sum-delivery').textContent = deliverycost + ' ฿';
  document.getElementById('sum-total').textContent = (selectedCar.price * saleDay + 3000 + deliverycost).toLocaleString() + ' ฿';

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
    if(delivery==="เดินทางมารับด้วยตนเอง (ไม่เสียค่าบริการ)") deliverycost=0;
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
  let deliverycost=1000;

  if (!s || !e) { alert('กรุณาเลือกวันที่รับและคืนรถ'); return; }
  if (e <= s) { alert('วันคืนรถต้องเป็นวันหลังจากการรับรถ'); return; }
  if(delivery==="เดินทางมารับด้วยตนเอง (ไม่เสียค่าบริการ)") deliverycost=0;
  
  startDate = s; endDate = e;
  const ms = new Date(e) - new Date(s);
  numDays = Math.max(1, Math.ceil(ms / 86400000));

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
const items = document.querySelectorAll(".accordion button");
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