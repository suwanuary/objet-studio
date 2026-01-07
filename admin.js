// admin.js - Minimalist Admin

const DEMO_MODE = false;

// 관리자 계정 정보
// Email: choi.in.o@naver.com
// Password: 751026
// ※ Firebase Console > Authentication에서 이 계정을 먼저 생성해야 합니다!

const DEMO_PHOTOS = [
    { id: '1', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80', category: 'mood' },
    { id: '2', imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80', category: 'natural' },
    { id: '3', imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80', category: 'urban' },
    { id: '4', imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80', category: 'artistic' }
];

const DEMO_BOOKINGS = [
    { id: '1', clientName: '김민지', contact: '010-1234-5678', date: '2024-02-15', course: 'profile', message: '프로필 촬영 문의드립니다.', createdAt: new Date() },
    { id: '2', clientName: 'Sarah Lee', contact: 'sarah@email.com', date: '2024-02-20', course: 'editorial', message: 'Editorial shoot for magazine.', createdAt: new Date() }
];

let selectedFiles = [];

// ===== Theme =====
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}

// ===== Toast =====
function showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ===== Auth =====
function showDashboard() {
    document.getElementById('login-section')?.classList.add('hidden');
    document.getElementById('dashboard-section')?.classList.remove('hidden');
    document.getElementById('logout-btn')?.classList.remove('hidden');
    document.getElementById('user-email')?.classList.remove('hidden');
    loadPhotos();
    loadBookings();
}

function showLogin() {
    document.getElementById('login-section')?.classList.remove('hidden');
    document.getElementById('dashboard-section')?.classList.add('hidden');
    document.getElementById('logout-btn')?.classList.add('hidden');
    document.getElementById('user-email')?.classList.add('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const btn = document.getElementById('login-btn');
    const alert = document.getElementById('login-alert');
    
    btn.disabled = true;
    btn.querySelector('.btn-text')?.classList.add('hidden');
    btn.querySelector('.btn-loading')?.classList.remove('hidden');
    
    try {
        // Firebase 인증
        const { auth } = await import('./firebase-config.js');
        const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        document.getElementById('user-email').textContent = userCredential.user.email;
        showDashboard();
        showToast('Welcome back');
    } catch (err) {
        console.error('Login error:', err);
        let errorMsg = '로그인에 실패했습니다.';
        if (err.code === 'auth/invalid-credential') {
            errorMsg = '이메일 또는 비밀번호가 올바르지 않습니다.';
        } else if (err.code === 'auth/user-not-found') {
            errorMsg = '등록되지 않은 이메일입니다.';
        } else if (err.code === 'auth/wrong-password') {
            errorMsg = '비밀번호가 올바르지 않습니다.';
        }
        alert.className = 'form-alert error';
        alert.textContent = errorMsg;
        setTimeout(() => { alert.className = ''; alert.textContent = ''; }, 3000);
    } finally {
        btn.disabled = false;
        btn.querySelector('.btn-text')?.classList.remove('hidden');
        btn.querySelector('.btn-loading')?.classList.add('hidden');
    }
}

async function handleLogout() {
    try {
        const { auth } = await import('./firebase-config.js');
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        await signOut(auth);
        showLogin();
        showToast('Logged out');
    } catch (err) {
        console.error('Logout error:', err);
    }
}

// ===== Photos =====
function handleFileSelect(files) {
    selectedFiles = Array.from(files).filter(f => f.type.startsWith('image/') && f.size < 10 * 1024 * 1024);
    updatePreview();
    document.getElementById('upload-btn').disabled = !selectedFiles.length;
}

function updatePreview() {
    const area = document.getElementById('preview-area');
    if (!area) return;
    area.innerHTML = '';
    
    selectedFiles.forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = e => {
            const div = document.createElement('div');
            div.className = 'photo-grid-item';
            div.innerHTML = `<img src="${e.target.result}" alt="Preview"><button class="delete-btn" data-index="${i}">×</button>`;
            area.appendChild(div);
            div.querySelector('.delete-btn').onclick = () => {
                selectedFiles.splice(i, 1);
                updatePreview();
                document.getElementById('upload-btn').disabled = !selectedFiles.length;
            };
        };
        reader.readAsDataURL(file);
    });
}

// admin.js의 uploadPhotos 함수 수정

async function uploadPhotos() {
    const btn = document.getElementById('upload-btn');
    const progress = document.getElementById('upload-progress');
    const bar = progress?.querySelector('.progress-bar');
    const text = document.getElementById('progress-text');
    const category = document.getElementById('upload-category')?.value || 'mood';
    
    // 👇 [추가됨] 제목 입력값 가져오기
    const titleInput = document.getElementById('upload-title');
    const customTitle = titleInput?.value.trim();

    btn.disabled = true;
    progress?.classList.remove('hidden');
    
    try {
        const { db, storage } = await import('./firebase-config.js');
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');
        
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const fileName = `photos/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, fileName);
            
            // Upload to Storage
            await uploadBytes(storageRef, file);
            const imageUrl = await getDownloadURL(storageRef);
            
            // 👇 [수정됨] 제목 결정 로직 (입력값이 있으면 쓰고, 없으면 파일명 사용)
            let finalTitle = customTitle;
            if (!finalTitle) {
                finalTitle = file.name.replace(/\.[^/.]+$/, ''); // 확장자 제거
            } else if (selectedFiles.length > 1) {
                finalTitle = `${customTitle} ${i + 1}`; // 여러 장 올릴 땐 뒤에 번호 붙임
            }

            // Save to Firestore
            await addDoc(collection(db, 'photos'), {
                title: finalTitle,
                category: category,
                imageUrl: imageUrl,
                storagePath: fileName,
                createdAt: serverTimestamp()
            });
            
            const pct = ((i + 1) / selectedFiles.length) * 100;
            if (bar) bar.style.width = pct + '%';
            if (text) text.textContent = Math.round(pct) + '%';
        }
        
        showToast(`${selectedFiles.length} photo(s) uploaded`);
        selectedFiles = [];
        document.getElementById('preview-area').innerHTML = '';
        document.getElementById('photo-input').value = '';
        if(titleInput) titleInput.value = ''; // 입력칸 비우기
        loadPhotos();
    } catch (err) {
        console.error('Upload error:', err);
        showToast('Upload failed: ' + err.message);
    } finally {
        progress?.classList.add('hidden');
        if (bar) bar.style.width = '0%';
        btn.disabled = true;
    }
}

// admin.js의 loadPhotos 함수 수정

async function loadPhotos() {
    const grid = document.getElementById('photos-grid');
    const loading = document.getElementById('photos-loading');
    const empty = document.getElementById('photos-empty');
    const filter = document.getElementById('filter-category')?.value || 'all';
    
    loading?.classList.remove('hidden');
    empty?.classList.add('hidden');
    if (grid) grid.innerHTML = '';
    
    try {
        const { db } = await import('./firebase-config.js');
        // 👇 [추가됨] doc, updateDoc 기능을 불러옵니다
        const { collection, getDocs, query, orderBy, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const photosRef = collection(db, 'photos');
        const q = query(photosRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        let photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (filter !== 'all') {
            photos = photos.filter(p => p.category === filter);
        }
        
        loading?.classList.add('hidden');
        
        if (!photos.length) {
            empty?.classList.remove('hidden');
            return;
        }
        
        photos.forEach(p => {
            const div = document.createElement('div');
            div.className = 'photo-grid-item';
            // 👇 [수정됨] 제목 표시 및 수정 버튼 추가
            div.style.position = 'relative';
            div.innerHTML = `
                <img src="${p.imageUrl}" alt="${p.title || ''}">
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: white; padding: 4px; font-size: 11px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${p.title || 'Untitled'}
                </div>
                <button class="edit-btn" style="position: absolute; top: 5px; right: 35px; background: rgba(255,255,255,0.9); border: none; border-radius: 4px; cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">✏️</button>
                <button class="delete-btn" data-id="${p.id}"><i class="bi bi-trash"></i></button>
            `;
            grid?.appendChild(div);

            // 삭제 버튼 기능
            div.querySelector('.delete-btn').onclick = async () => {
                if (confirm('Delete this photo?')) {
                    await deletePhoto(p.id, p.storagePath);
                }
            };

            // 👇 [추가됨] 수정 버튼 기능 (이름 바꾸기)
            div.querySelector('.edit-btn').onclick = async () => {
                const newTitle = prompt("수정할 제목을 입력하세요:", p.title);
                if (newTitle !== null && newTitle !== p.title) {
                    try {
                        const photoDoc = doc(db, "photos", p.id);
                        await updateDoc(photoDoc, { title: newTitle });
                        showToast("제목이 수정되었습니다.");
                        loadPhotos(); // 목록 새로고침
                    } catch (e) {
                        console.error(e);
                        showToast("수정 실패");
                    }
                }
            };
        });
    } catch (err) {
        console.error('Load photos error:', err);
        loading?.classList.add('hidden');
        empty?.classList.remove('hidden');
    }
}

// ===== Bookings =====
// ===== Delete Photo =====
async function deletePhoto(photoId, storagePath) {
    try {
        const { db, storage } = await import('./firebase-config.js');
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const { ref, deleteObject } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');
        
        await deleteDoc(doc(db, 'photos', photoId));
        
        if (storagePath) {
            try {
                const storageRef = ref(storage, storagePath);
                await deleteObject(storageRef);
            } catch (e) {
                console.warn('Storage delete failed:', e);
            }
        }
        
        showToast('Photo deleted');
        loadPhotos();
    } catch (err) {
        console.error('Delete error:', err);
        showToast('Delete failed');
    }
}

// ===== Bookings =====
async function loadBookings() {
    const list = document.getElementById('booking-list');
    const loading = document.getElementById('bookings-loading');
    const empty = document.getElementById('bookings-empty');
    
    loading?.classList.remove('hidden');
    empty?.classList.add('hidden');
    if (list) list.innerHTML = '';
    
    try {
        const { db } = await import('./firebase-config.js');
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        loading?.classList.add('hidden');
        
        if (!bookings.length) {
            empty?.classList.remove('hidden');
            return;
        }
        
        bookings.forEach(b => {
            const createdAt = b.createdAt?.toDate ? b.createdAt.toDate().toLocaleDateString('ko-KR') : '';
            const div = document.createElement('div');
            div.className = 'booking-item';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <span class="booking-name">${b.clientName || ''}</span>
                    <span class="booking-date">${b.date || ''}</span>
                </div>
                <p class="small text-muted">${b.course || ''}</p>
                <a href="tel:${b.contact}" class="booking-contact"><i class="bi bi-telephone"></i> ${b.contact || ''}</a>
                ${b.message ? `<p class="small text-muted mt-4" style="font-style: italic;">"${b.message}"</p>` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <span class="small text-muted">${createdAt}</span>
                    <button class="delete-booking-btn" data-id="${b.id}" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer;"><i class="bi bi-trash"></i></button>
                </div>
            `;
            list?.appendChild(div);
            div.querySelector('.delete-booking-btn').onclick = async () => {
                if (confirm('Delete this booking?')) {
                    await deleteBooking(b.id);
                }
            };
        });
    } catch (err) {
        console.error('Load bookings error:', err);
        loading?.classList.add('hidden');
        empty?.classList.remove('hidden');
    }
}

async function deleteBooking(bookingId) {
    try {
        const { db } = await import('./firebase-config.js');
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        await deleteDoc(doc(db, 'bookings', bookingId));
        showToast('Booking deleted');
        loadBookings();
    } catch (err) {
        console.error('Delete booking error:', err);
        showToast('Delete failed');
    }
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    
    const uploadArea = document.getElementById('upload-area');
    const photoInput = document.getElementById('photo-input');
    
    uploadArea?.addEventListener('click', () => photoInput?.click());
    uploadArea?.addEventListener('dragover', e => { e.preventDefault(); uploadArea.style.borderColor = 'var(--color-text-dim)'; });
    uploadArea?.addEventListener('dragleave', () => uploadArea.style.borderColor = '');
    uploadArea?.addEventListener('drop', e => { e.preventDefault(); uploadArea.style.borderColor = ''; handleFileSelect(e.dataTransfer.files); });
    photoInput?.addEventListener('change', e => handleFileSelect(e.target.files));
    
    document.getElementById('upload-btn')?.addEventListener('click', uploadPhotos);
    document.getElementById('filter-category')?.addEventListener('change', loadPhotos);
    
    // Firebase Auth 상태 감지
    try {
        const { auth } = await import('./firebase-config.js');
        const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        
        onAuthStateChanged(auth, (user) => {
            if (user) {
                document.getElementById('user-email').textContent = user.email;
                showDashboard();
            } else {
                showLogin();
            }
        });
    } catch (err) {
        console.error('Auth init error:', err);
        showLogin();
    }
    
    console.log('%cObjet Studio Admin', 'font-family: serif; font-size: 12px; color: #888;');
});
