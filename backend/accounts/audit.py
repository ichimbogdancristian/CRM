from .models import AuditLog
import logging

logger = logging.getLogger(__name__)


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_action(actor, action, description, target_user=None, request=None):
    try:
        ip_address = get_client_ip(request) if request else None
        AuditLog.objects.create(
            actor=actor,
            action=action,
            description=description,
            target_user=target_user,
            ip_address=ip_address,
        )
    except Exception as e:
        logger.error(f"Failed to log audit action: {e}")


def log_login(user, request):
    log_action(user, 'login', f'User {user.email} logged in', request=request)


def log_invite(actor, target_email, request):
    log_action(actor, 'invite', f'User {actor.email} invited {target_email}', request=request)


def log_user_update(actor, target_user, changes, request):
    log_action(
        actor,
        'update',
        f'User {actor.email} updated {target_user.email}: {changes}',
        target_user=target_user,
        request=request,
    )
