# University Management System (UMS)

A comprehensive University Management System built with React (frontend) and Node.js/Express (backend) using MySQL database with Entity-Attribute-Value (EAV) architecture for flexible data modeling. The system streamlines administrative, academic, and community processes for students, faculty, staff, and parents.

## Tech Stack

- **Frontend**: React 18, Material-UI (MUI), React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: MySQL with EAV (Entity-Attribute-Value) architecture
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet.js, bcrypt, express-rate-limit

## Architecture

```
university-management-system/
├── backend/                 # Node.js/Express API Server
│   ├── config/             # Database and app configuration
│   ├── controllers/        # Request handlers (auth, user, messages, etc.)
│   ├── middleware/         # Authentication, validation, rate limiting
│   ├── models/             # MongoDB models (legacy - being migrated)
│   ├── repositories/       # Data access layer for MySQL
│   ├── routes/             # API route definitions
│   ├── utils/              # Helper utilities and EAV functions
│   ├── scripts/            # Migration and diagnostic scripts
│   ├── sql_scripts/        # Database schema and migration scripts
│   ├── db/                 # MySQL connection pool
│   ├── modules/            # Feature modules
│   │   ├── facilities/     # Admissions & room management
│   │   ├── curriculum/     # Course and curriculum management
│   │   ├── staff/          # Staff management and payroll
│   │   └── community/      # Messaging and community features
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # React Application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── auth/     # Login, Register, ProtectedRoute
│   │   │   └── common/   # Shared UI components
│   │   ├── context/      # AuthContext for user management
│   │   ├── pages/        # Application pages
│   │   │   ├── Dashboard.js              # Main dashboard
│   │   │   ├── AdmissionsManagement.js   # Admissions processing
│   │   │   ├── UserManagement.js         # User administration
│   │   │   ├── CourseRegistration.js     # Student enrollment
│   │   │   ├── CurriculumManagement.js   # Course management
│   │   │   ├── CourseMaterials.js        # Course materials
│   │   │   ├── CourseGrading.js          # Grade management
│   │   │   ├── ParentMessaging.js        # Parent-teacher messaging
│   │   │   ├── TeacherInbox.js           # Teacher message inbox
│   │   │   ├── Community.js              # Community hub
│   │   │   ├── ResearchManagement.js     # Research projects
│   │   │   ├── PerformanceManagement.js  # Staff performance
│   │   │   ├── ProfessionalDevelopment.js # Training activities
│   │   │   ├── StaffPayrollPage.js       # Payroll management
│   │   │   └── ... (and more)
│   │   ├── services/     # API integration services
│   │   ├── utils/        # Helper functions and constants
│   │   ├── App.js        # Main App component with routing
│   │   └── index.js      # React entry point
│   └── package.json      # Frontend dependencies
└── package.json          # Root package with scripts
```


## Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **MySQL** (v5.7 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd university-management-system
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install all project dependencies (frontend + backend)
   npm run install-all
   ```

3. **Environment Configuration**

   **Backend (.env)**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Update the following variables in `backend/.env`:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   CLIENT_URL=http://localhost:3000
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   
   # MySQL Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_mysql_username
   DB_PASS=your_mysql_password
   DB_NAME=university_management
   
   # MongoDB (Legacy - Optional)
   MONGODB_URI=mongodb://localhost:27017/university-management
   
   # File Upload Configuration
   MAX_FILE_SIZE=10000000
   FILE_UPLOAD_PATH=./uploads
   ```

   **Frontend (.env)**
   ```bash
   cd frontend
   ```
   Create `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_APP_NAME=University Management System
   ```

4. **Run the application**
   ```bash
   # Start both frontend and backend servers
   npm run dev
   
   # Or start them individually:
   npm run server    # Backend only (port 5000)
   npm run client    # Frontend only (port 3000)
   ```

### API Endpoints

#### Authentication Routes
```
POST /api/auth/register          # User registration with role-based access
POST /api/auth/login            # User login with JWT tokens
GET  /api/auth/me               # Get current user profile
POST /api/auth/logout           # User logout
PUT  /api/auth/change-password  # Change user password
```

#### User Management
```
GET    /api/users               # List all users (admin only)
POST   /api/users               # Create new user (admin only)
GET    /api/users/:id           # Get user details
PUT    /api/users/:id           # Update user
DELETE /api/users/:id           # Delete user
GET    /api/users/parents/list  # Get all parent users
```

#### Profile Management
```
GET  /api/profile              # Get current user profile
PUT  /api/profile              # Update profile
POST /api/profile/avatar       # Upload profile picture
```

#### Admissions Management
```
GET    /api/facilities/applications        # List applications (filtered/paginated)
POST   /api/facilities/applications        # Create new application
GET    /api/facilities/applications/:id    # Get application details
PUT    /api/facilities/applications/:id    # Update application
PUT    /api/facilities/applications/:id/status  # Update application status
POST   /api/facilities/applications/:id/create-account  # Generate student credentials
GET    /api/facilities/applications/stats  # Application statistics
```

#### Course & Curriculum Management
```
GET    /api/curriculum/courses            # List courses
POST   /api/curriculum/courses            # Create course (EAV)
GET    /api/curriculum/courses/:id        # Get course details
PUT    /api/curriculum/courses/:id        # Update course
DELETE /api/curriculum/courses/:id        # Delete course
GET    /api/curriculum/subjects           # List subjects (EAV)
POST   /api/curriculum/subjects           # Create subject
```

#### Enrollment Management
```
GET    /api/enrollments                  # Get user enrollments
POST   /api/enrollments                  # Request enrollment
GET    /api/enrollments/requests         # Get pending requests (admin)
PUT    /api/enrollments/:id/status       # Approve/reject enrollment
GET    /api/enrollments/course/:courseId # Get course enrollments
```

#### Course Materials
```
GET    /api/materials/course/:courseId   # Get course materials
POST   /api/materials                    # Upload material
GET    /api/materials/:id                # Get material details
DELETE /api/materials/:id                # Delete material
```

#### Parent-Teacher Messaging
```
GET    /api/community/messages/sent      # Get parent's messages (includes replies)
POST   /api/community/messages           # Send message to teacher
GET    /api/community/messages/received  # Get teacher's received messages
POST   /api/community/messages/:id/reply # Reply to message (teacher only)
PUT    /api/community/messages/:id/read  # Mark message as read
GET    /api/community/messages/unread/count # Get unread count
GET    /api/community/children           # Get parent's children
GET    /api/community/student-teachers/:studentId # Get student's teachers
```

#### Research Management
```
GET    /api/community/research           # List research projects
POST   /api/community/research           # Create research project
GET    /api/community/research/:id       # Get research details
PUT    /api/community/research/:id       # Update research
DELETE /api/community/research/:id       # Delete research
```

#### Staff Management
```
GET    /api/staff/leave-requests         # Get leave requests
POST   /api/staff/leave-requests         # Submit leave request
PUT    /api/staff/leave-requests/:id     # Update leave request status
GET    /api/staff/benefits               # Get staff benefits
GET    /api/staff/performance            # Get performance records
POST   /api/staff/performance            # Create performance record
GET    /api/staffPayroll                 # Get payroll information
```

#### Announcements
```
GET    /api/community/announcements      # List announcements
POST   /api/community/announcements      # Create announcement
GET    /api/community/announcements/:id  # Get announcement details
PUT    /api/community/announcements/:id  # Update announcement
DELETE /api/community/announcements/:id  # Delete announcement
```

### Available Scripts

**Root Level:**
- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start backend server only
- `npm run client` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run install-all` - Install dependencies for both frontend and backend

**Backend:**
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run backend tests

**Frontend:**
- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run frontend tests
- `npm run eject` - Eject from Create React App (one-way operation)
