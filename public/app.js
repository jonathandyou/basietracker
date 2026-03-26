const API_BASE = '';
let currentView = 'dashboard';

// DOM Elements
const views = document.querySelectorAll('.view');
const navBtns = document.querySelectorAll('.nav-btn');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initForms();
  loadDashboard();
});

// Navigation
function initNavigation() {
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });
}

function switchView(view) {
  currentView = view;
  
  navBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  
  views.forEach(v => {
    v.classList.toggle('active', v.id === `${view}-view`);
  });
  
  if (view === 'dashboard') loadDashboard();
  else if (view === 'sightings') loadSightings();
  else if (view === 'feedings') loadFeedings();
  else if (view === 'cats') loadCats();
}

// Forms
function initForms() {
  // Cat form
  document.getElementById('cat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cat-name').value;
    
    try {
      const res = await fetch(`${API_BASE}/api/cats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      
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
    const newCatName = document.getElementById('new-cat-name').value;
    let catName = document.getElementById('sighting-cat').value;
    
    if (addNewCat && newCatName) {
      try {
        const res = await fetch(`${API_BASE}/api/cats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCatName })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
        catName = newCatName;
        document.getElementById('new-cat-name').value = '';
        document.getElementById('add-new-cat').checked = false;
        document.getElementById('new-cat-name').style.display = 'none';
        updateCatSelects();
      } catch (err) {
        showToast(err.message, 'error');
        return;
      }
    }
    
    if (!catName) {
      showToast('Please select or add a cat', 'error');
      return;
    }
    
    const formData = new FormData();
    formData.append('cat_name', catName);
    formData.append('notes', document.getElementById('sighting-notes').value);
    
    const photo = document.getElementById('sighting-photo').files[0];
    if (photo) {
      formData.append('photo', photo);
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/sightings`, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Failed to record sighting');
      
      showToast('Sighting recorded! 🐾', 'success');
      document.getElementById('sighting-form').reset();
      loadDashboard();
      loadSightings();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Add new cat toggle for sighting
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
  document.getElementById('feeding-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
      cat_name: document.getElementById('feeding-cat').value,
      food_type: document.getElementById('food-type').value,
      amount: document.getElementById('amount').value,
      notes: document.getElementById('feeding-notes').value
    };
    
    if (!data.cat_name) {
      showToast('Please select a cat', 'error');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/feedings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error('Failed to record feeding');
      
      showToast('Feeding recorded! 🍽️', 'success');
      document.getElementById('feeding-form').reset();
      loadDashboard();
      loadFeedings();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// Load functions
async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE}/api/stats`);
    const stats = await res.json();
    
    document.getElementById('total-cats').textContent = stats.totalCats;
    document.getElementById('total-sightings').textContent = stats.totalSightings;
    document.getElementById('total-feedings').textContent = stats.totalFeedings;
    
    // Last sighting
    const lastSightingEl = document.getElementById('last-sighting');
    if (stats.lastSighting) {
      const s = stats.lastSighting;
      const timeAgo = formatTimeAgo(new Date(s.seen_at));
      lastSightingEl.innerHTML = `
        <div class="item-card-header">
          <h3>${s.cat_name}</h3>
          <span class="time">${timeAgo}</span>
        </div>
        ${s.time_since_last_seen ? `<p>Time since last seen: <span class="time-badge sighting">${s.time_since_last_seen}</span></p>` : ''}
        ${s.notes ? `<p>${s.notes}</p>` : ''}
      `;
      lastSightingEl.classList.remove('empty');
    } else {
      lastSightingEl.innerHTML = 'No sightings yet';
      lastSightingEl.classList.add('empty');
    }
    
    // Recent feedings
    const recentFeedingsEl = document.getElementById('recent-feedings');
    if (stats.recentFeedings && stats.recentFeedings.length > 0) {
      recentFeedingsEl.innerHTML = stats.recentFeedings.map(f => `
        <div class="activity-item">
          <p><strong>${f.cat_name}</strong> - ${formatFoodType(f.food_type)}</p>
          <p>${f.amount || ''} ${f.notes || ''}</p>
          <p class="time">${formatTimeAgo(new Date(f.fed_at))}</p>
        </div>
      `).join('');
    } else {
      recentFeedingsEl.innerHTML = 'No feedings recorded yet';
    }
  } catch (err) {
    showToast('Failed to load dashboard', 'error');
  }
}

async function loadSightings() {
  try {
    const res = await fetch(`${API_BASE}/api/sightings`);
    const sightings = await res.json();
    
    updateCatSelects();
    
    const listEl = document.getElementById('sightings-list');
    
    if (sightings.length === 0) {
      listEl.innerHTML = 'No sightings recorded yet';
      return;
    }
    
    listEl.innerHTML = sightings.map(s => `
      <div class="item-card">
        <div class="item-card-header">
          <h3>${s.cat_name}</h3>
          <span class="time">${formatDateTime(new Date(s.seen_at))}</span>
        </div>
        ${s.time_since_last_seen ? `<p><span class="time-badge sighting">Last seen: ${s.time_since_last_seen}</span></p>` : ''}
        ${s.notes ? `<p>${s.notes}</p>` : ''}
        ${s.photo_url ? `
          <div class="item-card-photo">
            <img src="${API_BASE}${s.photo_url}" alt="Cat photo">
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (err) {
    showToast('Failed to load sightings', 'error');
  }
}

async function loadFeedings() {
  try {
    const res = await fetch(`${API_BASE}/api/feedings`);
    const feedings = await res.json();
    
    updateCatSelects();
    
    const listEl = document.getElementById('feedings-list');
    
    if (feedings.length === 0) {
      listEl.innerHTML = 'No feedings recorded yet';
      return;
    }
    
    listEl.innerHTML = feedings.map(f => `
      <div class="item-card">
        <div class="item-card-header">
          <h3>${f.cat_name}</h3>
          <span class="time">${formatDateTime(new Date(f.fed_at))}</span>
        </div>
        <div class="item-card-content">
          <p><span class="time-badge feeding">${formatFoodType(f.food_type)}</span> ${f.amount || ''}</p>
          ${f.notes ? `<p>${f.notes}</p>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    showToast('Failed to load feedings', 'error');
  }
}

async function loadCats() {
  try {
    const res = await fetch(`${API_BASE}/api/cats`);
    const cats = await res.json();
    
    const listEl = document.getElementById('cats-list');
    
    if (cats.length === 0) {
      listEl.innerHTML = 'No cats added yet';
      return;
    }
    
    listEl.innerHTML = cats.map(c => `
      <div class="cat-card">
        <div class="emoji">🐱</div>
        <h3>${c.name}</h3>
        <p class="join-date">Since ${formatDate(new Date(c.created_at))}</p>
      </div>
    `).join('');
  } catch (err) {
    showToast('Failed to load cats', 'error');
  }
}

async function updateCatSelects() {
  try {
    const res = await fetch(`${API_BASE}/api/cats`);
    const cats = await res.json();
    
    const selects = ['sighting-cat', 'feeding-cat'];
    selects.forEach(id => {
      const select = document.getElementById(id);
      const currentValue = select.value;
      select.innerHTML = '<option value="">Select a cat...</option>';
      cats.forEach(cat => {
        select.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
      });
      if (currentValue) select.value = currentValue;
    });
  } catch (err) {
    console.error('Failed to update cat selects');
  }
}

// Utility functions
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

function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Initial load
updateCatSelects();
