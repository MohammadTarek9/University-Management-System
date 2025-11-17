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
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Refresh,
  Close,
  CalendarToday,
  Cancel,
  People,
  LocationOn
} from '@mui/icons-material';
import { bookingService } from '../services/bookingService';
import { roomService } from '../services/roomService';
import { useAuth } from '../context/AuthContext';

const BookingManagement = () => {
  const { user } = useAuth();
  const [availableRooms, setAvailableRooms] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);
  const [totalRooms, setTotalRooms] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [buildingOptions, setBuildingOptions] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    roomType: 'all',
    capacity: '',
    building: 'all',
    date: new Date().toISOString().split('T')[0], // Today's date
    startTime: '',
    endTime: ''
  });

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openBookingsDialog, setOpenBookingsDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
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

  // Fetch available rooms with filters
  const fetchAvailableRooms = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get current date for combining with time-only values
      const currentDate = new Date().toISOString().split('T')[0];
      const selectedDate = filters.date || currentDate;
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        roomType: filters.roomType !== 'all' ? filters.roomType : undefined,
        capacity: filters.capacity || undefined,
        building: filters.building !== 'all' ? filters.building : undefined,
        date: selectedDate,
        startTime: filters.startTime || undefined,
        endTime: filters.endTime || undefined
      };

      // Remove undefined parameters
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await bookingService.searchAvailableRooms(params);
      setAvailableRooms(response.data.rooms);
      setTotalRooms(response.data.pagination.totalRooms);

      // Extract building options from the response or from all rooms
      if (response.data.filterOptions && response.data.filterOptions.buildings) {
        setBuildingOptions(response.data.filterOptions.buildings);
      } else {
        // Fallback: extract buildings from the returned rooms
        const buildings = [...new Set(response.data.rooms.map(room => room.location.building))];
        setBuildingOptions(buildings.sort());
      }

    } catch (error) {
      console.error('Error fetching available rooms:', error);
      setError(error.message || 'Failed to load available rooms');
    } finally {
      setLoading(false);
    }
  };

  // fetch all buildings (for initial load)
  const fetchAllBuildings = async () => {
    try {
      const response = await roomService.getAllRooms({ limit: 1000 });
      const buildings = [...new Set(response.data.rooms.map(room => room.location.building))];
      setBuildingOptions(buildings.sort());
    } catch (error) {
      console.error('Error fetching buildings:', error);
    }
  };

  // Fetch user bookings
  const fetchUserBookings = async () => {
    try {
      const response = await bookingService.getAllBookings({
        limit: 1000
      });
      setUserBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
    }
  };

  // Fetch all bookings (for admin)
  const fetchAllBookings = async () => {
    try {
      const response = await bookingService.getAllBookings({
        limit: 1000
      });
      setAllBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching all bookings:', error);
    }
  };

  useEffect(() => {
    fetchAvailableRooms();
    fetchUserBookings();
    fetchAllBuildings(); 
    if (user?.role === 'admin') {
      fetchAllBookings();
    }
  }, [page, rowsPerPage, filters]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      roomType: 'all',
      capacity: '',
      building: 'all',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: ''
    });
    setPage(0); // Reset to first page
  };
  // Handle room selection for booking
  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setFormData({
      roomId: room.id || room._id,
      title: `Meeting in ${room.name || 'Room'}`,
      description: '',
      startTime: filters.startTime || new Date().toISOString().slice(0, 16),
      endTime: filters.endTime || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
      attendees: 1
    });
    setOpenCreateDialog(true);
  };

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
      setSelectedRoom(null);
      fetchAvailableRooms();
      fetchUserBookings();
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
      await bookingService.cancelBooking(selectedBooking.id || selectedBooking._id);
      setSuccessMessage('Booking cancelled successfully');
      setOpenCancelDialog(false);
      setSelectedBooking(null);
      fetchUserBookings();
      fetchAvailableRooms();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError(error.message || 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
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

  // Check if user can cancel booking
  const canCancelBooking = (booking) => {
    const bookingOwnerId = booking.user?.id || booking.user?._id;
    return (user?.role === 'admin' || bookingOwnerId === user?.id) &&
           booking.status === 'approved' &&
           new Date(booking.startTime) > new Date();
  };

  const currentBookings = activeTab === 0 ? userBookings : allBookings;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CalendarToday sx={{ mr: 2, fontSize: 32 }} color="primary" />
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Room Booking System
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<CalendarToday />}
          sx={{ mr: 2 }}
          onClick={() => setOpenBookingsDialog(true)}
        >
          My Bookings ({userBookings.length})
        </Button>

        <Tooltip title="Refresh rooms">
          <IconButton onClick={fetchAvailableRooms} disabled={loading}>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Find Available Rooms
          </Typography>
          <Button 
            variant="outlined" 
            onClick={handleClearFilters}
            disabled={filters.roomType === 'all' && 
                      filters.capacity === '' && 
                      filters.building === 'all' && 
                      filters.date === new Date().toISOString().split('T')[0] &&
                      filters.startTime === '' && 
                      filters.endTime === ''}
          >
            Clear Filters
          </Button>
        </Box>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Room Type</InputLabel>
              <Select
                value={filters.roomType}
                label="Room Type"
                onChange={(e) => handleFilterChange('roomType', e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="classroom">Classroom</MenuItem>
                <MenuItem value="laboratory">Laboratory</MenuItem>
                <MenuItem value="lecture_hall">Lecture Hall</MenuItem>
                <MenuItem value="computer_lab">Computer Lab</MenuItem>
                <MenuItem value="office">Office</MenuItem>
                <MenuItem value="conference_room">Conference Room</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Min Capacity"
              type="number"
              value={filters.capacity}
              onChange={(e) => handleFilterChange('capacity', e.target.value)}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Building</InputLabel>
              <Select
                value={filters.building}
                label="Building"
                onChange={(e) => handleFilterChange('building', e.target.value)}
              >
                <MenuItem value="all">All Buildings</MenuItem>
                {buildingOptions.map((building) => (
                  <MenuItem key={building} value={building}>
                    {building}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Start Time"
              type="time"
              value={filters.startTime}
              onChange={(e) => handleFilterChange('startTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="End Time"
              type="time"
              value={filters.endTime}
              onChange={(e) => handleFilterChange('endTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Available Rooms Grid */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Available Rooms ({availableRooms.length})
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Box>
        ) : availableRooms.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No available rooms found matching your criteria.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {availableRooms.map((room) => (
              <Grid item xs={12} sm={6} md={4} key={room.id || room._id}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {room.name || 'Unnamed Room'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box display="flex" alignItems="center">
                        <LocationOn sx={{ mr: 1, fontSize: 18 }} color="action" />
                        <Typography variant="body2">
                          {room.location?.building || 'N/A'} • {room.location?.floor || 'N/A'}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center">
                        <People sx={{ mr: 1, fontSize: 18 }} color="action" />
                        <Typography variant="body2">
                          Capacity: {room.capacity} people
                        </Typography>
                      </Box>
                      
                      <Chip 
                        label={room.type} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      
                      {room.equipment && room.equipment.length > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Equipment: {room.equipment.map(eq => eq.name).join(', ')}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    <Button 
                      size="small" 
                      variant="contained"
                      onClick={() => handleRoomSelect(room)}
                      fullWidth
                    >
                      Book This Room
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Pagination */}
      {availableRooms.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <TablePagination
            rowsPerPageOptions={[9, 18, 27]}
            component="div"
            count={totalRooms}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Box>
      )}

      {/* Create Booking Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Book Room: {selectedRoom?.name}
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
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Room Details
                </Typography>
                <Typography variant="body2">
                  <strong>{selectedRoom?.name}</strong> • {selectedRoom?.location.building} • 
                  Capacity: {selectedRoom?.capacity} • Type: {selectedRoom?.type}
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
                inputProps={{ min: 1, max: selectedRoom?.capacity }}
                //helperText={`Maximum capacity: ${selectedRoom?.capacity}`}
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
            {loading ? <CircularProgress size={20} /> : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bookings Dialog */}
      <Dialog open={openBookingsDialog} onClose={() => setOpenBookingsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {user?.role === 'admin' ? 'All Bookings' : 'My Bookings'}
          <IconButton
            aria-label="close"
            onClick={() => setOpenBookingsDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {user?.role === 'admin' && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                <Tab label="My Bookings" />
                <Tab label="All Bookings" />
              </Tabs>
            </Box>
          )}
          
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
                {currentBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No bookings found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentBookings.map((booking) => (
                    <TableRow key={booking.id || booking._id} hover>
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
                          {booking.room?.name || 'Unknown Room'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {booking.room?.location?.building || 'N/A'}
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
                        {canCancelBooking(booking) && (
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBookingsDialog(false)}>Close</Button>
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