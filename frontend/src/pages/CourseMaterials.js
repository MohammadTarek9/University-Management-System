import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
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
  Chip,
  LinearProgress,
  Grid,
} from '@mui/material';
import { MenuBook, CloudUpload, PictureAsPdf, VideoLibrary, Image as ImageIcon, Description, Folder } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
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

  useEffect(() => {
  const loadForProfessor = async () => {
    await fetchCourses(); // this will call fetchMaterials via selectedCourse effect
  };

  const loadForStudent = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/materials/all',
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

  if (isProfessorOrTA) {
    loadForProfessor();
  } else {
    loadForStudent();
  }
}, []);

 useEffect(() => {
  if (!isProfessorOrTA) return;
  if (!selectedCourse) return;
  fetchMaterials();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedCourse]);

 
 const fetchCourses = async () => {
  try {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = userData.role;
    const userId = userData.id;

    let coursesData = [];

    if (userRole === 'professor' || userRole === 'ta') {
      const response = await axios.get('http://localhost:5000/api/curriculum/courses', {
        headers: { Authorization: `Bearer ${token}` },
        params: { instructorId: userId }
      });
      coursesData = response.data?.data?.courses || [];
    } else {
      const response = await axios.get('http://localhost:5000/api/curriculum/subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
        responseType: 'blob',
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(
      'Download error:',
      error.response?.status,
      error.response?.data
    );

    if (error.response && error.response.status === 404) {
      // matches materialController: 404 for missing record or file_path
      setError('Material unavailable.');
    } else {
      setError('Failed to download material');
    }
  }
};

const handleOpen = async (materialId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `http://localhost:5000/api/materials/view/${materialId}`, // <– changed
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      }
    );

    const blob = new Blob([response.data], {
      type: response.data.type || 'application/pdf',
    });
    const fileURL = window.URL.createObjectURL(blob);
    window.open(fileURL, '_blank');
  } catch (error) {
    console.error('Open error:', error);
    if (error.response && error.response.status === 404) {
      setError('Material unavailable.');
    } else {
      setError('Failed to open material');
    }
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
{error && (
  <Box sx={{ mb: 2 }}>
    <Alert severity="error">{error}</Alert>
  </Box>
)}

{success && (
  <Box sx={{ mb: 2 }}>
    <Alert severity="success">{success}</Alert>
  </Box>
)}

{/* Course selector */}
<Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
  {isProfessorOrTA && (
    <FormControl sx={{ minWidth: 240 }} size="small">
      <InputLabel id="course-select-label">Course</InputLabel>
      <Select
        labelId="course-select-label"
        label="Course"
        value={selectedCourse}
        onChange={(e) => setSelectedCourse(e.target.value)}
      >
        {courses.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.code ? `${c.code} - ${c.name}` : c.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )}

  {isProfessorOrTA && (
    <Button
      variant="contained"
      startIcon={<CloudUpload />}
      onClick={() => {
        setUploadDialogOpen(true);
        setError('');
        setSuccess('');
      }}
    >
      Upload Material
    </Button>
  )}
</Box>


{/* Materials list */}
{loading ? (
  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
    <CircularProgress />
  </Box>
) : materials.length === 0 ? (
  <Typography variant="body2" color="text.secondary">
    No materials uploaded yet.
  </Typography>
) : (
  <Grid container spacing={2}>
    {materials.map((m) => (
      <Grid item xs={12} sm={6} md={4} key={m.materialId}>
        <Card variant="outlined">
         <CardContent>
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
    <Box sx={{ mr: 1 }}>{getFileIcon(m.fileType || '')}</Box>
    <Typography variant="subtitle1" noWrap>
      {m.title || m.fileName}
    </Typography>
  </Box>

  {/* Course code + name (NEW) */}
  {(m.courseCode || m.courseName) && (
    <Typography variant="caption" color="text.secondary" display="block">
      {m.courseCode ? `${m.courseCode} – ${m.courseName}` : m.courseName}
    </Typography>
  )}

  {/* Single file name line */}
  <Typography variant="body2" color="text.secondary" noWrap>
    {m.fileName}
  </Typography>

  {/* Single description line */}
  {m.description && (
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mt: 1 }}
      noWrap
    >
      {m.description}
    </Typography>
  )}

  <Box sx={{ mt: 1 }}>
    <Chip
      size="small"
      label={formatFileSize(m.fileSize || 0)}
      sx={{ mr: 0.5 }}
    />
    {typeof m.downloadCount === 'number' && (
      <Chip
        size="small"
        label={`${m.downloadCount} downloads`}
        color="default"
        variant="outlined"
      />
    )}
  </Box>
</CardContent>

          <CardActions sx={{ justifyContent: 'space-between' }}>
            <Button size="small" onClick={() => handleOpen(m.materialId)}>
               Open
               </Button>

               <Button size="small" onClick={() => handleDownload(m.materialId, m.fileName)} >
               Download
               </Button>
          {isProfessorOrTA && (
           <Button
           size="small"
           color="error"
           onClick={() => handleDelete(m.materialId)}
           >
           Delete
         </Button>
           )}
          </CardActions>

        </Card>
      </Grid>
    ))}
  </Grid>
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
