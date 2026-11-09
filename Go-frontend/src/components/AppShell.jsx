import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Avatar,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  SpeedRounded,
  SearchRounded,
  ConfirmationNumberRounded,
  AutoAwesomeRounded,
  AdminPanelSettingsRounded,
  LogoutRounded,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 260;

const AppShell = ({ children, pageTitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: <SpeedRounded />, path: '/dashboard' },
    { label: 'Search Tickets', icon: <SearchRounded />, path: '/search' },
    { label: 'My Bookings', icon: <ConfirmationNumberRounded />, path: '/bookings' },
    { label: 'AI Recommendations', icon: <AutoAwesomeRounded />, path: '/recommendations' },
  ];

  if (user?.role === 'admin') {
    navItems.push({
      label: 'Admin Panel',
      icon: <AdminPanelSettingsRounded />,
      path: '/admin',
    });
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#222222',
        color: 'white',
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontSize: '24px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
          onClick={() => handleNavigation('/')}
        >
          <span style={{ color: 'white' }}>Track</span>
          <span style={{ color: 'white' }}>Go</span>
        </Typography>
      </Box>

      <List sx={{ px: 2, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: '10px',
                  color: 'white',
                  bgcolor: isActive ? '#FF385C' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? '#E31C5F' : 'rgba(255, 255, 255, 0.08)',
                  },
                  py: 1.5,
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />

      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            borderRadius: '12px',
            bgcolor: 'rgba(255, 255, 255, 0.05)',
          }}
        >
          <Avatar
            sx={{
              bgcolor: '#FF385C',
              width: 40,
              height: 40,
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            {getInitials(user?.name)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.name}
            </Typography>
            <Typography
              sx={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.email}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={logout}
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <LogoutRounded fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'white',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, color: '#222222' }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              color: '#222222',
              fontWeight: 700,
              fontSize: '20px',
            }}
          >
            {pageTitle}
          </Typography>

          <Avatar
            sx={{
              bgcolor: '#FF385C',
              width: 36,
              height: 36,
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onClick={() => handleNavigation('/dashboard')}
          >
            {getInitials(user?.name)}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#F7F7F7',
          p: { xs: 2, md: 4 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AppShell;
