//
// login.js - קוד מעודכן: הפניה אוטומטית בלבד
//
const baseURL = "http://localhost:3000";

// --- אלמנטים של המודאל המותאם אישית ---
const customAlert = document.getElementById('custom-alert');
const alertMessage = document.getElementById('alert-message');
const closeBtn = document.querySelector('.close-btn');
// נשמר את זה, אבל ננקה אותו בעת הצגת ההודעה
const modalButtonsContainer = document.getElementById('modal-buttons'); 

// פונקציה לסגירת המודאל
function closeCustomAlert() {
    if (customAlert) {
        customAlert.style.display = 'none';
        // חשוב: מנקים את מיכל הכפתורים כדי שלא יוצגו בטעות
        if (modalButtonsContainer) {
            modalButtonsContainer.innerHTML = ''; 
        }
    }
}

// פונקציה להצגת הודעה מותאמת אישית (פשוטה יותר, אין טיפול בכפתורים)
function showCustomAlert(message, duration = 3000) { 
    if (!customAlert || !alertMessage) return; 
    
    alertMessage.textContent = message; 
    customAlert.style.display = 'block'; 
    
    // מוודאים שאין כפתורים
    if (modalButtonsContainer) {
        modalButtonsContainer.innerHTML = '';
    }

    // סגירה אוטומטית של המודאל
    if (duration > 0) {
        setTimeout(closeCustomAlert, duration);
    }
}

// האזנה לאירועי סגירה
if (closeBtn) {
    closeBtn.onclick = closeCustomAlert;
}

// סגירת המודאל בלחיצה מחוץ לתיבה (Overlay)
window.onclick = function(event) {
    if (event.target == customAlert) {
        closeCustomAlert();
    }
}
// ----------------------------------------


async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    try {
        const response = await fetch(`${baseURL}/api/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const userName = data.user.name;

            // שמירת כל הנתונים החשובים ב-localStorage
            localStorage.setItem('authToken', data.token);  // שינוי שם המפתח ל-authToken
            localStorage.setItem('userData', JSON.stringify({
                id: data.user._id,
                name: userName,
                email: data.user.email,
                img: data.user.img,
                role: data.user.role
            }));

            // 1. הצגת הודעת ההצלחה (תסגר אוטומטית לאחר 3 שניות כברירת מחדל)
            showCustomAlert(`התחברת בהצלחה! שלום, ${userName}.`); 
            
            // 2. הפניה אוטומטית לדף הבית אחרי 2 שניות (זמן המעבר)
            setTimeout(() => {
                window.location.href = '../main.html'; // מעבר אוטומטי לדף הבית
            }, 2000); 
            
        } else {
            // טיפול בשגיאות
            showCustomAlert(data.error.message || "שגיאה בהתחברות: פרטי משתמש או סיסמה שגויים.");
        }
    } catch (error) {
        console.error("שגיאה:", error);
        showCustomAlert("אירעה שגיאה בחיבור לשרת.");
    }
}