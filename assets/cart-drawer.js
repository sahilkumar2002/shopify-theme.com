/**
 * Indian Rug Store — Luxury Ajax Cart Drawer Controller
 * Handles /cart.js, /cart/add.js, /cart/change.js, live free-shipping progress meter, and badge animations.
 */

(function() {
  'use strict';

  var FREE_SHIPPING_THRESHOLD = 50000; // in cents ($500.00 default)

  function formatMoney(cents) {
    return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function initLuxuryCart() {
    var cartDrawer = document.getElementById('LuxuryCartDrawer');
    var cartOverlay = document.getElementById('LuxuryDrawerOverlay');
    var cartCloseBtn = document.getElementById('LuxuryCartCloseBtn');
    var cartTriggerBtn = document.getElementById('LuxuryCartBtn');
    var cartCountBadges = document.querySelectorAll('.luxury-cart-count-badge');

    if (!cartDrawer) return;

    // Read threshold from drawer attribute if configured
    var configThreshold = cartDrawer.getAttribute('data-shipping-threshold');
    if (configThreshold) {
      FREE_SHIPPING_THRESHOLD = parseInt(configThreshold, 10) * 100;
    }

    window.openLuxuryCart = function() {
      cartDrawer.classList.add('is-active');
      if (cartOverlay) cartOverlay.classList.add('is-active');
      document.body.style.overflow = 'hidden';
      window.refreshLuxuryCart();
    };

    window.closeLuxuryCart = function() {
      cartDrawer.classList.remove('is-active');
      if (cartOverlay && !document.querySelector('.luxury-wishlist-drawer.is-active') && !document.querySelector('.luxury-mobile-drawer.is-active') && !document.querySelector('.luxury-search-modal.is-active')) {
        cartOverlay.classList.remove('is-active');
      }
      document.body.style.overflow = '';
    };

    if (cartTriggerBtn) {
      cartTriggerBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.openLuxuryCart();
      });
    }

    if (cartCloseBtn) {
      cartCloseBtn.addEventListener('click', window.closeLuxuryCart);
    }

    // Refresh Cart Content from Shopify Ajax Cart API
    window.refreshLuxuryCart = function() {
      fetch('/cart.js')
        .then(function(res) { return res.json(); })
        .then(function(cart) {
          renderCartData(cart);
        })
        .catch(function(err) {
          console.warn('Error fetching cart:', err);
        });
    };

    function bumpCartBadges() {
      cartCountBadges.forEach(function(badge) {
        badge.classList.remove('badge-pop');
        void badge.offsetWidth;
        badge.classList.add('badge-pop');
      });
    }

    function renderCartData(cart) {
      // 1. Update Count Badges
      cartCountBadges.forEach(function(badge) {
        badge.textContent = cart.item_count;
        badge.setAttribute('data-count', cart.item_count);
        badge.style.display = cart.item_count > 0 ? 'flex' : 'none';
      });

      // 2. Free Shipping Bar Calculation
      var shippingBar = document.getElementById('LuxuryShippingBar');
      if (shippingBar) {
        var progressFill = shippingBar.querySelector('.luxury-shipping-bar__progress-fill');
        var messageEl = shippingBar.querySelector('.luxury-shipping-bar__message');
        var remaining = FREE_SHIPPING_THRESHOLD - cart.total_price;
        var percentage = Math.min(100, Math.max(0, (cart.total_price / FREE_SHIPPING_THRESHOLD) * 100));

        if (progressFill) progressFill.style.width = percentage + '%';

        if (messageEl) {
          if (remaining <= 0) {
            messageEl.innerHTML = '🎉 <strong>Complimentary White-Glove Delivery Unlocked!</strong>';
          } else {
            messageEl.innerHTML = 'Add <strong>' + formatMoney(remaining) + '</strong> more to enjoy complimentary global delivery';
          }
        }
      }

      // 3. Render Items
      var itemsContainer = document.getElementById('LuxuryCartItems');
      var footerContainer = document.getElementById('LuxuryCartFooter');
      var subtotalEl = document.getElementById('LuxuryCartSubtotal');

      if (!itemsContainer) return;

      if (cart.item_count === 0) {
        itemsContainer.innerHTML = [
          '<div class="luxury-drawer-empty">',
          '  <svg class="luxury-drawer-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
          '  <h3 class="luxury-drawer-empty__title">Your Sanctuary Is Empty</h3>',
          '  <p class="luxury-drawer-empty__text">Discover heirloom rugs crafted with generational mastery.</p>',
          '  <a href="/collections/all" class="luxury-account-dropdown__btn" style="padding: 0.9rem 2rem; margin-top: 1rem;" onclick="window.closeLuxuryCart();">Explore Collections</a>',
          '</div>'
        ].join('');
        if (footerContainer) footerContainer.style.display = 'none';
        return;
      }

      if (footerContainer) footerContainer.style.display = 'block';
      if (subtotalEl) subtotalEl.textContent = formatMoney(cart.total_price);

      var itemsHtml = '';
      cart.items.forEach(function(item, idx) {
        var lineNum = idx + 1;
        var variantTitle = item.variant_title ? '<span class="luxury-cart-item__variant">' + item.variant_title + '</span>' : '';
        itemsHtml += [
          '<div class="luxury-cart-item" data-line="' + lineNum + '">',
          '  <div class="luxury-cart-item__media">',
          '    <img src="' + item.image + '" alt="' + item.title + '" loading="lazy">',
          '  </div>',
          '  <div class="luxury-cart-item__details">',
          '    <a href="' + item.url + '" class="luxury-cart-item__title">' + item.product_title + '</a>',
          '    ' + variantTitle,
          '    <span class="luxury-cart-item__price">' + formatMoney(item.final_line_price) + '</span>',
          '    <div class="luxury-cart-item__qty">',
          '      <button type="button" class="luxury-cart-item__qty-btn" onclick="window.changeCartQty(' + lineNum + ', ' + (item.quantity - 1) + ')">&minus;</button>',
          '      <input type="text" class="luxury-cart-item__qty-input" value="' + item.quantity + '" readonly>',
          '      <button type="button" class="luxury-cart-item__qty-btn" onclick="window.changeCartQty(' + lineNum + ', ' + (item.quantity + 1) + ')">&plus;</button>',
          '    </div>',
          '  </div>',
          '  <button type="button" class="luxury-cart-item__remove" aria-label="Remove ' + item.title + '" onclick="window.changeCartQty(' + lineNum + ', 0)">',
          '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
          '  </button>',
          '</div>'
        ].join('');
      });

      itemsContainer.innerHTML = itemsHtml;
    }

    // Change Item Quantity
    window.changeCartQty = function(line, quantity) {
      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ line: line, quantity: quantity })
      })
      .then(function(res) { return res.json(); })
      .then(function(cart) {
        renderCartData(cart);
        bumpCartBadges();
      })
      .catch(function(err) {
        console.warn('Cart quantity change error:', err);
      });
    };

    // Add item by variant ID
    window.addLuxuryCartItem = function(variantId, quantity) {
      quantity = quantity || 1;
      return fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: quantity })
      })
      .then(function(res) {
        if (!res.ok) throw new Error('Stock unavailable or error adding to cart');
        return res.json();
      })
      .then(function() {
        bumpCartBadges();
        window.openLuxuryCart();
      });
    };

    // Intercept standard Shopify Product Forms
    document.addEventListener('submit', function(e) {
      var form = e.target;
      if (form && form.getAttribute('action') && form.getAttribute('action').indexOf('/cart/add') !== -1) {
        e.preventDefault();
        var submitBtn = form.querySelector('[type="submit"]');
        var originalText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="luxury-btn-spinner">Adding to Sanctuary...</span>';
        }

        var formData = new FormData(form);
        fetch('/cart/add.js', {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        })
        .then(function(res) {
          if (!res.ok) throw new Error('Could not add item to cart');
          return res.json();
        })
        .then(function() {
          bumpCartBadges();
          window.openLuxuryCart();
        })
        .catch(function(err) {
          alert('Notice: ' + err.message);
        })
        .finally(function() {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
        });
      }
    });
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLuxuryCart);
  } else {
    initLuxuryCart();
  }
})();
