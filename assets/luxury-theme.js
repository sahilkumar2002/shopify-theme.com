/**
 * JAIPUR RUGS LUXURY EDITORIAL THEME SCRIPT
 * File: assets/luxury-theme.js
 * Handles AOS animations, sticky header transitions, Swiper carousels, drawers, and luxury interactions.
 */

(function () {
  'use strict';
    /* =========================================================================
       JAIPUR RUGS LUXURY THEME ENGINE: AOS, SWIPER, DRAWERS, CART & WISHLIST
       ========================================================================= */

    // 1. BULLETPROOF AOS ENGINE
    function initBulletproofAOS() {
      try {
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          document.documentElement.classList.add('aos-disabled');
          return;
        }

        if (typeof AOS !== 'undefined') {
          AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 40,
            disableMutationObserver: false
          });
          setTimeout(function() {
            try { AOS.refreshHard(); } catch(e) {}
          }, 150);
        } else if (typeof document !== 'undefined') {
          document.documentElement.classList.add('aos-fallback-active');
        }
      } catch (e) {
        console.warn('AOS initialization error, falling back:', e);
        if (typeof document !== 'undefined') {
          document.documentElement.classList.add('aos-fallback-active');
        }
      }

      // Safety fallback 1: Force in-view elements after 600ms
      setTimeout(function() {
        if (typeof document === 'undefined') return;
        document.querySelectorAll('[data-aos]:not(.aos-animate)').forEach(function(el) {
          var rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight + 200) {
            el.classList.add('aos-animate');
          }
        });
      }, 600);

      // Safety fallback 2: Force ALL elements visible after 1.5s
      setTimeout(function() {
        if (typeof document === 'undefined') return;
        document.documentElement.classList.add('aos-fallback-active');
        document.querySelectorAll('[data-aos]:not(.aos-animate)').forEach(function(el) {
          el.classList.add('aos-animate');
        });
      }, 1500);
    }

    // 2. SWIPER BESTSELLER CAROUSEL
    var productSwiperInstance = null;
    function initSwiper() {
      try {
        if (typeof Swiper !== 'undefined' && typeof document !== 'undefined' && document.querySelector('.productSwiper')) {
          productSwiperInstance = new Swiper('.productSwiper', {
            slidesPerView: 1.15,
            spaceBetween: 16,
            grabCursor: true,
            loop: false,
            navigation: {
              nextEl: '#nextSlide',
              prevEl: '#prevSlide',
            },
            breakpoints: {
              640: {
                slidesPerView: 2.2,
                spaceBetween: 20
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 24
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 28
              }
            },
            observer: true,
            observeParents: true,
            resizeObserver: true
          });
        }
      } catch (e) {
        console.error('Swiper initialization error:', e);
      }
    }

    // 3. HEADER SCROLL DYNAMICS
    function initHeaderScroll() {
      if (typeof document === 'undefined') return;
      var headerWrapper = document.getElementById('MainHeaderWrapper');
      var backToTopBtn = document.getElementById('BackToTopBtn');
      var isSubpage = document.body.classList.contains('luxury-subpage') || 
                      (window.location.pathname.indexOf('preview.html') === -1 && 
                       window.location.pathname.indexOf('index.html') === -1 && 
                       window.location.pathname !== '/');

      function handleScroll() {
        var scrollY = window.pageYOffset || document.documentElement.scrollTop;
        if (headerWrapper) {
          if (isSubpage) {
            headerWrapper.classList.add('is-scrolled');
          } else {
            if (scrollY > 80) {
              headerWrapper.classList.add('is-scrolled');
            } else {
              headerWrapper.classList.remove('is-scrolled');
            }
          }
        }

        if (backToTopBtn) {
          if (scrollY > 400) {
            backToTopBtn.classList.add('is-visible');
          } else {
            backToTopBtn.classList.remove('is-visible');
          }
        }
      }

      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();

      if (backToTopBtn) {
        backToTopBtn.addEventListener('click', function(e) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }

    // 4. ANNOUNCEMENT ROTATOR
    function initAnnouncementRotator() {
      if (typeof document === 'undefined') return;
      var rotator = document.getElementById('AnnouncementRotator');
      if (rotator) {
        var items = rotator.querySelectorAll('.luxury-announcement-bar__item');
        if (items.length > 1) {
          var currIdx = 0;
          var isPaused = false;
          rotator.addEventListener('mouseenter', function() { isPaused = true; });
          rotator.addEventListener('mouseleave', function() { isPaused = false; });
          setInterval(function() {
            if (isPaused) return;
            items[currIdx].classList.remove('is-active');
            currIdx = (currIdx + 1) % items.length;
            items[currIdx].classList.add('is-active');
          }, 4000);
        }
      }
    }

    // 5. ANIMATED NUMERICAL COUNTERS
    function initCounters() {
      if (typeof document === 'undefined') return;
      var counters = document.querySelectorAll('[data-counter-target]');
      if ('IntersectionObserver' in window && counters.length) {
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              var el = entry.target;
              var target = parseInt(el.getAttribute('data-counter-target'), 10);
              var suffix = el.getAttribute('data-counter-suffix') || '';
              var start = null;
              var dur = 2000;
              function step(ts) {
                if (!start) start = ts;
                var p = Math.min((ts - start) / dur, 1);
                var val = Math.floor((1 - Math.pow(1 - p, 3)) * target);
                el.textContent = val.toLocaleString() + suffix;
                if (p < 1) requestAnimationFrame(step);
                else el.textContent = target.toLocaleString() + suffix;
              }
              requestAnimationFrame(step);
              observer.unobserve(el);
            }
          });
        }, { threshold: 0.3 });
        counters.forEach(function(c) { observer.observe(c); });
      }
    }

    // 6. DRAWERS, CART & WISHLIST ENGINE (GLOBAL ON WINDOW)
    if (typeof window !== 'undefined') {
      window.closeAllDrawers = function() {
        var overlay = document.getElementById('DrawerOverlay');
        var cartDrawer = document.getElementById('CartDrawer');
        var wishlistDrawer = document.getElementById('WishlistDrawer');
        var searchModal = document.getElementById('SearchModal');
        if (overlay) overlay.classList.remove('is-active');
        if (cartDrawer) cartDrawer.classList.remove('is-active');
        if (wishlistDrawer) wishlistDrawer.classList.remove('is-active');
        if (searchModal) searchModal.classList.remove('is-active');
        document.body.style.overflow = '';
      };

      window.openCart = function() {
        window.closeAllDrawers();
        var cartDrawer = document.getElementById('CartDrawer');
        var overlay = document.getElementById('DrawerOverlay');
        if (cartDrawer) cartDrawer.classList.add('is-active');
        if (overlay) overlay.classList.add('is-active');
        document.body.style.overflow = 'hidden';
      };

      window.closeCart = function() {
        var cartDrawer = document.getElementById('CartDrawer');
        var overlay = document.getElementById('DrawerOverlay');
        if (cartDrawer) cartDrawer.classList.remove('is-active');
        if (overlay) overlay.classList.remove('is-active');
        document.body.style.overflow = '';
      };

      window.openWishlist = function() {
        window.closeAllDrawers();
        var wishlistDrawer = document.getElementById('WishlistDrawer');
        var overlay = document.getElementById('DrawerOverlay');
        if (wishlistDrawer) wishlistDrawer.classList.add('is-active');
        if (overlay) overlay.classList.add('is-active');
        document.body.style.overflow = 'hidden';
      };

      window.closeWishlist = function() {
        var wishlistDrawer = document.getElementById('WishlistDrawer');
        var overlay = document.getElementById('DrawerOverlay');
        if (wishlistDrawer) wishlistDrawer.classList.remove('is-active');
        if (overlay) overlay.classList.remove('is-active');
        document.body.style.overflow = '';
      };

      window.openSearch = function() {
        window.closeAllDrawers();
        var searchModal = document.getElementById('SearchModal');
        var overlay = document.getElementById('DrawerOverlay');
        if (searchModal) searchModal.classList.add('is-active');
        if (overlay) overlay.classList.add('is-active');
        setTimeout(function() {
          var input = document.getElementById('SearchInput');
          if (input) input.focus();
        }, 150);
      };

      window.closeSearch = function() {
        var searchModal = document.getElementById('SearchModal');
        var overlay = document.getElementById('DrawerOverlay');
        if (searchModal) searchModal.classList.remove('is-active');
        if (overlay) overlay.classList.remove('is-active');
      };

      // ESC to close any drawer
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
          window.closeAllDrawers();
        }
      });

      // Cart state & interactions
      window.cartCount = 2;
      window.cartSubtotal = 4020;

      window.bumpBadge = function(id) {
        var badge = document.getElementById(id);
        if (badge) {
          badge.classList.remove('badge-pop');
          void badge.offsetWidth;
          badge.classList.add('badge-pop');
        }
      };

      window.updateQty = function(itemNum, change) {
        var qtyInput = document.getElementById('qty-' + itemNum);
        if (!qtyInput) return;
        var cur = parseInt(qtyInput.value, 10);
        var next = cur + change;
        if (next <= 0) {
          window.removeCartItem(itemNum);
        } else {
          qtyInput.value = next;
          window.cartCount += change;
          var unitPrice = itemNum === 1 ? 1480 : 2540;
          window.cartSubtotal += change * unitPrice;
          var subEl = document.getElementById('CartSubtotal');
          if (subEl) subEl.textContent = '$' + window.cartSubtotal.toLocaleString() + '.00';
          var cB = document.getElementById('CartBubble');
          var dCB = document.getElementById('DrawerCartBubble');
          if (cB) cB.textContent = window.cartCount;
          if (dCB) dCB.textContent = window.cartCount;
          window.bumpBadge('CartBubble');
        }
      };

      window.removeCartItem = function(itemNum) {
        var itemEl = document.getElementById('CartItem-' + itemNum);
        if (itemEl) {
          var qtyInput = document.getElementById('qty-' + itemNum);
          var q = qtyInput ? parseInt(qtyInput.value, 10) : 1;
          var unitPrice = itemNum === 1 ? 1480 : 2540;
          window.cartSubtotal -= q * unitPrice;
          window.cartCount -= q;
          itemEl.remove();
          var subEl = document.getElementById('CartSubtotal');
          if (subEl) subEl.textContent = '$' + window.cartSubtotal.toLocaleString() + '.00';
          var cB = document.getElementById('CartBubble');
          var dCB = document.getElementById('DrawerCartBubble');
          if (cB) cB.textContent = window.cartCount;
          if (dCB) dCB.textContent = window.cartCount;
          window.bumpBadge('CartBubble');
          if (window.cartCount <= 0) {
            var list = document.getElementById('CartItemsList');
            if (list) list.innerHTML = '<div style="text-align:center; padding: 4rem 1.5rem; color:#8A847C;"><h3 style="font-family: Cormorant Garamond; font-size: 1.8rem; color:#1E1E1E;">Your Sanctuary Bag is Empty</h3></div>';
            var foot = document.getElementById('CartFooter');
            if (foot) foot.style.display = 'none';
          }
        }
      };

      window.quickAddDemo = function(name, price) {
        window.cartCount++;
        window.cartSubtotal += price;
        var cB = document.getElementById('CartBubble');
        var dCB = document.getElementById('DrawerCartBubble');
        var subEl = document.getElementById('CartSubtotal');
        if (cB) cB.textContent = window.cartCount;
        if (dCB) dCB.textContent = window.cartCount;
        if (subEl) subEl.textContent = '$' + window.cartSubtotal.toLocaleString() + '.00';
        window.bumpBadge('CartBubble');
        window.openCart();
      };

      // Wishlist Toggle
      window.wishlistCount = 1;
      window.toggleHeart = function(btn, name) {
        var isSaved = btn.classList.contains('is-saved');
        if (isSaved) {
          btn.classList.remove('is-saved');
          var svg = btn.querySelector('svg');
          if (svg) {
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
          }
          window.wishlistCount = Math.max(0, window.wishlistCount - 1);
        } else {
          btn.classList.add('is-saved');
          var svg = btn.querySelector('svg');
          if (svg) {
            svg.setAttribute('fill', '#C44D44');
            svg.setAttribute('stroke', '#C44D44');
          }
          btn.classList.add('badge-pop');
          setTimeout(function() { btn.classList.remove('badge-pop'); }, 400);
          window.wishlistCount++;
        }
        var wB = document.getElementById('WishlistBubble');
        var dWB = document.getElementById('DrawerWishlistBubble');
        if (wB) wB.textContent = window.wishlistCount;
        if (dWB) dWB.textContent = window.wishlistCount;
        window.bumpBadge('WishlistBubble');
      };

      window.addFromWishlistToCart = function() {
        window.quickAddDemo('Oushak Serenade Ivory Loom Rug', 1650);
        window.closeWishlist();
      };

      window.removeWishlistItem = function(btn) {
        var item = btn.closest('.luxury-cart-item');
        if (item) item.remove();
        window.wishlistCount = Math.max(0, window.wishlistCount - 1);
        var wB = document.getElementById('WishlistBubble');
        var dWB = document.getElementById('DrawerWishlistBubble');
        if (wB) wB.textContent = window.wishlistCount;
        if (dWB) dWB.textContent = window.wishlistCount;
        window.bumpBadge('WishlistBubble');
        if (window.wishlistCount === 0) {
          var list = document.getElementById('WishlistItemsList');
          if (list) list.innerHTML = '<div style="text-align:center; padding: 4rem 1.5rem; color:#8A847C;"><h3 style="font-family: Cormorant Garamond; font-size: 1.8rem; color:#1E1E1E;">Your Wishlist is Empty</h3></div>';
        }
      };

      window.handleNewsletterSubmit = function(e) {
        e.preventDefault();
        var input = document.getElementById('newsletterEmailInput');
        if (input) input.value = '';
        var msg = document.getElementById('newsletterSuccessMessage');
        if (msg) {
          msg.style.display = 'flex';
          setTimeout(function() { msg.style.display = 'none'; }, 5000);
        }
      };

      // BOOTSTRAP ALL COMPONENTS SAFELY
      function bootTheme() {
        initBulletproofAOS();
        initSwiper();
        initHeaderScroll();
        initAnnouncementRotator();
        initCounters();
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootTheme);
      } else {
        bootTheme();
      }

      window.addEventListener('load', function() {
        if (typeof AOS !== 'undefined') {
          try { AOS.refreshHard(); } catch(e) {}
        }
        if (productSwiperInstance) {
          try { productSwiperInstance.update(); } catch(e) {}
        }
      });
    }

})();
