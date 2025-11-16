// קובץ JavaScript עבור עמוד האיזור האישי
const baseURL = "http://localhost:3000";
// אופציה: רשימת אוואטארים רנדומליים (לשימוש עתידי). אפשר להחליף בנתיב לתמונות אצלך ב-public


// בדיקת סטטוס המשתמש בטעינת העמוד
document.addEventListener('DOMContentLoaded', function() {
    checkUserStatus();
    loadUserProfile();
    // כפתורי ניווט מהירים
    const homeButton = document.getElementById('goToHome');
    if (homeButton) homeButton.addEventListener('click', () => window.location.href = '../main.html');
    const logoutSidebarButton = document.getElementById('logoutBtnSide');
    if (logoutSidebarButton) logoutSidebarButton.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    // כפתור לפתיחת טופס עריכה
    const toggleEditButton = document.getElementById('toggleEditBtn');
    if (toggleEditButton) {
        toggleEditButton.addEventListener('click', () => {
            const profileEditForm = document.getElementById('editProfileForm');
            if (!profileEditForm) return;
            profileEditForm.style.display = profileEditForm.style.display === 'none' ? 'block' : 'none';
        });
    }

    const profileEditForm = document.getElementById('editProfileForm');
    if (profileEditForm) {
        profileEditForm.addEventListener('submit', submitProfileUpdate);
    }
});

// פונקציה לבדיקת סטטוס המשתמש
function checkUserStatus() {
    const authToken = localStorage.getItem('authToken');
    const storedUserJson = localStorage.getItem('userData');
    
    if (!authToken || !storedUserJson) {
        // אם המשתמש לא מחובר, הפנה לעמוד ההתחברות
        alert('יש להתחבר כדי לגשת לאיזור האישי');
        window.location.href = './login.html';
        return;
    }
    
    const currentUser = JSON.parse(storedUserJson);
    showLoggedInNav(currentUser.name || currentUser.username || 'משתמש');
    
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
    const storedUserJson = localStorage.getItem('userData');
    if (!storedUserJson) return;
    
    const currentUser = JSON.parse(storedUserJson);
    const letterEl = document.getElementById('letterAvatar');
    if (letterEl) {
        letterEl.classList.add('with-image');
        letterEl.style.backgroundImage = '';
        letterEl.textContent = '';
    }
    const profileNameElement = document.getElementById('userName');
    if (profileNameElement) profileNameElement.textContent = currentUser.name || 'משתמש';
    const profileEmailElement = document.getElementById('userEmail');
    if (profileEmailElement) profileEmailElement.textContent = currentUser.email || '';
    const badgesContainer = document.getElementById('userBadges');
    if (badgesContainer) {
        badgesContainer.innerHTML = '';
        const roleBadge = `<span class="badge">משתמש</span>`;
        badgesContainer.insertAdjacentHTML('beforeend', roleBadge);
    }

    // Pre-fill edit form
    const nameInput = document.getElementById('editName');
    const emailInput = document.getElementById('editEmail');
    if (nameInput) nameInput.value = currentUser.name || '';
    if (emailInput) emailInput.value = currentUser.email || '';
    
    // טעינת מועדפים
    loadFavorites();
    
}

// טעינת רשימת מועדפים מהשרת למשתמש
async function loadFavorites() {
    const authToken = localStorage.getItem('authToken');
    const favoritesListElement = document.getElementById('favoritesList');
    if (!favoritesListElement) return;
    favoritesListElement.innerHTML = '<p>טוען...</p>';
    try {
        const response = await fetch(`${baseURL}/api/favorites`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('שגיאה בטעינת המועדפים');
        const favorites = await response.json();
        displayFavorites(favorites);
    } catch (err) {
        console.error('Favorites error:', err);
        favoritesListElement.innerHTML = '<p>שגיאה בטעינת המועדפים</p>';
        const favoritesCountElement = document.getElementById('statFavorites');
        if (favoritesCountElement) favoritesCountElement.textContent = '0';
    }
}

function displayFavorites(favorites) {
    const favoritesListElement = document.getElementById('favoritesList');
    const favoritesCountElement = document.getElementById('statFavorites');
    if (!favoritesListElement) return;
    if (!favorites || favorites.length === 0) {
        favoritesListElement.innerHTML = '<p>אין שירים מועדפים עדיין</p>';
        if (favoritesCountElement) favoritesCountElement.textContent = '0';
        return;
    }
    favoritesListElement.innerHTML = favorites.map(f => `<div class="favorite-item"><p><strong>${f.songName}</strong> - ${f.artistName}</p></div>`).join('');
    if (favoritesCountElement) favoritesCountElement.textContent = String(favorites.length);
}

async function submitProfileUpdate(e){
    e.preventDefault();
    const profileFormStatusElement = document.getElementById('profileFormStatus');
    const authToken = localStorage.getItem('authToken');
    const currentUser = JSON.parse(localStorage.getItem('userData'));
    if (!currentUser || !currentUser.id) { profileFormStatusElement.textContent = 'שגיאה: אין משתמש מחובר'; return; }

    const newName = document.getElementById('editName').value.trim();
    const newEmail = document.getElementById('editEmail').value.trim();
    const newPassword = document.getElementById('editPassword').value;

    // basic validation
    if (!newName) { profileFormStatusElement.textContent = 'נא למלא שם'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { profileFormStatusElement.textContent = 'אימייל לא תקין'; return; }

    const formData = new FormData();
    formData.append('name', newName);
    formData.append('email', newEmail);
    if (newPassword && newPassword.length >= 6) formData.append('password', newPassword);

    try {
        const response = await fetch(`${baseURL}/api/users/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData,
        });
        if (!response.ok) {
            const txt = await response.text();
            throw new Error(txt || 'עדכון נכשל');
        }
        const updatedUser = await response.json();
        const updatedUserData = {
            id: updatedUser._id || updatedUser.id || currentUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: 'user',
            img: updatedUser.img,
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        profileFormStatusElement.textContent = 'עודכן בהצלחה!';
        loadUserProfile();
    } catch (err) {
        console.error('Update failed', err);
        profileFormStatusElement.textContent = 'שגיאה בעדכון: ' + err.message;
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