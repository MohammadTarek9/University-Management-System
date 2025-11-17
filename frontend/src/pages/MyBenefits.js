// pages/MyBenefits.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@mui/material';
import {
  HealthAndSafety,
  Favorite,
  Visibility,
  LocalHospital,
  Psychology,
  School,
  DirectionsCar,
  FitnessCenter,
  AttachMoney,
  CalendarMonth,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { format } from 'date-fns';

const MyBenefits = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyBenefits();
  }, []);

  const fetchMyBenefits = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/staff/benefits');
      
      if (response.data.success) {
        setBenefits(response.data.data.benefits);
      } else {
        setError('No benefits information available');
      }
    } catch (err) {
      console.error('Error fetching benefits:', err);
      setError(err.response?.data?.message || 'Failed to load benefits information');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCoverageLevel = (level) => {
    if (!level) return 'N/A';
    return level.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !benefits) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          {error || 'No benefits information available. Please contact HR for assistance.'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <HealthAndSafety sx={{ mr: 1, fontSize: 36 }} />
          My Benefits
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your employee benefits package and coverage details.
        </Typography>
        {benefits.benefits_package_tier && (
          <Chip
            label={`${benefits.benefits_package_tier} Package`}
            color="primary"
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Health Insurance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalHospital color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Health Insurance</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Plan</strong></TableCell>
                      <TableCell>{benefits.health_insurance_plan || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Provider</strong></TableCell>
                      <TableCell>{benefits.health_insurance_provider || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Coverage</strong></TableCell>
                      <TableCell>{formatCoverageLevel(benefits.health_insurance_coverage_level)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Monthly Premium</strong></TableCell>
                      <TableCell>{formatCurrency(benefits.health_insurance_premium)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Deductible</strong></TableCell>
                      <TableCell>{formatCurrency(benefits.health_insurance_deductible)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Effective Date</strong></TableCell>
                      <TableCell>{formatDate(benefits.health_insurance_effective_date)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Dental Insurance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Psychology color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Dental Insurance</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Plan</strong></TableCell>
                      <TableCell>{benefits.dental_insurance_plan || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Provider</strong></TableCell>
                      <TableCell>{benefits.dental_insurance_provider || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Coverage</strong></TableCell>
                      <TableCell>{formatCoverageLevel(benefits.dental_insurance_coverage_level)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Monthly Premium</strong></TableCell>
                      <TableCell>{formatCurrency(benefits.dental_insurance_premium)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Effective Date</strong></TableCell>
                      <TableCell>{formatDate(benefits.dental_insurance_effective_date)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Vision Insurance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Visibility color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Vision Insurance</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Plan</strong></TableCell>
                      <TableCell>{benefits.vision_insurance_plan || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Provider</strong></TableCell>
                      <TableCell>{benefits.vision_insurance_provider || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Coverage</strong></TableCell>
                      <TableCell>{formatCoverageLevel(benefits.vision_insurance_coverage_level)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Monthly Premium</strong></TableCell>
                      <TableCell>{formatCurrency(benefits.vision_insurance_premium)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Effective Date</strong></TableCell>
                      <TableCell>{formatDate(benefits.vision_insurance_effective_date)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Life Insurance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Favorite color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Life Insurance</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Plan</strong></TableCell>
                      <TableCell>{benefits.life_insurance_plan || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Coverage Amount</strong></TableCell>
                      <TableCell>{formatCurrency(benefits.life_insurance_coverage_amount)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Beneficiary</strong></TableCell>
                      <TableCell>{benefits.life_insurance_beneficiary || 'Not Specified'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Monthly Premium</strong></TableCell>
                      <TableCell>{formatCurrency(benefits.life_insurance_premium)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Retirement */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Retirement Plan</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Plan Type</strong></TableCell>
                      <TableCell>{benefits.retirement_plan_type || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Your Contribution</strong></TableCell>
                      <TableCell>{benefits.retirement_contribution_percentage ? `${benefits.retirement_contribution_percentage}%` : 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Employer Match</strong></TableCell>
                      <TableCell>{benefits.retirement_employer_match ? `${benefits.retirement_employer_match}%` : 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Vesting Status</strong></TableCell>
                      <TableCell>
                        {benefits.retirement_vested ? (
                          <Chip icon={<CheckCircle />} label="Vested" color="success" size="small" />
                        ) : (
                          <Chip icon={<Cancel />} label="Not Vested" color="default" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                    {benefits.retirement_vesting_date && (
                      <TableRow>
                        <TableCell><strong>Vesting Date</strong></TableCell>
                        <TableCell>{formatDate(benefits.retirement_vesting_date)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Leave Benefits */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarMonth color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Leave & Time Off</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Annual Leave</strong></TableCell>
                      <TableCell>{benefits.annual_leave_days || 0} days</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Sick Leave</strong></TableCell>
                      <TableCell>{benefits.sick_leave_days || 0} days</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Personal Days</strong></TableCell>
                      <TableCell>{benefits.personal_days || 0} days</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Paid Holidays</strong></TableCell>
                      <TableCell>{benefits.paid_holidays || 0} days</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Benefits */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Additional Benefits & Perks
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {/* Tuition Reimbursement */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                    <School sx={{ mr: 2, color: benefits.tuition_reimbursement ? 'success.main' : 'text.disabled' }} />
                    <Box>
                      <Typography variant="subtitle2">Tuition Reimbursement</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {benefits.tuition_reimbursement ? formatCurrency(benefits.tuition_reimbursement_amount) + '/year' : 'Not Enrolled'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Professional Development */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                    <School sx={{ mr: 2, color: benefits.professional_development_budget ? 'primary.main' : 'text.disabled' }} />
                    <Box>
                      <Typography variant="subtitle2">Prof. Development Budget</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {benefits.professional_development_budget ? formatCurrency(benefits.professional_development_budget) + '/year' : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Gym Membership */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                    <FitnessCenter sx={{ mr: 2, color: benefits.gym_membership ? 'success.main' : 'text.disabled' }} />
                    <Box>
                      <Typography variant="subtitle2">Gym Membership</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {benefits.gym_membership ? 'Included' : 'Not Available'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Parking */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                    <DirectionsCar sx={{ mr: 2, color: benefits.parking_benefit ? 'primary.main' : 'text.disabled' }} />
                    <Box>
                      <Typography variant="subtitle2">Parking Benefit</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {benefits.parking_benefit ? 'Included' : 'Not Available'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Commuter */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                    <DirectionsCar sx={{ mr: 2, color: benefits.commuter_benefit ? 'success.main' : 'text.disabled' }} />
                    <Box>
                      <Typography variant="subtitle2">Commuter Benefit</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {benefits.commuter_benefit ? 'Included' : 'Not Available'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* FSA Health */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                    <LocalHospital sx={{ mr: 2, color: benefits.fsa_health_enrolled ? 'success.main' : 'text.disabled' }} />
                    <Box>
                      <Typography variant="subtitle2">Health FSA</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {benefits.fsa_health_enrolled ? formatCurrency(benefits.fsa_health_contribution) + '/year' : 'Not Enrolled'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* FSA Dependent Care */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                    <Favorite sx={{ mr: 2, color: benefits.fsa_dependent_care_enrolled ? 'success.main' : 'text.disabled' }} />
                    <Box>
                      <Typography variant="subtitle2">Dependent Care FSA</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {benefits.fsa_dependent_care_enrolled ? formatCurrency(benefits.fsa_dependent_care_contribution) + '/year' : 'Not Enrolled'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Open Enrollment Info */}
        {benefits.open_enrollment_date && (
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="subtitle2">
                Next Open Enrollment: {formatDate(benefits.open_enrollment_date)}
              </Typography>
              <Typography variant="body2">
                You can make changes to your benefits during the open enrollment period.
              </Typography>
            </Alert>
          </Grid>
        )}

        {/* Additional Notes */}
        {benefits.notes && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Additional Information
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {benefits.notes}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default MyBenefits;
