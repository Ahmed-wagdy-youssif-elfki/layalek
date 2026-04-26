/* 
   ================================================================
   ملف الجافاسكريبت لمتجر ليلاك (LILAC)
   الوصف: التحكم في التفاعلات، الأنيميشن، السلة، والبحث.
   ================================================================
*/

// ---------------------------------------------------
// 1. المتغيرات العالمية وإدارة البيانات (Global State)
// ---------------------------------------------------

// وظيفة آمنة لجلب البيانات من localStorage لتجنب الأخطاء
function getSafeCart() {
    try {
        const saved = localStorage.getItem('cart');
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Cart loading error:", e);
        return [];
    }
}

let cart = getSafeCart();

// ---------------------------------------------------
// 2. وظائف السلة المركزية (Core Cart Functions)
// ---------------------------------------------------

function updateCartUI() {
    try {
        const counts = document.querySelectorAll('.cart-count, .count');

        // تصفية السلة من أي عناصر تالفة وحساب الإجمالي
        const validCart = Array.isArray(cart) ? cart.filter(item => item && item.id) : [];
        const totalItems = validCart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

        counts.forEach(el => el.textContent = totalItems);

        const cartItemsContainer = document.getElementById('cartItems');
        const cartTotalElement = document.getElementById('cartTotal');
        const cartSidebarTitleSpan = document.querySelector('.cart-sidebar .cart-header h3 span');

        if (cartSidebarTitleSpan) cartSidebarTitleSpan.textContent = totalItems;

        if (cartItemsContainer) {
            if (validCart.length === 0) {
                cartItemsContainer.innerHTML = `
                    <div class="empty-cart" style="text-align:center;padding:60px 20px;color:#888;">
                        <div style="font-size:4rem;margin-bottom:20px;opacity:0.3;">🛍️</div>
                        <p style="font-size:1.1rem;font-weight:600;margin-bottom:10px;">سلتك فارغة حالياً</p>
                        <a href="products.html" class="btn btn-primary" style="margin-top:25px;font-size:0.9rem;padding:12px 25px;">تسوقي الآن</a>
                    </div>
                `;
                if (cartTotalElement) cartTotalElement.textContent = '0 ج.م';
            } else {
                let total = 0;
                cartItemsContainer.innerHTML = validCart.map((item, index) => {
                    const price = parseInt(item.price) || 0;
                    const qty = parseInt(item.quantity) || 1;
                    const itemTotal = price * qty;
                    total += itemTotal;
                    const imgPath = item.image || '';
                    return `
                        <div class="cart-item">
                            <img src="${imgPath}" alt="${item.title || 'منتج'}">
                            <div class="cart-item-info">
                                <h4>${item.title || 'منتج'}</h4>
                                <div class="cart-item-price">${price} ج.م</div>
                                <div class="cart-item-actions">
                                    <div class="qty-controls">
                                        <button class="qty-btn" onclick="changeQty(${index}, -1)"><i class="fa-solid fa-minus"></i></button>
                                        <span>${qty}</span>
                                        <button class="qty-btn" onclick="changeQty(${index}, 1)"><i class="fa-solid fa-plus"></i></button>
                                    </div>
                                    <button class="remove-item" onclick="removeFromCart(${index})">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                if (cartTotalElement) cartTotalElement.textContent = `${total} ج.م`;
            }
        }

        // حفظ البيانات دوماً
        localStorage.setItem('cart', JSON.stringify(validCart));
        cart = validCart; // تحديث المرجع العالمي
    } catch (e) {
        console.error("UI Update Error:", e);
    }
}

// دالة الإضافة العالمية - متاحة فوراً حتى لو لم ينتهِ تحميل DOM بالكامل
window.addToCart = function (id, title, price, img, btn) {
    try {
        console.log("Adding to cart request:", id, title);
        if (!id) return;

        if (!Array.isArray(cart)) cart = [];

        // البحث باستخدام مقارنة مرنة (==) لضمان مطابقة النص والرقم
        const exist = cart.find(i => i && i.id == id);
        if (exist) {
            exist.quantity = (parseInt(exist.quantity) || 0) + 1;
        } else {
            cart.push({
                id: id,
                title: title || 'منتج جديد',
                price: parseInt(price) || 0,
                image: img || '',
                quantity: 1
            });
        }

        updateCartUI();

        // التغذية الراجعة البصرية على الزر
        if (btn) {
            const target = btn.closest('button') || btn;
            const originalHTML = target.innerHTML;
            const originalBG = target.style.background;

            target.innerHTML = '<i class="fa-solid fa-check"></i> تمت الإضافة';
            target.style.background = '#4CAF50';
            target.style.color = '#fff';
            target.style.pointerEvents = 'none';

            setTimeout(() => {
                target.innerHTML = originalHTML;
                target.style.background = originalBG;
                target.style.color = '';
                target.style.pointerEvents = 'auto';
            }, 2000);
        }

        if (window.showNotice) {
            window.showNotice(`تم إضافة "${title}" لسلتك بنجاح!`);
        }
    } catch (e) {
        console.error("Add to cart error:", e);
    }
};

window.changeQty = (index, delta) => {
    if (cart[index]) {
        cart[index].quantity = (parseInt(cart[index].quantity) || 1) + delta;
        if (cart[index].quantity < 1) {
            cart.splice(index, 1);
        }
        updateCartUI();
    }
};

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateCartUI();
};

// ---------------------------------------------------
// 3. إعداد الواجهة عند تحميل الصفحة (Initialization)
// ---------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

    // 1. منطق البريلودر
    const preloader = document.getElementById('preloader');
    if (preloader) {
        const removePreloader = () => {
            preloader.style.transform = 'translateY(-100%)';
            setTimeout(() => {
                if (preloader.parentNode) preloader.remove();
            }, 1000);
        };
        window.addEventListener('load', removePreloader);
        // Fallback: إزالة البريلودر بعد 4 ثوانٍ كحد أقصى لضمان عدم تعليق الصفحة
        setTimeout(removePreloader, 4000);
    }

    // 2. مراقب ظهور العناصر (Scroll Reveal)
    try {
        const revealEls = document.querySelectorAll('.reveal');
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) entry.target.classList.add('active');
                });
            }, { threshold: 0.1 });
            revealEls.forEach(el => observer.observe(el));
        } else {
            // دعم للمتصفحات القديمة للغاية
            revealEls.forEach(el => el.classList.add('active'));
        }
    } catch (e) { }

    // 3. تأثير الهيدر وشريط التقدم
    const header = document.querySelector('.navbar');
    const scrollProgress = document.getElementById('scrollProgress');
    window.addEventListener('scroll', () => {
        if (header) {
            if (window.scrollY > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        }
        if (scrollProgress) {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
            scrollProgress.style.width = scrolled + "%";
        }
    });









    // 4. نظام عرض المنتجات من البيانات (LocalStorage)
    const productGrid = document.getElementById('productGrid');
    if (productGrid) {
        const renderProducts = () => {
            const products = JSON.parse(localStorage.getItem('lilac_products_v1')) || [
                { id: 1, name: 'طقم وردي - دانتيل رومانسية', price: 420, category: 'جديد', image: 'img/prodacts/2.jpg' },
                { id: 2, name: 'طقم وردي - طباعة زهور', price: 380, category: 'جديد', image: 'img/prodacts/images.jpg' },
                { id: 3, name: 'بودي سوت أسود - كلاسيك', price: 550, category: 'الأكثر مبيعاً', image: 'img/prodacts/3.jpg' }
            ];

            productGrid.innerHTML = products.map(p => `
                <div class="product-card reveal" data-category="${p.category}" data-id="${p.id}">
                    ${p.category === 'جديد' ? '<div class="product-badge">جديد</div>' : ''}
                    <div class="product-img">
                        <img src="${p.image}" alt="${p.name}">
                        <div class="product-actions">
                            <button class="add-to-cart-btn"
                                onclick="addToCart('${p.id}', '${p.name}', ${p.price}, '${p.image}', this)"
                                title="إضافة للسلة"><i class="fa-solid fa-cart-plus"></i></button>
                            <button title="إعجاب"><i class="fa-regular fa-heart"></i></button>
                        </div>
                    </div>
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        <div class="price">${p.price} ج.م</div>
                    </div>
                </div>
            `).join('');

            // إعادة تفعيل مراقب ظهور العناصر للمنتجات الجديدة
            if (window.IntersectionObserver) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) entry.target.classList.add('active');
                    });
                }, { threshold: 0.1 });
                document.querySelectorAll('.product-card').forEach(el => observer.observe(el));
            }
        };
        renderProducts();
    }

    // 5. تحميل الإعدادات من لوحة التحكم
    const loadSiteSettings = () => {
        const settings = JSON.parse(localStorage.getItem('lilac_settings_v1'));
        if (settings) {
            // تحديث نصوص الهيرو إذا وجدت
            const heroH1 = document.querySelector('.hero h1');
            if (heroH1 && settings.heroTitle) {
                // نترك الـ span إذا كان موجوداً للحفاظ على التنسيق
                const span = heroH1.querySelector('span');
                if (span) {
                    heroH1.innerHTML = settings.heroTitle.replace('بجمالكِ', `<span>بجمالكِ</span>`);
                } else {
                    heroH1.textContent = settings.heroTitle;
                }
            }

            // تحديث روابط السوشيال ميديا
            document.querySelectorAll('a[href*="whatsapp.com"], .whatsapp-cta').forEach(a => {
                if (settings.whatsapp) a.href = `https://wa.me/${settings.whatsapp.replace('+', '')}`;
            });
            document.querySelectorAll('a[href*="instagram.com"]').forEach(a => {
                if (settings.instagram) a.href = `https://instagram.com/${settings.instagram}`;
            });
        }
    };
    loadSiteSettings();

    // 4. نظام البحث
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.querySelector('.search-input') || (searchForm ? searchForm.querySelector('input') : null);
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
            if (!term) return;
            if (window.location.pathname.includes('products.html')) {
                document.querySelectorAll('.product-card').forEach(card => {
                    card.style.display = card.textContent.toLowerCase().includes(term) ? 'block' : 'none';
                });
                const searchPopup = document.getElementById('searchPopup');
                const overlay = document.getElementById('overlay');
                if (searchPopup) searchPopup.classList.remove('open');
                if (overlay) overlay.style.display = 'none';
            } else {
                window.location.href = `products.html?search=${encodeURIComponent(term)}`;
            }
        });
    }

    // 5. الحماية والأمان
    try {
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('keydown', e => {
            if (e.keyCode === 123 || (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || (e.ctrlKey && e.keyCode === 85)) {
                e.preventDefault();
            }
        });
    } catch (e) { }

    // 6. التحكم في السلة الجانبية والبحث
    const cartBtn = document.getElementById('cartBtn');
    const closeCart = document.getElementById('closeCart');
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    const searchBtn = document.getElementById('searchBtn');
    const closeSearch = document.getElementById('closeSearch');
    const searchPopup = document.getElementById('searchPopup');

    if (cartBtn && cartSidebar && overlay) {
        cartBtn.onclick = (e) => {
            e.preventDefault();
            cartSidebar.classList.add('open');
            overlay.style.display = 'block';
        };
    }

    if (closeCart && cartSidebar && overlay) {
        closeCart.onclick = () => {
            cartSidebar.classList.remove('open');
            overlay.style.display = 'none';
        };
    }

    // ربط زر إتمام الشراء
    const checkoutBtn = cartSidebar ? cartSidebar.querySelector('.btn-primary') : null;
    if (checkoutBtn) {
        checkoutBtn.onclick = () => {
            window.location.href = 'checkout.html';
        };
    }

    // ربط كروت المنتجات بصفحة التفاصيل
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        const btn = e.target.closest('button');

        // إذا ضغط على الكارد وليس على زر الإضافة
        if (card && !btn) {
            const id = card.dataset.id || '1';
            const name = card.querySelector('h3').textContent;
            const price = card.querySelector('.price').textContent.replace(/[^\d]/g, '');
            const img = card.querySelector('.product-img img').src;

            window.location.href = `product-details.html?id=${id}&name=${encodeURIComponent(name)}&price=${price}&img=${encodeURIComponent(img)}`;
        }
    });

    if (searchBtn && searchPopup && overlay) {
        searchBtn.onclick = (e) => {
            e.preventDefault();
            searchPopup.classList.add('open');
            overlay.style.display = 'block';
            if (searchInput) setTimeout(() => searchInput.focus(), 300);
        };
    }

    if (closeSearch && searchPopup && overlay) {
        closeSearch.onclick = () => {
            searchPopup.classList.remove('open');
            overlay.style.display = 'none';
        };
    }

    if (overlay) {
        overlay.onclick = () => {
            if (cartSidebar) cartSidebar.classList.remove('open');
            if (searchPopup) searchPopup.classList.remove('open');
            overlay.style.display = 'none';
        };
    }

    // وظيفة إظهار التنبيهات
    window.showNotice = function (msg) {
        try {
            const old = document.querySelector('.quick-notice');
            if (old) old.remove();
            const div = document.createElement('div');
            div.className = 'quick-notice';
            div.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${msg}`;
            Object.assign(div.style, {
                position: 'fixed', bottom: '30px', right: '30px', background: '#880E4F', color: '#fff',
                padding: '16px 32px', borderRadius: '50px', zIndex: '9999', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold'
            });
            document.body.appendChild(div);
            setTimeout(() => { if (div.parentNode) div.remove(); }, 3000);
        } catch (e) { }
    };

    // 7. المستمع العام للأزرار التي تحمل كلاس add-cart (للمنتجات التي لا تحتوي على onclick مباشر)
    document.addEventListener('click', (e) => {
        try {
            const btn = e.target.closest('.add-cart');
            if (btn) {
                e.preventDefault();
                const card = btn.closest('.product-card');
                if (card) {
                    const title = card.querySelector('h3')?.textContent || 'منتج';
                    const priceText = card.querySelector('.price .current')?.textContent || card.querySelector('.price')?.textContent || '0';
                    const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
                    const img = card.querySelector('img')?.src || '';
                    const id = card.dataset.id || title;
                    window.addToCart(id, title, price, img, btn);
                }
            }
        } catch (e) {
            console.error("Global click listener error:", e);
        }
    });

    // التحديث الأولي للواجهة
    updateCartUI();
});
