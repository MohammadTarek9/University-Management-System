import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  LinearProgress,
  Grid,
  Divider,
  Tooltip
} from '@mui/material';
import {
  MenuBook,
  CloudUpload,
  Download,
  Delete,
  Edit,
  Description,
  VideoLibrary,
  Image as ImageIcon,
  PictureAsPdf,
  Folder
} from '@mui/icons-material';
import axios from 'axios';

const CourseMaterials = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));
  const isProfessorOrTA = user?.role === 'professor' || user?.role === 'ta' || user?.role === 'admin';

  // Fetch courses for the user
  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch materials when course is selected
  useEffect(() => {
    if (selectedCourse) {
      fetchMaterials();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
  try {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = userData.role;
    const userId = userData.id;
    
    let coursesData = [];
    
    // For professors and TAs, fetch only their assigned courses
    if (userRole === 'professor' || userRole === 'ta') {
      const response = await axios.get(
        'http://localhost:5000/api/curriculum/courses',
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { instructorId: userId }
        }
      );
      
      coursesData = response.data?.data?.courses || [];
    } 
    else if (userRole === 'student') {
      const response = await axios.get(
        'http://localhost:5000/api/enrollments/my-enrollments',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const enrollments = response.data?.data?.enrollments || [];

      coursesData = enrollments
        .filter(e => e.status === 'enrolled')
        .map(e =>{
          if (!e.course) return null;
          return {
            ...e.course,
            subject: e.subject,
            code: e.subject?.code,
            name: e.subject?.name
          };
        })
        .filter(Boolean);
    } 
    // Admin / staff unchanged
    else {
      const response = await axios.get(
        'http://localhost:5000/api/curriculum/subjects',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      coursesData = response.data?.data?.subjects || [];
    }
    
    setCourses(Array.isArray(coursesData) ? coursesData : []);
    
    if (coursesData.length > 0) {
      setSelectedCourse(coursesData[0].id);
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    setError('Failed to load courses');
    setCourses([]);
  }
};


  const fetchMaterials = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/materials/course/${selectedCourse}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMaterials(response.data.data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setError('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file size (50MB limit)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file || !title || !selectedCourse) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', selectedCourse);
    formData.append('title', title);
    formData.append('description', description);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/materials/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      );

      setSuccess('Material uploaded successfully!');
      setUploadDialogOpen(false);
      resetForm();
      fetchMaterials();
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Failed to upload material');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (materialId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/materials/download/${materialId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download material');
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/materials/${materialId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Material deleted successfully');
      fetchMaterials();
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.response?.data?.message || 'Failed to delete material');
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <PictureAsPdf />;
    if (fileType.includes('video')) return <VideoLibrary />;
    if (fileType.includes('image')) return <ImageIcon />;
    if (fileType.includes('word') || fileType.includes('document')) return <Description />;
    return <Folder />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MenuBook sx={{ fontSize: 40, mr: 2, color: 'success.main' }} />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Course Materials
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isProfessorOrTA 
                  ? 'Upload and manage course materials' 
                  : 'Access course materials and resources'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Course Selection */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Select Course</InputLabel>
            <Select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              label="Select Course"
            >
              <MenuItem value="">
                <em>Select a course</em>
              </MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {/* Subjects have code/name, Courses have subject.code/subject.name */}
                  {course.code || course.subjectCode || course.subject?.code || 'N/A'} - {course.name || course.subjectName || course.subject?.name || 'N/A'}
                  {course.semester && course.year && ` (${course.semester} ${course.year})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {selectedCourse && (
          <>
            {/* Upload Button for Professors/TAs */}
            {isProfessorOrTA && (
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Upload Material
                </Button>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Materials List */}
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2 }}>Loading materials...</Typography>
              </Box>
            ) : materials.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.100', borderRadius: 2 }}>
                <Typography variant="h6" color="text.secondary">
                  No materials available for this course
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {materials.map((material) => (
                  <Grid item xs={12} sm={6} md={4} key={material.materialId}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          {getFileIcon(material.fileType)}
                          <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }} noWrap>
                            {material.title}
                          </Typography>
                        </Box>
                        
                        {material.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {material.description}
                          </Typography>
                        )}

                        <Box sx={{ mb: 1 }}>
                          <Chip 
                            label={material.fileName} 
                            size="small" 
                            sx={{ maxWidth: '100%' }}
                          />
                        </Box>

                        <Typography variant="caption" color="text.secondary" display="block">
                          Size: {formatFileSize(material.fileSize)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Downloads: {material.downloadCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Uploaded by: {material.uploaderName} ({material.uploaderRole})
                        </Typography>
                      </CardContent>

                      <CardActions>
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleDownload(material.materialId, material.fileName)}
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>

                        {isProfessorOrTA && material.uploadedBy === user.id && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(material.materialId)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Paper>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Course Material</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              sx={{ mb: 2 }}
              disabled={uploading}
            />

            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 2 }}
              disabled={uploading}
            />

            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              disabled={uploading}
            >
              {file ? file.name : 'Choose File'}
              <input
                type="file"
                hidden
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.zip,.rar"
              />
            </Button>

            {file && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                File size: {formatFileSize(file.size)}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
              Allowed file types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, JPG, PNG, GIF, MP4, ZIP, RAR
              <br />
              Maximum file size: 50MB
            </Typography>

            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="caption" sx={{ mt: 1 }}>
                  Uploading... {uploadProgress}%
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            disabled={!file || !title || uploading}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseMaterials;
