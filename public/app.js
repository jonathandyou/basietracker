const STORAGE_KEYS = {
  CATS: 'basietracker_cats',
  SIGHTINGS: 'basietracker_sightings',
  FEEDINGS: 'basietracker_feedings'
};

let currentView = 'dashboard';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initForms();
  initDataManagement();
  loadDashboard();
});

// Navigation
function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.view);
    });
  });
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('active', v.id === `${view}-view`);
  });
  
  if (view === 'dashboard') loadDashboard();
  else if (view === 'sightings') loadSightings();
  else if (view === 'feedings') loadFeedings();
  else if (view === 'cats') loadCats();
}

// Data Layer
function getData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function addCat(name) {
  const cats = getData(STORAGE_KEYS.CATS);
  const existing = cats.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (existing) throw new Error('Cat already exists');
  
  const cat = {
    id: generateId(),
    name,
    created_at: new Date().toISOString()
  };
  cats.push(cat);
  setData(STORAGE_KEYS.CATS, cats);
  return cat;
}

function addSighting(catName, notes, photoData) {
  const sightings = getData(STORAGE_KEYS.SIGHTINGS);
  
  // Calculate time since last sighting
  const catSightings = sightings
    .filter(s => s.cat_name === catName)
    .sort((a, b) => new Date(b.seen_at) - new Date(a.seen_at));
  
  let timeSinceLastSeen = null;
  if (catSightings.length > 0) {
    const lastTime = new Date(catSightings[0].seen_at);
    const now = new Date();
    const diffMs = now - lastTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      timeSinceLastSeen = `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours % 24} hour${diffHours % 24 !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      timeSinceLastSeen = `${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMins % 60} min`;
    } else {
      timeSinceLastSeen = `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    }
  }

  const sighting = {
    id: generateId(),
    cat_name: catName,
    seen_at: new Date().toISOString(),
    notes,
    photo_url: photoData || null,
    time_since_last_seen: timeSinceLastSeen
  };
  
  sightings.unshift(sighting);
  setData(STORAGE_KEYS.SIGHTINGS, sightings);
  return sighting;
}

function addFeeding(catName, foodType, amount, notes) {
  const feedings = getData(STORAGE_KEYS.FEEDINGS);
  
  const feeding = {
    id: generateId(),
    cat_name: catName,
    fed_at: new Date().toISOString(),
    food_type: foodType || null,
    amount: amount || null,
    notes: notes || null
  };
  
  feedings.unshift(feeding);
  setData(STORAGE_KEYS.FEEDINGS, feedings);
  return feeding;
}

function getStats() {
  const cats = getData(STORAGE_KEYS.CATS);
  const sightings = getData(STORAGE_KEYS.SIGHTINGS);
  const feedings = getData(STORAGE_KEYS.FEEDINGS);
  
  const sortedSightings = [...sightings].sort((a, b) => new Date(b.seen_at) - new Date(a.seen_at));
  const sortedFeedings = [...feedings].sort((a, b) => new Date(b.fed_at) - new Date(a.fed_at));
  
  return {
    totalCats: cats.length,
    totalSightings: sightings.length,
    totalFeedings: feedings.length,
    lastSighting: sortedSightings[0] || null,
    recentFeedings: sortedFeedings.slice(0, 5)
  };
}

// Forms
function initForms() {
  // Cat form
  document.getElementById('cat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cat-name').value.trim();
    if (!name) return;
    
    try {
      addCat(name);
      showToast('Cat added! 🐱', 'success');
      document.getElementById('cat-form').reset();
      loadCats();
      updateCatSelects();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Sighting form
  document.getElementById('sighting-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const addNewCat = document.getElementById('add-new-cat').checked;
    const newCatName = document.getElementById('new-cat-name').value.trim();
    let catName = document.getElementById('sighting-cat').value;
    
    if (addNewCat && newCatName) {
      try {
        addCat(newCatName);
        catName = newCatName;
        document.getElementById('new-cat-name').value = '';
        document.getElementById('add-new-cat').checked = false;
        document.getElementById('new-cat-name').style.display = 'none';
        updateCatSelects();
        loadCats();
      } catch (err) {
        showToast(err.message, 'error');
        return;
      }
    }
    
    if (!catName) {
      showToast('Please select or add a cat', 'error');
      return;
    }
    
    const notes = document.getElementById('sighting-notes').value.trim();
    const photoInput = document.getElementById('sighting-photo');
    let photoData = null;
    
    if (photoInput.files[0]) {
      photoData = await fileToBase64(photoInput.files[0]);
    }
    
    addSighting(catName, notes, photoData);
    showToast('Sighting recorded! 🐾', 'success');
    document.getElementById('sighting-form').reset();
    loadDashboard();
    loadSightings();
  });

  // Add new cat toggle
  document.getElementById('add-new-cat').addEventListener('change', (e) => {
    const select = document.getElementById('sighting-cat');
    const input = document.getElementById('new-cat-name');
    
    if (e.target.checked) {
      select.style.display = 'none';
      input.style.display = 'block';
      input.required = true;
    } else {
      select.style.display = 'block';
      input.style.display = 'none';
      input.required = false;
    }
  });

  // Feeding form
  document.getElementById('feeding-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const catName = document.getElementById('feeding-cat').value;
    const foodType = document.getElementById('food-type').value;
    const amount = document.getElementById('amount').value.trim();
    const notes = document.getElementById('feeding-notes').value.trim();
    
    if (!catName) {
      showToast('Please select a cat', 'error');
      return;
    }
    
    addFeeding(catName, foodType, amount, notes);
    showToast('Feeding recorded! 🍽️', 'success');
    document.getElementById('feeding-form').reset();
    loadDashboard();
    loadFeedings();
  });
}

// Data Management
function initDataManagement() {
  document.getElementById('export-data').addEventListener('click', () => {
    const data = {
      cats: getData(STORAGE_KEYS.CATS),
      sightings: getData(STORAGE_KEYS.SIGHTINGS),
      feedings: getData(STORAGE_KEYS.FEEDINGS),
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basietracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported!', 'success');
  });
  
  document.getElementById('import-data').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  
  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.cats) setData(STORAGE_KEYS.CATS, data.cats);
        if (data.sightings) setData(STORAGE_KEYS.SIGHTINGS, data.sightings);
        if (data.feedings) setData(STORAGE_KEYS.FEEDINGS, data.feedings);
        
        showToast('Data imported!', 'success');
        loadDashboard();
        updateCatSelects();
        loadCats();
      } catch (err) {
        showToast('Failed to import data', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
}

// Load functions
function loadDashboard() {
  const stats = getStats();
  
  document.getElementById('total-cats').textContent = stats.totalCats;
  document.getElementById('total-sightings').textContent = stats.totalSightings;
  document.getElementById('total-feedings').textContent = stats.totalFeedings;
  
  const lastSightingEl = document.getElementById('last-sighting');
  if (stats.lastSighting) {
    const s = stats.lastSighting;
    lastSightingEl.innerHTML = `
      <div class="item-card-header">
        <h3>${escapeHtml(s.cat_name)}</h3>
        <span class="time">${formatTimeAgo(new Date(s.seen_at))}</span>
      </div>
      ${s.time_since_last_seen ? `<p>Time since last seen: <span class="time-badge sighting">${escapeHtml(s.time_since_last_seen)}</span></p>` : ''}
      ${s.notes ? `<p>${escapeHtml(s.notes)}</p>` : ''}
      ${s.photo_url ? `<div class="item-card-photo"><img src="${s.photo_url}" alt="Cat photo"></div>` : ''}
    `;
    lastSightingEl.classList.remove('empty');
  } else {
    lastSightingEl.innerHTML = 'No sightings yet';
    lastSightingEl.classList.add('empty');
  }
  
  const recentFeedingsEl = document.getElementById('recent-feedings');
  if (stats.recentFeedings && stats.recentFeedings.length > 0) {
    recentFeedingsEl.innerHTML = stats.recentFeedings.map(f => `
      <div class="activity-item">
        <p><strong>${escapeHtml(f.cat_name)}</strong> - ${formatFoodType(f.food_type)}</p>
        <p>${escapeHtml(f.amount || '')} ${escapeHtml(f.notes || '')}</p>
        <p class="time">${formatTimeAgo(new Date(f.fed_at))}</p>
      </div>
    `).join('');
  } else {
    recentFeedingsEl.innerHTML = 'No feedings recorded yet';
  }
}

function loadSightings() {
  const sightings = getData(STORAGE_KEYS.SIGHTINGS);
  updateCatSelects();
  
  const listEl = document.getElementById('sightings-list');
  
  if (sightings.length === 0) {
    listEl.innerHTML = 'No sightings recorded yet';
    return;
  }
  
  listEl.innerHTML = sightings.map(s => `
    <div class="item-card">
      <div class="item-card-header">
        <h3>${escapeHtml(s.cat_name)}</h3>
        <span class="time">${formatDateTime(new Date(s.seen_at))}</span>
      </div>
      ${s.time_since_last_seen ? `<p><span class="time-badge sighting">Last seen: ${escapeHtml(s.time_since_last_seen)}</span></p>` : ''}
      ${s.notes ? `<p>${escapeHtml(s.notes)}</p>` : ''}
      ${s.photo_url ? `<div class="item-card-photo"><img src="${s.photo_url}" alt="Cat photo"></div>` : ''}
    </div>
  `).join('');
}

function loadFeedings() {
  const feedings = getData(STORAGE_KEYS.FEEDINGS);
  updateCatSelects();
  
  const listEl = document.getElementById('feedings-list');
  
  if (feedings.length === 0) {
    listEl.innerHTML = 'No feedings recorded yet';
    return;
  }
  
  listEl.innerHTML = feedings.map(f => `
    <div class="item-card">
      <div class="item-card-header">
        <h3>${escapeHtml(f.cat_name)}</h3>
        <span class="time">${formatDateTime(new Date(f.fed_at))}</span>
      </div>
      <div class="item-card-content">
        <p><span class="time-badge feeding">${formatFoodType(f.food_type)}</span> ${escapeHtml(f.amount || '')}</p>
        ${f.notes ? `<p>${escapeHtml(f.notes)}</p>` : ''}
      </div>
    </div>
  `).join('');
}

function loadCats() {
  const cats = getData(STORAGE_KEYS.CATS);
  
  const listEl = document.getElementById('cats-list');
  
  if (cats.length === 0) {
    listEl.innerHTML = 'No cats added yet';
    return;
  }
  
  listEl.innerHTML = cats.map(c => `
    <div class="cat-card">
      <div class="emoji">🐱</div>
      <h3>${escapeHtml(c.name)}</h3>
      <p class="join-date">Since ${formatDate(new Date(c.created_at))}</p>
    </div>
  `).join('');
}

function updateCatSelects() {
  const cats = getData(STORAGE_KEYS.CATS);
  
  ['sighting-cat', 'feeding-cat'].forEach(id => {
    const select = document.getElementById(id);
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select a cat...</option>';
    cats.forEach(cat => {
      select.innerHTML += `<option value="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</option>`;
    });
    if (currentValue) select.value = currentValue;
  });
}

// Utilities
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDateTime(date) {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
  return date.toLocaleDateString();
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 7) return formatDate(date);
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  return 'Just now';
}

function formatFoodType(type) {
  const types = {
    'dry': '🥫 Dry Food',
    'wet': '🥣 Wet Food',
    'treats': '🐟 Treats',
    'homemade': '🍲 Homemade',
    'other': '🍽️ Other'
  };
  return types[type] || '🍽️ Food';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Initial load
updateCatSelects();
