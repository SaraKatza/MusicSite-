const baseURL = "http://localhost:3000";
let objdata = JSON.parse(localStorage.getItem('userData') || 'null');

// משתני הפלייר
let currentPlaylist = [];
let currentSongIndex = 0;
let audioPlayer = null;

// בדיקת סטטוס המשתמש בטעינת העמוד
document.addEventListener('DOMContentLoaded', function () {
    checkUserStatus();
    loadUserProfile();
    initializeMusicPlayer();

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
function closeProfileModal() {
    const profileEditForm = document.getElementById('editProfileForm');
    if (!profileEditForm) return;
    profileEditForm.style.display = 'none';
}
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
    document.getElementById('logoutBtn').addEventListener('click', function (e) {
        e.preventDefault();
        logout();
    });

    // הוספת אירוע ללחיצה על כפתור איזור אישי (כבר באיזור האישי)
    document.getElementById('profileBtn').addEventListener('click', function (e) {
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
        if  (response.status === 204) {
            favoritesListElement.innerHTML = '<p>אין שירים מועדפים עדיין</p>';
            const favoritesCountElement = document.getElementById('statFavorites');
            if (favoritesCountElement) favoritesCountElement.textContent = '0';
            return;
        }
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

    // שמירת רשימת השירים לפלייר
    currentPlaylist = favorites.map(favorite => ({
        id: favorite.idsongorsinger,
        src: `${baseURL}/${favorite.urlAudio}`,
        name: favorite.songName || 'שם לא ידוע',
        artist: favorite.artistName || 'אמן לא ידוע',
        img: `${baseURL}/${favorite.urlImg}`
    }));

    // יצירת כרטיסים לשירים מועדפים עם תמונה וכפתור השמעה
    favoritesListElement.innerHTML = favorites.map((favorite, index) => {
        const songId = favorite.idsongorsinger;
        const favoriteId = favorite._id; // מזהה ה-favorite למחיקה
        const songName = favorite.songName || 'שם לא ידוע';
        const artistName = favorite.artistName || 'אמן לא ידוע';
        const songImage = `${baseURL}/${favorite.urlImg}`; // נתיב לתמונת השיר (מהשרת)
        const songAudio = `${baseURL}/${favorite.urlAudio}`; // נתיב לקובץ השמע (מהשרת)

        return `
            <div class="favorite-song-card" data-favorite-id="${favoriteId}">
                <button class="remove-favorite-btn" onclick="removeFavorite('${favoriteId}')" title="הסר מהמועדפים">
                    <i class="fas fa-times"></i>
                </button>
                <div class="favorite-song-image" onclick="playSongFromFavorites('${songId}', '${songAudio}', '${songName}', '${artistName}', '${songImage}')">
                    <img src="${songImage}" alt="${songName}" onerror="this.src='${baseURL}/uploads/default-song.jpg'">
                    <div class="favorite-play-overlay">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="favorite-song-info">
                    <p class="favorite-song-name"><strong>${songName}</strong></p>
                    <p class="favorite-artist-name">${artistName}</p>
                </div>
            </div>
        `;
    }).join('');

    if (favoritesCountElement) favoritesCountElement.textContent = String(favorites.length);
}

// פונקציה להשמעת שיר מרשימת המועדפים
function playSongFromFavorites(songId, audioSrc, songName, artistName, imgSrc) {
    // מציאת האינדקס של השיר ברשימה
    const songIndex = currentPlaylist.findIndex(song => song.id === songId);
    if (songIndex !== -1) {
        currentSongIndex = songIndex;
        playSongAtIndex(currentSongIndex);
    }
}

// אתחול הפלייר
function initializeMusicPlayer() {
    audioPlayer = new Audio();

    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressBar = document.getElementById('progressBar');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeBtn = document.getElementById('volumeBtn');

    // כפתור play/pause
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }

    // כפתור הקודם
    if (prevBtn) {
        prevBtn.addEventListener('click', playPreviousSong);
    }

    // כפתור הבא
    if (nextBtn) {
        nextBtn.addEventListener('click', playNextSong);
    }

    // פס התקדמות
    if (progressBar) {
        progressBar.addEventListener('input', (e) => {
            const seekTime = (audioPlayer.duration / 100) * e.target.value;
            audioPlayer.currentTime = seekTime;
        });
    }

    // עוצמת קול
    if (volumeSlider) {
        audioPlayer.volume = volumeSlider.value / 100;
        volumeSlider.addEventListener('input', (e) => {
            audioPlayer.volume = e.target.value / 100;
            updateVolumeIcon(e.target.value);
        });
    }

    // כפתור עוצמת קול (mute/unmute)
    if (volumeBtn) {
        volumeBtn.addEventListener('click', () => {
            if (audioPlayer.volume > 0) {
                audioPlayer.volume = 0;
                volumeSlider.value = 0;
                updateVolumeIcon(0);
            } else {
                audioPlayer.volume = 0.7;
                volumeSlider.value = 70;
                updateVolumeIcon(70);
            }
        });
    }

    // עדכון פס התקדמות
    audioPlayer.addEventListener('timeupdate', updateProgress);

    // כשהשיר נגמר - עבור לשיר הבא
    audioPlayer.addEventListener('ended', playNextSong);
}

// נגן/השהה
function togglePlayPause() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (!audioPlayer || !audioPlayer.src) return;

    if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        audioPlayer.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

// נגן שיר לפי אינדקס
function playSongAtIndex(index) {
    if (index < 0 || index >= currentPlaylist.length) return;

    const song = currentPlaylist[index];
    const playerBar = document.getElementById('musicPlayerBar');
    const playerSongImage = document.getElementById('playerSongImage');
    const playerSongName = document.getElementById('playerSongName');
    const playerArtistName = document.getElementById('playerArtistName');
    const playPauseBtn = document.getElementById('playPauseBtn');

    // עדכון המידע בפלייר
    if (playerSongImage) playerSongImage.src = song.img;
    if (playerSongName) playerSongName.textContent = song.name;
    if (playerArtistName) playerArtistName.textContent = song.artist;

    // הצג את הפלייר
    if (playerBar) playerBar.style.display = 'flex';

    // נגן את השיר
    audioPlayer.src = song.src;
    audioPlayer.play();
    if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';

    // שמור ב-localStorage
    localStorage.setItem('currentSong', JSON.stringify(song));
}

// שיר הבא
function playNextSong() {
    currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
    playSongAtIndex(currentSongIndex);
}

// שיר קודם
function playPreviousSong() {
    currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    playSongAtIndex(currentSongIndex);
}

// עדכון פס התקדמות
function updateProgress() {
    const progressBar = document.getElementById('progressBar');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');

    if (!audioPlayer || !progressBar) return;

    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = progress || 0;
    progressBar.style.setProperty('--progress', `${progress}%`);

    if (currentTimeEl) currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    if (totalTimeEl) totalTimeEl.textContent = formatTime(audioPlayer.duration);
}

// עדכון אייקון עוצמת קול
function updateVolumeIcon(volume) {
    const volumeBtn = document.getElementById('volumeBtn');
    if (!volumeBtn) return;

    const icon = volumeBtn.querySelector('i');
    if (!icon) return;

    if (volume == 0) {
        icon.className = 'fas fa-volume-mute';
    } else if (volume < 50) {
        icon.className = 'fas fa-volume-down';
    } else {
        icon.className = 'fas fa-volume-up';
    }
}

// פורמט זמן (שניות לדקות:שניות)
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// מחיקת שיר מהמועדפים
async function removeFavorite(favoriteId) {
    if (!confirm('האם אתה בטוח שברצונך להסיר שיר זה מהמועדפים?')) {
        return;
    }

    const authToken = localStorage.getItem('authToken');
    try {
        const response = await fetch(`${baseURL}/api/favorites/${favoriteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error('שגיאה במחיקת השיר');

        // הסר את הכרטיס מהממשק
        const cardElement = document.querySelector(`[data-favorite-id="${favoriteId}"]`);
        if (cardElement) {
            cardElement.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                cardElement.remove();
                // עדכון מונה המועדפים
                const favoritesCountElement = document.getElementById('statFavorites');
                const currentCount = parseInt(favoritesCountElement?.textContent || '0');
                if (favoritesCountElement && currentCount > 0) {
                    favoritesCountElement.textContent = String(currentCount - 1);
                }

                // אם אין יותר שירים
                const favoritesListElement = document.getElementById('favoritesList');
                if (favoritesListElement && favoritesListElement.children.length === 0) {
                    favoritesListElement.innerHTML = '<p>אין שירים מועדפים עדיין</p>';
                }
            }, 300);
        }

        // עדכון רשימת הפלייר
        currentPlaylist = currentPlaylist.filter(song => song.id !== favoriteId);

    } catch (err) {
        console.error('Remove favorite error:', err);
        alert('שגיאה במחיקת השיר מהמועדפים');
    }
}

async function submitProfileUpdate(e) {
    e.preventDefault();
    const formData = new FormData();
    const profileFormStatusElement = document.getElementById('profileFormStatus');
    const authToken = localStorage.getItem('authToken');
    const currentUser = JSON.parse(localStorage.getItem('userData'));
    if (!currentUser || !currentUser.id) { profileFormStatusElement.textContent = 'שגיאה: אין משתמש מחובר'; return; }

    const newName = document.getElementById('editName').value.trim();
    const newEmail = document.getElementById('editEmail').value.trim();
    const newPassword = document.getElementById('editPassword').value;
    if (!newName) {
        showToast('אנא הכנס שם');
        return;
    }

    if (!newEmail) {
        showToast('אנא הכנס אימייל');
        return;
    }
    formData.append('name', newName);
    formData.append('email', newEmail);
    formData.append('role', currentUser.role || 'user');

    if (newPassword && newPassword.length >= 6) {
        formData.append('password', newPassword);
    }

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

        const existingUser = JSON.parse(localStorage.getItem('userData')) || {};
        const updatedFields = {};

        // עוברים רק על שדות שבאמת קיימים ב-FormData
        if (formData.has('name')) updatedFields.name = formData.get('name');
        if (formData.has('email')) updatedFields.email = formData.get('email');
        if (formData.has('password')) updatedFields.password = formData.get('password');
        if (formData.has('img')) updatedFields.img = formData.get('img');
        if (formData.has('role')) updatedFields.role = formData.get('role');

        // מיזוג העדכונים לתוך המשתמש הקיים
        const mergedUser = {
            ...existingUser,
            ...updatedFields
        };
        // עדכון נתוני המשתמש בlocalStorage - בדיוק כמו בהרשמה
       localStorage.setItem('userData', JSON.stringify(mergedUser));

        // עדכון המשתנה הגלובלי
        objdata = JSON.parse(localStorage.getItem('userData'));

        // עדכון הממשק
        loadUserProfile();
         showLoggedInNav(objdata.name);
         closeProfileModal()
        
        alert('הפרופיל עודכן בהצלחה!');

        // סגירת modal
        const updateModal = document.getElementById('updateProfileModal');
        if (updateModal) updateModal.remove();

    } catch (updateError) {
        console.error('Error updating profile:', updateError);
        alret('שגיאה בעדכון הפרופיל: ' + updateError.message);
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