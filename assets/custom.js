document.addEventListener("DOMContentLoaded", function () {

  const UPSELL_VARIANT_ID = 45111153393864;
  const MIN_AVAILABLE_SIZES = 3;
  const INLINE_SECTION_SELECTOR = "._inline_1q1d2_47";

  const isStairRug = window.isStairRugProduct === true;

  const productHandle = window.location.pathname
    .split("/")
    .filter(Boolean)
    .pop();

  // NEW storage version: ignores old saved selections.
  const STORAGE_PREFIX = "dynamicHiddenVariants_v2_";

  // ----------------------------------------
  // GET PRODUCT ELEMENTS
  // ----------------------------------------

  function getProductElements() {
    return {
      addToCartButtons: document.querySelectorAll(
        'product-form button[type="submit"], .product-form__submit'
      ),
      paymentButtons: document.querySelectorAll(
        ".shopify-payment-button"
      ),
      upsellCards: document.querySelectorAll(
        ".upsell-card, .product-upsell, .frequently-bought-together"
      ),
      enquiryForms: document.querySelectorAll(
        ".shopify-block.shopify-app-block"
      ),
      inlineSections: document.querySelectorAll(
        INLINE_SECTION_SELECTOR
      )
    };
  }

  // ----------------------------------------
  // SIZE FIELDSETS
  // ----------------------------------------

  function getSizeFieldsets() {
    return Array.from(
      document.querySelectorAll(
        "variant-radios fieldset, variant-selects fieldset"
      )
    ).filter(function (fieldset) {

      const legend = fieldset.querySelector("legend");

      return legend &&
        legend.textContent.trim().toLowerCase().includes("size");
    });
  }

  // ----------------------------------------
  // FORMAT SIZE LABELS
  // ----------------------------------------

  function formatSizeLabels() {

    document.querySelectorAll(
      "variant-radios fieldset label"
    ).forEach(function (label) {

      label.childNodes.forEach(function (node) {

        if (node.nodeType === Node.TEXT_NODE) {

          node.textContent = node.textContent
            .replace(/\bft\b/gi, "FT")
            .replace(/(\d+)\s*cm\b/gi, "$1 cm");

        }
      });
    });
  }

  // ----------------------------------------
  // CALCULATE DYNAMIC UNAVAILABLE COUNT
  // ----------------------------------------

  function calculateHiddenCount(optionCount) {

    // Never hide all sizes or leave fewer than 3 available.
    const maxHidden = Math.max(
      0,
      optionCount - MIN_AVAILABLE_SIZES
    );

    if (maxHidden === 0) return 0;

    // Randomly hide approximately 40% to 50%.
    const minimum = Math.min(
      maxHidden,
      Math.max(1, Math.floor(optionCount * 0.4))
    );

    const maximum = Math.min(
      maxHidden,
      Math.max(minimum, Math.ceil(optionCount * 0.5))
    );

    return Math.floor(
      Math.random() * (maximum - minimum + 1)
    ) + minimum;
  }

  // ----------------------------------------
  // GET SAVED RANDOM SIZE INDEXES
  // ----------------------------------------

  function getHiddenIndices(optionKey, optionCount) {

    const storageKey =
      STORAGE_PREFIX + productHandle + "_" + optionKey;

    const requiredCount = calculateHiddenCountForValidation(
      optionCount
    );

    if (requiredCount === 0) {
      return [];
    }

    let saved = null;

    try {
      saved = JSON.parse(
        localStorage.getItem(storageKey)
      );
    } catch (error) {
      saved = null;
    }

    // Reuse saved indexes only if they are valid.
    if (
      Array.isArray(saved) &&
      saved.length >= 1 &&
      saved.length <= optionCount - MIN_AVAILABLE_SIZES &&
      new Set(saved).size === saved.length &&
      saved.every(function (index) {
        return Number.isInteger(index) &&
          index >= 0 &&
          index < optionCount;
      })
    ) {
      return saved;
    }

    // Generate a new random selection.
    const hiddenCount = calculateHiddenCount(optionCount);

    const indexes = Array.from(
      { length: optionCount },
      function (_, index) {
        return index;
      }
    );

    // Shuffle indexes.
    for (let i = indexes.length - 1; i > 0; i--) {

      const j = Math.floor(
        Math.random() * (i + 1)
      );

      [indexes[i], indexes[j]] =
        [indexes[j], indexes[i]];
    }

    const hiddenIndices = indexes
      .slice(0, hiddenCount)
      .sort(function (a, b) {
        return a - b;
      });

    localStorage.setItem(
      storageKey,
      JSON.stringify(hiddenIndices)
    );

    return hiddenIndices;
  }

  // Calculate a valid count range without generating randomness.
  function calculateHiddenCountForValidation(optionCount) {

    const maxHidden = Math.max(
      0,
      optionCount - MIN_AVAILABLE_SIZES
    );

    if (maxHidden === 0) return 0;

    const minimum = Math.min(
      maxHidden,
      Math.max(1, Math.floor(optionCount * 0.4))
    );

    return minimum;
  }


  // ----------------------------------------
  // UPDATE SIZE VARIANTS
  // ----------------------------------------

  function updateSizeVariants() {

    if (isStairRug) return;

    getSizeFieldsets().forEach(function (fieldset, fieldsetIndex) {

      const inputs = Array.from(
        fieldset.querySelectorAll('input[type="radio"]')
      );

      if (!inputs.length) return;

      const hiddenIndices = getHiddenIndices(
        "size_" + fieldsetIndex,
        inputs.length
      );

      inputs.forEach(function (input, index) {

        const label = fieldset.querySelector(
          'label[for="' + input.id + '"]'
        );

        if (!label) return;

        label.classList.remove("variant-faded");

        const oldText = label.querySelector(
          ".make-to-order-text"
        );

        if (oldText) oldText.remove();

        input.removeAttribute("data-make-to-order");

        if (hiddenIndices.includes(index)) {

          input.setAttribute(
            "data-make-to-order",
            "true"
          );

          label.classList.add("variant-faded");

          const text = document.createElement("span");

          text.className = "make-to-order-text";
          text.textContent = "OUT OF STOCK";

          label.appendChild(text);
        }
      });
    });
  }

  // ----------------------------------------
  // UPDATE BUTTONS AND ENQUIRY FORMS
  // ----------------------------------------

  function updateUI() {

    const selectedMakeToOrder = document.querySelector(
      'input[data-make-to-order="true"]:checked'
    );

    const isMakeToOrder = !!selectedMakeToOrder;

    const elements = getProductElements();

    elements.addToCartButtons.forEach(function (button) {
      button.style.display = isMakeToOrder ? "none" : "";
    });

    elements.paymentButtons.forEach(function (button) {
      button.style.display = isMakeToOrder ? "none" : "";
    });

    elements.upsellCards.forEach(function (card) {
      card.style.display = isMakeToOrder ? "none" : "";
    });

    elements.enquiryForms.forEach(function (form) {
      form.style.display = isMakeToOrder ? "" : "none";
    });

    elements.inlineSections.forEach(function (section) {
      section.style.display = isMakeToOrder ? "none" : "";
    });
  }

  // ----------------------------------------
  // REFRESH
  // ----------------------------------------

  function refreshVariantUI() {

    formatSizeLabels();

    if (!isStairRug) {
      updateSizeVariants();
    }

    updateUI();
  }

  // ----------------------------------------
  // INITIAL SETUP
  // ----------------------------------------

  if (!isStairRug) {
    refreshVariantUI();
  } else {
    updateUI();
  }

  // ----------------------------------------
  // VARIANT CHANGE
  // ----------------------------------------

  document.addEventListener("change", function (event) {

    if (
      event.target.matches(
        'variant-radios input[type="radio"]'
      ) ||
      event.target.matches(
        "variant-selects select"
      )
    ) {
      updateUI();
    }
  });

  // ----------------------------------------
  // FREE ANTI-SLIP MAT UPSELL
  // ----------------------------------------

  document.addEventListener("click", async function (event) {

    const addButton = event.target.closest(
      'product-form button[type="submit"], .product-form__submit'
    );

    if (!addButton) return;

    const checkbox = document.querySelector(
      "#upsell-checkbox"
    );

    if (!checkbox || !checkbox.checked) return;

    if (addButton.dataset.upsellProcessing === "true") return;

    addButton.dataset.upsellProcessing = "true";

    try {

      const cartResponse = await fetch("/cart.js");
      const cart = await cartResponse.json();

      const existingMat = cart.items.find(function (item) {
        return String(item.variant_id) ===
          String(UPSELL_VARIANT_ID);
      });

      if (!existingMat) {

        await fetch("/cart/add.js", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: UPSELL_VARIANT_ID,
            quantity: 1
          })
        });

      }

    } catch (error) {

      console.error("Free mat upsell error:", error);

    } finally {

      addButton.dataset.upsellProcessing = "false";

    }
  });

  // ----------------------------------------
  // SHOPIFY MUTATION OBSERVER
  // ----------------------------------------

  let refreshScheduled = false;

  const observer = new MutationObserver(function () {

    if (refreshScheduled) return;

    refreshScheduled = true;

    requestAnimationFrame(function () {

      refreshScheduled = false;
      refreshVariantUI();

    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

});


/*old js code*/
document.addEventListener("DOMContentLoaded", () => {

  // ===================================
  // PRODUCT KEY
  // ===================================

  const productKey =
    "hiddenVariants_" + window.location.pathname;

  // ===================================
  // FREE MAT VARIANT ID
  // ===================================

  const UPSELL_VARIANT_ID =
    45111153393864;

  // ===================================
  // NEW FEATURE: INLINE SECTION TO TOGGLE
  // ===================================

  const INLINE_SECTION_SELECTOR = "._inline_1q1d2_47";

  function updateInlineSectionVisibility() {

    const checkedInputs = document.querySelectorAll(
      'fieldset input[type="radio"]:checked'
    );

    let shouldHide = false;

    checkedInputs.forEach(input => {

      // Try to find label using "for"
      const label = document.querySelector(
        `label[for="${input.id}"]`
      );

      // fallback for DOM structure cases
      const adjacentLabel = input.nextElementSibling;

      const finalLabel = label || adjacentLabel;

      if (finalLabel && finalLabel.matches("label")) {

        // YOUR RULE: checked input + label
        if (input.checked && finalLabel) {
          shouldHide = true;
        }

      }

    });

    const section = document.querySelector(INLINE_SECTION_SELECTOR);

    if (section) {
      section.style.display = shouldHide ? "none" : "";
    }

  }

  // ===================================
  // HIDE STYLE VARIANTS
  // ===================================

  function hideStyleVariants() {

    const fieldsets =
      document.querySelectorAll("fieldset");

    fieldsets.forEach(fieldset => {

      const legend =
        fieldset.querySelector("legend");

      if (!legend) return;

      const legendText =
        legend.textContent
          .trim()
          .toLowerCase();

      if (legendText.includes("style")) {

        fieldset.style.display =
          "none";

      }

    });

  }

  hideStyleVariants();

  // ===================================
  // VARIANT FIELDSETS
  // ===================================

const fieldsets = document.querySelectorAll(
  "variant-radios fieldset, variant-selects fieldset"
);

// Check if we are on the specific product page
const isTargetProduct = window.location.pathname.includes("attractive-yellow-farmhouse-handmade-indian-cotton-rug-dgp-30");

fieldsets.forEach((fieldset, fieldsetIndex) => {
  const legendText = fieldset.querySelector("legend")?.textContent.trim().toLowerCase() || "";
  if (legendText.includes("style")) return;

  const labels = [...fieldset.querySelectorAll("label")];
  if (labels.length <= 3) return;

  // Reset styles first
  labels.forEach(label => label.classList.remove("variant-faded"));

  let hiddenIndices = [];

if (isTargetProduct && legendText.includes("size")) {
  hiddenIndices = [];
}
   else {
  hiddenIndices = [];
}

  // Apply the Faded Class based on calculated indices
  labels.forEach((label, index) => {
    if (hiddenIndices.includes(index)) {
      label.classList.add("variant-faded");
      const inputId = label.getAttribute("for");
      const input = document.getElementById(inputId);
      if (input) input.dataset.makeToOrder = "true";
    }
  });
});

  // ===================================
  // SELECTORS
  // ===================================

  function getAddToCartButton() {
    return document.querySelector('button[name="add"]');
  }

  function getPaymentButton() {
    return document.querySelector(".shopify-payment-button");
  }

  // ===================================
  // UPDATE UI
  // ===================================

  function updateUI() {

    const unavailableVariant =
      document.querySelector(
        '[data-make-to-order="true"]:checked'
      );

    const addToCartBtn =
      getAddToCartButton();

    const paymentBtn =
      getPaymentButton();

    const upsellCard =
      document.querySelector(".upsell-card");

    // ===================================
    // UNAVAILABLE
    // ===================================

    if (addToCartBtn) {
  addToCartBtn.style.display = "";
  addToCartBtn.disabled = false;
}

if (paymentBtn) {
  paymentBtn.style.display = "";
  paymentBtn.style.pointerEvents = "";
  paymentBtn.style.opacity = "";
}

if (upsellCard) {
  upsellCard.style.display = "";
} else {

     if (addToCartBtn) {
  addToCartBtn.style.display = "";
  addToCartBtn.disabled = false;
}

if (paymentBtn) {
  paymentBtn.style.display = "";
  paymentBtn.style.pointerEvents = "";
  paymentBtn.style.opacity = "";
}

if (upsellCard) {
  upsellCard.style.display = "";
}

    }

    // anti slipmat included NEW FEATURE CALL
    updateInlineSectionVisibility();

  }

  // ===================================
  // INITIAL LOAD
  // ===================================

  setTimeout(updateUI, 500);

  // ===================================
  // VARIANT CHANGE
  // ===================================

  document.addEventListener("change", function (e) {

    if (e.target.matches('input[type="radio"]')) {
      setTimeout(updateUI, 100);
    }

  });

  // ===================================
  // AUTO ADD FREE MAT
  // ===================================

  const addToCartBtn = getAddToCartButton();

  if (addToCartBtn) {

    addToCartBtn.addEventListener("click", async function () {

      const checkbox =
        document.querySelector("#upsell-checkbox");

      if (!checkbox || !checkbox.checked) return;

      try {

        const cart =
          await fetch("/cart.js").then(res => res.json());

        const alreadyAdded =
          cart.items.some(
            item => item.variant_id === UPSELL_VARIANT_ID
          );

        if (!alreadyAdded) {

          await fetch("/cart/add.js", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id: UPSELL_VARIANT_ID,
              quantity: 1
            })
          });

        }

      } catch (error) {
        console.error("Upsell Error:", error);
      }

    });

  }

  // ===================================
  // OBSERVER
  // ===================================

  const observer =
    new MutationObserver(() => {

      hideStyleVariants();

      // keep inline section synced on DOM updates
      updateInlineSectionVisibility();

    });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
      

  
});


/* =========================================
   UNIVERSAL READ MORE / READ LESS
   ========================================= */

document.addEventListener('click', function (event) {

  var button = event.target.closest('.read-more-btn');

  if (!button) return;

  var wrapper = button.closest(
    '.story-read-more, .rich-read-more, .accordion__content'
  );

  if (!wrapper) return;

  var content = wrapper.querySelector('.read-more-content');

  if (!content) return;

  event.preventDefault();

  var expanded = content.classList.contains('is-expanded');

  if (expanded) {
    content.classList.remove('is-expanded');
    button.textContent = 'Read More';
    button.setAttribute('aria-expanded', 'false');
  } else {
    content.classList.add('is-expanded');
    button.textContent = 'Read Less';
    button.setAttribute('aria-expanded', 'true');
  }

});

 /* //varient selection js
document.addEventListener("DOMContentLoaded", function () {

    function toggleEnquiryForm() {
  const form = document.querySelector(".shopify-block.shopify-app-block");

  if (!form) return;

  form.style.display = "none";
}

    // Initial load
    toggleEnquiryForm();

    // When variant changes
    document.addEventListener("change", function (e) {
        if (e.target.matches('.product-form__input--pill input[type="radio"]')) {
            setTimeout(toggleEnquiryForm, 50);
        }
    });

});*/

//baskets text js
document.addEventListener('DOMContentLoaded', function () {

  const basketNumberElements = document.querySelectorAll('.basket-number');

  if (!basketNumberElements.length) return;

  // Get the current product URL
  const productUrl = window.location.pathname;

  // Create a consistent number from the product URL
  let hash = 0;

  for (let i = 0; i < productUrl.length; i++) {
    hash = ((hash << 5) - hash) + productUrl.charCodeAt(i);
    hash = hash & hash;
  }

  // Convert to a number between 2 and 7
  const basketNumber = Math.abs(hash % 6) + 2;

  // Display the number
  basketNumberElements.forEach(function (element) {
    element.textContent = basketNumber;
  });

});

//form css
window.addEventListener('DOMContentLoaded', () => {
  const applyStyles = setInterval(() => {
    const host = document.querySelector('shopify-forms-embed, form-embed');
    if (host && host.shadowRoot) {
      const shadowRoot = host.shadowRoot;
      if (!shadowRoot.getElementById('custom-grid-content-fix')) {
        const style = document.createElement('style');
        style.id = 'custom-grid-content-fix';
        style.textContent = `
          ._gridItemContent_1q1d2_257 {
            border: 1px solid #00000033 !important;
            padding: 20px !important;
            border-radius: 8px !important;
          }
        `;
        shadowRoot.appendChild(style);
        clearInterval(applyStyles);
      }
    }
  }, 300);
});

/* //new css
document.addEventListener("DOMContentLoaded", () => {

  // ===================================
  // PRODUCT KEY
  // ===================================

  const productKey =
    "hiddenVariants_" + window.location.pathname;

  // ===================================
  // FREE MAT VARIANT ID
  // ===================================

  const UPSELL_VARIANT_ID =
    45111153393864;

  // ===================================
  // NEW FEATURE: INLINE SECTION TO TOGGLE
  // ===================================

  const INLINE_SECTION_SELECTOR = "._inline_1q1d2_47";

  function updateInlineSectionVisibility() {

    const checkedInputs = document.querySelectorAll(
      'fieldset input[type="radio"]:checked'
    );

    let shouldHide = false;

    checkedInputs.forEach(input => {

      const label = document.querySelector(
        `label[for="${input.id}"]`
      );

      const adjacentLabel = input.nextElementSibling;
      const finalLabel = label || adjacentLabel;

      if (finalLabel && finalLabel.matches("label")) {
        if (input.checked && finalLabel) {
          shouldHide = true;
        }
      }

    });

    const section = document.querySelector(INLINE_SECTION_SELECTOR);

    if (section) {
      section.style.display = shouldHide ? "none" : "";
    }

  }

  // ===================================
  // HIDE STYLE VARIANTS
  // ===================================

  function hideStyleVariants() {

    const fieldsets =
      document.querySelectorAll("fieldset");

    fieldsets.forEach(fieldset => {

      const legend =
        fieldset.querySelector("legend");

      if (!legend) return;

      const legendText =
        legend.textContent
          .trim()
          .toLowerCase();

      if (legendText.includes("style")) {
        fieldset.style.display = "none";
      }

    });

  }

  hideStyleVariants();

  // ===================================
  // VARIANT FIELDSETS & TEXT FORMATTING
  // ===================================

  const fieldsets = document.querySelectorAll(
    "variant-radios fieldset, variant-selects fieldset"
  );

  const isTargetProduct = window.location.pathname.includes("attractive-yellow-farmhouse-handmade-indian-cotton-rug-dgp-30");

  fieldsets.forEach((fieldset, fieldsetIndex) => {
    const legendText = fieldset.querySelector("legend")?.textContent.trim().toLowerCase() || "";
    if (legendText.includes("style")) return;

    const labels = [...fieldset.querySelectorAll("label")];
    if (labels.length <= 3) return;

    labels.forEach(label => label.classList.remove("variant-faded"));

    let hiddenIndices = [];

    hiddenIndices = [];

    labels.forEach((label, index) => {
      // 1. Convert lowercase "ft" to uppercase "FT"
      if (label.innerHTML.includes("ft")) {
        label.innerHTML = label.innerHTML.replace(/ft/g, "FT");
      }

      // 2. Put the centimeter numbers into brackets, leaving "cm" outside (e.g., "(300x420) cm")
      if (label.innerHTML.includes("cm") && !label.innerHTML.includes("(")) {
  label.innerHTML = label.innerHTML.replace(
    /([0-9]+\s*x\s*[0-9]+)\s*cm/gi,
    "($1 cm)"
  );
}


      if (hiddenIndices.includes(index)) {
        label.classList.add("variant-faded");
        const inputId = label.getAttribute("for");
        const input = document.getElementById(inputId);
        if (input) input.dataset.makeToOrder = "true";
      }

      // 3. Add "Make to order" hover text for out-of-stock / faded variants
      const inputId = label.getAttribute("for");
      const input = inputId ? document.getElementById(inputId) : label.previousElementSibling;
      const isOutOfStock = label.classList.contains("variant-faded") || 
                           label.classList.contains("sold-out") || 
                           label.classList.contains("disabled") || 
                           (input && (input.disabled || input.dataset.makeToOrder === "true"));

      if (isOutOfStock) {
        label.setAttribute("title", "Make to order");
      }
    });
  });

  // ===================================
  // SELECTORS & UI UPDATES
  // ===================================

  function getAddToCartButton() {
    return document.querySelector('button[name="add"]');
  }

  function getPaymentButton() {
    return document.querySelector(".shopify-payment-button");
  }

  function updateUI() {
    const unavailableVariant =
      document.querySelector(
        '[data-make-to-order="true"]:checked'
      );

    const addToCartBtn = getAddToCartButton();
    const paymentBtn = getPaymentButton();
    const upsellCard = document.querySelector(".upsell-card");

    if (unavailableVariant) {
      if (addToCartBtn) addToCartBtn.style.display = "none";
      if (paymentBtn) paymentBtn.style.display = "none";
      if (upsellCard) upsellCard.style.display = "none";
    } else {
      if (addToCartBtn) addToCartBtn.style.display = "";
      if (paymentBtn) paymentBtn.style.display = "";
      if (upsellCard) upsellCard.style.display = "";
    }

    updateInlineSectionVisibility();
  }

  setTimeout(updateUI, 500);

  document.addEventListener("change", function (e) {
    if (e.target.matches('input[type="radio"]')) {
      setTimeout(updateUI, 100);
    }
  });

  // ===================================
  // AUTO ADD FREE MAT
  // ===================================

  const addToCartBtn = getAddToCartButton();

if (addToCartBtn) {
  addToCartBtn.addEventListener("click", async function () {
    try {
      const cart = await fetch("/cart.js").then(res => res.json());
      const alreadyAdded = cart.items.some(item => item.variant_id === UPSELL_VARIANT_ID);

      if (!alreadyAdded) {
        await fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: UPSELL_VARIANT_ID, quantity: 1 })
        });
      }
    } catch (error) {
      console.error("Upsell Error:", error);
    }
  });
}
  // ===================================
  // OBSERVER
  // ===================================

  const observer = new MutationObserver(() => {
    hideStyleVariants();
    updateInlineSectionVisibility();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

}); */

//faq read more js
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".read-more-toggle").forEach(button => {
    button.addEventListener("click", function () {
      const content = this.closest(".accordion__content");
      content.classList.toggle("expanded");
      this.textContent = content.classList.contains("expanded") ? "Read Less" : "Read More";
    });
  });
});

//image rich text js
document.addEventListener("DOMContentLoaded", function(){
    document.querySelectorAll(".story-read-more").forEach(function(wrapper){
        const paragraphs = wrapper.querySelectorAll("p");
        const btn = wrapper.querySelector(".story-read-more-btn");

        if(paragraphs.length <= 1){
            btn.style.display = "none";
            return;
        }

        btn.addEventListener("click", function(){
            wrapper.classList.toggle("expanded");
            btn.textContent = wrapper.classList.contains("expanded") ? "Read Less" : "Read More";
        });
    });
});

//rich text read more js
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".rich-read-more").forEach(function(wrapper){
    const content = wrapper.querySelector(".read-more-content");
    const button = wrapper.querySelector(".read-more-btn");

    if (content.scrollHeight <= content.clientHeight) {
      button.style.display = "none";
      return;
    }

    button.addEventListener("click", function () {
      wrapper.classList.toggle("expanded");
      button.textContent = wrapper.classList.contains("expanded") ? "Read Less" : "Read More";
    });
  });
});

/* //variant selection & form toggle js
document.addEventListener("DOMContentLoaded", function () {
    function toggleEnquiryForm() {
        const form = document.querySelector(".shopify-block.shopify-app-block");
        const selectedInput = document.querySelector('.product-form__input--pill input[type="radio"]:checked');

        if (!form || !selectedInput) return;

        const selectedLabel = selectedInput.nextElementSibling;

        if (selectedLabel.classList.contains("variant-faded")) {
            form.style.display = "block";
        } else {
            form.style.display = "none";
        }
    }

    toggleEnquiryForm();

    document.addEventListener("change", function (e) {
        if (e.target.matches('.product-form__input--pill input[type="radio"]')) {
            setTimeout(toggleEnquiryForm, 50);
        }
    });
});*/

//baskets text js
document.addEventListener('DOMContentLoaded', function () {
  const basketNumberElements = document.querySelectorAll('.basket-number');
  if (!basketNumberElements.length) return;

  const productUrl = window.location.pathname;
  let hash = 0;

  for (let i = 0; i < productUrl.length; i++) {
    hash = ((hash << 5) - hash) + productUrl.charCodeAt(i);
    hash = hash & hash;
  }

  const basketNumber = Math.abs(hash % 6) + 2;

  basketNumberElements.forEach(function (element) {
    element.textContent = basketNumber;
  });
});

//form css injection for shadow root
window.addEventListener('DOMContentLoaded', () => {
  const applyStyles = setInterval(() => {
    const host = document.querySelector('shopify-forms-embed, form-embed');
    if (host && host.shadowRoot) {
      const shadowRoot = host.shadowRoot;
      if (!shadowRoot.getElementById('custom-grid-content-fix')) {
        const style = document.createElement('style');
        style.id = 'custom-grid-content-fix';
        style.textContent = `
          ._gridItemContent_1q1d2_257 {
            border: 1px solid #00000033 !important;
            padding: 20px !important;
            border-radius: 8px !important;
          }
        `;
        shadowRoot.appendChild(style);
        clearInterval(applyStyles);
      }
    }
  }, 300);
});

//product details collaps js
(function () {

  function setupProductDetailsReadMore() {

    const accordions = document.querySelectorAll('details');

    accordions.forEach(function (accordion) {

      /* Don't process the same accordion twice */
      if (accordion.dataset.readmoreInitialized === 'true') {
        return;
      }

      /* Find the Details metafield */
      const metafield = accordion.querySelector(
        '.metafield-multi_line_text_field'
      );

      if (!metafield) {
        return;
      }

      /* Make sure this is the product Details accordion */
      const summary = accordion.querySelector('summary');

      if (
        !summary ||
        !summary.textContent.toLowerCase().includes('details')
      ) {
        return;
      }

      accordion.dataset.readmoreInitialized = 'true';

      /* Find accordion content */
      const contentContainer =
        metafield.closest('.accordion__content') ||
        metafield.parentElement;

      if (!contentContainer) {
        return;
      }

      /* Create wrapper */
      const wrapper = document.createElement('div');

      wrapper.className =
        'product-details-readmore-active';

      /* Create content wrapper */
      const content = document.createElement('div');

      content.className =
        'product-details-readmore-content';

      /* Move existing content into our wrapper */
      while (contentContainer.firstChild) {
        content.appendChild(
          contentContainer.firstChild
        );
      }

      /* Create gradient */
      const fade = document.createElement('div');

      fade.className =
        'product-details-readmore-fade';

      /* Create button */
      const button = document.createElement('button');

      button.type = 'button';

      button.className =
        'product-details-readmore-button';

      button.setAttribute(
        'aria-expanded',
        'false'
      );

      button.textContent =
        'Learn more about this item';

      /* Assemble */
      wrapper.appendChild(content);
      wrapper.appendChild(fade);
      wrapper.appendChild(button);

      contentContainer.appendChild(wrapper);

      /* Wait for browser to calculate height */
      requestAnimationFrame(function () {

        /* If content isn't long enough, hide button */
        if (
          content.scrollHeight <=
          content.clientHeight + 2
        ) {
          button.style.display = 'none';
          fade.style.display = 'none';
          return;
        }

        /* Read More / Read Less */
        button.addEventListener(
          'click',
          function () {

            const expanded =
              wrapper.classList.toggle(
                'is-expanded'
              );

            button.setAttribute(
              'aria-expanded',
              expanded
                ? 'true'
                : 'false'
            );

            button.textContent =
              expanded
                ? 'Show less'
                : 'Learn more about this item';

          }
        );

      });

    });
  }

  /* Initial load */
  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      setupProductDetailsReadMore
    );

  } else {

    setupProductDetailsReadMore();

  }

  /* Shopify Theme Editor support */
  document.addEventListener(
    'shopify:section:load',
    function () {
      setupProductDetailsReadMore();
    }
  );

})();


/* Product Description ReadMore  button*/
(function () {
  "use strict";

  function initProductReadMore() {

    const descriptions = document.querySelectorAll(
      ".product__description"
    );

    descriptions.forEach(function (description) {

      /* IMPORTANT:
         Set this immediately so the script cannot
         initialize the same description twice.
      */
      if (description.dataset.readMoreInitialized === "true") {
        return;
      }

      description.dataset.readMoreInitialized = "true";

      const content =
        description.querySelector(".rte") || description;

      requestAnimationFrame(function () {

        /* Get actual line height */
        const styles = window.getComputedStyle(content);

        let lineHeight = parseFloat(styles.lineHeight);

        if (!lineHeight || isNaN(lineHeight)) {
          lineHeight = parseFloat(styles.fontSize) * 1.6;
        }

        /*
         * EXACTLY 4 LINES
         */
        const fourLines = lineHeight * 4;

        /*
         * Check full content height before collapsing.
         */
        const fullHeight = content.scrollHeight;

        if (fullHeight <= fourLines + 5) {
          description.dataset.readMoreInitialized = "";
          return;
        }

        /*
         * Collapse to exactly 4 lines.
         */
        description.classList.add("read-more-enabled");

        description.style.maxHeight = fourLines + "px";

        /*
         * Create ONE button.
         */
        const button = document.createElement("button");

        button.type = "button";
        button.className = "product-description-read-more";
        button.setAttribute("aria-expanded", "false");

        button.textContent = "Learn more about this item";

        description.appendChild(button);

        /*
         * Click event
         */
        button.addEventListener("click", function () {

          const expanded =
            description.classList.toggle("is-expanded");

          if (expanded) {

            description.style.maxHeight = "5000px";

            button.textContent = "Show less";

            button.setAttribute(
              "aria-expanded",
              "true"
            );

          } else {

            description.style.maxHeight =
              fourLines + "px";

            button.textContent =
              "Learn more about this item";

            button.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        });

      });
    });
  }

  /* Initial load */
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initProductReadMore
    );
  } else {
    initProductReadMore();
  }

  /* Shopify section reload */
  document.addEventListener(
    "shopify:section:load",
    initProductReadMore
  );

})();

//stair-rugs
(function () {
  'use strict';

  // GLOBAL SHOPIFY PRODUCT CARD CUSTOMIZATION
  // Works on all collections, homepage, search and product cards.

  const productCache = new Map();
  const pendingRequests = new Map();

  // ---------------------------------------
  // 1. ADD GLOBAL STYLES
  // ---------------------------------------

  function addCustomStyles() {
    if (document.getElementById('global-product-custom-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'global-product-custom-styles';

    style.textContent = `
      .card-information,
      .card-information .stair-rugs-price-info {
        font-weight: 700 !important;
      }

      .card-information .stair-rugs-price-info {
        margin-top: 5px;
      }

      .card-information .price.global-price-hidden {
        display: none !important;
      }
    `;

    document.head.appendChild(style);
  }

  // ---------------------------------------
  // 2. REMOVE PRICES FROM SIZE FILTERS
  // ---------------------------------------

  function cleanSizeLabels() {
    document.querySelectorAll('.facet-checkbox__text')
      .forEach(function (element) {

        const details = element.closest('details');
        if (!details) return;

        const heading = details.querySelector('summary');

        if (
          !heading ||
          !heading.textContent.toLowerCase().includes('size')
        ) {
          return;
        }

        const original = element.textContent.trim();

        const cleaned = original
          .replace(/:\s*(?:US\$|USD|\$).*$/i, '')
          .trim();

        if (original !== cleaned) {
          element.textContent = cleaned;
        }
      });
  }

  // ---------------------------------------
  // 3. SHORTEN PRODUCT TITLES
  // ---------------------------------------

  function shortenProductTitles() {
    document.querySelectorAll(
      '.card-wrapper .full-unstyled-link'
    ).forEach(function (link) {

      if (!link.dataset.originalTitle) {
        link.dataset.originalTitle = link.textContent.trim();
      }

      const original = link.dataset.originalTitle;
      const words = original.split(/\s+/);

      const shortened = words.length > 5
        ? words.slice(0, 5).join(' ') + '...'
        : original;

      if (link.textContent.trim() !== shortened) {
        link.textContent = shortened;
      }
    });
  }

  // ---------------------------------------
  // 4. FORMAT PRICE
  // ---------------------------------------

  function formatPrice(cents) {
  return (Number(cents) / 100).toFixed(2);
}

  // ---------------------------------------
  // 5. FETCH PRODUCT DATA WITH CACHE
  // ---------------------------------------

  async function getProduct(handle) {
    if (productCache.has(handle)) {
      return productCache.get(handle);
    }

    if (pendingRequests.has(handle)) {
      return pendingRequests.get(handle);
    }

    const request = fetch(
      '/products/' + encodeURIComponent(handle) + '.js'
    )
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Product request failed');
        }

        return response.json();
      })
      .then(function (product) {
        productCache.set(handle, product);
        return product;
      })
      .finally(function () {
        pendingRequests.delete(handle);
      });

    pendingRequests.set(handle, request);

    return request;
  }

  // ---------------------------------------
  // 6. UPDATE PRODUCT CARD INFORMATION
  // ---------------------------------------

  async function updateProductCard(card) {
    const link = card.querySelector(
      '.card__heading a[href*="/products/"], ' +
      '.full-unstyled-link[href*="/products/"]'
    );

    const info = card.querySelector('.card-information');

    if (!link || !info) return;

    const match = link.href.match(/\/products\/([^/?#]+)/);

    if (!match) return;

    const handle = match[1];

    if (card.dataset.globalProductHandle === handle &&
        card.querySelector('.stair-rugs-price-info')) {
      return;
    }

    try {
      const product = await getProduct(handle);

      if (!card.isConnected) return;

      const variants = product.variants || [];

      if (!variants.length) return;

      // Use available variants only.
      const availableVariants = variants.filter(function (variant) {
        return variant.available;
      });

      if (!availableVariants.length) {
        return;
      }

      const lowestPrice = Math.min.apply(
        null,
        availableVariants.map(function (variant) {
          return Number(variant.price);
        })
      );

      // Find minimum piece count among available variants.
      const pieceCounts = [];

      availableVariants.forEach(function (variant) {
        (variant.options || []).forEach(function (option) {
          const result = String(option).match(
            /(\d+)\s*pieces?\b/i
          );

          if (result) {
            pieceCounts.push(Number(result[1]));
          }
        });
      });

      // Keep original Shopify price for products
      // that do not have piece-based variants.
      if (!pieceCounts.length) return;

      const minPieces = Math.min.apply(
        null,
        pieceCounts
      );

      const formattedPrice = formatPrice(lowestPrice);

      let output = info.querySelector(
        '.stair-rugs-price-info'
      );

      if (!output) {
        output = document.createElement('div');
        output.className = 'stair-rugs-price-info';
        info.appendChild(output);
      }

      const newText =
        'From ' + formattedPrice +
        ' US$ for ' + minPieces + ' pieces';

      if (output.textContent !== newText) {
        output.textContent = newText;
      }

      // Hide original Shopify price only
      // after successfully adding replacement.
      const originalPrice = info.querySelector('.price');

      if (originalPrice) {
        originalPrice.classList.add('global-price-hidden');
      }

      card.dataset.globalProductHandle = handle;

    } catch (error) {
      console.error(
        'Product card update failed:',
        handle,
        error
      );
    }
  }

  // ---------------------------------------
  // 7. UPDATE ALL PRODUCT CARDS
  // ---------------------------------------

  function updateProductInfo() {
    document.querySelectorAll('.card-wrapper')
      .forEach(function (card) {
        updateProductCard(card);
      });
  }


  // ---------------------------------------
// 8. FORMAT ALL USD PRICES
// ---------------------------------------

function replaceCurrency() {
  document.querySelectorAll(
    '.price-item, .money, .product__price'
  ).forEach(function (element) {

    // Change only text nodes to preserve nested HTML.
    element.childNodes.forEach(function (node) {
      if (node.nodeType !== Node.TEXT_NODE) return;

      const original = node.nodeValue;

      const updated = original
        // 3,360.00 USD -> 3360.00 US$
        .replace(
          /(\d[\d,]*(?:\.\d{1,2})?)\s*USD\b/gi,
          function (match, price) {
            return price.replace(/,/g, '') + ' US$';
          }
        )
        // USD 3,360.00 -> 3360.00 US$
        .replace(
          /\bUSD\s*(\d[\d,]*(?:\.\d{1,2})?)/gi,
          function (match, price) {
            return price.replace(/,/g, '') + ' US$';
          }
        )
        // 3,360.00 US$ -> 3360.00 US$
        .replace(
          /(\d[\d,]*(?:\.\d{1,2})?)\s*US\$/gi,
          function (match, price) {
            return price.replace(/,/g, '') + ' US$';
          }
        );

      if (updated !== original) {
        node.nodeValue = updated;
      }
    });
  });
}

  // ---------------------------------------
  // 9. RUN ALL FEATURES
  // ---------------------------------------

  function updateAll() {
    addCustomStyles();
    cleanSizeLabels();
    shortenProductTitles();
    updateProductInfo();
    replaceCurrency();
  }

  // ---------------------------------------
  // 10. INITIALIZE
  // ---------------------------------------

  function initialize() {
    updateAll();

    let scheduled = false;

    const observer = new MutationObserver(function () {
      if (scheduled) return;

      scheduled = true;

      requestAnimationFrame(function () {
        scheduled = false;
        updateAll();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Browser back/forward navigation.
    window.addEventListener('pageshow', function () {
      updateAll();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initialize
    );
  } else {
    initialize();
  }

})();




// LEFT FILTER - STAIR RUGS SIZE SORTING
// CSS ordering: preserves Shopify checkbox functionality.

(function () {
  'use strict';

  const LIST_SELECTOR = [
    'ul.facets__list--vertical',
    'ul.facets-layout-list',
    'ul.no-js-list',
    'ul.mobile-facets__list'
  ].join(',');

  function getStartingSize(text) {
    const value = text.replace(/\s+/g, ' ').trim();

    // Landing sizes
    let match = value.match(
      /^Landing\s+(\d+(?:\.\d+)?)\s*["'″′]?\s*[x×]\s*(\d+(?:\.\d+)?)/i
    );

    if (match) {
      return {
        group: 6,
        width: Number(match[1]),
        length: Number(match[2])
      };
    }

    // Feet and inches
    match = value.match(
      /^(\d+(?:\.\d+)?)\s*ft\.?\s*[x×]\s*(\d+(?:\.\d+)?)/i
    );

    if (match) {
      return {
        group: 2,
        width: Number(match[1]),
        length: Number(match[2])
      };
    }

    // Centimetres
    match = value.match(
      /^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*cm\b/i
    );

    if (match) {
      return {
        group: 1,
        width: Number(match[1]),
        length: Number(match[2])
      };
    }

    // Regular inch sizes
    match = value.match(
      /^(\d+(?:\.\d+)?)\s*["'″′]?\s*[x×]\s*(\d+(?:\.\d+)?)/i
    );

    if (match) {
      return {
        group: 0,
        width: Number(match[1]),
        length: Number(match[2])
      };
    }

    // Pieces / stair-only
    if (/^\d+\s*piec/i.test(value)) {
      return { group: 3 };
    }

    // Bulk listings
    if (/^bulk\b/i.test(value)) {
      return { group: 5 };
    }

    // Other custom labels
    return { group: 4 };
  }

  function isSizeFilter(list) {
    const heading =
      list.closest('details')
        ?.querySelector('summary')?.innerText ||
      list.closest('fieldset')
        ?.querySelector('legend')?.innerText ||
      list.closest('.facets__disclosure')
        ?.querySelector('.facets__summary')?.innerText ||
      '';

    return /^\s*Size\b/i.test(heading.trim());
  }

  function compareSizes(a, b) {
    const A = a.size;
    const B = b.size;

    if (A.group !== B.group) {
      return A.group - B.group;
    }

    // Regular sizes and Landing sizes:
    // Group by whole-number width, then length, then decimal width.
    if (A.group === 0 || A.group === 6) {
      return (
        Math.floor(A.width) - Math.floor(B.width) ||
        A.length - B.length ||
        A.width - B.width ||
        a.index - b.index
      );
    }

    // Centimetre and feet sizes.
    if (A.width !== undefined && B.width !== undefined) {
      return (
        A.width - B.width ||
        A.length - B.length ||
        a.index - b.index
      );
    }

    // Preserve original order for other labels.
    return a.index - b.index;
  }

  function sortList(list) {
    const items = Array.from(list.children).filter(function (item) {
      return item.matches('li');
    });

    if (items.length < 2) return;

    const sorted = items.map(function (item, index) {
      const label = item.querySelector('label');

      const text = (
        label ? label.innerText : item.innerText
      ).replace(/\s+/g, ' ').trim();

      return {
        item: item,
        size: getStartingSize(text),
        index: index
      };
    });

    sorted.sort(compareSizes);

    // Use CSS order instead of moving DOM elements.
    // This preserves Shopify's checkbox event handling.
    list.style.display = 'flex';
    list.style.flexDirection = 'column';

    sorted.forEach(function (entry, index) {
      entry.item.style.order = String(index);
    });
  }

  function sortCollectionFilters() {
    document.querySelectorAll(LIST_SELECTOR).forEach(function (list) {
      if (isSizeFilter(list)) {
        sortList(list);
      }
    });
  }

  let frame = null;

  function scheduleSort() {
    if (frame !== null) {
      cancelAnimationFrame(frame);
    }

    frame = requestAnimationFrame(function () {
      frame = null;
      sortCollectionFilters();
    });
  }

  function start() {
    // Run immediately and again as Shopify finishes rendering filters.
    scheduleSort();

    [100, 300, 700, 1200, 2000].forEach(function (delay) {
      setTimeout(scheduleSort, delay);
    });

    // Watch dynamically rendered filter options.
    const observer = new MutationObserver(function () {
      scheduleSort();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Re-sort after Show more / Show less.
    document.addEventListener('click', function (event) {
      if (event.target.closest(
        'show-more-button, .button-show-more, .button-show-less'
      )) {
        [100, 300, 700].forEach(function (delay) {
          setTimeout(scheduleSort, delay);
        });
      }
    });

    // Re-sort after Shopify section reloads.
    document.addEventListener('shopify:section:load', scheduleSort);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();





//price according to the quantity
(function () {
  'use strict';

  function initQuantityPrice() {
    document.querySelectorAll('product-info').forEach(function (root) {
      if (root.dataset.quantityPriceInitialized === 'true') return;

      const productUrl = root.dataset.url;
      const quantityInput = root.querySelector('[name="quantity"]');
      const variantInput = root.querySelector('form [name="id"]');

      if (!productUrl || !quantityInput || !variantInput) return;

      root.dataset.quantityPriceInitialized = 'true';

      let product = null;

      function updatePrice() {
        if (!product) return;

        const variant = product.variants.find(function (item) {
          return String(item.id) === String(variantInput.value);
        });

        if (!variant) return;

        const priceRoot = root.querySelector('[id^="price-"]');
        if (!priceRoot) return;

        const regularPrice = priceRoot.querySelector(
          '.price__regular .price-item--regular .money'
        );

        const salePrice = priceRoot.querySelector(
          '.price__sale .price-item--sale .money'
        );

        if (!regularPrice) return;

        const quantity = Math.max(
          1,
          parseInt(quantityInput.value, 10) || 1
        );

        const total = Number(variant.price) * quantity;
        const formatted = (total / 100).toFixed(2) + ' US$';

        regularPrice.textContent = formatted;

        if (salePrice) {
          salePrice.textContent = formatted;
        }
      }

      quantityInput.addEventListener('input', updatePrice);
      quantityInput.addEventListener('change', updatePrice);

      // Handle quantity +/- buttons that update the input value.
      root.addEventListener('click', function (event) {
        if (event.target.closest('quantity-input button')) {
          setTimeout(updatePrice, 0);
        }
      });

      // Refresh the total when the selected variant changes.
      root.addEventListener('change', function () {
        setTimeout(updatePrice, 0);
      });

      fetch(productUrl + '.js')
        .then(function (response) {
          if (!response.ok) throw new Error('Product fetch failed');
          return response.json();
        })
        .then(function (data) {
          product = data;
          updatePrice();
        })
        .catch(function (error) {
          console.error('Quantity price update failed:', error);
          root.dataset.quantityPriceInitialized = 'false';
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuantityPrice);
  } else {
    initQuantityPrice();
  }
})();



//logo on main image
(function () {
  'use strict';

  if (!window.location.pathname.startsWith('/products/')) return;

  const logoUrl = 'https://cdn.shopify.com/s/files/1/0648/2188/7176/files/Indian_Rug_Store_Emblem_1.png?v=1793877030';

  function addLogo() {
    // Main product image gallery, not thumbnails
    const gallery = document.querySelector(
      '.product__media-list'
    );

    if (!gallery) return;

    const items = gallery.querySelectorAll(
      '.product__media-item'
    );

    items.forEach(function (item) {
      const media = item.querySelector('.product__media');

      if (!media) return;

      // Add the same logo to each full-size image
      // so it remains visible when images change.
      if (media.querySelector('.irs-product-logo')) return;

      const logo = document.createElement('img');

      logo.className = 'irs-product-logo';
      logo.src = logoUrl;
      logo.alt = 'Eco-friendly';
      logo.loading = 'eager';

      media.appendChild(logo);
    });
  }

  function initialize() {
    addLogo();

    const observer = new MutationObserver(addLogo);

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
