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
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout; 