import { Box, Typography, Paper } from '@mui/material';
import Layout from '../components/Layout';

const LoginPage: React.FC = () => {
  return (
    <Layout showHeader={false}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 48px)', // Account for padding
          padding: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            maxWidth: 400,
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Welcome to Chatti
          </Typography>
          <Typography variant="body1" paragraph align="center">
            Login functionality coming soon...
          </Typography>
        </Paper>
      </Box>
    </Layout>
  );
};

export default LoginPage; 