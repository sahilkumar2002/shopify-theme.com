/**
 * Indian Rug Store — Luxury Wishlist Controller
 * Manages guest and customer wishlists using localStorage, updates heart states across pages,
 * and renders the slide-in wishlist drawer with live product data.
 */

(function() {
  'use strict';

  var STORAGE_KEY = 'indianrugstore_wishlist_handles';

  function getWishlist() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Wishlist storage inaccessible:', e);
      return [];
    }
  }

  function saveWishlist(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Wishlist could not be saved to localStorage:', e);
    }
  }

  function updateWishlistBadges(count) {
    var badges = document.querySelectorAll('.luxury-wishlist-count-badge');
    badges.forEach(function(badge) {
      badge.textContent = count;
      badge.setAttribute('data-count', count);
      badge.style.display = count > 0 ? 'flex' : 'none';
      badge.classList.remove('badge-pop');
      void badge.offsetWidth;
      badge.classList.add('badge-pop');
    });
  }

  function syncAllHeartButtons() {
    var list = getWishlist();
    updateWishlistBadges(list.length);

    var heartBtns = document.querySelectorAll('.wishlist-toggle-btn[data-product-handle]');
    heartBtns.forEach(function(btn) {
      var handle = btn.getAttribute('data-product-handle');
      if (list.indexOf(handle) !== -1) {
        btn.classList.add('is-saved');
        btn.setAttribute('aria-label', 'Remove from Wishlist');
      } else {
        btn.classList.remove('is-saved');
        btn.setAttribute('aria-label', 'Add to Wishlist');
      }
    });
  }

  function initLuxuryWishlist() {
    var wishlistDrawer = document.getElementById('LuxuryWishlistDrawer');
    var overlay = document.getElementById('LuxuryDrawerOverlay');
    var triggerBtn = document.getElementById('LuxuryWishlistBtn');
    var closeBtn = document.getElementById('LuxuryWishlistCloseBtn');
    var itemsContainer = document.getElementById('LuxuryWishlistItems');

    window.openLuxuryWishlist = function() {
      if (!wishlistDrawer) return;
      wishlistDrawer.classList.add('is-active');
      if (overlay) overlay.classList.add('is-active');
      document.body.style.overflow = 'hidden';
      renderWishlistDrawerItems();
    };

    window.closeLuxuryWishlist = function() {
      if (!wishlistDrawer) return;
      wishlistDrawer.classList.remove('is-active');
      if (overlay && !document.querySelector('.luxury-cart-drawer.is-active') && !document.querySelector('.luxury-mobile-drawer.is-active') && !document.querySelector('.luxury-search-modal.is-active')) {
        overlay.classList.remove('is-active');
      }
      document.body.style.overflow = '';
    };

    if (triggerBtn) {
      triggerBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.openLuxuryWishlist();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', window.closeLuxuryWishlist);
    }

    // Toggle Wishlist Item
    window.toggleLuxuryWishlist = function(handle, btnElement) {
      if (!handle) return;
      var list = getWishlist();
      var idx = list.indexOf(handle);
      var isNowSaved = false;

      if (idx === -1) {
        list.push(handle);
        isNowSaved = true;
      } else {
        list.splice(idx, 1);
        isNowSaved = false;
      }

      saveWishlist(list);
      syncAllHeartButtons();

      if (btnElement) {
        btnElement.classList.add('heart-pop');
        setTimeout(function() { btnElement.classList.remove('heart-pop'); }, 500);
      }

      // Re-render drawer if open
      if (wishlistDrawer && wishlistDrawer.classList.contains('is-active')) {
        renderWishlistDrawerItems();
      }
    };

    // Render Saved Items inside Drawer
    function renderWishlistDrawerItems() {
      if (!itemsContainer) return;
      var list = getWishlist();

      if (list.length === 0) {
        itemsContainer.innerHTML = [
          '<div class="luxury-drawer-empty">',
          '  <svg class="luxury-drawer-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
          '  <h3 class="luxury-drawer-empty__title">Your Wishlist Is Empty</h3>',
          '  <p class="luxury-drawer-empty__text">Save your favorite handcrafted rugs while exploring our curation.</p>',
          '  <a href="/collections/all" class="luxury-account-dropdown__btn" style="padding: 0.9rem 2rem; margin-top: 1rem;" onclick="window.closeLuxuryWishlist();">Explore Collections</a>',
          '</div>'
        ].join('');
        return;
      }

      itemsContainer.innerHTML = '<div style="text-align:center; padding:3rem 0; color:#8C857B;">Loading your treasured pieces...</div>';

      var fetchPromises = list.map(function(handle) {
        return fetch('/products/' + handle + '.js')
          .then(function(res) {
            if (!res.ok) return null;
            return res.json();
          })
          .catch(function() { return null; });
      });

      Promise.all(fetchPromises).then(function(products) {
        var validProducts = products.filter(Boolean);
        if (validProducts.length === 0) {
          itemsContainer.innerHTML = '<p style="text-align:center; padding:2rem; color:#8C857B;">No active products found in your saved list.</p>';
          return;
        }

        var html = '';
        validProducts.forEach(function(product) {
          var price = product.price ? '$' + (product.price / 100).toFixed(2) : '';
          var firstVariantId = product.variants && product.variants[0] ? product.variants[0].id : '';

          html += [
            '<div class="luxury-cart-item">',
            '  <div class="luxury-cart-item__media">',
            '    <img src="' + (product.featured_image || product.images[0]) + '" alt="' + product.title + '" loading="lazy">',
            '  </div>',
            '  <div class="luxury-cart-item__details">',
            '    <a href="' + product.url + '" class="luxury-cart-item__title">' + product.title + '</a>',
            '    <span class="luxury-cart-item__price">' + price + '</span>',
            '    <button type="button" class="luxury-account-dropdown__btn" style="margin-top: 0.5rem; padding: 0.5rem 1rem; width: fit-content;" onclick="window.addLuxuryCartItem(' + firstVariantId + ', 1); window.closeLuxuryWishlist();">',
            '      + Move to Sanctuary Bag',
            '    </button>',
            '  </div>',
            '  <button type="button" class="luxury-cart-item__remove" aria-label="Remove ' + product.title + '" onclick="window.toggleLuxuryWishlist(\'' + product.handle + '\')">',
            '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
            '  </button>',
            '</div>'
          ].join('');
        });

        itemsContainer.innerHTML = html;
      });
    }

    // Sync across browser tabs
    window.addEventListener('storage', function(e) {
      if (e.key === STORAGE_KEY) {
        syncAllHeartButtons();
        if (wishlistDrawer && wishlistDrawer.classList.contains('is-active')) {
          renderWishlistDrawerItems();
        }
      }
    });

    // Delegate heart click on any wishlist toggle button
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.wishlist-toggle-btn');
      if (btn) {
        e.preventDefault();
        var handle = btn.getAttribute('data-product-handle');
        window.toggleLuxuryWishlist(handle, btn);
      }
    });

    // Initial sync
    syncAllHeartButtons();
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLuxuryWishlist);
  } else {
    initLuxuryWishlist();
  }
})();
