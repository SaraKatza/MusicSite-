# MusicSite – פלטפורמת ניהול מוזיקה (פרויקט גמר Full-Stack)

מערכת מלאה לניהול משתמשים, שירים, קטגוריות ומועדפים עם ממשק ניגון והורדת שירים בעברית.

**מחברות הפרויקט**  
תמר צויבל ושרי קצנלנבוגן
תאריך הגשה: נובמבר 2025

---

### תיאור הפרויקט

פרויקט Full-Stack המבוסס על ארכיטקטורת שרת-לקוח:  
- צד לקוח – ממשק סטטי (HTML + CSS +  JavaScript) עם עיצוב נקי ויפה. 
- צד שרת – API מבוסס Node.js + Express + MongoDB (Mongoose) עם אימות JWT, הצפנת סיסמאות והעלאת קבצים.

המערכת תומכת בשלושה תפקידים:  
- `user` – משתמש רגיל  
- `singer` – זמר שמעלה שירים  
- `admin` – מנהל מערכת

---

### תכונות מרכזיות

- רישום והתחברות עם תפקידים מוגדרים
- ניהול שירים: הוספה (קובץ שמע + תמונה), עדכון, מחיקה, חיפוש וסינון
- ניגון שירים עם נגן קבוע בתחתית הדף (HTML5 Audio API)
- הורדת שירים עם מונה הורדות שמתעדכן בזמן אמת
- מערכת מועדפים אישית (אינדקס ייחודי למניעת כפילויות)
- ניהול קטגוריות ( רק מנהל)
- העלאת קבצים (Multer) עם שדות מרובים באותה בקשה
- אבטחה מלאה: הצפנת סיסמאות (bcrypt), JWT, Joi validation, middleware מותאמים להרשאות

---

### מבנה הפרויקט
MusicSite/
├── client/
│   ├── HTML/
│   │   ├── main.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── profile.html
│   │   ├── singer-home.html
│   │   └── admin-home.html
│   ├── CSS/
│   │   └── style.css
│   ├── JS/
│   │   ├── main.js
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── profile.js
│   │   ├── singer-home.js
│   │   └── admin-home.js
│   └── images/
│       ├── default-song.jpg
│       └── logo.png
└── server/
    ├── controllers/
    │   ├── user.controllers.js
    │   ├── song.controllers.js
    │   ├── category.controllers.js
    │   └── favorite.controllers.js
    ├── middlewares/
    │   ├── auth.middleware.js
    │   ├── validate.middleware.js
    │   └── errors.middleware.js
    ├── models/
    │   ├── user.models.js
    │   ├── song.models.js
    │   ├── category.models.js
    │   └── favorite.models.js
    ├── routers/
    │   ├── user.routers.js
    │   ├── song.routers.js
    │   ├── category.routers.js
    │   └── favorite.routers.js
    ├── public/
    │   └── uploads/ 
    ├── config/
    │   └── db.js
    ├── app.js
    ├── package.json
    ├── package-lock.json
    └── .env  

---

### טכנולוגיות בשימוש

**Backend**  
Node.js • Express • MongoDB • Mongoose • bcryptjs • jsonwebtoken • multer • joi • cors • dotenv

**Frontend**  
HTML5 • CSS3 •  JavaScript • Fetch API • HTML5 Audio

---

### התקנה והרצה
ב bash:
git clone https://github.com/SaraKatza/MusicSite-.git
cd MusicSite-/server
npm install
npm start