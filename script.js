// Global state variables
let cart = JSON.parse(sessionStorage.getItem('petCart')) || [];
let selectedAmount = null;
let currentCarouselIndex = 0;
let currentPetId = null;
const petsPerPage = 3;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load cart from session storage
    cart = JSON.parse(sessionStorage.getItem('petCart')) || [];
    updateCartCount();
    checkAdoptedPetsOnLoad();


    // Determine current page and initialize appropriate functions
    const path = window.location.pathname;
    const page = path.split("/").pop();

    if (page === "index.html" || page === "") {
        loadFeaturedPets();
        setupChattyDog();
    } else if (page === "adoption.html") {
        loadPets();
        setupFilters();
    } else if (page === "sales.html") {
        loadPetsForSale();
        setupFilters();
    } else if (page === "about.html") {
        setupAboutPage();
    }

    // Common setup for all pages
    setupMobileMenu();

    // Initialize donation form if present
    if (document.getElementById('donation-amount')) {
        setupDonationForm();
    }
});

// CART FUNCTIONS

function openCart() {
    updateCartDisplay();
    document.getElementById('cart-modal').style.display = 'flex';
}

function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
}

function addToCart(name, price, image, id, type = 'product') {
    // Check if item already exists in cart
    const existingItem = cart.find(item => item.id === id && item.type === type);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: parseFloat(price),
            image: image,
            quantity: 1,
            type: type
        });
    }

    saveCart();
    updateCartCount();
    updateCartDisplay();
    showToast(`${name} has been added to your cart!`);
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('#cart-count');
    cartCountElements.forEach(el => {
        el.textContent = count;
    });
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    if (!cartItems) return;

    cartItems.innerHTML = '';

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Your cart is empty</p></div>';
        document.getElementById('cart-total').textContent = '0.00';
        return;
    }

    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-img">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-info">
                <h4 class="cart-item-title">${item.name}</h4>
                <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                <div class="cart-item-actions">
                    <button class="quantity-btn" onclick="changeQuantity('${item.id}', '${item.type}', -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="changeQuantity('${item.id}', '${item.type}', 1)">+</button>
                </div>
            </div>
            <button class="remove-btn" onclick="removeItem('${item.id}', '${item.type}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        cartItems.appendChild(itemElement);
    });

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cart-total').textContent = total.toFixed(2);
}

function changeQuantity(id, type, change) {
    const item = cart.find(item => item.id === id && item.type === type);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => !(i.id === id && i.type === type));
        }
        saveCart();
        updateCartCount();
        updateCartDisplay();
    }
}

function removeItem(id, type) {
    cart = cart.filter(item => !(item.id === id && item.type === type));
    saveCart();
    updateCartCount();
    updateCartDisplay();
}

function checkout() {
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }

    // Create checkout form
    const checkoutFormHTML = `
        <div class="checkout-form">
            <h3>Checkout Information</h3>
            <form id="checkout-form" onsubmit="processCheckout(event)">
                <div class="form-group">
                    <label for="checkout-name">Full Name *</label>
                    <input type="text" id="checkout-name" required>
                    <div class="error-message" id="name-error"></div>
                </div>
                <div class="form-group">
                    <label for="checkout-email">Email *</label>
                    <input type="email" id="checkout-email" required>
                    <div class="error-message" id="email-error"></div>
                </div>
                <div class="form-group">
                    <label for="checkout-phone">Phone Number *</label>
                    <input type="tel" id="checkout-phone" required>
                    <div class="error-message" id="phone-error"></div>
                </div>
                <div class="form-group">
                    <label for="checkout-address">Shipping Address *</label>
                    <textarea id="checkout-address" required></textarea>
                    <div class="error-message" id="address-error"></div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeCheckoutForm()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Complete Purchase</button>
                </div>
            </form>
        </div>
    `;

    // Replace cart content with checkout form
    const cartModal = document.getElementById('cart-modal');
    const modalContent = cartModal.querySelector('.modal-content');
    modalContent.innerHTML = `
        <span class="close" onclick="closeCart()">&times;</span>
        ${checkoutFormHTML}
    `;
}

function processCheckout(event) {
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById('checkout-name').value.trim();
    const email = document.getElementById('checkout-email').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();
    const address = document.getElementById('checkout-address').value.trim();
    
    // Validate form
    let isValid = true;
    
    // Name validation
    if (name === '') {
        document.getElementById('name-error').textContent = 'Please enter your name';
        document.getElementById('name-error').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('name-error').style.display = 'none';
    }
    
    // Email validation
    if (email === '') {
        document.getElementById('email-error').textContent = 'Please enter your email';
        document.getElementById('email-error').style.display = 'block';
        isValid = false;
    } else if (!validateEmail(email)) {
        document.getElementById('email-error').textContent = 'Please enter a valid email';
        document.getElementById('email-error').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('email-error').style.display = 'none';
    }
    
    // Phone validation
    if (phone === '') {
        document.getElementById('phone-error').textContent = 'Please enter your phone number';
        document.getElementById('phone-error').style.display = 'block';
        isValid = false;
    } else if (!validatePhone(phone)) {
        document.getElementById('phone-error').textContent = 'Please enter a valid phone number';
        document.getElementById('phone-error').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('phone-error').style.display = 'none';
    }
    
    // Address validation
    if (address === '') {
        document.getElementById('address-error').textContent = 'Please enter your address';
        document.getElementById('address-error').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('address-error').style.display = 'none';
    }
    
    if (!isValid) {
        return;
    }
    
    // Process the order (in a real app, you would send this to a server)
    const order = {
        customer: { name, email, phone, address },
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        date: new Date().toISOString()
    };
    
    // Save order to session storage (for demo purposes)
    sessionStorage.setItem('lastOrder', JSON.stringify(order));
    
    // Clear cart
    cart = [];
    saveCart();
    updateCartCount();
    
    // Show success message
    showToast('Thank you for your purchase! Your order has been placed.', 'success');
    
    // Close the cart modal
    closeCart();
    
    // Reset cart modal content
    setTimeout(() => {
        const cartModal = document.getElementById('cart-modal');
        const modalContent = cartModal.querySelector('.modal-content');
        modalContent.innerHTML = `
            <span class="close" onclick="closeCart()">&times;</span>
            <h2>Your Cart</h2>
            <div id="cart-items"></div>
            <div class="cart-total">
                <span>Total:</span>
                <span id="cart-total">0.00</span>
            </div>
            <div class="cart-actions">
                <button class="btn btn-secondary" onclick="closeCart()">Continue Shopping</button>
                <button class="btn btn-primary" onclick="checkout()">Checkout</button>
            </div>
        `;
        updateCartDisplay();
    }, 500);
}

function closeCheckoutForm() {
    // Reset back to cart view
    const cartModal = document.getElementById('cart-modal');
    const modalContent = cartModal.querySelector('.modal-content');
    modalContent.innerHTML = `
        <span class="close" onclick="closeCart()">&times;</span>
        <h2>Your Cart</h2>
        <div id="cart-items"></div>
        <div class="cart-total">
            <span>Total:</span>
            <span id="cart-total">0.00</span>
        </div>
        <div class="cart-actions">
            <button class="btn btn-secondary" onclick="closeCart()">Continue Shopping</button>
            <button class="btn btn-primary" onclick="checkout()">Checkout</button>
        </div>
    `;
    updateCartDisplay();
}

function validatePhone(phone) {
    // Simple phone validation - at least 10 digits
    const phoneRegex = /^[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

function saveCart() {
    sessionStorage.setItem('petCart', JSON.stringify(cart));
}

// PET ADOPTION FUNCTIONS

function openAdoptionForm(petId) {
    currentPetId = petId;
    document.getElementById("pet-id").value = petId;
    
    const pet = window.petsData?.find(p => p.id === petId) || {};
    
        // Update the modal title to include the pet name
    const modalTitle = document.querySelector("#adoption-modal .modal-title");
    if (modalTitle && pet.name) {
        modalTitle.textContent = `Adopt ${pet.name}`;
    }
    
    // Update the breed display if it exists
    const breedDisplay = document.getElementById("pet-breed-display");
    if (breedDisplay) {
        breedDisplay.textContent = pet.breed || "";
    }

    document.getElementById("adoption-modal").style.display = "flex";
    document.getElementById("adoption-form").reset();
}

function closeAdoptionForm() {
    document.getElementById("adoption-modal").style.display = "none";
    document.getElementById("adoption-form").reset();
}

function submitAdoptionForm(event) {
    event.preventDefault();

    const name = document.getElementById("applicant-name").value.trim();
    const email = document.getElementById("applicant-email").value.trim();
    const phone = document.getElementById("applicant-phone").value.trim();
    const address = document.getElementById("applicant-address").value.trim();

    if (!name || !email || !phone || !address) {
        showToast("Please fill in all required fields.", "error");
        return;
    }

    if (!validateEmail(email)) {
        showToast("Please enter a valid email address.", "error");
        return;
    }

    let donation = 0;
    const donationOption = document.querySelector('input[name="donation"]:checked');
    if (donationOption) {
        if (donationOption.value === "custom") {
            donation = parseFloat(document.getElementById("custom-donation-amount").value) || 0;
        } else {
            donation = parseFloat(donationOption.value);
        }
    }

    showToast(`Thank you, ${name}! Your adoption application has been submitted.`, "success");
    markPetAsAdopted(currentPetId);
    document.getElementById("adoption-form").reset();
    closeAdoptionForm();
}

function markPetAsAdopted(petId) {
    // Get current adopted pets from sessionStorage
    let adoptedPets = JSON.parse(sessionStorage.getItem('adoptedPets')) || [];
    
    // Add this pet if not already marked
    if (!adoptedPets.includes(petId)) {
        adoptedPets.push(petId);
        sessionStorage.setItem('adoptedPets', JSON.stringify(adoptedPets));
    }
    
    // Update all buttons for this pet
    updateAdoptButtons(petId);
}

function updateAdoptButtons(petId) {
    const adoptButtons = document.querySelectorAll(`button[onclick="openAdoptionForm('${petId}')"]`);
    
    adoptButtons.forEach(button => {
        button.textContent = "Adopted";
        button.classList.add("adopted");
        button.disabled = true;
        button.removeAttribute("onclick");
    });
}


function checkAdoptedPetsOnLoad() {
    const adoptedPets = JSON.parse(sessionStorage.getItem('adoptedPets')) || [];
    
    adoptedPets.forEach(petId => {
        updateAdoptButtons(petId);
    });
}

// DONATION FUNCTIONS

function selectAmount(amount) {
    selectedAmount = amount;
    document.getElementById("custom-amount").value = "";
    updateSelectionUI(amount);
}

function setCustomAmount(value) {
    selectedAmount = value ? parseFloat(value) : null;
    updateSelectionUI(null);
}

function updateSelectionUI(amount) {
    const buttons = document.querySelectorAll(".amount-btn");
    buttons.forEach(btn => {
        if (parseInt(btn.textContent.replace("$", "")) === amount) {
            btn.classList.add("selected");
        } else {
            btn.classList.remove("selected");
        }
    });
}

function handleDonation() {
    if (!selectedAmount || selectedAmount <= 0) {
        showToast("Please select or enter a valid donation amount.", "error");
        return;
    }

    document.getElementById("donation-modal").style.display = "flex";
}

function processDonation(event) {
    event.preventDefault();
    showToast(`Thank you for your $${selectedAmount} donation!`, "success");
    closeDonationModal();
    selectedAmount = null;
    document.getElementById("custom-amount").value = "";
    updateSelectionUI(null);
}

function closeDonationModal() {
    document.getElementById("donation-modal").style.display = "none";
}

// PET DATA LOADING

function loadFeaturedPets() {
    fetch('pets.xml')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(str => {
            const parser = new DOMParser();
            return parser.parseFromString(str, "text/xml");
        })
        .then(xml => {
            const pets = xml.querySelectorAll("pet");
            const featuredPetsContainer = document.getElementById("featured-pets");

            if (!featuredPetsContainer) return;

            const limitedPets = Array.from(pets).slice(0,6);

            window.petsData = limitedPets.map(pet => ({
                id: pet.getAttribute("id"),
                name: pet.querySelector("name").textContent,
                breed: pet.querySelector("breed").textContent,
                age: pet.querySelector("age").textContent,
                description: pet.querySelector("description").textContent,
                image: pet.querySelector("image").textContent,
                health: pet.querySelector("health").textContent,
                type: pet.querySelector("type")?.textContent || "dog"
            }));

            displayPets(currentCarouselIndex);

            document.querySelector('.carousel-btn.prev')?.addEventListener('click', () => {
                if (currentCarouselIndex > 0) {
                    currentCarouselIndex--;
                    displayPets(currentCarouselIndex);
                }
            });

            document.querySelector('.carousel-btn.next')?.addEventListener('click', () => {
                const maxPages = Math.ceil(6/petsPerPage)-1;
                if (currentCarouselIndex < maxPages) {
                    currentCarouselIndex++;
                    displayPets(currentCarouselIndex);
                }
            });
        })
        .catch(error => console.error('Error loading featured pets:', error));
}

function displayPets(page) {
    const featuredPetsContainer = document.getElementById("featured-pets");
    if (!featuredPetsContainer) return;

    featuredPetsContainer.innerHTML = '';

    const startIndex = page * petsPerPage;
    const endIndex = Math.min(startIndex + petsPerPage, 6);
    const adoptedPets = JSON.parse(sessionStorage.getItem('adoptedPets')) || [];

    for (let i = startIndex; i < endIndex; i++) {
        const pet = window.petsData[i];
        if(!pet) continue;
        
        const isAdopted = adoptedPets.includes(pet.id);
        const buttonHTML = isAdopted 
            ? `<button class="btn btn-primary adopted" disabled>Adopted</button>`
            : `<button class="btn btn-primary" onclick="openAdoptionForm('${pet.id}')">Adopt Me</button>`;

        const petCard = document.createElement("div");
        petCard.className = "pet-card";
        petCard.dataset.type = pet.type || "dog";
        petCard.dataset.age = getAgeCategory(pet.age);
        petCard.innerHTML = `
            <div class="pet-image">
                <img src="${pet.image}" alt="${pet.name}">
            </div>
            <div class="pet-info">
                <h3>${pet.name}</h3>
                <p class="pet-breed">${pet.breed}</p>
                <p class="pet-age">${pet.age}</p>
                <p class="pet-description">${pet.description.substring(0, 100)}...</p>
                <p class="pet-health"><i class="fas fa-heart"></i> ${pet.health}</p>
                ${buttonHTML}
            </div>
        `;
        featuredPetsContainer.appendChild(petCard);
    }

    updateCarouselButtons();
}

function loadPets() {
    fetch('pets.xml')
        .then(response => response.text())
        .then(str => (new DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            const pets = data.getElementsByTagName("pet");
            const petGrid = document.getElementById("pet-grid");
            if (!petGrid) return;

            petGrid.innerHTML = '';
            const adoptedPets = JSON.parse(sessionStorage.getItem('adoptedPets')) || [];

            window.petsData = Array.from(pets).map(pet => ({
                id: pet.getAttribute("id"),
                name: pet.querySelector("name").textContent,
                breed: pet.querySelector("breed").textContent,
                age: pet.querySelector("age").textContent,
                description: pet.querySelector("description").textContent,
                image: pet.querySelector("image").textContent,
                health: pet.querySelector("health").textContent,
                type: pet.querySelector("type")?.textContent || "dog"
            }));

            window.petsData.forEach(pet => {
                const isAdopted = adoptedPets.includes(pet.id);
                const buttonHTML = isAdopted 
                    ? `<button class="btn btn-primary adopted" disabled>Adopted</button>`
                    : `<button class="btn btn-primary" onclick="openAdoptionForm('${pet.id}')">Adopt Me</button>`;

                const petCard = document.createElement("div");
                petCard.className = "pet-card";
                petCard.dataset.type = pet.type || "dog";
                petCard.dataset.age = getAgeCategory(pet.age);
                petCard.innerHTML = `
                    <div class="pet-image">
                        <img src="${pet.image}" alt="${pet.name}">
                    </div>
                    <div class="pet-info">
                        <h3>${pet.name}</h3>
                        <p><strong>Breed:</strong> ${pet.breed}</p>
                        <p><strong>Age:</strong> ${pet.age}</p>
                        <p>${pet.description}</p>
                        <p class="health"><i class="fas fa-heart"></i> ${pet.health}</p>
                        ${buttonHTML}
                    </div>
                `;
                petGrid.appendChild(petCard);
            });
        })
        .catch(error => console.error('Error loading pets:', error));
}

function loadPetsForSale() {
    fetch('pets-for-sale.xml')
        .then(response => response.text())
        .then(str => (new DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            const pets = data.getElementsByTagName("pet");
            const petGrid = document.getElementById("pet-grid");
            if (!petGrid) return;

            petGrid.innerHTML = '';

            Array.from(pets).forEach(pet => {
                const price = pet.querySelector("price").textContent.replace("$", "").replace(",", "");
                const petCard = document.createElement("div");
                petCard.className = "pet-card";
                petCard.dataset.type = pet.querySelector("type")?.textContent || "dog";
                petCard.dataset.age = getAgeCategory(pet.querySelector("age").textContent);
                petCard.dataset.price = price;
                petCard.innerHTML = `
                    <div class="pet-image">
                        <img src="${pet.querySelector("image").textContent}" alt="${pet.querySelector("name").textContent}">
                    </div>
                    <div class="pet-info">
                        <h3>${pet.querySelector("name").textContent}</h3>
                        <p><strong>Breed:</strong> ${pet.querySelector("breed").textContent}</p>
                        <p><strong>Age:</strong> ${pet.querySelector("age").textContent}</p>
                        <p class="price">$${pet.querySelector("price").textContent}</p>
                        <p>${pet.querySelector("description").textContent}</p>
                        <button class="btn btn-primary" onclick="addToCart('${pet.querySelector("name").textContent}', ${price}, '${pet.querySelector("image").textContent}', '${pet.getAttribute("id")}', 'pet')">Add to Cart</button>
                    </div>
                `;
                petGrid.appendChild(petCard);
            });
        })
        .catch(error => console.error('Error loading pets for sale:', error));
}

// FILTER & SORT FUNCTIONS

function setupFilters() {
    const typeFilter = document.getElementById("type-filter") || document.getElementById("breed-filter");
    const ageFilter = document.getElementById("age-filter");
    const priceFilter = document.getElementById("price-filter");
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.querySelector(".search-btn");

    // Add event listeners that trigger the combined filter function
    if (typeFilter) typeFilter.addEventListener("change", applyAllFilters);
    if (ageFilter) ageFilter.addEventListener("change", applyAllFilters);
    if (priceFilter) priceFilter.addEventListener("change", applyAllFilters);
    if (searchBtn) searchBtn.addEventListener("click", applyAllFilters);
    if (searchInput) {
        searchInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") applyAllFilters();
        });
    }
    if (document.getElementById("sort-filter")) {
        document.getElementById("sort-filter").addEventListener("change", sortPets);
    }
    if (document.querySelector(".clear-filters")) {
        document.querySelector(".clear-filters").addEventListener("click", clearFilters);
    }
}

function applyAllFilters() {
    const typeFilter = document.getElementById("type-filter") || document.getElementById("breed-filter");
    const ageFilter = document.getElementById("age-filter");
    const priceFilter = document.getElementById("price-filter");
    const searchInput = document.getElementById("search-input");
    const petCards = document.querySelectorAll(".pet-card");

    const typeValue = typeFilter ? typeFilter.value : "all";
    const ageValue = ageFilter ? ageFilter.value : "all";
    const priceValue = priceFilter ? priceFilter.value : "all";
    const searchValue = searchInput ? searchInput.value.toLowerCase() : "";

    petCards.forEach(card => {
        const cardType = card.dataset.type || "";
        const cardAge = card.dataset.age || "";
        const cardPrice = parseFloat(card.dataset.price) || 0;
        const cardName = card.querySelector("h3")?.textContent.toLowerCase() || "";
        const cardBreed = card.querySelector(".pet-breed")?.textContent.toLowerCase() || 
                         card.querySelector("p:nth-of-type(1)")?.textContent.toLowerCase() || "";

        let showCard = true;

        // Type filter
        if (typeValue !== "all" && cardType !== typeValue) {
            showCard = false;
        }

        // Age filter - only check if type filter passed
        if (showCard && ageValue !== "all" && cardAge !== ageValue) {
            showCard = false;
        }

        // Price filter - only check if previous filters passed
        if (showCard && priceValue !== "all") {
            switch(priceValue) {
                case "0-100":
                    showCard = cardPrice >= 0 && cardPrice <= 100;
                    break;
                case "100-500":
                    showCard = cardPrice > 100 && cardPrice <= 500;
                    break;
                case "500-1000":
                    showCard = cardPrice > 500 && cardPrice <= 1000;
                    break;
                case "1000-1500":
                    showCard = cardPrice > 1000 && cardPrice <= 1500;
                    break;
                case "1500+":
                    showCard = cardPrice > 1500;
                    break;
            }
        }

        // Search filter - only check if previous filters passed
        if (showCard && searchValue && 
            !cardName.includes(searchValue) && 
            !cardBreed.includes(searchValue)) {
            showCard = false;
        }

        card.style.display = showCard ? "block" : "none";
    });

    checkEmptyState();
}

function sortPets() {
    const sortValue = document.getElementById("sort-filter").value;
    const petGrid = document.getElementById("pet-grid");
    const petCards = Array.from(petGrid.querySelectorAll(".pet-card"));

    petCards.sort((a, b) => {
        const nameA = a.querySelector("h3").textContent.toLowerCase();
        const nameB = b.querySelector("h3").textContent.toLowerCase();
        const priceA = parseFloat(a.dataset.price);
        const priceB = parseFloat(b.dataset.price);
        const ageA = getAgeValue(a.dataset.age);
        const ageB = getAgeValue(b.dataset.age);

        switch(sortValue) {
            case "name":
                return nameA.localeCompare(nameB);
            case "price-low":
                return priceA - priceB;
            case "price-high":
                return priceB - priceA;
            case "age":
                return ageA - ageB;
            default:
                return 0;
        }
    });

    petGrid.innerHTML = '';
    petCards.forEach(card => petGrid.appendChild(card));
}

function clearFilters() {
    const selects = document.querySelectorAll(".filter-select");
    const searchInput = document.getElementById("search-input");
    
    selects.forEach(select => {
        select.value = "all";
    });
    
    if (searchInput) {
        searchInput.value = "";
    }

    const petCards = document.querySelectorAll(".pet-card");
    petCards.forEach(card => {
        card.style.display = "block";
    });

    checkEmptyState();
}

function checkEmptyState() {
    const petGrid = document.getElementById("pet-grid");
    const petCards = document.querySelectorAll(".pet-card");
    const emptyState = document.getElementById("empty-state");
    
    if (!petGrid || !emptyState) return;

    const visibleCards = Array.from(petCards).filter(card => 
        card.style.display !== "none"
    );

    if (visibleCards.length === 0) {
        emptyState.style.display = "block";
        petGrid.style.display = "none";
    } else {
        emptyState.style.display = "none";
        petGrid.style.display = "grid";
    }
}

// UTILITY FUNCTIONS

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

function setupMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-toggle');
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            const nav = document.querySelector('.nav-menu');
            nav.classList.toggle('show');
        });
    }
}

function getAgeCategory(ageText) {
    ageText = ageText.toLowerCase();
    if (ageText.includes("month") || ageText.includes("week") || ageText.includes("puppy") || ageText.includes("kitten")) {
        return "puppy";
    }
    const yearMatch = ageText.match(/(\d+)\s*year/);
    if (yearMatch) {
        const years = parseInt(yearMatch[1]);
        if (years <= 3) return "young";
        if (years <= 7) return "adult";
        return "senior";
    }
    
    return "unknown";
}

function getAgeValue(ageCategory) {
    switch(ageCategory) {
        case "puppy": return 0;
        case "young": return 1;
        case "adult": return 2;
        case "senior": return 3;
        default: return 4;
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function checkEmptyState() {
    const petGrid = document.getElementById("pet-grid");
    const petCards = document.querySelectorAll(".pet-card");
    const emptyState = document.getElementById("empty-state");
    
    if (!petGrid || !emptyState) return;

    const visibleCards = Array.from(petCards).filter(card => 
        card.style.display !== "none"
    );

    if (visibleCards.length === 0) {
        emptyState.style.display = "block";
        petGrid.style.display = "none";
    } else {
        emptyState.style.display = "none";
        petGrid.style.display = "grid";
    }
}

function updateCarouselButtons() {
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    
    if (prevBtn) prevBtn.disabled = currentCarouselIndex === 0;
    const maxPages = Math.ceil(6/petsPerPage) - 1;
    if (nextBtn) nextBtn.disabled = currentCarouselIndex >= maxPages;
}

function setupDonationForm() {
    const donationForm = document.getElementById('donation-form');
    if (donationForm) {
        donationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processDonation(e);
        });
    }

    const amountButtons = document.querySelectorAll('.amount-btn');
    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            selectAmount(parseInt(this.textContent.replace('$', '')));
        });
    });

    const customAmount = document.getElementById('custom-amount');
    if (customAmount) {
        customAmount.addEventListener('input', function() {
            setCustomAmount(this.value);
        });
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll(".modal");
    modals.forEach(modal => {
        if (event.target === modal) {
            if (modal.id === "cart-modal") {
                closeCart();
            } else if (modal.id === "adoption-modal") {
                closeAdoptionForm();
            } else if (modal.id === "donation-modal") {
                closeDonationModal();
            }
        }
    });
};

// Chatty Dog Functionality
function setupChattyDog() {
    const messages = [
        "Hi there! Looking for a new furry friend? 🐾",
        "Did you know? Pets reduce stress and make you happier!",
        "I was adopted from Nifty Pets last year!",
        "We have lots of friends waiting for homes!",
        "Adoption saves lives! Consider adopting!",
        "Pets = unconditional love! ❤️",
        "Check out our adoption page for cute buddies!",
        "A pet's love is the best medicine!",
        "Every pet deserves a loving home 💕"
    ];
    
    const bubble = document.querySelector('.dog-speech-bubble');
    const messageElement = document.querySelector('.dog-message');
    
    let currentIndex = 0;
    
    // Function to cycle through messages
    function cycleMessages() {
        messageElement.textContent = messages[currentIndex];
        bubble.style.display = 'block';
        
        // Fade out before changing message
        setTimeout(() => {
            bubble.style.opacity = '0';
            setTimeout(() => {
                currentIndex = (currentIndex + 1) % messages.length;
                messageElement.textContent = messages[currentIndex];
                bubble.style.opacity = '1';
            }, 500);
        }, 8000); // Show each message for 8 seconds
    }
    
    // Start cycling messages
    cycleMessages();
    setInterval(cycleMessages, 9000); // Cycle every 9 seconds
    
    // Click to immediately show next message
    document.querySelector('.dog-image').addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % messages.length;
        messageElement.textContent = messages[currentIndex];
        bubble.style.display = 'block';
    });
}