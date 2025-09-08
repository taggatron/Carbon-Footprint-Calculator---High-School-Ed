// Simplified emission factors (approximate, per-year or per-unit as commented)
const FACTORS = {
  electricity_kwh: 0.000233, // tCO2e per kWh (0.233 kg/kWh)
  heating_kwh: 0.000185, // tCO2e per kWh for natural gas heating
  car_petrol_per_mile: 0.000271,
  car_diesel_per_mile: 0.000300,
  car_hybrid_per_mile: 0.000180,
  car_electric_per_mile: 0.000100,
  flight_short: 0.15,
  flight_long: 0.6,
  omnivore_diet: 2.5,
  vegetarian_diet: 1.7,
  vegan_diet: 1.2,
  spending_per_usd: 0.0005,
  recycle_good_factor: -0.2,
  recycle_some_factor: -0.08,

  // Screen-time -> electricity conversions (estimates)
  // TVs: assume average TV power draw ~80W while on; phones ~6W while charging/active; these are rough
  // Convert hours/day -> kWh/year: kW * hours/day * 365
  tv_watts: 80,
  phone_watts: 6
};

function getInput(id){return document.getElementById(id).value}

function calculate() {
  const electricity = Number(getInput('electricity')) || 0;
  const heating = Number(getInput('heating')) || 0;
  const tv_hours = Number(getInput('tv_hours')) || 0;
  const phone_hours = Number(getInput('phone_hours')) || 0;
  const car_miles_week = Number(getInput('car_miles')) || 0;
  const car_type = getInput('car_type') || 'petrol';
  const flights_short = Number(getInput('flights_short')) || 0;
  const flights_long = Number(getInput('flights_long')) || 0;
  const diet = getInput('diet') || 'omnivore';
  const spending = Number(getInput('spending')) || 0;
  const recycle = getInput('recycle') || 'good';
  const household = Math.max(1, Number(getInput('household')) || 1);

  // Home energy
  // Convert screen time to kWh/year
  const tv_kwh_year = (FACTORS.tv_watts/1000) * tv_hours * 365;
  // Phone: assume charging/active load; use lower multiplier because phones draw far less
  const phone_kwh_year = (FACTORS.phone_watts/1000) * phone_hours * 365;
  const screens_kwh = tv_kwh_year + phone_kwh_year;

  const ele_em = (electricity + screens_kwh) * FACTORS.electricity_kwh;
  const heat_em = heating * FACTORS.heating_kwh;

  // Transport
  const car_miles_year = car_miles_week * 52;
  const car_factor = {
    petrol: FACTORS.car_petrol_per_mile,
    diesel: FACTORS.car_diesel_per_mile,
    hybrid: FACTORS.car_hybrid_per_mile,
    electric: FACTORS.car_electric_per_mile
  }[car_type];
  const car_em = car_miles_year * car_factor;
  const flights_em = flights_short * FACTORS.flight_short + flights_long * FACTORS.flight_long;

  // Food & goods
  const diet_em = ({omnivore:FACTORS.omnivore_diet,vegetarian:FACTORS.vegetarian_diet,vegan:FACTORS.vegan_diet})[diet];
  const goods_em = spending * FACTORS.spending_per_usd;

  // Recycling/waste per-person adjustment
  const recycle_adj = recycle === 'good' ? FACTORS.recycle_good_factor : (recycle === 'some' ? FACTORS.recycle_some_factor : 0);

  // Sum categories (total household then per-person)
  const household_total = ele_em + heat_em + car_em + flights_em + diet_em + goods_em + recycle_adj;
  const per_person = household_total / household;

  // Break down by category for display (rough mapping to the image categories)
  const breakdown = {
    'Home energy': ele_em + heat_em,
    'Transport': car_em + flights_em,
    'Food': diet_em,
    'Goods & services': goods_em,
    'Waste & recycling (adj)': recycle_adj
  };

  return {household_total,per_person,breakdown};
}

function formatT(t){return t.toFixed(2)+' tCO₂e'}

document.getElementById('calcBtn').addEventListener('click', ()=>{
  const out = calculate();
  const results = document.getElementById('results');
  results.innerHTML = '';

  const h = document.createElement('div');
  // Determine category and show SVG + short label
  const cat = categorize(out.per_person);
  const svgMap = {
    A: 'char_A_villain.svg',
    B: 'char_B_consumer.svg',
    C: 'char_C_friend.svg',
    D: 'char_D_hero.svg'
  };
  const svgFile = svgMap[cat.id] || svgMap.D;
  h.innerHTML = `<h3>Your estimated annual footprint</h3>
    <div class="breakdown"><div><strong>Per person:</strong> <span>${formatT(out.per_person)}</span></div>
      <div style="display:flex;align-items:center;gap:12px"><img class="category-svg" src="./${svgFile}" alt="${cat.label}" /><div class="category-label">${cat.label}</div></div>
    </div>
    <p class="breakdown small"><strong>Household total:</strong> <span>${formatT(out.household_total)}</span></p>`;
  results.appendChild(h);

  const br = document.createElement('div');
  br.innerHTML = '<h4>Category breakdown</h4>';
  Object.entries(out.breakdown).forEach(([k,v]) => {
    const row = document.createElement('div');
    row.className = 'breakdown';
    row.innerHTML = `<div>${k}</div><div>${(v>=0?formatT(v):v.toFixed(2)+' tCO₂e')}</div>`;
    br.appendChild(row);
  });
  results.appendChild(br);

  const note = document.createElement('p');
  note.className = 'small';
  note.textContent = 'Note: This is a simplified classroom estimate. See README for assumptions and sources.';
  results.appendChild(note);
  // Scroll results into view smoothly
  results.scrollIntoView({behavior:'smooth',block:'center'});
});

// Categorize based on per-person tCO2e/year
function categorize(per){
  // A: >10, B: 5-10, C: 2-5, D: <2
  if(per > 10) return {id:'A', label:'Climate Villain (>10t)'};
  if(per >=5) return {id:'B', label:'Climate Consumer (5-10t)'};
  if(per >=2) return {id:'C', label:'Climate Friend (2-5t)'};
  return {id:'D', label:'Climate Hero (<2t)'};
}

// Multi-step form behaviour
document.addEventListener('DOMContentLoaded', ()=>{
  const steps = Array.from(document.querySelectorAll('.step'));
  let idx = 0;
  const progress = document.querySelector('.progress');

  function show(i){
    steps.forEach((s,si)=> s.classList.toggle('active', si===i));
    idx = i;
    const pct = Math.round(((i+1)/steps.length)*100);
    progress.style.width = pct + '%';
  }

  show(0);

  document.querySelectorAll('.next').forEach(btn=>btn.addEventListener('click', ()=>{
    if(idx < steps.length-1) show(idx+1);
  }));
  document.querySelectorAll('.prev').forEach(btn=>btn.addEventListener('click', ()=>{
    if(idx > 0) show(idx-1);
  }));
});
