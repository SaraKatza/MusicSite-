
const baseURL = "http://localhost:3000"; // הנתיב הבסיסי של השרת

// --- אלמנטים של המודאל המותאם אישית ---
const customAlert = document.getElementById('custom-alert');
const alertMessage = document.getElementById('alert-message');
const closeBtn = document.querySelector('.close-btn');

// פונקציה להצגת הודעה מותאמת אישית
function showCustomAlert(message) {
    alertMessage.textContent = message; // הכנסת הטקסט להודעה
    customAlert.style.display = 'block'; // הצגת המודאל
}

// פונקציה לסגירת המודאל
function closeCustomAlert() {
    customAlert.style.display = 'none';
}

// האזנה לאירועי סגירה
if (closeBtn) {
    closeBtn.onclick = closeCustomAlert;
}

// סגירת המודאל בלחיצה מחוץ לתיבה (אופציונלי)
window.onclick = function(event) {
    if (event.target == customAlert) {
        closeCustomAlert();
    }
}
// ----------------------------------------


const roleSelect = document.getElementById('role');
const singerImgGroup = document.querySelector('.singer-img');

function toggleSingerImageField() {
    if (roleSelect.value === 'singer') {
        singerImgGroup.style.display = 'block';
        document.getElementById('img').required = true; 
    } else {
        singerImgGroup.style.display = 'none';
        document.getElementById('img').required = false; 
    }
}

roleSelect.addEventListener('change', toggleSingerImageField);
toggleSingerImageField();


async function register(event) {
    // מניעת שליחת טופס רגילה
    event.preventDefault(); 
    
    // 1. יצירת אובייקט FormData
    const formData = new FormData();
    
    // 2. איסוף נתוני הטקסט והוספתם ל-FormData
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const password2 = document.getElementById("password2").value; 
    const role = document.getElementById("role").value;
    
    // בדיקת התאמת סיסמאות בצד הלקוח (הגנה ראשונית)
    if (password !== password2) {
        // שימוש במודאל המותאם אישית במקום alert
        showCustomAlert("הסיסמאות אינן תואמות. אנא ודא שהסיסמה והאימות זהים.");
        return;
    }

    // הוספת שדות הטקסט ל-FormData
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("role", role);

    // 3. איסוף הקובץ והוספתו ל-FormData
    const imgElement = document.getElementById("img");
    const imgFile = imgElement.files && imgElement.files[0];

    if (imgFile) {
        // *** שם השדה חייב להיות 'img' כדי להתאים ל-Multer (`.single('img')`) ***
        formData.append('img', imgFile); 
    }
    
    try {
        // 4. שליחת הבקשה לשרת
        const response = await fetch(`${baseURL}/api/users/`, {
            method: "POST",
            // *** אין להגדיר Content-Type! הדפדפן מגדיר אוטומטית multipart/form-data ***
            body: formData 
        });

        const data = await response.json();

        // 5. טיפול בתגובת השרת
        if (response.ok) {
            // שימוש במודאל המותאם אישית
            showCustomAlert(`משתמש ${data.user.name} נרשם בהצלחה!`);
            
            // שמירת נתוני המשתמש ב-localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify({
                id: data.user._id,
                name: data.user.name,
                email: data.user.email,
                img: data.user.img,
                role: data.user.role
            }));
            
            // המתן מעט ואז הפנה לעמוד אחר (כדי שהמשתמש יספיק לראות את הודעת ההצלחה)
            setTimeout(() => {
                window.location.href = '../main.html';
            }, 1500); 
            
        } else {
            // טיפול בשגיאות מהשרת
            const errorMessage = data.error.msg || data.error.message || "שגיאת הרשמה: אירעה שגיאה בנתונים.";
            // שימוש במודאל המותאם אישית
            showCustomAlert(errorMessage);
        }

    } catch (error) {
        console.error("שגיאה בשליחת הבקשה:", error);
        // שימוש במודאל המותאם אישית
        showCustomAlert("אירעה שגיאה בחיבור לשרת.");
    }
}