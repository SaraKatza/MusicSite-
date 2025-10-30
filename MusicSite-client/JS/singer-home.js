const baseURL = 'http://localhost:3000';

// parse userData safely
let objdata = JSON.parse(localStorage.getItem('userData') || 'null');
let token = localStorage.getItem('authToken');
let divlistsongs = document.querySelector('.songs-list');
let songs=[];

// בדיקת התחברות והצגת ברכת שלום
function checkLoginAndShowNav() {
    if (token && objdata) {
        document.getElementById('guestNav').style.display = 'none';
        document.getElementById('userNav').style.display = 'flex';
        const welcome = document.getElementById('welcomeMessage');
        if (welcome) welcome.textContent = `שלום, ${objdata.name || 'משתמש'}`;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function (e) {
                e.preventDefault();
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.reload();
                window.location.href = '../main.html';
            });
        }
    } else {
        const guest = document.getElementById('guestNav');
        const userNav = document.getElementById('userNav');
        if (guest) guest.style.display = 'flex';
        if (userNav) userNav.style.display = 'none';
    }
}
async function loadsongs() {

        songs= await fetch(`${baseURL}/api/songs?singer=${objdata.id}`, {
        method: 'GET',
    })  
        .then(response => response.json())
        .then(data => {
            console.log(data);
            songs = data;
            songs.forEach(song => {
                const songItem = document.createElement('div');
                songItem.className = 'song-item';
                songItem.innerHTML = `
                    <img class="song-thumb" src="${song.urlImg ? `${baseURL}/${song.urlImg}` : ''}" alt="עטיפת שיר">    
                    <div class="song-info">
                        <h3>${song.name || 'שיר ללא שם'}</h3>
                        <p class="song-meta">קטגוריה: ${song.categoryId || 'לא צויין'} · הועלה: ${new Date(song.creationDate).toLocaleDateString('he-IL')}</p>
                    </div>
                    <div class="song-actions">
                        <button class="icon-btn edit-song" title="ערוך"><i class="fas fa-pen"></i></button>
                        <button class="icon-btn delete-song" title="מחק"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                divlistsongs.appendChild(songItem);
            });
        })
        .catch(error => {
            console.error('Error loading songs:', error);
        });
} 

function fillDeatails() {
    console.log(objdata);
    nameSinger = document.querySelector('.singer-name');
    nameSinger.textContent = objdata.name;
    img = document.querySelector('.singer-avatar');
    img.src = objdata.img ? `${baseURL}/${objdata.img}` : '';
    mail = document.querySelector('.singer-email');
    mail.textContent = objdata.email;// + (objdata.img ? `/${objdata.img}` : '');
    loadsongs();
    loadCategories();



}
fillDeatails();
checkLoginAndShowNav();

// lightweight toast: creates a small non-blocking message
function showToast(message, timeout = 3000) {
    try {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            try { container.removeChild(toast); } catch (e) { }
            // remove container when empty
            if (container && container.children.length === 0) {
                try { container.parentNode.removeChild(container); } catch (e) { }
            }
        }, timeout);
    } catch (err) {
        // fallback to alert if DOM not ready
        try { alert(message); } catch (e) { console.log(message); }
    }
}

// load categories into select#songCategory
async function loadCategories() {
    const select = document.getElementById('songCategory');
    if (!select) return;
    try {
        // include Authorization header if token exists because server applies JWT middleware
        const tokenNow = localStorage.getItem('authToken');
        const headers = {};
        if (tokenNow) headers['Authorization'] = `Bearer ${tokenNow}`;
        const res = await fetch(`${baseURL}/api/categories/`, { headers });
        if (!res.ok) {
            // if unauthorized or other error, log and abort
            console.warn('Failed to fetch categories', res.status);
            return;
        }
        // handle 204 No Content or empty body
        let categories = [];
        if (res.status !== 204) {
            try {
                categories = await res.json();
            } catch (e) {
                categories = [];
            }
        }
        // clear existing (keep first placeholder)
        while (select.options.length > 1) select.remove(1);
        categories.forEach(category => {
            const opt = document.createElement('option');
            opt.value = category._id;
            opt.textContent = category.name;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error('Failed to load categories', err);
    }
}

loadCategories();

// modal open/close
const addSongModal = document.getElementById('addSongModal');
const openAddBtn = document.getElementById('openAddSongModal');
const closeAddBtn = document.getElementById('closeAddSongModal');
if (openAddBtn) openAddBtn.addEventListener('click', () => { if (addSongModal) addSongModal.style.display = 'block'; });
if (closeAddBtn) closeAddBtn.addEventListener('click', () => { if (addSongModal) addSongModal.style.display = 'none'; });
window.addEventListener('click', function (e) {
    if (addSongModal && e.target === addSongModal) addSongModal.style.display = 'none';
});

// helper to create song DOM item
// function createSongElement({ title, categoryText, thumbUrl }) {
//     const element = document.createElement('div');
//     element.className = 'song-item';
//     element.innerHTML = `
//         ${thumbUrl ? `<img class="song-thumb" src="${thumbUrl}" alt="עטיפת שיר">` : ''}
//         <div class="song-info">
//             <h3>${title}</h3>
//             <p class="song-meta">קטגוריה: ${categoryText} · הועלה: עכשיו</p>
//         </div>
//         <div class="song-actions">
//             <button class="icon-btn edit-song" title="ערוך"><i class="fas fa-pen"></i></button>
//             <button class="icon-btn delete-song" title="מחק"><i class="fas fa-trash"></i></button>
//         </div>
//     `;
//     return element;
// }

// submit handler: post FormData to server and update UI
const addSongForm = document.getElementById('addSongForm');
if (addSongForm) {
    addSongForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        // refresh token and user data at submit time
        const tokenNow = localStorage.getItem('authToken');
        const userNow = JSON.parse(localStorage.getItem('userData') || 'null');
        const singerId = userNow.id;
        if (!singerId) {
            showToast('עליך להיות מחובר כדי להוסיף שיר');
            return;
        }

        const name = document.getElementById('songTitle').value.trim();
        const categoryId = document.getElementById('songCategory').value;
        const categoryText = document.getElementById('songCategory').selectedOptions[0]?.textContent || '';
        const urlSongFile = document.getElementById('songFile').files[0] || null;
        const urlImgFile = document.getElementById('songImage').files[0] || null;
        const password = document.getElementById('password').value.trim();  

        if (!name) { showToast('אנא הכנס שם שיר'); return; }
        if (!categoryId) { showToast('אנא בחר קטגוריה'); return; }
        if (!urlSongFile) { showToast('אנא בחר קובץ שיר'); return; }
        if (!urlImgFile) { showToast('אנא בחר קובץ תמונה'); return; }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('idSinger', singerId);
        formData.append('creationDate', new Date().toISOString());
        formData.append('categoryId', categoryId);
        formData.append('DownloadCount', '0');
        if (urlSongFile) formData.append('urlSong', urlSongFile);
        if (urlImgFile) formData.append('urlImg', urlImgFile);

        try {
            const headers = {};
            if (tokenNow) headers['Authorization'] = `Bearer ${tokenNow}`;
            const resp = await fetch(`${baseURL}/api/songs`, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!resp.ok) {
                const errText = await resp.text();
                throw new Error(errText || 'Server error');
            }

            const created = await resp.json();
            divlistsongs.innerHTML='';
            // use returned data if available, otherwise local preview
            // const thumbUrl = urlImgFile ? URL.createObjectURL(urlImgFile) : (created.urlImg || '');
            // const songEl = createSongElement({ title: created.name || name, categoryText: created.categoryName || categoryText, thumbUrl });
            // const songsList = document.getElementById('songsList');
            // if (songsList) songsList.prepend(songEl);
            // attachSongActionListeners(songEl);
            // // close modal and reset
            ;if (addSongModal) addSongModal.style.display = 'none';
             addSongForm.reset();

            // // if we created a local objectURL for preview, store it so we can revoke on delete
            // if (urlImgFile) songEl.dataset.thumbUrl = thumbUrl;
            loadsongs();

        } catch (err) {
            console.error('Error adding song:', err);
            showToast('שגיאה בהוספת השיר');
        }
    });
}

// existing UI handlers
const editProfileBtn = document.getElementById('editProfileBtn');
if (editProfileBtn) editProfileBtn.addEventListener('click', openUpdateProfileModal);

// פונקציה לפתיחת modal עדכון פרופיל
function openUpdateProfileModal() {
    // יצירת modal דינמי
    const updateModalHtml = `
        <div id="updateProfileModal" class="modal" style="display: block;">
            <div class="modal-content">
                <span class="close" id="closeUpdateProfileModal">&times;</span>
                <h2>עדכון פרופיל</h2>
                <form id="updateProfileForm" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="updateName">שם:</label>
                        <input type="text" id="updateName" name="name" value="${objdata.name || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="updateEmail">אימייל:</label>
                        <input type="email" id="updateEmail" name="email" value="${objdata.email || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="updatePassword">סיסמה חדשה (השאר ריק אם לא רוצה לשנות):</label>
                        <input type="password" id="updatePassword" name="password" placeholder="סיסמה חדשה">
                    </div>
                    
                    <div class="form-group">
                        <label for="updateImage">תמונת פרופיל חדשה (אופציונלי):</label>
                        <input type="file" id="updateImage" name="img" accept="image/*">
                        ${objdata.img ? `<img src="${baseURL}/${objdata.img}" alt="תמונה נוכחית" style="max-width: 100px; margin-top: 10px;">` : ''}
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit">שמור שינויים</button>
                        <button type="button" id="cancelUpdateProfile">בטל</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // הוספת modal לעמוד
    document.body.insertAdjacentHTML('beforeend', updateModalHtml);
    
    // הוספת מאזינים
    const updateModal = document.getElementById('updateProfileModal');
    const closeUpdateBtn = document.getElementById('closeUpdateProfileModal');
    const cancelUpdateBtn = document.getElementById('cancelUpdateProfile');
    const updateForm = document.getElementById('updateProfileForm');
    
    // סגירת modal
    function closeUpdateModal() {
        if (updateModal) updateModal.remove();
    }
    
    closeUpdateBtn.addEventListener('click', closeUpdateModal);
    cancelUpdateBtn.addEventListener('click', closeUpdateModal);
    updateModal.addEventListener('click', (e) => {
        if (e.target === updateModal) closeUpdateModal();
    });
    
    // טיפול בשליחת הטופס
    updateForm.addEventListener('submit', handleUpdateProfileSubmit);
}

// פונקציה לטיפול בעדכון הפרופיל
async function handleUpdateProfileSubmit(e) {
    e.preventDefault();
    
    const currentToken = localStorage.getItem('authToken');

    if (!currentToken || !objdata) {
        showToast('עליך להיות מחובר כדי לעדכן פרופיל');
        return;
    }
    
    const updateFormData = new FormData();
    const updatedName = document.getElementById('updateName').value.trim();
    const updatedEmail = document.getElementById('updateEmail').value.trim();
    const newPassword = document.getElementById('updatePassword').value.trim();
    
    if (!updatedName) { 
        showToast('אנא הכנס שם');
        return;
    }
    
    if (!updatedEmail) {
        showToast('אנא הכנס אימייל');
        return;
    }
    
    // הוספת נתוני הטקסט ל-FormData
    updateFormData.append('name', updatedName);
    updateFormData.append('email', updatedEmail);
    updateFormData.append('role', objdata.role || 'singer'); // שמירה על התפקיד הקיים
    
    if (newPassword) {
        updateFormData.append('password', newPassword);
    }
    else {
        updateFormData.append('password', objdata.password);
    }   
    
    // איסוף הקובץ והוספתו ל-FormData - כמו בהרשמה
    const updateImgElement = document.getElementById("updateImage");
    const newImageFile = updateImgElement.files && updateImgElement.files[0];

    if (newImageFile) {
        // *** שם השדה חייב להיות 'img' כדי להתאים ל-Multer ***
        updateFormData.append('img', newImageFile); 
    }
    
    try {
        const updateResponse = await fetch(`${baseURL}/api/users/${objdata.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: updateFormData
        });
        
        if (!updateResponse.ok) {
            const errorMessage = await updateResponse.text();
            throw new Error(errorMessage || 'שגיאה בעדכון הפרופיל');
        }
        
        const updatedUserData = await updateResponse.json();
        
        // עדכון נתוני המשתמש בlocalStorage - בדיוק כמו בהרשמה
        localStorage.setItem('userData', JSON.stringify({
            id: updatedUserData._id,
            name: updatedUserData.name,
            email: updatedUserData.email,
            img: updatedUserData.img,
            role: updatedUserData.role
        }));
        
        // עדכון המשתנה הגלובלי
        objdata = JSON.parse(localStorage.getItem('userData'));
        
        // עדכון הממשק
        fillDeatails();
        
        showToast('הפרופיל עודכן בהצלחה!');
        
        // סגירת modal
        const updateModal = document.getElementById('updateProfileModal');
        if (updateModal) updateModal.remove();
        
    } catch (updateError) {
        console.error('Error updating profile:', updateError);
        showToast('שגיאה בעדכון הפרופיל: ' + updateError.message);
    }
}

// attach existing icon buttons using event delegation on songsList
const songsList = document.getElementById('songsList');
if (songsList) {
    songsList.addEventListener('click', function (e) {
        const edit = e.target.closest('.icon-btn.edit-song');
        const del = e.target.closest('.icon-btn.delete-song');
        if (edit) {
            alert('עריכת שיר - יש להוסיף טופס עריכה');
            return;
        }
        if (del) {
            const item = del.closest('.song-item');
            if (item && confirm('להסיר את השיר?')) {
                // revoke objectURL if any
                if (item.dataset.thumbUrl) {
                    try { URL.revokeObjectURL(item.dataset.thumbUrl); } catch (e) { }
                }
                item.remove();
            }
        }
    });
}

// פונקציה שמצרפת מאזינים לפריטים חדשים שנוצרו בדינאמיות
function attachSongActionListeners(songElement) {
    // nothing to attach specifically because we use delegation on songsList
    return;
}

