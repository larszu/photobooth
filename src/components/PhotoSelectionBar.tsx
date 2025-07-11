import React from 'react';
import { 
  Box, 
  Fab, 
  Typography, 
  Button, 
  Slide,
  useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import CloseIcon from '@mui/icons-material/Close';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import DeselectIcon from '@mui/icons-material/Deselect';

interface PhotoSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onMoveToTrash: () => void;
  onShare: () => void;
  onClose: () => void;
}

const PhotoSelectionBar: React.FC<PhotoSelectionBarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onMoveToTrash,
  onShare,
  onClose
}) => {
  const theme = useTheme();

  return (
    <Slide direction="up" in={selectedCount > 0} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          p: { xs: 2, md: 3 },
          boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, md: 2 },
          flexWrap: 'wrap'
        }}
      >
        {/* Selection Info */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '1rem', md: '1.2rem' },
              fontWeight: 600
            }}
          >
            {selectedCount} {selectedCount === 1 ? 'Foto' : 'Fotos'} ausgewählt
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              opacity: 0.9,
              fontSize: { xs: '0.8rem', md: '0.9rem' }
            }}
          >
            von {totalCount} Fotos
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* Select/Deselect All */}
          {selectedCount < totalCount ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<SelectAllIcon />}
              onClick={onSelectAll}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Alle
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DeselectIcon />}
              onClick={onDeselectAll}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Keine
            </Button>
          )}

          {/* Share Button */}
          <Button
            variant="contained"
            size="small"
            startIcon={<ShareIcon />}
            onClick={onShare}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            Teilen
          </Button>

          {/* Move to Trash Button */}
          <Button
            variant="contained"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={onMoveToTrash}
            sx={{
              backgroundColor: theme.palette.error.main,
              color: 'white',
              '&:hover': {
                backgroundColor: theme.palette.error.dark
              }
            }}
          >
            Papierkorb
          </Button>

          {/* Close Button */}
          <Fab
            size="small"
            onClick={onClose}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            <CloseIcon />
          </Fab>
        </Box>
      </Box>
    </Slide>
  );
};

export default PhotoSelectionBar;
