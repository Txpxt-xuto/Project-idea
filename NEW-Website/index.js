
const CARS = [
  { id:1, serverNumber:1, name:'Toyota Fortuner', type:'SUV', seats:7, fuel:'diesel', price:2200, emoji:'🚙', available:true },
  { id:2, serverNumber:2, name:'Honda CR-V', type:'SUV', seats:5, fuel:'95', price:1800, emoji:'🚘', available:true },
  { id:3, serverNumber:3, name:'Toyota Alphard', type:'MPV', seats:13, fuel:'95', price:3500, emoji:'🚐', available:false, limited:true },
  { id:4, serverNumber:4, name:'Isuzu MU-X', type:'PPV', seats:7, fuel:'diesel', price:1900, emoji:'🛻', available:true },
  { id:5, serverNumber:5, name:'Honda Civic', type:'Sedan', seats:5, fuel:'95', price:1100, emoji:'🚗', available:true },
  { id:6, serverNumber:6, name:'Toyota Innova', type:'MPV', seats:7, fuel:'diesel', price:1600, emoji:'🚌', available:true },
  { id:7, serverNumber:7, name:'Mazda CX-5', type:'SUV', seats:5, fuel:'95', price:2000, emoji:'🏎', available:true },
  { id:8, serverNumber:8, name:'Ford Everest', type:'SUV', seats:7, fuel:'diesel', price:2400, emoji:'🚙', available:false, limited:true },
  { id:9, serverNumber:9, name:'Nissan Serena', type:'MPV', seats:13, fuel:'95', price:1700, emoji:'🚐', available:true },
  { id:10, serverNumber:10, name:'Mitsubishi Xpander', type:'MPV', seats:13, fuel:'95', price:1300, emoji:'🚗', available:true },
  { id:11, serverNumber:11, name:'Toyota Vios', type:'Sedan', seats:5, fuel:'95', price:850, emoji:'🚗', available:true },
  { id:12, serverNumber:12, name:'Toyota Camry', type:'Sedan', seats:5, fuel:'95', price:900, emoji:'🚘', available:true },
];

let filters = { seats: 'all', fuel: 'all', price: 'all' };
let selectedCar = null;
let startDate = '', endDate = '', numDays = 1;
let mode=0;


window.onload = function() {
  buildMarquee();
};

function showPage(name) {
  // Guard: success page only accessible after payment
  if (name === 'success' && !paymentCompleted) return;
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.removeProperty('display');
  });
  // Keep success hidden unless payment done
  const successEl = document.getElementById('page-success');
  if (name !== 'success') {
    successEl.style.setProperty('display','none','important');
  }
  const target = document.getElementById('page-' + name);
  if (name === 'success') {
    target.style.removeProperty('display');
  }
  target.classList.add('active');
  window.scrollTo(0, 0);
}

/*function searchCars() {
  const s = document.getElementById('start-date').value;
  const e = document.getElementById('end-date').value;
  if (!s || !e) { alert('กรุณาเลือกวันที่รับและคืนรถ'); return; }
  if (e <= s) { alert('วันคืนรถต้องเป็นวันหลังจากการรับรถ'); return; }
  startDate = s; endDate = e;
  const ms = new Date(e) - new Date(s);
  numDays = Math.max(1, Math.ceil(ms / 86400000));

  const fmt = d => new Date(d).toLocaleDateString('th-TH', {day:'numeric',month:'short',year:'numeric'});
  document.getElementById('display-dates').textContent = fmt(s) + ' → ' + fmt(e);
  document.getElementById('display-days').textContent =  'รวม ' + numDays + ' วัน';

  renderCars();
  showPage('cars');
}*/


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
  const fmt = d => new Date(d).toLocaleDateString('th-TH', {day:'numeric',month:'short',year:'numeric'});
  document.getElementById('sum-icon').textContent = selectedCar.emoji;
  document.getElementById('sum-name').textContent = selectedCar.name;
  document.getElementById('sum-type').textContent = selectedCar.type;
  document.getElementById('sum-start').textContent = fmt(startDate);
  document.getElementById('sum-end').textContent = fmt(endDate);
  document.getElementById('sum-days').textContent = numDays + ' วัน';
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
  document.getElementById('sum-per-day').textContent = selectedCar.price.toLocaleString() + ' ฿';
  document.getElementById('sum-total').textContent = (selectedCar.price * saleDay + 3000).toLocaleString() + ' ฿';
  showPage('payment');
}

// ===== DATE MODAL (สำหรับ mode=1) =====
function openDateModal() {
  // ใส่ข้อมูลรถที่เลือกใน modal
  document.getElementById('modal-car-emoji').textContent = selectedCar.emoji;
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
  const info = document.getElementById('modal-nights-info');
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
    const total = (selectedCar ? selectedCar.price * saleDay + 3000 : 0).toLocaleString();
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
  if (!s || !e) { alert('กรุณาเลือกวันที่รับและคืนรถ'); return; }
  if (e <= s) { alert('วันคืนรถต้องเป็นวันหลังจากการรับรถ'); return; }

  startDate = s; endDate = e;
  const ms = new Date(e) - new Date(s);
  numDays = Math.max(1, Math.ceil(ms / 86400000));

  closeDateModal();
  goToPayment();
}

function selectPayMethod(el, method) {
  document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('card-section').style.display = method === 'card' ? 'block' : 'none';
  document.getElementById('qr-section').style.display = method === 'qr' ? 'block' : 'none';
  document.getElementById('bank-section').style.display = method === 'bank' ? 'block' : 'none';
}

function formatCard(input) {
  let v = input.value.replace(/\D/g,'').substring(0,16);
  input.value = v.replace(/(.{4})/g,'$1  ').trim();
}

/*function confirmPayment() {
  paymentCompleted = true;
  const ref = 'RMX-' + Math.floor(100000 + Math.random() * 900000);
  document.getElementById('booking-ref-num').textContent = ref;
  showPage('success');
}*/

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
      <div class="marquee-car-icon"><span style="font-size:150%;">${c.emoji}</span></div>
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
        <div class="car-emoji">${c.emoji}</div>
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
        <div class="car-emoji">${c.emoji}</div>
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