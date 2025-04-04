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
  InputLabel 
} from '@mui/material';
import { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';

interface ChatHeaderProps {
  chatId: string;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  chatId, 
  selectedLanguage, 
  onLanguageChange 
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/chat/${chatId}`;
    navigator.clipboard.writeText(url);
    handleMenuClose();
  };

  const handleShare = () => {
    // Would implement native share API here for mobile
    const url = `${window.location.origin}/chat/${chatId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join my Chatti chat',
        text: 'Join my multilingual chat on Chatti!',
        url: url,
      });
    } else {
      handleCopyLink();
    }
    handleMenuClose();
  };

  const handleLanguageChange = (event: SelectChangeEvent) => {
    onLanguageChange(event.target.value);
  };

  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ mr: 2 }}>
            Chatti
          </Typography>
          <Typography 
            variant="body1" 
            component="div" 
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.15)', 
              borderRadius: 1,
              px: 1.5,
              py: 0.5,
              fontFamily: 'monospace'
            }}
          >
            {chatId}
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
      </Toolbar>
    </AppBar>
  );
};

export default ChatHeader; 