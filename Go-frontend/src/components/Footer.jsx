import { Box, Container, Typography, Grid, IconButton } from '@mui/material';
import {
  Twitter,
  Facebook,
  Instagram,
  LinkedIn,
  DirectionsBus,
} from '@mui/icons-material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#222222',
        color: 'white',
        pt: 6,
        pb: 3,
        mt: 8,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <DirectionsBus sx={{ fontSize: 32, color: '#FF385C' }} />
              <Typography
                sx={{
                  fontSize: '24px',
                  fontWeight: 800,
                }}
              >
                <span style={{ color: '#FF385C' }}>Track</span>
                <span style={{ color: 'white' }}>Go</span>
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#999999',
                lineHeight: 1.7,
                mb: 2,
              }}
            >
              Book smarter bus and train tickets with AI-powered recommendations.
              Travel across Pakistan with confidence.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[
                { Icon: Twitter, href: '#' },
                { Icon: Facebook, href: '#' },
                { Icon: Instagram, href: '#' },
                { Icon: LinkedIn, href: '#' },
              ].map(({ Icon, href }, index) => (
                <IconButton
                  key={index}
                  href={href}
                  sx={{
                    color: '#666666',
                    '&:hover': {
                      color: '#FF385C',
                      bgcolor: 'rgba(255, 56, 92, 0.1)',
                    },
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 700,
                mb: 2,
                color: 'white',
              }}
            >
              Company
            </Typography>
            {['About Us', 'Careers', 'Press', 'Blog'].map((item) => (
              <Typography
                key={item}
                component="a"
                href="#"
                sx={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#999999',
                  textDecoration: 'none',
                  mb: 1.5,
                  '&:hover': {
                    color: '#FF385C',
                  },
                }}
              >
                {item}
              </Typography>
            ))}
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 700,
                mb: 2,
                color: 'white',
              }}
            >
              Support
            </Typography>
            {['Help Center', 'Safety', 'Cancellation', 'Contact Us'].map((item) => (
              <Typography
                key={item}
                component="a"
                href="#"
                sx={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#999999',
                  textDecoration: 'none',
                  mb: 1.5,
                  '&:hover': {
                    color: '#FF385C',
                  },
                }}
              >
                {item}
              </Typography>
            ))}
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 700,
                mb: 2,
                color: 'white',
              }}
            >
              Travel
            </Typography>
            {['Routes', 'Cities', 'Partners', 'Affiliates'].map((item) => (
              <Typography
                key={item}
                component="a"
                href="#"
                sx={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#999999',
                  textDecoration: 'none',
                  mb: 1.5,
                  '&:hover': {
                    color: '#FF385C',
                  },
                }}
              >
                {item}
              </Typography>
            ))}
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 700,
                mb: 2,
                color: 'white',
              }}
            >
              Legal
            </Typography>
            {['Privacy', 'Terms', 'Cookie Policy', 'Licenses'].map((item) => (
              <Typography
                key={item}
                component="a"
                href="#"
                sx={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#999999',
                  textDecoration: 'none',
                  mb: 1.5,
                  '&:hover': {
                    color: '#FF385C',
                  },
                }}
              >
                {item}
              </Typography>
            ))}
          </Grid>
        </Grid>

        <Box
          sx={{
            borderTop: '1px solid #333333',
            mt: 4,
            pt: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: '13px',
              color: '#666666',
            }}
          >
            © {currentYear} TrackGo. All rights reserved.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 3,
            }}
          >
            <Typography
              component="a"
              href="#"
              sx={{
                fontSize: '13px',
                color: '#666666',
                textDecoration: 'none',
                '&:hover': {
                  color: '#FF385C',
                },
              }}
            >
              Privacy Policy
            </Typography>
            <Typography
              component="a"
              href="#"
              sx={{
                fontSize: '13px',
                color: '#666666',
                textDecoration: 'none',
                '&:hover': {
                  color: '#FF385C',
                },
              }}
            >
              Terms of Service
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
