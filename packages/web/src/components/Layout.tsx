import { ReactNode } from 'react';
import { Container, Box, AppBar, Toolbar, Typography } from '@mui/material';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'Chatti', 
  showHeader = true 
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {showHeader && (
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
          </Toolbar>
        </AppBar>
      )}
      <Container 
        component="main"
        maxWidth={false}
        sx={{ 
          flexGrow: 1, 
          py: 3,
          maxWidth: '800px',
          width: '100%',
          px: { xs: 0, sm: 2 }
        }}
        disableGutters
      >
        {children}
      </Container>
    </Box>
  );
};

export default Layout; 