import { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../contexts/AuthContext';

// Mock data for now - will be replaced with API calls
const generateRandomId = () => {
  const segments = [
    Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
    Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
    Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  ];
  return segments.join('-');
};

const SAMPLE_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=chatti';
const SAMPLE_NAME = 'Guest' + Math.floor(Math.random() * 1000);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth();

  // If already authenticated, redirect to chat
  useEffect(() => {
    if (isAuthenticated) {
      const chatId = generateRandomId();
      navigate(`/chat/${chatId}`);
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (name: string) => {
    try {
      await login(name);
      // Auth context will update, triggering the effect above
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

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
        <LoginForm 
          onLogin={handleLogin} 
          isLoading={isLoading}
          randomAvatar={SAMPLE_AVATAR}
          randomName={SAMPLE_NAME}
        />
        
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