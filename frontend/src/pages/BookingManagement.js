import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  Tab,
  Tabs
} from '@mui/material';
import {
  Search,
  Edit,
  Delete,
  Add,
  MeetingRoom,
  Refresh,
  Close,
  CalendarToday,
  Cancel
} from '@mui/icons-material';
import { bookingService } from '../services/bookingService';
import { roomService } from '../services/roomService';
import { useAuth } from '../context/AuthContext';

const BookingManagement = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalBookings, setTotalBookings] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    roomId: '',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    attendees: 1
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        room: roomFilter !== 'all' ? roomFilter : undefined
      };

      const response = await bookingService.getAllBookings(params);
      setBookings(response.data.bookings);
      setTotalBookings(response.data.pagination.totalBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available rooms
  const fetchRooms = async () => {
    try {
      const response = await roomService.getAllRooms({ 
        limit: 1000,
        isActive: 'true'
      });
      setRooms(response.data.rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, [page, rowsPerPage, statusFilter, roomFilter]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.roomId) errors.roomId = 'Room is required';
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.startTime) errors.startTime = 'Start time is required';
    if (!formData.endTime) errors.endTime = 'End time is required';
    if (!formData.attendees || formData.attendees < 1) errors.attendees = 'Valid number of attendees is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create booking
  const handleCreateBooking = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      await bookingService.createBooking(formData);
      setSuccessMessage('Booking created successfully');
      setOpenCreateDialog(false);
      resetForm();
      fetchBookings();
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel booking
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      setLoading(true);
      await bookingService.cancelBooking(selectedBooking._id);
      setSuccessMessage('Booking cancelled successfully');
      setOpenCancelDialog(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError(error.message || 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit booking
  const handleEditBooking = async (id, bookingData) => {
    try {
      setLoading(true);
      await bookingService.updateBooking(id, bookingData);
      setSuccessMessage('Booking updated successfully');
      setOpenEditDialog(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      setError(error.message || 'Failed to update booking');
      throw error; // Re-throw to handle in dialog
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      roomId: '',
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      attendees: 1
    });
    setFormErrors({});
  };

  // Get status chip color
  const getStatusChipProps = (status) => {
    const config = {
      approved: { color: 'success', label: 'Approved' },
      cancelled: { color: 'default', label: 'Cancelled' }
    };
    return config[status] || { color: 'default', label: status };
  };

  // Format date for display
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Check if user can edit booking
  const canEditBooking = (booking) => {
    return (user?.role === 'admin' || booking.user?._id === user?.id) && 
           booking.status === 'approved' &&
           new Date(booking.startTime) > new Date();
  };

  // Check if user can cancel booking
  const canCancelBooking = (booking) => {
    return (user?.role === 'admin' || booking.user?._id === user?.id) && 
           booking.status === 'approved' &&
           new Date(booking.startTime) > new Date();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CalendarToday sx={{ mr: 2, fontSize: 32 }} color="primary" />
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Room Bookings
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{ mr: 2 }}
          onClick={() => setOpenCreateDialog(true)}
        >
          New Booking
        </Button>
        <Tooltip title="Refresh bookings">
          <IconButton onClick={fetchBookings} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Room</InputLabel>
              <Select
                value={roomFilter}
                label="Room"
                onChange={(e) => {
                    const value = e.target.value;
                    // Ensure we don't set undefined values
                    setRoomFilter(value === 'undefined' ? 'all' : value);
                }}
              >
                <MenuItem value="all">All Rooms</MenuItem>
                {rooms.map((room) => (
                  <MenuItem key={room._id} value={room._id}>
                    {room.name} - {room.location.building}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Bookings Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell align="center">Attendees</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No bookings found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking._id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {booking.title}
                      </Typography>
                      {booking.description && (
                        <Typography variant="body2" color="text.secondary">
                          {booking.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {booking.room.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {booking.room.location.building}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDateTime(booking.startTime)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        to {formatDateTime(booking.endTime)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {booking.attendees}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusChipProps(booking.status).label}
                        color={getStatusChipProps(booking.status).color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {/* Edit Button - Show for booking owner or admin (only for approved, future bookings) */}
                        {(canEditBooking(booking)) && (booking.status === 'approved') && (
                          <Tooltip title="Edit booking">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setOpenEditDialog(true);
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        )}

                        {(canCancelBooking(booking)) && (booking.status === 'approved') && (
                          <Tooltip title="Cancel booking">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setOpenCancelDialog(true);
                              }}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalBookings}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Create Booking Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Create New Booking
          <IconButton
            aria-label="close"
            onClick={() => setOpenCreateDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!formErrors.roomId}>
                <InputLabel>Room *</InputLabel>
                <Select
                  value={formData.roomId}
                  label="Room *"
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                >
                  {rooms.map((room) => (
                    <MenuItem key={room._id} value={room._id}>
                      {room.name} - {room.location.building} (Capacity: {room.capacity})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.roomId && <FormHelperText>{formErrors.roomId}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={!!formErrors.title}
                helperText={formErrors.title}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time *"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                error={!!formErrors.startTime}
                helperText={formErrors.startTime}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time *"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                error={!!formErrors.endTime}
                helperText={formErrors.endTime}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Number of Attendees *"
                type="number"
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: parseInt(e.target.value) || 1 })}
                error={!!formErrors.attendees}
                helperText={formErrors.attendees}
                inputProps={{ min: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateBooking} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Create Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    

      {/* Edit Booking Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Booking
          <IconButton
            aria-label="close"
            onClick={() => setOpenEditDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Current Status: 
                    <Chip 
                      label={selectedBooking.status?.toUpperCase()} 
                      color={getStatusChipProps(selectedBooking.status).color}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Room: <strong>{selectedBooking.room?.name}</strong> | 
                    Created: {new Date(selectedBooking.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Booking Title *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>

              {/* Room selection only for admins */}
              {user?.role === 'admin' && (
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!formErrors.roomId}>
                    <InputLabel>Room *</InputLabel>
                    <Select
                      value={formData.roomId}
                      label="Room *"
                      onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    >
                      {rooms.map((room) => (
                        <MenuItem key={room._id} value={room._id}>
                          {room.name} - {room.location.building} (Capacity: {room.capacity})
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.roomId && <FormHelperText>{formErrors.roomId}</FormHelperText>}
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Time *"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  error={!!formErrors.startTime}
                  helperText={formErrors.startTime}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Time *"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  error={!!formErrors.endTime}
                  helperText={formErrors.endTime}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Number of Attendees *"
                  type="number"
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: parseInt(e.target.value) || 1 })}
                  error={!!formErrors.attendees}
                  helperText={formErrors.attendees}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={async () => {
              if (!validateForm()) return;
              try {
                await handleEditBooking(selectedBooking._id, formData);
              } catch (error) {
                // Error is already handled in handleEditBooking
              }
            }}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Update Booking'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Cancel Booking Dialog */}
      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel the booking "{selectedBooking?.title}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>Keep Booking</Button>
          <Button 
            onClick={handleCancelBooking}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Cancel Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookingManagement;