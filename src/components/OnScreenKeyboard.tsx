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
}

const OnScreenKeyboard: React.FC<OnScreenKeyboardProps> = ({
  isVisible,
  onKeyPress,
  onBackspace,
  onEnter,
  onClose,
  position = 'bottom'
}) => {
  const [isShift, setIsShift] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // QWERTZ Layout
  const keyboardLayout = [
    // Zahlenreihe
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'ß', '´'],
    // Erste Buchstabenreihe
    ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ü', '+'],
    // Zweite Buchstabenreihe
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä', '#'],
    // Dritte Buchstabenreihe
    ['y', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-']
  ];

  // Shift-Varianten für Zahlenreihe
  const shiftNumbers = ['!', '"', '§', '$', '%', '&', '/', '(', ')', '=', '?', '`'];
  
  // Shift-Varianten für Sonderzeichen
  const shiftSpecial: { [key: string]: string } = {
    '+': '*',
    '#': "'",
    ',': ';',
    '.': ':',
    '-': '_',
    'ü': 'Ü',
    'ö': 'Ö',
    'ä': 'Ä',
    'ß': '?'
  };

  const handleKeyPress = (key: string) => {
    let finalKey = key;

    // Groß-/Kleinschreibung für Buchstaben
    if (/^[a-zäöüß]$/.test(key)) {
      if (isShift || isCapsLock) {
        finalKey = key.toUpperCase();
      }
    }
    // Shift-Varianten für Sonderzeichen
    else if (isShift && shiftSpecial[key]) {
      finalKey = shiftSpecial[key];
    }
    // Zahlenreihe mit Shift
    else if (isShift && /^[0-9ß´]$/.test(key)) {
      const index = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'ß', '´'].indexOf(key);
      if (index !== -1) {
        finalKey = shiftNumbers[index];
      }
    }

    onKeyPress(finalKey);
    
    // Shift zurücksetzen (außer bei Caps Lock)
    if (isShift && !isCapsLock) {
      setIsShift(false);
    }
  };

  const handleShift = () => {
    setIsShift(!isShift);
  };

  const handleCapsLock = () => {
    setIsCapsLock(!isCapsLock);
    setIsShift(false);
  };

  const keyboardStyles = {
    position: 'fixed' as const,
    left: 0,
    right: 0,
    [position]: 0,
    zIndex: 9999,
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: position === 'bottom' ? '12px 12px 0 0' : '0 0 12px 12px',
    padding: '8px',
    maxHeight: '40vh',
    overflow: 'hidden'
  };

  if (!isVisible) return null;

  return (
    <Slide direction={position === 'bottom' ? 'up' : 'down'} in={isVisible} mountOnEnter unmountOnExit>
      <Paper sx={keyboardStyles} elevation={8}>
        {/* Header mit Minimize/Schließen-Buttons */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 1,
          px: 1
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            <KeyboardIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
            QWERTZ Tastatur
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton 
              onClick={() => setIsMinimized(!isMinimized)} 
              size="small"
              sx={{ 
                backgroundColor: '#e0e0e0',
                '&:hover': { backgroundColor: '#d0d0d0' },
                width: 28,
                height: 28
              }}
              title={isMinimized ? "Tastatur erweitern" : "Tastatur minimieren"}
            >
              {isMinimized ? '⬆' : '⬇'}
            </IconButton>
            <IconButton 
              onClick={onClose} 
              size="small"
              sx={{ 
                backgroundColor: '#ffcdd2',
                '&:hover': { backgroundColor: '#f8bbd9' },
                width: 28,
                height: 28
              }}
              title="Tastatur schließen"
            >
              ×
            </IconButton>
          </Box>
        </Box>

        {/* Tastatur-Layout (nur wenn nicht minimiert) */}
        {!isMinimized && (
          <Box sx={{ userSelect: 'none' }}>
            {keyboardLayout.map((row, rowIndex) => (
            <Box key={rowIndex} sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              gap: '2px',
              mb: '2px'
            }}>
              {/* Spezielle Tasten für bestimmte Reihen */}
              {rowIndex === 2 && (
                <Button
                  variant={isCapsLock ? 'contained' : 'outlined'}
                  onClick={handleCapsLock}
                  sx={{ 
                    minWidth: '50px',
                    height: '35px',
                    fontSize: '0.7rem',
                    backgroundColor: isCapsLock ? '#2196f3' : 'white',
                    color: isCapsLock ? 'white' : 'black',
                    border: '1px solid #ccc'
                  }}
                >
                  CAPS
                </Button>
              )}
              
              {rowIndex === 3 && (
                <Button
                  variant={isShift ? 'contained' : 'outlined'}
                  onClick={handleShift}
                  sx={{ 
                    minWidth: '60px',
                    height: '35px',
                    fontSize: '0.7rem',
                    backgroundColor: isShift ? '#2196f3' : 'white',
                    color: isShift ? 'white' : 'black',
                    border: '1px solid #ccc'
                  }}
                >
                  <ShiftIcon sx={{ fontSize: '1rem' }} />
                </Button>
              )}

              {/* Normale Tasten */}
              {row.map((key, keyIndex) => (
                <Button
                  key={`${rowIndex}-${keyIndex}`}
                  variant="outlined"
                  onClick={() => handleKeyPress(key)}
                  sx={{
                    minWidth: '30px',
                    width: '30px',
                    height: '35px',
                    fontSize: '0.8rem',
                    backgroundColor: 'white',
                    color: 'black',
                    border: '1px solid #ccc',
                    '&:hover': {
                      backgroundColor: '#f0f0f0'
                    },
                    '&:active': {
                      backgroundColor: '#e0e0e0'
                    }
                  }}
                >
                  {/* Zeige Shift-Variante falls aktiviert */}
                  {isShift ? (
                    // Zahlenreihe
                    rowIndex === 0 && /^[0-9ß´]$/.test(key) ? 
                      shiftNumbers[['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'ß', '´'].indexOf(key)] :
                    // Sonderzeichen
                    shiftSpecial[key] || key.toUpperCase()
                  ) : (
                    // Normale Anzeige (Caps Lock nur für Buchstaben)
                    isCapsLock && /^[a-zäöü]$/.test(key) ? key.toUpperCase() : key
                  )}
                </Button>
              ))}

              {/* Backspace für erste Reihe */}
              {rowIndex === 0 && (
                <Button
                  variant="outlined"
                  onClick={onBackspace}
                  sx={{ 
                    minWidth: '50px',
                    height: '35px',
                    fontSize: '0.7rem',
                    backgroundColor: '#ffebee',
                    border: '1px solid #f44336',
                    color: '#f44336',
                    '&:hover': {
                      backgroundColor: '#ffcdd2'
                    }
                  }}
                >
                  <BackspaceIcon sx={{ fontSize: '1rem' }} />
                </Button>
              )}

              {/* Enter für zweite Reihe */}
              {rowIndex === 1 && (
                <Button
                  variant="outlined"
                  onClick={onEnter}
                  sx={{ 
                    minWidth: '50px',
                    height: '35px',
                    fontSize: '0.7rem',
                    backgroundColor: '#e8f5e8',
                    border: '1px solid #4caf50',
                    color: '#4caf50',
                    '&:hover': {
                      backgroundColor: '#c8e6c9'
                    }
                  }}
                >
                  <EnterIcon sx={{ fontSize: '1rem' }} />
                </Button>
              )}
            </Box>
          ))}

          {/* Letzte Reihe mit Leertaste */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: '2px',
            mt: '2px'
          }}>
            <Button
              variant="outlined"
              onClick={() => handleKeyPress('@')}
              sx={{
                minWidth: '40px',
                height: '35px',
                fontSize: '0.8rem',
                backgroundColor: 'white',
                border: '1px solid #ccc'
              }}
            >
              @
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleKeyPress(' ')}
              sx={{
                minWidth: '200px',
                height: '35px',
                fontSize: '0.7rem',
                backgroundColor: '#f9f9f9',
                border: '1px solid #ccc',
                '&:hover': {
                  backgroundColor: '#f0f0f0'
                }
              }}
            >
              <SpaceBarIcon sx={{ fontSize: '1rem' }} />
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleKeyPress('.')}
              sx={{
                minWidth: '40px',
                height: '35px',
                fontSize: '0.8rem',
                backgroundColor: 'white',
                border: '1px solid #ccc'
              }}
            >
              .
            </Button>
          </Box>
          </Box>
        )}
      </Paper>
    </Slide>
  );
};

export default OnScreenKeyboard;
