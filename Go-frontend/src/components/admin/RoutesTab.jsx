import {
  Box, Card, Typography, Button, IconButton,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import dayjs from 'dayjs';

const RoutesTab = ({ routes, isLoading, onOpenDialog, onDelete, isMobile }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Manage Routes</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => onOpenDialog(null)}
          sx={{ bgcolor: '#FF385C', '&:hover': { bgcolor: '#E31C5F' }, borderRadius: '12px' }}
        >
          Add New
        </Button>
      </Box>

      {isLoading ? (
        <Box>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: '8px' }} />
          ))}
        </Box>
      ) : isMobile ? (
        <Box>
          {routes.map((route) => (
            <Card key={route._id} sx={{ p: 2, mb: 2, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '16px', mb: 0.5 }}>
                    {route.source} → {route.destination}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#666666' }}>
                    Created: {dayjs(route.createdAt).format('MMM DD, YYYY')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small" onClick={() => onOpenDialog(route)} sx={{ color: '#FF385C' }}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => onDelete(route._id)} sx={{ color: '#EF4444' }}>
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F7F7F7' }}>
                <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Destination</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created At</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {routes.map((route, index) => (
                <TableRow key={route._id} sx={{ bgcolor: index % 2 === 0 ? 'white' : '#FAFAFA' }}>
                  <TableCell>{route.source}</TableCell>
                  <TableCell>{route.destination}</TableCell>
                  <TableCell>{dayjs(route.createdAt).format('MMM DD, YYYY')}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" onClick={() => onOpenDialog(route)} sx={{ color: '#FF385C' }}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" onClick={() => onDelete(route._id)} sx={{ color: '#EF4444' }}>
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default RoutesTab;
