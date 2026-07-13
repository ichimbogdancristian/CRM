from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, AuditLog


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'username', 'first_name', 'last_name', 'phone_number', 'is_staff', 'is_superuser', 'is_active')
    ordering = ('email',)
    search_fields = ('email', 'username', 'first_name', 'last_name', 'phone_number')
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone_number', 'address', 'additional_info', 'pending_email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'is_staff', 'is_superuser'),
        }),
    )
    readonly_fields = ('date_joined',)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    model = AuditLog
    list_display = ('timestamp', 'actor', 'action', 'target_user', 'description', 'ip_address')
    list_filter = ('action', 'timestamp')
    search_fields = ('actor__email', 'target_user__email', 'description')
    readonly_fields = ('actor', 'action', 'description', 'timestamp', 'ip_address', 'target_user')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
