import { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';

const SAMPLE_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=chatti';
const SAMPLE_NAME = 'Guest' + Math.floor(Math.random() * 1000);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading: authLoading, isAuthenticated } = useAuth();
  const { createChat, isLoading: chatLoading } = useChat();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  
  // If already authenticated, redirect to chat after creating a new chat
  useEffect(() => {
    const handleChatCreation = async () => {
      if (isAuthenticated && !isCreatingChat) {
        try {
          setIsCreatingChat(true);
          const chatId = await createChat();
          navigate(`/chat/${chatId}`);
        } catch (error) {
          console.error('Failed to create chat:', error);
          setIsCreatingChat(false);
        }
      }
    };
    
    handleChatCreation();
  }, [isAuthenticated, navigate, createChat, isCreatingChat]);

  const handleLogin = async (name: string) => {
    try {
      await login(name);
      // Auth context will update, triggering the effect above
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const isLoading = authLoading || chatLoading || isCreatingChat;

  return (
    <Layout showHeader={false}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          py: 4,
          px: 2,
          backgroundColor: 'background.default',
        }}
      >
        {isLoading && isAuthenticated ? (
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 400,
              width: '100%',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography variant="h6">Creating your chat room...</Typography>
            <CircularProgress />
          </Paper>
        ) : (
          <LoginForm 
            onLogin={handleLogin} 
            isLoading={authLoading}
            randomAvatar={SAMPLE_AVATAR}
            randomName={SAMPLE_NAME}
          />
        )}
        
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ mt: 4, textAlign: 'center' }}
        >
          Chatti - Multilingual real-time chat application
        </Typography>
      </Box>
    </Layout>
  );
};

export default LoginPage; 