import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  AccountBalance,
  Receipt,
  Category,
  Analytics,
  Assessment,
  Settings,
  CloudUpload,
  Login as LoginIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../auth/LoginForm';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, user, error, signOut } = useAuth();

  // Add debug logging
  useEffect(() => {
    console.log('Auth Debug:', {
      isAuthenticated,
      isLoading,
      user,
      error,
      currentPath: location.pathname,
      shouldShowLogin: !isAuthenticated && location.pathname !== '/forgot-password'
    });
  }, [isAuthenticated, isLoading, user, error, location.pathname]);

  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Accounts', icon: <AccountBalance />, path: '/accounts' },
    { text: 'Transactions', icon: <Receipt />, path: '/transactions' },
    { text: 'Categories', icon: <Category />, path: '/categories' },
    { text: 'Import', icon: <CloudUpload />, path: '/import' },
    { text: 'Analytics', icon: <Analytics />, path: '/analytics' },
    { text: 'Reports', icon: <Assessment />, path: '/reports' },
    { text: 'Settings', icon: <Settings />, path: '/settings' }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          HouseF2
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            disablePadding
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText 
              primary={item.text}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              sx={{ 
                cursor: 'pointer',
                bgcolor: location.pathname === item.path ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );

  // Show loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated && location.pathname !== '/forgot-password') {
    console.log('Rendering login screen');
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default'
        }}
      >
        <AppBar position="static" elevation={0} color="transparent">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              HouseF2
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h4" component="h1" align="center" gutterBottom>
              Welcome to HouseF2
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
              Your personal finance management system
            </Typography>
            {LoginForm ? (
              <LoginForm />
            ) : (
              <Typography color="error">Error: LoginForm component not found</Typography>
            )}
          </Paper>
        </Container>
      </Box>
    );
  }

  console.log('Rendering main layout');
  // Show main layout when authenticated
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` }
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'HouseF2'}
          </Typography>
          <Button
            color="inherit"
            onClick={signOut}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px' // Height of AppBar
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 