// admin-dashboard.js - גרסה סופית ומושלמת
const baseURL = 'http://localhost:3000';
const token = localStorage.getItem('authToken');
const userData = JSON.parse(localStorage.getItem('userData') || 'null');

const contentArea = document.getElementById('adminContent');

// טעינת פרופיל מנהל
async function loadAdminProfile() {
    try {
        const res = await fetch(`${baseURL}/api/users/${userData.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const admin = await res.json();
        document.getElementById('adminName').textContent = admin.name;
        if (admin.img) {
            document.getElementById('adminAvatar').src = baseURL + admin.img;
            document.getElementById('currentImgPreview').src = baseURL + admin.img;
        }
    } catch (err) {
        console.error('שגיאה בטעינת פרופיל מנהל');
    }
}
loadAdminProfile();

// ניווט ראשי – 3 כפתורים בצד
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadSection(btn.dataset.section);
    });
});

// טעינה ראשונית
loadSection('users');

// טעינת תוכן לפי כפתור שנלחץ
async function loadSection(section) {
    if (section === 'users') {
        contentArea.innerHTML = `
            <h2 class="section-title">ניהול משתמשים וזמרים</h2>
            <div class="user-filter-tabs">
                <button class="user-filter-btn active" data-type="user">משתמשים רגילים</button>
                <button class="user-filter-btn" data-type="singer">זמרים</button>
            </div>
            <div id="usersGrid" class="users-grid"></div>
        `;
        loadUsers('user');

        document.querySelectorAll('.user-filter-btn').forEach(b => {
            b.onclick = () => {
                document.querySelectorAll('.user-filter-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                loadUsers(b.dataset.type);
            };
        });

    } else if (section === 'categories') {
        contentArea.innerHTML = `<h2 class="section-title">ניהול קטגוריות</h2>`;
        document.getElementById('categorySelectionModal').style.display = 'flex';
        loadCategoriesModal();

    } else if (section === 'admins') {
        contentArea.innerHTML = `
            <div class="section-header-flex">
                <h2 class="section-title">ניהול מנהלים</h2>
                <button class="btn primary" id="addAdminBtn">+ הוסף מנהל חדש</button>
            </div>
            <div id="adminsGrid" class="users-grid"></div>
        `;
        loadAdmins();
        document.getElementById('addAdminBtn').onclick = () => {
            document.getElementById('adminModal').style.display = 'flex';
        };
    }
}

// ניהול משתמשים וזמרים
async function loadUsers(type) {
    const res = await fetch(`${baseURL}/api/users?role=${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = await res.json();

    const grid = document.getElementById('usersGrid');
    grid.innerHTML = users.map(u => `
        <div class="user-card-admin">
            <button class="delete-user-x" data-id="${u._id}">×</button>
            ${u.img 
                ? `<img src="${baseURL}${u.img}" alt="${u.name}">`
                : `<div class="default-avatar">${u.name.charAt(0).toUpperCase()}</div>`
            }
            <h4>${u.name}</h4>
            <p>${u.email}</p>
            ${type === 'singer' ? '<span class="role-tag singer">זמר</span>' : ''}
        </div>
    `).join('');

    // מחיקת משתמש/זמר
    grid.querySelectorAll('.delete-user-x').forEach(btn => {
        btn.onclick = async () => {
            if (confirm(`למחוק את ${type === 'singer' ? 'הזמר' : 'המשתמש'} "${users.find(x => x._id === btn.dataset.id).name}" לצמיתות?`)) {
                await fetch(`${baseURL}/api/users/${btn.dataset.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                loadUsers(type);
            }
        };
    });
}

// ניהול קטגוריות – רק עריכת שם + הוספה
async function loadCategoriesModal() {
    const res = await fetch(`${baseURL}/api/categories`);
    const categories = await res.json();

    const list = document.getElementById('categoriesAdminList');
    list.innerHTML = `
        <div class="selection-item add-category-item" id="addNewCategoryItem">
            <span>+ הוסף קטגוריה חדשה</span>
        </div>
    ` + categories.map(cat => `
        <div class="selection-item">
            <span>${cat.name}</span>
            <button class="edit-category-btn" data-id="${cat._id}" data-name="${cat.name}" title="ערוך שם">
                <i class="fas fa-pencil-alt"></i>
            </button>
        </div>
    `).join('');

    document.getElementById('addNewCategoryItem').onclick = () => {
        document.getElementById('categorySelectionModal').style.display = 'none';
        document.getElementById('addCategoryModal').style.display = 'flex';
    };

    list.querySelectorAll('.edit-category-btn').forEach(btn => {
        btn.onclick = () => {
            document.getElementById('editCategoryId').value = btn.dataset.id;
            document.getElementById('editCategoryNameInput').value = btn.dataset.name;
            document.getElementById('editCategoryModal').style.display = 'flex';
        };
    });
}

// שמירת קטגוריה חדשה
document.getElementById('saveNewCategory').onclick = async () => {
    const name = document.getElementById('newCategoryName').value.trim();
    if (!name) return alert('הזן שם לקטגוריה');

    await fetch(`${baseURL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
    });

    document.getElementById('addCategoryModal').style.display = 'none';
    loadCategoriesModal();
};

// שמירת שם קטגוריה מעודכן
document.getElementById('saveCategoryNameBtn').onclick = async () => {
    const id = document.getElementById('editCategoryId').value;
    const newName = document.getElementById('editCategoryNameInput').value.trim();

    if (!newName) return alert('הזן שם תקין');

    try {
        const res = await fetch(`${baseURL}/api/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: newName })
        });

        if (!res.ok) throw new Error('שגיאה');

        document.getElementById('editCategoryModal').style.display = 'none';
        loadCategoriesModal();
        alert('שם הקטגוריה עודכן בהצלחה!');
    } catch {
        alert('שגיאה בעדכון השם');
    }
};

// ניהול מנהלים
async function loadAdmins() {
    const res = await fetch(`${baseURL}/api/users?role=admin`, { headers: { 'Authorization': `Bearer ${token}` } });
    const admins = await res.json();

    const grid = document.getElementById('adminsGrid');
    grid.innerHTML = admins.map(a => `
        <div class="user-card-admin">
            ${a._id !== userData.id ? `<button class="delete-user-x" data-id="${a._id}">×</button>` : ''}
            <div class="default-avatar" style="background:#9b59b6;color:white;">${a.name.charAt(0).toUpperCase()}</div>
            <h4>${a.name}</h4>
            <p>${a.email}</p>
        </div>
    `).join('');

    grid.querySelectorAll('.delete-user-x').forEach(btn => {
        btn.onclick = async () => {
            if (confirm('למחוק מנהל זה לצמיתות?')) {
                await fetch(`${baseURL}/api/users/${btn.dataset.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                loadAdmins();
            }
        };
    });
}

document.getElementById('saveAdminBtn').addEventListener('click', async () => {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!name || !email || !password) {
        alert('יש למלא את כל השדות');
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', 'admin'); 

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:3000/api/users/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const result = await response.json();

        if (response.ok) {
            alert('מנהל נוצר בהצלחה!');
            document.getElementById('adminModal').querySelector('.close-btn').click();
            loadAdmins() ;
        } else {
            alert(result.error?.message || 'שגיאה ביצירת מנהל');
        }
    } catch (err) {
        alert('שגיאה: ' + err.message);
    }
});

// עריכת פרופיל אישי
document.getElementById('editProfileBtn').onclick = async () => {
    const res = await fetch(`${baseURL}/api/users/${userData.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const user = await res.json();

    document.getElementById('editName').value = user.name;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editPassword').value = '';
    document.getElementById('currentImgPreview').src = user.img ? baseURL + user.img : '';

    document.getElementById('editProfileModal').style.display = 'flex';
};

document.getElementById('editProfileForm').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('editName').value);
    formData.append('email', document.getElementById('editEmail').value);
    if (document.getElementById('editPassword').value) {
        formData.append('password', document.getElementById('editPassword').value);
    }
    if (document.getElementById('editImg').files[0]) {
        formData.append('img', document.getElementById('editImg').files[0]);
    }

    try {
        await fetch(`${baseURL}/api/users/${userData.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        alert('הפרופיל עודכן בהצלחה!');
        document.getElementById('editProfileModal').style.display = 'none';
        loadAdminProfile();
    } catch {
        alert('שגיאה בעדכון הפרופיל');
    }
};

// סגירת כל המודאלים
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.onclick = () => btn.closest('.custom-alert-modal').style.display = 'none';
});
window.addEventListener('click', e => {
    if (e.target.classList.contains('custom-alert-modal')) {
        e.target.style.display = 'none';
    }
});