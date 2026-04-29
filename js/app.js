// ============================================================
// MODYSOLE — Main App JS
// Supabase connected: ditvoeoedhldsbgnkhrx.supabase.co
// ============================================================

// ---- SUPABASE CONFIG ----
const SUPABASE_URL = 'https://ditvoeoedhldsbgnkhrx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_X3tYNz99P6fzrCUCzxij_A_h_NDT4o4';
const USE_SUPABASE = true;
// -------------------------

let supabaseClient = null;

function initSupabase() {
  if (USE_SUPABASE && typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase connected');
  } else {
    console.warn('⚠️ Supabase SDK not loaded — using local data');
  }
}

// ===================== CART STATE =====================
let cart = JSON.parse(localStorage.getItem('ms_cart')) || [];

function saveCart() {
  localStorage.setItem('ms_cart', JSON.stringify(cart));
}

function updateCartCount() {
  document.querySelectorAll('#cart-count').forEach(el => el.textContent = cart.length);
}

// ===================== LOCAL FALLBACK PRODUCTS =====================
const localProducts = [
  {
    id: '1',
    name: 'Cricket Pro Spike',
    category: 'sports',
    tag: 'Sports Grip',
    price: 1430,
    old_price: 1800,
    img: 'images/cricket-shoe.png',
    rating: 4.8,
    reviews: 142,
    badge: 'Best Seller',
    badge_type: 'in-stock'
  },
  {
    id: '2',
    name: 'Football Velocity',
    category: 'sports',
    tag: 'Sports Grip',
    price: 1400,
    old_price: 1700,
    img: 'images/football-shoe.png',
    rating: 4.7,
    reviews: 98,
    badge: 'In Stock',
    badge_type: 'in-stock'
  },
  {
    id: '3',
    name: 'Tennis Court Master',
    category: 'sports',
    tag: 'Sports Grip',
    price: 1800,
    old_price: 2200,
    img: 'images/tennis-shoe.jpeg',
    rating: 4.9,
    reviews: 203,
    badge: 'Low Stock',
    badge_type: 'low-stock'
  },
  {
    id: '4',
    name: 'Basketball Dominator',
    category: 'sports',
    tag: 'Sports Grip',
    price: 1800,
    old_price: 2100,
    img: 'images/basketball-shoe.jpeg',
    rating: 4.6,
    reviews: 87,
    badge: 'In Stock',
    badge_type: 'in-stock'
  }
];

// ===================== FETCH PRODUCTS =====================
async function fetchProducts() {
  // ── Step 1: show local/JSON products immediately so grid is never blank ──
  let localLoaded = false;
  try {
    const res = await fetch('data/products.json');
    const json = await res.json();
    const products = (json.products || []).map(p => ({
      ...p,
      category: p.category || 'sports',
      tag: (p.category || 'Sports').charAt(0).toUpperCase() + (p.category || 'sports').slice(1) + ' Grip',
      rating: p.rating || 4.7,
      reviews: p.reviews || 99,
      badge: 'In Stock',
      badge_type: 'in-stock',
      old_price: p.old_price || null
    }));
    if (products.length) { renderProducts(products); localLoaded = true; }
  } catch { /* ignore */ }

  if (!localLoaded) renderProducts(localProducts);

  // ── Step 2: try to upgrade from Supabase (silently, with timeout) ──
  if (!supabaseClient) return;

  try {
    const fetchPromise = supabaseClient
      .from('products')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    // 5-second timeout so a DNS failure doesn't hang the page
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase timeout')), 5000)
    );

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) { console.warn('Supabase:', error.message); return; }

    if (data && data.length > 0) {
      const mapped = data.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        tag: p.category.charAt(0).toUpperCase() + p.category.slice(1) + ' Grip',
        price: Number(p.sale_price || p.base_price),
        old_price: p.sale_price ? Number(p.base_price) : null,
        img: p.primary_image_url || 'images/cricket-shoe.png',
        rating: 4.8,
        reviews: Math.floor(Math.random() * 150 + 50),
        badge: p.stock_qty > 10 ? 'In Stock' : p.stock_qty > 0 ? 'Low Stock' : 'Sold Out',
        badge_type: p.stock_qty > 10 ? 'in-stock' : 'low-stock'
      }));
      console.log(`✅ Loaded ${mapped.length} products from Supabase`);
      renderProducts(mapped);
    }
  } catch (err) {
    console.warn('Supabase unreachable, using local data:', err.message);
  }
}


// ===================== RENDER PRODUCTS =====================
let allProducts = [];
let wishlist = JSON.parse(localStorage.getItem('ms_wishlist')) || [];

function renderProducts(products) {
  allProducts = products;
  const featuredGrid = document.getElementById('featured-grid');
  const shopGrid     = document.getElementById('shop-grid');

  if (featuredGrid) featuredGrid.innerHTML = buildCards(products.slice(0, 4));
  if (shopGrid)     shopGrid.innerHTML     = buildCards(products);
}

function buildCards(products) {
  if (!products.length) {
    return '<p style="color:rgba(255,255,255,0.4);text-align:center;padding:40px;grid-column:1/-1">No products found.</p>';
  }
  return products.map(p => `
    <div class="product-card" data-cat="${p.category || 'sports'}">
      <div class="product-img-wrap">
        <img src="${p.img}" alt="${p.name}" loading="lazy">
        <span class="product-badge ${p.badge_type || 'in-stock'}">${p.badge || 'In Stock'}</span>
        <button class="wishlist-btn ${wishlist.includes(String(p.id)) ? 'active' : ''}"
                onclick="toggleWishlist('${p.id}', this)"
                title="Add to Wishlist">
          <i class="${wishlist.includes(String(p.id)) ? 'fas' : 'far'} fa-heart"></i>
        </button>
      </div>
      <div class="product-info">
        <div class="product-tag">${p.tag || 'Grip System'}</div>
        <h3>${p.name}</h3>
        <div class="product-rating">
          <span class="stars">${starsHtml(p.rating)}</span>
          <span>${p.rating} (${p.reviews})</span>
        </div>
        <div class="price-row">
          <div>
            <span class="price">₹${p.price}</span>
            ${p.old_price ? `<span class="price-old">₹${p.old_price}</span>` : ''}
          </div>
          <button class="add-to-cart" onclick="addToCart('${p.id}','${p.name}',${p.price},'${p.img}')">
            <i class="fas fa-plus"></i> Add
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function starsHtml(rating) {
  const full = Math.floor(rating);
  let s = '';
  for (let i = 0; i < full; i++) s += '★';
  if (rating % 1 >= 0.5) s += '½';
  return s;
}

// ===================== FILTER (SHOP PAGE) =====================
function filterProducts(cat, btn) {
  document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const filtered = cat === 'all' ? allProducts : allProducts.filter(p => p.category === cat);
  const grid = document.getElementById('shop-grid');
  if (grid) grid.innerHTML = buildCards(filtered);
}

// ===================== CART FUNCTIONS =====================
window.addToCart = function(id, name, price, img) {
  cart.push({ id, name, price: Number(price), img });
  saveCart();
  updateCartCount();
  showToast(`✅ ${name} added to cart!`, 'success');
};

window.removeFromCart = function(index) {
  const name = cart[index]?.name;
  cart.splice(index, 1);
  saveCart();
  updateCartCount();
  renderCart();
  showToast(`Removed ${name}`);
};

function renderCart() {
  const container  = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl    = document.getElementById('cart-total');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <p>Your cart is empty</p>
        <a href="shop.html" class="btn-primary" style="display:inline-flex;margin-top:1rem">
          <i class="fas fa-shopping-bag"></i> Browse Collection
        </a>
      </div>`;
    if (subtotalEl) subtotalEl.textContent = '0';
    if (totalEl)    totalEl.textContent    = '0';
    return;
  }

  let total = 0;
  container.innerHTML = cart.map((item, i) => {
    total += Number(item.price);
    return `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.name}">
        <div class="cart-item-info">
          <h3>${item.name}</h3>
          <div class="item-price">₹${item.price}</div>
        </div>
        <button class="remove-btn" onclick="removeFromCart(${i})">
          <i class="fas fa-trash-alt"></i> Remove
        </button>
      </div>`;
  }).join('');

  const shipping = total >= 1500 ? 0 : 99;
  const shippingLabel = document.getElementById('shipping-label');
  if (shippingLabel) shippingLabel.textContent = shipping === 0 ? 'Free 🎉' : `₹${shipping}`;
  if (subtotalEl)    subtotalEl.textContent    = total.toFixed(0);
  if (totalEl)       totalEl.textContent       = (total + shipping).toFixed(0);
}

function checkout() {
  if (cart.length === 0) { showToast('⚠️ Your cart is empty!'); return; }
  showToast('🎉 Order placed! Thank you for choosing ModySOLE!', 'success');
  setTimeout(() => {
    cart = [];
    saveCart();
    updateCartCount();
    renderCart();
  }, 1500);
}

function applyCoupon() {
  const code = document.getElementById('coupon-input')?.value?.trim().toUpperCase();
  if (!code) { showToast('Enter a coupon code'); return; }
  const validCodes = { 'FIRST10': '10% off applied!', 'SOLE200': '₹200 off applied!', 'LAUNCH25': '25% off applied!' };
  if (validCodes[code]) {
    showToast(`🎉 ${validCodes[code]}`, 'success');
  } else {
    showToast('❌ Invalid coupon code');
  }
}

// ===================== WISHLIST =====================
window.toggleWishlist = function(id, btn) {
  const strId = String(id);
  const idx = wishlist.indexOf(strId);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    btn.classList.remove('active');
    btn.innerHTML = '<i class="far fa-heart"></i>';
    showToast('Removed from wishlist');
  } else {
    wishlist.push(strId);
    btn.classList.add('active');
    btn.innerHTML = '<i class="fas fa-heart"></i>';
    showToast('❤️ Added to wishlist', 'success');
  }
  localStorage.setItem('ms_wishlist', JSON.stringify(wishlist));
};

// ===================== NEWSLETTER =====================
window.subscribeNewsletter = async function(e) {
  e.preventDefault();
  const emailInput = document.getElementById('newsletter-email');
  const email = emailInput?.value?.trim();
  if (!email) return;

  if (supabaseClient) {
    const { error } = await supabaseClient
      .from('newsletter_subscribers')
      .insert({ email });
    if (error && error.code !== '23505') { // 23505 = duplicate
      showToast('❌ Could not subscribe. Try again.');
      return;
    }
  }

  showToast(`🎉 Welcome! Check ${email} for your 10% off code.`, 'success');
  if (emailInput) emailInput.value = '';
};

// ===================== MODAL =====================
window.showLogin  = () => document.getElementById('loginModal')?.classList.add('open');
window.hideLogin  = () => document.getElementById('loginModal')?.classList.remove('open');
window.loginWith  = (provider) => { showToast(`✅ Logged in with ${provider}!`, 'success'); hideLogin(); };

document.addEventListener('click', e => {
  if (e.target.id === 'loginModal') hideLogin();
});

// ===================== TOAST =====================
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  if (!toast || !msgEl) return;
  msgEl.textContent = msg;
  toast.className = `show ${type}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.className = ''; }, 3000);
}

// ===================== CART PAGE REDIRECT =====================
function toggleCart() { window.location.href = 'cart.html'; }

// ===================== COUNT-UP ANIMATION =====================
function countUp() {
  document.querySelectorAll('[data-target]').forEach(el => {
    if (el._counted) return;
    el._counted = true;
    const target   = +el.dataset.target;
    const duration = 1800;
    const start    = performance.now();
    function update(time) {
      const progress = Math.min((time - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = Math.round(eased * target);
      el.textContent = current >= 1000 ? current.toLocaleString('en-IN') : current;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

// ===================== INTERSECTION OBSERVER =====================
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.style.opacity    = '1';
    e.target.style.transform  = 'translateY(0)';
    // trigger count-up if section contains [data-target]
    if (e.target.querySelector('[data-target]')) countUp();
    io.unobserve(e.target);
  });
}, { threshold: 0.12 });

// ===================== STICKY HEADER =====================
window.addEventListener('scroll', () => {
  const h = document.getElementById('main-header');
  if (h) h.classList.toggle('scrolled', window.scrollY > 80);
});

// ===================== AUTHENTICATION =====================
const PROTECTED_ROUTES = ['shop.html', 'customizer.html', 'cart.html'];

function checkAuth() {
  const isLoggedIn = localStorage.getItem('ms_session_active') === 'true';
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // 1. Route Protection: Redirect if accessing protected page while logged out
  if (!isLoggedIn && PROTECTED_ROUTES.includes(currentPage)) {
    window.location.href = 'login.html';
    return;
  }

  // 2. Prevent accessing login page if already logged in
  if (isLoggedIn && currentPage === 'login.html') {
    window.location.href = 'index.html';
    return;
  }

  // 3. Update Header Login/Logout Button
  if (isLoggedIn) {
    document.querySelectorAll('.login-btn').forEach(btn => {
      btn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
      btn.onclick = logout;
    });
  }
}

// Simulate OAuth login process
function loginWith(provider) {
  const btn = event.currentTarget;
  const originalText = btn.innerHTML;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Connecting...`;
  
  setTimeout(() => {
    localStorage.setItem('ms_session_active', 'true');
    window.location.href = 'index.html';
  }, 1200);
}

function logout(e) {
  if (e) e.preventDefault();
  localStorage.removeItem('ms_session_active');
  window.location.reload();
}

// ===================== INIT =====================
window.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initSupabase();
  updateCartCount();

  // Scroll-reveal on sections (skip customizer page — it has its own layout)
  document.querySelectorAll('section:not(.customizer-page)').forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    io.observe(el);
  });

  if (document.getElementById('cart-items')) {
    renderCart();
  } else {
    fetchProducts();
  }
});
