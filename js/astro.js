'use strict';
// ═══════════════════════════════════════════════════════════════
// ASTROSYNC — Cálculos Astronómicos
// LST, conversión de coordenadas, posiciones de planetas
// ═══════════════════════════════════════════════════════════════

const AstroCalc = (function () {

  const DEG2RAD = Math.PI / 180;
  const RAD2DEG = 180 / Math.PI;

  // ─────────────────────────────────────────────
  // TIEMPO SIDÉREO LOCAL (LST) en horas
  // Fórmula de la USNO, precisa a fracciones de segundo
  // ─────────────────────────────────────────────
  function computeLST(date, lon_deg) {
    const JD = date.getTime() / 86400000.0 + 2440587.5;
    const J2000 = 2451545.0;
    const D = JD - J2000;
    // GMST in hours (IAU formula)
    let gmst = 18.697374558 + 24.06570982441908 * D;
    gmst = ((gmst % 24) + 24) % 24;
    // LST = GMST + longitude_in_hours
    let lst = gmst + lon_deg / 15.0;
    lst = ((lst % 24) + 24) % 24;
    return lst; // hours
  }

  // ─────────────────────────────────────────────
  // ECUATORIAL (RA/Dec) → HORIZONTAL (Alt/Az)
  // ra_h: right ascension in hours
  // dec_deg: declination in degrees
  // lst_h: local sidereal time in hours
  // lat_deg: observer latitude in degrees
  // Returns: { alt (deg), az (deg) }  az: 0=N, 90=E, 180=S, 270=W
  // ─────────────────────────────────────────────
  function equatorialToHorizontal(ra_h, dec_deg, lst_h, lat_deg) {
    const ha = ((lst_h - ra_h + 24) % 24) * 15 * DEG2RAD; // Hour Angle in radians
    const dec = dec_deg * DEG2RAD;
    const lat = lat_deg * DEG2RAD;

    const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
    const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

    let az = 0;
    const cosAlt = Math.cos(alt);
    if (cosAlt > 0.0001) {
      const cosAz = (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / (cosAlt * Math.cos(lat));
      az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
      if (Math.sin(ha) > 0) az = 2 * Math.PI - az;
    }

    return { alt: alt * RAD2DEG, az: az * RAD2DEG };
  }

  // ─────────────────────────────────────────────
  // HORIZONTAL (Alt/Az) → XYZ en esfera de radio r
  // Convention: Y=up(zenith), Z=north, X=east
  // Camera initially looks toward -Z (south)
  // ─────────────────────────────────────────────
  function horizontalToXYZ(alt_deg, az_deg, r) {
    const alt = alt_deg * DEG2RAD;
    const az  = az_deg  * DEG2RAD;
    return {
      x:  r * Math.cos(alt) * Math.sin(az),
      y:  r * Math.sin(alt),
      z:  r * Math.cos(alt) * Math.cos(az)
    };
  }

  // ─────────────────────────────────────────────
  // GALÁCTICO → ECUATORIAL (J2000)
  // Usado para distribuir estrellas de fondo en la Vía Láctea
  // ─────────────────────────────────────────────
  function galacticToEquatorial(l_deg, b_deg) {
    const NGP_RA  = 192.85948 * DEG2RAD;
    const NGP_Dec = 27.12825  * DEG2RAD;
    const L_NCP   = 122.93192 * DEG2RAD;
    const l = l_deg * DEG2RAD;
    const b = b_deg * DEG2RAD;

    const sinDec = Math.sin(b) * Math.sin(NGP_Dec)
                 + Math.cos(b) * Math.cos(NGP_Dec) * Math.cos(L_NCP - l);
    const dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));

    const y = Math.cos(b) * Math.sin(L_NCP - l);
    const x = Math.sin(b) * Math.cos(NGP_Dec)
             - Math.cos(b) * Math.sin(NGP_Dec) * Math.cos(L_NCP - l);
    let ra = NGP_RA + Math.atan2(y, x);
    ra = ((ra % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    return { ra: ra / DEG2RAD / 15, dec: dec * RAD2DEG };
  }

  // ─────────────────────────────────────────────
  // MAPEADO MAGNITUD → TAMAÑO (en píxeles de point shader)
  // Magnitud más baja (más brillante) = punto más grande
  // ─────────────────────────────────────────────
  function magToSize(mag) {
    // Map mag range [-1.5, 6.5] → size [8.0, 0.8]
    return Math.max(0.8, 8.0 - (mag + 1.5) * 0.95);
  }

  // ─────────────────────────────────────────────
  // TIPO ESPECTRAL → COLOR RGB [0..1]
  // Basado en temperatura de cuerpo negro aproximada
  // ─────────────────────────────────────────────
  const SPECTRAL_COLORS = {
    'O': [0.608, 0.690, 1.000],  // Azul intenso
    'B': [0.682, 0.769, 1.000],  // Azul-blanco
    'A': [0.792, 0.843, 1.000],  // Blanco-azulado
    'F': [0.973, 0.969, 1.000],  // Blanco-amarillo
    'G': [1.000, 0.957, 0.918],  // Amarillo
    'K': [1.000, 0.824, 0.631],  // Naranja
    'M': [1.000, 0.506, 0.380],  // Rojo-naranja
  };

  function spectralToRGB(sp) {
    return SPECTRAL_COLORS[sp] || SPECTRAL_COLORS['A'];
  }

  // ─────────────────────────────────────────────
  // GENERADOR PSEUDOALEATORIO CON SEMILLA
  // Reproducible para las estrellas de fondo
  // ─────────────────────────────────────────────
  function createSeededRandom(seed) {
    let s = seed;
    return function () {
      s = (s ^ (s << 13)) >>> 0;
      s = (s ^ (s >> 7))  >>> 0;
      s = (s ^ (s << 17)) >>> 0;
      return s / 0xFFFFFFFF;
    };
  }

  // ─────────────────────────────────────────────
  // GENERAR ESTRELLAS DE FONDO (procedurales)
  // Mezcla de distribución uniforme + concentración galáctica
  // ─────────────────────────────────────────────
  function generateBackgroundStars(count) {
    const rand = createSeededRandom(0xA57210);
    const stars = [];
    const SPECTRAL_TYPES = 'OBAFGKM';
    const SPECTRAL_WEIGHTS = [0.5, 3, 7, 15, 20, 25, 30]; // % relative

    // Build weighted spectral type pool
    const pool = [];
    SPECTRAL_WEIGHTS.forEach((w, i) => {
      for (let j = 0; j < w; j++) pool.push(SPECTRAL_TYPES[i]);
    });

    // 55% random distribution (sky background)
    const uniformCount = Math.floor(count * 0.55);
    for (let i = 0; i < uniformCount; i++) {
      const ra  = rand() * 24;
      const dec = Math.asin(rand() * 2 - 1) * RAD2DEG;
      const mag = 4.2 + rand() * 2.3;
      const sp  = pool[Math.floor(rand() * pool.length)];
      const brightness = 0.28 + rand() * 0.52;
      const ptSize = 0.35 + rand() * 0.85;
      stars.push({ ra, dec, mag, sp, brightness, ptSize });
    }

    // 45% concentrated along galactic plane (Milky Way)
    const mwCount = count - uniformCount;
    for (let i = 0; i < mwCount; i++) {
      const l = rand() * 360;
      // Galactic latitude: sharply concentrated near 0°
      const b = (rand() - 0.5) * 30 * (rand() < 0.8 ? rand() * 0.5 : 1.0);
      const { ra, dec } = galacticToEquatorial(l, b);
      const mag = 4.5 + rand() * 2.0;
      const sp  = pool[Math.floor(rand() * pool.length)];
      const brightness = 0.32 + rand() * 0.48;
      const ptSize = 0.30 + rand() * 0.70;
      stars.push({ ra, dec, mag, sp, brightness, ptSize });
    }

    return stars;
  }

  // ─────────────────────────────────────────────
  // OBTENER POSICIÓN ECUATORIAL DE PLANETA
  // Usa astronomy-engine (global Astronomy)
  // Retorna { ra_h, dec_deg, dist_au, mag }
  // ─────────────────────────────────────────────
  // ─────────────────────────────────────────────
  // ELEMENTOS ORBITALES APROXIMADOS (Meeus, cap.22)
  // [L0, L1, a, e0, e1, i0, w0, node0] por planeta
  // L0=lon.media°, L1=variación/sig, a=UA, e=excentricidad,
  // i=inclinación°, w=perihelio°, node=nodo°
  // ─────────────────────────────────────────────
  const PLANET_ELEMENTS = {
    Mercury: [252.250906, 149472.6746358, 0.38709831, 0.20563661, 0.00002123, 7.004986, 77.456119, 48.330893],
    Venus:   [181.979801,  58517.8156760, 0.72332982, 0.00677188,-0.00004777, 3.394662,131.563707, 76.679920],
    Mars:    [355.433275,  19140.2993313, 1.52371243, 0.09336511, 0.00009149, 1.849726,336.060234, 49.558093],
    Jupiter: [ 34.351484,   3034.9056746, 5.20248019, 0.04853590, 0.00018026, 1.303270, 14.331309,100.464407],
    Saturn:  [ 50.077444,   1222.1137943, 9.54149883, 0.05550825,-0.00032044, 2.488878, 93.056787,113.665524],
    Uranus:  [314.055005,    428.4669983,19.18797948, 0.04685740,-0.0000019, 0.773196,173.005291, 74.005957],
    Neptune: [304.348665,    218.4862002,30.06952752, 0.00895439, 0.00000818, 1.769952, 48.120276,131.784057]
  };

  function _keplerSolve(M_rad, e) {
    let E = M_rad;
    for (let i = 0; i < 10; i++) {
      const dE = (M_rad - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
      E += dE;
      if (Math.abs(dE) < 1e-10) break;
    }
    return E;
  }

  function getPlanetEquatorialApprox(bodyName, date) {
    const el = PLANET_ELEMENTS[bodyName];
    if (!el) return null;
    const [L0, L1, a, e0, e1, i0, w0, node0] = el;

    const JD = date.getTime() / 86400000.0 + 2440587.5;
    const T  = (JD - 2451545.0) / 36525.0;
    const D  = JD - 2451545.0;

    // Elementos del planeta
    // L1 ya está en °/siglo y T ya está en siglos — no dividir de nuevo por 36525
    const L    = ((L0 + L1 * T) % 360 + 360) % 360 * DEG2RAD;
    const e    = e0 + e1 * T;
    const i    = i0 * DEG2RAD;
    const w    = w0 * DEG2RAD;           // longitud del perihelio
    const node = node0 * DEG2RAD;
    const M_p  = ((L - w) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);
    const E_p  = _keplerSolve(M_p, e);
    const nu_p = 2 * Math.atan2(Math.sqrt(1+e)*Math.sin(E_p/2), Math.sqrt(1-e)*Math.cos(E_p/2));
    const r_p  = a * (1 - e * Math.cos(E_p));  // distancia heliocéntrica UA

    // Coordenadas heliocéntricas eclípticas del planeta
    const u_p  = nu_p + w - node;
    const xH = r_p * (Math.cos(node)*Math.cos(u_p) - Math.sin(node)*Math.sin(u_p)*Math.cos(i));
    const yH = r_p * (Math.sin(node)*Math.cos(u_p) + Math.cos(node)*Math.sin(u_p)*Math.cos(i));
    const zH = r_p * Math.sin(u_p) * Math.sin(i);

    // Posición heliocéntrica del Sol (= negativo de la posición geocéntrica del Sol)
    const n_s  = JD - 2451545.0;
    const Ls   = (280.460 + 0.9856474 * n_s) % 360;
    const gs   = ((357.528 + 0.9856003 * n_s) % 360) * DEG2RAD;
    const lam  = (Ls + 1.915*Math.sin(gs) + 0.020*Math.sin(2*gs)) * DEG2RAD;
    const R_s  = 1.00014 - 0.01671*Math.cos(gs) - 0.00014*Math.cos(2*gs);  // AU
    const xS   = R_s * Math.cos(lam);
    const yS   = R_s * Math.sin(lam);
    const zS   = 0;

    // Coordenadas geocéntricas eclípticas del planeta
    const xG = xH - xS;
    const yG = yH - yS;
    const zG = zH - zS;
    const dist = Math.sqrt(xG*xG + yG*yG + zG*zG);

    // Eclíptica → Ecuatorial (oblicuidad)
    const eps = (23.439 - 0.0000004 * n_s) * DEG2RAD;
    const xEq = xG;
    const yEq = yG*Math.cos(eps) - zG*Math.sin(eps);
    const zEq = yG*Math.sin(eps) + zG*Math.cos(eps);

    const dec = Math.asin(Math.max(-1, Math.min(1, zEq / dist))) * RAD2DEG;
    let   ra  = Math.atan2(yEq, xEq) * RAD2DEG;
    ra = ((ra % 360) + 360) % 360;

    return { ra: ra / 15, dec, dist, mag: null };
  }

  function getPlanetEquatorial(bodyName, date) {
    // Intento 1: Astronomy.Equator (si la librería está cargada)
    if (typeof Astronomy !== 'undefined' && Astronomy) {
      try {
        const time = Astronomy.MakeTime(date);
        const eq   = Astronomy.Equator(bodyName, time, null, false, false);
        if (eq && eq.ra != null && !isNaN(eq.ra)) {
          let mag = null;
          try {
            const illum = Astronomy.Illumination(bodyName, time);
            mag = illum ? illum.mag : null;
          } catch (_) {}
          return { ra: eq.ra, dec: eq.dec, dist: eq.dist || 1, mag };
        }
      } catch (_) {}

      // Intento 2: GeoVector → RA/Dec manual
      try {
        const time = Astronomy.MakeTime(date);
        const gv   = Astronomy.GeoVector(bodyName, time, false);
        if (gv) {
          const dist = Math.sqrt(gv.x*gv.x + gv.y*gv.y + gv.z*gv.z);
          const dec  = Math.asin(Math.max(-1, Math.min(1, gv.z / dist))) * RAD2DEG;
          let   ra   = Math.atan2(gv.y, gv.x) * RAD2DEG;
          ra = ((ra % 360) + 360) % 360;
          let mag = null;
          try {
            const illum = Astronomy.Illumination(bodyName, Astronomy.MakeTime(date));
            mag = illum ? illum.mag : null;
          } catch (_) {}
          return { ra: ra / 15, dec, dist, mag };
        }
      } catch (_) {}
    }

    // Intento 3 (fallback matemático): fórmula de Meeus sin librería externa
    return getPlanetEquatorialApprox(bodyName, date);
  }

  // ─────────────────────────────────────────────
  // POSICIÓN ECUATORIAL DEL SOL (nunca retorna null)
  // Usa astronomy-engine; si falla, usa fórmula aproximada USNO
  // ─────────────────────────────────────────────
  function getSunEquatorial(date) {
    // Intento 1: astronomy-engine (si está cargado)
    if (typeof Astronomy !== 'undefined' && Astronomy) {
      try {
        const time = Astronomy.MakeTime(date);
        const eq   = Astronomy.Equator('Sun', time, null, false, false);
        if (eq && eq.ra != null && !isNaN(eq.ra)) {
          return { ra: eq.ra, dec: eq.dec, dist: eq.dist || 1.0, mag: -26.74 };
        }
      } catch (_) {}

      // Intento 2: GeoVector del Sol
      try {
        const time = Astronomy.MakeTime(date);
        const gv   = Astronomy.GeoVector('Sun', time, false);
        if (gv) {
          const dist = Math.sqrt(gv.x*gv.x + gv.y*gv.y + gv.z*gv.z);
          const dec  = Math.asin(Math.max(-1, Math.min(1, gv.z / dist))) * RAD2DEG;
          let   ra   = Math.atan2(gv.y, gv.x) * RAD2DEG;
          ra = ((ra % 360) + 360) % 360;
          return { ra: ra / 15, dec, dist, mag: -26.74 };
        }
      } catch (_) {}
    }

    // Fallback: fórmula aproximada de Meeus (precisa a ~1°)
    const JD = date.getTime() / 86400000.0 + 2440587.5;
    const n  = JD - 2451545.0;        // días desde J2000
    const L  = (280.460 + 0.9856474 * n) % 360;  // long. media
    const g  = ((357.528 + 0.9856003 * n) % 360) * DEG2RAD; // anom. media
    const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2*g)) * DEG2RAD;
    const epsilon = 23.439 * DEG2RAD;  // oblicuidad
    const ra_deg  = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)) * RAD2DEG;
    const dec_deg = Math.asin(Math.sin(epsilon) * Math.sin(lambda)) * RAD2DEG;
    return { ra: ((ra_deg % 360) + 360) % 360 / 15, dec: dec_deg, dist: 1.0, mag: -26.74 };
  }

  // ─────────────────────────────────────────────
  // POSICIÓN ECUATORIAL DE LA LUNA (nunca retorna null)
  // Incluye fase lunar e iluminación
  // ─────────────────────────────────────────────
  function getMoonEquatorial(date) {
    let ra = null, dec = null, dist = null, phase = 0, illumination = 0;

    if (typeof Astronomy !== 'undefined' && Astronomy) {
      // Intento 1: Astronomy.Equator
      try {
        const time = Astronomy.MakeTime(date);
        const eq   = Astronomy.Equator('Moon', time, null, false, false);
        if (eq && eq.ra != null && !isNaN(eq.ra)) {
          ra = eq.ra; dec = eq.dec; dist = eq.dist;
        }
      } catch (_) {}

      // Intento 2: GeoMoon vector
      if (ra === null) {
        try {
          const time = Astronomy.MakeTime(date);
          const gv   = Astronomy.GeoMoon(time);
          if (gv) {
            const d = Math.sqrt(gv.x*gv.x + gv.y*gv.y + gv.z*gv.z);
            dec  = Math.asin(Math.max(-1, Math.min(1, gv.z / d))) * RAD2DEG;
            let raD = Math.atan2(gv.y, gv.x) * RAD2DEG;
            raD = ((raD % 360) + 360) % 360;
            ra = raD / 15;
            dist = d;
          }
        } catch (_) {}
      }
    }

    // Fallback: fórmula simplificada de la Luna (Meeus)
    if (ra === null) {
      const JD = date.getTime() / 86400000.0 + 2440587.5;
      const D  = JD - 2451545.0;
      const L  = ((218.316 + 13.176396 * D) % 360) * DEG2RAD;
      const M  = ((134.963 + 13.064993 * D) % 360) * DEG2RAD;
      const F  = ((93.272  + 13.229350 * D) % 360) * DEG2RAD;
      const lon = L + (6.289 * Math.sin(M)) * DEG2RAD;
      const lat = (5.128 * Math.sin(F)) * DEG2RAD;
      const epsilon = 23.439 * DEG2RAD;
      dec = Math.asin(Math.sin(lat)*Math.cos(epsilon) + Math.cos(lat)*Math.sin(epsilon)*Math.sin(lon)) * RAD2DEG;
      let raD = Math.atan2(Math.sin(lon)*Math.cos(epsilon) - Math.tan(lat)*Math.sin(epsilon), Math.cos(lon)) * RAD2DEG;
      raD = ((raD % 360) + 360) % 360;
      ra = raD / 15;
      dist = 0.00257;  // ~384,400 km en UA
    }

    // Fase lunar: iluminación via astronomy-engine o diferencia angular Sol-Luna
    if (typeof Astronomy !== 'undefined' && Astronomy) {
      try {
        const time = Astronomy.MakeTime(date);
        const moonIllum = Astronomy.Illumination('Moon', time);
        if (moonIllum) {
          illumination = typeof moonIllum.phase_fraction === 'number'
            ? moonIllum.phase_fraction
            : (1 - Math.cos(moonIllum.phase_angle * DEG2RAD)) / 2;
          phase = illumination;
        }
      } catch (_) {}
    }
    // Fallback: fase por diferencia de longitud Sol-Luna
    if (illumination === 0) {
      try {
        const sunEq = getSunEquatorial(date);
        const diff  = ((ra - sunEq.ra) * 15 + 360) % 360;
        illumination = (1 - Math.cos(diff * DEG2RAD)) / 2;
        phase = illumination;
      } catch (_) {}
    }

    return { ra, dec, dist: dist || 0.00257, mag: -12.6, phase, illumination };
  }

  // ─────────────────────────────────────────────
  // NOMBRE DE FASE LUNAR EN ESPAÑOL
  // illumination: 0 = luna nueva, 1 = luna llena
  // ─────────────────────────────────────────────
  function getMoonPhaseName(illumination) {
    const i = illumination;
    if (i <= 0.03)  return 'Luna Nueva 🌑';
    if (i <= 0.47)  return 'Cuarto Creciente 🌓';
    if (i <= 0.53)  return 'Luna Llena 🌕';
    if (i <= 0.97)  return 'Cuarto Menguante 🌗';
    return 'Luna Nueva 🌑';
  }

  // ─────────────────────────────────────────────
  // DIRECCIÓN DE CÁMARA → AZ/ALT (para la barra inferior)
  // lookDir: THREE.Vector3 (normalizado)
  // ─────────────────────────────────────────────
  function lookDirToAzAlt(lookDir) {
    // Convención: az=0 → Norte, az=90 → Este
    // horizontalToXYZ: x=sin(az)*cos(alt), z=cos(az)*cos(alt)
    // Por tanto atan2(x, z) da directamente el azimut desde el Norte
    const alt = Math.asin(Math.max(-1, Math.min(1, lookDir.y))) * RAD2DEG;
    let az = Math.atan2(lookDir.x, lookDir.z) * RAD2DEG;
    az = ((az % 360) + 360) % 360;
    return { az: az.toFixed(1), alt: alt.toFixed(1) };
  }

  // ─────────────────────────────────────────────
  // NOMBRE CARDINAL (az en grados)
  // ─────────────────────────────────────────────
  function azToCardinal(az_deg) {
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
    const idx = Math.round(((az_deg % 360) + 360) % 360 / 22.5) % 16;
    return dirs[idx];
  }

  // ─────────────────────────────────────────────
  // FORMATEAR COORDENADAS para mostrar en UI
  // ─────────────────────────────────────────────
  function formatRA(ra_h) {
    const h = Math.floor(ra_h);
    const m = Math.floor((ra_h - h) * 60);
    const s = Math.round(((ra_h - h) * 60 - m) * 60);
    return `${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  }

  function formatDec(dec_deg) {
    const sign = dec_deg >= 0 ? '+' : '-';
    const abs = Math.abs(dec_deg);
    const d = Math.floor(abs);
    const m = Math.floor((abs - d) * 60);
    const s = Math.round(((abs - d) * 60 - m) * 60);
    return `${sign}${String(d).padStart(2,'0')}° ${String(m).padStart(2,'0')}' ${String(s).padStart(2,'0')}"`;
  }

  // Public API
  return {
    computeLST,
    equatorialToHorizontal,
    horizontalToXYZ,
    galacticToEquatorial,
    magToSize,
    spectralToRGB,
    generateBackgroundStars,
    getPlanetEquatorial,
    getSunEquatorial,
    getMoonEquatorial,
    getMoonPhaseName,
    lookDirToAzAlt,
    azToCardinal,
    formatRA,
    formatDec,
    DEG2RAD,
    RAD2DEG,
    SPECTRAL_COLORS,
  };
})();
