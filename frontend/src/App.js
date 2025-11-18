import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';
import UserManagement from './pages/UserManagement';
import Facilities from './pages/Facilities';
import RoomManagement from './pages/RoomManagement';
import ProfilePage from './pages/ProfilePage';

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
            }}
          >
            <Header />
            
            <Box component="main" sx={{ flexGrow: 1 }}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                 {/* Profile route */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Admin routes */}
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                
                {/* Facilities Module Routes */}
                <Route
                  path="/facilities"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'staff', 'professor']}>
                      <Facilities />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/facilities/rooms"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'staff', 'professor']}>
                      <RoomManagement />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/curriculum/*"
                  element={
                    <ProtectedRoute>
                      <div>Curriculum Module - Coming Soon</div>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/staff/*"
                  element={
                    <ProtectedRoute>
                      <div>Staff Module - Coming Soon</div>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/community/*"
                  element={
                    <ProtectedRoute>
                      <div>Community Module - Coming Soon</div>
                    </ProtectedRoute>
                  }
                />
                
                {/* Default redirects */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Box>
            
            <Footer />
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;