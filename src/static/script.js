let currentUser = null;
let currentMembers = [];
let currentPoints = [];
let positiveCategories = {};
let negativeCategories = {};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    checkLoginStatus();
}

function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    document.getElementById('period-filter').addEventListener('change', handlePeriodChange);
    document.getElementById('apply-filter').addEventListener('click', applyCustomFilter);
    
    document.getElementById('add-member-btn').addEventListener('click', showAddMemberModal);
    document.getElementById('add-user-btn').addEventListener('click', showAddUserModal);
    
    document.getElementById('add-point-form').addEventListener('submit', handleAddPoint);
    document.getElementById('point-type').addEventListener('change', updatePointCategories);
    
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    document.getElementById('edit-member-btn').addEventListener('click', handleEditMember);
    document.getElementById('delete-member-btn').addEventListener('click', handleDeleteMember);
    
    document.getElementById('add-member-form').addEventListener('submit', handleAddMember);
    document.getElementById('add-user-form').addEventListener('submit', handleAddUser);
    document.getElementById('edit-member-form').addEventListener('submit', handleEditMemberSubmit);
    
    document.getElementById('notification-close').addEventListener('click', hideNotification);
    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

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

function showLoginScreen() {
    hideAllScreens();
    document.getElementById('login-screen').classList.add('active');
}

function showChangePasswordScreen() {
    hideAllScreens();
    document.getElementById('change-password-screen').classList.add('active');
}

function showMainScreen() {
    hideAllScreens();
    document.getElementById('main-screen').classList.add('active');
    
    document.getElementById('user-name').textContent = currentUser.username;
    document.getElementById('user-role').textContent = getRoleDisplayName(currentUser.role);
    
    setupTabsBasedOnRole();
    loadInitialData();
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

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

async function handleLogout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        showLoginScreen();
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab-content`).classList.add('active');
    
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

function setupTabsBasedOnRole() {
    const pointsTab = document.getElementById('points-tab');
    const logsTab = document.getElementById('logs-tab');
    const usersTab = document.getElementById('users-tab');
    
    if (currentUser.role === 'visor') {
        pointsTab.style.display = 'none';
        logsTab.style.display = 'none';
        usersTab.style.display = 'none';
    } else if (currentUser.role === 'co_leader') {
        pointsTab.style.display = 'block';
        logsTab.style.display = 'none';
        usersTab.style.display = 'none';
    } else if (currentUser.role === 'leader') {
        pointsTab.style.display = 'block';
        logsTab.style.display = 'block';
        usersTab.style.display = 'block';
    }
}

async function loadInitialData() {
    try {
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            positiveCategories = categoriesData.positive_categories;
            negativeCategories = categoriesData.negative_categories;
        }
        
        loadMembers();
        
    } catch (error) {
        console.error('خطأ في تحميل البيانات الأولية:', error);
    }
}

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

function displayMemberDetailsModal(data) {
    const modal = document.getElementById('member-details-modal');
    const { member, statistics, negative_notes } = data;
    
    document.getElementById('member-details-name').textContent = member.name;
    
    document.getElementById('total-positive').textContent = statistics.total_positive;
    document.getElementById('total-negative').textContent = statistics.total_negative;
    document.getElementById('current-week-positive').textContent = statistics.current_week_positive;
    document.getElementById('current-week-negative').textContent = statistics.current_week_negative;
    document.getElementById('previous-week-positive').textContent = statistics.previous_week_positive;
    document.getElementById('previous-week-negative').textContent = statistics.previous_week_negative;
    
    const performanceStatus = document.getElementById('performance-status');
    performanceStatus.textContent = statistics.performance;
    performanceStatus.className = `performance-badge ${getPerformanceClass(statistics.performance)}`;
    
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
    
    modal.dataset.memberId = member.id;
    modal.classList.add('active');
}

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

function applyCustomFilter() {
    loadMembers();
}

function showAddMemberModal() {
    document.getElementById('add-member-modal').classList.add('active');
    document.getElementById('member-name').focus();
}

function showAddUserModal() {
    document.getElementById('add-user-modal').classList.add('active');
    document.getElementById('user-username').focus();
}

async function handleAddMember(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const memberData = {
        name: formData.get('name')
    };
    
    try {
        showLoading();
        
        const response = await fetch('/api/members', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(memberData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal();
            loadMembers();
            showNotification('تم إضافة العضو بنجاح', 'success');
            event.target.reset();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('خطأ في إضافة العضو:', error);
        showNotification('حدث خطأ في إضافة العضو', 'error');
    } finally {
        hideLoading();
    }
}

async function handleAddUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        username: formData.get('username'),
        password: formData.get('password'),
        role: formData.get('role')
    };
    
    try {
        showLoading();
        
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal();
            loadUsers();
            showNotification('تم إضافة المستخدم بنجاح', 'success');
            event.target.reset();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('خطأ في إضافة المستخدم:', error);
        showNotification('حدث خطأ في إضافة المستخدم', 'error');
    } finally {
        hideLoading();
    }
}

function handleEditMember() {
    const modal = document.getElementById('member-details-modal');
    const memberId = modal.dataset.memberId;
    const memberName = document.getElementById('member-details-name').textContent;
    
    document.getElementById('edit-member-name').value = memberName;
    document.getElementById('edit-member-modal').classList.add('active');
    document.getElementById('edit-member-modal').dataset.memberId = memberId;
    
    // لا نقوم بإغلاق modal التفاصيل هنا
}

async function handleEditMemberSubmit(event) {
    event.preventDefault();
    
    const modal = document.getElementById('edit-member-modal');
    const memberId = modal.dataset.memberId;
    const formData = new FormData(event.target);
    const memberData = {
        name: formData.get('name')
    };
    
    try {
        showLoading();
        
        const response = await fetch(`/api/members/${memberId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(memberData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // إغلاق modal التعديل
            document.getElementById('edit-member-modal').classList.remove('active');
            // تحديث اسم العضو في modal التفاصيل
            document.getElementById('member-details-name').textContent = memberData.name;
            // إعادة تحميل قائمة الأعضاء
            loadMembers();
            showNotification('تم تحديث العضو بنجاح', 'success');
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('خطأ في تحديث العضو:', error);
        showNotification('حدث خطأ في تحديث العضو', 'error');
    } finally {
        hideLoading();
    }
}

async function handleDeleteMember() {
    const modal = document.getElementById('member-details-modal');
    const memberId = modal.dataset.memberId;
    const memberName = document.getElementById('member-details-name').textContent;
    
    if (!confirm(`هل أنت متأكد من حذف العضو "${memberName}"؟`)) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`/api/members/${memberId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal();
            loadMembers();
            showNotification('تم حذف العضو بنجاح', 'success');
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('خطأ في حذف العضو:', error);
        showNotification('حدث خطأ في حذف العضو', 'error');
    } finally {
        hideLoading();
    }
}

async function loadPointsData() {
    try {
        const membersResponse = await fetch('/api/members?period=all');
        if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            populateMembersSelect(membersData.members);
        }
        
        loadRecentPoints();
        
    } catch (error) {
        console.error('خطأ في تحميل بيانات النقاط:', error);
    }
}

function populateMembersSelect(members) {
    const select = document.getElementById('point-member');
    select.innerHTML = '<option value="">اختر العضو</option>';
    
    members.forEach(member => {
        select.innerHTML += `<option value="${member.id}">${member.name}</option>`;
    });
}

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
            event.target.reset();
            document.getElementById('point-category').innerHTML = '<option value="">اختر الفئة</option>';
            
            loadRecentPoints();
            showNotification('تم إضافة النقطة بنجاح', 'success');
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('خطأ في إضافة النقطة:', error);
        showNotification('حدث خطأ في إضافة النقطة', 'error');
    } finally {
        hideLoading();
    }
}

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
                <div class="point-date">${formatDate(point.created_at)}</div>
                <div class="point-creator">أضافها: ${point.creator_name || 'غير محدد'}</div>
            </div>
            <div class="point-actions">
                <span class="point-type ${point.point_type}">${point.point_type === 'positive' ? 'إيجابية' : 'سلبية'}</span>
                ${(currentUser.role === 'leader' || currentUser.role === 'co_leader') ? 
                    `<button class="btn btn-danger btn-sm" onclick="confirmDeletePoint(${point.id}, '${point.member_name}', '${point.category}')">حذف</button>` : ''}
            </div>
        </div>
    `).join('');
}

async function loadLogs() {
    try {
        showLoading();
        
        const actionFilter = document.getElementById('action-filter').value;
        const targetFilter = document.getElementById('target-filter').value;
        
        let url = '/api/logs?';
        if (actionFilter && actionFilter !== '') {
            url += `action_type=${actionFilter}&`;
        }
        if (targetFilter && targetFilter !== '') {
            url += `target_type=${targetFilter}&`;
        }
        
        const response = await fetch(url);
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

function displayLogs(logs) {
    const logsList = document.getElementById('logs-list');
    
    if (logs.length === 0) {
        logsList.innerHTML = '<p class="no-data">لا توجد سجلات لعرضها</p>';
        return;
    }
    
    logsList.innerHTML = logs.map(log => `
        <div class="log-item">
            <div class="log-header">
                <span class="log-action ${log.action}">${getActionDisplayName(log.action)}</span>
                <span class="log-date">${formatDate(log.created_at)}</span>
            </div>
            <div class="log-details">${log.details}</div>
        </div>
    `).join('');
}

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
            </div>
            <div class="user-actions">
                ${currentUser.role === 'leader' && user.id !== currentUser.id ? `
                    <button class="btn btn-secondary btn-sm" onclick="editUser(${user.id})">تعديل</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id}, '${user.username}')">حذف</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

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

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notification-message');
    
    messageElement.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    notification.classList.add('show');
    
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.remove('show');
    // إخفاء الإشعار بالكامل بعد انتهاء الانتقال
    setTimeout(() => {
        notification.style.display = 'none';
    }, 300);
}

function getRoleDisplayName(role) {
    const roles = {
        'leader': 'Leader Event',
        'co_leader': 'Co Leader Event',
        'visor': 'Visor'
    };
    return roles[role] || role;
}

function getActionDisplayName(action) {
    const actions = {
        'create': 'إنشاء',
        'update': 'تحديث',
        'delete': 'حذف',
        'login': 'تسجيل دخول'
    };
    return actions[action] || action;
}

function getPerformanceClass(performance) {
    const classes = {
        'محسن': 'improved',
        'مستقر': 'stable',
        'متراجع': 'declined'
    };
    return classes[performance] || 'stable';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}



// دالة تأكيد حذف النقطة
function confirmDeletePoint(pointId, memberName, category) {
    const confirmMessage = `هل أنت متأكد من حذف النقطة؟\n\nالعضو: ${memberName}\nالفئة: ${category}\n\nهذا الإجراء لا يمكن التراجع عنه.`;
    
    if (confirm(confirmMessage)) {
        deletePoint(pointId);
    }
}

// دالة حذف النقطة
async function deletePoint(pointId) {
    try {
        showLoading();
        
        const response = await fetch(`/api/points/${pointId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('تم حذف النقطة بنجاح', 'success');
            // إعادة تحميل النقاط الحديثة
            loadRecentPoints();
            // إعادة تحميل الأعضاء لتحديث النقاط
            loadMembers();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('خطأ في حذف النقطة:', error);
        showNotification('حدث خطأ في حذف النقطة', 'error');
    } finally {
        hideLoading();
    }
}

