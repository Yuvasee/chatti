import React, { useState, useEffect } from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface CopyNotificationProps {
  show: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-10px); }
`;

const CopyNotification: React.FC<CopyNotificationProps> = ({ show, anchorEl, onClose }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show && anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8, // Position below the element with a small gap
        left: rect.left + window.scrollX + rect.width / 2, // Center horizontally
      });
      setIsVisible(true);
      
      // Auto-hide after 2 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow fade-out animation to complete
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [show, anchorEl, onClose]);

  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)', // Center the tooltip
        zIndex: 9999,
        pointerEvents: 'none', // Don't interfere with underlying elements
        animation: isVisible 
          ? `${fadeIn} 0.3s ease-out forwards`
          : `${fadeOut} 0.3s ease-out forwards`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'success.light',
          color: 'success.contrastText',
          px: 1.5,
          py: 0.75,
          borderRadius: 1,
          boxShadow: 2,
        }}
      >
        <CheckCircleOutlineIcon fontSize="small" sx={{ mr: 0.5 }} />
        <Typography variant="body2">Copied!</Typography>
      </Box>
    </Box>
  );
};

export default CopyNotification; 