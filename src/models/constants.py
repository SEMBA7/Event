# ثوابت النظام

# أدوار المستخدمين
USER_ROLES = {
    'LEADER': 'leader',
    'CO_LEADER': 'co_leader',
    'VISOR': 'visor'
}

# أنواع النقاط
POINT_TYPES = {
    'POSITIVE': 'positive',
    'NEGATIVE': 'negative'
}

# فئات النقاط الإيجابية
POSITIVE_CATEGORIES = {
    'CHAT_ACTIVITY': 'فعالية في الشات العام',
    'EVENT_ATTENDANCE': 'حضور فعالية',
    'EVENT_DESIGN': 'تصميم فعالية',
    'EVENT_IDEA': 'فكرة فعالية',
    'OTHER': 'أخرى'
}

# فئات النقاط السلبية
NEGATIVE_CATEGORIES = {
    'WEAK_INTERACTION': 'تفاعل ضعيف',
    'MISSED_MEETING': 'عدم حضور اجتماع',
    'DESIGN_SHORTCOMING': 'تقصير في التصميم',
    'INAPPROPRIATE_BEHAVIOR': 'سلوك غير لائق',
    'OTHER': 'أخرى'
}

# أنواع العمليات في السجل
LOG_ACTIONS = {
    'CREATE': 'create',
    'UPDATE': 'update',
    'DELETE': 'delete',
    'LOGIN': 'login',
    'PASSWORD_CHANGE': 'password_change'
}

# أنواع الأهداف في السجل
LOG_TARGETS = {
    'USER': 'user',
    'MEMBER': 'member',
    'POINT': 'point'
}

# المستخدم الرئيسي الافتراضي
DEFAULT_ADMIN = {
    'username': 'Gon',
    'password': '123',
    'role': USER_ROLES['LEADER']
}

