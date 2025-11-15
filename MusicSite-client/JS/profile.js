// קובץ JavaScript עבור עמוד האיזור האישי
const baseURL = "http://localhost:3000";
// אופציה: רשימת אוואטארים רנדומליים (לשימוש עתידי). אפשר להחליף בנתיב לתמונות אצלך ב-public
const RANDOM_AVATARS = [
    // דוגמאות: 'public/avatars/1.png', 'public/avatars/2.png'
];

// בדיקת סטטוס המשתמש בטעינת העמוד
document.addEventListener('DOMContentLoaded', function() {
    checkUserStatus();
    loadUserProfile();
    // quick nav buttons
    const goHome = document.getElementById('goToHome');
    if (goHome) goHome.addEventListener('click', () => window.location.href = '../main.html');
    const logoutSide = document.getElementById('logoutBtnSide');
    if (logoutSide) logoutSide.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    // toggle edit/details
    const toggleBtn = document.getElementById('toggleEditBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const form = document.getElementById('editProfileForm');
            if (!form) return;
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });
    }

    const form = document.getElementById('editProfileForm');
    if (form) {
        form.addEventListener('submit', submitProfileUpdate);
    }
});

// פונקציה לבדיקת סטטוס המשתמש
function checkUserStatus() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        // אם המשתמש לא מחובר, הפנה לעמוד ההתחברות
        alert('יש להתחבר כדי לגשת לאיזור האישי');
        window.location.href = './login.html';
        return;
    }
    
    const user = JSON.parse(userData);
    showLoggedInNav(user.name || user.username || 'משתמש');
    
    // עמוד זה הוא למשתמשים בלבד – לא מציגים חלקים של זמרים
}

// הצגת ניווט למשתמש מחובר
function showLoggedInNav(userName) {
    document.getElementById('guestNav').style.display = 'none';
    document.getElementById('userNav').style.display = 'flex';
    document.getElementById('welcomeMessage').textContent = `שלום, ${userName}`;
    
    // הוספת אירוע ללחיצה על כפתור התנתקות
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
    
    // הוספת אירוע ללחיצה על כפתור איזור אישי (כבר באיזור האישי)
    document.getElementById('profileBtn').addEventListener('click', function(e) {
        e.preventDefault();
        // כבר באיזור האישי - אפשר לעשות scroll למעלה או לרענן
        window.scrollTo(0, 0);
    });
}

// פונקציה להתנתקות
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '../main.html';
}

// טעינת פרטי המשתמש
function loadUserProfile() {
    const userData = localStorage.getItem('userData');
    if (!userData) return;
    
    const user = JSON.parse(userData);
    // set avatar: prefer random image if list provided, else letter avatar
    const letterEl = document.getElementById('letterAvatar');
    if (RANDOM_AVATARS && RANDOM_AVATARS.length > 0) {
        const idx = deterministicIndex(user.id || user.email || user.name || 'user', RANDOM_AVATARS.length);
        const url = RANDOM_AVATARS[idx];
        // אם בעתיד תשתמש/י בתמונות, אפשר להחליף את ה-div לתמונה. לעת עתה, נשמור על אות אם אין תמונות.
        // למשל: create <img class="avatar-img" src="url" /> ולהחליף את התוכן
        if (letterEl) {
            letterEl.style.background = `center / cover no-repeat url('${url}')`;
            letterEl.textContent = '';
        }
    } else if (letterEl) {
        // Add class for default background image
        letterEl.classList.add('with-image');
        letterEl.textContent = '';
    }
    const nmEl = document.getElementById('userName');
    if (nmEl) nmEl.textContent = user.name || 'משתמש';
    const emEl = document.getElementById('userEmail');
    if (emEl) emEl.textContent = user.email || '';
    const badges = document.getElementById('userBadges');
    if (badges) {
        badges.innerHTML = '';
        const roleBadge = `<span class="badge">משתמש</span>`;
        badges.insertAdjacentHTML('beforeend', roleBadge);
    }

    // Pre-fill edit form
    const editName = document.getElementById('editName');
    const editEmail = document.getElementById('editEmail');
    if (editName) editName.value = user.name || '';
    if (editEmail) editEmail.value = user.email || '';
    
    // אין הצגת פרטים כפולה – רק הטופס יופיע בעת לחיצה
    
    // טעינת מועדפים
    loadFavorites();
    
    // משתמש רגיל: מציגים רק מועדפים
}

// טעינת רשימת מועדפים מהשרת למשתמש
async function loadFavorites() {
    const token = localStorage.getItem('authToken');
    const favoritesList = document.getElementById('favoritesList');
    if (!favoritesList) return;
    favoritesList.innerHTML = '<p>טוען...</p>';
    try {
        const response = await fetch(`${baseURL}/api/favorites`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('שגיאה בטעינת המועדפים');
        const favorites = await response.json();
        displayFavorites(favorites);
    } catch (err) {
        console.error('Favorites error:', err);
        favoritesList.innerHTML = '<p>שגיאה בטעינת המועדפים</p>';
        const statFav = document.getElementById('statFavorites');
        if (statFav) statFav.textContent = '0';
    }
}

function displayFavorites(favorites) {
    const favoritesList = document.getElementById('favoritesList');
    const statFav = document.getElementById('statFavorites');
    if (!favoritesList) return;
    if (!favorites || favorites.length === 0) {
        favoritesList.innerHTML = '<p>אין שירים מועדפים עדיין</p>';
        if (statFav) statFav.textContent = '0';
        return;
    }
    favoritesList.innerHTML = favorites.map(f => `<div class="favorite-item"><p><strong>${f.songName}</strong> - ${f.artistName}</p></div>`).join('');
    if (statFav) statFav.textContent = String(favorites.length);
}

async function submitProfileUpdate(e){
    e.preventDefault();
    const statusEl = document.getElementById('profileFormStatus');
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('userData'));
    if (!user || !user.id) { statusEl.textContent = 'שגיאה: אין משתמש מחובר'; return; }

    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const password = document.getElementById('editPassword').value;

    // basic validation
    if (!name) { statusEl.textContent = 'נא למלא שם'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { statusEl.textContent = 'אימייל לא תקין'; return; }

    const fd = new FormData();
    fd.append('name', name);
    fd.append('email', email);
    if (password && password.length >= 6) fd.append('password', password);

    try {
        const res = await fetch(`${baseURL}/api/users/${user.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd,
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || 'עדכון נכשל');
        }
        const updated = await res.json();
        // update localStorage format expected in app
        const newUserData = {
            id: updated._id || updated.id || user.id,
            name: updated.name,
            email: updated.email,
            role: 'user',
            img: updated.img,
        };
        localStorage.setItem('userData', JSON.stringify(newUserData));
        statusEl.textContent = 'עודכן בהצלחה!';
        loadUserProfile();
    } catch (err) {
        console.error('Update failed', err);
        statusEl.textContent = 'שגיאה בעדכון: ' + err.message;
    }
}

// פונקציה לקבלת אינדקס דטרמיניסטי לפי מזהה משתמש
function deterministicIndex(key, mod) {
    let hash = 0;
    for (let i = 0; i < String(key).length; i++) {
        hash = ((hash << 5) - hash) + String(key).charCodeAt(i);
        hash |= 0; // ל-32bit
    }
    return Math.abs(hash) % mod;
}