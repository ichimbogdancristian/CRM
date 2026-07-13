# CRM - Customer Relationship Management System

A full-stack CRM application with email-based authentication, role-based access control, user management, and admin dashboard.

## 🎯 Features

### Authentication & Security
- Email/password authentication with JWT tokens in httpOnly cookies
- CSRF protection for state-changing requests
- Access/refresh token rotation with automatic token blacklisting
- Password recovery via email with time-limited tokens
- Email verification for account changes
- Three-tier role system: Superuser, Staff, Client

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

## 🧪 Testing the System

### 1. Login
- Visit `http://localhost:5173/login`
- Use the superuser credentials created during setup
- Click Login to access the dashboard

### 2. User Invitations
- Navigate to Users tab on Profile page
- Fill the invite form with new user email
- Check backend console for invite link
- Use the link to complete the invitation

### 3. Role Permissions
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

## 🤝 Contributing

1. Create a new branch for features
2. Follow existing code style
3. Test thoroughly before committing
4. Write clear commit messages

## 📄 License

This project is proprietary and for internal use only.

## 👥 Support

For issues or questions, contact the development team.
