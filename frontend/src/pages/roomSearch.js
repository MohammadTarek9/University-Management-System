import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Search,
  Close,
  MeetingRoom,
  People,
  LocationOn,
  Schedule
} from '@mui/icons-material';
import { bookingService } from '../services/bookingService';
import { roomService } from '../services/roomService';
import { useAuth } from '../context/AuthContext';
const RoomSearch = ({ open, onClose, onRoomSelect }) => {
  const [searchCriteria, setSearchCriteria] = useState({
    startTime: '',
    endTime: '',
    capacity: '',
    building: 'all',
    roomType: 'all'
  });
  const [availableRooms, setAvailableRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Fetch buildings and room types for filters
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const roomsResponse = await roomService.getAllRooms({ limit: 1000 });
        const rooms = roomsResponse.data.rooms;
        
        // Extract unique buildings
        const uniqueBuildings = [...new Set(rooms.map(room => room.location.building))];
        setBuildings(uniqueBuildings);
        
        // Extract unique room types
        const uniqueRoomTypes = [...new Set(rooms.map(room => room.type))];
        setRoomTypes(uniqueRoomTypes);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    if (open) {
      fetchFilterOptions();
    }
  }, [open]);

  const handleSearch = async () => {
    if (!searchCriteria.startTime || !searchCriteria.endTime) {
      setError('Please select both start and end time');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const params = {
        ...searchCriteria,
        capacity: searchCriteria.capacity || undefined,
        building: searchCriteria.building !== 'all' ? searchCriteria.building : undefined,
        roomType: searchCriteria.roomType !== 'all' ? searchCriteria.roomType : undefined
      };

      const response = await bookingService.searchAvailableRooms(params);
      setAvailableRooms(response.data.rooms);
      setSearchPerformed(true);
    } catch (error) {
      console.error('Error searching rooms:', error);
      setError(error.message || 'Failed to search available rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCriteriaChange = (field, value) => {
    setSearchCriteria(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString();
  };

  const resetSearch = () => {
    setSearchCriteria({
      startTime: '',
      endTime: '',
      capacity: '',
      building: 'all',
      roomType: 'all'
    });
    setAvailableRooms([]);
    setSearchPerformed(false);
    setError('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <MeetingRoom sx={{ mr: 1 }} />
          Search Available Rooms
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Search Criteria */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Search Criteria
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time *"
                type="datetime-local"
                value={searchCriteria.startTime}
                onChange={(e) => handleCriteriaChange('startTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time *"
                type="datetime-local"
                value={searchCriteria.endTime}
                onChange={(e) => handleCriteriaChange('endTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Minimum Capacity"
                type="number"
                value={searchCriteria.capacity}
                onChange={(e) => handleCriteriaChange('capacity', e.target.value)}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Building</InputLabel>
                <Select
                  value={searchCriteria.building}
                  label="Building"
                  onChange={(e) => handleCriteriaChange('building', e.target.value)}
                >
                  <MenuItem value="all">All Buildings</MenuItem>
                  {buildings.map((building) => (
                    <MenuItem key={building} value={building}>
                      {building}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Room Type</InputLabel>
                <Select
                  value={searchCriteria.roomType}
                  label="Room Type"
                  onChange={(e) => handleCriteriaChange('roomType', e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {roomTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              disabled={loading || !searchCriteria.startTime || !searchCriteria.endTime}
            >
              {loading ? <CircularProgress size={20} /> : 'Search Rooms'}
            </Button>
            <Button variant="outlined" onClick={resetSearch}>
              Reset
            </Button>
          </Box>
        </Paper>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Search Results */}
        {searchPerformed && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Available Rooms ({availableRooms.length} found)
            </Typography>
            
            {availableRooms.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No available rooms found matching your criteria.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {availableRooms.map((room) => (
                  <Grid item xs={12} md={6} key={room._id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {room.name}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box display="flex" alignItems="center">
                            <LocationOn sx={{ mr: 1, fontSize: 18 }} color="action" />
                            <Typography variant="body2">
                              {room.location.building} • {room.location.floor}
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
                              Equipment: {room.equipment.join(', ')}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                      
                      <CardActions>
                        <Button 
                          size="small" 
                          onClick={() => onRoomSelect(room)}
                        >
                          Select Room
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomSearch;