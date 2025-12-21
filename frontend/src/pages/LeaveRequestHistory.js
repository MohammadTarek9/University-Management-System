import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
// FIX: Import icons individually
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BlockIcon from '@mui/icons-material/Block';
import { leaveRequestService } from '../services/leaveRequestService';
import { useAuth } from '../context/AuthContext';

const LeaveRequestHistory = ({ isAdmin = false, refreshTrigger }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [statusFilter, setStatusFilter] = useState('');
  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Fetch requests
  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter, refreshTrigger, isAdmin]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');

      let response;
      if (isAdmin) {
        response = await leaveRequestService.getPendingRequests({
          page,
          limit: pageSize,
          search: ''
        });
      } else {
        response = await leaveRequestService.getMyLeaveRequests({
          status: statusFilter,
          page,
          limit: pageSize
        });
      }

      setRequests(response.data?.requests || response.data?.leaves || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      cancelled: 'default'
    };
    return colorMap[status] || 'default';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon sx={{ mr: 1 }} />;
      case 'rejected':
        return <BlockIcon sx={{ mr: 1 }} />;
      case 'cancelled':
        return <CancelIcon sx={{ mr: 1 }} />;
      case 'pending':
        return <AccessTimeIcon sx={{ mr: 1 }} />;
      default:
        return null;
    }
  };

  const handleApprove = async (request) => {
    try {
      setLoading(true);
      await leaveRequestService.approveLeaveRequest(request.leave_request_id);
      setSuccess('Leave request approved successfully');
      fetchRequests();
    } catch (err) {
      setError(err.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectDialog(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      setRejectLoading(true);
      await leaveRequestService.rejectLeaveRequest(
        selectedRequest.leave_request_id,
        rejectionReason
      );
      setSuccess('Leave request rejected successfully');
      setRejectDialog(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      setError(err.message || 'Failed to reject request');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleCancel = async (request) => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      try {
        setLoading(true);
        await leaveRequestService.cancelLeaveRequest(request.leave_request_id);
        setSuccess('Leave request cancelled successfully');
        fetchRequests();
      } catch (err) {
        setError(err.message || 'Failed to cancel request');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && requests.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        {isAdmin ? 'Pending Leave Requests' : 'My Leave Requests'}
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      {!isAdmin && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                label="Status Filter"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )}

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              {isAdmin && <TableCell><strong>Employee</strong></TableCell>}
              <TableCell><strong>Leave Type</strong></TableCell>
              <TableCell><strong>Start Date</strong></TableCell>
              <TableCell><strong>End Date</strong></TableCell>
              <TableCell align="center"><strong>Days</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    {isAdmin ? 'No pending leave requests' : 'No leave requests found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              requests.map(request => (
                <TableRow key={request.leave_request_id} hover>
                  {isAdmin && (
                    <TableCell>
                      <Typography variant="body2">
                        {request.firstName && request.lastName
                          ? `${request.firstName} ${request.lastName}`
                          : 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.email || 'N/A'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>{request.type_name}</TableCell>
                  <TableCell>{formatDate(request.start_date)}</TableCell>
                  <TableCell>{formatDate(request.end_date)}</TableCell>
                  <TableCell align="center">
                    <Chip label={request.number_of_days} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getStatusIcon(request.status)}
                      <Chip
                        label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {isAdmin && request.status === 'pending' && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleApprove(request)}
                          disabled={loading}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleRejectClick(request)}
                          disabled={loading}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                    {!isAdmin && (request.status === 'pending' || request.status === 'approved') && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleCancel(request)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Rejection Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Leave Request</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Rejection Reason"
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejecting this request..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRejectSubmit}
            variant="contained"
            color="error"
            disabled={rejectLoading || !rejectionReason.trim()}
          >
            {rejectLoading ? <CircularProgress size={24} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default LeaveRequestHistory;