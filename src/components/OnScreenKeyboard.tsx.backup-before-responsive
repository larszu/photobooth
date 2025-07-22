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
  avoidCollision?: boolean; // Verhindert Überlappung mit wichtigen UI-Elementen
  maxHeightPercent?: number; // Maximale Höhe als Prozent des Viewports
}

const OnScreenKeyboard: React.FC<OnScreenKeyboardProps> = ({
  isVisible,
  onKeyPress,
  onBackspace,
  onEnter,
  onClose,
  position = 'bottom',
  avoidCollision = true,
  maxHeightPercent = 35
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
    width: '100%',
    [position]: avoidCollision ? { xs: '8px', sm: '12px', md: '16px' } : 0,
    zIndex: 9999,
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: position === 'bottom' ? '12px 12px 0 0' : '0 0 12px 12px',
    padding: { xs: '4px', sm: '8px', md: '12px' },
    maxHeight: { 
      xs: `${Math.min(maxHeightPercent + 10, 40)}vh`, // Reduziert für mobile
      sm: `${Math.min(maxHeightPercent + 5, 35)}vh`, 
      md: `${maxHeightPercent}vh` 
    },
    overflow: 'hidden',
    // Responsive Container
    boxSizing: 'border-box' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    // Schatten für bessere Sichtbarkeit
    boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
    // Smart positioning to avoid UI collision - optimiert für Login
    ...(avoidCollision && position === 'bottom' && {
      marginBottom: { xs: '0px', sm: '8px', md: '16px' },
      // Bessere Abstandsregeln für kleinere Screens
      bottom: { xs: 0, sm: 8, md: 16 }
    }),
    ...(avoidCollision && position === 'top' && {
      marginTop: { xs: '0px', sm: '8px', md: '16px' },
      top: { xs: 0, sm: 8, md: 16 }
    })
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
          mb: { xs: 0.5, sm: 1, md: 1 },
          px: { xs: 0.5, sm: 1, md: 1 }
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ 
            fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
            display: 'flex',
            alignItems: 'center'
          }}>
            <KeyboardIcon sx={{ 
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }, 
              mr: 0.5, 
              verticalAlign: 'middle' 
            }} />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              QWERTZ Tastatur
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              QWERTZ
            </Box>
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 0.3, sm: 0.5, md: 0.5 } }}>
            <IconButton 
              onClick={() => setIsMinimized(!isMinimized)} 
              size="small"
              sx={{ 
                backgroundColor: '#e0e0e0',
                '&:hover': { backgroundColor: '#d0d0d0' },
                width: { xs: 24, sm: 28, md: 32 },
                height: { xs: 24, sm: 28, md: 32 },
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }
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
                width: { xs: 24, sm: 28, md: 32 },
                height: { xs: 24, sm: 28, md: 32 },
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
              }}
              title="Tastatur schließen"
            >
              ×
            </IconButton>
          </Box>
        </Box>

        {/* Tastatur-Layout (nur wenn nicht minimiert) */}
        {!isMinimized && (
          <Box sx={{ 
            userSelect: 'none',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: '2px', sm: '3px', md: '4px' }
          }}>
            {keyboardLayout.map((row, rowIndex) => (
            <Box key={rowIndex} sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              gap: { xs: '1px', sm: '2px', md: '3px' },
              width: '100%'
            }}>
              {/* Spezielle Tasten für bestimmte Reihen */}
              {rowIndex === 2 && (
                <Button
                  variant={isCapsLock ? 'contained' : 'outlined'}
                  onClick={handleCapsLock}
                  sx={{ 
                    minWidth: { xs: '40px', sm: '50px', md: '70px' }, // Kleinere Mindestbreite
                    height: { xs: '40px', sm: '48px', md: '56px' }, // Konsistente Höhe mit normalen Tasten
                    fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.8rem' },
                    backgroundColor: isCapsLock ? '#2196f3' : 'white',
                    color: isCapsLock ? 'white' : 'black',
                    border: '1px solid #ccc',
                    flex: 'none'
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
                    minWidth: { xs: '45px', sm: '55px', md: '75px' }, // Angepasste Größe
                    height: { xs: '40px', sm: '48px', md: '56px' }, // Konsistente Höhe
                    fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.8rem' },
                    backgroundColor: isShift ? '#2196f3' : 'white',
                    color: isShift ? 'white' : 'black',
                    border: '1px solid #ccc',
                    flex: 'none'
                  }}
                >
                  <ShiftIcon sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.3rem' } }} />
                </Button>
              )}

              {/* Container für normale Tasten - nimmt den verfügbaren Platz ein */}
              <Box sx={{ 
                display: 'flex', 
                flex: 1, 
                gap: { xs: '1px', sm: '2px', md: '3px' },
                justifyContent: 'space-between'
              }}>
                {/* Normale Tasten */}
                {row.map((key, keyIndex) => (
                  <Button
                    key={`${rowIndex}-${keyIndex}`}
                    variant="outlined"
                    onClick={() => handleKeyPress(key)}
                    sx={{
                      flex: 1,
                      minWidth: { xs: '20px', sm: '28px', md: '40px' }, // Kleinere min-width für mobile
                      height: { xs: '40px', sm: '48px', md: '56px' }, // Kleinere Höhe für mobile
                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '1rem' }, // Kleinere Schrift
                      backgroundColor: 'white',
                      color: 'black',
                      border: '1px solid #ccc',
                      '&:hover': {
                        backgroundColor: '#f0f0f0'
                      },
                      '&:active': {
                        backgroundColor: '#e0e0e0'
                      },
                      // Responsive text sizing
                      '& .MuiButton-label': {
                        whiteSpace: 'nowrap',
                        overflow: 'hidden'
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
              </Box>

              {/* Backspace für erste Reihe */}
              {rowIndex === 0 && (
                <Button
                  variant="outlined"
                  onClick={onBackspace}
                  sx={{ 
                    minWidth: { xs: '45px', sm: '55px', md: '70px' }, // Angepasste Größe
                    height: { xs: '40px', sm: '48px', md: '56px' }, // Konsistente Höhe
                    fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.9rem' },
                    backgroundColor: '#ffebee',
                    border: '1px solid #f44336',
                    color: '#f44336',
                    flex: 'none',
                    '&:hover': {
                      backgroundColor: '#ffcdd2'
                    }
                  }}
                >
                  <BackspaceIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' } }} />
                </Button>
              )}

              {/* Enter für zweite Reihe */}
              {rowIndex === 1 && (
                <Button
                  variant="outlined"
                  onClick={onEnter}
                  sx={{ 
                    minWidth: { xs: '45px', sm: '55px', md: '70px' }, // Angepasste Größe
                    height: { xs: '40px', sm: '48px', md: '56px' }, // Konsistente Höhe
                    fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.9rem' },
                    backgroundColor: '#e8f5e8',
                    border: '1px solid #4caf50',
                    color: '#4caf50',
                    flex: 'none',
                    '&:hover': {
                      backgroundColor: '#c8e6c9'
                    }
                  }}
                >
                  <EnterIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' } }} />
                </Button>
              )}
            </Box>
          ))}

          {/* Letzte Reihe mit Leertaste */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            gap: { xs: '2px', sm: '3px', md: '4px' },
            width: '100%',
            mt: { xs: '2px', sm: '3px', md: '4px' }
          }}>
            <Button
              variant="outlined"
              onClick={() => handleKeyPress('@')}
              sx={{
                minWidth: { xs: '30px', sm: '35px', md: '45px' }, // Kompakter für mobile
                height: { xs: '35px', sm: '40px', md: '45px' }, // Kleinere Höhe
                fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.8rem' },
                backgroundColor: 'white',
                border: '1px solid #ccc',
                flex: 'none'
              }}
            >
              @
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleKeyPress(' ')}
              sx={{
                flex: 1,
                height: { xs: '40px', sm: '48px', md: '56px' }, // Konsistente Höhe
                fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.9rem' },
                backgroundColor: '#f9f9f9',
                border: '1px solid #ccc',
                mx: { xs: '4px', sm: '6px', md: '8px' },
                '&:hover': {
                  backgroundColor: '#f0f0f0'
                }
              }}
            >
              <SpaceBarIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' } }} />
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleKeyPress('.')}
              sx={{
                minWidth: { xs: '35px', sm: '45px', md: '60px' }, // Kompakter
                height: { xs: '40px', sm: '48px', md: '56px' }, // Konsistente Höhe
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '1rem' },
                backgroundColor: 'white',
                border: '1px solid #ccc',
                flex: 'none'
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
