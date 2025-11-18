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
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const steps = ['Verify Identity', 'Reset Password', 'Success'];

const validationSchemaStep1 = yup.object({
  email: yup
    .string('Enter your email')
    .email('Enter a valid email')
    .required('Email is required'),
  securityAnswer: yup
    .string('Enter your security answer')
    .min(2, 'Security answer should be at least 2 characters')
    .required('Security answer is required'),
});

const validationSchemaStep2 = yup.object({
  newPassword: yup
    .string('Enter your new password')
    .min(6, 'Password should be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('New password is required'),
  confirmPassword: yup
    .string('Confirm your new password')
    .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const ForgotPassword = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const { loading, error, clearError, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const formikStep1 = useFormik({
    initialValues: {
      email: '',
      securityAnswer: '',
    },
    validationSchema: validationSchemaStep1,
    onSubmit: async (values) => {
      try {
        clearError();
        const response = await forgotPassword(values);
        
        // DEBUG: Check what's in the response
        console.log('Forgot Password Response:', response);
        
        // Make sure we're getting the token correctly
        if (response && response.data && response.data.resetToken) {
          setResetToken(response.data.resetToken);
          setActiveStep(1);
        } else {
          throw new Error('No reset token received from server');
        }
      } catch (error) {
        console.error('Forgot Password Error:', error);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
      }
    },
  });

  const formikStep2 = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: validationSchemaStep2,
    onSubmit: async (values) => {
      try {
        clearError();
        
        // DEBUG: Check the token before making the request
        console.log('Reset Token:', resetToken);
        console.log('New Password:', values.newPassword);
        
        if (!resetToken) {
          throw new Error('Reset token is missing');
        }
        
        await resetPassword(resetToken, values.newPassword);
        setActiveStep(2);
      } catch (error) {
        console.error('Reset Password Error:', error);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
      }
    },
  });

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Password Reset
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {showAlert && error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {activeStep === 0 && (
            <Box component="form" onSubmit={formikStep1.handleSubmit}>
              <Typography variant="h6" gutterBottom>
                Verify Your Identity
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please answer your security question: <strong>Who was your favorite teacher?</strong>
              </Typography>
              
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                type="email"
                value={formikStep1.values.email}
                onChange={formikStep1.handleChange}
                error={formikStep1.touched.email && Boolean(formikStep1.errors.email)}
                helperText={formikStep1.touched.email && formikStep1.errors.email}
                margin="normal"
                autoComplete="email"
                autoFocus
              />
              <TextField
                fullWidth
                id="securityAnswer"
                name="securityAnswer"
                label="Your Answer"
                value={formikStep1.values.securityAnswer}
                onChange={formikStep1.handleChange}
                error={formikStep1.touched.securityAnswer && Boolean(formikStep1.errors.securityAnswer)}
                helperText={formikStep1.touched.securityAnswer && formikStep1.errors.securityAnswer}
                margin="normal"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Verify Identity'}
              </Button>
              <Box textAlign="center">
                <Link component={RouterLink} to="/login" variant="body2">
                  Back to Login
                </Link>
              </Box>
            </Box>
          )}

          {activeStep === 1 && (
            <Box component="form" onSubmit={formikStep2.handleSubmit}>
              <Typography variant="h6" gutterBottom>
                Set New Password
              </Typography>
              {!resetToken && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Reset token is missing. Please go back and try again.
                </Alert>
              )}
              <TextField
                fullWidth
                id="newPassword"
                name="newPassword"
                label="New Password"
                type="password"
                value={formikStep2.values.newPassword}
                onChange={formikStep2.handleChange}
                error={formikStep2.touched.newPassword && Boolean(formikStep2.errors.newPassword)}
                helperText={formikStep2.touched.newPassword && formikStep2.errors.newPassword}
                margin="normal"
                autoFocus
              />
              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                value={formikStep2.values.confirmPassword}
                onChange={formikStep2.handleChange}
                error={formikStep2.touched.confirmPassword && Boolean(formikStep2.errors.confirmPassword)}
                helperText={formikStep2.touched.confirmPassword && formikStep2.errors.confirmPassword}
                margin="normal"
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || !resetToken}
                >
                  {loading ? <CircularProgress size={24} /> : 'Reset Password'}
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom color="success.main">
                Password Reset Successful!
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your password has been successfully reset. You can now login with your new password.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={handleLoginRedirect}
              >
                Go to Login
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;