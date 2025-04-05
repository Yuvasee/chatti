import { Box, Typography, Paper } from '@mui/material';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();

  return (
    <Layout title={`Chat: ${chatId}`}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 128px)', // Account for header and padding
          padding: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 3,
            marginBottom: 2,
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom>
            Chat ID: {chatId}
          </Typography>
          <Typography variant="body1">
            Chat functionality coming soon...
          </Typography>
        </Paper>
      </Box>
    </Layout>
  );
};

export default ChatPage; 