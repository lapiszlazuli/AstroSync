'use strict';
// ═══════════════════════════════════════════════════════════════
// ASTROSYNC — Motor de Renderizado Three.js
// Mapa estelar 3D interactivo con esfera celeste completa
// ═══════════════════════════════════════════════════════════════

const AstroMap = (function () {

  // ── State ──────────────────────────────────────────────────
  let scene, camera, renderer;
  let starPoints, constellLines = [], planetMeshes = [];
  let messierPoints;
  let sunMesh = null, moonMesh = null;   // Sol y Luna
  let pickableObjects = []; // { worldPos: Vector3, data: star/planet }

  let cameraTheta = Math.PI;     // Yaw: π = looking south
  let cameraPhi   = 0.28;        // Pitch: ~16° elevation

  let isDragging = false, lastMX = 0, lastMY = 0;
  let fov = 72;
  let userLat = 40.4168, userLon = -3.7038; // Default: Madrid
  let currentDate = new Date();
  let compassEl = null;  // Compass DOM element

  const SPHERE_R   = 900;
  const DEG2RAD    = Math.PI / 180;

  // Vertex shader for stars (per-vertex color + size)
  const STAR_VERT = `
    attribute float aSize;
    attribute vec3  aColor;
    attribute float aBelowHorizon;
    varying   vec3  vColor;
    varying   float vAlpha;
    void main() {
      vColor = aColor;
      float dim = aBelowHorizon > 0.5 ? 0.5 : 1.0;
      vAlpha = dim;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * (1400.0 / -mv.z);
      gl_Position  = projectionMatrix * mv;
    }
  `;

  const STAR_FRAG = `
    varying vec3  vColor;
    varying float vAlpha;
    void main() {
      float r = length(gl_PointCoord - vec2(0.5));
      if (r > 0.5) discard;
      float a = 1.0 - r * 2.0;
      a = a * a;
      gl_FragColor = vec4(vColor, a * vAlpha);
    }
  `;

  // Shader for Messier objects (small diamond-shaped markers)
  const MESSIER_VERT = `
    attribute float aSize;
    varying float vAlpha;
    void main() {
      vAlpha = position.y > 0.0 ? 1.0 : 0.45;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * (1400.0 / -mv.z);
      gl_Position  = projectionMatrix * mv;
    }
  `;
  const MESSIER_FRAG = `
    varying float vAlpha;
    void main() {
      vec2 uv = gl_PointCoord - vec2(0.5);
      float d = abs(uv.x) + abs(uv.y); // Diamond
      if (d > 0.38) discard;
      float a = (0.38 - d) / 0.38;
      gl_FragColor = vec4(0.6, 0.8, 0.6, a * 0.7 * vAlpha);
    }
  `;

  let bgStars = []; // generated once

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────
  function init(canvasEl) {
    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x060810, 1);

    // Scene
    scene = new THREE.Scene();

    // Camera — inside the celestial sphere
    camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 0);

    // Generate background stars once (seeded, reproducible)
    bgStars = AstroCalc.generateBackgroundStars(4500);

    // Build everything for current date/location
    buildScene();
    setupControls(canvasEl);
    setupPickEvents(canvasEl);
    buildCompass();
    window.addEventListener('resize', onResize);
    animate();
  }

  // ─────────────────────────────────────────────
  // BUILD SCENE — compute positions and create geometry
  // ─────────────────────────────────────────────
  function buildScene() {
    // Clear previous objects
    if (starPoints) scene.remove(starPoints);
    if (messierPoints) scene.remove(messierPoints);
    if (sunMesh)  {
      if (sunMesh.userData.glow) scene.remove(sunMesh.userData.glow);
      scene.remove(sunMesh);
      sunMesh  = null;
    }
    if (moonMesh) { scene.remove(moonMesh); moonMesh = null; }
    constellLines.forEach(l => scene.remove(l));
    constellLines = [];
    planetMeshes.forEach(m => scene.remove(m));
    planetMeshes = [];
    pickableObjects = [];

    const lst = AstroCalc.computeLST(currentDate, userLon);

    buildStars(lst);
    buildConstellations(lst);
    buildSunMoon();          // Sol y Luna
    buildPlanets();
    buildMessier(lst);
    buildHorizonRing();
  }

  // ─────────────────────────────────────────────
  // STARS — named + background
  // ─────────────────────────────────────────────
  function buildStars(lst) {
    const namedStars  = CATALOG.stars;
    const totalStars  = namedStars.length + bgStars.length;

    const positions   = new Float32Array(totalStars * 3);
    const colors      = new Float32Array(totalStars * 3);
    const sizes       = new Float32Array(totalStars);
    const belowArr    = new Float32Array(totalStars);

    let idx = 0;

    // Named stars
    namedStars.forEach(star => {
      const { alt, az } = AstroCalc.equatorialToHorizontal(star.ra, star.dec, lst, userLat);
      const xyz = AstroCalc.horizontalToXYZ(alt, az, SPHERE_R);
      positions[idx*3]   = xyz.x;
      positions[idx*3+1] = xyz.y;
      positions[idx*3+2] = xyz.z;
      const rgb = AstroCalc.spectralToRGB(star.sp);
      colors[idx*3]   = rgb[0];
      colors[idx*3+1] = rgb[1];
      colors[idx*3+2] = rgb[2];
      sizes[idx] = AstroCalc.magToSize(star.mag);
      belowArr[idx] = alt < -3 ? 1 : 0;

      // Pickable: store world position + data
      pickableObjects.push({
        worldPos: new THREE.Vector3(xyz.x, xyz.y, xyz.z),
        data: star,
        type: 'star'
      });
      idx++;
    });

    // Background stars
    bgStars.forEach(star => {
      const { alt, az } = AstroCalc.equatorialToHorizontal(star.ra, star.dec, lst, userLat);
      const xyz = AstroCalc.horizontalToXYZ(alt, az, SPHERE_R);
      positions[idx*3]   = xyz.x;
      positions[idx*3+1] = xyz.y;
      positions[idx*3+2] = xyz.z;
      const rgb = AstroCalc.spectralToRGB(star.sp);
      const dim = star.brightness || 0.55;
      colors[idx*3]   = rgb[0] * dim;
      colors[idx*3+1] = rgb[1] * dim;
      colors[idx*3+2] = rgb[2] * dim;
      sizes[idx] = star.ptSize || 0.8;
      belowArr[idx] = alt < -3 ? 1 : 0;
      idx++;
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',      new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor',        new THREE.BufferAttribute(colors,    3));
    geo.setAttribute('aSize',         new THREE.BufferAttribute(sizes,     1));
    geo.setAttribute('aBelowHorizon', new THREE.BufferAttribute(belowArr,  1));

    const mat = new THREE.ShaderMaterial({
      vertexShader:   STAR_VERT,
      fragmentShader: STAR_FRAG,
      transparent: true,
      depthWrite:  false,
    });

    starPoints = new THREE.Points(geo, mat);
    scene.add(starPoints);
  }

  // ─────────────────────────────────────────────
  // CONSTELLATION LINES
  // ─────────────────────────────────────────────
  function buildConstellations(lst) {
    const lineMat = new THREE.LineBasicMaterial({
      color:       0x2C4D75,
      transparent: true,
      opacity:     0.45,
      depthWrite:  false,
    });

    CATALOG.constellationLines.forEach(constel => {
      const pts = [];
      constel.pairs.forEach(([nameA, nameB]) => {
        const starA = CATALOG.starMap[nameA];
        const starB = CATALOG.starMap[nameB];
        if (!starA || !starB) return;

        const posA = AstroCalc.equatorialToHorizontal(starA.ra, starA.dec, lst, userLat);
        const posB = AstroCalc.equatorialToHorizontal(starB.ra, starB.dec, lst, userLat);
        const xyzA = AstroCalc.horizontalToXYZ(posA.alt, posA.az, SPHERE_R * 0.98);
        const xyzB = AstroCalc.horizontalToXYZ(posB.alt, posB.az, SPHERE_R * 0.98);

        pts.push(xyzA.x, xyzA.y, xyzA.z);
        pts.push(xyzB.x, xyzB.y, xyzB.z);
      });

      if (pts.length < 6) return;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const lines = new THREE.LineSegments(geo, lineMat);
      scene.add(lines);
      constellLines.push(lines);
    });
  }

  // ─────────────────────────────────────────────
  // SOL Y LUNA
  // ─────────────────────────────────────────────
  function buildSunMoon() {
    const lst = AstroCalc.computeLST(currentDate, userLon);

    // ―― SOL ――
    const sunEq = AstroCalc.getSunEquatorial(currentDate);
    if (sunEq) {
      const { alt, az } = AstroCalc.equatorialToHorizontal(sunEq.ra, sunEq.dec, lst, userLat);
      const xyz = AstroCalc.horizontalToXYZ(alt, az, SPHERE_R * 0.96);

      // Core sphere
      const sunGeo = new THREE.SphereGeometry(18, 24, 24);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFE066 });
      sunMesh = new THREE.Mesh(sunGeo, sunMat);
      sunMesh.position.set(xyz.x, xyz.y, xyz.z);
      scene.add(sunMesh);

      // Outer glow halo
      const glowGeo = new THREE.SphereGeometry(30, 24, 24);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.copy(sunMesh.position);
      scene.add(glowMesh);
      // We track glowMesh as a child conceptually; store as userData
      sunMesh.userData.glow = glowMesh;

      pickableObjects.push({
        worldPos: new THREE.Vector3(xyz.x, xyz.y, xyz.z),
        data: {
          name: 'Sol',
          con: 'Sistema Solar',
          mag: -26.74,
          ra: sunEq.ra,
          dec: sunEq.dec,
          alt,
          az,
          desc: 'Nuestra estrella. Diámetro de 1,392,000 km. Dista 1 UA (149.6 millones de km). Clase espectral G2V.',
          type_str: 'Estrella — Clase G2V'
        },
        type: 'sun'
      });

      // HTML label
      const labelsLayer = document.getElementById('labels-layer');
      let sunLabel = document.getElementById('planet-label-Sun');
      if (!sunLabel) {
        sunLabel = document.createElement('div');
        sunLabel.className = 'planet-label sun-label';
        sunLabel.id = 'planet-label-Sun';
        sunLabel.innerHTML = '<span class="dot" style="background:#FFE066"></span>Sol';
        sunLabel.style.display = 'none';
        labelsLayer.appendChild(sunLabel);
      }
    }

    // ―― LUNA ――
    const moonEq = AstroCalc.getMoonEquatorial(currentDate);
    if (moonEq) {
      const { alt, az } = AstroCalc.equatorialToHorizontal(moonEq.ra, moonEq.dec, lst, userLat);
      const xyz = AstroCalc.horizontalToXYZ(alt, az, SPHERE_R * 0.96);

      const moonGeo = new THREE.SphereGeometry(14, 20, 20);
      const moonMat = new THREE.MeshBasicMaterial({ color: 0xCCCCBB });
      moonMesh = new THREE.Mesh(moonGeo, moonMat);
      moonMesh.position.set(xyz.x, xyz.y, xyz.z);
      scene.add(moonMesh);

      const phaseName = AstroCalc.getMoonPhaseName(moonEq.illumination);
      pickableObjects.push({
        worldPos: new THREE.Vector3(xyz.x, xyz.y, xyz.z),
        data: {
          name: 'Luna',
          con: 'Sistema Solar',
          mag: moonEq.mag,
          ra: moonEq.ra,
          dec: moonEq.dec,
          alt,
          az,
          desc: `Satélite natural de la Tierra. Fase actual: ${phaseName} (${Math.round(moonEq.illumination * 100)}% iluminada). Distancia: ~384,400 km.`,
          type_str: `Satélite — ${phaseName}`,
          illumination: moonEq.illumination,
        },
        type: 'moon'
      });

      // HTML label
      const labelsLayer = document.getElementById('labels-layer');
      let moonLabel = document.getElementById('planet-label-Moon');
      if (!moonLabel) {
        moonLabel = document.createElement('div');
        moonLabel.className = 'planet-label';
        moonLabel.id = 'planet-label-Moon';
        moonLabel.innerHTML = '<span class="dot" style="background:#CCCCBB"></span>Luna';
        moonLabel.style.display = 'none';
        labelsLayer.appendChild(moonLabel);
      }
    }
  }

  // ─────────────────────────────────────────────
  // PLANETS — computed via astronomy-engine
  // ─────────────────────────────────────────────
  function buildPlanets() {
    const lst = AstroCalc.computeLST(currentDate, userLon);

    // Clear labels layer
    const labelsLayer = document.getElementById('labels-layer');
    labelsLayer.innerHTML = '';

    CATALOG.planets.forEach(planet => {
      const eq = AstroCalc.getPlanetEquatorial(planet.body, currentDate);
      if (!eq) return;

      const { alt, az } = AstroCalc.equatorialToHorizontal(eq.ra, eq.dec, lst, userLat);
      const xyz = AstroCalc.horizontalToXYZ(alt, az, SPHERE_R * 0.96);

      // Planet sphere mesh
      const geo  = new THREE.SphereGeometry(planet.radius * 2.5, 12, 12);
      const mat  = new THREE.MeshBasicMaterial({ color: planet.color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(xyz.x, xyz.y, xyz.z);
      mesh.userData = { planet, eq, alt, az, type: 'planet' };
      scene.add(mesh);
      planetMeshes.push(mesh);

      // Create HTML label
      const label = document.createElement('div');
      label.className = 'planet-label';
      label.id = `planet-label-${planet.body}`;
      label.innerHTML = `<span class="dot" style="background:${planet.colorHex}"></span>${planet.name}`;
      label.style.display = 'none';
      labelsLayer.appendChild(label);

      // Pickable
      pickableObjects.push({
        worldPos: new THREE.Vector3(xyz.x, xyz.y, xyz.z),
        data: { ...planet, ra: eq.ra, dec: eq.dec, mag: eq.mag, alt, az, con: '—' },
        type: 'planet'
      });
    });
  }

  // ─────────────────────────────────────────────
  // MESSIER OBJECTS
  // ─────────────────────────────────────────────
  function buildMessier(lst) {
    const objs = CATALOG.messier;
    const positions = new Float32Array(objs.length * 3);
    const sizes     = new Float32Array(objs.length);

    objs.forEach((obj, i) => {
      const { alt, az } = AstroCalc.equatorialToHorizontal(obj.ra, obj.dec, lst, userLat);
      const xyz = AstroCalc.horizontalToXYZ(alt, az, SPHERE_R * 0.95);
      positions[i*3]   = xyz.x;
      positions[i*3+1] = xyz.y;
      positions[i*3+2] = xyz.z;
      sizes[i] = Math.max(1.5, 5.0 - obj.mag * 0.3);

      pickableObjects.push({
        worldPos: new THREE.Vector3(xyz.x, xyz.y, xyz.z),
        data: { name: obj.name, con: obj.con, mag: obj.mag, type_str: obj.type, desc: obj.desc, ra: obj.ra, dec: obj.dec },
        type: 'messier'
      });
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader:   MESSIER_VERT,
      fragmentShader: MESSIER_FRAG,
      transparent: true,
      depthWrite:  false,
    });

    messierPoints = new THREE.Points(geo, mat);
    scene.add(messierPoints);
  }

  // ─────────────────────────────────────────────
  // HORIZON RING
  // ─────────────────────────────────────────────
  function buildHorizonRing() {
    const pts = [];
    for (let i = 0; i <= 360; i++) {
      const az  = i * DEG2RAD;
      const xyz = AstroCalc.horizontalToXYZ(0, i, SPHERE_R * 0.97);
      pts.push(xyz.x, xyz.y, xyz.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x1E3040, transparent: true, opacity: 0.6, depthWrite: false
    });
    scene.add(new THREE.Line(geo, mat));
  }

  // ─────────────────────────────────────────────
  // CAMERA CONTROLS — drag to look around
  // ─────────────────────────────────────────────
  function setupControls(canvasEl) {
    updateCameraDirection();

    canvasEl.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      isDragging = true;
      lastMX = e.clientX;
      lastMY = e.clientY;
    });

    canvasEl.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const dx = e.clientX - lastMX;
      const dy = e.clientY - lastMY;
      lastMX = e.clientX;
      lastMY = e.clientY;

      cameraTheta += dx * 0.003;   // Arrastrar derecha = ver a la derecha (natural)
      cameraPhi   += dy * 0.003;   // Arrastrar hacia abajo = bajar la vista (natural)
      cameraPhi    = Math.max(-Math.PI/2 + 0.015, Math.min(Math.PI/2 - 0.015, cameraPhi));
      updateCameraDirection();
    });

    canvasEl.addEventListener('mouseup',    () => { isDragging = false; });
    canvasEl.addEventListener('mouseleave', () => { isDragging = false; });

    // Touch support
    let lastTouch = null;
    canvasEl.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    canvasEl.addEventListener('touchmove', e => {
      if (e.touches.length === 1 && lastTouch) {
        const dx = e.touches[0].clientX - lastTouch.x;
        const dy = e.touches[0].clientY - lastTouch.y;
        lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        cameraTheta += dx * 0.004;   // Arrastrar derecha = ver a la derecha
        cameraPhi   += dy * 0.004;   // Arrastrar abajo = bajar vista
        cameraPhi    = Math.max(-Math.PI/2 + 0.015, Math.min(Math.PI/2 - 0.015, cameraPhi));
        updateCameraDirection();
      }
    }, { passive: true });

    canvasEl.addEventListener('touchend', () => { lastTouch = null; });

    // Scroll to zoom
    canvasEl.addEventListener('wheel', e => {
      fov += e.deltaY * 0.04;
      fov  = Math.max(20, Math.min(100, fov));
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }, { passive: true });
  }

  function updateCameraDirection() {
    const cosPhi = Math.cos(cameraPhi);
    const lookX  = cosPhi * Math.sin(cameraTheta);
    const lookY  = Math.sin(cameraPhi);
    const lookZ  = cosPhi * Math.cos(cameraTheta);
    camera.lookAt(lookX, lookY, lookZ);
  }

  function getLookDir() {
    const cosPhi = Math.cos(cameraPhi);
    return new THREE.Vector3(
      cosPhi * Math.sin(cameraTheta),
      Math.sin(cameraPhi),
      cosPhi * Math.cos(cameraTheta)
    ).normalize();
  }

  // ─────────────────────────────────────────────
  // OBJECT PICKING — project to screen, find nearest
  // ─────────────────────────────────────────────
  let hoverObj = null;
  function setupPickEvents(canvasEl) {
    canvasEl.addEventListener('mousemove', e => {
      if (isDragging) return;
      const screenX = e.clientX;
      const screenY = e.clientY;
      const obj = findNearestScreenObject(screenX, screenY, 38);
      if (obj !== hoverObj) {
        hoverObj = obj;
        if (obj) {
          AstroUI.showTooltip(obj, screenX, screenY);
        } else {
          AstroUI.hideTooltip();
        }
      } else if (obj) {
        AstroUI.moveTooltip(screenX, screenY);
      }
    });

    canvasEl.addEventListener('click', e => {
      const obj = findNearestScreenObject(e.clientX, e.clientY, 30);
      if (obj) AstroUI.showObjectPanel(obj);
    });
  }

  function worldToScreen(worldPos) {
    const pos = worldPos.clone().project(camera);
    if (pos.z > 1) return null; // behind
    return {
      x: (pos.x + 1) / 2 * window.innerWidth,
      y: (-pos.y + 1) / 2 * window.innerHeight
    };
  }

  function findNearestScreenObject(sx, sy, threshold) {
    let minD = threshold;
    let nearest = null;
    for (const obj of pickableObjects) {
      const sp = worldToScreen(obj.worldPos);
      if (!sp) continue;
      const d = Math.hypot(sx - sp.x, sy - sp.y);
      if (d < minD) {
        minD = d;
        nearest = obj;
      }
    }
    return nearest;
  }

  // ─────────────────────────────────────────────
  // PLANET LABEL UPDATE (called each frame)
  // ─────────────────────────────────────────────
  function updatePlanetLabels() {
    planetMeshes.forEach(mesh => {
      const planet = mesh.userData.planet;
      const label = document.getElementById(`planet-label-${planet.body}`);
      if (!label) return;
      const sp = worldToScreen(mesh.position);
      if (!sp) { label.style.display = 'none'; return; }
      label.style.display  = 'block';
      label.style.left = sp.x + 'px';
      label.style.top  = sp.y + 'px';
    });

    // Sol
    if (sunMesh) {
      const sunLabel = document.getElementById('planet-label-Sun');
      if (sunLabel) {
        const sp = worldToScreen(sunMesh.position);
        if (!sp) { sunLabel.style.display = 'none'; }
        else {
          sunLabel.style.display = 'block';
          sunLabel.style.left = (sp.x + 22) + 'px';
          sunLabel.style.top  = sp.y + 'px';
        }
      }
      // Sync glow
      if (sunMesh.userData.glow) sunMesh.userData.glow.position.copy(sunMesh.position);
    }

    // Luna
    if (moonMesh) {
      const moonLabel = document.getElementById('planet-label-Moon');
      if (moonLabel) {
        const sp = worldToScreen(moonMesh.position);
        if (!sp) { moonLabel.style.display = 'none'; }
        else {
          moonLabel.style.display = 'block';
          moonLabel.style.left = (sp.x + 18) + 'px';
          moonLabel.style.top  = sp.y + 'px';
        }
      }
    }
  }

  // ─────────────────────────────────────────────
  // COMPASS — indicador cardinal en pantalla
  // ─────────────────────────────────────────────
  function buildCompass() {
    // Remove previous if any
    const existing = document.getElementById('compass');
    if (existing) existing.remove();

    compassEl = document.createElement('div');
    compassEl.id = 'compass';
    compassEl.innerHTML = `
      <div class="compass-ring" id="compass-ring">
        <span class="compass-n" id="compass-n">N</span>
        <span class="compass-e" id="compass-e">E</span>
        <span class="compass-s" id="compass-s">S</span>
        <span class="compass-w" id="compass-w">O</span>
        <div class="compass-center"></div>
        <div class="compass-needle" id="compass-needle"></div>
      </div>
    `;
    document.body.appendChild(compassEl);
  }

  function updateCompass(az_deg) {
    if (!compassEl) return;
    // Rotate the compass ring so that the current azimuth points up (to the viewer)
    // The ring labels are fixed; we rotate the needle toward North
    const needle = document.getElementById('compass-needle');
    if (needle) {
      // Needle points to North: rotate opposite to current azimuth
      needle.style.transform = `rotate(${-az_deg}deg)`;
    }
    // Highlight the cardinal closest to the view
    const cardinal = AstroCalc.azToCardinal(az_deg);
    const ids = { N: 'compass-n', E: 'compass-e', S: 'compass-s', O: 'compass-w' };
    ['N','E','S','O'].forEach(dir => {
      const el = document.getElementById(ids[dir]);
      if (el) el.classList.toggle('active', cardinal.startsWith(dir));
    });
  }

  // ─────────────────────────────────────────────
  // ANIMATE — render loop
  // ─────────────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);
    updatePlanetLabels();

    // Update bottom bar view direction
    const dir = getLookDir();
    const azAlt = AstroCalc.lookDirToAzAlt(dir);
    const cardinal = AstroCalc.azToCardinal(parseFloat(azAlt.az));
    const el = document.getElementById('view-az');
    const el2 = document.getElementById('view-alt');
    if (el)  el.textContent  = `${cardinal}  ${azAlt.az}°`;
    if (el2) el2.textContent = `Alt ${azAlt.alt}°`;

    // Update compass
    updateCompass(parseFloat(azAlt.az));

    renderer.render(scene, camera);
  }

  // ─────────────────────────────────────────────
  // ON RESIZE
  // ─────────────────────────────────────────────
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────
  function setLocation(lat, lon) {
    userLat = lat;
    userLon = lon;
    buildScene();
  }

  function setDate(date) {
    currentDate = date;
    buildScene();
  }

  function getDate()    { return currentDate; }
  function getLocation(){ return { lat: userLat, lon: userLon }; }

  function lookAt(ra_h, dec_deg) {
    // Compute alt/az of target and set camera direction
    const lst = AstroCalc.computeLST(currentDate, userLon);
    const { alt, az } = AstroCalc.equatorialToHorizontal(ra_h, dec_deg, lst, userLat);
    const xyz = AstroCalc.horizontalToXYZ(alt, az, 1);
    cameraTheta = Math.atan2(xyz.x, xyz.z);
    cameraPhi   = Math.asin(Math.max(-1, Math.min(1, xyz.y)));
    updateCameraDirection();
  }

  function lookAzAlt(az_deg, alt_deg) {
    const xyz = AstroCalc.horizontalToXYZ(alt_deg, az_deg, 1);
    cameraTheta = Math.atan2(xyz.x, xyz.z);
    cameraPhi   = Math.asin(Math.max(-1, Math.min(1, xyz.y)));
    updateCameraDirection();
  }

  function getPlanetVisibility() {
    // Returns array of { name, alt, colorHex } for visible planets
    const lst = AstroCalc.computeLST(currentDate, userLon);
    return CATALOG.planets.map(p => {
      const eq = AstroCalc.getPlanetEquatorial(p.body, currentDate);
      if (!eq) return { name: p.name, alt: null, colorHex: p.colorHex };
      const { alt } = AstroCalc.equatorialToHorizontal(eq.ra, eq.dec, lst, userLat);
      return { name: p.name, alt: Math.round(alt), colorHex: p.colorHex, mag: eq.mag };
    });
  }

  function getSunMoonVisibility() {
    const lst = AstroCalc.computeLST(currentDate, userLon);
    const result = [];

    const sunEq = AstroCalc.getSunEquatorial(currentDate);
    if (sunEq) {
      const { alt } = AstroCalc.equatorialToHorizontal(sunEq.ra, sunEq.dec, lst, userLat);
      result.push({ name: 'Sol', alt: Math.round(alt), colorHex: '#FFE066', type: 'sun' });
    }

    const moonEq = AstroCalc.getMoonEquatorial(currentDate);
    if (moonEq) {
      const { alt } = AstroCalc.equatorialToHorizontal(moonEq.ra, moonEq.dec, lst, userLat);
      const phaseName = AstroCalc.getMoonPhaseName(moonEq.illumination);
      result.push({
        name: 'Luna',
        alt: Math.round(alt),
        colorHex: '#CCCCBB',
        type: 'moon',
        phaseName,
        illumination: moonEq.illumination
      });
    }

    return result;
  }

  return { init, setLocation, setDate, getDate, getLocation, lookAt, lookAzAlt, getPlanetVisibility, getSunMoonVisibility };
})();
