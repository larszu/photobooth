import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Paper, 
  Typography, 
  IconButton,
  Slide 
} from '@mui/material';
import {
  Backspace as BackspaceIcon,
  SpaceBar as SpaceBarIcon,
  KeyboardReturn as EnterIcon,
  Keyboard as KeyboardIcon,
  KeyboardArrowUp as ShiftIcon
} from '@mui/icons-material';

interface OnScreenKeyboardProps {
  isVisible: boolean;
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  onClose: () => void;
  position?: 'bottom' | 'top';
  avoidCollision?: boolean;
  maxHeightPercent?: number;
  width?: string;
}

const OnScreenKeyboard: React.FC<OnScreenKeyboardProps> = ({
  isVisible,
  onKeyPress,
  onBackspace,
  onEnter,
  onClose,
  position = 'bottom',
  avoidCollision = true,
  maxHeightPercent = 35,
  width = '100%'
}) => {
  const [isShift, setIsShift] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // QWERTZ Layout
  const keyboardLayout = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'ß', '´'],
    ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ü', '+'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä', '#'],
    ['y', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-']
  ];

  const shiftNumbers = ['!', '"', '§', '$', '%', '&', '/', '(', ')', '=', '?', '`'];
  
  const shiftSpecial: { [key: string]: string } = {
    '+': '*', '#': "'", ',': ';', '.': ':', '-': '_',
    'ü': 'Ü', 'ö': 'Ö', 'ä': 'Ä', 'ß': '?'
  };

  const handleKeyPress = (key: string) => {
    let finalKey = key;

    if (/^[a-zäöüß]$/.test(key)) {
      if (isShift || isCapsLock) {
        finalKey = key.toUpperCase();
      }
    } else if (isShift && shiftSpecial[key]) {
      finalKey = shiftSpecial[key];
    } else if (isShift && /^[0-9ß´]$/.test(key)) {
      const index = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'ß', '´'].indexOf(key);
      if (index !== -1) {
        finalKey = shiftNumbers[index];
      }
    }

    onKeyPress(finalKey);
    if (isShift && !isCapsLock) setIsShift(false);
  };

  const handleShift = () => setIsShift(!isShift);
  const handleCapsLock = () => {
    setIsCapsLock(!isCapsLock);
    setIsShift(false);
  };

  // Intelligente Container-Erkennung
  const isInConstrainedContainer = React.useMemo(() => {
    // Prüfe ob wir in einem begrenzten Container sind (z.B. LoginPage)
    const container = document.querySelector('[data-container="login"]') || 
                     document.querySelector('.MuiContainer-root') ||
                     document.querySelector('[role="dialog"]');
    return container !== null;
  }, [isVisible]);

  const keyboardStyles = {
    position: 'fixed' as const,
    left: 0,
    right: 0,
    width: '100%',
    [position]: avoidCollision ? '8px' : 0,
    zIndex: 999999, // Höchster z-index um sicherzustellen, dass Tastatur über allem liegt
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: position === 'bottom' ? '12px 12px 0 0' : '0 0 12px 12px',
    padding: { xs: '2px', sm: '3px', md: '4px' }, // Reduziertes Padding
    maxHeight: `${maxHeightPercent}vh`,
    overflow: 'hidden',
    boxSizing: 'border-box' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
  };

  if (!isVisible) return null;

  return (
    <Slide direction={position === 'bottom' ? 'up' : 'down'} in={isVisible}>
      <Paper sx={keyboardStyles} elevation={8}>
        <Box sx={{ 
          width: isInConstrainedContainer 
            ? { xs: '98%', sm: '92%', md: '88%' }  // Etwas breiter für Container wie LoginPage
            : '100%', // Volle Breite für Vollbild-Seiten wie AdminPage
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Kompakter Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 0.2, // Reduzierter Abstand
            px: 0.5
          }}>
            <Typography variant="caption" color="text.secondary">
              <KeyboardIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
              QWERTZ
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.3 }}>
              <IconButton onClick={() => setIsMinimized(!isMinimized)} size="small"
                sx={{ backgroundColor: '#e0e0e0', width: 24, height: 24, fontSize: '0.7rem' }}>
                {isMinimized ? '⬆' : '⬇'}
              </IconButton>
              <IconButton onClick={onClose} size="small"
                sx={{ backgroundColor: '#ffcdd2', width: 24, height: 24, fontSize: '0.8rem' }}>
                ×
              </IconButton>
            </Box>
          </Box>

          {!isMinimized && (
            <Box sx={{ userSelect: 'none', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {keyboardLayout.map((row, rowIndex) => (
              <Box key={rowIndex} sx={{ display: 'flex', gap: '1px', width: '100%' }}>
                {/* Spezielle Tasten links */}
                {rowIndex === 2 && (
                  <Button variant={isCapsLock ? 'contained' : 'outlined'} onClick={handleCapsLock}
                    sx={{ minWidth: '40px', height: '36px', fontSize: '0.6rem', flex: 'none',
                      backgroundColor: isCapsLock ? '#2196f3' : 'white',
                      color: isCapsLock ? 'white' : 'black', border: '1px solid #ccc' }}>
                    CAPS
                  </Button>
                )}
                
                {rowIndex === 3 && (
                  <Button variant={isShift ? 'contained' : 'outlined'} onClick={handleShift}
                    sx={{ minWidth: '45px', height: '36px', fontSize: '0.6rem', flex: 'none',
                      backgroundColor: isShift ? '#2196f3' : 'white',
                      color: isShift ? 'white' : 'black', border: '1px solid #ccc' }}>
                    <ShiftIcon sx={{ fontSize: '1rem' }} />
                  </Button>
                )}

                {/* Normale Tasten */}
                <Box sx={{ display: 'flex', flex: 1, gap: '1px' }}>
                  {row.map((key, keyIndex) => (
                    <Button key={`${rowIndex}-${keyIndex}`} variant="outlined" 
                      onClick={() => handleKeyPress(key)}
                      sx={{
                        flex: 1, minWidth: '18px', height: '36px', fontSize: '0.7rem',
                        backgroundColor: 'white', color: 'black', border: '1px solid #ccc',
                        '&:hover': { backgroundColor: '#f0f0f0' }
                      }}>
                      {isShift ? (
                        rowIndex === 0 && /^[0-9ß´]$/.test(key) ? 
                          shiftNumbers[['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'ß', '´'].indexOf(key)] :
                          shiftSpecial[key] || key.toUpperCase()
                      ) : (
                        isCapsLock && /^[a-zäöü]$/.test(key) ? key.toUpperCase() : key
                      )}
                    </Button>
                  ))}
                </Box>

                {/* Spezielle Tasten rechts */}
                {rowIndex === 0 && (
                  <Button variant="outlined" onClick={onBackspace}
                    sx={{ minWidth: '45px', height: '36px', fontSize: '0.6rem', flex: 'none',
                      backgroundColor: '#ffebee', border: '1px solid #f44336', color: '#f44336' }}>
                    <BackspaceIcon sx={{ fontSize: '1rem' }} />
                  </Button>
                )}

                {rowIndex === 1 && (
                  <Button variant="outlined" onClick={onEnter}
                    sx={{ minWidth: '45px', height: '36px', fontSize: '0.6rem', flex: 'none',
                      backgroundColor: '#e8f5e8', border: '1px solid #4caf50', color: '#4caf50' }}>
                    <EnterIcon sx={{ fontSize: '1rem' }} />
                  </Button>
                )}
              </Box>
            ))}

            {/* Leertaste-Reihe */}
            <Box sx={{ display: 'flex', gap: '2px', width: '100%', mt: '2px' }}>
              <Button variant="outlined" onClick={() => handleKeyPress('@')}
                sx={{ minWidth: '30px', height: '32px', fontSize: '0.6rem', 
                  backgroundColor: 'white', border: '1px solid #ccc' }}>
                @
              </Button>
              <Button variant="outlined" onClick={() => handleKeyPress(' ')}
                sx={{ flex: 1, height: '36px', fontSize: '0.6rem',
                  backgroundColor: '#f9f9f9', border: '1px solid #ccc', mx: '2px' }}>
                <SpaceBarIcon sx={{ fontSize: '1rem' }} />
              </Button>
              <Button variant="outlined" onClick={() => handleKeyPress('.')}
                sx={{ minWidth: '35px', height: '32px', fontSize: '0.7rem',
                  backgroundColor: 'white', border: '1px solid #ccc' }}>
                .
              </Button>
            </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Slide>
  );
};

export default OnScreenKeyboard;
