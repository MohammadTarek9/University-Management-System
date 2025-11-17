import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const validationSchema = yup.object({
  firstName: yup
    .string('Enter your first name')
    .min(2, 'First name should be at least 2 characters')
    .max(50, 'First name should not exceed 50 characters')
    .required('First name is required'),
  lastName: yup
    .string('Enter your last name')
    .min(2, 'Last name should be at least 2 characters')
    .max(50, 'Last name should not exceed 50 characters')
    .required('Last name is required'),
  email: yup
    .string('Enter your email')
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string('Enter your password')
    .min(6, 'Password should be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string('Confirm your password')
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  role: yup
    .string('Select your role')
    .oneOf(['student', 'professor', 'staff', 'parent', 'ta'], 'Invalid role')
    .required('Role is required'),
  phoneNumber: yup
    .string('Enter your phone number')
    .matches(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number')
    .optional(),
});

const Register = () => {
  const [showAlert, setShowAlert] = useState(false);
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      studentId: '',
      employeeId: '',
      department: '',
      phoneNumber: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        clearError();
        const { confirmPassword, ...registerData } = values;
        
        // Remove empty fields
        Object.keys(registerData).forEach(key => {
          if (registerData[key] === '') {
            delete registerData[key];
          }
        });

        await register(registerData);
        navigate('/dashboard');
      } catch (error) {
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
      }
    },
  });

  // Show/hide ID fields based on role
  const showStudentId = ['student'].includes(formik.values.role);
  const showEmployeeId = ['professor', 'admin', 'staff', 'ta'].includes(formik.values.role);

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            University Management System
          </Typography>
          <Typography component="h2" variant="h5" align="center" sx={{ mb: 3 }}>
            Create Account
          </Typography>

          {showAlert && error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="firstName"
                  name="firstName"
                  label="First Name"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                  helperText={formik.touched.firstName && formik.errors.firstName}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="lastName"
                  name="lastName"
                  label="Last Name"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                  helperText={formik.touched.lastName && formik.errors.lastName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  autoComplete="email"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  autoComplete="new-password"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                  autoComplete="new-password"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={formik.values.role}
                    label="Role"
                    onChange={formik.handleChange}
                    error={formik.touched.role && Boolean(formik.errors.role)}
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="professor">Professor</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                    <MenuItem value="parent">Parent</MenuItem>
                    <MenuItem value="ta">Teaching Assistant</MenuItem>
                  </Select>
                  {formik.touched.role && formik.errors.role && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                      {formik.errors.role}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="phoneNumber"
                  name="phoneNumber"
                  label="Phone Number (Optional)"
                  value={formik.values.phoneNumber}
                  onChange={formik.handleChange}
                  error={formik.touched.phoneNumber && Boolean(formik.errors.phoneNumber)}
                  helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
                />
              </Grid>
              {showStudentId && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="studentId"
                    name="studentId"
                    label="Student ID"
                    value={formik.values.studentId}
                    onChange={formik.handleChange}
                  />
                </Grid>
              )}
              {showEmployeeId && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="employeeId"
                    name="employeeId"
                    label="Employee ID"
                    value={formik.values.employeeId}
                    onChange={formik.handleChange}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="department"
                  name="department"
                  label="Department (Optional)"
                  value={formik.values.department}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
            <Box textAlign="center">
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;