// app.js - Minimalist Portfolio

// ===== Demo Data =====
const DEMO_MODE = false;

const PHOTOS = [
    { id: '1', title: 'Stillness', category: 'mood', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80' },
    { id: '2', title: 'Urban Light', category: 'urban', imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80' },
    { id: '3', title: 'Mono', category: 'natural', imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80' },
    { id: '4', title: 'Golden', category: 'mood', imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80' },
    { id: '5', title: 'Shadow', category: 'artistic', imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80' },
    { id: '6', title: 'Essence', category: 'natural', imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80' },
    { id: '7', title: 'Dusk', category: 'urban', imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80' },
    { id: '8', title: 'Silent', category: 'artistic', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80' },
    { id: '9', title: 'Form', category: 'mood', imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80' }
];

// ===== Theme =====
function initTheme() {
    const saved = localStorage.getItem('theme');
    const theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}

// ===== Navigation =====
function initNav() {
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    
    // Scroll effect
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 100);
    });
    
    // Mobile menu
    toggle?.addEventListener('click', () => {
        toggle.classList.toggle('active');
        menu.classList.toggle('active');
    });
    
    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            toggle?.classList.remove('active');
            menu?.classList.remove('active');
        });
    });
    
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Active nav on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 200;
            if (scrollY >= top) current = section.id;
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    });
}

// ===== Gallery =====
async function loadGallery() {
    const grid = document.getElementById('gallery-grid');
    const loading = document.getElementById('gallery-loading');
    const empty = document.getElementById('gallery-empty');
    
    if (!grid) return;
    
    loading?.classList.remove('hidden');
    empty?.classList.add('hidden');
    grid.innerHTML = '';
    
    let photos = [];
    
    try {
        // Firebase에서 데이터 로드
        const { db } = await import('./firebase-config.js');
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const photosRef = collection(db, 'photos');
        const q = query(photosRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Loaded photos from Firebase:', photos.length);
        
    } catch (e) {
        console.error('Firebase error:', e);
        // 에러 시 기본 데이터 사용
        photos = PHOTOS;
    }
    
    loading?.classList.add('hidden');
    
    if (!photos.length) {
        empty?.classList.remove('hidden');
        return;
    }
    
    grid.innerHTML = photos.map(p => `
        <div class="gallery-item" data-src="${p.imageUrl}">
            <img src="${p.imageUrl}" alt="${p.title || ''}" loading="lazy">
            <div class="gallery-item-overlay">
                <span class="gallery-item-title">${p.title || ''}</span>
            </div>
        </div>
    `).join('');
    
    // Lightbox
    grid.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => openLightbox(item.dataset.src));
    });
}

// ===== Lightbox =====
function openLightbox(src) {
    const lb = document.getElementById('lightbox');
    const img = lb?.querySelector('img');
    if (lb && img) {
        img.src = src;
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (lb) {
        lb.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function initLightbox() {
    const lb = document.getElementById('lightbox');
    lb?.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
    lb?.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
}

// ===== Contact Form (통합 수정됨) =====
async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const alert = document.getElementById('form-alert');
    const btn = document.getElementById('submit-btn');
    const btnText = btn?.querySelector('.btn-text');
    const btnLoad = btn?.querySelector('.btn-loading');
    
    const data = Object.fromEntries(new FormData(form));
    
    if (!data.clientName || !data.contact || !data.date || !data.course) {
        showAlert(alert, '모든 필수 항목을 입력해주세요.', 'error');
        return;
    }
    
    // 로딩 시작
    btnText?.classList.add('hidden');
    btnLoad?.classList.remove('hidden');
    btn.disabled = true;
    
    try {
        if (DEMO_MODE) {
            await new Promise(r => setTimeout(r, 1000));
            console.log('Form data:', data);
        } else {
            const { db } = await import('./firebase-config.js');
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            await addDoc(collection(db, 'bookings'), { ...data, createdAt: serverTimestamp() });
        }
        
        // 성공 시 (여기에 요청하신 진정성 있는 문구를 넣었습니다!)
        showToast("소중한 문의 감사합니다.<br>내용을 꼼꼼히 확인 후, 최대한 빠르게 연락드리겠습니다!");
        form.reset();
        
    } catch (err) {
        console.error(err);
        showAlert(alert, '전송 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    } finally {
        // 로딩 끝
        btnText?.classList.remove('hidden');
        btnLoad?.classList.add('hidden');
        btn.disabled = false;
    }
}

function showAlert(el, msg, type) {
    if (!el) return;
    el.className = `form-alert ${type}`;
    el.textContent = msg;
    setTimeout(() => { el.className = ''; el.textContent = ''; }, 5000);
}

// ===== Toast Notification (예쁜 디자인 버전) =====
function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast-message'; // CSS에서 꾸민 클래스 이름
    toast.innerHTML = message; // 줄바꿈(<br>) 적용을 위해 innerHTML 사용

    container.appendChild(toast);

    // 스르륵 나타나게 하기
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // 3초 뒤에 사라지게 하기
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if(container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300); 
    }, 3000);
}

// ===== Date Input =====
function initDateInput() {
    const input = document.getElementById('date-input');
    if (input) {
        input.min = new Date().toISOString().split('T')[0];
    }
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNav();
    initLightbox();
    initDateInput();
    loadGallery();
    
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('contact-form')?.addEventListener('submit', handleSubmit);
    
    console.log('%cObjet Studio — Choi In O', 'font-family: serif; font-size: 14px; color: #888;');
});