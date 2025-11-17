import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Button
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import ResearchForm from '../pages/ResearchForm';
import ResearchList from '../pages/ResearchList';
import PublicResearchList from '../pages/PublicResearchList';

const ResearchManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingResearch, setEditingResearch] = useState(null);

  // Only professors, TAs, and admins can publish research
  const canPublishResearch = ['professor', 'ta', 'admin'].includes(user?.role);

  if (!canPublishResearch) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            You don't have permission to access this module
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Only professors and teaching assistants can publish research outputs.
          </Typography>
        </Paper>
      </Container>
    );
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setEditingResearch(null);
  };

  const handleSubmitSuccess = () => {
    setActiveTab(1); // Switch to list tab
    setRefreshTrigger(prev => prev + 1); // Trigger refresh
    setEditingResearch(null);
  };

  const handleEdit = (research) => {
    setEditingResearch(research);
    setActiveTab(0); // Switch to form tab
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Research Publication Management
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Document and showcase your academic contributions
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Share your published papers, articles, conference presentations, and research projects.
          Published research will be visible in the public research directory.
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
          <Tab label={editingResearch ? 'Edit Research' : 'Publish Research'} />
          <Tab label="My Research Outputs" />
          <Tab label="Published Researches" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Tab 0: Publish/Edit Research Form */}
          {activeTab === 0 && (
            <>
              {editingResearch && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="text"
                    onClick={() => {
                      setEditingResearch(null);
                    }}
                  >
                    ← Back to New Research
                  </Button>
                </Box>
              )}
              <ResearchForm
                onSubmitSuccess={handleSubmitSuccess}
                editingResearch={editingResearch}
              />
            </>
          )}

          {/* Tab 1: My Research List */}
          {activeTab === 1 && (
            <ResearchList
              isUserOwn={true}
              refreshTrigger={refreshTrigger}
              onEdit={handleEdit}
            />
          )}

          {/* Tab 2: Public Research List */}
          {activeTab === 2 && (
            <PublicResearchList />
          )}
        </Box>
      </Paper>

      {/* Help Section */}
      <Box sx={{ p: 3, bgcolor: 'primary.light', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.contrastText' }}>
          How to Use
        </Typography>

        <Typography variant="body2" sx={{ color: 'primary.contrastText', mb: 2 }}>
          Use the "Publish Research" tab to add your research outputs. Fill in the details about your
          research, including the title, type, publication date, and abstract. You can save research as
          draft or publish it immediately to make it visible on your profile and in the public directory.
        </Typography>

        <Typography variant="subtitle2" sx={{ color: 'primary.contrastText', fontWeight: 600, mb: 1 }}>
          Supported Research Types:
        </Typography>
        <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
          • Paper • Article • Book • Conference • Project • Other
        </Typography>

        <Typography variant="subtitle2" sx={{ color: 'primary.contrastText', fontWeight: 600, mb: 1, mt: 2 }}>
          Tips:
        </Typography>
        <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
          • Keep titles concise and descriptive<br />
          • Add relevant keywords to improve visibility<br />
          • Include a DOI or URL for published work (optional)<br />
          • Write a clear abstract summarizing your research<br />
          • Publish to make research visible on your academic profile and public directory<br />
          • Use drafts to save work in progress<br />
          • Browse all published research in the "Published Researches" tab
        </Typography>
      </Box>
    </Container>
  );
};

export default ResearchManagement;