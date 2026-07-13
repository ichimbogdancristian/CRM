from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.LoginView.as_view()),
    path('auth/logout/', views.LogoutView.as_view()),
    path('auth/refresh/', views.CookieTokenRefreshView.as_view()),
    path('auth/me/', views.MeView.as_view()),
    path('auth/request-password-reset/', views.RequestPasswordResetView.as_view()),
    path('auth/reset-password/', views.ResetPasswordView.as_view()),
    path('auth/accept-invite/', views.AcceptInviteView.as_view()),
    path('auth/confirm-email-change/', views.ConfirmEmailChangeView.as_view()),
    path('auth/change-password/', views.ChangePasswordView.as_view()),
    path('users/', views.UserListView.as_view()),
    path('users/invite/', views.InviteUserView.as_view()),
    path('users/me/', views.MyProfileUpdateView.as_view()),
    path('users/<int:pk>/', views.UserDetailView.as_view()),
    path('dashboard/stats/', views.DashboardStatsView.as_view()),
    path('dashboard/audit-logs/', views.AuditLogListView.as_view()),
]
