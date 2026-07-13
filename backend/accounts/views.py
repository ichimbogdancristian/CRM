from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView, UpdateAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.core.mail import send_mail
from django.conf import settings
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.middleware.csrf import get_token
from django.utils import timezone
from .models import CustomUser, AuditLog
from .serializers import (
    LoginSerializer, UserSerializer, UserUpdateSerializer,
    InviteUserSerializer, AcceptInviteSerializer,
    RequestPasswordResetSerializer, ResetPasswordSerializer,
    ChangePasswordSerializer, ConfirmEmailChangeSerializer,
    AuditLogSerializer, DashboardStatsSerializer
)
from .permissions import IsStaffOrSuperUser, CanManageTargetUser
from .tokens import make_email_change_token
from .audit import log_login, log_invite, log_user_update
from django.db.models import Q, Count
from datetime import timedelta


def _set_jwt_cookies(response, access_token, refresh_token):
    response.set_cookie(
        key=settings.JWT_ACCESS_COOKIE,
        value=access_token,
        httponly=True,
        secure=settings.JWT_COOKIE_SECURE,
        samesite=settings.JWT_COOKIE_SAMESITE,
        path='/',
        max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
    )
    response.set_cookie(
        key=settings.JWT_REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=settings.JWT_COOKIE_SECURE,
        samesite=settings.JWT_COOKIE_SAMESITE,
        path='/',
        max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
    )


def _send_email(subject, message, email_to):
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email_to],
        fail_silently=True,
    )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        response = Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        _set_jwt_cookies(response, str(refresh.access_token), str(refresh))
        get_token(request)
        log_login(user, request)
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE)
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass

        response = Response({'detail': 'Logged out successfully'}, status=status.HTTP_200_OK)
        response.delete_cookie(settings.JWT_ACCESS_COOKIE, path='/')
        response.delete_cookie(settings.JWT_REFRESH_COOKIE, path='/')
        return response


class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE)
        if not refresh_token:
            return Response({'detail': 'No refresh token'}, status=status.HTTP_401_UNAUTHORIZED)
        request.data._mutable = True
        request.data['refresh'] = refresh_token
        request.data._mutable = False
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data['access']
            refresh_token_new = response.data.get('refresh', refresh_token)
            response.delete_cookie(settings.JWT_ACCESS_COOKIE, path='/')
            response.delete_cookie(settings.JWT_REFRESH_COOKIE, path='/')
            _set_jwt_cookies(response, access_token, refresh_token_new)
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestPasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        try:
            user = CustomUser.objects.get(email=email, is_active=True)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_BASE_URL}/reset-password?uid={uid}&token={token}"
            message = f"Reset your password by clicking the link below:\n\n{reset_link}"
            _send_email('Password Reset', message, email)
        except CustomUser.DoesNotExist:
            pass
        return Response({'detail': 'If that email exists, a reset link has been sent.'}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        user.set_password(serializer.validated_data['password'])
        user.save()
        return Response({'detail': 'Password reset successfully'}, status=status.HTTP_200_OK)


class AcceptInviteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AcceptInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        user.set_password(serializer.validated_data['password'])
        user.is_active = True
        user.save()
        return Response({'detail': 'Account activated successfully'}, status=status.HTTP_200_OK)


class ConfirmEmailChangeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConfirmEmailChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        user.email = serializer.validated_data['new_email']
        user.pending_email = None
        user.save()
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password changed successfully'}, status=status.HTTP_200_OK)


class UserListView(ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsStaffOrSuperUser]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return CustomUser.objects.all()
        if user.is_staff:
            return CustomUser.objects.filter(is_staff=False, is_superuser=False)
        return CustomUser.objects.none()


class InviteUserView(APIView):
    permission_classes = [IsAuthenticated, IsStaffOrSuperUser]

    def post(self, request):
        serializer = InviteUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        is_staff = serializer.validated_data.get('is_staff', False)
        if not request.user.is_superuser:
            is_staff = False

        user = CustomUser.objects.create_user(
            username=serializer.validated_data['email'],
            email=serializer.validated_data['email'],
            first_name=serializer.validated_data.get('first_name', ''),
            last_name=serializer.validated_data.get('last_name', ''),
            is_staff=is_staff,
            is_active=False,
        )
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        invite_link = f"{settings.FRONTEND_BASE_URL}/accept-invite?uid={uid}&token={token}"
        message = f"You have been invited to join. Click the link below to set your password and activate your account:\n\n{invite_link}"
        _send_email('Account Invitation', message, user.email)
        log_invite(request.user, user.email, request)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class MyProfileUpdateView(UpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        new_email = serializer.validated_data.get('email')
        if new_email and new_email != self.request.user.email:
            self.request.user.pending_email = new_email
            uid = urlsafe_base64_encode(force_bytes(self.request.user.pk))
            token = make_email_change_token(self.request.user.pk, new_email)
            confirm_link = f"{settings.FRONTEND_BASE_URL}/confirm-email-change?token={token}"
            message = f"Confirm your new email address by clicking the link below:\n\n{confirm_link}"
            _send_email('Confirm Email Change', message, new_email)
            serializer.save(is_staff=self.request.user.is_staff, is_superuser=self.request.user.is_superuser, is_active=self.request.user.is_active)
        else:
            serializer.save(email=self.request.user.email, is_staff=self.request.user.is_staff, is_superuser=self.request.user.is_superuser, is_active=self.request.user.is_active)


class UserDetailView(RetrieveUpdateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated, CanManageTargetUser]
    lookup_field = 'pk'

    def perform_update(self, serializer):
        target_user = self.get_object()
        actor = self.request.user
        data = serializer.validated_data.copy()

        if actor.pk == target_user.pk:
            data.pop('is_staff', None)
            data.pop('is_superuser', None)
        elif not actor.is_superuser:
            data.pop('is_staff', None)
            data.pop('is_superuser', None)

        email = data.get('email')
        if email and email != target_user.email:
            target_user.pending_email = email
            token = make_email_change_token(target_user.pk, email)
            confirm_link = f"{settings.FRONTEND_BASE_URL}/confirm-email-change?token={token}"
            message = f"Confirm your new email address by clicking the link below:\n\n{confirm_link}"
            _send_email('Confirm Email Change', message, email)
            data.pop('email', None)

        for field, value in data.items():
            setattr(target_user, field, value)
        target_user.save()


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsStaffOrSuperUser]

    def get(self, request):
        total_users = CustomUser.objects.count()
        active_users = CustomUser.objects.filter(is_active=True).count()
        staff_users = CustomUser.objects.filter(is_staff=True).count()
        superuser_count = CustomUser.objects.filter(is_superuser=True).count()

        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_logins = AuditLog.objects.filter(action='login', timestamp__gte=thirty_days_ago).count()
        recent_invites = AuditLog.objects.filter(action='invite', timestamp__gte=thirty_days_ago).count()

        data = {
            'total_users': total_users,
            'active_users': active_users,
            'staff_users': staff_users,
            'superuser_count': superuser_count,
            'recent_logins': recent_logins,
            'recent_invites': recent_invites,
        }
        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)


class AuditLogListView(ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsStaffOrSuperUser]
    pagination_class = None

    def get_queryset(self):
        return AuditLog.objects.all()[:100]
