
const CARS = [
  { id:1, name:'Toyota Fortuner', type:'SUV', seats:7, fuel:'diesel', price:2200, emoji:'🚙', available:true },
  { id:2, name:'Honda CR-V', type:'SUV', seats:5, fuel:'95', price:1800, emoji:'🚘', available:true },
  { id:3, name:'Toyota Alphard', type:'MPV', seats:13, fuel:'95', price:3500, emoji:'🚐', available:false, limited:true },
  { id:4, name:'Isuzu MU-X', type:'PPV', seats:7, fuel:'diesel', price:1900, emoji:'🛻', available:true },
  { id:5, name:'Honda Civic', type:'Sedan', seats:5, fuel:'95', price:1100, emoji:'🚗', available:true },
  { id:6, name:'Toyota Innova', type:'MPV', seats:7, fuel:'diesel', price:1600, emoji:'🚌', available:true },
  { id:7, name:'Mazda CX-5', type:'SUV', seats:5, fuel:'95', price:2000, emoji:'🏎', available:true },
  { id:8, name:'Ford Everest', type:'SUV', seats:7, fuel:'diesel', price:2400, emoji:'🚙', available:false, limited:true },
  { id:9, name:'Nissan Serena', type:'MPV', seats:13, fuel:'95', price:1700, emoji:'🚐', available:true },
  { id:10, name:'Mitsubishi Xpander', type:'MPV', seats:13, fuel:'95', price:1300, emoji:'🚗', available:true },
];

let filters = { seats: 'all', fuel: 'all', price: 'all' };
let selectedCar = null;
let startDate = '', endDate = '', numDays = 1;

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  window.scrollTo(0, 0);
}

function searchCars() {
  const s = document.getElementById('start-date').value;
  const e = document.getElementById('end-date').value;
  if (!s || !e) { alert('กรุณาเลือกวันที่รับและคืนรถ'); return; }
  if (e <= s) { alert('วันคืนรถต้องเป็นวันหลังจากการรับรถ'); return; }
  startDate = s; endDate = e;
  const ms = new Date(e) - new Date(s);
  numDays = Math.max(1, Math.ceil(ms / 86400000));

  const fmt = d => new Date(d).toLocaleDateString('th-TH', {day:'numeric',month:'short',year:'numeric'});
  document.getElementById('display-dates').textContent = fmt(s) + ' → ' + fmt(e);
  document.getElementById('display-days').textContent = numDays + ' วัน';

  renderCars();
  showPage('cars');
}

function renderCars() {
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
    grid.innerHTML = `<div class="no-results"><div class="icon">🔍</div><p>ไม่พบรถตามเงื่อนไข<br>ลองปรับตัวกรองดูใหม่</p></div>`;
    return;
  }

  const fuelLabel = f => f === '95' ? '⛽ เบนซิน 95' : '🛢 ดีเซล';
  const total = c => (c.price * numDays).toLocaleString();

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
            <div class="price">${c.price.toLocaleString()} <span>฿/วัน</span></div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;">รวม ${numDays} วัน = ${total(c)} ฿</div>
          </div>
          <button class="btn-select">เลือกคัน →</button>
        </div>
      </div>
    </div>
  `).join('');
}

function setFilter(type, value, el) {
  filters[type] = value;
  document.querySelectorAll(`[data-filter="${type}"]`).forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderCars();
}

function resetFilters() {
  filters = { seats: 'all', fuel: 'all', price: 'all' };
  document.querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('active', c.dataset.value === 'all');
  });
  renderCars();
}

function selectCar(id) {
  selectedCar = CARS.find(c => c.id === id);
  if (!selectedCar) return;

  const fmt = d => new Date(d).toLocaleDateString('th-TH', {day:'numeric',month:'short',year:'numeric'});
  document.getElementById('sum-icon').textContent = selectedCar.emoji;
  document.getElementById('sum-name').textContent = selectedCar.name;
  document.getElementById('sum-type').textContent = selectedCar.type;
  document.getElementById('sum-start').textContent = fmt(startDate);
  document.getElementById('sum-end').textContent = fmt(endDate);
  document.getElementById('sum-days').textContent = numDays + ' วัน';
  document.getElementById('sum-per-day').textContent = selectedCar.price.toLocaleString() + ' ฿';
  document.getElementById('sum-total').textContent = (selectedCar.price * numDays + 3000).toLocaleString()  + ' ฿';

  showPage('payment');
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

function confirmPayment() {
  const ref = 'DRX-' + Math.floor(100000 + Math.random() * 900000);
  document.getElementById('booking-ref-num').textContent = ref;
  showPage('success');
}

// Set default dates
const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
const dayAfter = new Date(today); dayAfter.setDate(dayAfter.getDate()+3);
const toISO = d => d.toISOString().split('T')[0];
document.getElementById('start-date').value = toISO(tomorrow);
document.getElementById('end-date').value = toISO(dayAfter);

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
