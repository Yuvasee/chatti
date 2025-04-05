import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Avatar,
  CircularProgress
} from '@mui/material';

interface LoginFormProps {
  onLogin: (name: string) => void;
  isLoading?: boolean;
  randomAvatar?: string;
  randomName?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onLogin, 
  isLoading = false,
  randomAvatar = '',
  randomName = ''
}) => {
  const [name, setName] = useState(randomName);
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim() && !isLoading) {
      onLogin(name.trim());
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        maxWidth: 400,
        width: '100%',
        borderRadius: 2,
      }}
    >
      <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Welcome to Chatti
        </Typography>
        
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 2 }}>
          Join the conversation in your language
        </Typography>
        
        {randomAvatar && (
          <Avatar
            src={randomAvatar}
            alt="Avatar"
            sx={{ width: 80, height: 80, mb: 2 }}
          />
        )}
        
        <TextField
          fullWidth
          label="Your Name"
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          required
          autoFocus
          sx={{ mb: 2 }}
        />
        
        <Button
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          type="submit"
          disabled={!name.trim() || isLoading}
          sx={{ 
            py: 1.5,
            borderRadius: 2,
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Start Chatting'
          )}
        </Button>
        
        <Typography variant="caption" align="center" color="text.secondary">
          No account needed. Just enter a name to start chatting.
        </Typography>
      </Box>
    </Paper>
  );
};

export default LoginForm; 