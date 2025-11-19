import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Security, LockReset } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const FirstLoginPasswordChange = ({ open, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const steps = [
    'Verify Current Password',
    'Set New Password',
    'Security Question'
  ];

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateCurrentPassword = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNewPassword = () => {
    const newErrors = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSecurityQuestion = () => {
    const newErrors = {};
    
    if (!formData.securityQuestion) {
      newErrors.securityQuestion = 'Security question is required';
    } else if (formData.securityQuestion.length < 10) {
      newErrors.securityQuestion = 'Security question must be at least 10 characters';
    }

    if (!formData.securityAnswer) {
      newErrors.securityAnswer = 'Security answer is required';
    } else if (formData.securityAnswer.length < 3) {
      newErrors.securityAnswer = 'Security answer must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;
    
    switch (activeStep) {
      case 0:
        isValid = validateCurrentPassword();
        break;
      case 1:
        isValid = validateNewPassword();
        break;
      case 2:
        isValid = validateSecurityQuestion();
        break;
      default:
        break;
    }

    if (isValid) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateSecurityQuestion()) return;

    setLoading(true);
    setErrors({});

    try {
      await api.post('/auth/first-login-change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer
      });

      onSuccess();
    } catch (error) {
      setErrors({
        general: error.response?.data?.message || 'Failed to change password'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              Please enter your temporary password to proceed with setting up your account.
            </Typography>
            <TextField
              fullWidth
              label="Current Password"
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={handleInputChange('currentPassword')}
              error={!!errors.currentPassword}
              helperText={errors.currentPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('current')}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              Create a strong password that you'll remember. Your password must meet the security requirements.
            </Typography>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="New Password"
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleInputChange('newPassword')}
                error={!!errors.newPassword}
                helperText={errors.newPassword}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('new')}
                        edge="end"
                      >
                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('confirm')}
                        edge="end"
                      >
                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'info.dark' }}>
                Password Requirements:
              </Typography>
              <Typography variant="body2" color="info.dark">
                • At least 8 characters long<br />
                • Contains uppercase and lowercase letters<br />
                • Contains at least one number<br />
                • Different from your temporary password
              </Typography>
            </Paper>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              Set up a security question to help recover your account if needed. Choose something only you would know.
            </Typography>
            <TextField
              fullWidth
              label="Security Question"
              multiline
              rows={2}
              value={formData.securityQuestion}
              onChange={handleInputChange('securityQuestion')}
              error={!!errors.securityQuestion}
              helperText={errors.securityQuestion || "Example: What was the name of your first pet?"}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Security Answer"
              value={formData.securityAnswer}
              onChange={handleInputChange('securityAnswer')}
              error={!!errors.securityAnswer}
              helperText={errors.securityAnswer}
            />
            <Paper sx={{ p: 2, bgcolor: 'warning.light', mt: 2 }}>
              <Typography variant="body2" color="warning.dark">
                <strong>Important:</strong> Remember your security question and answer. You'll need them if you ever need to recover your account.
              </Typography>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <LockReset sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
          <Typography variant="h5" component="span">
            Complete Account Setup
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Welcome {user?.firstName}! Please set up your account security.
        </Typography>
      </DialogTitle>

      <DialogContent>
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.general}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={<Security />}
          >
            {loading ? 'Setting Up...' : 'Complete Setup'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FirstLoginPasswordChange;