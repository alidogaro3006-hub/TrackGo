import {
  Box, Card, Typography, Button, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';

const VehiclesTab = ({ vehicles, isLoading, onOpenDialog, onDelete, isMobile }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Manage Vehicles</Typography>
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
          {vehicles.map((vehicle) => (
            <Card key={vehicle._id} sx={{ p: 2, mb: 2, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      label={vehicle.type}
                      size="small"
                      sx={{
                        bgcolor: vehicle.type === 'bus' ? '#00A699' : '#FF385C',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                    <Typography sx={{ fontSize: '14px', color: '#666666' }}>
                      Capacity: {vehicle.capacity}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '12px', color: '#666666' }}>
                    Reg: {vehicle.registrationNumber}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small" onClick={() => onOpenDialog(vehicle)} sx={{ color: '#FF385C' }}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => onDelete(vehicle._id)} sx={{ color: '#EF4444' }}>
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
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Capacity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reg. Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.map((vehicle, index) => (
                <TableRow key={vehicle._id} sx={{ bgcolor: index % 2 === 0 ? 'white' : '#FAFAFA' }}>
                  <TableCell>
                    <Chip
                      label={vehicle.type}
                      size="small"
                      sx={{
                        bgcolor: vehicle.type === 'bus' ? '#00A699' : '#FF385C',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>{vehicle.capacity}</TableCell>
                  <TableCell>{vehicle.registrationNumber}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" onClick={() => onOpenDialog(vehicle)} sx={{ color: '#FF385C' }}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" onClick={() => onDelete(vehicle._id)} sx={{ color: '#EF4444' }}>
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

export default VehiclesTab;
