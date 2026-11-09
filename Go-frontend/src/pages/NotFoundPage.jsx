import { Box, Button, Typography, Card } from '@mui/material';
import { Home, Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#F7F7F7',
        p: 3,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          sx={{
            maxWidth: 600,
            p: 6,
            borderRadius: '20px',
            textAlign: 'center',
          }}
        >
          <motion.div
            animate={{
              y: [-5, 5, -5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Typography
              sx={{
                fontSize: '120px',
                fontWeight: 800,
                color: '#FF385C',
                lineHeight: 1,
                mb: 2,
              }}
            >
              404
            </Typography>
          </motion.div>

          <Typography
            sx={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#222222',
              mb: 2,
            }}
          >
            Page Not Found
          </Typography>

          <Typography
            sx={{
              fontSize: '16px',
              color: '#666666',
              mb: 4,
              lineHeight: 1.6,
            }}
          >
            Oops! The page you're looking for doesn't exist. It might have been moved or
            deleted. Let's get you back on track.
          </Typography>

          <svg
            width="300"
            height="180"
            viewBox="0 0 300 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ margin: '0 auto 32px' }}
          >
            <rect x="50" y="60" width="200" height="80" rx="12" fill="#F7F7F7" />
            <rect x="65" y="75" width="50" height="50" rx="6" fill="#E0E0E0" />
            <rect x="125" y="75" width="50" height="50" rx="6" fill="#E0E0E0" />
            <rect x="185" y="75" width="50" height="50" rx="6" fill="#E0E0E0" />
            <circle cx="75" cy="155" r="12" fill="#BDBDBD" />
            <circle cx="225" cy="155" r="12" fill="#BDBDBD" />
            <path
              d="M30 90 L50 90 M250 90 L270 90"
              stroke="#FF385C"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle cx="150" cy="30" r="20" fill="#FFF0F3" />
            <text
              x="150"
              y="38"
              fontSize="20"
              textAnchor="middle"
              fill="#FF385C"
              fontWeight="bold"
            >
              ?
            </text>
          </svg>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={() => navigate('/')}
              sx={{
                bgcolor: '#FF385C',
                '&:hover': { bgcolor: '#E31C5F' },
                height: '48px',
                px: 4,
                borderRadius: '12px',
                fontWeight: 600,
              }}
            >
              Go Home
            </Button>
            <Button
              variant="outlined"
              startIcon={<Search />}
              onClick={() => navigate('/search')}
              sx={{
                borderColor: '#FF385C',
                color: '#FF385C',
                height: '48px',
                px: 4,
                borderRadius: '12px',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#E31C5F',
                  bgcolor: '#FFF0F3',
                },
              }}
            >
              Search Tickets
            </Button>
          </Box>
        </Card>
      </motion.div>
    </Box>
  );
};

export default NotFoundPage;
