import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Divider, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ChatHeader from '../components/ChatHeader';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import { useAuth, useChat } from '../contexts';
import { createTypingHandler, formatMessage, FormattedMessage } from '../utils';

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, setUserLanguage } = useAuth();
  const { 
    messages, 
    isLoading, 
    isConnected, 
    error, 
    joinChat, 
    leaveChat, 
    sendMessage, 
    startTyping, 
    stopTyping,
    currentChatId
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Setup typing handler
  const { handleTyping } = createTypingHandler(startTyping, stopTyping);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Join chat when component mounts
  useEffect(() => {
    if (isAuthenticated && chatId) {
      const setupChat = async () => {
        try {
          // Only join if not already in this chat
          if (currentChatId !== chatId) {
            await joinChat(chatId);
          }
        } catch (error) {
          console.error('Failed to join chat:', error);
        }
      };

      setupChat();
    }
  }, [chatId, isAuthenticated, joinChat, leaveChat, currentChatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Log errors
  useEffect(() => {
    if (error) {
      console.error('Chat error:', error);
    }
  }, [error]);

  const handleSendMessage = async (content: string) => {
    if (!user || !chatId) return;
    
    try {
      await sendMessage(content, user.language);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setUserLanguage(newLanguage);
  };

  if (!chatId || !user) {
    return null;
  }

  const formattedMessages = messages.map(formatMessage);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <ChatHeader 
        chatId={chatId}
        selectedLanguage={user.language}
        onLanguageChange={handleLanguageChange}
        isConnected={isConnected}
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
            {formattedMessages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                sender={message.sender}
                timestamp={message.timestamp}
                isCurrentUser={message.sender.id === user.id}
                translations={message.translations}
                selectedLanguage={user.language}
              />
            ))}
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
    </Box>
  );
};

export default ChatPage; 