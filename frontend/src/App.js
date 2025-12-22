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
import ProtectedRoute from './components/auth/ProtectedRoute';
import ForgotPassword from './components/auth/ForgotPassword';
import FirstLoginPasswordChange from './components/auth/FirstLoginPasswordChange';
import MainLayout from './components/layout/MainLayout';
import MaintenanceDashboard from './components/Maintenance/MaintenanceDashboard';

// Pages
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';
import UserManagement from './pages/UserManagement';
import Facilities from './pages/Facilities';
import RoomManagement from './pages/RoomManagement';
import ProfilePage from './pages/ProfilePage';
import BookingManagement from './pages/BookingManagement';
import AdmissionsManagement from './pages/AdmissionsManagement';
import Curriculum from './pages/Curriculum';
import Staff from './pages/Staff';
import CourseCatalogManagement from './pages/CurriculumManagement';
import CourseRegistration from './pages/CourseRegistration';
import AdminEnrollmentRequests from './pages/AdminEnrollmentRequests';
import BrowseSubjects from './pages/BrowseSubjects';
import CourseMaterials from './pages/CourseMaterials';
import CourseGrading from './pages/CourseGrading';
import AssessmentManagement from './pages/AssessmentManagement';
import StaffDirectoryPage from './pages/staffDirectory';
import TAResponsibilitiesManagement from './pages/TAResponsibilitiesManagement';
import MyTAResponsibilities from './pages/MyTAResponsibilities';

// Leave Request Page
import LeaveRequests from './pages/LeaveRequests';

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
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
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
              <MainLayout>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/first-login-password-change"
                    element={<FirstLoginPasswordChange />}
                  />
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
                      <ProtectedRoute allowedRoles={['admin', 'staff', 'professor', 'student']}>
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
                    path="/facilities/bookings"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'staff', 'professor']}>
                        <BookingManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/facilities/admissions"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'staff']}>
                        <AdmissionsManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/facilities/maintenance-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <MaintenanceDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Curriculum Module Routes */}
                  <Route
                    path="/curriculum"
                    element={
                      <ProtectedRoute
                        allowedRoles={['admin', 'staff', 'professor', 'student']}
                      >
                        <Curriculum />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/curriculum/catalog"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'staff']}>
                        <CourseCatalogManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/curriculum/registration"
                    element={
                      <ProtectedRoute
                        allowedRoles={['admin', 'staff', 'professor', 'student']}
                      >
                        <CourseRegistration />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/curriculum/browse"
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <BrowseSubjects />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/curriculum/enrollment-requests"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminEnrollmentRequests />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/curriculum/materials"
                    element={
                      <ProtectedRoute
                        allowedRoles={['admin', 'staff', 'professor', 'student', 'ta']}
                      >
                        <CourseMaterials />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/curriculum/assessments"
                    element={
                      <ProtectedRoute
                        allowedRoles={['admin', 'staff', 'professor', 'student', 'ta']}
                      >
                        <AssessmentManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/curriculum/grading"
                    element={
                      <ProtectedRoute
                        allowedRoles={['admin', 'staff', 'professor', 'student', 'ta']}
                      >
                        <CourseGrading />
                      </ProtectedRoute>
                    }
                  />

              

                  {/* Staff Module Routes */}
                  <Route
                    path="/staff"
                    element={
                      <ProtectedRoute
                        allowedRoles={['admin', 'staff', 'professor', 'ta']}
                      >
                        <Staff />
                      </ProtectedRoute>
                    }
                  />

                  {/* Leave Requests Routes */}
                  <Route
                    path="/staff/leave-requests"
                    element={
                      <ProtectedRoute
                        allowedRoles={['admin', 'staff', 'professor', 'ta']}
                      >
                        <LeaveRequests />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/staff/directory"
                    element={
                      <ProtectedRoute
                        allowedRoles={['admin', 'staff', 'professor', 'ta']}
                      >
                        <StaffDirectoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/staff/ta-responsibilities"
                    element={
                      <ProtectedRoute allowedRoles={['professor']}>
                        <TAResponsibilitiesManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/staff/my-responsibilities"
                    element={
                      <ProtectedRoute>
                        <MyTAResponsibilities />
                      </ProtectedRoute>
                    }
                  />

                  {/* Community placeholder */}
                  <Route
                    path="/community/*"
                    element={
                      <ProtectedRoute>
                        <div>Community Module - Coming Soon</div>
                      </ProtectedRoute>
                    }
                  />

                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  {/* Default redirects */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </MainLayout>
            </Box>

            <Footer />
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
