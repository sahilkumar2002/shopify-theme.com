/**
 * Indian Rug Store — Luxury Editorial Header Controller
 * Handles sticky transitions, slide-down predictive search, mobile drawer, and account menu.
 */

(function() {
  'use strict';

  function initLuxuryHeader() {
    var headerWrapper = document.getElementById('LuxuryHeaderWrapper');
    if (!headerWrapper) return;

    var lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
    var isTransparent = headerWrapper.getAttribute('data-transparent') === 'true';
    var isSticky = headerWrapper.getAttribute('data-sticky') === 'true';

    // 1. Scroll Listener for Sticky / Transparent / Hide-Show
    function onScroll() {
      var currentScrollY = window.pageYOffset || document.documentElement.scrollTop;

      // Scrolled past 80px -> turn solid white
      if (currentScrollY > 80) {
        headerWrapper.classList.add('is-scrolled');
      } else {
        headerWrapper.classList.remove('is-scrolled');
      }

      // Hide on scroll down, show on scroll up (only when sticky and past 250px)
      if (isSticky && currentScrollY > 250) {
        if (currentScrollY > lastScrollY && !headerWrapper.classList.contains('is-menu-open')) {
          headerWrapper.classList.add('is-hidden');
        } else {
          headerWrapper.classList.remove('is-hidden');
        }
      } else {
        headerWrapper.classList.remove('is-hidden');
      }

      lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 2. Search Slide-Down Modal
    var searchBtn = document.getElementById('LuxurySearchBtn');
    var searchModal = document.getElementById('LuxurySearchModal');
    var searchCloseBtn = document.getElementById('LuxurySearchCloseBtn');
    var drawerOverlay = document.getElementById('LuxuryDrawerOverlay');
    var searchInput = document.getElementById('LuxurySearchInput');
    var searchResultsContainer = document.getElementById('LuxurySearchResults');

    function openSearch() {
      if (!searchModal) return;
      searchModal.classList.add('is-active');
      if (drawerOverlay) drawerOverlay.classList.add('is-active');
      headerWrapper.classList.add('is-search-open');
      setTimeout(function() {
        if (searchInput) searchInput.focus();
      }, 250);
    }

    function closeSearch() {
      if (!searchModal) return;
      searchModal.classList.remove('is-active');
      if (drawerOverlay && !document.querySelector('.luxury-cart-drawer.is-active') && !document.querySelector('.luxury-wishlist-drawer.is-active') && !document.querySelector('.luxury-mobile-drawer.is-active')) {
        drawerOverlay.classList.remove('is-active');
      }
      headerWrapper.classList.remove('is-search-open');
    }

    if (searchBtn) searchBtn.addEventListener('click', openSearch);
    if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearch);

    // ESC to close
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        closeSearch();
        window.closeLuxuryCart && window.closeLuxuryCart();
        window.closeLuxuryWishlist && window.closeLuxuryWishlist();
        closeMobileDrawer();
      }
    });

    // Predictive search using Shopify /search/suggest.json
    var searchDebounceTimer;
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        var query = searchInput.value.trim();
        clearTimeout(searchDebounceTimer);
        if (query.length < 2) {
          if (searchResultsContainer) searchResultsContainer.innerHTML = '';
          return;
        }

        searchDebounceTimer = setTimeout(function() {
          var url = '/search/suggest.json?q=' + encodeURIComponent(query) + '&resources[type]=product&resources[limit]=4&resources[options][unavailable_products]=hide';
          fetch(url)
            .then(function(res) { return res.json(); })
            .then(function(data) {
              if (!searchResultsContainer) return;
              var products = data.resources && data.resources.results && data.resources.results.products;
              if (products && products.length > 0) {
                var html = '<div class="luxury-search-suggest-grid">';
                products.forEach(function(item) {
                  html += '<a href="' + item.url + '" class="luxury-search-suggest-card">';
                  html += '  <div class="luxury-search-suggest-thumb"><img src="' + (item.image || item.featured_image) + '" alt="' + item.title + '" loading="lazy"></div>';
                  html += '  <h4 class="luxury-search-suggest-title">' + item.title + '</h4>';
                  html += '  <span class="luxury-search-suggest-price">' + (item.price ? '$' + parseFloat(item.price).toFixed(2) : '') + '</span>';
                  html += '</a>';
                });
                html += '</div>';
                searchResultsContainer.innerHTML = html;
              } else {
                searchResultsContainer.innerHTML = '<p style="text-align:center; color:#9E968F; font-style:italic; padding:2rem 0;">No matching heirloom rugs found for "' + query + '"</p>';
              }
            })
            .catch(function(err) {
              console.warn('Predictive search error:', err);
            });
        }, 280);
      });
    }

    // 3. Mobile Navigation Drawer
    var hamburgerBtn = document.getElementById('LuxuryHamburgerBtn');
    var mobileDrawer = document.getElementById('LuxuryMobileDrawer');
    var mobileCloseBtn = document.getElementById('LuxuryMobileCloseBtn');

    function openMobileDrawer() {
      if (!mobileDrawer) return;
      mobileDrawer.classList.add('is-active');
      if (drawerOverlay) drawerOverlay.classList.add('is-active');
      headerWrapper.classList.add('is-drawer-open');
    }

    function closeMobileDrawer() {
      if (!mobileDrawer) return;
      mobileDrawer.classList.remove('is-active');
      if (drawerOverlay && !document.querySelector('.luxury-cart-drawer.is-active') && !document.querySelector('.luxury-wishlist-drawer.is-active') && !searchModal.classList.contains('is-active')) {
        drawerOverlay.classList.remove('is-active');
      }
      headerWrapper.classList.remove('is-drawer-open');
    }

    // Mega menu hover listener to turn header solid on transparent hero
    var menuItems = headerWrapper.querySelectorAll('.luxury-header__menu-item');
    menuItems.forEach(function(item) {
      if (item.querySelector('.luxury-mega-dropdown')) {
        item.addEventListener('mouseenter', function() {
          headerWrapper.classList.add('is-menu-open');
        });
        item.addEventListener('mouseleave', function() {
          headerWrapper.classList.remove('is-menu-open');
        });
      }
    });

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openMobileDrawer);
    if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', closeMobileDrawer);

    // Accordions in mobile drawer
    var accordionTriggers = document.querySelectorAll('.luxury-mobile-accordion-trigger');
    accordionTriggers.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var target = btn.nextElementSibling;
        if (target && target.classList.contains('luxury-mobile-accordion')) {
          target.classList.toggle('is-open');
          var arrow = btn.querySelector('.luxury-mobile-arrow');
          if (arrow) arrow.style.transform = target.classList.contains('is-open') ? 'rotate(180deg)' : 'none';
        }
      });
    });

    // Overlay click closes everything
    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', function() {
        closeSearch();
        window.closeLuxuryCart && window.closeLuxuryCart();
        window.closeLuxuryWishlist && window.closeLuxuryWishlist();
        closeMobileDrawer();
      });
    }
  }

  // Initialize on DOM load and Theme Editor events
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLuxuryHeader);
  } else {
    initLuxuryHeader();
  }

  document.addEventListener('shopify:section:load', function(e) {
    if (e.target.querySelector('.luxury-header-wrapper') || e.target.classList.contains('luxury-header-wrapper')) {
      initLuxuryHeader();
    }
  });
})();
