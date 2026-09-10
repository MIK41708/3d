// --- REGISTRO DO SCROLLTRIGGER DO GSAP ---
gsap.registerPlugin(ScrollTrigger);

// --- CENA THREE.JS ---
const container = document.getElementById('webgl-container');
const scene = new THREE.Scene();

// Câmera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 8);

// Renderizador com suporte a Alpha
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// --- ILUMINAÇÃO DE ESTÚDIO 3D ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0x00e5ff, 5);
spotLight.position.set(0, 12, -5);
spotLight.angle = Math.PI / 3;
spotLight.penumbra = 0.8;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 2048;
spotLight.shadow.mapSize.height = 2048;
scene.add(spotLight);

const fillLight = new THREE.PointLight(0xff6b35, 2, 20);
fillLight.position.set(-6, -2, 4);
scene.add(fillLight);

const shadowFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.ShadowMaterial({ opacity: 0.3 })
);
shadowFloor.rotation.x = -Math.PI / 2;
shadowFloor.position.y = -4;
shadowFloor.receiveShadow = true;
scene.add(shadowFloor);

// --- CONSTRUÇÃO DO MODELO ATÔMICO 3D (BORO B11) ---
const atomGroup = new THREE.Group();
scene.add(atomGroup);

const protonMaterial = new THREE.MeshStandardMaterial({
  color: 0xff3366,
  roughness: 0.2,
  metalness: 0.5,
  emissive: 0x550011,
  emissiveIntensity: 0.2
});

const neutronMaterial = new THREE.MeshStandardMaterial({
  color: 0x4488ff,
  roughness: 0.3,
  metalness: 0.3,
  emissive: 0x001144,
  emissiveIntensity: 0.2
});

const electronMaterial = new THREE.MeshStandardMaterial({
  color: 0x00e5ff,
  roughness: 0.1,
  metalness: 0.9,
  emissive: 0x00e5ff,
  emissiveIntensity: 0.8
});

const orbitMaterial = new THREE.LineBasicMaterial({
  color: 0x00e5ff,
  transparent: true,
  opacity: 0.25
});

window.updateAtomPalette = (mode) => {
  const palettes = {
    standard: { proton: 0xff3366, neutron: 0x4488ff, electron: 0x00e5ff, orbit: 0x00e5ff },
    protanopia: { proton: 0xe69f00, neutron: 0x0072b2, electron: 0x009e73, orbit: 0x0072b2 },
    deuteranopia: { proton: 0xd55e00, neutron: 0x0072b2, electron: 0x56b4e9, orbit: 0x0072b2 },
    tritanopia: { proton: 0xd55e00, neutron: 0x009e73, electron: 0x0072b2, orbit: 0x009e73 }
  };
  const palette = palettes[mode] || palettes.standard;
  protonMaterial.color.setHex(palette.proton);
  neutronMaterial.color.setHex(palette.neutron);
  electronMaterial.color.setHex(palette.electron);
  electronMaterial.emissive.setHex(palette.electron);
  orbitMaterial.color.setHex(palette.orbit);
};

const spheres = [];
const sphereGeo = new THREE.SphereGeometry(0.32, 32, 32);
const particleCount = 11;

for (let i = 0; i < particleCount; i++) {
  const isProton = i % 2 === 0;
  const mesh = new THREE.Mesh(sphereGeo, isProton ? protonMaterial : neutronMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const phi = Math.acos(-1 + (2 * i) / particleCount);
  const theta = Math.sqrt(particleCount * Math.PI) * phi;
  const radius = 0.55;

  const basePos = new THREE.Vector3(
    radius * Math.cos(theta) * Math.sin(phi),
    radius * Math.sin(theta) * Math.sin(phi),
    radius * Math.cos(phi)
  );

  mesh.position.copy(basePos);
  const explodePos = basePos.clone().multiplyScalar(4.5);
  atomGroup.add(mesh);

  spheres.push({ mesh, basePos, explodePos });
}

const electronGroup = new THREE.Group();
atomGroup.add(electronGroup);

const orbitRaddi = [2.2, 2.2, 3.8, 3.8, 3.8];
const orbitRotations = [
  { x: Math.PI / 4, y: 0 },
  { x: -Math.PI / 4, y: Math.PI / 3 },
  { x: Math.PI / 2, y: 0 },
  { x: 0, y: Math.PI / 3 },
  { x: Math.PI / 3, y: -Math.PI / 3 }
];

const electronMeshes = [];

orbitRaddi.forEach((radius, i) => {
  const orbitRing = new THREE.Group();
  orbitRing.rotation.x = orbitRotations[i].x;
  orbitRing.rotation.y = orbitRotations[i].y;

  const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0);
  const points = curve.getPoints(64);
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(
    points.map(p => new THREE.Vector3(p.x, p.y, 0))
  );
  const orbitLine = new THREE.Line(orbitGeo, orbitMaterial);
  orbitRing.add(orbitLine);

  const electronGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const electron = new THREE.Mesh(electronGeo, electronMaterial);
  electron.castShadow = true;
  orbitRing.add(electron);

  electronGroup.add(orbitRing);

  electronMeshes.push({
    mesh: electron,
    radius: radius,
    speed: 1.5 + i * 0.5,
    angle: (i * Math.PI * 2) / 5,
    orbitRing: orbitRing
  });
});

// --- ANIMAÇÃO DE SCROLL GSAP ---
const timeline = gsap.timeline({
  scrollTrigger: {
    trigger: ".scroll-track",
    start: "top top",
    end: "bottom bottom",
    scrub: 1
  }
});

timeline.to(camera.position, { z: 14, y: 2, duration: 2, ease: "power2.inOut" }, 0);

spheres.forEach(item => {
  timeline.to(item.mesh.position, {
    x: item.explodePos.x,
    y: item.explodePos.y,
    z: item.explodePos.z,
    duration: 2.5,
    ease: "power3.out"
  }, 1.5);
});

electronMeshes.forEach(item => {
  timeline.to(item.orbitRing.scale, {
    x: 1.8, y: 1.8, z: 1.8,
    duration: 2.5,
    ease: "power3.out"
  }, 1.5);
});

timeline.to(atomGroup.rotation, {
  y: Math.PI * 2,
  x: Math.PI * 0.2,
  duration: 4,
  ease: "none"
}, 2);

// --- INTERATIVIDADE MOUSE ---
let mouseX = 0;
let mouseY = 0;
const bgStudio = document.getElementById('studio-background');

window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

  gsap.to(spotLight.position, {
    x: mouseX * 8,
    y: 12 + mouseY * 4,
    duration: 0.8,
    ease: "power2.out"
  });

  const moveX = 50 + mouseX * 15;
  const moveY = 40 - mouseY * 15;
  const studioColors = getComputedStyle(document.documentElement);
  bgStudio.style.background = `radial-gradient(circle at ${moveX}% ${moveY}%, ${studioColors.getPropertyValue('--studio-a')} 0%, ${studioColors.getPropertyValue('--studio-b')} 70%, ${studioColors.getPropertyValue('--studio-c')} 100%)`;
});

// --- LOOP DE RENDERIZAÇÃO ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsedTime = clock.getElapsedTime();

  electronMeshes.forEach(item => {
    item.angle += 0.02 * item.speed;
    item.mesh.position.x = Math.cos(item.angle) * item.radius;
    item.mesh.position.y = Math.sin(item.angle) * item.radius;
  });

  atomGroup.rotation.z = elapsedTime * 0.05;
  camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- CONTROLE DO TAMANHO DA FONTE (100% - 200%) ---
let fontSizePercent = parseInt(localStorage.getItem('quimica-font-size')) || 100;
const FONT_MIN = 100;
const FONT_MAX = 200;
const FONT_STEP = 10;

function applyFontSize(size) {
  fontSizePercent = Math.max(FONT_MIN, Math.min(FONT_MAX, size));
  document.documentElement.style.fontSize = `${fontSizePercent}%`;

  const sizeDisplay = document.getElementById('porcentagem-atual');
  if (sizeDisplay) sizeDisplay.textContent = `${fontSizePercent}%`;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  localStorage.setItem('quimica-font-size', fontSizePercent);
}

document.getElementById('btn-aumentar-fonte')?.addEventListener('click', () => applyFontSize(fontSizePercent + FONT_STEP));
document.getElementById('btn-diminuir-fonte')?.addEventListener('click', () => applyFontSize(fontSizePercent - FONT_STEP));
applyFontSize(fontSizePercent);

// --- MODAIS E PERFIL ---
const accountButton = document.getElementById('accountButton');
const accountModal = document.getElementById('accountModal');
const profileModal = document.getElementById('profileModal');
const accountForm = document.getElementById('accountForm');
const storedUser = () => JSON.parse(localStorage.getItem('quimica-user') || 'null');
let signUpMode = false;

function updateProfile() {
  const user = storedUser();
  const name = user ? user.name : 'Visitante';
  document.getElementById('accountLabel').textContent = user ? 'Perfil' : 'Cadastrar';
  document.getElementById('profileName').textContent = name;
  document.getElementById('profileNameInput').value = user ? name : '';
  const photo = localStorage.getItem('quimica-profile-image');
  document.querySelectorAll('#headerAvatar, #profileAvatar').forEach((avatar) => {
    avatar.innerHTML = photo ? `<img src="${photo}" alt="Foto" style="width:100%;height:100%;border-radius:50%">` : name.charAt(0).toUpperCase();
  });
}

function openSignup() {
  signUpMode = true;
  document.getElementById('nameField').hidden = false;
  document.getElementById('accountTitle').textContent = 'Cadastro';
  document.getElementById('accountSubmit').textContent = 'Cadastrar';
  accountModal.classList.add('open');
}

accountButton.addEventListener('click', () => {
  const user = storedUser();
  if (user) {
    profileModal.classList.add('open');
  } else {
    openSignup();
  }
});

document.getElementById('profileButton').addEventListener('click', () => profileModal.classList.add('open'));
document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => document.getElementById(button.dataset.close).classList.remove('open')));
document.querySelectorAll('.modal-backdrop').forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.remove('open'); }));

document.getElementById('switchAccount').addEventListener('click', () => {
  signUpMode = !signUpMode;
  document.getElementById('nameField').hidden = !signUpMode;
  document.getElementById('accountTitle').textContent = signUpMode ? 'Cadastro' : 'Entrar';
  document.getElementById('accountSubmit').textContent = signUpMode ? 'Cadastrar' : 'Entrar';
});

accountForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.getElementById('accountEmail').value;
  const name = signUpMode ? document.getElementById('accountName').value || email.split('@')[0] : email.split('@')[0];
  localStorage.setItem('quimica-user', JSON.stringify({ name, email }));
  accountModal.classList.remove('open');
  updateProfile();
});

document.getElementById('logoutButton').addEventListener('click', () => {
  localStorage.removeItem('quimica-user');
  localStorage.removeItem('quimica-profile-image');
  profileModal.classList.remove('open');
  updateProfile();
});

// --- TEMAS E CORES ---
document.getElementById('themeButton').addEventListener('click', () => {
  const light = document.documentElement.dataset.theme === 'light';
  document.documentElement.dataset.theme = light ? 'dark' : 'light';
  document.getElementById('themeButton').textContent = light ? 'Modo claro' : 'Modo escuro';
  localStorage.setItem('quimica-theme', light ? 'dark' : 'light');
});

const savedTheme = localStorage.getItem('quimica-theme') || 'dark';
document.documentElement.dataset.theme = savedTheme;

const colorModes = ['standard', 'protanopia', 'deuteranopia', 'tritanopia'];
let currentColorMode = localStorage.getItem('quimica-color-mode') || 'standard';

function applyColorMode(mode) {
  currentColorMode = mode;
  document.documentElement.dataset.colorMode = mode === 'standard' ? '' : mode;
  if (window.updateAtomPalette) window.updateAtomPalette(mode);
  localStorage.setItem('quimica-color-mode', mode);
}

document.getElementById('colorButton').addEventListener('click', () => {
  const currentIndex = colorModes.indexOf(currentColorMode);
  applyColorMode(colorModes[(currentIndex + 1) % colorModes.length]);
});
applyColorMode(currentColorMode);
updateProfile();