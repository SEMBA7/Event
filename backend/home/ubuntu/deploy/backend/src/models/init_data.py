from src.models.user import db, User, Log
from src.models.constants import DEFAULT_ADMIN, USER_ROLES, LOG_ACTIONS, LOG_TARGETS
from datetime import datetime

def init_default_data():
    """إنشاء البيانات الأولية للنظام"""
    
    # التحقق من وجود المستخدم الرئيسي
    admin_user = User.query.filter_by(username=DEFAULT_ADMIN['username']).first()
    
    if not admin_user:
        # إنشاء المستخدم الرئيسي
        admin_user = User(
            username=DEFAULT_ADMIN['username'],
            role=DEFAULT_ADMIN['role'],
            first_login=True,
            created_at=datetime.utcnow(),
            is_active=True
        )
        admin_user.set_password(DEFAULT_ADMIN['password'])
        
        db.session.add(admin_user)
        db.session.commit()
        
        # تسجيل عملية إنشاء المستخدم الرئيسي
        log_entry = Log(
            action_type=LOG_ACTIONS['CREATE'],
            target_type=LOG_TARGETS['USER'],
            target_id=admin_user.id,
            details=f'تم إنشاء المستخدم الرئيسي: {admin_user.username}',
            created_by=admin_user.id
        )
        db.session.add(log_entry)
        db.session.commit()
        
        print(f"تم إنشاء المستخدم الرئيسي: {admin_user.username}")
    else:
        print(f"المستخدم الرئيسي موجود بالفعل: {admin_user.username}")
    
    return admin_user

def create_sample_data():
    """إنشاء بيانات تجريبية للاختبار"""
    
    admin_user = User.query.filter_by(username=DEFAULT_ADMIN['username']).first()
    if not admin_user:
        admin_user = init_default_data()
    
    # إنشاء مستخدمين تجريبيين
    sample_users = [
        {'username': 'co_leader1', 'role': USER_ROLES['CO_LEADER']},
        {'username': 'visor1', 'role': USER_ROLES['VISOR']}
    ]
    
    for user_data in sample_users:
        existing_user = User.query.filter_by(username=user_data['username']).first()
        if not existing_user:
            new_user = User(
                username=user_data['username'],
                role=user_data['role'],
                first_login=True,
                created_by=admin_user.id,
                created_at=datetime.utcnow(),
                is_active=True
            )
            new_user.set_password('123')  # كلمة مرور مبدئية
            
            db.session.add(new_user)
            db.session.commit()
            
            # تسجيل عملية الإنشاء
            log_entry = Log(
                action_type=LOG_ACTIONS['CREATE'],
                target_type=LOG_TARGETS['USER'],
                target_id=new_user.id,
                details=f'تم إنشاء مستخدم جديد: {new_user.username} بدور {new_user.role}',
                created_by=admin_user.id
            )
            db.session.add(log_entry)
            
            print(f"تم إنشاء المستخدم: {new_user.username}")
    
    db.session.commit()
    print("تم إنشاء البيانات التجريبية بنجاح")

