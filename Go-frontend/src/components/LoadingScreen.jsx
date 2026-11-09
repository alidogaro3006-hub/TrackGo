import { Box, CircularProgress, Typography } from '@mui/material';
import { DirectionsBus } from '@mui/icons-material';
import { motion } from 'framer-motion';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#F7F7F7',
      }}
    >
      <motion.div
        animate={{
          y: [-10, 10, -10],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: '#FF385C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            boxShadow: '0 8px 24px rgba(255, 56, 92, 0.3)',
          }}
        >
          <DirectionsBus sx={{ fontSize: 40, color: 'white' }} />
        </Box>
      </motion.div>

      <CircularProgress
        size={40}
        thickness={4}
        sx={{
          color: '#FF385C',
          mb: 2,
        }}
      />

      <Typography
        sx={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#222222',
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
