// متغيرات عامة
let currentUser = null;
let currentMembers = [];
let currentPoints = [];
let positiveCategories = {};
let negativeCategories = {};

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// تهيئة التطبيق
function initializeApp() {
    // إعداد أحداث النماذج
    setupEventListeners();
    
    // التحقق من حالة تسجيل الدخول
    checkLoginStatus();
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // نموذج تسجيل الدخول
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // نموذج تغيير كلمة المرور
    document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
    
    // تسجيل الخروج
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // التبويبات
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // فلتر الفترة الزمنية
    document.getElementById('period-filter').addEventListener('change', handlePeriodChange);
    document.getElementById('apply-filter').addEventListener('click', applyCustomFilter);
    
    // أزرار الإضافة
    document.getElementById('add-member-btn').addEventListener('click', showAddMemberForm);
    document.getElementById('add-user-btn').addEventListener('click', showAddUserForm);
    
    // نموذج إضافة النقاط
    document.getElementById('add-point-form').addEventListener('submit', handleAddPoint);
    document.getElementById('point-type').addEventListener('change', updatePointCategories);
    
    // إغلاق النوافذ المنبثقة
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // نافذة تفاصيل العضو
    document.getElementById('edit-member-btn').addEventListener('click', handleEditMember);
    document.getElementById('delete-member-btn').addEventListener('click', handleDeleteMember);
}

// التحقق من حالة تسجيل الدخول
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/current-user');
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showMainScreen();
        } else {
            showLoginScreen();
        }
    } catch (error) {
        console.error('خطأ في التحقق من حالة تسجيل الدخول:', error);
        showLoginScreen();
    }
}

// عرض شاشة تسجيل الدخول
function showLoginScreen() {
    hideAllScreens();
    document.getElementById('login-screen').classList.add('active');
}

// عرض شاشة تغيير كلمة المرور
function showChangePasswordScreen() {
    hideAllScreens();
    document.getElementById('change-password-screen').classList.add('active');
}

// عرض الشاشة الرئيسية
function showMainScreen() {
    hideAllScreens();
    document.getElementById('main-screen').classList.add('active');
    
    // تحديث معلومات المستخدم
    document.getElementById('user-name').textContent = currentUser.username;
    document.getElementById('user-role').textContent = getRoleDisplayName(currentUser.role);
    
    // إعداد التبويبات حسب الصلاحيات
    setupTabsBasedOnRole();
    
    // تحميل البيانات الأولية
    loadInitialData();
}

// إخفاء جميع الشاشات
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// معالجة تسجيل الدخول
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password')
    };
    
    try {
        showLoading();
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            
            if (data.first_login) {
                showChangePasswordScreen();
            } else {
                showMainScreen();
            }
        } else {
            showError('login-error', data.error);
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showError('login-error', 'حدث خطأ في الاتصال بالخادم');
    } finally {
        hideLoading();
    }
}

// معالجة تغيير كلمة المرور
async function handleChangePassword(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const passwordData = {
        current_password: formData.get('current_password'),
        new_password: formData.get('new_password'),
        confirm_password: formData.get('confirm_password')
    };
    
    try {
        showLoading();
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(passwordData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser.first_login = false;
            showMainScreen();
        } else {
            showError('change-password-error', data.error);
        }
    } catch (error) {
        console.error('خطأ في تغيير كلمة المرور:', error);
        showError('change-password-error', 'حدث خطأ في الاتصال بالخادم');
    } finally {
        hideLoading();
    }
}

// معالجة تسجيل الخروج
async function handleLogout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        showLoginScreen();
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
    }
}

// تبديل التبويبات
function switchTab(tabName) {
    // إزالة الفئة النشطة من جميع التبويبات
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // إضافة الفئة النشطة للتبويب المحدد
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab-content`).classList.add('active');
    
    // تحميل البيانات حسب التبويب
    switch(tabName) {
        case 'members':
            loadMembers();
            break;
        case 'points':
            loadPointsData();
            break;
        case 'logs':
            loadLogs();
            break;
        case 'users':
            loadUsers();
            break;
    }
}

// إعداد التبويبات حسب الصلاحيات
function setupTabsBasedOnRole() {
    const pointsTab = document.getElementById('points-tab');
    const logsTab = document.getElementById('logs-tab');
    const usersTab = document.getElementById('users-tab');
    
    if (currentUser.role === 'visor') {
        // المراقب يمكنه فقط الاطلاع
        pointsTab.style.display = 'none';
        logsTab.style.display = 'none';
        usersTab.style.display = 'none';
    } else if (currentUser.role === 'co_leader') {
        // القائد المساعد يمكنه إدارة النقاط
        pointsTab.style.display = 'block';
        logsTab.style.display = 'none';
        usersTab.style.display = 'none';
    } else if (currentUser.role === 'leader') {
        // القائد يمكنه الوصول لكل شيء
        pointsTab.style.display = 'block';
        logsTab.style.display = 'block';
        usersTab.style.display = 'block';
    }
}

// تحميل البيانات الأولية
async function loadInitialData() {
    try {
        // تحميل فئات النقاط
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            positiveCategories = categoriesData.positive_categories;
            negativeCategories = categoriesData.negative_categories;
        }
        
        // تحميل الأعضاء
        loadMembers();
        
    } catch (error) {
        console.error('خطأ في تحميل البيانات الأولية:', error);
    }
}

// تحميل الأعضاء
async function loadMembers() {
    try {
        showLoading();
        
        const period = document.getElementById('period-filter').value;
        let url = `/api/members?period=${period}`;
        
        if (period === 'custom') {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            if (startDate && endDate) {
                url += `&start_date=${startDate}&end_date=${endDate}`;
            }
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            currentMembers = data.members;
            displayMembers(currentMembers);
        } else {
            console.error('خطأ في تحميل الأعضاء:', data.error);
        }
    } catch (error) {
        console.error('خطأ في تحميل الأعضاء:', error);
    } finally {
        hideLoading();
    }
}

// عرض الأعضاء
function displayMembers(members) {
    const membersList = document.getElementById('members-list');
    
    if (members.length === 0) {
        membersList.innerHTML = '<p class="no-data">لا توجد أعضاء لعرضها</p>';
        return;
    }
    
    membersList.innerHTML = members.map(member => `
        <div class="member-card">
            <div class="member-header">
                <h4 class="member-name">${member.name}</h4>
            </div>
            <div class="member-stats">
                <div class="stat-item">
                    <span class="stat-label">الإيجابيات</span>
                    <span class="stat-value positive">${member.positive_count}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">السلبيات</span>
                    <span class="stat-value negative">${member.negative_count}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">المجموع</span>
                    <span class="stat-value ${member.total_points >= 0 ? 'positive' : 'negative'}">${member.total_points}</span>
                </div>
            </div>
            <div class="member-actions">
                <button class="btn btn-secondary" onclick="showMemberDetails(${member.id})">التفاصيل</button>
            </div>
        </div>
    `).join('');
}

// عرض تفاصيل العضو
async function showMemberDetails(memberId) {
    try {
        showLoading();
        
        const response = await fetch(`/api/members/${memberId}`);
        const data = await response.json();
        
        if (response.ok) {
            displayMemberDetailsModal(data);
        } else {
            console.error('خطأ في تحميل تفاصيل العضو:', data.error);
        }
    } catch (error) {
        console.error('خطأ في تحميل تفاصيل العضو:', error);
    } finally {
        hideLoading();
    }
}

// عرض نافذة تفاصيل العضو
function displayMemberDetailsModal(data) {
    const modal = document.getElementById('member-details-modal');
    const { member, statistics, negative_notes } = data;
    
    // تحديث العنوان
    document.getElementById('member-details-name').textContent = member.name;
    
    // تحديث الإحصائيات
    document.getElementById('total-positive').textContent = statistics.total_positive;
    document.getElementById('total-negative').textContent = statistics.total_negative;
    document.getElementById('current-week-positive').textContent = statistics.current_week_positive;
    document.getElementById('current-week-negative').textContent = statistics.current_week_negative;
    document.getElementById('previous-week-positive').textContent = statistics.previous_week_positive;
    document.getElementById('previous-week-negative').textContent = statistics.previous_week_negative;
    
    // تحديث تقييم الأداء
    const performanceStatus = document.getElementById('performance-status');
    performanceStatus.textContent = statistics.performance;
    performanceStatus.className = `performance-badge ${getPerformanceClass(statistics.performance)}`;
    
    // تحديث الملاحظات السلبية
    const notesList = document.getElementById('negative-notes-list');
    if (negative_notes.length === 0) {
        notesList.innerHTML = '<p class="no-data">لا توجد ملاحظات سلبية</p>';
    } else {
        notesList.innerHTML = negative_notes.map(note => `
            <div class="note-item">
                <div class="note-category">${note.category}</div>
                ${note.description ? `<div class="note-description">${note.description}</div>` : ''}
                <div class="note-date">${formatDate(note.created_at)}</div>
            </div>
        `).join('');
    }
    
    // إعداد أزرار الإجراءات
    const editBtn = document.getElementById('edit-member-btn');
    const deleteBtn = document.getElementById('delete-member-btn');
    
    if (currentUser.role === 'visor') {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    } else if (currentUser.role === 'co_leader') {
        editBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'none';
    } else {
        editBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'inline-block';
    }
    
    // حفظ معرف العضو للاستخدام في الإجراءات
    modal.dataset.memberId = member.id;
    
    // عرض النافذة
    modal.classList.add('active');
}

// معالجة تغيير فلتر الفترة
function handlePeriodChange() {
    const period = document.getElementById('period-filter').value;
    const customDates = document.getElementById('custom-dates');
    
    if (period === 'custom') {
        customDates.style.display = 'flex';
    } else {
        customDates.style.display = 'none';
        loadMembers();
    }
}

// تطبيق الفلتر المخصص
function applyCustomFilter() {
    loadMembers();
}

// عرض نموذج إضافة عضو
function showAddMemberForm() {
    const name = prompt('أدخل اسم العضو الجديد:');
    if (name && name.trim()) {
        addMember(name.trim());
    }
}

// إضافة عضو جديد
async function addMember(name) {
    try {
        showLoading();
        
        const response = await fetch('/api/members', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            loadMembers();
            alert('تم إضافة العضو بنجاح');
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('خطأ في إضافة العضو:', error);
        alert('حدث خطأ في إضافة العضو');
    } finally {
        hideLoading();
    }
}

// تحميل بيانات النقاط
async function loadPointsData() {
    try {
        // تحميل قائمة الأعضاء للنموذج
        const membersResponse = await fetch('/api/members?period=all');
        if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            populateMembersSelect(membersData.members);
        }
        
        // تحميل النقاط الحديثة
        loadRecentPoints();
        
    } catch (error) {
        console.error('خطأ في تحميل بيانات النقاط:', error);
    }
}

// ملء قائمة الأعضاء في النموذج
function populateMembersSelect(members) {
    const select = document.getElementById('point-member');
    select.innerHTML = '<option value="">اختر العضو</option>';
    
    members.forEach(member => {
        select.innerHTML += `<option value="${member.id}">${member.name}</option>`;
    });
}

// تحديث فئات النقاط حسب النوع
function updatePointCategories() {
    const pointType = document.getElementById('point-type').value;
    const categorySelect = document.getElementById('point-category');
    
    categorySelect.innerHTML = '<option value="">اختر الفئة</option>';
    
    if (pointType === 'positive') {
        Object.entries(positiveCategories).forEach(([key, value]) => {
            categorySelect.innerHTML += `<option value="${value}">${value}</option>`;
        });
    } else if (pointType === 'negative') {
        Object.entries(negativeCategories).forEach(([key, value]) => {
            categorySelect.innerHTML += `<option value="${value}">${value}</option>`;
        });
    }
}

// معالجة إضافة نقطة
async function handleAddPoint(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const pointData = {
        member_id: parseInt(formData.get('member_id')),
        point_type: formData.get('point_type'),
        category: formData.get('category'),
        description: formData.get('description')
    };
    
    try {
        showLoading();
        
        const response = await fetch('/api/points', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pointData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // إعادة تعيين النموذج
            event.target.reset();
            document.getElementById('point-category').innerHTML = '<option value="">اختر الفئة</option>';
            
            // تحديث القوائم
            loadRecentPoints();
            
            alert('تم إضافة النقطة بنجاح');
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('خطأ في إضافة النقطة:', error);
        alert('حدث خطأ في إضافة النقطة');
    } finally {
        hideLoading();
    }
}

// تحميل النقاط الحديثة
async function loadRecentPoints() {
    try {
        const response = await fetch('/api/points?per_page=10');
        const data = await response.json();
        
        if (response.ok) {
            displayRecentPoints(data.points);
        }
    } catch (error) {
        console.error('خطأ في تحميل النقاط الحديثة:', error);
    }
}

// عرض النقاط الحديثة
function displayRecentPoints(points) {
    const pointsList = document.getElementById('recent-points');
    
    if (points.length === 0) {
        pointsList.innerHTML = '<p class="no-data">لا توجد نقاط لعرضها</p>';
        return;
    }
    
    pointsList.innerHTML = points.map(point => `
        <div class="point-item">
            <div class="point-info">
                <div class="point-member">${point.member_name}</div>
                <div class="point-category">${point.category}</div>
                ${point.description ? `<div class="point-description">${point.description}</div>` : ''}
            </div>
            <div class="point-actions">
                <span class="point-type ${point.point_type}">${point.point_type === 'positive' ? 'إيجابية' : 'سلبية'}</span>
                ${currentUser.role !== 'visor' ? `
                    <button class="btn btn-secondary btn-sm" onclick="editPoint(${point.id})">تعديل</button>
                    <button class="btn btn-danger btn-sm" onclick="deletePoint(${point.id})">حذف</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// تحميل السجلات
async function loadLogs() {
    try {
        showLoading();
        
        const response = await fetch('/api/logs');
        const data = await response.json();
        
        if (response.ok) {
            displayLogs(data.logs);
        }
    } catch (error) {
        console.error('خطأ في تحميل السجلات:', error);
    } finally {
        hideLoading();
    }
}

// عرض السجلات
function displayLogs(logs) {
    const logsList = document.getElementById('logs-list');
    
    if (logs.length === 0) {
        logsList.innerHTML = '<p class="no-data">لا توجد سجلات لعرضها</p>';
        return;
    }
    
    logsList.innerHTML = logs.map(log => `
        <div class="log-item">
            <div class="log-header">
                <span class="log-action ${log.action_type}">${getActionDisplayName(log.action_type)}</span>
                <span class="log-date">${formatDate(log.created_at)}</span>
            </div>
            <div class="log-details">${log.details}</div>
            <div class="log-user">بواسطة: ${log.creator_name}</div>
        </div>
    `).join('');
}

// تحميل المستخدمين
async function loadUsers() {
    try {
        showLoading();
        
        const response = await fetch('/api/users');
        const data = await response.json();
        
        if (response.ok) {
            displayUsers(data.users);
        }
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
    } finally {
        hideLoading();
    }
}

// عرض المستخدمين
function displayUsers(users) {
    const usersList = document.getElementById('users-list');
    
    if (users.length === 0) {
        usersList.innerHTML = '<p class="no-data">لا توجد مستخدمين لعرضهم</p>';
        return;
    }
    
    usersList.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="user-info">
                <h4>${user.username}</h4>
                <span class="user-role-badge ${user.role}">${getRoleDisplayName(user.role)}</span>
                ${user.first_login ? '<span class="first-login-badge">يحتاج تغيير كلمة المرور</span>' : ''}
            </div>
            <div class="user-actions">
                <button class="btn btn-secondary" onclick="editUser(${user.id})">تعديل</button>
                <button class="btn btn-warning" onclick="resetUserPassword(${user.id})">إعادة تعيين كلمة المرور</button>
                ${user.username !== 'Gon' ? `<button class="btn btn-danger" onclick="deleteUser(${user.id})">حذف</button>` : ''}
            </div>
        </div>
    `).join('');
}

// عرض نموذج إضافة مستخدم
function showAddUserForm() {
    const username = prompt('أدخل اسم المستخدم:');
    if (!username || !username.trim()) return;
    
    const role = prompt('أدخل الدور (leader/co_leader/visor):');
    if (!role || !['leader', 'co_leader', 'visor'].includes(role)) {
        alert('الدور غير صحيح');
        return;
    }
    
    addUser(username.trim(), role);
}

// إضافة مستخدم جديد
async function addUser(username, role) {
    try {
        showLoading();
        
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            loadUsers();
            alert('تم إضافة المستخدم بنجاح');
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('خطأ في إضافة المستخدم:', error);
        alert('حدث خطأ في إضافة المستخدم');
    } finally {
        hideLoading();
    }
}

// وظائف مساعدة
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function getRoleDisplayName(role) {
    const roleNames = {
        'leader': 'قائد الفريق',
        'co_leader': 'قائد مساعد',
        'visor': 'مراقب'
    };
    return roleNames[role] || role;
}

function getActionDisplayName(action) {
    const actionNames = {
        'create': 'إنشاء',
        'update': 'تحديث',
        'delete': 'حذف',
        'login': 'تسجيل دخول',
        'password_change': 'تغيير كلمة مرور'
    };
    return actionNames[action] || action;
}

function getPerformanceClass(performance) {
    const performanceClasses = {
        'متحسن': 'improved',
        'متراجع': 'declined',
        'ثابت': 'stable'
    };
    return performanceClasses[performance] || 'stable';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA') + ' ' + date.toLocaleTimeString('ar-SA');
}

// وظائف الإجراءات
function handleEditMember() {
    const modal = document.getElementById('member-details-modal');
    const memberId = modal.dataset.memberId;
    const currentName = document.getElementById('member-details-name').textContent;
    
    const newName = prompt('أدخل الاسم الجديد:', currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
        editMember(memberId, newName.trim());
    }
}

async function editMember(memberId, newName) {
    try {
        showLoading();
        
        const response = await fetch(`/api/members/${memberId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newName })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal();
            loadMembers();
            alert('تم تحديث بيانات العضو بنجاح');
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('خطأ في تحديث العضو:', error);
        alert('حدث خطأ في تحديث العضو');
    } finally {
        hideLoading();
    }
}

function handleDeleteMember() {
    const modal = document.getElementById('member-details-modal');
    const memberId = modal.dataset.memberId;
    const memberName = document.getElementById('member-details-name').textContent;
    
    if (confirm(`هل أنت متأكد من حذف العضو "${memberName}"؟`)) {
        deleteMember(memberId);
    }
}

async function deleteMember(memberId) {
    try {
        showLoading();
        
        const response = await fetch(`/api/members/${memberId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal();
            loadMembers();
            alert('تم حذف العضو بنجاح');
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('خطأ في حذف العضو:', error);
        alert('حدث خطأ في حذف العضو');
    } finally {
        hideLoading();
    }
}

