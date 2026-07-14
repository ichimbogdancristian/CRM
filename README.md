# CRM - Customer Relationship Management System

A full-stack, production-ready CRM boilerplate with comprehensive security, email-based authentication, role-based access control, user management, and admin dashboard.

**Perfect for:** Enterprise applications, multi-tenant systems, internal tools, and SaaS platforms.

## 🎯 Features

### Authentication & Security
- **Email/password authentication** with JWT tokens in httpOnly cookies
- **CSRF protection** for state-changing requests
- **Brute force protection** - 5 failed attempts per IP = 15-minute lockout
- **Automatic inactivity logout** - Users logged out after 1 hour of inactivity
- **Invite expiration** - Invitations valid for 24 hours only
- **Access/refresh token rotation** with automatic token blacklisting
- **Password recovery** via email with time-limited tokens
- **Email verification** for account changes
- **Three-tier role system**: Superuser, Staff, Client
- **Input validation** and error handling on both frontend and backend

### User Management
- Admin-driven email invitations (no public self-registration)
- Hierarchical permission system with role-based access control
- Staff can manage client accounts
- Superusers can manage all users
- Clients can only edit their own profiles

### Admin Features
- Comprehensive audit logging for all admin actions
- Admin dashboard with analytics and statistics
- Recent activity logs with detailed action tracking
- User management interface with bulk operations
- Permission hierarchy enforcement

### User Profile
- Extended user profiles with contact information
- Phone number, address, and additional information fields
- Self-service profile updates
- Email change with verification flow
- Password management

## 📋 Tech Stack

### Backend
- **Framework**: Django 6.0 with Django REST Framework
- **Authentication**: djangorestframework-simplejwt with JWT
- **Database**: PostgreSQL
- **Server**: Gunicorn (production-ready)
- **Utilities**: django-environ for environment variables, django-cors-headers for CORS

### Frontend
- **Framework**: React 19 with Vite
- **Router**: React Router DOM
- **HTTP Client**: Axios with interceptors
- **State Management**: React Context API
- **Styling**: Plain CSS with light/dark theme support

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- PostgreSQL 12+

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment** (if using uv)
   ```bash
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file with your settings
   cp .env.example .env
   # Edit .env with your database and secret key
   ```

4. **Install dependencies**
   ```bash
   uv pip install -r requirements.txt
   # Or if using pip directly:
   pip install -r requirements.txt
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start development server**
   ```bash
   python manage.py runserver
   ```
   Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

## 📝 Environment Variables

### Backend (.env)
```
# Core
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_NAME=crm_db
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# CORS/CSRF
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# Frontend
FRONTEND_BASE_URL=http://localhost:5173

# Email
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@crm.local
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login/` - Login with email/password
- `POST /api/auth/logout/` - Logout and blacklist token
- `POST /api/auth/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user info

### Password & Email
- `POST /api/auth/request-password-reset/` - Request password reset
- `POST /api/auth/reset-password/` - Reset password with token
- `POST /api/auth/change-password/` - Change password (authenticated)
- `POST /api/auth/confirm-email-change/` - Confirm email change

### User Invitations
- `POST /api/auth/accept-invite/` - Accept invitation and set password

### User Management
- `GET /api/users/` - List users (staff+ only)
- `POST /api/users/invite/` - Invite new user (staff+ only)
- `PATCH /api/users/me/` - Update own profile
- `GET/PATCH /api/users/<id>/` - View/edit user (with permission checks)

### Dashboard
- `GET /api/dashboard/stats/` - Get analytics statistics (superuser only)
- `GET /api/dashboard/audit-logs/` - Get recent activity logs (staff+ only)

## 🔒 Security Features

### Brute Force Protection
- **Mechanism**: Tracks failed login attempts per email + IP address
- **Threshold**: 5 failed attempts within 15 minutes triggers lockout
- **Response**: Returns HTTP 429 (Too Many Requests)
- **Reset**: Counter resets after 15 minutes of no failed attempts
- **Storage**: Attempts logged in `LoginAttempt` model for auditing

### Session Management
- **Inactivity Timeout**: Automatic logout after 1 hour of no user activity
- **Activity Tracking**: Mouse, keyboard, scroll, touch, and click events reset timer
- **Frontend Detection**: Client-side inactivity tracking with server-side validation
- **Message**: Users see "Session expired due to inactivity" on re-login

### Invitation System
- **Validity Period**: Invitations expire exactly 24 hours after creation
- **One-time Use**: Invitations cannot be accepted twice
- **Auto-rejection**: Expired invitations return clear error messages
- **Role Assignment**: Admin selects user role (Client, Staff, Superuser) at invitation time

### Additional Security
- **Email Failures are Visible**: Email sending failures properly raise exceptions (no silent failures)
- **Token Validation**: All tokens validated for expiration and integrity
- **CSRF Protection**: Robust CSRF token extraction and validation
- **Role-based Access Control**: Prevents privilege escalation with strict permission checks

## 🧪 Testing the System

### 1. Login
- Visit `http://localhost:5173/login`
- Use the superuser credentials created during setup
- Click Login to access the dashboard

### 2. Test Brute Force Protection
- Attempt login 5 times with wrong password from same IP
- 6th attempt returns: "Too many failed login attempts"
- Wait 15 minutes or use different IP to reset counter

### 3. User Invitations
- Navigate to Users tab
- Select email and role (Client, Staff, or Superuser)
- Check backend console for invite link
- Accept invitation within 24 hours
- After 24 hours, invite becomes invalid

### 4. Test Inactivity Logout
- Login successfully
- Wait 60+ minutes without moving mouse/keyboard
- Automatic logout occurs
- Redirected to login with inactivity message

### 5. Role Permissions
- Superuser can: manage all users, create staff/superuser accounts, view analytics
- Staff can: manage client accounts, view limited analytics
- Client can: only edit own profile

### 4. Profile Management
- Edit name, phone, address, and additional info
- Change email (requires verification)
- View admin users table and recent activity (if staff/superuser)

### 5. Dashboard (Superuser Only)
- View user statistics
- See recent login activity
- Monitor user invitations
- Review admin action audit logs

## 📊 Project Structure

```
CRM/
├── backend/                  # Django backend
│   ├── accounts/            # User & auth app
│   │   ├── models.py        # CustomUser & AuditLog
│   │   ├── views.py         # API endpoints
│   │   ├── serializers.py   # Request/response validation
│   │   ├── authentication.py # JWT cookie auth
│   │   ├── permissions.py   # Role-based permissions
│   │   ├── audit.py         # Audit logging utilities
│   │   └── tokens.py        # Email token helpers
│   ├── backend/             # Django project config
│   │   ├── settings.py      # Configuration
│   │   ├── urls.py          # URL routing
│   │   └── wsgi.py          # WSGI config
│   ├── manage.py
│   └── .env                 # Environment variables
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── api/            # API client & functions
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React Context
│   │   ├── App.jsx         # Main router
│   │   └── main.jsx        # Entry point
│   ├── vite.config.js      # Vite configuration
│   └── package.json
│
├── .gitignore
└── README.md               # This file
```

## 🔒 Security Notes

### Production Deployment
Before deploying to production:

1. **Update settings.py**
   - Set `DEBUG = False`
   - Generate a new `SECRET_KEY`
   - Update `ALLOWED_HOSTS`

2. **HTTPS Configuration**
   - Set `JWT_COOKIE_SECURE = True`
   - Use HTTPS for all traffic
   - Set `CSRF_COOKIE_SECURE = True`

3. **Email Configuration**
   - Replace `EMAIL_BACKEND` with real SMTP settings
   - Set `DEFAULT_FROM_EMAIL` to a valid email

4. **Database**
   - Use a production PostgreSQL instance
   - Set secure passwords
   - Enable SSL connections

5. **Environment Variables**
   - Store `.env` in secure location (never in git)
   - Rotate `SECRET_KEY` regularly

## 🐛 Troubleshooting

### "Connection refused" to database
- Ensure PostgreSQL is running
- Check DATABASE_HOST and DATABASE_PORT in .env
- Verify database name and credentials

### "No module named 'rest_framework'"
- Run `uv pip install -r requirements.txt` in backend/
- Activate the virtual environment

### CORS errors
- Check CORS_ALLOWED_ORIGINS matches frontend URL
- Clear browser cache and restart servers

### Tokens not persisting
- Check browser DevTools → Application → Cookies
- Verify `access_token` and `refresh_token` cookies exist with HttpOnly flag
- Check CSRF token is being sent with requests

## 📚 API Documentation

Full API documentation is available via Django REST Framework's browsable API at:
- http://localhost:8000/api/

## 🎨 Customization Guide

### Adding Custom Fields to User Model
1. Edit `accounts/models.py` - Add new fields to `CustomUser`
2. Create migration: `python manage.py makemigrations`
3. Update serializers in `accounts/serializers.py`
4. Update frontend forms in `frontend/src/pages/`

### Changing Security Timeouts
In `backend/accounts/views.py`:
- **Inactivity timeout**: Change `one_hour_ago` to desired duration
- **Brute force threshold**: Change `failed_attempts >= 5` to new limit
- **Brute force window**: Modify `fifteen_minutes_ago` timedelta

In `frontend/src/context/AuthContext.jsx`:
- **Inactivity timeout**: Change `INACTIVITY_TIMEOUT = 60 * 60 * 1000`

### Invite Expiration
In `backend/accounts/serializers.py`:
- **Change to 7 days**: `timedelta(hours=24)` → `timedelta(days=7)`
- **Change to 1 hour**: `timedelta(hours=24)` → `timedelta(hours=1)`

### Email Configuration
1. Update `backend/.env`:
   ```
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   ```

## 🚀 Deployment

### Docker (Recommended)
Create `Dockerfile`:
```dockerfile
FROM python:3.11
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### Heroku
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:standard-0
git push heroku main
heroku run python manage.py migrate
heroku run python manage.py createsuperuser
```

### DigitalOcean / AWS / GCP
See deployment documentation in `DEPLOYMENT.md`

## 🤝 Contributing

This is a boilerplate project. Feel free to:
1. Fork and customize for your needs
2. Report issues or suggest improvements
3. Submit pull requests for enhancements

## 📄 License

MIT License - Feel free to use this boilerplate for commercial and private projects.

## 🙌 Credits

Built with Django, Django REST Framework, React, and Vite.

## 📞 Support

- Check troubleshooting section above
- Review Django documentation: https://docs.djangoproject.com/
- Review React documentation: https://react.dev/
