import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import LeaveRequestForm from '../pages/LeaveRequestForm';
import LeaveRequestHistory from '../pages/LeaveRequestHistory';

const LeaveRequests = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSubmitSuccess = () => {
    setActiveTab(1); // Switch to history tab
    setRefreshTrigger(prev => prev + 1); // Trigger refresh
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Leave Request Management
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Submit, track, and manage leave requests
        </Typography>

        <Typography variant="body1" color="text.secondary">
          {isAdmin
            ? 'Submit your own leave requests, view your leave history, and approve/reject pending requests from your team members.'
            : 'Submit leave requests, track your leave history, and monitor the status of your requests.'}
        </Typography>
      </Box>

      {/* Tabs Section */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'primary.light'
          }}
        >
          <Tab label="Submit Leave Request" />
          <Tab label="My Leave History" />
          {isAdmin && <Tab label="Pending Approvals" />}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Tab 0: Submit Leave Request */}
          {activeTab === 0 && (
            <LeaveRequestForm onSubmitSuccess={handleSubmitSuccess} />
          )}

          {/* Tab 1: My Leave History */}
          {activeTab === 1 && (
            <LeaveRequestHistory 
              isAdmin={false} 
              refreshTrigger={refreshTrigger}
            />
          )}

          {/* Tab 2: Pending Approvals (Admin Only) */}
          {activeTab === 2 && isAdmin && (
            <LeaveRequestHistory 
              isAdmin={true} 
              refreshTrigger={refreshTrigger}
            />
          )}
        </Box>
      </Paper>

      {/* Help Section */}
      <Box sx={{ p: 3, bgcolor: 'primary.light', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.contrastText' }}>
          How to Use
        </Typography>

        <Typography variant="body2" sx={{ color: 'primary.contrastText', mb: 2 }}>
          {isAdmin
            ? 'Use the "Submit Leave Request" tab to submit your own leave. View your leave history in the "My Leave History" tab. As an admin, use the "Pending Approvals" tab to approve or reject leave requests from team members.'
            : 'Use the "Submit Leave Request" tab to submit your leave request with dates and reason. View and track all your leave requests in the "My Leave History" tab. You can cancel pending or approved requests if needed.'}
        </Typography>

        <Typography variant="subtitle2" sx={{ color: 'primary.contrastText', fontWeight: 600, mb: 1 }}>
          Available Leave Types:
        </Typography>
        <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
          • Annual Leave • Sick Leave • Casual Leave • Maternity Leave • Paternity Leave • Unpaid Leave
        </Typography>
      </Box>
    </Container>
  );
};

export default LeaveRequests;