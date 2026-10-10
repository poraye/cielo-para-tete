/***********************
 * CONFIG FÁCIL DE EDITAR
 ***********************/
const RELATION_START = "2022-08-10T00:00:00"; // Fecha inicio
const NICKNAME = "Tete"; // Apodo

/***********************
 * Fondo estrellado
 ***********************/
const starsCanvas = document.getElementById("starsBg");
const sctx = starsCanvas.getContext("2d");
let sw, sh, stars;

function resizeStars() {
  sw = starsCanvas.width = window.innerWidth;
  sh = starsCanvas.height = window.innerHeight;
  const n = Math.floor((sw * sh) / 11000);
  stars = Array.from({ length: n }, () => ({
    x: Math.random() * sw,
    y: Math.random() * sh,
    r: Math.random() * 1.6 + 0.2,
    a: Math.random()
  }));
}

function drawStars(t) {
  sctx.clearRect(0, 0, sw, sh);
  for (const st of stars) {
    sctx.beginPath();
    sctx.fillStyle = `rgba(220,232,255,${0.25 + st.a * 0.7 + Math.sin(t * 0.001 + st.x) * 0.15})`;
    sctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
    sctx.fill();
  }
  requestAnimationFrame(drawStars);
}

/***********************
 * Contador de tiempo juntos
 ***********************/
const counter = document.getElementById("counter");
const milestone = document.getElementById("milestone");
const nextAnniversary = document.getElementById("nextAnniversary");
const currentDate = document.getElementById("currentDate");
const startDate = new Date(RELATION_START);

function addCalendarMonths(date, months) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

function formatDurationMonths(months) {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? "año" : "años"}`);
  if (remainingMonths || !years) parts.push(`${remainingMonths} ${remainingMonths === 1 ? "mes" : "meses"}`);
  return parts.join(" · ");
}

function updateCounter() {
  const now = new Date();
  currentDate.textContent = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(now).toLocaleUpperCase("es-MX");
  const elapsed = Math.max(0, now - startDate);
  let completedMonths = Math.max(
    0,
    (now.getFullYear() - startDate.getFullYear()) * 12
      + now.getMonth() - startDate.getMonth()
  );
  if (addCalendarMonths(startDate, completedMonths) > now) completedMonths--;

  const elapsedSinceMonth = Math.max(0, now - addCalendarMonths(startDate, completedMonths));
  const days = Math.floor(elapsedSinceMonth / (1000 * 60 * 60 * 24));
  const hours = Math.floor(elapsedSinceMonth / (1000 * 60 * 60)) % 24;
  const minutes = Math.floor(elapsedSinceMonth / (1000 * 60)) % 60;
  const seconds = Math.floor(elapsedSinceMonth / 1000) % 60;
  const nextMonth = completedMonths + 1;
  const nextDate = addCalendarMonths(startDate, nextMonth);

  milestone.textContent = formatDurationMonths(completedMonths);
  nextAnniversary.textContent =
    `Próximo mesiversario: ${formatDurationMonths(nextMonth)} · ${new Intl.DateTimeFormat("es", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(nextDate)}`;
  counter.innerHTML = `
    <b>Y seguimos sumando:</b><br>
    ${days} días, ${hours}h ${minutes}m ${seconds}s desde nuestro último mesiversario ♡
  `;
}

/***********************
 * Mostrar/ocultar mensaje
 ***********************/
const toggleMsgBtn = document.getElementById("toggleMsg");
const loveMsg = document.getElementById("loveMsg");

toggleMsgBtn.addEventListener("click", () => {
  const isExpanded = toggleMsgBtn.getAttribute("aria-expanded") === "true";
  toggleMsgBtn.setAttribute("aria-expanded", String(!isExpanded));
  loveMsg.hidden = isExpanded;
  document.getElementById("messageCardTitle").textContent =
    isExpanded ? "Un mensaje para ti" : "Tu mensaje especial";
  document.getElementById("messageCardHint").textContent =
    isExpanded ? "Toca aquí para descubrirlo" : "Toca para guardar el secreto";
});

/***********************
 * Modal + Sistema Solar (canvas)
 ***********************/
const modal = document.getElementById("solarModal");
const openSolar = document.getElementById("openSolar");
const closeSolar = document.getElementById("closeSolar");

const solarCanvas = document.getElementById("solarCanvas");
const ctx = solarCanvas.getContext("2d");

const toggleRunBtn = document.getElementById("toggleRun");
const speedDownBtn = document.getElementById("speedDown");
const speedUpBtn = document.getElementById("speedUp");

let w, h, cx, cy, dpr;
let rafSolar;
let running = true;
let speed = 1;

let aMoon = 0;
let aLucia = 0;

const planets = [
  { name: "Mercurio", orbitX: 55, orbitY: 43, radius: 4, color: "#b9a38d", speed: 0.018, angle: 0.4 },
  { name: "Venus", orbitX: 85, orbitY: 66, radius: 7, color: "#e8c27a", speed: 0.014, angle: 1.8 },
  { name: "Tierra", orbitX: 120, orbitY: 92, radius: 8, color: "#4ea1ff", speed: 0.010, angle: 3.1 },
  { name: "Marte", orbitX: 155, orbitY: 120, radius: 6, color: "#e6785b", speed: 0.008, angle: 4.4 },
  { name: "Júpiter", orbitX: 230, orbitY: 178, radius: 14, color: "#d9b188", speed: 0.004, angle: 2.5 },
  { name: "Saturno", orbitX: 275, orbitY: 213, radius: 12, color: "#e5d0a0", speed: 0.003, angle: 5.2 }
];

const asteroidBelt = Array.from({ length: 220 }, () => ({
  angle: Math.random() * Math.PI * 2,
  orbitX: 178 + Math.random() * 28,
  size: 0.45 + Math.random() * 0.8,
  alpha: 0.2 + Math.random() * 0.4
}));

function resizeSolarCanvas() {
  const rect = solarCanvas.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  solarCanvas.width = rect.width * dpr;
  solarCanvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  w = rect.width;
  h = rect.height;
  cx = w / 2;
  cy = h / 2;
  solarScale = Math.min(1.25, (w / 2 - 65) / 275, (h / 2 - 40) / 213);
  solarScale = Math.max(0.15, solarScale);
}

function drawOrbit(rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.setLineDash([4, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBody(x, y, r, color, glow = 0) {
  if (glow) {
    ctx.shadowBlur = glow;
    ctx.shadowColor = color;
  }
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawJupiter(x, y, r) {
  // cuerpo base
  drawBody(x, y, r, "#d9b188", 10);

  // bandas simples
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  const bands = ["#e7c8a5", "#cfa27a", "#b98560", "#d9b188"];
  for (let i = -2; i <= 2; i++) {
    ctx.fillStyle = bands[(i + 2) % bands.length];
    ctx.fillRect(x - r, y + i * (r / 2.2), r * 2, r / 3.5);
  }
  ctx.restore();
}

function drawLabel(text, x, y, color = "#dce8ff", offsetX = 7, offsetY = -7) {
  ctx.fillStyle = color;
  ctx.font = `600 ${Math.max(10, 13 * solarScale)}px Segoe UI`;
  ctx.fillText(text, x + offsetX * solarScale, y + offsetY * solarScale);
}

let solarScale = 1;

function renderSolarSystem() {
  ctx.clearRect(0, 0, w, h);
  const orbitScale = (orbitX, orbitY) => [orbitX * solarScale, orbitY * solarScale];

  for (const planet of planets) {
    const [orbitX, orbitY] = orbitScale(planet.orbitX, planet.orbitY);
    drawOrbit(orbitX, orbitY, "rgba(190,210,255,.22)");
  }
  for (const asteroid of asteroidBelt) {
    const x = cx + Math.cos(asteroid.angle) * asteroid.orbitX * solarScale;
    const y = cy + Math.sin(asteroid.angle) * asteroid.orbitX * 0.77 * solarScale;
    ctx.beginPath();
    ctx.fillStyle = `rgba(205,190,173,${asteroid.alpha})`;
    ctx.arc(x, y, asteroid.size * solarScale, 0, Math.PI * 2);
    ctx.fill();
  }
  const [luciaOrbitX, luciaOrbitY] = orbitScale(190, 147);
  drawOrbit(luciaOrbitX, luciaOrbitY, "rgba(255,170,210,.35)");

  // Sol
  drawBody(cx, cy, 22 * solarScale, "#ffcf66", 24 * solarScale);
  drawLabel("Sol", cx, cy, "#ffe5b8", -14, -30);

  let earthPosition;
  for (const planet of planets) {
    const orbitX = planet.orbitX * solarScale;
    const orbitY = planet.orbitY * solarScale;
    const x = cx + Math.cos(planet.angle) * orbitX;
    const y = cy + Math.sin(planet.angle) * orbitY;
    const radius = Math.max(2.5, planet.radius * solarScale);

    if (planet.name === "Saturno") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.8, radius * 0.65, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "#d9bd87";
      ctx.lineWidth = Math.max(1, 3 * solarScale);
      ctx.stroke();
      ctx.restore();
    }

    if (planet.name === "Júpiter") {
      drawJupiter(x, y, radius);
    } else {
      drawBody(x, y, radius, planet.color, 8 * solarScale);
    }
    if (planet.name === "Tierra") earthPosition = { x, y };
    if (running) planet.angle += planet.speed * speed;
  }

  if (earthPosition) {
    const moonX = earthPosition.x + Math.cos(aMoon) * 18 * solarScale;
    const moonY = earthPosition.y + Math.sin(aMoon) * 18 * solarScale;
    drawBody(moonX, moonY, Math.max(2, 3.5 * solarScale), "#e9eefc", 5 * solarScale);
  }

  const luciaX = cx + Math.cos(aLucia) * luciaOrbitX;
  const luciaY = cy + Math.sin(aLucia) * luciaOrbitY;
  drawBody(luciaX, luciaY, Math.max(3, 6 * solarScale), "#ff9ecf", 14 * solarScale);
  drawLabel(`(222) Lucia · ${NICKNAME}`, luciaX, luciaY, "#ffd7ea", 12, -10);

  // Avance
  if (running) {
    aMoon += 0.060 * speed;
    aLucia += 0.006 * speed;
  }

  rafSolar = requestAnimationFrame(renderSolarSystem);
}

function openModal() {
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  resizeSolarCanvas();
  cancelAnimationFrame(rafSolar);
  renderSolarSystem();
}

function closeModalFn() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  cancelAnimationFrame(rafSolar);
}

// eventos modal
openSolar.addEventListener("click", openModal);
closeSolar.addEventListener("click", closeModalFn);

// cerrar clic fuera
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModalFn();
});

// cerrar con ESC
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("show")) {
    closeModalFn();
  }
});

// resize modal canvas
window.addEventListener("resize", () => {
  resizeStars();
  if (modal.classList.contains("show")) resizeSolarCanvas();
});

// controles
toggleRunBtn.addEventListener("click", () => {
  running = !running;
  toggleRunBtn.textContent = running ? "Pausar ⏸️" : "Reanudar ▶️";
});

speedUpBtn.addEventListener("click", () => {
  speed = Math.min(3, +(speed + 0.2).toFixed(1));
});

speedDownBtn.addEventListener("click", () => {
  speed = Math.max(0.4, +(speed - 0.2).toFixed(1));
});

/***********************
 * Init
 ***********************/
resizeStars();
requestAnimationFrame(drawStars);
updateCounter();
setInterval(updateCounter, 1000);