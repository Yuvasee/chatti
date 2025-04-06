import { Box, Paper, Typography, Avatar, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { formatTime } from '../utils';

interface ChatMessageProps {
  content: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
  timestamp: Date;
  isCurrentUser: boolean;
  translations?: {
    language: string;
    text: string;
  }[];
  selectedLanguage: string;
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
  wordBreak: 'break-word',
}));

const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  sender,
  timestamp,
  isCurrentUser,
  translations = [],
  selectedLanguage,
}) => {
  // Get translation for selected language, if available
  const translation = translations.find(t => t.language === selectedLanguage);
  
  // Format timestamp using the utility function
  const formattedTime = formatTime(timestamp);

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
          flexDirection: isCurrentUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: 1,
        }}
      >
        {!isCurrentUser && (
          <Tooltip title={sender.name} arrow>
            <Avatar 
              src={sender.avatar} 
              alt={sender.name} 
              sx={{ width: 36, height: 36 }}
            />
          </Tooltip>
        )}

        <Box>
          {!isCurrentUser && (
            <Typography variant="caption" sx={{ ml: 1.5, display: 'block', mb: 0.5 }}>
              {sender.name}
            </Typography>
          )}
          
          <MessagePaper isCurrentUser={isCurrentUser}>
            <Typography variant="body1">
              {translation ? translation.text : content}
            </Typography>
            
            {translation && (
              <Tooltip title="Original message" arrow>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    mt: 1, 
                    pt: 1, 
                    borderTop: '1px solid rgba(0,0,0,0.1)',
                    fontStyle: 'italic',
                    opacity: 0.7,
                  }}
                >
                  {content}
                </Typography>
              </Tooltip>
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