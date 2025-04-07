import { Box, Paper, Typography, Avatar, Tooltip, CircularProgress, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { formatTime } from '../utils';
import { useChat } from '../contexts/ChatContext';
import { Message } from '../contexts/ChatContext';
import { TranslationService } from '../api';
import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
}

const MessagePaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isCurrentUser',
})<{ isCurrentUser: boolean }>(({ theme, isCurrentUser }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(2),
  borderTopRightRadius: isCurrentUser ? 0 : theme.spacing(2),
  borderTopLeftRadius: !isCurrentUser ? 0 : theme.spacing(2),
  backgroundColor: isCurrentUser ? theme.palette.primary.light : theme.palette.grey[100],
  color: isCurrentUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  maxWidth: '75%',
  width: 'fit-content',
  wordBreak: 'break-word',
}));

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isCurrentUser,
}) => {
  const { currentLanguage } = useChat();
  const { content, username, createdAt, translations, language, id } = message;
  const [showOriginal, setShowOriginal] = useState(false);
  
  // Generate avatar URL from username for consistency
  const avatarUrl = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${username}`;
  
  // Get translation for selected language, if available
  const translatedText = translations?.[currentLanguage];
  const hasTranslation = !!translatedText;
  
  // Check if translation is needed or pending
  const isTranslationNeeded = !isCurrentUser && currentLanguage !== language && !hasTranslation;
  const isPendingTranslation = isTranslationNeeded && TranslationService.isPendingTranslation(id, currentLanguage);
  
  // Format timestamp using the utility function
  const timestamp = new Date(createdAt);
  const formattedTime = formatTime(timestamp);

  // Check if currently using default language (English)
  const isDefaultLanguage = currentLanguage === 'en';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          flexDirection: isCurrentUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: 1,
        }}
      >
        {!isCurrentUser && (
          <Tooltip title={username} arrow>
            <Avatar 
              src={avatarUrl} 
              alt={username} 
              sx={{ width: 36, height: 36 }}
            />
          </Tooltip>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: isCurrentUser ? 'flex-end' : 'flex-start' }}>
          {!isCurrentUser && (
            <Typography variant="caption" sx={{ ml: 1.5, display: 'block', mb: 0.5 }}>
              {username}
            </Typography>
          )}
          
          <MessagePaper isCurrentUser={isCurrentUser}>
            <Typography variant="body1">
              {hasTranslation ? translatedText : content}
            </Typography>
            
            {/* Show original text toggle if this is a translation and not using default language */}
            {hasTranslation && !isDefaultLanguage && (
              <>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mt: 0.5,
                    pt: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      px: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      bgcolor: isCurrentUser ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                      '&:hover': {
                        bgcolor: isCurrentUser ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.08)',
                      },
                    }}
                    onClick={() => setShowOriginal(!showOriginal)}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        color: isCurrentUser ? 'inherit' : 'text.secondary',
                      }}
                    >
                      {showOriginal ? 'Hide original' : 'Show original'}
                      {showOriginal ? 
                        <ExpandLessIcon fontSize="small" sx={{ ml: 0.5 }} /> : 
                        <ExpandMoreIcon fontSize="small" sx={{ ml: 0.5 }} />
                      }
                    </Typography>
                  </Box>
                </Box>
                
                {showOriginal && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      mt: 0.5,
                      opacity: 0.7,
                    }}
                  >
                    {content}
                  </Typography>
                )}
              </>
            )}
            
            {/* Show translation status indicator */}
            {isPendingTranslation && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 1,
                pt: 1,
                borderTop: '1px solid rgba(0,0,0,0.1)',
                opacity: 0.7 
              }}>
                <CircularProgress size={12} sx={{ mr: 1 }} />
                <Typography variant="caption">
                  Translating to {currentLanguage.toUpperCase()}...
                </Typography>
              </Box>
            )}
          </MessagePaper>
          
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              display: 'block',
              mt: 0.5,
              ml: isCurrentUser ? 0 : 1.5,
              mr: isCurrentUser ? 1.5 : 0,
              textAlign: isCurrentUser ? 'right' : 'left',
            }}
          >
            {formattedTime}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatMessage; 