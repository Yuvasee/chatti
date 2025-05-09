import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Divider, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ChatHeader from '../components/ChatHeader';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import { useAuth, useChat } from '../contexts';
import { Message } from '../contexts/ChatContext';
import { createTypingHandler, formatMessage } from '../utils';

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, setUserLanguage } = useAuth();
  const { 
    messages, 
    isLoading, 
    isConnected, 
    error, 
    joinChat, 
    sendMessage, 
    startTyping, 
    stopTyping,
    currentChatId,
    clearError
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showError, setShowError] = useState(false);
  
  // Setup typing handler
  const { handleTyping } = createTypingHandler(startTyping, stopTyping);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Ensure we pass the current location so we can come back to this chat after login
      navigate('/login', { state: { from: location } });
    }
  }, [isAuthenticated, navigate, location]);

  // Join chat when component mounts
  useEffect(() => {
    if (isAuthenticated && chatId && currentChatId !== chatId) {
      joinChat(chatId).catch(err => {
        console.error('Failed to join chat:', err);
      });
    }
  }, [chatId, isAuthenticated, joinChat, currentChatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Chat error:', error);
      setShowError(true);
    }
  }, [error]);

  const handleSendMessage = async (content: string) => {
    if (!user || !chatId) return;
    
    try {
      await sendMessage(content, user.language);
    } catch (err) {
      console.error('Failed to send message:', err);
      
      // Check for NOT_CHAT_MEMBER error code
      const errorCode = (err as any)?.code;
      if (errorCode === 'NOT_CHAT_MEMBER') {
        try {
          // Rejoin the chat and try again
          await joinChat(chatId);
          await sendMessage(content, user.language);
        } catch (retryErr) {
          console.error('Failed to resend message after rejoining:', retryErr);
          setShowError(true);
        }
      } else {
        setShowError(true);
      }
    }
  };

  const handleCloseError = () => {
    setShowError(false);
    clearError();
  };

  if (!chatId || !user) {
    return null;
  }

  // Sort messages by timestamp chronologically (oldest first)
  const formattedMessages = messages
    .slice() // Create a copy to avoid mutating the original array
    .sort((a, b) => {
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return timeA - timeB;
    })
    .map(formatMessage);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <ChatHeader 
        chatId={chatId}
      />
      
      <Box sx={{ 
        flexGrow: 1, 
        backgroundColor: 'background.default', 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
      }}>
        {isLoading && !isConnected ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%' 
          }}>
            <CircularProgress />
          </Box>
        ) : formattedMessages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            flexDirection: 'column',
            textAlign: 'center',
            gap: 2,
          }}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2, maxWidth: 400 }}>
              <Typography variant="h6" gutterBottom>
                No messages yet
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">
                Start the conversation by sending a message below.
              </Typography>
            </Paper>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1 }}>
            {formattedMessages.map((formattedMsg) => {
              // Convert formatted message back to a Message object structure
              const messageObj: Message = {
                id: formattedMsg.id,
                content: formattedMsg.content,
                userId: formattedMsg.sender.id,
                username: formattedMsg.sender.name,
                chatId: chatId,
                createdAt: formattedMsg.timestamp,
                language: formattedMsg.originalLanguage || user.language, // Use original language if available
                translations: formattedMsg.translations.reduce((acc, t) => {
                  acc[t.language] = t.text;
                  return acc;
                }, {} as Record<string, string>)
              };
              
              return (
                <ChatMessage
                  key={formattedMsg.id}
                  message={messageObj}
                  isCurrentUser={formattedMsg.sender.id === user.id}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>
      
      <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
        <ChatInput 
          onSendMessage={handleSendMessage} 
          onTyping={handleTyping}
          disabled={!isConnected}
        />
      </Box>

      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error?.message || 'An error occurred. Please try again.'}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatPage; 