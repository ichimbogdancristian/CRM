from rest_framework.permissions import BasePermission


def can_manage(actor, target):
    if actor.pk == target.pk:
        return True
    if actor.is_superuser:
        return True
    if actor.is_staff:
        return not target.is_staff and not target.is_superuser
    return False


class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_superuser
        )


class IsStaffOrSuperUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )


class CanManageTargetUser(BasePermission):
    def has_object_permission(self, request, view, obj):
        return can_manage(request.user, obj)
