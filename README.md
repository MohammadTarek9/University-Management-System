# University Management System (UMS)

A comprehensive University Management System built using the MERN stack (MongoDB, Express.js, React, Node.js) with a modular architecture designed to streamline administrative and academic processes.


## Architecture

```
university-management-system/
├── backend/                 # Node.js/Express API Server
│   ├── config/             # Database and app configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Authentication and validation middleware
│   ├── models/            # MongoDB/Mongoose schemas
│   ├── routes/            # API route definitions
│   ├── utils/             # Helper functions and utilities
│   ├── modules/           # Feature modules
│   │   ├── facilities/    # Facilities management module
│   │   ├── curriculum/    # Curriculum management module
│   │   ├── staff/        # Staff management module
│   │   └── community/    # Community features module
│   ├── server.js         # Main server file
│   └── package.json      # Backend dependencies
├── frontend/              # React Application
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   │   ├── auth/    # Authentication components
│   │   │   └── common/  # Shared components
│   │   ├── context/     # React Context providers
│   │   ├── modules/     # Feature-specific components
│   │   │   ├── facilities/
│   │   │   ├── curriculum/
│   │   │   ├── staff/
│   │   │   └── community/
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service layer
│   │   ├── utils/       # Helper functions
│   │   ├── App.js       # Main App component
│   │   └── index.js     # React entry point
│   └── package.json     # Frontend dependencies
└── package.json         # Root package with scripts
```

## Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (v5 or higher)
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
   MONGODB_URI=mongodb://localhost:27017/university-management
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   PORT=5000
   CLIENT_URL=http://localhost:3000
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

4. **Start MongoDB**
   ```bash
   # If using MongoDB locally
   mongod
   
   # Or if using MongoDB service
   sudo service mongod start
   ```

5. **Run the application**
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
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/me         # Get current user profile
POST /api/auth/logout     # User logout
```

#### Module Routes (Coming Soon)
```
GET  /api/facilities/health      # Facilities module status
GET  /api/curriculum/health      # Curriculum module status  
GET  /api/staff/health          # Staff module status
GET  /api/community/health      # Community module status
```

## Development

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

### VS Code Tasks

The project includes VS Code tasks for easy development:

- **Start Development Servers** - Runs both frontend and backend
- **Start Backend Server** - Backend only
- **Start Frontend Server** - Frontend only

Access via: `Terminal > Run Task...` or `Ctrl+Shift+P > Tasks: Run Task`
