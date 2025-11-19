import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import FirstLoginPasswordChange from '../auth/FirstLoginPasswordChange';

const MainLayout = ({ children }) => {
  const { user, requirePasswordChange, firstLoginChangePassword } = useAuth();
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    // Check if user needs to change password on first login
    if (user && (requirePasswordChange || user.firstLogin || user.mustChangePassword)) {
      setShowPasswordChange(true);
    }
  }, [user, requirePasswordChange]);

  const handlePasswordChangeSuccess = async () => {
    setShowPasswordChange(false);
    // Optionally refresh the page or redirect
    window.location.reload();
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