import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import { AccountCircle, Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../../services/api';

const StudentCredentialsPanel = ({ application, onAccountCreated }) => {
  const [credentialsDialog, setCredentialsDialog] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleGetCredentials = async () => {
    setLoading(true);
    setError('');
    console.log('Attempting to fetch credentials for application:', application._id);
    
    try {
      const response = await api.get(`/facilities/applications/${application._id}/credentials`);
      console.log('Credentials response:', response);
      setCredentials(response.data.data);
      setShowPassword(false); // Reset to hidden state
      setCredentialsDialog(true);
    } catch (error) {
      console.error('Credentials fetch error:', error);
      console.error('Error response:', error.response);
      
      if (error.code === 'ERR_NETWORK') {
        setError('Network error: Unable to connect to server. Please ensure the backend is running on port 5000.');
      } else if (error.response?.status === 404) {
        setError('Endpoint not found. Please check if the backend routes are properly configured.');
      } else if (error.response?.status === 401) {
        setError('Unauthorized access. Please ensure you have admin privileges.');
      } else if (error.response?.status === 403) {
        setError('Access forbidden. Admin role required to retrieve credentials.');
      } else {
        setError(error.response?.data?.message || `Failed to retrieve credentials: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    // Prepare data for user creation form
    const userData = {
      firstName: application.firstName,
      lastName: application.lastName,
      email: application.studentCredentials.universityEmail,
      studentId: application.studentCredentials.studentId,
      temporaryPassword: credentials?.temporaryPassword,
      role: 'student',
      // Additional data from application
      phoneNumber: application.phoneNumber || '',
      personalEmail: application.email // Keep original email as reference
    };

    // Store in localStorage for user management page
    localStorage.setItem('prePopulateUserData', JSON.stringify(userData));
    
    // Navigate to user management page
    window.location.href = '/admin/users?action=create';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (!application.studentCredentials?.studentId) {
    return null;
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AccountCircle sx={{ mr: 1, color: 'primary.main' }} />
          Student Account Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}



        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            icon={<AccountCircle />}
            label={`ID: ${application.studentCredentials.studentId}`}
            variant="outlined"
            onClick={() => copyToClipboard(application.studentCredentials.studentId)}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            icon={<Email />}
            label={`Email: ${application.studentCredentials.universityEmail}`}
            variant="outlined"
            onClick={() => copyToClipboard(application.studentCredentials.universityEmail)}
            sx={{ cursor: 'pointer' }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Generated on: {new Date(application.studentCredentials.credentialsGeneratedAt).toLocaleString()}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click "Get Temporary Password" first, then use "Create Student Account" to open the user creation form with pre-populated data.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={handleGetCredentials}
            disabled={loading}
            startIcon={<Lock />}
          >
            Get Temporary Password
          </Button>
          
          <Button
            variant="contained"
            onClick={handleCreateAccount}
            disabled={loading || !credentials}
          >
            Create Student Account
          </Button>
        </Box>

        {/* Credentials Display Dialog */}
        <Dialog 
          open={credentialsDialog} 
          onClose={() => {
            setCredentialsDialog(false);
            setShowPassword(false); // Reset password visibility when dialog closes
          }} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>Student Login Credentials</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Security Notice:</strong> Share these credentials securely with the student. The temporary password must be changed on first login.
              </Alert>
            </Box>
            
            {credentials && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Student ID"
                  value={credentials.studentId}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Button size="small" onClick={() => copyToClipboard(credentials.studentId)}>
                        Copy
                      </Button>
                    )
                  }}
                />
                
                <TextField
                  label="University Email"
                  value={credentials.universityEmail}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Button size="small" onClick={() => copyToClipboard(credentials.universityEmail)}>
                        Copy
                      </Button>
                    )
                  }}
                />
                
                <TextField
                  label="Temporary Password"
                  value={showPassword 
                    ? (credentials?.temporaryPassword || '') 
                    : '•'.repeat(credentials?.temporaryPassword?.length || 12)
                  }
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    style: { 
                      fontFamily: showPassword ? 'monospace' : 'monospace',
                      letterSpacing: showPassword ? 'normal' : '2px'
                    },
                    endAdornment: (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          onClick={() => {
                            console.log('Password visibility toggle clicked. Current state:', showPassword);
                            setShowPassword(!showPassword);
                          }}
                          startIcon={showPassword ? <VisibilityOff /> : <Visibility />}
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </Button>
                        <Button
                          size="small"
                          onClick={() => copyToClipboard(credentials.temporaryPassword)}
                        >
                          Copy
                        </Button>
                      </Box>
                    )
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setCredentialsDialog(false);
              setShowPassword(false);
            }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>


      </CardContent>
    </Card>
  );
};

export default StudentCredentialsPanel;