// ============================================================
// MODYSOLE — Main App JS
// Supabase connected: ditvoeoedhldsbgnkhrx.supabase.co
// ============================================================

// ---- SUPABASE CONFIG ----
const SUPABASE_URL = 'https://ditvoeoedhldsbgnkhrx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_X3tYNz99P6fzrCUCzxij_A_h_NDT4o4';
const USE_SUPABASE = true;

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

// Ensure legacy cart items have qty property
cart = cart.map(item => ({
  ...item,
  qty: Math.max(1, parseInt(item.qty) || 1),
  is_base: item.id === 'base-shoe' || item.is_base === true || item.category === 'base'
}));

function saveCart() {
  localStorage.setItem('ms_cart', JSON.stringify(cart));
}

function updateCartCount() {
  const totalCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  document.querySelectorAll('#cart-count').forEach(el => el.textContent = totalCount);
}

// ===================== LOCAL FALLBACK CATALOG =====================
const localProducts = [
  {
    id: 'base-shoe',
    name: 'Base Shoe',
    category: 'base',
    tag: 'Base Shoe — Need to be purchased separately',
    price: 2499,
    old_price: 2999,
    stock_qty: 15,
    is_base: true,
    description: 'The essential foundation sneaker upper featuring ModySole\'s patented magnetic snap-lock interface. Attach any interchangeable sports sole.',
    img: 'images/base-shoe.jpg',
    badge: 'Required Base',
    badge_type: 'in-stock'
  },
  {
    id: 'sole-cricket',
    name: 'Cricket Pro Spike Sole',
    category: 'cricket',
    tag: 'Interchangeable Sports Sole',
    price: 1430,
    old_price: 1800,
    stock_qty: 8,
    is_base: false,
    description: 'High-traction rubber spikes engineered for pitch grip, stability, and quick lateral turns.',
    img: 'images/cricket-shoe.png',
    badge: 'In Stock',
    badge_type: 'in-stock'
  },
  {
    id: 'sole-football',
    name: 'Football Velocity Sole',
    category: 'football',
    tag: 'Interchangeable Sports Sole',
    price: 1400,
    old_price: 1700,
    stock_qty: 10,
    is_base: false,
    description: 'Multi-ground cleated outsole offering maximum acceleration and control on turf and grass.',
    img: 'images/football-shoe.png',
    badge: 'In Stock',
    badge_type: 'in-stock'
  },
  {
    id: 'sole-badminton',
    name: 'Badminton Smash Court Sole',
    category: 'badminton',
    tag: 'Interchangeable Sports Sole',
    price: 1650,
    old_price: 1950,
    stock_qty: 6,
    is_base: false,
    description: 'Non-marking gum rubber sole designed for swift indoor wooden court traction and heel cushioning.',
    img: 'images/tennis-shoe.jpeg',
    badge: 'Low Stock',
    badge_type: 'low-stock'
  },
  {
    id: 'sole-basketball',
    name: 'Basketball Dominator Sole',
    category: 'basketball',
    tag: 'Interchangeable Sports Sole',
    price: 1800,
    old_price: 2100,
    stock_qty: 12,
    is_base: false,
    description: 'Deep herringbone tread for supreme court grip, impact protection, and explosive vertical jumps.',
    img: 'images/basketball-shoe.jpeg',
    badge: 'In Stock',
    badge_type: 'in-stock'
  },
  {
    id: 'sole-tennis',
    name: 'Tennis Court Master Sole',
    category: 'tennis',
    tag: 'Interchangeable Sports Sole',
    price: 1800,
    old_price: 2200,
    stock_qty: 5,
    is_base: false,
    description: 'Reinforced high-wear outsole with omni-directional grip for hard and clay courts.',
    img: 'images/tennis-shoe.jpeg',
    badge: 'Low Stock',
    badge_type: 'low-stock'
  },
  {
    id: 'sole-volleyball',
    name: 'Volleyball Spike Grip Sole',
    category: 'volleyball',
    tag: 'Interchangeable Sports Sole',
    price: 1550,
    old_price: 1850,
    stock_qty: 7,
    is_base: false,
    description: 'Shock-absorbing forefoot pad and sticky indoor rubber compound for high-impact landings.',
    img: 'images/tennis-shoe.jpeg',
    badge: 'In Stock',
    badge_type: 'in-stock'
  },
  {
    id: 'sole-running',
    name: 'Running Aero Cushion Sole',
    category: 'running',
    tag: 'Interchangeable Sports Sole',
    price: 1350,
    old_price: 1600,
    stock_qty: 14,
    is_base: false,
    description: 'Lightweight high-rebound foam midsole with durable asphalt road tread.',
    img: 'images/cricket-shoe.png',
    badge: 'In Stock',
    badge_type: 'in-stock'
  },
  {
    id: 'sole-gym',
    name: 'Gym & Training Flex Sole',
    category: 'gym',
    tag: 'Interchangeable Sports Sole',
    price: 1490,
    old_price: 1790,
    stock_qty: 9,
    is_base: false,
    description: 'Flat-base design for deadlifts and squats with flexible forefoot grooves for agility drills.',
    img: 'images/football-shoe.png',
    badge: 'In Stock',
    badge_type: 'in-stock'
  }
];

window.loadedProducts = [...localProducts];

// ===================== FETCH PRODUCTS =====================
async function fetchProducts() {
  let localLoaded = false;
  try {
    const res = await fetch('data/products.json');
    const json = await res.json();
    if (json.products && json.products.length) {
      window.loadedProducts = json.products;
      renderProducts(json.products);
      localLoaded = true;
    }
  } catch { /* ignore */ }

  if (!localLoaded) {
    window.loadedProducts = localProducts;
    renderProducts(localProducts);
  }

  if (!supabaseClient) return;

  try {
    const fetchPromise = supabaseClient
      .from('products')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

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
        tag: p.category === 'base' ? 'Base Shoe — Need to be purchased separately' : 'Interchangeable Sports Sole',
        price: Number(p.sale_price || p.base_price),
        old_price: p.sale_price ? Number(p.base_price) : null,
        stock_qty: Number(p.stock_qty || 10),
        is_base: p.category === 'base' || p.is_base === true,
        img: p.primary_image_url || 'images/base-shoe.jpg',
        badge: p.stock_qty > 10 ? 'In Stock' : p.stock_qty > 0 ? 'Low Stock' : 'Sold Out',
        badge_type: p.stock_qty > 10 ? 'in-stock' : 'low-stock'
      }));
      window.loadedProducts = mapped;
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
  return products.map(p => {
    const isBase = p.is_base || p.category === 'base';
    const tagText = isBase ? 'Base Shoe — Need to be purchased separately' : (p.tag || 'Interchangeable Sole');
    const stockLimit = p.stock_qty || 10;
    return `
    <div class="product-card ${isBase ? 'base-shoe-card' : ''}" data-cat="${p.category || 'sports'}">
      <div class="product-img-wrap">
        <img src="${p.img}" alt="${p.name}" loading="lazy">
        <span class="product-badge ${isBase ? 'base-badge' : (p.badge_type || 'in-stock')}">${isBase ? 'Required Base' : (p.badge || 'In Stock')}</span>
        <button class="wishlist-btn ${wishlist.includes(String(p.id)) ? 'active' : ''}"
                onclick="toggleWishlist('${p.id}', this)"
                title="Add to Wishlist">
          <i class="${wishlist.includes(String(p.id)) ? 'fas' : 'far'} fa-heart"></i>
        </button>
      </div>
      <div class="product-info">
        <div class="product-tag ${isBase ? 'base-notice-tag' : ''}">${tagText}</div>
        <h3>${p.name}</h3>
        <p class="product-desc" style="font-size:0.8rem;color:rgba(255,255,255,0.5);margin:4px 0 10px;line-height:1.4">${p.description || ''}</p>
        
        <div class="stock-indicator" style="font-size:0.75rem;color:${stockLimit <= 5 ? 'var(--orange)' : 'var(--cyan)'};margin-bottom:8px">
          <i class="fas fa-boxes"></i> ${stockLimit <= 5 ? `Only ${stockLimit} left in stock` : `In Stock (${stockLimit} available)`}
        </div>

        ${!isBase ? `
        <div class="card-qty-selector" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);padding:6px 12px;border-radius:10px;border:1px solid var(--glass-border)">
          <span style="font-size:0.75rem;color:rgba(255,255,255,0.6)">How many soles?</span>
          <div class="mini-qty-controls" style="display:flex;align-items:center;gap:8px">
            <button class="mini-qty-btn" onclick="changeCardQty('${p.id}', -1)" style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:#fff;cursor:pointer">-</button>
            <span id="card-qty-${p.id}" style="font-weight:bold;font-size:0.9rem">1</span>
            <button class="mini-qty-btn" onclick="changeCardQty('${p.id}', 1)" style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:#fff;cursor:pointer">+</button>
          </div>
        </div>` : ''}

        <div class="price-row">
          <div>
            <span class="price">₹${p.price}</span>
            ${p.old_price ? `<span class="price-old">₹${p.old_price}</span>` : ''}
          </div>
          <button class="add-to-cart ${isBase ? 'btn-base-add' : ''}" onclick="addCardProductToCart('${p.id}')">
            <i class="fas ${isBase ? 'fa-shoe-prints' : 'fa-plus'}"></i> ${isBase ? 'Add Base Shoe' : 'Add Sole'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// Explicit Card Quantity Helper
const cardQtyStore = {};
function changeCardQty(id, delta) {
  const current = cardQtyStore[id] || 1;
  const newQty = current + delta;
  if (newQty < 1) return;
  cardQtyStore[id] = newQty;
  const qtyEl = document.getElementById(`card-qty-${id}`);
  if (qtyEl) qtyEl.textContent = newQty;
}

function addCardProductToCart(id) {
  const qty = cardQtyStore[id] || 1;
  addToCart(id, qty);
}

// ===================== FILTER (SHOP PAGE) =====================
function filterProducts(cat, btn) {
  document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  
  let filtered = allProducts;
  if (cat === 'base') {
    filtered = allProducts.filter(p => p.is_base || p.category === 'base');
  } else if (cat === 'court') {
    filtered = allProducts.filter(p => ['badminton', 'basketball', 'tennis', 'volleyball'].includes(p.category));
  } else if (cat === 'field') {
    filtered = allProducts.filter(p => ['cricket', 'football'].includes(p.category));
  } else if (cat === 'track') {
    filtered = allProducts.filter(p => ['running', 'gym'].includes(p.category));
  } else if (cat !== 'all') {
    filtered = allProducts.filter(p => p.category === cat);
  }

  const grid = document.getElementById('shop-grid');
  if (grid) grid.innerHTML = buildCards(filtered);
}

// ===================== CART FUNCTIONS & VALIDATIONS =====================
window.addToCart = function(id, reqQty = 1) {
  if (checkGuestAction()) return;

  const product = (window.loadedProducts || localProducts).find(p => String(p.id) === String(id));
  if (!product) { showToast('❌ Product not found', 'error'); return; }

  const qty = parseInt(reqQty) || 1;
  if (isNaN(qty) || qty <= 0) {
    showToast('❌ Invalid quantity requested', 'error');
    return;
  }

  const existingItem = cart.find(item => String(item.id) === String(id));
  const currentQtyInCart = existingItem ? existingItem.qty : 0;
  const targetQty = currentQtyInCart + qty;
  const stockLimit = product.stock_qty || 10;

  // ── Stock Validation ──
  if (targetQty > stockLimit) {
    showStockExceededModal(product, targetQty, stockLimit, existingItem);
    return;
  }

  // ── Base Shoe Dependency Notice for Soles ──
  const isBase = product.is_base || product.category === 'base';
  const hasBaseInCart = cart.some(item => item.is_base || item.id === 'base-shoe');

  if (!isBase && !hasBaseInCart) {
    showBaseShoeNoticeModal(product, qty);
  }

  // Execute Add
  if (existingItem) {
    existingItem.qty = targetQty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      img: product.img,
      qty: targetQty,
      stock_qty: stockLimit,
      category: product.category,
      is_base: isBase
    });
  }

  saveCart();
  updateCartCount();
  renderCart();
  showToast(`✅ Added ${qty}× ${product.name} to cart!`, 'success');
};

// Stock Exceeded Handler Modal
function showStockExceededModal(product, requestedQty, availableStock, existingItem) {
  const modalId = 'stockLimitModal';
  let modal = document.getElementById(modalId);
  if (modal) modal.remove();

  document.body.insertAdjacentHTML('beforeend', `
    <div id="${modalId}" class="modal" style="display:flex;z-index:9999;">
      <div class="modal-content" style="max-width:460px;text-align:center;">
        <span class="close-modal" onclick="document.getElementById('${modalId}').remove()">×</span>
        <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
        <h2>Quantity Unavailable</h2>
        <p style="margin:1rem 0;line-height:1.6;color:rgba(255,255,255,0.8)">
          Only <strong>${availableStock}</strong> available for <strong>${product.name}</strong>.<br>
          You requested <strong>${requestedQty}</strong>.
        </p>
        <div style="display:flex;flex-direction:column;gap:0.8rem;margin-top:1.5rem">
          <button class="btn-primary" onclick="resolveStockLimit('${product.id}', ${availableStock}, '${modalId}')">
            Reduce to Available (${availableStock})
          </button>
          ${existingItem ? `
          <button class="btn-outline" style="border-color:#ff5555;color:#ff5555" onclick="removeFromCartById('${product.id}');document.getElementById('${modalId}').remove()">
            Remove From Cart
          </button>` : ''}
          <button class="btn-outline" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
        </div>
      </div>
    </div>
  `);
}

function resolveStockLimit(productId, maxAvailable, modalId) {
  const existingItem = cart.find(item => String(item.id) === String(productId));
  const product = (window.loadedProducts || localProducts).find(p => String(p.id) === String(productId));
  
  if (existingItem) {
    existingItem.qty = maxAvailable;
  } else if (product) {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      img: product.img,
      qty: maxAvailable,
      stock_qty: maxAvailable,
      category: product.category,
      is_base: product.is_base || product.category === 'base'
    });
  }
  
  saveCart();
  updateCartCount();
  renderCart();
  const el = document.getElementById(modalId);
  if (el) el.remove();
  showToast(`Updated to available stock (${maxAvailable})`, 'success');
}

// Base Shoe Dependency Modal
function showBaseShoeNoticeModal(soleProduct, reqQty) {
  const modalId = 'baseShoeNoticeModal';
  let modal = document.getElementById(modalId);
  if (modal) modal.remove();

  document.body.insertAdjacentHTML('beforeend', `
    <div id="${modalId}" class="modal" style="display:flex;z-index:9998;">
      <div class="modal-content" style="max-width:480px;text-align:center;">
        <span class="close-modal" onclick="document.getElementById('${modalId}').remove()">×</span>
        <div style="font-size:3rem;margin-bottom:0.5rem">👟</div>
        <h2 style="color:var(--cyan)">Base Shoe Required</h2>
        <div style="background:rgba(0,212,255,0.1);border:1px solid var(--cyan);padding:8px 14px;border-radius:20px;font-size:0.8rem;font-weight:bold;margin:10px 0;display:inline-block">
          Base Shoe — Need to be purchased separately
        </div>
        <p style="margin:10px 0;line-height:1.6;font-size:0.9rem;color:rgba(255,255,255,0.7)">
          You are selecting <strong>${soleProduct.name}</strong>. Remember, interchangeable soles require a <strong>Base Shoe</strong> foundation to attach to!
        </p>
        <div style="display:flex;flex-direction:column;gap:0.8rem;margin-top:1.5rem">
          <button class="btn-primary" onclick="addBaseShoeWithSole('${soleProduct.id}', ${reqQty}, '${modalId}')">
            <i class="fas fa-plus-circle"></i> Add Base Shoe (₹2,499) + Sole
          </button>
          <button class="btn-outline" onclick="document.getElementById('${modalId}').remove()">
            Continue with Sole Only
          </button>
        </div>
      </div>
    </div>
  `);
}

function addBaseShoeWithSole(soleId, reqQty, modalId) {
  const baseProd = (window.loadedProducts || localProducts).find(p => p.is_base || p.id === 'base-shoe');
  if (baseProd) {
    const existingBase = cart.find(item => item.is_base || item.id === 'base-shoe');
    if (existingBase) {
      existingBase.qty += 1;
    } else {
      cart.push({
        id: baseProd.id,
        name: baseProd.name,
        price: Number(baseProd.price),
        img: baseProd.img,
        qty: 1,
        stock_qty: baseProd.stock_qty || 15,
        category: 'base',
        is_base: true
      });
    }
  }
  saveCart();
  updateCartCount();
  renderCart();
  const el = document.getElementById(modalId);
  if (el) el.remove();
  showToast('✅ Added Base Shoe + Sports Sole to cart!', 'success');
}

window.removeFromCart = function(index) {
  const name = cart[index]?.name;
  cart.splice(index, 1);
  saveCart();
  updateCartCount();
  renderCart();
  showToast(`Removed ${name}`);
};

function removeFromCartById(id) {
  cart = cart.filter(item => String(item.id) !== String(id));
  saveCart();
  updateCartCount();
  renderCart();
}

function changeCartItemQty(index, delta) {
  const item = cart[index];
  if (!item) return;

  const newQty = (item.qty || 1) + delta;
  const stockLimit = item.stock_qty || 10;

  if (newQty <= 0) {
    removeFromCart(index);
    return;
  }

  if (newQty > stockLimit) {
    showStockExceededModal({ id: item.id, name: item.name }, newQty, stockLimit, item);
    return;
  }

  item.qty = newQty;
  saveCart();
  updateCartCount();
  renderCart();
}

function renderCart() {
  const container  = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl    = document.getElementById('cart-total');
  if (!container) return;

  const hasSoles = cart.some(item => !item.is_base && item.id !== 'base-shoe');
  const hasBase = cart.some(item => item.is_base || item.id === 'base-shoe');

  let warningBanner = '';
  if (hasSoles && !hasBase) {
    warningBanner = `
      <div class="cart-notice-banner" style="background:rgba(255,107,43,0.12);border:1px solid var(--orange);padding:14px 20px;border-radius:16px;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div style="display:flex;align-items:center;gap:10px;color:#fff;font-size:0.9rem">
          <span style="font-size:1.4rem">⚠️</span>
          <div>
            <strong>Base Shoe Required:</strong> You have sports soles in your cart, but no Base Shoe.<br>
            <small style="color:rgba(255,255,255,0.7)">Base Shoe — Need to be purchased separately</small>
          </div>
        </div>
        <button class="btn-primary" onclick="addToCart('base-shoe', 1)" style="padding:8px 16px;font-size:0.8rem">
          + Add Base Shoe (₹2,499)
        </button>
      </div>`;
  }

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
  container.innerHTML = warningBanner + cart.map((item, i) => {
    const itemQty = item.qty || 1;
    const itemTotal = Number(item.price) * itemQty;
    total += itemTotal;
    const isBase = item.is_base || item.id === 'base-shoe';

    return `
      <div class="cart-item ${isBase ? 'cart-item-base' : ''}">
        <img src="${item.img}" alt="${item.name}">
        <div class="cart-item-info">
          <div style="font-size:0.7rem;font-weight:bold;color:${isBase ? 'var(--cyan)' : 'rgba(255,255,255,0.5)'};text-transform:uppercase">
            ${isBase ? 'Required Foundation' : (item.category || 'Sports Sole')}
          </div>
          <h3>${item.name}</h3>
          <div class="item-price">₹${item.price} each</div>
          <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-top:2px">
            Stock available: ${item.stock_qty || 10}
          </div>
        </div>

        <div class="cart-qty-control" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.05);padding:6px 14px;border-radius:30px;border:1px solid var(--glass-border)">
          <button class="cart-qty-btn" onclick="changeCartItemQty(${i}, -1)" style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:#fff;font-weight:bold;cursor:pointer">-</button>
          <span style="font-weight:bold;font-size:1rem;min-width:20px;text-align:center">${itemQty}</span>
          <button class="cart-qty-btn" onclick="changeCartItemQty(${i}, 1)" style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:#fff;font-weight:bold;cursor:pointer">+</button>
        </div>

        <div class="cart-item-subtotal" style="font-weight:bold;font-size:1.1rem;color:#fff;min-width:80px;text-align:right">
          ₹${itemTotal.toLocaleString('en-IN')}
        </div>

        <button class="remove-btn" onclick="removeFromCart(${i})">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>`;
  }).join('');

  const shipping = total >= 1500 ? 0 : 99;
  const shippingLabel = document.getElementById('shipping-label');
  if (shippingLabel) shippingLabel.textContent = shipping === 0 ? 'Free 🎉' : `₹${shipping}`;
  if (subtotalEl)    subtotalEl.textContent    = total.toLocaleString('en-IN');
  if (totalEl)       totalEl.textContent       = (total + shipping).toLocaleString('en-IN');
}

function checkout() {
  if (cart.length === 0) { showToast('⚠️ Your cart is empty!'); return; }
  
  const hasSoles = cart.some(item => !item.is_base && item.id !== 'base-shoe');
  const hasBase = cart.some(item => item.is_base || item.id === 'base-shoe');

  if (hasSoles && !hasBase) {
    showToast('⚠️ Remember: Base Shoe is required to attach your soles!', 'error');
    const baseProd = (window.loadedProducts || localProducts).find(p => p.is_base || p.id === 'base-shoe');
    if (baseProd) showBaseShoeNoticeModal(baseProd, 1);
    return;
  }

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
    if (error && error.code !== '23505') {
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

// ===================== INTERSECTION OBSERVER =====================
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.style.opacity    = '1';
    e.target.style.transform  = 'translateY(0)';
    io.unobserve(e.target);
  });
}, { threshold: 0.12 });

// ===================== STICKY HEADER =====================
window.addEventListener('scroll', () => {
  const h = document.getElementById('main-header');
  if (h) h.classList.toggle('scrolled', window.scrollY > 80);
});

// ===================== AUTHENTICATION =====================
function checkAuth() {
  const session = localStorage.getItem('ms_session_active');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const isLoginPage = currentPage === 'login.html' || currentPage === 'login';

  if (!session && !isLoginPage) {
    window.location.href = 'login.html';
    return;
  }

  if (session && isLoginPage) {
    window.location.href = 'index.html';
    return;
  }

  if (session) {
    document.querySelectorAll('.login-btn').forEach(btn => {
      btn.innerHTML = session === 'guest' 
        ? '<i class="fas fa-sign-in-alt"></i> Sign In' 
        : '<i class="fas fa-sign-out-alt"></i> Logout';
      btn.onclick = logout;
    });
  }
}

function handleLogin() {
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-password').value;
  const btn = document.querySelector('.login-submit');

  if ((email === 'admin@modysole.com' && pass === 'admin123') ||
      (email === 'user@modysole.com' && pass === 'user123')) {
    
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Connecting...`;
    setTimeout(() => {
      localStorage.setItem('ms_session_active', email.split('@')[0]);
      window.location.href = 'index.html';
    }, 800);
  } else {
    showToast('Invalid credentials. Check test logins.', 'error');
  }
}

function loginAsGuest() {
  const btn = document.querySelector('.login-btn-option.guest');
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Entering as Guest...`;
  setTimeout(() => {
    localStorage.setItem('ms_session_active', 'guest');
    window.location.href = 'index.html';
  }, 800);
}

function logout(e) {
  if (e) e.preventDefault();
  localStorage.removeItem('ms_session_active');
  window.location.href = 'login.html';
}

function checkGuestAction() {
  const session = localStorage.getItem('ms_session_active');
  if (session === 'guest') {
    if (!document.getElementById('guestBlockModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="guestBlockModal" class="modal" style="display:flex;">
          <div class="modal-content">
            <span class="close-modal" onclick="this.parentElement.parentElement.remove()">×</span>
            <h2>Action Restricted</h2>
            <p>You must be logged in to perform these actions and save your cart.</p>
            <button class="btn-primary" style="width:100%" onclick="logout()">Go to Login</button>
          </div>
        </div>
      `);
    } else {
      document.getElementById('guestBlockModal').style.display = 'flex';
    }
    return true;
  }
  return false;
}

// ===================== INIT =====================
window.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initSupabase();
  updateCartCount();

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
