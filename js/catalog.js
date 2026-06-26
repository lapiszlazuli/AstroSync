'use strict';
// ═══════════════════════════════════════════════════════════════
// ASTROSYNC — Stellar Catalog
// Real star data from Hipparcos catalog (J2000.0)
// Format: name, ra(hours), dec(degrees), mag, spectral class, constellation, description
// ═══════════════════════════════════════════════════════════════

const CATALOG = {

  stars: [
    { name:'Sirius',          ra:6.7525,  dec:-16.7161, mag:-1.46, sp:'A', con:'Canis Major',       desc:'La estrella más brillante del cielo nocturno. Sistema binario a 8.6 años luz.' },
    { name:'Canopus',         ra:6.3992,  dec:-52.6956, mag:-0.74, sp:'F', con:'Carina',             desc:'Segunda más brillante. Supergigante amarilla usada en navegación espacial.' },
    { name:'Rigil Kentaurus', ra:14.6601, dec:-60.8339, mag:-0.01, sp:'G', con:'Centaurus',          desc:'Sistema estelar más cercano al Sol, a solo 4.37 años luz.' },
    { name:'Arcturus',        ra:14.2610, dec:19.1822,  mag:-0.04, sp:'K', con:'Boötes',             desc:'Gigante naranja más brillante del hemisferio norte. 36.7 años luz.' },
    { name:'Vega',            ra:18.6157, dec:38.7836,  mag:0.03,  sp:'A', con:'Lyra',               desc:'Estrella del Triángulo de Verano. Fue la Estrella Polar hace 12,000 años.' },
    { name:'Capella',         ra:5.2782,  dec:45.9978,  mag:0.08,  sp:'G', con:'Auriga',             desc:'Sistema de cuatro estrellas. La más brillante de Auriga a 42.9 años luz.' },
    { name:'Rigel',           ra:5.2423,  dec:-8.2017,  mag:0.13,  sp:'B', con:'Orion',              desc:'Supergigante azul-blanca. El pie derecho de Orión. 860 años luz.' },
    { name:'Procyon',         ra:7.6550,  dec:5.2250,   mag:0.34,  sp:'F', con:'Canis Minor',        desc:'Estrella del Triángulo de Invierno. Binaria a 11.4 años luz.' },
    { name:'Achernar',        ra:1.6285,  dec:-57.2367, mag:0.46,  sp:'B', con:'Eridanus',           desc:'La estrella más achatada conocida: rota tan rápido que es oblata.' },
    { name:'Betelgeuse',      ra:5.9195,  dec:7.4069,   mag:0.50,  sp:'M', con:'Orion',              desc:'Supergigante roja en el hombro de Orión. Candidata a supernova.' },
    { name:'Hadar',           ra:14.0637, dec:-60.3728, mag:0.61,  sp:'B', con:'Centaurus',          desc:'Puntero de la Cruz del Sur. Gigante azul a 390 años luz.' },
    { name:'Altair',          ra:19.8464, dec:8.8683,   mag:0.76,  sp:'A', con:'Aquila',             desc:'Triángulo de Verano. Rota tan rápido que tiene forma de pelota de rugby.' },
    { name:'Acrux',           ra:12.4433, dec:-63.0992, mag:0.77,  sp:'B', con:'Crux',               desc:'La estrella más brillante de la Cruz del Sur. 320 años luz.' },
    { name:'Aldebaran',       ra:4.5987,  dec:16.5092,  mag:0.87,  sp:'K', con:'Taurus',             desc:'El ojo del Toro. Gigante naranja a 65 años luz.' },
    { name:'Antares',         ra:16.4902, dec:-26.4319, mag:0.96,  sp:'M', con:'Scorpius',           desc:'Rival de Marte. Supergigante roja en el corazón del Escorpión.' },
    { name:'Spica',           ra:13.4199, dec:-11.1614, mag:0.97,  sp:'B', con:'Virgo',              desc:'Estrella binaria que forma la espiga de Virgo. 250 años luz.' },
    { name:'Pollux',          ra:7.7553,  dec:28.0261,  mag:1.14,  sp:'K', con:'Gemini',             desc:'Gigante naranja con un planeta confirmado. El gemelo más brillante.' },
    { name:'Fomalhaut',       ra:22.9608, dec:-29.6222, mag:1.16,  sp:'A', con:'Piscis Austrinus',   desc:'La Estrella Solitaria del Sur. Tiene un disco de polvo con planetas.' },
    { name:'Deneb',           ra:20.6905, dec:45.2803,  mag:1.25,  sp:'A', con:'Cygnus',             desc:'Una de las estrellas más luminosas conocidas. Triángulo de Verano.' },
    { name:'Mimosa',          ra:12.7954, dec:-59.6886, mag:1.25,  sp:'B', con:'Crux',               desc:'Segunda estrella más brillante de la Cruz del Sur.' },
    { name:'Regulus',         ra:10.1395, dec:11.9672,  mag:1.35,  sp:'B', con:'Leo',                desc:'Corazón del León. Rota en solo 15.9 horas. 79 años luz.' },
    { name:'Adhara',          ra:6.9771,  dec:-28.9719, mag:1.50,  sp:'B', con:'Canis Major',        desc:'Segunda más brillante de Can Mayor. Fuente UV muy intensa.' },
    { name:'Castor',          ra:7.5767,  dec:31.8883,  mag:1.57,  sp:'A', con:'Gemini',             desc:'Sistema de seis estrellas en una. El gemelo más débil.' },
    { name:'Shaula',          ra:17.5601, dec:-37.1036, mag:1.62,  sp:'B', con:'Scorpius',           desc:'El aguijón del Escorpión. Binaria espectroscópica.' },
    { name:'Gacrux',          ra:12.5194, dec:-57.1133, mag:1.63,  sp:'M', con:'Crux',               desc:'Gigante roja en la Cruz del Sur. La más septentrional del asterismo.' },
    { name:'Bellatrix',       ra:5.4189,  dec:6.3497,   mag:1.64,  sp:'B', con:'Orion',              desc:'El hombro izquierdo de Orión. Gigante azul-blanca.' },
    { name:'El Nath',         ra:5.4382,  dec:28.6075,  mag:1.65,  sp:'B', con:'Taurus',             desc:'La punta del cuerno norte del Toro. Compartida con Auriga.' },
    { name:'Miaplacidus',     ra:9.2200,  dec:-69.7172, mag:1.67,  sp:'A', con:'Carina',             desc:'Segunda más brillante de la Quilla. 111 años luz.' },
    { name:'Alnilam',         ra:5.6035,  dec:-1.2019,  mag:1.69,  sp:'B', con:'Orion',              desc:'Estrella central del cinturón de Orión. Supergigante azul.' },
    { name:'Alnitak',         ra:5.6793,  dec:-1.9428,  mag:1.74,  sp:'O', con:'Orion',              desc:'Extremo izquierdo del cinturón de Orión. Cercana a la Nebulosa de la Llama.' },
    { name:'Alioth',          ra:12.9005, dec:55.9597,  mag:1.76,  sp:'A', con:'Ursa Major',         desc:'La más brillante de la Osa Mayor. Estrella peculiar magnética.' },
    { name:'Dubhe',           ra:11.0621, dec:61.7511,  mag:1.79,  sp:'K', con:'Ursa Major',         desc:'Puntero de Polaris. Extremo del cucharón de la Osa Mayor.' },
    { name:'Mirfak',          ra:3.4054,  dec:49.8614,  mag:1.79,  sp:'F', con:'Perseus',            desc:'La más brillante de Perseo. Supergigante amarilla.' },
    { name:'Wezen',           ra:7.1399,  dec:-26.3936, mag:1.83,  sp:'F', con:'Canis Major',        desc:'Supergigante amarilla en Can Mayor. Una de las más luminosas.' },
    { name:'Kaus Australis',  ra:18.4029, dec:-34.3847, mag:1.85,  sp:'B', con:'Sagittarius',        desc:'La más brillante de Sagitario. "Arco del Sur".' },
    { name:'Avior',           ra:8.3752,  dec:-59.5094, mag:1.86,  sp:'K', con:'Carina',             desc:'Sistema binario en la Quilla. 630 años luz.' },
    { name:'Alkaid',          ra:13.7923, dec:49.3133,  mag:1.86,  sp:'B', con:'Ursa Major',         desc:'Extremo de la cola de la Osa Mayor. Estrella más caliente del asterismo.' },
    { name:'Sargas',          ra:17.6219, dec:-42.9978, mag:1.87,  sp:'F', con:'Scorpius',           desc:'Supergigante amarillo-blanca en la cola del Escorpión.' },
    { name:'Atria',           ra:16.8111, dec:-69.0278, mag:1.91,  sp:'K', con:'Triangulum Australe', desc:'La más brillante del Triángulo Austral. 415 años luz.' },
    { name:'Alhena',          ra:6.6285,  dec:16.3992,  mag:1.93,  sp:'A', con:'Gemini',             desc:'El pie del gemelo Cástor. Binaria espectroscópica.' },
    { name:'Peacock',         ra:20.4275, dec:-56.7350, mag:1.94,  sp:'B', con:'Pavo',               desc:'La más brillante del Pavo Real. Gigante azul-blanca.' },
    { name:'Alsephina',       ra:8.7451,  dec:-54.7089, mag:1.96,  sp:'A', con:'Vela',               desc:'Sistema binario en las Velas. Parte de la antigua Navis Argo.' },
    { name:'Murzim',          ra:6.3783,  dec:-17.9558, mag:1.98,  sp:'B', con:'Canis Major',        desc:'El anunciador. Sale antes que Sirio al amanecer.' },
    { name:'Alphard',         ra:9.4598,  dec:-8.6586,  mag:1.99,  sp:'K', con:'Hydra',              desc:'La Solitaria. La única estrella brillante de Hydra.' },
    { name:'Polaris',         ra:2.5303,  dec:89.2642,  mag:1.97,  sp:'F', con:'Ursa Minor',         desc:'La Estrella Polar. Marca el norte celeste a menos de 1° del polo.' },
    { name:'Hamal',           ra:2.1196,  dec:23.4625,  mag:2.00,  sp:'K', con:'Aries',              desc:'La más brillante de Aries. El antiguo punto vernal.' },
    { name:'Algieba',         ra:10.3329, dec:19.8417,  mag:2.01,  sp:'K', con:'Leo',                desc:'Doble dorado en la melena del León. Ambas son gigantes.' },
    { name:'Diphda',          ra:0.7265,  dec:-17.9867, mag:2.04,  sp:'K', con:'Cetus',              desc:'La más brillante de la Ballena. Gigante naranja.' },
    { name:'Nunki',           ra:18.9211, dec:-26.2967, mag:2.05,  sp:'B', con:'Sagittarius',        desc:'Segunda más brillante de Sagitario. Gigante azul.' },
    { name:'Menkent',         ra:14.1114, dec:-36.3697, mag:2.06,  sp:'K', con:'Centaurus',          desc:'El hombro del Centauro. Gigante naranja a 61 años luz.' },
    { name:'Kochab',          ra:14.8451, dec:74.1556,  mag:2.07,  sp:'K', con:'Ursa Minor',         desc:'Antigua Estrella Polar hace ~4700 años. Guardia de Polaris.' },
    { name:'Saiph',           ra:5.7960,  dec:-9.6697,  mag:2.06,  sp:'B', con:'Orion',              desc:'El pie izquierdo de Orión. Supergigante azul a 650 años luz.' },
    { name:'Alpheratz',       ra:0.1398,  dec:29.0906,  mag:2.06,  sp:'B', con:'Andromeda',          desc:'Cabeza de Andrómeda y esquina del Cuadrado de Pegaso.' },
    { name:'Rasalhague',      ra:17.5823, dec:12.5600,  mag:2.08,  sp:'A', con:'Ophiuchus',          desc:'Cabeza del Portador de Serpientes. Binaria a 47 años luz.' },
    { name:'Mintaka',         ra:5.5336,  dec:-0.2992,  mag:2.23,  sp:'O', con:'Orion',              desc:'Estrella derecha del cinturón de Orión. Casi exactamente en el ecuador celeste.' },
    { name:'Eltanin',         ra:17.9434, dec:51.4889,  mag:2.23,  sp:'K', con:'Draco',              desc:'La más brillante del Dragón. Gigante naranja a 148 años luz.' },
    { name:'Schedar',         ra:0.6751,  dec:56.5375,  mag:2.23,  sp:'K', con:'Cassiopeia',         desc:'El pecho de la Reina Casiopea. Gigante naranja levemente variable.' },
    { name:'Almach',          ra:2.0650,  dec:42.3297,  mag:2.26,  sp:'K', con:'Andromeda',          desc:'Sistema cuádruple en Andrómeda. Uno de los más bellos del cielo.' },
    { name:'Caph',            ra:0.1530,  dec:59.1497,  mag:2.27,  sp:'F', con:'Cassiopeia',         desc:'Extremo derecho del zigzag de Casiopea.' },
    { name:'Suhail',          ra:9.1331,  dec:-43.4328, mag:2.21,  sp:'K', con:'Vela',               desc:'Una de las más brillantes de las Velas. Supergigante naranja.' },
    { name:'Alphecca',        ra:15.5781, dec:26.7147,  mag:2.22,  sp:'A', con:'Corona Borealis',    desc:'La gema de la Corona Boreal. Binaria eclipsante a 75 años luz.' },
    { name:'Mizar',           ra:13.3988, dec:54.9253,  mag:2.23,  sp:'A', con:'Ursa Major',         desc:'El primer binario visual telescópico descubierto. Con Alcor forma par.' },
    { name:'Izar',            ra:14.7498, dec:27.0742,  mag:2.35,  sp:'K', con:'Boötes',             desc:'La Pulcrísima. Extraordinario sistema binario visual coloreado.' },
    { name:'Denebola',        ra:11.8177, dec:14.5722,  mag:2.14,  sp:'A', con:'Leo',                desc:'La cola del León. Estrella blanca tipo A a 36 años luz.' },
    { name:'Merak',           ra:11.0307, dec:56.3825,  mag:2.34,  sp:'A', con:'Ursa Major',         desc:'Puntero de Polaris junto con Dubhe. Borde del cucharón.' },
    { name:'Enif',            ra:21.7364, dec:9.8750,   mag:2.38,  sp:'K', con:'Pegasus',            desc:'El hocico del Caballo Alado. Supergigante naranja.' },
    { name:'Scheat',          ra:23.0629, dec:28.0828,  mag:2.44,  sp:'M', con:'Pegasus',            desc:'Hombro de Pegaso. Parte del Gran Cuadrado de Pegaso.' },
    { name:'Phecda',          ra:11.8972, dec:53.6947,  mag:2.44,  sp:'A', con:'Ursa Major',         desc:'El muslo de la Osa Mayor. Estrella blanca del cucharón.' },
    { name:'Alderamin',       ra:21.3097, dec:62.5856,  mag:2.45,  sp:'A', con:'Cepheus',            desc:'La más brillante de Cefeo. Futura Estrella Polar en ~5500 años.' },
    { name:'Sabik',           ra:17.1730, dec:-15.7250, mag:2.43,  sp:'A', con:'Ophiuchus',          desc:'Sistema binario en Ofiuco. Dos estrellas A muy similares.' },
    { name:'Markab',          ra:23.0793, dec:15.2053,  mag:2.49,  sp:'B', con:'Pegasus',            desc:'Esquina suroeste del Gran Cuadrado de Pegaso.' },
    { name:'Gienah',          ra:12.2635, dec:-17.5419, mag:2.59,  sp:'B', con:'Corvus',             desc:'La más brillante del Cuervo. Gigante azul a 165 años luz.' },
    { name:'Phact',           ra:5.6608,  dec:-34.0742, mag:2.64,  sp:'B', con:'Columba',            desc:'La más brillante de Columba la Paloma.' },
    { name:'Unukalhai',       ra:15.7378, dec:6.4256,   mag:2.63,  sp:'K', con:'Serpens',            desc:'El cuello de la Serpiente. Gigante naranja a 73 años luz.' },
    { name:'Zosma',           ra:11.2351, dec:20.5239,  mag:2.56,  sp:'A', con:'Leo',                desc:'El lomo del León. Estrella blanca tipo A.' },
    { name:'Arneb',           ra:5.5455,  dec:-17.8222, mag:2.58,  sp:'F', con:'Lepus',              desc:'La más brillante de la Liebre. Supergigante amarilla.' },
    { name:'Porrima',         ra:12.6943, dec:-1.4494,  mag:2.74,  sp:'F', con:'Virgo',              desc:'Sistema binario con dos estrellas casi idénticas. Muy bello al telescopio.' },
    { name:'Rastaban',        ra:17.5072, dec:52.3014,  mag:2.79,  sp:'G', con:'Draco',              desc:'El ojo del Dragón. Gigante amarilla a 380 años luz.' },
    { name:'Tarazed',         ra:19.7710, dec:10.6133,  mag:2.72,  sp:'K', con:'Aquila',             desc:'Vecina de Altair. Supergigante naranja en el Águila.' },
    { name:'Muphrid',         ra:13.9108, dec:18.3978,  mag:2.68,  sp:'G', con:'Boötes',             desc:'Cerca de Arcturus. Sistema binario en Boyero.' },
    { name:'Cor Caroli',      ra:12.9338, dec:38.3183,  mag:2.89,  sp:'A', con:'Canes Venatici',     desc:'El Corazón de Carlos. Estrella magnética peculiar con campos extremos.' },
    { name:'Algenib',         ra:0.2206,  dec:15.1836,  mag:2.83,  sp:'B', con:'Pegasus',            desc:'Esquina del Gran Cuadrado de Pegaso. Gigante azul pulsante.' },
    { name:'Sadalsuud',       ra:21.5260, dec:-5.5711,  mag:2.90,  sp:'G', con:'Aquarius',           desc:'La más brillante de Acuario. "La fortuna de las fortunas".' },
    { name:'Sadalmelik',      ra:22.0964, dec:-0.3197,  mag:2.95,  sp:'G', con:'Aquarius',           desc:'El hombro del Portador de Agua. Supergigante amarilla.' },
    { name:'Dschubba',        ra:16.0056, dec:-22.6217, mag:2.29,  sp:'B', con:'Scorpius',           desc:'La frente del Escorpión. Variable Be con disco de gas ecuatorial.' },
    { name:'Larawag',         ra:16.8360, dec:-34.2933, mag:2.29,  sp:'K', con:'Scorpius',           desc:'Parte del cuerpo del Escorpión. Gigante naranja a 65 años luz.' },
    { name:'Megrez',          ra:12.2571, dec:57.0328,  mag:3.31,  sp:'A', con:'Ursa Major',         desc:'Unión del mango con el cucharón de la Osa Mayor. La más tenue del asterismo.' },
    { name:'Thuban',          ra:14.0732, dec:64.3758,  mag:3.65,  sp:'A', con:'Draco',              desc:'Antigua Estrella Polar hace 4,700 años. Parte de la cola del Dragón.' },
    { name:'Navi',            ra:0.9451,  dec:60.7167,  mag:2.47,  sp:'B', con:'Cassiopeia',         desc:'Centro del zigzag de Casiopea. Variable gamma Cas con disco de gas.' },
    { name:'Ruchbah',         ra:1.4303,  dec:60.2353,  mag:2.66,  sp:'A', con:'Cassiopeia',         desc:'La rodilla de Casiopea. Binaria eclipsante.' },
    { name:'Segin',           ra:1.9066,  dec:63.6700,  mag:3.35,  sp:'B', con:'Cassiopeia',         desc:'Extremo del zigzag de Casiopea. Gigante azul-blanca.' },
    { name:'Algol',           ra:3.1361,  dec:40.9558,  mag:2.12,  sp:'B', con:'Perseus',            desc:'El Ojo del Demonio. La variable eclipsante prototipo. Varía cada 2.87 días.' },
    { name:'Sadr',            ra:20.3703, dec:40.2567,  mag:2.23,  sp:'F', con:'Cygnus',             desc:'El corazón del Cisne. Supergigante en el centro de la Cruz del Norte.' },
    { name:'Albireo',         ra:19.5122, dec:27.9597,  mag:3.09,  sp:'K', con:'Cygnus',             desc:'La cabeza del Cisne. Uno de los pares de colores más bellos: dorado y azul.' },
    { name:'Sulafat',         ra:18.9822, dec:32.6894,  mag:3.24,  sp:'A', con:'Lyra',               desc:'Parte de la Lira. Cercana a la Nebulosa del Anillo M57.' },
    { name:'Kaus Media',      ra:18.3489, dec:-29.8283, mag:2.70,  sp:'K', con:'Sagittarius',        desc:'El centro del arco de Sagitario. Gigante naranja-roja.' },
    { name:'Adhafera',        ra:10.2781, dec:23.4175,  mag:3.44,  sp:'F', con:'Leo',                desc:'Parte de la hoz del León. Supergigante amarillo-blanca.' },
    { name:'Nusakan',         ra:15.4636, dec:29.1058,  mag:3.65,  sp:'A', con:'Corona Borealis',    desc:'Beta de la Corona Boreal. Binaria espectroscópica.' },
    { name:'Mirach',          ra:1.1622,  dec:35.6203,  mag:2.06,  sp:'M', con:'Andromeda',          desc:'La cintura de Andrómeda. Próxima a la Galaxia de Andrómeda M31.' },
    { name:'Graffias',        ra:16.0908, dec:-19.8056, mag:2.50,  sp:'B', con:'Scorpius',           desc:'El corazón del Escorpión. Sistema múltiple visual impresionante.' },
    { name:'Aludra',          ra:7.4014,  dec:-29.3031, mag:2.45,  sp:'B', con:'Canis Major',        desc:'Supergigante azul en Can Mayor. Extremadamente luminosa.' },
    { name:'Acamar',          ra:2.9711,  dec:-40.3047, mag:2.91,  sp:'A', con:'Eridanus',           desc:'Antigua boca del río Eridanus. Par binario con separación visible.' },
    { name:'Ain',             ra:4.4767,  dec:19.1811,  mag:3.53,  sp:'K', con:'Taurus',             desc:'El ojo del Toro. Parte del cúmulo de las Híades. Tiene un exoplaneta.' },
    { name:'Mira',            ra:2.3224,  dec:-2.9775,  mag:3.04,  sp:'M', con:'Cetus',              desc:'La Maravillosa. Variable Mira prototipo: varía de mag 2 a 10 cada 332 días.' },
  ],

  // ═══════════════════════════════════════════════
  // PLANETAS
  // ═══════════════════════════════════════════════
  planets: [
    { name:'Mercurio', body:'Mercury', color:0x8C8C8C, colorHex:'#8C8C8C', radius:0.35, desc:'El planeta más pequeño y el más cercano al Sol.' },
    { name:'Venus',    body:'Venus',   color:0xE8DCC8, colorHex:'#E8DCC8', radius:0.85, desc:'El planeta más brillante del sistema solar. Envuelto en nubes de ácido sulfúrico.' },
    { name:'Marte',    body:'Mars',    color:0xC1440E, colorHex:'#C1440E', radius:0.50, desc:'El Planeta Rojo. Volcanes, cañones y el futuro destino humano.' },
    { name:'Júpiter',  body:'Jupiter', color:0xC88B3A, colorHex:'#C88B3A', radius:1.50, desc:'El planeta más grande. La Gran Mancha Roja lleva siglos activa.' },
    { name:'Saturno',  body:'Saturn',  color:0xE4D191, colorHex:'#E4D191', radius:1.20, desc:'El planeta de los anillos. Sus anillos tienen 400,000 km de diámetro.' },
    { name:'Urano',    body:'Uranus',  color:0x7DE8E8, colorHex:'#7DE8E8', radius:0.85, desc:'Gigante de hielo. Rota de lado a 98° de inclinación.' },
    { name:'Neptuno',  body:'Neptune', color:0x2B6CB0, colorHex:'#2B6CB0', radius:0.80, desc:'El planeta más ventoso: vientos de 2,100 km/h.' },
  ],

  // ═══════════════════════════════════════════════
  // OBJETOS MESSIER
  // ═══════════════════════════════════════════════
  messier: [
    { name:'M1',   ra:5.5756,  dec:22.0144,  mag:8.4, type:'Supernova',        con:'Taurus',       desc:'Nebulosa del Cangrejo. Remanente de la supernova de 1054 d.C.' },
    { name:'M3',   ra:13.7031, dec:28.3783,  mag:6.2, type:'Cúmulo Globular',  con:'Canes Venatici',desc:'Uno de los cúmulos globulares más ricos: 500,000 estrellas.' },
    { name:'M8',   ra:18.0622, dec:-24.3831, mag:6.0, type:'Nebulosa Emisión', con:'Sagittarius',  desc:'Nebulosa de la Laguna. Activa región de formación estelar.' },
    { name:'M13',  ra:16.6947, dec:36.4608,  mag:5.8, type:'Cúmulo Globular',  con:'Hercules',     desc:'El Gran Cúmulo de Hércules. ~300,000 estrellas en 145 años luz.' },
    { name:'M20',  ra:18.0472, dec:-22.9714, mag:8.5, type:'Nebulosa Emisión', con:'Sagittarius',  desc:'Nebulosa Trífida. Cuatro lóbulos de gas divididos por bandas de polvo.' },
    { name:'M27',  ra:19.9936, dec:22.7214,  mag:7.4, type:'Nebulosa Planet.', con:'Vulpecula',    desc:'Nebulosa de la Mancuerna. La primera nebulosa planetaria descubierta.' },
    { name:'M31',  ra:0.7122,  dec:41.2689,  mag:3.4, type:'Galaxia Espiral',  con:'Andromeda',    desc:'Galaxia de Andrómeda. 2.5 millones de años luz. Visible a simple vista.' },
    { name:'M42',  ra:5.5883,  dec:-5.3900,  mag:4.0, type:'Nebulosa Emisión', con:'Orion',        desc:'Nebulosa de Orión. Vivero estelar a 1,344 años luz. Visible a ojo desnudo.' },
    { name:'M45',  ra:3.7908,  dec:24.1167,  mag:1.6, type:'Cúmulo Abierto',   con:'Taurus',       desc:'Las Pléyades. Las Siete Hermanas. Cúmulo joven a 444 años luz.' },
    { name:'M51',  ra:13.4978, dec:47.1953,  mag:8.4, type:'Galaxia Espiral',  con:'Canes Venatici',desc:'Galaxia del Remolino. Primera galaxia espiral identificada (1845).' },
    { name:'M57',  ra:18.8931, dec:33.0289,  mag:8.8, type:'Nebulosa Planet.', con:'Lyra',         desc:'Nebulosa del Anillo. Remanente de una estrella como el Sol a 2,300 a.l.' },
    { name:'M64',  ra:12.9453, dec:21.6831,  mag:8.5, type:'Galaxia',          con:'Coma Berenices',desc:'Galaxia del Ojo Negro. Rotación interna inversa.' },
    { name:'M81',  ra:9.9256,  dec:69.0653,  mag:6.9, type:'Galaxia Espiral',  con:'Ursa Major',   desc:'Galaxia de Bode. Una de las más brillantes del cielo a 11.8 M. años luz.' },
    { name:'M82',  ra:9.9317,  dec:69.6797,  mag:8.4, type:'Galaxia Irregular',con:'Ursa Major',   desc:'Galaxia del Cigarro. Explosión de formación estelar intensa.' },
    { name:'M104', ra:12.6667, dec:-11.6231, mag:8.0, type:'Galaxia',          con:'Virgo',        desc:'Galaxia del Sombrero. Enorme bulbo galáctico y carril de polvo.' },
  ],

  // ═══════════════════════════════════════════════
  // LÍNEAS DE CONSTELACIONES
  // (pares de nombres de estrellas del catálogo)
  // ═══════════════════════════════════════════════
  constellationLines: [
    { name:'Orion', pairs:[
      ['Betelgeuse','Bellatrix'],['Betelgeuse','Alnitak'],
      ['Bellatrix','Mintaka'],['Mintaka','Alnilam'],['Alnilam','Alnitak'],
      ['Alnitak','Saiph'],['Mintaka','Rigel'],['Saiph','Rigel'],
      ['Bellatrix','Rigel']
    ]},
    { name:'Ursa Major', pairs:[
      ['Dubhe','Merak'],['Merak','Phecda'],['Phecda','Megrez'],
      ['Megrez','Alioth'],['Alioth','Mizar'],['Mizar','Alkaid'],
      ['Megrez','Dubhe']
    ]},
    { name:'Cassiopeia', pairs:[
      ['Caph','Schedar'],['Schedar','Navi'],['Navi','Ruchbah'],['Ruchbah','Segin']
    ]},
    { name:'Scorpius', pairs:[
      ['Graffias','Dschubba'],['Dschubba','Antares'],['Antares','Larawag'],
      ['Larawag','Sargas'],['Sargas','Shaula']
    ]},
    { name:'Leo', pairs:[
      ['Regulus','Algieba'],['Algieba','Adhafera'],['Algieba','Zosma'],
      ['Zosma','Denebola'],['Regulus','Denebola']
    ]},
    { name:'Gemini', pairs:[
      ['Castor','Pollux'],['Castor','Alhena'],['Pollux','Alhena']
    ]},
    { name:'Cygnus', pairs:[
      ['Deneb','Sadr'],['Sadr','Albireo'],['Sadr','Vega']
    ]},
    { name:'Lyra', pairs:[
      ['Vega','Sulafat']
    ]},
    { name:'Taurus', pairs:[
      ['Aldebaran','El Nath'],['Aldebaran','Ain']
    ]},
    { name:'Pegasus', pairs:[
      ['Markab','Scheat'],['Scheat','Alpheratz'],['Alpheratz','Algenib'],
      ['Algenib','Markab'],['Markab','Enif']
    ]},
    { name:'Andromeda', pairs:[
      ['Alpheratz','Mirach'],['Mirach','Almach']
    ]},
    { name:'Perseus', pairs:[
      ['Mirfak','Algol']
    ]},
    { name:'Sagittarius', pairs:[
      ['Kaus Australis','Kaus Media'],['Kaus Media','Nunki'],
      ['Kaus Australis','Nunki']
    ]},
    { name:'Boötes', pairs:[
      ['Arcturus','Izar'],['Arcturus','Muphrid']
    ]},
    { name:'Virgo', pairs:[
      ['Spica','Porrima']
    ]},
    { name:'Draco', pairs:[
      ['Eltanin','Rastaban'],['Rastaban','Thuban']
    ]},
    { name:'Corona Borealis', pairs:[
      ['Alphecca','Nusakan']
    ]},
    { name:'Aquila', pairs:[
      ['Altair','Tarazed']
    ]},
    { name:'Ursa Minor', pairs:[
      ['Polaris','Kochab']
    ]},
    { name:'Scorpius (cola)', pairs:[
      ['Shaula','Sargas']
    ]},
  ]
};

// Build a fast lookup map by star name
CATALOG.starMap = {};
CATALOG.stars.forEach(s => { CATALOG.starMap[s.name] = s; });
