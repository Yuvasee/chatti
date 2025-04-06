import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Select, 
  SelectChangeEvent, 
  FormControl, 
} from '@mui/material';
import { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import { copyLinkToClipboard, shareChat } from '../utils';
import CopyNotification from './CopyNotification';

interface ChatHeaderProps {
  chatId: string;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  isConnected?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  chatId, 
  selectedLanguage, 
  onLanguageChange,
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

  const handleLanguageChange = (event: SelectChangeEvent) => {
    onLanguageChange(event.target.value);
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
        
        <FormControl variant="outlined" size="small" sx={{ 
          minWidth: 120, 
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: 1,
          mr: 1,
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none'
          }
        }}>
          <Select
            value={selectedLanguage}
            onChange={handleLanguageChange}
            displayEmpty
            inputProps={{ 'aria-label': 'Language' }}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Español</MenuItem>
            <MenuItem value="fr">Français</MenuItem>
            <MenuItem value="de">Deutsch</MenuItem>
            <MenuItem value="ja">日本語</MenuItem>
            <MenuItem value="zh">中文</MenuItem>
            <MenuItem value="ru">Русский</MenuItem>
          </Select>
        </FormControl>
        
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