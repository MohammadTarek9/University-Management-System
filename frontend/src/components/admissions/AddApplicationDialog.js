import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Close,
  Person,
  School,
  AttachFile,
  CloudUpload,
  Delete,
  CheckCircle
} from '@mui/icons-material';
// Removed DatePicker imports due to compatibility issues
// Using HTML5 date input instead
import { applicationService } from '../../services/applicationService';

const steps = ['Personal Information', 'Academic Information', 'Documents & Submit'];

// Default nationality options
const defaultNationalities = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine',
  'Armenian', 'Australian', 'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini',
  'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian', 'Belizean', 'Beninese',
  'Bhutanese', 'Bolivian', 'Bosnian', 'Brazilian', 'British', 'Bulgarian',
  'Burkinabe', 'Burundian', 'Cambodian', 'Cameroonian', 'Canadian', 'Cape Verdean',
  'Central African', 'Chadian', 'Chilean', 'Chinese', 'Colombian', 'Comoran',
  'Congolese', 'Costa Rican', 'Croatian', 'Cuban', 'Cypriot', 'Czech', 'Danish',
  'Djiboutian', 'Dominican', 'Dutch', 'East Timorese', 'Ecuadorean', 'Egyptian',
  'Emirian', 'Equatorial Guinean', 'Eritrean', 'Estonian', 'Ethiopian', 'Fijian',
  'Filipino', 'Finnish', 'French', 'Gabonese', 'Gambian', 'Georgian', 'German',
  'Ghanaian', 'Greek', 'Grenadian', 'Guatemalan', 'Guinea-Bissauan', 'Guinean',
  'Guyanese', 'Haitian', 'Herzegovinian', 'Honduran', 'Hungarian', 'I-Kiribati',
  'Icelandic', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli',
  'Italian', 'Ivorian', 'Jamaican', 'Japanese', 'Jordanian', 'Kazakhstani',
  'Kenyan', 'Kittian and Nevisian', 'Kuwaiti', 'Kyrgyz', 'Laotian', 'Latvian',
  'Lebanese', 'Liberian', 'Libyan', 'Liechtensteiner', 'Lithuanian', 'Luxembourgish',
  'Macedonian', 'Malagasy', 'Malawian', 'Malaysian', 'Maldivan', 'Malian', 'Maltese',
  'Marshallese', 'Mauritanian', 'Mauritian', 'Mexican', 'Micronesian', 'Moldovan',
  'Monacan', 'Mongolian', 'Moroccan', 'Mosotho', 'Motswana', 'Mozambican',
  'Namibian', 'Nauruan', 'Nepalese', 'New Zealander', 'Nicaraguan', 'Nigerian',
  'Nigerien', 'North Korean', 'Northern Irish', 'Norwegian', 'Omani', 'Pakistani',
  'Palauan', 'Panamanian', 'Papua New Guinean', 'Paraguayan', 'Peruvian',
  'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Rwandan',
  'Saint Lucian', 'Salvadoran', 'Samoan', 'San Marinese', 'Sao Tomean',
  'Saudi', 'Scottish', 'Senegalese', 'Serbian', 'Seychellois', 'Sierra Leonean',
  'Singaporean', 'Slovakian', 'Slovenian', 'Solomon Islander', 'Somali',
  'South African', 'South Korean', 'Spanish', 'Sri Lankan', 'Sudanese',
  'Surinamer', 'Swazi', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese', 'Tajik',
  'Tanzanian', 'Thai', 'Togolese', 'Tongan', 'Trinidadian or Tobagonian',
  'Tunisian', 'Turkish', 'Tuvaluan', 'Ugandan', 'Ukrainian', 'Uruguayan',
  'Uzbekistani', 'Venezuelan', 'Vietnamese', 'Welsh', 'Yemenite', 'Zambian', 'Zimbabwean'
];

const initialFormData = {
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  },
  academicInfo: {
    program: '',
    degreeLevel: '',
    intendedStartDate: '',
    previousEducation: {
      institution: '',
      degree: '',
      graduationDate: ''
    }
  },
  documents: []
};

const AddApplicationDialog = ({ open, onClose, onSuccess, editMode = false, existingApplication = null }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    programs: [],
    degreeLevels: [],
    nationalities: defaultNationalities
  });

  // Reset dialog state when it opens
  useEffect(() => {
    if (open) {
      setErrors({});
      setSubmitError('');
      setActiveStep(0);
      setIsInitialized(false);
    }
  }, [open]);

  // Initialize form data when existingApplication changes (for edit mode)
  useEffect(() => {
    if (editMode && existingApplication && !isInitialized) {
      
      // Format dates for HTML5 date inputs
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        } catch {
          return '';
        }
      };

      const newFormData = {
        personalInfo: {
          firstName: existingApplication.personalInfo?.firstName || '',
          lastName: existingApplication.personalInfo?.lastName || '',
          email: existingApplication.personalInfo?.email || '',
          phone: existingApplication.personalInfo?.phone || '',
          dateOfBirth: formatDateForInput(existingApplication.personalInfo?.dateOfBirth),
          nationality: existingApplication.personalInfo?.nationality || '',
          address: {
            street: existingApplication.personalInfo?.address?.street || '',
            city: existingApplication.personalInfo?.address?.city || '',
            state: existingApplication.personalInfo?.address?.state || '',
            zipCode: existingApplication.personalInfo?.address?.zipCode || '',
            country: existingApplication.personalInfo?.address?.country || ''
          }
        },
        academicInfo: {
          program: existingApplication.academicInfo?.program || '',
          degreeLevel: existingApplication.academicInfo?.degreeLevel || '',
          intendedStartDate: formatDateForInput(existingApplication.academicInfo?.intendedStartDate),
          previousEducation: {
            institution: existingApplication.academicInfo?.previousEducation?.institution || '',
            degree: existingApplication.academicInfo?.previousEducation?.degree || '',
            graduationDate: formatDateForInput(existingApplication.academicInfo?.previousEducation?.graduationDate)
          }
        },
        documents: existingApplication.documents || []
      };
      
      setFormData(newFormData);
      setIsInitialized(true);
      
    } else if (!editMode && !existingApplication && !isInitialized) {
      setFormData(initialFormData);
      setIsInitialized(true);
    }
  }, [editMode, existingApplication, isInitialized]);

  // Load filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await applicationService.getFilterOptions();
        if (response.success) {
          setFilterOptions({
            programs: response.data.programs || [],
            degreeLevels: response.data.degreeLevels || [],
            nationalities: response.data.nationalities && response.data.nationalities.length > 0 ? response.data.nationalities : defaultNationalities
          });
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
        // Fallback to default values if API fails
        setFilterOptions({
          programs: [],
          degreeLevels: [],
          nationalities: defaultNationalities
        });
      }
    };

    if (open) {
      fetchFilterOptions();
    }
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setFormData(initialFormData);
      setErrors({});
      setSubmitError('');
    }
  }, [open]);

  // Handle input changes
  const handleInputChange = (section, field, value, subField = null) => {
    setFormData(prev => {
      if (subField) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: {
              ...prev[section][field],
              [subField]: value
            }
          }
        };
      } else {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      }
    });

    // Clear error for this field
    const errorKey = subField ? `${section}.${field}.${subField}` : `${section}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Validate step
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      // Personal Information validation
      if (!formData.personalInfo.firstName.trim()) {
        newErrors['personalInfo.firstName'] = 'First name is required';
      }
      if (!formData.personalInfo.lastName.trim()) {
        newErrors['personalInfo.lastName'] = 'Last name is required';
      }
      if (!formData.personalInfo.email.trim()) {
        newErrors['personalInfo.email'] = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.personalInfo.email)) {
        newErrors['personalInfo.email'] = 'Email is invalid';
      }
      if (!formData.personalInfo.phone.trim()) {
        newErrors['personalInfo.phone'] = 'Phone number is required';
      }
      if (!formData.personalInfo.dateOfBirth || formData.personalInfo.dateOfBirth.trim() === '') {
        newErrors['personalInfo.dateOfBirth'] = 'Date of birth is required';
      }
      if (!formData.personalInfo.nationality.trim()) {
        newErrors['personalInfo.nationality'] = 'Nationality is required';
      }
      if (!formData.personalInfo.address.street.trim()) {
        newErrors['personalInfo.address.street'] = 'Street address is required';
      }
      if (!formData.personalInfo.address.city.trim()) {
        newErrors['personalInfo.address.city'] = 'City is required';
      }
      if (!formData.personalInfo.address.state.trim()) {
        newErrors['personalInfo.address.state'] = 'State/Province is required';
      }
      if (!formData.personalInfo.address.zipCode.trim()) {
        newErrors['personalInfo.address.zipCode'] = 'ZIP/Postal code is required';
      }
      if (!formData.personalInfo.address.country.trim()) {
        newErrors['personalInfo.address.country'] = 'Country is required';
      }
    } else if (step === 1) {
      // Academic Information validation
      if (!formData.academicInfo.program.trim()) {
        newErrors['academicInfo.program'] = 'Program is required';
      }
      if (!formData.academicInfo.degreeLevel.trim()) {
        newErrors['academicInfo.degreeLevel'] = 'Degree level is required';
      }
      if (!formData.academicInfo.intendedStartDate || formData.academicInfo.intendedStartDate.trim() === '') {
        newErrors['academicInfo.intendedStartDate'] = 'Intended start date is required';
      }
      if (!formData.academicInfo.previousEducation.institution.trim()) {
        newErrors['academicInfo.previousEducation.institution'] = 'Previous institution is required';
      }
      if (!formData.academicInfo.previousEducation.degree.trim()) {
        newErrors['academicInfo.previousEducation.degree'] = 'Previous degree is required';
      }
      if (!formData.academicInfo.previousEducation.graduationDate || formData.academicInfo.previousEducation.graduationDate.trim() === '') {
        newErrors['academicInfo.previousEducation.graduationDate'] = 'Graduation date is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  // Handle previous step
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(1)) { // Validate academic info again
      return;
    }

    try {
      setLoading(true);
      setSubmitError('');

      // Prepare form data for submission
      const submissionData = {
        ...formData,
        // Only include documents if there are any, and they have proper structure
        documents: formData.documents.filter(doc => doc.name && doc.type && doc.filePath)
      };
      
      // Remove applicationId as it should be auto-generated by backend
      delete submissionData.applicationId;

      let response;
      if (editMode && existingApplication) {
        response = await applicationService.updateApplication(existingApplication._id, submissionData);
      } else {
        response = await applicationService.createApplication(submissionData);
      }

      if (response.success) {
        onSuccess && onSuccess(response.data);
        onClose();
      } else {
        setSubmitError(response.message || `Failed to ${editMode ? 'update' : 'submit'} application`);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitError(error.response?.data?.message || error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload (placeholder for now)
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newDocuments = files.map(file => {
      // Map file types to backend enum values
      let docType = 'other';
      if (file.name.toLowerCase().includes('transcript')) {
        docType = 'transcript';
      } else if (file.name.toLowerCase().includes('recommendation') || file.name.toLowerCase().includes('letter')) {
        docType = 'recommendation_letter';
      } else if (file.name.toLowerCase().includes('statement') || file.name.toLowerCase().includes('personal')) {
        docType = 'personal_statement';
      } else if (file.name.toLowerCase().includes('cv') || file.name.toLowerCase().includes('resume')) {
        docType = 'cv_resume';
      } else if (file.name.toLowerCase().includes('portfolio')) {
        docType = 'portfolio';
      }
      
      return {
        name: file.name,
        type: docType,
        filePath: `/uploads/${file.name}`, // Placeholder path
        size: file.size,
        mimeType: file.type,
        uploaded: false
      };
    });
    
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...newDocuments]
    }));
  };

  // Remove document
  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  // Get step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.personalInfo.firstName}
                  onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                  error={!!errors['personalInfo.firstName']}
                  helperText={errors['personalInfo.firstName']}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.personalInfo.lastName}
                  onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                  error={!!errors['personalInfo.lastName']}
                  helperText={errors['personalInfo.lastName']}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.personalInfo.email}
                  onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                  error={!!errors['personalInfo.email']}
                  helperText={errors['personalInfo.email']}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.personalInfo.phone}
                  onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                  error={!!errors['personalInfo.phone']}
                  helperText={errors['personalInfo.phone']}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={formData.personalInfo.dateOfBirth || ''}
                  onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                  error={!!errors['personalInfo.dateOfBirth']}
                  helperText={errors['personalInfo.dateOfBirth']}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!errors['personalInfo.nationality']}>
                  <InputLabel>Nationality</InputLabel>
                  <Select
                    value={formData.personalInfo.nationality}
                    label="Nationality"
                    onChange={(e) => handleInputChange('personalInfo', 'nationality', e.target.value)}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          width: 250,
                        },
                      },
                    }}
                  >
                    {(filterOptions.nationalities && filterOptions.nationalities.length > 0 ? filterOptions.nationalities : defaultNationalities).map((nationality) => (
                      <MenuItem key={nationality} value={nationality}>
                        {nationality}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors['personalInfo.nationality'] && (
                    <FormHelperText>{errors['personalInfo.nationality']}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Chip label="Address Information" />
                </Divider>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  value={formData.personalInfo.address.street}
                  onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value, 'street')}
                  error={!!errors['personalInfo.address.street']}
                  helperText={errors['personalInfo.address.street']}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.personalInfo.address.city}
                  onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value, 'city')}
                  error={!!errors['personalInfo.address.city']}
                  helperText={errors['personalInfo.address.city']}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State/Province"
                  value={formData.personalInfo.address.state}
                  onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value, 'state')}
                  error={!!errors['personalInfo.address.state']}
                  helperText={errors['personalInfo.address.state']}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ZIP/Postal Code"
                  value={formData.personalInfo.address.zipCode}
                  onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value, 'zipCode')}
                  error={!!errors['personalInfo.address.zipCode']}
                  helperText={errors['personalInfo.address.zipCode']}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={formData.personalInfo.address.country}
                  onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value, 'country')}
                  error={!!errors['personalInfo.address.country']}
                  helperText={errors['personalInfo.address.country']}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Academic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!errors['academicInfo.program']}>
                  <InputLabel>Program</InputLabel>
                  <Select
                    value={formData.academicInfo.program}
                    label="Program"
                    onChange={(e) => handleInputChange('academicInfo', 'program', e.target.value)}
                  >
                    {filterOptions.programs.map((program) => (
                      <MenuItem key={program} value={program}>
                        {program}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors['academicInfo.program'] && (
                    <FormHelperText>{errors['academicInfo.program']}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!errors['academicInfo.degreeLevel']}>
                  <InputLabel>Degree Level</InputLabel>
                  <Select
                    value={formData.academicInfo.degreeLevel}
                    label="Degree Level"
                    onChange={(e) => handleInputChange('academicInfo', 'degreeLevel', e.target.value)}
                  >
                    {filterOptions.degreeLevels.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors['academicInfo.degreeLevel'] && (
                    <FormHelperText>{errors['academicInfo.degreeLevel']}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Intended Start Date"
                  type="date"
                  value={formData.academicInfo.intendedStartDate || ''}
                  onChange={(e) => handleInputChange('academicInfo', 'intendedStartDate', e.target.value)}
                  error={!!errors['academicInfo.intendedStartDate']}
                  helperText={errors['academicInfo.intendedStartDate']}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Chip label="Previous Education" />
                </Divider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Previous Institution"
                  value={formData.academicInfo.previousEducation.institution}
                  onChange={(e) => handleInputChange('academicInfo', 'previousEducation', e.target.value, 'institution')}
                  error={!!errors['academicInfo.previousEducation.institution']}
                  helperText={errors['academicInfo.previousEducation.institution']}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Previous Degree"
                  value={formData.academicInfo.previousEducation.degree}
                  onChange={(e) => handleInputChange('academicInfo', 'previousEducation', e.target.value, 'degree')}
                  error={!!errors['academicInfo.previousEducation.degree']}
                  helperText={errors['academicInfo.previousEducation.degree']}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Graduation Date"
                  type="date"
                  value={formData.academicInfo.previousEducation.graduationDate || ''}
                  onChange={(e) => handleInputChange('academicInfo', 'previousEducation', e.target.value, 'graduationDate')}
                  error={!!errors['academicInfo.previousEducation.graduationDate']}
                  helperText={errors['academicInfo.previousEducation.graduationDate']}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>


            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Documents & Submit
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Upload Supporting Documents
              </Typography>
              <input
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="document-upload"
                multiple
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="document-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Choose Files
                </Button>
              </label>

              {formData.documents.length > 0 && (
                <List>
                  {formData.documents.map((doc, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <AttachFile />
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.name}
                        secondary={`Type: ${doc.type}${doc.size ? ` • ${(doc.size / 1024).toFixed(1)} KB` : ''}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => removeDocument(index)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG. Max 10MB per file.<br/>
                Document types are auto-detected from filename (transcript, recommendation letter, CV/resume, etc.)<br/>
                <strong>Note:</strong> Documents are optional and can be uploaded later.
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Application Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Name:</Typography>
                  <Typography variant="body1">
                    {formData.personalInfo.firstName} {formData.personalInfo.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Email:</Typography>
                  <Typography variant="body1">{formData.personalInfo.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Program:</Typography>
                  <Typography variant="body1">{formData.academicInfo.program}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Degree Level:</Typography>
                  <Typography variant="body1">{formData.academicInfo.degreeLevel}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Documents:</Typography>
                  <Typography variant="body1">
                    {formData.documents.length} file(s) attached
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{editMode ? 'Edit Application' : 'Add New Application'}</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ width: '100%', mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  icon={
                    index === 0 ? <Person /> :
                    index === 1 ? <School /> :
                    <CheckCircle />
                  }
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        {getStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <CheckCircle />}
          >
            {loading ? (editMode ? 'Updating...' : 'Submitting...') : (editMode ? 'Update Application' : 'Submit Application')}
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

export default AddApplicationDialog;