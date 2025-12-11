import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FirstLoginPasswordChange from '../auth/FirstLoginPasswordChange';

const MainLayout = ({ children }) => {
  const { user, requirePasswordChange, updateAuthAfterPasswordChange } = useAuth();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user needs to change password on first login
    if (user && (requirePasswordChange || user.firstLogin || user.mustChangePassword)) {
      setShowPasswordChange(true);
    }
  }, [user, requirePasswordChange]);

  const handlePasswordChangeSuccess = async (responseData) => {
    setShowPasswordChange(false);
    
    // Update auth context with new token and user data
    if (responseData && responseData.token && responseData.user) {
      updateAuthAfterPasswordChange(responseData.token, responseData.user);
    }
    
    // Navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <>
      {children}
      <FirstLoginPasswordChange
        open={showPasswordChange}
        onClose={() => {}} // Prevent closing - required for first login
        onSuccess={handlePasswordChangeSuccess}
      />
    </>
  );
};

export default MainLayout;