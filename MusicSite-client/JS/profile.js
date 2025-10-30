// קובץ JavaScript עבור עמוד האיזור האישי
const baseURL = "http://localhost:3000";

// בדיקת סטטוס המשתמש בטעינת העמוד
document.addEventListener('DOMContentLoaded', function() {
    checkUserStatus();
    loadUserProfile();
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
    
    // אם המשתמש הוא זמר, הצג את חלק השירים שלו
    if (user.role === 'singer') {
        document.getElementById('singerSection').style.display = 'block';
    }
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
    
    // הצגת מידע בכותרת
    document.getElementById('userInfo').innerHTML = `
        <p><strong>שם:</strong> ${user.name}</p>
        <p><strong>תפקיד:</strong> ${user.role === 'singer' ? 'זמר' : 'משתמש'}</p>
    `;
    
    // הצגת פרטים מלאים
    document.getElementById('profileDetails').innerHTML = `
        <p><strong>שם מלא:</strong> ${user.name}</p>
        <p><strong>כתובת אימייל:</strong> ${user.email}</p>
        <p><strong>תפקיד:</strong> ${user.role === 'singer' ? 'זמר' : 'משתמש רגיל'}</p>
        <p><strong>מזהה משתמש:</strong> ${user.id}</p>
    `;
    
    // טעינת מועדפים
    loadFavorites();
    
    // אם זמר, טען את השירים שלו
    if (user.role === 'singer') {
        loadMySongs();
    }
}

// טעינת רשימת מועדפים
async function loadFavorites() {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`${baseURL}/api/favorites`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const favorites = await response.json();
            displayFavorites(favorites);
        } else {
            document.getElementById('favoritesList').innerHTML = '<p>לא נמצאו שירים מועדפים</p>';
        }
    } catch (error) {
        console.error('שגיאה בטעינת מועדפים:', error);
        document.getElementById('favoritesList').innerHTML = '<p>שגיאה בטעינת המועדפים</p>';
    }
}

// הצגת רשימת מועדפים
function displayFavorites(favorites) {
    const favoritesList = document.getElementById('favoritesList');
    
    if (!favorites || favorites.length === 0) {
        favoritesList.innerHTML = '<p>אין שירים מועדפים עדיין</p>';
        return;
    }
    
    const favoritesHTML = favorites.map(fav => `
        <div class="favorite-item">
            <p><strong>${fav.songName}</strong> - ${fav.artistName}</p>
        </div>
    `).join('');
    
    favoritesList.innerHTML = favoritesHTML;
}

// טעינת השירים של הזמר
async function loadMySongs() {
    const token = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    try {
        const response = await fetch(`${baseURL}/api/songs/artist/${userData.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const songs = await response.json();
            displayMySongs(songs);
        } else {
            document.getElementById('mySongsList').innerHTML = '<p>לא נמצאו שירים</p>';
        }
    } catch (error) {
        console.error('שגיאה בטעינת השירים:', error);
        document.getElementById('mySongsList').innerHTML = '<p>שגיאה בטעינת השירים</p>';
    }
}

// הצגת השירים של הזמר
function displayMySongs(songs) {
    const mySongsList = document.getElementById('mySongsList');
    
    if (!songs || songs.length === 0) {
        mySongsList.innerHTML = '<p>לא העלית שירים עדיין</p>';
        return;
    }
    const songsHTML = songs.map(song => {
        const title = song.name || song.title || 'שיר ללא שם';
        const img = song.urlImg || song.urlImg || '../תמונות/placeholder.png';
        const created = song.creationDate || song.createdAt || Date.now();
        const category = song.categoryName || song.category || 'לא ידוע';

        return `
            <div class="song-item">
                <img class="song-thumb" src="${img}" alt="עטיפת שיר">
                <div class="song-info">
                    <h3>${title}</h3>
                    <p class="song-meta">קטגוריה: ${category} · הועלה: ${new Date(created).toLocaleDateString('he-IL')}</p>
                </div>
                <div class="song-actions">
                    <button class="icon-btn edit-song" title="ערוך"><i class="fas fa-pen"></i></button>
                    <button class="icon-btn delete-song" title="מחק"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');

    mySongsList.innerHTML = songsHTML;

    // צרף מאזינים לכפתורים
    mySongsList.querySelectorAll('.icon-btn.edit-song').forEach(btn => btn.addEventListener('click', () => alert('ערוך שיר - יש להוסיף טופס')));
    mySongsList.querySelectorAll('.icon-btn.delete-song').forEach(btn => btn.addEventListener('click', (e) => {
        const item = e.target.closest('.song-item');
        if (item && confirm('להסיר את השיר?')) item.remove();
    }));
}