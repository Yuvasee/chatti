import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem
} from '@mui/material';
import { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import { copyLinkToClipboard, shareChat } from '../utils';
import CopyNotification from './CopyNotification';
import LanguageSelector from './LanguageSelector';

interface ChatHeaderProps {
  chatId: string;
  isConnected?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  chatId, 
  isConnected = true
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<HTMLElement | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopyLink = (event: React.MouseEvent<HTMLElement>) => {
    copyLinkToClipboard(chatId);
    setNotificationAnchorEl(event.currentTarget);
    setShowCopyNotification(true);
    handleMenuClose();
  };

  const handleShare = () => {
    shareChat(chatId);
    handleMenuClose();
  };

  const handleCloseNotification = () => {
    setShowCopyNotification(false);
    setNotificationAnchorEl(null);
  };

  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ mr: 2 }}>
            Chatti
          </Typography>
          <Typography 
            variant="body2" 
            component="div"
            noWrap 
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.15)', 
              borderRadius: 1,
              px: 1.5,
              py: 0.5,
              fontFamily: 'monospace',
              maxWidth: { xs: '160px', sm: '320px' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.25)',
              }
            }}
            onClick={handleCopyLink}
            title="Click to copy chat ID"
          >
            {chatId}
            <ContentCopyIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.9rem' }} />
          </Typography>
        </Box>
        
        <LanguageSelector variant="simple" />
        
        <IconButton
          aria-label="more"
          aria-controls="chat-menu"
          aria-haspopup="true"
          onClick={handleMenuClick}
          color="inherit"
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id="chat-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          MenuListProps={{
            'aria-labelledby': 'chat-menu-button',
          }}
        >
          <MenuItem onClick={handleCopyLink}>
            <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
            Copy chat link
          </MenuItem>
          <MenuItem onClick={handleShare}>
            <ShareIcon fontSize="small" sx={{ mr: 1 }} />
            Share chat
          </MenuItem>
        </Menu>

        <CopyNotification 
          show={showCopyNotification}
          anchorEl={notificationAnchorEl}
          onClose={handleCloseNotification}
        />
      </Toolbar>
    </AppBar>
  );
};

export default ChatHeader; 