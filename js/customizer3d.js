// ============================================================
// MODYSOLE — 3D Customizer Logic
// ============================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ── Sport Presets ──
const SPORTS = {
  cricket:    { name: 'Cricket Spike',       emoji: '🏏', upper: '#1A1A2E', laces: '#FFFFFF', price: 499 },
  football:   { name: 'Football Velocity',   emoji: '⚽', upper: '#0057FF', laces: '#FFFFFF', price: 499 },
  tennis:     { name: 'Tennis Court Master',  emoji: '🎾', upper: '#00C853', laces: '#FFD700', price: 499 },
  basketball: { name: 'Basketball Dominator', emoji: '🏀', upper: '#FF6B2B', laces: '#000000', price: 499 },
  running:    { name: 'Running Aero',         emoji: '🏃', upper: '#E91E63', laces: '#FFFFFF', price: 499 },
};

const MODEL_URL = 'https://raw.githubusercontent.com/washington254/shoe-customizer/master/shoe.glb';
const BASE_PRICE = 2499;
const SOLE_PRICE = 499;

// ── State ──
let currentSport = 'cricket';
let soleQty = 1;
let soleLimit = 3;
let pendingQtyChange = 0;

// ── Three.js Setup ──
const canvas = document.getElementById('shoe-canvas');
const loadingEl = document.getElementById('viewer-loading');
const hintEl = document.getElementById('viewer-hint');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(2.5, 1.5, 3);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(5, 5, 5); scene.add(key);
const fill = new THREE.DirectionalLight(0x4488ff, 0.4); fill.position.set(-3, 2, -3); scene.add(fill);
const rim = new THREE.DirectionalLight(0x00D4FF, 0.3); rim.position.set(0, -2, -5); scene.add(rim);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 8;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.5;
controls.target.set(0, 0.5, 0);
controls.addEventListener('start', () => {
  controls.autoRotate = false;
  if (hintEl) hintEl.style.opacity = '0';
});

// ── Material Groups ──
let upperMats = [];
let soleMats = [];
let laceMats = [];

// ── Load Model ──
const loader = new GLTFLoader();
loader.load(
  MODEL_URL,
  (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(...box.getSize(new THREE.Vector3()).toArray());
    model.scale.setScalar(2.5 / maxDim);
    model.position.sub(center.multiplyScalar(2.5 / maxDim));
    model.position.y -= 0.3;

    // Categorize meshes
    const allMeshes = [];
    model.traverse(c => {
      if (c.isMesh && c.material) {
        c.material = c.material.clone();
        allMeshes.push(c);
      }
    });

    // Try name-based classification first
    allMeshes.forEach(mesh => {
      const n = (mesh.name || '').toLowerCase();
      if (n.includes('sole') || n.includes('bottom') || n.includes('outsole') || n.includes('rubber')) {
        soleMats.push(mesh.material);
      } else if (n.includes('lace') || n.includes('string') || n.includes('tongue')) {
        laceMats.push(mesh.material);
      } else {
        upperMats.push(mesh.material);
      }
    });

    // Fallback: split by index
    if (upperMats.length === 0 && soleMats.length === 0) {
      allMeshes.forEach((mesh, i) => {
        if (i < allMeshes.length * 0.6) upperMats.push(mesh.material);
        else if (i < allMeshes.length * 0.85) soleMats.push(mesh.material);
        else laceMats.push(mesh.material);
      });
    }

    scene.add(model);
    loadingEl.classList.add('hidden');

    // Apply initial sport preset
    applySportPreset('cricket');
    // Force sole to white
    applyColor(soleMats, '#FFFFFF');
  },
  (xhr) => {
    const pct = Math.round((xhr.loaded / (xhr.total || 1)) * 100);
    loadingEl.querySelector('p').textContent = `Loading 3D model... ${pct}%`;
  },
  (err) => {
    console.error('Model load error:', err);
    loadingEl.querySelector('p').textContent = 'Could not load 3D model. Check internet.';
    loadingEl.querySelector('.spinner').style.display = 'none';
  }
);

// ── Color Helpers ──
function applyColor(mats, hex) {
  const c = new THREE.Color(hex);
  mats.forEach(m => { m.color.copy(c); m.needsUpdate = true; });
}

function applySportPreset(sport) {
  const preset = SPORTS[sport];
  if (!preset) return;
  applyColor(upperMats, preset.upper);
  applyColor(laceMats, preset.laces);
  applyColor(soleMats, '#FFFFFF'); // Always white

  // Update active swatch
  document.querySelectorAll('#upper-colors .color-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === preset.upper);
  });
  document.querySelectorAll('#lace-colors .color-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === preset.laces);
  });

  // Update label
  const label = document.getElementById('sport-label');
  if (label) label.textContent = `${preset.emoji} ${preset.name}`;
}

// ── Sport Selection ──
window.selectSport = function(sport, btn) {
  currentSport = sport;
  document.querySelectorAll('.sport-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applySportPreset(sport);

  // Brief auto-rotate burst
  controls.autoRotate = true;
  setTimeout(() => { controls.autoRotate = false; }, 3000);
};

// ── Swatch Clicks ──
document.querySelectorAll('.color-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    const part = swatch.dataset.part;
    const hex = swatch.dataset.color;
    swatch.closest('.color-swatches').querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    if (part === 'upper') applyColor(upperMats, hex);
    else if (part === 'laces') applyColor(laceMats, hex);
    // Sole is locked white — no swatch for it
  });
});

// ── Sole Quantity ──
function updateQtyUI() {
  document.getElementById('sole-qty').textContent = soleQty;
  document.getElementById('price-qty').textContent = soleQty;
  document.getElementById('price-soles').textContent = (soleQty * SOLE_PRICE).toLocaleString('en-IN');
  document.getElementById('price-total').textContent = (BASE_PRICE + soleQty * SOLE_PRICE).toLocaleString('en-IN');

  const info = document.getElementById('qty-info');
  info.textContent = `${soleQty} of ${soleLimit} soles selected`;
  info.className = 'qty-info';
  if (soleQty >= soleLimit) info.classList.add('warning');
  if (soleQty > soleLimit) { info.classList.remove('warning'); info.classList.add('exceeded'); info.textContent += ' ⚠️ Limit exceeded'; }
}

window.changeSoleQty = function(delta) {
  const newQty = soleQty + delta;
  if (newQty < 1) return;

  // If increasing beyond limit, show confirmation
  if (delta > 0 && newQty > soleLimit) {
    pendingQtyChange = delta;
    const msg = document.getElementById('limit-msg');
    msg.textContent = `You set a limit of ${soleLimit} sole${soleLimit > 1 ? 's' : ''}. Adding another will bring you to ${newQty}. Continue?`;
    document.getElementById('limitModal').classList.add('open');
    return;
  }

  soleQty = newQty;
  updateQtyUI();
};

window.confirmExceedLimit = function() {
  soleQty += pendingQtyChange;
  pendingQtyChange = 0;
  document.getElementById('limitModal').classList.remove('open');
  updateQtyUI();
  if (typeof showToast === 'function') showToast(`⚠️ Sole limit exceeded — now at ${soleQty}`, 'success');
};

window.closeLimitModal = function() {
  pendingQtyChange = 0;
  document.getElementById('limitModal').classList.remove('open');
};

window.updateLimit = function() {
  const input = document.getElementById('sole-limit');
  soleLimit = Math.max(1, Math.min(20, parseInt(input.value) || 3));
  input.value = soleLimit;
  updateQtyUI();
};

// ── Reset ──
window.resetCustomizer = function() {
  soleQty = 1;
  soleLimit = 3;
  document.getElementById('sole-limit').value = 3;
  currentSport = 'cricket';
  document.querySelectorAll('.sport-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.sport-btn[data-sport="cricket"]')?.classList.add('active');
  applySportPreset('cricket');
  updateQtyUI();
  controls.autoRotate = true;
};

// ── Add to Cart ──
window.addDesignToCart = function() {
  const preset = SPORTS[currentSport];
  const total = BASE_PRICE + soleQty * SOLE_PRICE;
  if (typeof window.addToCart === 'function') {
    window.addToCart(
      `custom-${currentSport}-${Date.now()}`,
      `${preset.name} + ${soleQty} sole${soleQty > 1 ? 's' : ''}`,
      total,
      'images/cricket-shoe.png'
    );
  }
};

// ── Animation Loop ──
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ── Resize ──
function resize() {
  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', resize);
setTimeout(resize, 100);

// ── Init UI ──
updateQtyUI();
