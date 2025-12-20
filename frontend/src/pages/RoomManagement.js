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
  Autocomplete,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Search,
  Edit,
  Delete,
  Add,
  MeetingRoom,
  Refresh,
  School,
  Business,
  Close,
  People  
} from '@mui/icons-material';
import { roomService } from '../services/roomService';
import { useAuth } from '../context/AuthContext';

const RoomManagement = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRooms, setTotalRooms] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('');
  
  // Dialog state
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Form state for add/edit room
  const [formData, setFormData] = useState({
    name: '',
    type: 'classroom',
    capacity: '',
    location: {
      building: '',
      floor: '',
      roomNumber: ''
    },
    equipment: [],
    amenities: [],
    typeSpecific: {},
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Room name is required';
    }
    
    if (!formData.capacity || formData.capacity <= 0) {
      errors.capacity = 'Capacity must be greater than 0';
    }
    
    if (!formData.location.building.trim()) {
      errors.building = 'Building is required';
    }
    
    if (!formData.location.floor.trim()) {
      errors.floor = 'Floor is required';
    }
    
    if (!formData.location.roomNumber.trim()) {
      errors.roomNumber = 'Room number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'classroom',
      capacity: '',
      location: {
        building: '',
        floor: '',
        roomNumber: ''
      },
      equipment: [],
      amenities: [],
      typeSpecific: {},
      isActive: true
    });
    setFormErrors({});
  };

  // Handle form input changes
  const handleFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        // Reset typeSpecific fields when room type changes
        ...(field === 'type' ? { typeSpecific: {} } : {})
      }));
    }
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle equipment changes (convert strings to objects)
  const handleEquipmentChange = (newValue) => {
    const equipmentObjects = newValue.map(name => ({
      name: name,
      quantity: 1,
      condition: 'good'
    }));
    handleFormChange('equipment', equipmentObjects);
  };

  // Handle type-specific field changes
  const handleTypeSpecificChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      typeSpecific: {
        ...prev.typeSpecific,
        [field]: value
      }
    }));
  };

  // Render type-specific fields based on room type
  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'laboratory':
        return (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Laboratory-Specific Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fume Hoods Count"
                type="number"
                value={formData.typeSpecific.fumeHoodsCount || ''}
                onChange={(e) => handleTypeSpecificChange('fumeHoodsCount', parseInt(e.target.value) || '')}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lab Type"
                value={formData.typeSpecific.labType || ''}
                onChange={(e) => handleTypeSpecificChange('labType', e.target.value)}
                placeholder="e.g., Chemistry, Biology, Physics"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Safety Equipment"
                value={formData.typeSpecific.safetyEquipment || ''}
                onChange={(e) => handleTypeSpecificChange('safetyEquipment', e.target.value)}
                placeholder="List safety equipment available in the lab"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.typeSpecific.chemicalStorage || false}
                    onChange={(e) => handleTypeSpecificChange('chemicalStorage', e.target.checked)}
                  />
                }
                label="Chemical Storage Available"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.typeSpecific.emergencyShower || false}
                    onChange={(e) => handleTypeSpecificChange('emergencyShower', e.target.checked)}
                  />
                }
                label="Emergency Shower"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.typeSpecific.eyeWashStation || false}
                    onChange={(e) => handleTypeSpecificChange('eyeWashStation', e.target.checked)}
                  />
                }
                label="Eye Wash Station"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.typeSpecific.hazmatCertified || false}
                    onChange={(e) => handleTypeSpecificChange('hazmatCertified', e.target.checked)}
                  />
                }
                label="Hazmat Certified"
              />
            </Grid>
          </>
        );
      
      case 'computer_lab':
        return (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Computer Lab-Specific Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Number of Computers"
                type="number"
                value={formData.typeSpecific.computersCount || ''}
                onChange={(e) => handleTypeSpecificChange('computersCount', parseInt(e.target.value) || '')}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hardware Specifications"
                value={formData.typeSpecific.hardwareSpecs || ''}
                onChange={(e) => handleTypeSpecificChange('hardwareSpecs', e.target.value)}
                placeholder="e.g., i7, 16GB RAM, RTX 3060"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Software Installed"
                value={formData.typeSpecific.softwareInstalled || ''}
                onChange={(e) => handleTypeSpecificChange('softwareInstalled', e.target.value)}
                placeholder="List installed software"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Network Type</InputLabel>
                <Select
                  value={formData.typeSpecific.networkType || ''}
                  label="Network Type"
                  onChange={(e) => handleTypeSpecificChange('networkType', e.target.value)}
                >
                  <MenuItem value="wired">Wired</MenuItem>
                  <MenuItem value="wireless">Wireless</MenuItem>
                  <MenuItem value="both">Both</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.typeSpecific.printerAvailable || false}
                    onChange={(e) => handleTypeSpecificChange('printerAvailable', e.target.checked)}
                  />
                }
                label="Printer Available"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.typeSpecific.scannerAvailable || false}
                    onChange={(e) => handleTypeSpecificChange('scannerAvailable', e.target.checked)}
                  />
                }
                label="Scanner Available"
              />
            </Grid>
          </>
        );
      
      case 'lecture_hall':
        return (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Lecture Hall-Specific Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Seating Arrangement</InputLabel>
                <Select
                  value={formData.typeSpecific.seatingArrangement || ''}
                  label="Seating Arrangement"
                  onChange={(e) => handleTypeSpecificChange('seatingArrangement', e.target.value)}
                >
                  <MenuItem value="theater">Theater Style</MenuItem>
                  <MenuItem value="tiered">Tiered</MenuItem>
                  <MenuItem value="flexible">Flexible</MenuItem>
                  <MenuItem value="fixed">Fixed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Projector Type"
                value={formData.typeSpecific.projectorType || ''}
                onChange={(e) => handleTypeSpecificChange('projectorType', e.target.value)}
                placeholder="e.g., 4K Laser"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="AV Equipment"
                value={formData.typeSpecific.avEquipment || ''}
                onChange={(e) => handleTypeSpecificChange('avEquipment', e.target.value)}
                placeholder="List audio-visual equipment"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sound System"
                value={formData.typeSpecific.soundSystem || ''}
                onChange={(e) => handleTypeSpecificChange('soundSystem', e.target.value)}
                placeholder="e.g., Wireless microphone system"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Whiteboard Count"
                type="number"
                value={formData.typeSpecific.whiteboardCount || ''}
                onChange={(e) => handleTypeSpecificChange('whiteboardCount', parseInt(e.target.value) || '')}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.typeSpecific.recordingCapable || false}
                    onChange={(e) => handleTypeSpecificChange('recordingCapable', e.target.checked)}
                  />
                }
                label="Recording Capable"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.typeSpecific.documentCamera || false}
                    onChange={(e) => handleTypeSpecificChange('documentCamera', e.target.checked)}
                  />
                }
                label="Document Camera"
              />
            </Grid>
          </>
        );
      
      case 'office':
        return (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Office-Specific Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Occupant Name"
                value={formData.typeSpecific.occupantName || ''}
                onChange={(e) => handleTypeSpecificChange('occupantName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Extension"
                value={formData.typeSpecific.phoneExtension || ''}
                onChange={(e) => handleTypeSpecificChange('phoneExtension', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Access Control Type</InputLabel>
                <Select
                  value={formData.typeSpecific.accessControlType || ''}
                  label="Access Control Type"
                  onChange={(e) => handleTypeSpecificChange('accessControlType', e.target.value)}
                >
                  <MenuItem value="key">Key</MenuItem>
                  <MenuItem value="card">Card Access</MenuItem>
                  <MenuItem value="biometric">Biometric</MenuItem>
                  <MenuItem value="code">Access Code</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Window Count"
                type="number"
                value={formData.typeSpecific.windowCount || ''}
                onChange={(e) => handleTypeSpecificChange('windowCount', parseInt(e.target.value) || '')}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Network Ports"
                type="number"
                value={formData.typeSpecific.networkPorts || ''}
                onChange={(e) => handleTypeSpecificChange('networkPorts', parseInt(e.target.value) || '')}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Furniture List"
                value={formData.typeSpecific.furnitureList || ''}
                onChange={(e) => handleTypeSpecificChange('furnitureList', e.target.value)}
                placeholder="List furniture items in the office"
              />
            </Grid>
          </>
        );
      
      case 'conference_room':
        return (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Studio/Workshop-Specific Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Studio Type"
                value={formData.typeSpecific.studioType || ''}
                onChange={(e) => handleTypeSpecificChange('studioType', e.target.value)}
                placeholder="e.g., Art, Music, Video Production"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Power Outlets Count"
                type="number"
                value={formData.typeSpecific.powerOutletsCount || ''}
                onChange={(e) => handleTypeSpecificChange('powerOutletsCount', parseInt(e.target.value) || '')}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Equipment List"
                value={formData.typeSpecific.equipmentList || ''}
                onChange={(e) => handleTypeSpecificChange('equipmentList', e.target.value)}
                placeholder="List specialized equipment available"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Specialized Lighting"
                value={formData.typeSpecific.specializedLighting || ''}
                onChange={(e) => handleTypeSpecificChange('specializedLighting', e.target.value)}
                placeholder="Describe lighting setup"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Storage Space"
                value={formData.typeSpecific.storageSpace || ''}
                onChange={(e) => handleTypeSpecificChange('storageSpace', e.target.value)}
                placeholder="Describe available storage"
              />
            </Grid>
          </>
        );
      
      default:
        return null;
    }
  };

  // Handle add room
  const handleAddRoom = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      await roomService.createRoom(formData);
      setSuccessMessage('Room added successfully');
      setOpenAddDialog(false);
      resetForm();
      fetchRooms();
    } catch (error) {
      console.error('Error adding room:', error);
      setError('Failed to add room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit room
  const handleEditRoom = async () => {
    if (!validateForm() || !selectedRoom) return;
    
    try {
      setLoading(true);
      await roomService.updateRoom(selectedRoom.id || selectedRoom._id, formData);
      setSuccessMessage('Room updated successfully');
      setOpenEditDialog(false);
      setSelectedRoom(null);
      resetForm();
      fetchRooms();
    } catch (error) {
      console.error('Error updating room:', error);
      setError('Failed to update room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete room
  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    
    try {
      setLoading(true);
      await roomService.deleteRoom(selectedRoom.id || selectedRoom._id);
      setSuccessMessage('Room deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedRoom(null);
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      setError('Failed to delete room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open add dialog
  const handleOpenAddDialog = () => {
    resetForm();
    setOpenAddDialog(true);
  };

  // Open edit dialog
  const handleOpenEditDialog = (room) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      location: {
        building: room.location?.building || '',
        floor: room.location?.floor || '',
        roomNumber: room.location?.roomNumber || ''
      },
      equipment: room.equipment || [],
      amenities: room.amenities || [],
      typeSpecific: room.typeSpecific || {},
      isActive: room.isActive
    });
    setOpenEditDialog(true);
  };

  // Open delete dialog
  const handleOpenDeleteDialog = (room) => {
    setSelectedRoom(room);
    setOpenDeleteDialog(true);
  };



  // Fetch rooms from API
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: page + 1, // Backend expects 1-based page numbering
        limit: rowsPerPage,
        search: searchTerm,
        type: typeFilter,
        building: buildingFilter,
        capacity: capacityFilter,
        isActive: statusFilter
      };

      const response = await roomService.getAllRooms(params);
      
      setRooms(response.data.rooms || []);
      setTotalRooms(response.data.pagination?.totalRooms || 0);
      
    } catch (error) {
      console.error('Error fetching rooms:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.status);
      console.error('Current user:', user);
      console.error('Auth token:', localStorage.getItem('token'));
      const errorMessage = error.message || error.response?.data?.message || `Failed to load rooms (${error.status || 'Unknown error'})`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when dependencies change
  useEffect(() => {
    fetchRooms();
  }, [page, rowsPerPage, searchTerm, typeFilter, buildingFilter, capacityFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-clear success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  // Handle filter changes
  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
    setPage(0);
  };

  const handleBuildingFilterChange = (event) => {
    setBuildingFilter(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleCapacityFilterChange = (event) => {
    setCapacityFilter(event.target.value);
    setPage(0);
  };
  // Get room type display properties
  const getRoomTypeChipProps = (type) => {
    const typeConfig = {
      classroom: { color: 'primary', label: 'Classroom', icon: <School /> },
      laboratory: { color: 'secondary', label: 'Laboratory', icon: <School /> },
      lecture_hall: { color: 'info', label: 'Lecture Hall', icon: <Business /> },
      computer_lab: { color: 'success', label: 'Computer Lab', icon: <School /> },
      office: { color: 'warning', label: 'Office', icon: <Business /> },
      conference_room: { color: 'error', label: 'Conference Room', icon: <Business /> }
    };
    return typeConfig[type] || { color: 'default', label: type };
  };

  // Format room name for display
  const formatRoomName = (room) => {
    return `${room.name}`;
  };

  // Format location for display (no leading/trailing commas, skip empty parts, show placeholder if all empty)
  const formatLocation = (location) => {
    const parts = [];
    if (location.building) parts.push(location.building);
    if (location.floor) parts.push(`Floor ${location.floor}`);
    if (location.roomNumber) parts.push(`Room ${location.roomNumber}`);
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  // Get buildings for filter dropdown (from current rooms)
  const getAvailableBuildings = () => {
    if (!rooms || !Array.isArray(rooms)) return [];
    const buildings = [...new Set(rooms.map(room => room.location?.building).filter(Boolean))];
    return buildings.sort();
  };

  // Check if current user can manage rooms (admin only for create/edit/delete)
  const canManageRooms = user?.role === 'admin';
  const canViewRooms = ['admin', 'staff', 'professor'].includes(user?.role);

  // Check access permissions
  if (!canViewRooms) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Access denied. You need administrator, staff, or professor privileges to view this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <MeetingRoom sx={{ mr: 2, fontSize: 32 }} color="primary" />
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Room Management
        </Typography>
        {canManageRooms && (
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ mr: 2 }}
            onClick={handleOpenAddDialog}
          >
            Add Room
          </Button>
        )}
        <Tooltip title="Refresh room list">
          <IconButton onClick={fetchRooms} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error/Success Messages */}
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

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search rooms"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name, building, or room number..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Room Type</InputLabel>
              <Select
                value={typeFilter}
                label="Room Type"
                onChange={handleTypeFilterChange}
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
            <FormControl fullWidth>
              <InputLabel>Building</InputLabel>
              <Select
                value={buildingFilter}
                label="Building"
                onChange={handleBuildingFilterChange}
              >
                <MenuItem value="all">All Buildings</MenuItem>
                {getAvailableBuildings().map((building) => (
                  <MenuItem key={building} value={building}>
                    {building}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Min Capacity"
              type="number"
              value={capacityFilter}
              onChange={handleCapacityFilterChange}
              placeholder="Min capacity"
              inputProps={{ min: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <People />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Room Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Room Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Location</TableCell>
                <TableCell align="center">Capacity</TableCell>
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
              ) : (!rooms || rooms.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm || typeFilter !== 'all' || buildingFilter !== 'all' || statusFilter !== 'all'
                        ? 'No rooms found matching your search criteria'
                        : 'No rooms found'
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rooms.map((room) => (
                  <TableRow key={room.id || room._id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {formatRoomName(room)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getRoomTypeChipProps(room.type).label}
                        color={getRoomTypeChipProps(room.type).color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatLocation(room.location)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {Number(room.capacity) % 1 === 0 ? Number(room.capacity) : Number(room.capacity).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={room.isActive ? 'Active' : 'Inactive'}
                        color={room.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {canManageRooms && (
                          <>
                            <Tooltip title="Edit room">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleOpenEditDialog(room)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete room">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleOpenDeleteDialog(room)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalRooms}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Summary */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {rooms?.length || 0} of {totalRooms} rooms
          {(searchTerm || typeFilter !== 'all' || buildingFilter !== 'all' || statusFilter !== 'all') && ' (filtered)'}
        </Typography>
      </Box>

      {/* Add Room Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Add New Room
          <IconButton
            aria-label="close"
            onClick={() => setOpenAddDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Room Name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Room Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Room Type"
                  onChange={(e) => handleFormChange('type', e.target.value)}
                >
                  <MenuItem value="classroom">Classroom</MenuItem>
                  <MenuItem value="laboratory">Laboratory</MenuItem>
                  <MenuItem value="lecture_hall">Lecture Hall</MenuItem>
                  <MenuItem value="computer_lab">Computer Lab</MenuItem>
                  <MenuItem value="office">Office</MenuItem>
                  <MenuItem value="conference_room">Conference Room</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleFormChange('capacity', parseInt(e.target.value) || '')}
                error={!!formErrors.capacity}
                helperText={formErrors.capacity}
                required
                inputProps={{ min: 1, max: 1000 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Building"
                value={formData.location.building}
                onChange={(e) => handleFormChange('location.building', e.target.value)}
                error={!!formErrors.building}
                helperText={formErrors.building}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Floor"
                value={formData.location.floor}
                onChange={(e) => handleFormChange('location.floor', e.target.value)}
                error={!!formErrors.floor}
                helperText={formErrors.floor}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Room Number"
                value={formData.location.roomNumber}
                onChange={(e) => handleFormChange('location.roomNumber', e.target.value)}
                error={!!formErrors.roomNumber}
                helperText={formErrors.roomNumber}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={['Projector', 'Whiteboard', 'Computer', 'Audio System', 'Interactive Board', 'Air Conditioning', 'Microphone']}
                value={formData.equipment.map(eq => eq.name || eq)}
                onChange={(event, newValue) => handleEquipmentChange(newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Equipment"
                    placeholder="Select equipment"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={['WiFi', 'Parking', 'Accessibility', 'Natural Light', 'Storage', 'Kitchen', 'Restroom Nearby']}
                value={formData.amenities}
                onChange={(event, newValue) => handleFormChange('amenities', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Amenities"
                    placeholder="Select amenities"
                  />
                )}
              />
            </Grid>
            
            {/* Type-Specific Fields */}
            {renderTypeSpecificFields()}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddRoom} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Add Room'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Room
          <IconButton
            aria-label="close"
            onClick={() => setOpenEditDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Room Name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Room Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Room Type"
                  onChange={(e) => handleFormChange('type', e.target.value)}
                >
                  <MenuItem value="classroom">Classroom</MenuItem>
                  <MenuItem value="laboratory">Laboratory</MenuItem>
                  <MenuItem value="lecture_hall">Lecture Hall</MenuItem>
                  <MenuItem value="computer_lab">Computer Lab</MenuItem>
                  <MenuItem value="office">Office</MenuItem>
                  <MenuItem value="conference_room">Conference Room</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleFormChange('capacity', parseInt(e.target.value) || '')}
                error={!!formErrors.capacity}
                helperText={formErrors.capacity}
                required
                inputProps={{ min: 1, max: 1000 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Building"
                value={formData.location.building}
                onChange={(e) => handleFormChange('location.building', e.target.value)}
                error={!!formErrors.building}
                helperText={formErrors.building}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Floor"
                value={formData.location.floor}
                onChange={(e) => handleFormChange('location.floor', e.target.value)}
                error={!!formErrors.floor}
                helperText={formErrors.floor}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Room Number"
                value={formData.location.roomNumber}
                onChange={(e) => handleFormChange('location.roomNumber', e.target.value)}
                error={!!formErrors.roomNumber}
                helperText={formErrors.roomNumber}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={['Projector', 'Whiteboard', 'Computer', 'Audio System', 'Interactive Board', 'Air Conditioning', 'Microphone']}
                value={formData.equipment.map(eq => eq.name || eq)}
                onChange={(event, newValue) => handleEquipmentChange(newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Equipment"
                    placeholder="Select equipment"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={['WiFi', 'Parking', 'Accessibility', 'Natural Light', 'Storage', 'Kitchen', 'Restroom Nearby']}
                value={formData.amenities}
                onChange={(event, newValue) => handleFormChange('amenities', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Amenities"
                    placeholder="Select amenities"
                  />
                )}
              />
            </Grid>
            
            {/* Type-Specific Fields */}
            {renderTypeSpecificFields()}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleEditRoom} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Update Room'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="sm">
        <DialogTitle>Delete Room</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the room "{selectedRoom?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteRoom}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RoomManagement;