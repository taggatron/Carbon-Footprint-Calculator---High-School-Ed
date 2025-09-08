// Simplified emission factors (approximate, per-year or per-unit as commented)
const FACTORS = {
  // Increased values to raise classroom default footprints (~10 t/person for defaults)
  electricity_kwh: 0.0027727, // tCO2e per kWh (≈2.77 kg/kWh) - scaled from 0.000233
  heating_kwh: 0.0022015, // tCO2e per kWh for natural gas heating (≈2.20 kg/kWh) - scaled from 0.000185
  car_petrol_per_mile: 0.000271,
  car_diesel_per_mile: 0.000300,
  car_hybrid_per_mile: 0.000180,
  car_electric_per_mile: 0.000100,
  flight_short: 0.15,
  flight_long: 0.6,
  omnivore_diet: 2.5,
  vegetarian_diet: 1.7,
  vegan_diet: 1.2,
  // Spending factor now expressed per GBP (£)
  spending_per_gbp: 0.0005,
  // Recycling: we now model kWh saved per person per year (used to reduce household electricity)
  recycle_kwh_good: 800, // kWh saved per person/year for good recycling behaviour (classroom assumption)
  recycle_kwh_some: 300, // kWh saved per person/year for some recycling
  // Keep tCO2e adjustments small (set to zero to avoid double-counting energy savings)
  recycle_good_factor: 0,
  recycle_some_factor: 0,
  // Solar: medium system kWh generation per year (increased for classroom demonstration)
  solar_medium_kwh: 6000,

  // Screen-time -> electricity conversions (estimates)
  // TVs: assume average TV power draw ~80W while on; phones ~6W while charging/active; these are rough
  // Convert hours/day -> kWh/year: kW * hours/day * 365
  tv_watts: 80,
  phone_watts: 6
};

function getInput(id){return document.getElementById(id).value}

// Baseline electricity (user-provided baseline excluding screens). We store it in-memory.
let baselineElectricity = null;

function updateScreensAndElectricityUI(){
  const tv_hours = Number(getInput('tv_hours')) || 0;
  const phone_hours = Number(getInput('phone_hours')) || 0;
  const tv_kwh_year = (FACTORS.tv_watts/1000) * tv_hours * 365;
  const phone_kwh_year = (FACTORS.phone_watts/1000) * phone_hours * 365;
  const screens_kwh = +(tv_kwh_year + phone_kwh_year).toFixed(1);
  document.getElementById('screens-kwh').textContent = screens_kwh;

  const electricityInput = document.getElementById('electricity');
  const currentElectricity = Number(electricityInput.value) || 0;

  if(baselineElectricity === null){
    // first time: set baseline as current minus screens
    baselineElectricity = Math.max(0, currentElectricity - screens_kwh);
  }

  // If user manually edits electricity, update baseline accordingly
  // We'll detect manual edits by listening to 'input' event below; here we compute desired value
  const desired = Math.max(0, baselineElectricity + screens_kwh);
  // Only update the input if the user hasn't just typed (avoid stomping caret) — check difference
  if(Math.abs(currentElectricity - desired) > 0.5){
    electricityInput.value = Math.round(desired);
  }
}

// Listen for manual edits on electricity to update baseline
document.addEventListener('DOMContentLoaded', ()=>{
  const electricityInput = document.getElementById('electricity');
  const tv = document.getElementById('tv_hours');
  const phone = document.getElementById('phone_hours');
  const solarCheckbox = document.getElementById('solar_yes');
  const householdInput = document.getElementById('household');
  const heatingInput = document.getElementById('heating');

  // Recompute when screen inputs change
  [tv, phone].forEach(el=>el.addEventListener('input', ()=>{
    updateScreensAndElectricityUI();
  }));

  // Recompute when solar checkbox changes (updates any UI derived from electricity)
  if(solarCheckbox){
    solarCheckbox.addEventListener('change', ()=>{
      updateScreensAndElectricityUI();
    });
  }

  // When electricity is manually edited, set baseline = electricity - screens_kwh
  electricityInput.addEventListener('input', ()=>{
    const tv_hours = Number(getInput('tv_hours')) || 0;
    const phone_hours = Number(getInput('phone_hours')) || 0;
    const tv_kwh_year = (FACTORS.tv_watts/1000) * tv_hours * 365;
    const phone_kwh_year = (FACTORS.phone_watts/1000) * phone_hours * 365;
    const screens_kwh = +(tv_kwh_year + phone_kwh_year).toFixed(1);
    baselineElectricity = Math.max(0, (Number(electricityInput.value) || 0) - screens_kwh);
  });

  // Compute heating as 3,000 kWh per person and update readonly field when household changes
  function updateHeatingFromHousehold(){
    const people = Math.max(1, Number(householdInput.value) || 1);
    const heating_kwh = people * 3000;
    if(heatingInput){ heatingInput.value = heating_kwh; }
  }
  if(householdInput){
    householdInput.addEventListener('input', ()=>{
      updateHeatingFromHousehold();
    });
    // initialize heating value
    updateHeatingFromHousehold();
  }

  // Coerce pt_days to 0..5 interactively so users who type a number >5 are clamped
  const ptInput = document.getElementById('pt_days');
  if(ptInput){
    ptInput.addEventListener('input', ()=>{
      let v = Number(ptInput.value) || 0;
      if(v < 0) v = 0;
      if(v > 5) v = 5;
      if(Number(ptInput.value) !== v) ptInput.value = v;
    });
  }

  // initialize display immediately
  updateScreensAndElectricityUI();
});

function calculate() {
  const electricity = Number(getInput('electricity')) || 0;
  const heating = Number(getInput('heating')) || 0;
  const tv_hours = Number(getInput('tv_hours')) || 0;
  const phone_hours = Number(getInput('phone_hours')) || 0;
  const car_miles_week = Number(getInput('car_miles')) || 0;
  const pt_days = Math.max(0, Math.min(7, Number(getInput('pt_days')) || 0));
  // enforce max 5 days/week for public transport
  const clamped_pt_days = Math.min(5, Math.max(0, pt_days));
  if (clamped_pt_days !== pt_days) {
    // write back to input so the UI reflects the clamp
    document.getElementById('pt_days').value = clamped_pt_days;
  }
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

  // Apply solar offset: binary checkbox — if checked, assume Medium system ~2,500 kWh/year
  const solar_checked = document.getElementById('solar_yes') && document.getElementById('solar_yes').checked;

  // The 'electricity' input represents the user's measured/estimated household electricity (kWh/year).
  // First subtract recycling-related energy savings (modelled per person), then subtract solar generation.
  const recycle_kwh_per_person = recycle === 'good' ? FACTORS.recycle_kwh_good : (recycle === 'some' ? FACTORS.recycle_kwh_some : 0);
  const recycle_kwh_total = recycle_kwh_per_person * household;
  const total_electricity_kwh = Math.max(0, electricity - recycle_kwh_total);
  const solar_offset_kwh = solar_checked ? FACTORS.solar_medium_kwh : 0;
  const net_electricity_kwh = Math.max(0, total_electricity_kwh - solar_offset_kwh);

  const ele_em = net_electricity_kwh * FACTORS.electricity_kwh;
  const heat_em = heating * FACTORS.heating_kwh;

  // Transport
  // Assume each public-transport day replaces ~10 miles roundtrip by car
  const replaced_miles_week = clamped_pt_days * 10;
  const effective_car_miles_week = Math.max(0, car_miles_week - replaced_miles_week);
  const car_miles_year = effective_car_miles_week * 52;
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
  const goods_em = spending * FACTORS.spending_per_gbp;

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

  // Collapsible breakdown dropdown
  const ddWrap = document.createElement('div');
  ddWrap.className = 'breakdown-dropdown';
  const toggle = document.createElement('div');
  toggle.className = 'dropdown-toggle';
  toggle.innerHTML = `<h4>Category breakdown</h4><div class="small">Show details ▾</div>`;
  const content = document.createElement('div');
  content.className = 'dropdown-content';
  Object.entries(out.breakdown).forEach(([k,v]) => {
    const row = document.createElement('div');
    row.className = 'breakdown';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.padding = '6px 0';
    row.innerHTML = `<div>${k}</div><div>${(v>=0?formatT(v):v.toFixed(2)+' tCO₂e')}</div>`;
    content.appendChild(row);
  });
  toggle.addEventListener('click', ()=>{
    const shown = content.classList.toggle('show');
    toggle.querySelector('.small').textContent = shown ? 'Hide details ▴' : 'Show details ▾';
  });
  ddWrap.appendChild(toggle);
  ddWrap.appendChild(content);
  results.appendChild(ddWrap);

  // Trees needed to offset per-person emissions
  // Assume one mature tree offsets ~0.02 tCO2e per year (20 kg/year) for classroom simplicity
  const perPerson = out.per_person;
  const treeAbsorb = 0.02; // tCO2e per tree per year
  const treesNeeded = Math.max(0, Math.ceil(perPerson / treeAbsorb));
  const treesRow = document.createElement('div');
  treesRow.className = 'trees-row';
  // Cap visual icons to 10 and show multiplier if more
  const iconCap = 10;
  const iconsToShow = Math.min(iconCap, treesNeeded);
  for(let i=0;i<iconsToShow;i++){
    const img = document.createElement('img');
    img.src = './tree.svg';
    img.className = 'tree-icon';
    img.alt = 'tree';
    treesRow.appendChild(img);
  }
  const label = document.createElement('div');
  label.className = 'tree-count';
  label.textContent = treesNeeded <= iconCap ? `${treesNeeded} tree(s) to offset per person` : `${iconsToShow} icons × ${Math.ceil(treesNeeded/iconsToShow)} = ${treesNeeded} trees to offset per person`;
  treesRow.appendChild(label);
  results.appendChild(treesRow);

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
