from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.JWT_ACCESS_COOKIE)
        if raw_token is None:
            return None
        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)
        self.enforce_csrf(request)
        return (user, validated_token)

    def enforce_csrf(self, request):
        if request.method in ('GET', 'HEAD', 'OPTIONS', 'TRACE'):
            return
        check = CsrfViewMiddleware(lambda r: None)
        reason = check.process_view(request, None, (), {})
        if reason:
            from rest_framework import exceptions
            raise exceptions.PermissionDenied(f'CSRF Failed: {reason}')
