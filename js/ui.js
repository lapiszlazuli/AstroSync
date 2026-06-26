'use strict';
// ═══════════════════════════════════════════════════════════════
// ASTROSYNC — UI Logic
// Paneles, modal, búsqueda, reloj, geolocalización
// ═══════════════════════════════════════════════════════════════

const AstroUI = (function () {

  let activePanel = null;
  let clockInterval = null;
  let mockUser = null;
  let positionUpdateInterval = null;

  // Datos mock para observaciones (app Android)
  const MOCK_OBSERVATIONS = [
    { object: 'Nebulosa de Orión (M42)', date: '2026-05-27', time: '23:14', type: 'Nebulosa', mag: 4.0, notes: 'Vista con binoculares 10x50. Detalle del Trapecio.' },
    { object: 'Júpiter',                 date: '2026-05-25', time: '22:30', type: 'Planeta',  mag: -2.1,notes: 'Bandas nubosas y cuatro lunas galileanas visibles.' },
    { object: 'Pléyades (M45)',          date: '2026-05-22', time: '21:45', type: 'Cúmulo',   mag: 1.6, notes: 'Cúmulo espectacular. 7 estrellas a simple vista.' },
    { object: 'Sirius',                  date: '2026-05-20', time: '20:55', type: 'Estrella', mag: -1.46,notes: 'Centelleo intenso en el horizonte. Colores.' },
    { object: 'Galaxia Andrómeda (M31)', date: '2026-05-18', time: '00:10', type: 'Galaxia',  mag: 3.4, notes: 'Mancha ovalada difusa. Poca contaminación lumínica.' },
    { object: 'Saturno',                 date: '2026-05-15', time: '23:00', type: 'Planeta',  mag: 0.7, notes: 'Anillos perfectamente visibles. Titán identificado.' },
    { object: 'Cúmulo de Hércules (M13)',date: '2026-05-10', time: '01:20', type: 'Cúmulo',   mag: 5.8, notes: 'Globular resuelto en bordes con telescopio.' },
    { object: 'Marte',                   date: '2026-05-08', time: '22:15', type: 'Planeta',  mag: 1.2, notes: 'Casquete polar norte visible. Color rojizo intenso.' },
  ];

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────
  function init() {
    setupNavigation();
    setupDateControl();
    setupModal();
    startClock();
    detectLocation();
    setTimeout(() => {
      updatePlanetList();
      updateSkyStats();
    }, 1200);
    // Auto-update sky position every 2 minutes (Earth rotation)
    setInterval(() => {
      AstroMap.setDate(new Date());
      updatePlanetList();
      updateSkyStats();
    }, 120000);
  }

  // ─────────────────────────────────────────────
  // NAVIGATION & PANELS
  // ─────────────────────────────────────────────
  function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.dataset.panel;
        if (!panel) return; // Ignorar botones sin data-panel (ej. Sync Android)
        if (activePanel === panel) {
          closePanel();
        } else {
          openPanel(panel);
        }
      });
    });

    document.getElementById('panel-close').addEventListener('click', closePanel);
  }

  function openPanel(name) {
    activePanel = name;
    const panel = document.getElementById('side-panel');
    const title = document.getElementById('panel-title');
    const content = document.getElementById('panel-content');

    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.panel === name);
    });

    title.textContent = {
      sky:          'CIELO',
      catalog:      'CATÁLOGO',
      observations: 'OBSERVACIONES',
      dashboard:    'DASHBOARD'
    }[name] || name.toUpperCase();

    content.innerHTML = '';
    switch (name) {
      case 'sky':          renderSkyPanel(content); break;
      case 'catalog':      renderCatalogPanel(content); break;
      case 'observations': renderObservationsPanel(content); break;
      case 'dashboard':    renderDashboardPanel(content); break;
    }

    panel.classList.add('open');
  }

  function closePanel() {
    activePanel = null;
    document.getElementById('side-panel').classList.remove('open');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  }

  // ─────────────────────────────────────────────
  // PANEL — CIELO
  // ─────────────────────────────────────────────
  function renderSkyPanel(container) {
    container.innerHTML = `
      <div class="section-divider">CAPAS DE VISUALIZACIÓN</div>
      <div class="filter-group">
        <div class="filter-row">
          <span class="filter-name">Estrellas</span>
          <label class="toggle">
            <input type="checkbox" id="tog-stars" checked>
            <div class="toggle-track"></div><div class="toggle-thumb"></div>
          </label>
        </div>
        <div class="filter-row">
          <span class="filter-name">Planetas</span>
          <label class="toggle">
            <input type="checkbox" id="tog-planets" checked>
            <div class="toggle-track"></div><div class="toggle-thumb"></div>
          </label>
        </div>
        <div class="filter-row">
          <span class="filter-name">Constelaciones</span>
          <label class="toggle">
            <input type="checkbox" id="tog-constellations" checked>
            <div class="toggle-track"></div><div class="toggle-thumb"></div>
          </label>
        </div>
        <div class="filter-row">
          <span class="filter-name">Objetos Messier</span>
          <label class="toggle">
            <input type="checkbox" id="tog-messier" checked>
            <div class="toggle-track"></div><div class="toggle-thumb"></div>
          </label>
        </div>
        <div class="filter-row">
          <span class="filter-name">Anillo de horizonte</span>
          <label class="toggle">
            <input type="checkbox" id="tog-horizon" checked>
            <div class="toggle-track"></div><div class="toggle-thumb"></div>
          </label>
        </div>
      </div>

      <div class="section-divider">NAVEGACIÓN</div>
      <div class="info-value" style="margin-bottom:12px;font-size:10px;line-height:1.7;color:var(--text-secondary)">
        Arrastra para rotar la vista<br>
        Rueda del ratón para zoom<br>
        Clic en objeto para información
      </div>

      <div class="section-divider">APUNTAR A</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <button class="panel-btn" id="btn-look-zenith">CÉNIT (arriba)</button>
        <button class="panel-btn" id="btn-look-north">NORTE</button>
        <button class="panel-btn" id="btn-look-south">SUR</button>
        <button class="panel-btn" id="btn-look-east">ESTE</button>
        <button class="panel-btn" id="btn-look-west">OESTE</button>
      </div>
    `;

    // Filter toggles (visual only for now — could control layer visibility)
    ['stars','planets','constellations','messier','horizon'].forEach(id => {
      document.getElementById(`tog-${id}`).addEventListener('change', function() {
        // Future: AstroMap.setLayerVisible(id, this.checked)
      });
    });

    // Look-at buttons
    document.getElementById('btn-look-zenith').addEventListener('click', () => {
      AstroMap.lookAzAlt(0, 88);
    });
    document.getElementById('btn-look-north').addEventListener('click',  () => AstroMap.lookAzAlt(0,   25));
    document.getElementById('btn-look-south').addEventListener('click',  () => AstroMap.lookAzAlt(180, 25));
    document.getElementById('btn-look-east').addEventListener('click',   () => AstroMap.lookAzAlt(90,  25));
    document.getElementById('btn-look-west').addEventListener('click',   () => AstroMap.lookAzAlt(270, 25));
  }

  // ─────────────────────────────────────────────
  // PANEL — CATÁLOGO
  // ─────────────────────────────────────────────
  function renderCatalogPanel(container) {
    container.innerHTML = `
      <div class="section-divider">BUSCAR OBJETO CELESTE</div>
      <div class="panel-search">
        <input type="text" id="catalog-search-input" placeholder="Sirius, M42, Júpiter...">
        <button id="catalog-search-btn">BUSCAR</button>
      </div>
      <div id="catalog-results"></div>
      <div class="section-divider">CATEGORÍAS</div>
      <div style="display:flex;flex-direction:column;gap:4px;">
        <button class="panel-btn" id="cat-stars-btn">ESTRELLAS BRILLANTES (95)</button>
        <button class="panel-btn" id="cat-planets-btn">PLANETAS DEL SISTEMA SOLAR (7)</button>
        <button class="panel-btn" id="cat-messier-btn">OBJETOS MESSIER (15)</button>
      </div>
    `;

    const input = document.getElementById('catalog-search-input');
    const resultsDiv = document.getElementById('catalog-results');

    function performSearch(query) {
      if (!query || query.length < 2) { resultsDiv.innerHTML = ''; return; }
      const q = query.toLowerCase().trim();
      const results = [];
      const loc = AstroMap.getLocation();
      const lst = AstroCalc.computeLST(AstroMap.getDate(), loc.lon);

      // ── Sol ── siempre aparece si coincide, nunca bloqueado por API
      const solTerms = ['sol', 'sun', 'solar'];
      if (solTerms.some(t => t.includes(q) || q.includes(t))) {
        const sunEq = AstroCalc.getSunEquatorial(AstroMap.getDate());
        const altAz = sunEq ? AstroCalc.equatorialToHorizontal(sunEq.ra, sunEq.dec, lst, loc.lat) : null;
        results.push({
          data: {
            name: 'Sol', con: 'Sistema Solar', mag: -26.74,
            ra:  sunEq ? sunEq.ra  : 6,
            dec: sunEq ? sunEq.dec : 23,
            alt: altAz ? +altAz.alt.toFixed(1) : null,
            desc: 'Nuestra estrella. Clase espectral G2V. Dista 1 UA (149.6 millones de km).'
          }, type: 'SOL'
        });
      }

      // ── Luna ── siempre aparece si coincide
      const lunaTerms = ['luna', 'moon', 'lunar'];
      if (lunaTerms.some(t => t.includes(q) || q.includes(t))) {
        const moonEq = AstroCalc.getMoonEquatorial(AstroMap.getDate());
        const altAz  = moonEq ? AstroCalc.equatorialToHorizontal(moonEq.ra, moonEq.dec, lst, loc.lat) : null;
        const phase  = moonEq ? AstroCalc.getMoonPhaseName(moonEq.illumination) : '';
        results.push({
          data: {
            name: 'Luna', con: 'Sistema Solar', mag: -12.6,
            ra:  moonEq ? moonEq.ra  : 12,
            dec: moonEq ? moonEq.dec : 0,
            alt: altAz ? +altAz.alt.toFixed(1) : null,
            desc: 'Satelite natural de la Tierra. ' + phase + (moonEq ? ` (${Math.round(moonEq.illumination*100)}% iluminada).` : '.')
          }, type: 'LUNA'
        });
      }

      // ── Estrellas ──
      CATALOG.stars.filter(s =>
        s.name.toLowerCase().includes(q) || (s.con && s.con.toLowerCase().includes(q))
      ).slice(0,8).forEach(s => results.push({ data: s, type:'ESTRELLA' }));

      // ── Planetas ── incluye RA/Dec calculada en tiempo real
      CATALOG.planets.filter(p =>
        p.name.toLowerCase().includes(q)
      ).forEach(p => {
        const date   = AstroMap.getDate();
        const eq     = AstroCalc.getPlanetEquatorial(p.body, date);
        const altAz  = eq ? AstroCalc.equatorialToHorizontal(eq.ra, eq.dec, lst, loc.lat) : null;
        results.push({
          data: {
            ...p,
            ra:  eq ? eq.ra  : null,
            dec: eq ? eq.dec : null,
            alt: altAz ? +altAz.alt.toFixed(1) : null,
            az:  altAz ? +altAz.az.toFixed(1)  : null,
            mag: eq  ? eq.mag : null,
            con: 'Sistema Solar',
          },
          type: 'PLANETA'
        });
      });

      // ── Messier ── SOLO nombre y constelacion (no descripcion)
      // Evita que M57 aparezca al buscar "sol" (su desc dice "...como el Sol...")
      CATALOG.messier.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.con && m.con.toLowerCase().includes(q))
      ).slice(0,5).forEach(m => results.push({ data: m, type: m.type.toUpperCase() }));

      if (results.length === 0) {
        resultsDiv.innerHTML = '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);padding:12px 0;">Sin resultados.</div>';
        return;
      }

      resultsDiv.innerHTML = results.map((r, i) => {
        const d = r.data;
        const altBadge = d.alt != null
          ? `<span style="font-family:var(--font-mono);font-size:9px;color:${d.alt > 0 ? 'var(--success)' : 'var(--text-muted)'};">${d.alt > 0 ? '+' : ''}${d.alt}°</span>`
          : `<span class="result-mag">${d.mag != null ? 'mag ' + Number(d.mag).toFixed(1) : ''}</span>`;
        return `
          <div class="search-result-item" data-idx="${i}">
            <span class="result-type-badge">${r.type}</span>
            <span class="result-name">${d.name}</span>
            <span class="result-constellation">${d.con || ''}</span>
            ${altBadge}
          </div>`;
      }).join('');

      resultsDiv.querySelectorAll('.search-result-item').forEach((el, i) => {
        el.addEventListener('click', () => {
          const r = results[i];
          const ra  = r.data.ra  !== undefined ? r.data.ra  : null;
          const dec = r.data.dec !== undefined ? r.data.dec : null;
          if (ra !== null && dec !== null) AstroMap.lookAt(ra, dec);
          closePanel();
          showObjectPanel({ data: r.data, type: r.type.toLowerCase() });
        });
      });
    }

    input.addEventListener('input', () => performSearch(input.value));
    document.getElementById('catalog-search-btn').addEventListener('click', () => performSearch(input.value));

    document.getElementById('cat-stars-btn').addEventListener('click', () => {
      input.value = ''; resultsDiv.innerHTML = '';
      const results = CATALOG.stars.slice().sort((a,b)=>a.mag-b.mag);
      resultsDiv.innerHTML = results.map((s, i) => `
        <div class="search-result-item" data-idx="${i}">
          <span class="result-type-badge">ESTRELLA</span>
          <span class="result-name">${s.name}</span>
          <span class="result-constellation">${s.con}</span>
          <span class="result-mag">mag ${s.mag.toFixed(2)}</span>
        </div>
      `).join('');
      resultsDiv.querySelectorAll('.search-result-item').forEach((el, i) => {
        el.addEventListener('click', () => {
          AstroMap.lookAt(results[i].ra, results[i].dec);
          closePanel();
          showObjectPanel({ data: results[i], type:'star' });
        });
      });
    });

    document.getElementById('cat-planets-btn').addEventListener('click', () => {
      input.value = ''; resultsDiv.innerHTML = '';
      const date   = AstroMap.getDate();
      const loc    = AstroMap.getLocation();
      const lst    = AstroCalc.computeLST(date, loc.lon);
      const sunEq  = AstroCalc.getSunEquatorial(date);
      const moonEq = AstroCalc.getMoonEquatorial(date);
      const sunAlt  = sunEq  ? AstroCalc.equatorialToHorizontal(sunEq.ra,  sunEq.dec,  lst, loc.lat).alt : null;
      const moonAlt = moonEq ? AstroCalc.equatorialToHorizontal(moonEq.ra, moonEq.dec, lst, loc.lat).alt : null;
      const phase  = moonEq ? AstroCalc.getMoonPhaseName(moonEq.illumination) : '';

      const solares = [
        { name:'Sol',  colorHex:'#FFE066', eq: sunEq,  alt: sunAlt,  desc:'Nuestra estrella. Clase G2V.',  type:'sol' },
        { name:'Luna', colorHex:'#CCCCBB', eq: moonEq, alt: moonAlt, desc:'Satelite natural. ' + phase,    type:'luna' }
      ];

      const solarRows = solares.map((s, i) => {
        const altStr = s.alt != null ? `${s.alt > 0 ? '+' : ''}${s.alt.toFixed(1)}°` : '—';
        const altColor = s.alt != null && s.alt > 0 ? 'var(--success)' : 'var(--text-muted)';
        return `
          <div class="search-result-item" data-idx="${i}" data-src="solar">
            <span class="result-type-badge">${s.name === 'Sol' ? 'ESTRELLA' : 'SATÉLITE'}</span>
            <span class="result-name">${s.name}</span>
            <span class="result-constellation" style="color:${s.colorHex}">&#11044;</span>
            <span style="font-family:var(--font-mono);font-size:9px;color:${altColor};">${altStr}</span>
          </div>`;
      }).join('');

      const planetsRows = CATALOG.planets.map((p, i) => `
        <div class="search-result-item" data-idx="${i}" data-src="planet">
          <span class="result-type-badge">PLANETA</span>
          <span class="result-name">${p.name}</span>
          <span class="result-constellation" style="color:${p.colorHex}">&#11044;</span>
          <span class="result-mag">${p.desc.split('.')[0]}</span>
        </div>
      `).join('');
      resultsDiv.innerHTML = solarRows + planetsRows;

      resultsDiv.querySelectorAll('.search-result-item[data-src="solar"]').forEach((el, i) => {
        el.addEventListener('click', () => {
          const s = solares[i];
          if (s.eq) AstroMap.lookAt(s.eq.ra, s.eq.dec);
          closePanel();
          showObjectPanel({ data: { name: s.name, con:'Sistema Solar', mag: s.eq ? s.eq.mag : null, ra: s.eq.ra, dec: s.eq.dec, desc: s.desc }, type: s.type });
        });
      });
      resultsDiv.querySelectorAll('.search-result-item[data-src="planet"]').forEach((el, i) => {
        el.addEventListener('click', () => {
          const eq = AstroCalc.getPlanetEquatorial(CATALOG.planets[i].body, AstroMap.getDate());
          if (eq) AstroMap.lookAt(eq.ra, eq.dec);
          closePanel();
          showObjectPanel({ data: { ...CATALOG.planets[i], ra: eq ? eq.ra : null, dec: eq ? eq.dec : null }, type:'planet' });
        });
      });
    });

    document.getElementById('cat-messier-btn').addEventListener('click', () => {
      input.value = ''; resultsDiv.innerHTML = '';
      resultsDiv.innerHTML = CATALOG.messier.map((m, i) => `
        <div class="search-result-item" data-idx="${i}">
          <span class="result-type-badge">${m.type.split(' ')[0].toUpperCase()}</span>
          <span class="result-name">${m.name}</span>
          <span class="result-constellation">${m.con}</span>
          <span class="result-mag">mag ${m.mag}</span>
        </div>
      `).join('');
      resultsDiv.querySelectorAll('.search-result-item').forEach((el, i) => {
        el.addEventListener('click', () => {
          AstroMap.lookAt(CATALOG.messier[i].ra, CATALOG.messier[i].dec);
          closePanel();
          showObjectPanel({ data: CATALOG.messier[i], type: 'messier' });
        });
      });
    });
  }

  // ─────────────────────────────────────────────
  // PANEL — OBSERVACIONES
  // ─────────────────────────────────────────────
  function renderObservationsPanel(container) {
    if (!mockUser) {
      container.innerHTML = `
        <div style="text-align:center;padding:30px 0;">
          <div class="section-divider">ACCESO REQUERIDO</div>
          <p class="modal-info-text" style="margin-bottom:20px;margin-top:12px;">
            Inicia sesión para ver tus observaciones sincronizadas desde la app AstroSync para Android.
          </p>
          <button class="btn-primary" id="obs-login-btn" style="width:auto;padding:10px 30px;">ACCEDER</button>
        </div>
      `;
      document.getElementById('obs-login-btn').addEventListener('click', () => {
        openModal();
      });
      return;
    }

    container.innerHTML = `
      <div class="section-divider">MIS OBSERVACIONES — ${MOCK_OBSERVATIONS.length} REGISTROS</div>
      <div style="margin-bottom:12px;display:flex;gap:8px;">
        <button class="panel-btn">EXPORTAR CSV</button>
        <button class="panel-btn primary">SINCRONIZAR</button>
      </div>
      ${MOCK_OBSERVATIONS.map(obs => `
        <div class="obs-item">
          <div class="obs-header">
            <span class="obs-name">${obs.object}</span>
            <span class="obs-date">${obs.date} ${obs.time}</span>
          </div>
          <div class="obs-detail">${obs.type} — Magnitud ${obs.mag} — ${obs.notes}</div>
        </div>
      `).join('')}
    `;
  }

  // ─────────────────────────────────────────────
  // PANEL — DASHBOARD
  // ─────────────────────────────────────────────
  function renderDashboardPanel(container) {
    const planetsTonight = AstroMap.getPlanetVisibility().filter(p => p.alt > 10).length;

    container.innerHTML = `
      <div class="section-divider">ESTADÍSTICAS</div>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-num">${mockUser ? MOCK_OBSERVATIONS.length : '—'}</div>
          <div class="stat-desc">OBSERVACIONES</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${mockUser ? '8' : '—'}</div>
          <div class="stat-desc">SESIONES</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${planetsTonight}</div>
          <div class="stat-desc">PLANETAS VISIBLES</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${CATALOG.stars.length}</div>
          <div class="stat-desc">ESTRELLAS EN CATÁLOGO</div>
        </div>
      </div>

      <div class="section-divider">PLANETAS HOY</div>
      ${AstroMap.getPlanetVisibility().map(p => `
        <div class="planet-row">
          <div class="planet-dot" style="background:${p.colorHex}"></div>
          <span class="planet-name">${p.name}</span>
          <span class="planet-alt ${p.alt > 10 ? 'visible' : ''}">
            ${p.alt != null ? (p.alt > 0 ? `+${p.alt}°` : `${p.alt}°`) : '—'}
          </span>
        </div>
      `).join('')}

      <div class="section-divider" style="margin-top:16px;">CONECTAR CON LA APP</div>
      <p class="modal-info-text" style="margin-bottom:14px;margin-top:8px;text-align:left;">
        Descarga AstroSync para Android y sincroniza tus observaciones directamente con esta plataforma.
      </p>
      <button class="panel-btn primary">SINCRONIZAR CUENTA</button>
      <button class="panel-btn" style="margin-top:6px;">VER API DOCUMENTACIÓN</button>
    `;
  }

  // ─────────────────────────────────────────────
  // DATE CONTROL
  // ─────────────────────────────────────────────
  function setupDateControl() {
    updateDateDisplay();

    document.getElementById('btn-prev-day').addEventListener('click', () => {
      const d = AstroMap.getDate();
      d.setDate(d.getDate() - 1);
      AstroMap.setDate(d);
      updateDateDisplay();
      updatePlanetList();
      updateSkyStats();
    });

    document.getElementById('btn-next-day').addEventListener('click', () => {
      const d = AstroMap.getDate();
      d.setDate(d.getDate() + 1);
      AstroMap.setDate(d);
      updateDateDisplay();
      updatePlanetList();
      updateSkyStats();
    });

    document.getElementById('btn-now').addEventListener('click', () => {
      AstroMap.setDate(new Date());
      updateDateDisplay();
      updatePlanetList();
      updateSkyStats();
    });

    document.getElementById('date-display').addEventListener('click', () => {
      document.getElementById('date-picker-wrap').classList.toggle('open');
    });

    document.getElementById('date-picker-input').addEventListener('change', function () {
      const d = new Date(this.value);
      if (!isNaN(d)) {
        AstroMap.setDate(d);
        updateDateDisplay();
        updatePlanetList();
        updateSkyStats();
      }
      document.getElementById('date-picker-wrap').classList.remove('open');
    });

    // Close picker on outside click
    document.addEventListener('click', e => {
      const wrap = document.getElementById('date-picker-wrap');
      const display = document.getElementById('date-display');
      if (!wrap.contains(e.target) && !display.contains(e.target)) {
        wrap.classList.remove('open');
      }
    });
  }

  function updateDateDisplay() {
    const d = AstroMap.getDate();
    const dateStr = d.toISOString().split('T')[0].replace(/-/g, '.');
    document.getElementById('date-label').textContent = dateStr;
    // Set picker value
    const pickerInput = document.getElementById('date-picker-input');
    if (pickerInput) pickerInput.value = d.toISOString().split('T')[0];
  }

  // ─────────────────────────────────────────────
  // CLOCK
  // ─────────────────────────────────────────────
  function startClock() {
    function tick() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2,'0');
      const mm = String(now.getMinutes()).padStart(2,'0');
      const ss = String(now.getSeconds()).padStart(2,'0');
      const el = document.getElementById('current-time-display');
      if (el) el.textContent = `${hh}:${mm}:${ss}`;
      const el2 = document.getElementById('time-label');
      if (el2) el2.textContent = `${hh}:${mm}:${ss}`;

      const dateEl = document.getElementById('current-date-display');
      if (dateEl) {
        const opts = { weekday:'short', year:'numeric', month:'short', day:'numeric' };
        dateEl.textContent = now.toLocaleDateString('es-ES', opts).toUpperCase();
      }
    }
    tick();
    clockInterval = setInterval(tick, 1000);
  }

  // ─────────────────────────────────────────────
  // GEOLOCATION
  // ─────────────────────────────────────────────
  function detectLocation() {
    const locEl = document.getElementById('current-location');
    const navLocEl = document.getElementById('location-display');

    if (!navigator.geolocation) {
      if (locEl) locEl.textContent = 'Sin geolocalización';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        AstroMap.setLocation(lat, lon);

        const latStr = `${Math.abs(lat).toFixed(2)}° ${lat>=0?'N':'S'}`;
        const lonStr = `${Math.abs(lon).toFixed(2)}° ${lon>=0?'E':'O'}`;
        if (locEl) {
          locEl.innerHTML = `<div>${latStr}</div><div>${lonStr}</div>`;
        }
        if (navLocEl) navLocEl.textContent = `${latStr}  ${lonStr}`;

        updatePlanetList();
        updateSkyStats();
      },
      () => {
        if (locEl) locEl.textContent = 'Madrid (por defecto)';
        if (navLocEl) navLocEl.textContent = '40.42° N  3.70° O';
      },
      { timeout: 6000, maximumAge: 300000 }
    );
  }

  // ─────────────────────────────────────────────
  // PLANET LIST (left panel)
  // ─────────────────────────────────────────────
  function updatePlanetList() {
    const container = document.getElementById('visible-planets');
    if (!container) return;

    const date    = AstroMap.getDate();
    const loc     = AstroMap.getLocation();
    const lst     = AstroCalc.computeLST(date, loc.lon);
    const planets = AstroMap.getPlanetVisibility();
    const sunMoon = AstroMap.getSunMoonVisibility ? AstroMap.getSunMoonVisibility() : [];
    const all     = [...sunMoon, ...planets];

    // Cache equatorials for navigation
    const _sunEq  = AstroCalc.getSunEquatorial(date);
    const _moonEq = AstroCalc.getMoonEquatorial(date);

    // Build planet equatorials for navigation
    const _planetEqs = {};
    CATALOG.planets.forEach(p => {
      const eq = AstroCalc.getPlanetEquatorial(p.body, date);
      if (eq) _planetEqs[p.name] = eq;
    });

    container.innerHTML = all.map((p, i) => {
      const aboveHorizon = p.alt != null && p.alt > 0;
      const visible      = p.alt != null && p.alt > 10;
      const altText      = p.alt != null ? (p.alt > 0 ? `+${p.alt}°` : `${p.alt}°`) : '—';
      const extraInfo    = p.phaseName
        ? ` <span style="font-size:8px;color:var(--text-muted);">${p.phaseName}</span>`
        : '';
      const magText = p.mag != null
        ? `<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);margin-left:4px;">mag ${Number(p.mag).toFixed(1)}</span>`
        : '';

      return `
        <div class="planet-row" style="cursor:pointer;" data-planet="${p.name}" data-idx="${i}">
          <div class="planet-dot" style="background:${p.colorHex}"></div>
          <span class="planet-name">${p.name}${extraInfo}${magText}</span>
          <span class="planet-alt ${visible ? 'visible' : aboveHorizon ? 'above' : ''}"
            style="${!aboveHorizon && p.alt != null ? 'color:var(--text-muted);' : ''}">${altText}</span>
        </div>`;
    }).join('');

    // Click para navegar en el mapa
    container.querySelectorAll('.planet-row').forEach(row => {
      row.addEventListener('click', () => {
        const name = row.dataset.planet;
        let eq = null;
        if (name === 'Sol')   eq = _sunEq;
        else if (name === 'Luna') eq = _moonEq;
        else eq = _planetEqs[name] || null;
        if (eq) AstroMap.lookAt(eq.ra, eq.dec);
      });
    });
  }

  function updateSkyStats() {
    const planetsVisible = AstroMap.getPlanetVisibility().filter(p => p.alt > 10).length;
    const statsEl = document.getElementById('sky-stats');
    if (!statsEl) return;
    statsEl.innerHTML = `
      <div class="sky-stat"><span>Estrellas catalogadas</span><span class="sky-stat-val">${CATALOG.stars.length}</span></div>
      <div class="sky-stat"><span>Planetas visibles</span><span class="sky-stat-val">${planetsVisible}</span></div>
      <div class="sky-stat"><span>Objetos Messier</span><span class="sky-stat-val">${CATALOG.messier.length}</span></div>
    `;
  }

  // ─────────────────────────────────────────────
  // TOOLTIP
  // ─────────────────────────────────────────────
  function showTooltip(obj, x, y) {
    const tip = document.getElementById('tooltip');
    const d = obj.data;
    document.getElementById('tooltip-name').textContent = d.name;
    document.getElementById('tooltip-constellation').textContent =
      (d.con ? d.con.toUpperCase() : '') + (obj.type === 'planet' ? ' — PLANETA' : obj.type === 'messier' ? ` — ${d.type_str || 'OBJETO DS'}` : '');

    const rowsEl = tip.querySelector('.tooltip-rows') || (() => {
      const div = document.createElement('div');
      div.className = 'tooltip-rows';
      tip.insertBefore(div, document.getElementById('tooltip-desc'));
      return div;
    })();
    rowsEl.innerHTML = `
      ${d.mag != null ? `<div class="tooltip-row"><span class="tooltip-key">Magnitud</span><span class="tooltip-val">${Number(d.mag).toFixed(2)}</span></div>` : ''}
      ${d.ra  != null ? `<div class="tooltip-row"><span class="tooltip-key">RA</span><span class="tooltip-val">${AstroCalc.formatRA(d.ra)}</span></div>` : ''}
      ${d.dec != null ? `<div class="tooltip-row"><span class="tooltip-key">Dec</span><span class="tooltip-val">${AstroCalc.formatDec(d.dec)}</span></div>` : ''}
      ${d.alt != null ? `<div class="tooltip-row"><span class="tooltip-key">Altitud</span><span class="tooltip-val">${Number(d.alt).toFixed(1)}°</span></div>` : ''}
      ${d.sp  ? `<div class="tooltip-row"><span class="tooltip-key">Tipo espect.</span><span class="tooltip-val">${d.sp}</span></div>` : ''}
    `;
    document.getElementById('tooltip-desc').textContent = d.desc || '';

    moveTooltip(x, y);
    tip.classList.add('visible');
  }

  function moveTooltip(x, y) {
    const tip = document.getElementById('tooltip');
    const offX = x + 20 + 240 > window.innerWidth ? -260 : 20;
    const offY = y + 20 + 160 > window.innerHeight ? -170 : 20;
    tip.style.left = (x + offX) + 'px';
    tip.style.top  = (y + offY) + 'px';
  }

  function hideTooltip() {
    document.getElementById('tooltip').classList.remove('visible');
  }

  // ─────────────────────────────────────────────
  // OBJECT PANEL — show info on click
  // ─────────────────────────────────────────────
  function showObjectPanel(obj) {
    openPanel('catalog');
    const content = document.getElementById('panel-content');
    const d = obj.data;

    // Calcular altitud actual si tenemos RA/Dec
    let liveAlt = d.alt != null ? d.alt : null;
    let liveAz  = d.az  != null ? d.az  : null;
    if (liveAlt == null && d.ra != null && d.dec != null) {
      try {
        const loc = AstroMap.getLocation();
        const lst = AstroCalc.computeLST(AstroMap.getDate(), loc.lon);
        const ha  = AstroCalc.equatorialToHorizontal(d.ra, d.dec, lst, loc.lat);
        liveAlt = ha.alt;
        liveAz  = ha.az;
      } catch (_) {}
    }

    const altNum   = liveAlt != null ? +Number(liveAlt).toFixed(1) : null;
    const isAbove  = altNum != null && altNum > 0;
    const altBadge = altNum != null ? `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding:8px 10px;
        border:1px solid ${isAbove ? 'var(--success)' : 'var(--border-bright)'};
        background:${isAbove ? 'rgba(74,138,92,0.08)' : 'rgba(30,37,53,0.6)'};">
        <span style="font-size:16px;">${isAbove ? '⬆' : '⬇'}</span>
        <div>
          <div style="font-family:var(--font-mono);font-size:10px;color:${isAbove ? 'var(--success)' : 'var(--text-muted)'};">
            ${isAbove ? 'SOBRE EL HORIZONTE' : 'BAJO EL HORIZONTE'}
          </div>
          <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-primary);">
            Alt ${altNum > 0 ? '+' : ''}${altNum}°${liveAz != null ? '  &nbsp;  Az ' + Number(liveAz).toFixed(1) + '°' : ''}
          </div>
        </div>
      </div>` : '';

    content.innerHTML = `
      <button class="panel-btn" id="back-to-catalog-btn"
        style="margin-bottom:14px;display:flex;align-items:center;gap:6px;justify-content:center;
          border-color:var(--accent-blue-dim);color:var(--accent-blue);">
        ← VOLVER AL CATÁLOGO
      </button>

      <div style="margin-bottom:14px;">
        <div style="font-family:var(--font-mono);font-size:20px;color:var(--accent-gold);
          margin-bottom:3px;letter-spacing:0.04em;">${d.name}</div>
        <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.18em;
          color:var(--text-muted);">${(d.con||'').toUpperCase()}</div>
      </div>

      ${altBadge}

      <div style="border:1px solid var(--border);padding:14px;margin-bottom:14px;">
        ${d.mag  != null ? `<div class="tooltip-row"><span class="tooltip-key">Magnitud visual</span><span class="tooltip-val">${Number(d.mag).toFixed(2)}</span></div>` : ''}
        ${d.ra   != null ? `<div class="tooltip-row"><span class="tooltip-key">Asc. Recta</span><span class="tooltip-val">${AstroCalc.formatRA(d.ra)}</span></div>` : ''}
        ${d.dec  != null ? `<div class="tooltip-row"><span class="tooltip-key">Declinación</span><span class="tooltip-val">${AstroCalc.formatDec(d.dec)}</span></div>` : ''}
        ${d.sp   ? `<div class="tooltip-row"><span class="tooltip-key">Tipo espectral</span><span class="tooltip-val">${d.sp}</span></div>` : ''}
        ${d.type_str ? `<div class="tooltip-row"><span class="tooltip-key">Tipo</span><span class="tooltip-val">${d.type_str}</span></div>` : ''}
      </div>

      <div style="font-family:var(--font-text);font-size:12px;color:var(--text-secondary);
        line-height:1.7;margin-bottom:16px;">${d.desc || ''}</div>

      <div style="display:flex;flex-direction:column;gap:6px;">
        <button class="panel-btn primary" id="look-at-obj-btn">
          🔭 APUNTAR TELESCOPIO${!isAbove && altNum != null ? ' (BAJO HORIZONTE)' : ''}
        </button>
        ${mockUser ? `<button class="panel-btn" id="log-obs-btn">REGISTRAR OBSERVACIÓN</button>` : ''}
      </div>
    `;

    // Botón volver al catálogo — restaura panel de búsqueda
    document.getElementById('back-to-catalog-btn').addEventListener('click', () => {
      renderCatalogPanel(document.getElementById('panel-content'));
    });

    document.getElementById('look-at-obj-btn').addEventListener('click', () => {
      if (d.ra != null) AstroMap.lookAt(d.ra, d.dec);
      if (typeof AstroSyncClient !== 'undefined') {
        AstroSyncClient.setTarget(d.name, liveAlt, liveAz);
      }
      closePanel();
    });

    if (mockUser) {
      document.getElementById('log-obs-btn').addEventListener('click', () => {
        alert(`Observación de ${d.name} registrada.`);
      });
    }
  }

  // ─────────────────────────────────────────────
  // MODAL LOGIN / REGISTRO
  // ─────────────────────────────────────────────
  function setupModal() {
    document.getElementById('btn-login').addEventListener('click', openModal);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', closeModal);

    document.querySelectorAll('.modal-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.modal-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`modal-form-${tab.dataset.tab}`).classList.add('active');
      });
    });

    document.getElementById('btn-do-login').addEventListener('click', doLogin);
    document.getElementById('btn-do-register').addEventListener('click', doRegister);
  }

  function openModal() {
    document.getElementById('modal-auth').classList.add('open');
  }

  function closeModal() {
    document.getElementById('modal-auth').classList.remove('open');
  }

  function doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-password').value;
    if (!email || !pass) {
      showFormError('login', 'Por favor completa todos los campos.');
      return;
    }
    // Mock login
    mockUser = { email, name: email.split('@')[0] };
    closeModal();
    updateLoginButton();
    updatePlanetList();
    updateSkyStats();
    if (activePanel === 'observations') renderObservationsPanel(document.getElementById('panel-content'));
  }

  function doRegister() {
    const user  = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass  = document.getElementById('reg-password').value;
    if (!user || !email || !pass) {
      showFormError('register', 'Por favor completa todos los campos.');
      return;
    }
    mockUser = { email, name: user };
    closeModal();
    updateLoginButton();
  }

  function showFormError(form, msg) {
    const formEl = document.getElementById(`modal-form-${form}`);
    let errEl = formEl.querySelector('.form-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'form-error';
      errEl.style.cssText = 'font-family:var(--font-mono);font-size:9px;color:#A05050;padding:4px 0;';
      formEl.insertBefore(errEl, formEl.querySelector('.btn-primary'));
    }
    errEl.textContent = msg;
  }

  function updateLoginButton() {
    const btn = document.getElementById('btn-login');
    if (mockUser) {
      btn.textContent = mockUser.name.toUpperCase();
      btn.classList.add('logged-in');
      btn.removeEventListener('click', openModal);
      btn.addEventListener('click', () => {
        mockUser = null;
        btn.textContent = 'ACCEDER';
        btn.classList.remove('logged-in');
        btn.addEventListener('click', openModal);
      });
    }
  }

  // ─────────────────────────────────────────────
  // LOADING SCREEN
  // ─────────────────────────────────────────────
  function hideLoadingScreen() {
    const ls = document.getElementById('loading-screen');
    if (!ls) return;
    ls.classList.add('fade-out');
    setTimeout(() => ls.style.display = 'none', 700);
  }

  // Public API
  return {
    init,
    showTooltip,
    hideTooltip,
    moveTooltip,
    showObjectPanel,
    hideLoadingScreen,
  };
})();
