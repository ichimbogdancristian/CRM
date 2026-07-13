from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str, force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, AuditLog
from .tokens import make_email_change_token, read_email_change_token


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        user = authenticate(request=self.context.get('request'), username=email, password=password)
        if not user or not user.is_active:
            raise serializers.ValidationError('Invalid credentials')
        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'phone_number', 'address', 'additional_info', 'is_staff', 'is_superuser', 'is_active', 'date_joined')
        read_only_fields = ('id', 'date_joined')


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'phone_number', 'address', 'additional_info', 'email', 'is_staff', 'is_superuser', 'is_active')

    def to_representation(self, instance):
        return UserSerializer(instance).data


class InviteUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    is_staff = serializers.BooleanField(default=False, required=False)
    is_superuser = serializers.BooleanField(default=False, required=False)

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value


class AcceptInviteSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    first_name = serializers.CharField(max_length=150, required=True)
    last_name = serializers.CharField(max_length=150, required=True)
    phone_number = serializers.CharField(max_length=20, required=True)
    address = serializers.CharField(max_length=255, required=True)
    additional_info = serializers.CharField(max_length=500, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            user_id = force_str(urlsafe_base64_decode(attrs['uid']))
            user = CustomUser.objects.get(pk=user_id)
        except (TypeError, ValueError, CustomUser.DoesNotExist):
            raise serializers.ValidationError("Invalid user ID.")

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError("Invalid or expired token.")

        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")

        try:
            validate_password(attrs['password'], user)
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"password": e.detail})

        attrs['user'] = user
        return attrs


class RequestPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            user_id = force_str(urlsafe_base64_decode(attrs['uid']))
            user = CustomUser.objects.get(pk=user_id)
        except (TypeError, ValueError, CustomUser.DoesNotExist):
            raise serializers.ValidationError("Invalid user ID.")

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError("Invalid or expired token.")

        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")

        try:
            validate_password(attrs['password'], user)
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"password": e.detail})

        attrs['user'] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context['request'].user
        if not user.check_password(attrs['old_password']):
            raise serializers.ValidationError({"old_password": "Incorrect password."})

        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords do not match.")

        try:
            validate_password(attrs['new_password'], user)
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"new_password": e.detail})

        return attrs


class ConfirmEmailChangeSerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate_token(self, value):
        try:
            data = read_email_change_token(value)
        except Exception:
            raise serializers.ValidationError("Invalid or expired token.")
        return value

    def validate(self, attrs):
        try:
            data = read_email_change_token(attrs['token'])
            user = CustomUser.objects.get(pk=data['user_id'])
            if user.pending_email != data['new_email']:
                raise serializers.ValidationError("Email mismatch or token expired.")
            attrs['user'] = user
            attrs['new_email'] = data['new_email']
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Invalid token.")
        except Exception:
            raise serializers.ValidationError("Invalid or expired token.")
        return attrs


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.CharField(source='actor.email', read_only=True)
    target_user_email = serializers.CharField(source='target_user.email', read_only=True)

    class Meta:
        model = AuditLog
        fields = ('id', 'actor_email', 'target_user_email', 'action', 'description', 'timestamp', 'ip_address')
        read_only_fields = ('id', 'timestamp')


class DashboardStatsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    staff_users = serializers.IntegerField()
    superuser_count = serializers.IntegerField()
    recent_logins = serializers.IntegerField()
    recent_invites = serializers.IntegerField()
