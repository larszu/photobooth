import React, { useRef, useEffect } from 'react';
import { Box, Paper, IconButton } from '@mui/material';
import Keyboard from 'simple-keyboard';

interface SimpleKeyboardProps {
  isVisible: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  placeholder?: string;
  position?: 'bottom' | 'top';
  theme?: 'light' | 'dark';
}

const SimpleKeyboard: React.FC<SimpleKeyboardProps> = ({
  isVisible,
  value,
  onChange,
  onClose,
  placeholder = '',
  position = 'bottom',
  theme = 'light'
}) => {
  const keyboardRef = useRef<Keyboard | null>(null);
  const keyboardContainerRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [layoutName, setLayoutName] = React.useState('default');

  useEffect(() => {
    if (!isVisible || !keyboardContainerRef.current) return;

    // German QWERTZ Layout
    const layout = {
      default: [
        "^ 1 2 3 4 5 6 7 8 9 0 ß ´ {bksp}",
        "{tab} q w e r t z u i o p ü + {enter}",
        "{lock} a s d f g h j k l ö ä # {enter}",
        "{shift} < y x c v b n m , . - {shift}",
        ".com @ {space}"
      ],
      shift: [
        "° ! \" § $ % & / ( ) = ? ` {bksp}",
        "{tab} Q W E R T Z U I O P Ü * {enter}",
        "{lock} A S D F G H J K L Ö Ä ' {enter}",
        "{shift} > Y X C V B N M ; : _ {shift}",
        ".com @ {space}"
      ],
      lock: [
        "° ! \" § $ % & / ( ) = ? ` {bksp}",
        "{tab} Q W E R T Z U I O P Ü * {enter}",
        "{lock} A S D F G H J K L Ö Ä ' {enter}",
        "{shift} > Y X C V B N M ; : _ {shift}",
        ".com @ {space}"
      ]
    };

    const display = {
      '{bksp}': '⌫',
      '{enter}': '↵',
      '{shift}': '⇧',
      '{tab}': '⇥',
      '{lock}': '⇪',
      '{space}': ' '
    };

    // Initialize keyboard
    keyboardRef.current = new Keyboard(keyboardContainerRef.current, {
      layoutName: layoutName,
      layout: layout,
      display: display,
      theme: `hg-theme-default ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`,
      buttonTheme: [
        {
          class: "hg-red",
          buttons: "{bksp}"
        },
        {
          class: "hg-blue", 
          buttons: "{enter}"
        },
        {
          class: "hg-highlight",
          buttons: "{shift} {lock}"
        }
      ],
      mergeDisplay: true,
      physicalKeyboardHighlight: true,
      syncInstanceInputs: true,
      debug: false,
      
      // Touch optimization
      useTouchEvents: true,
      autoUseTouchEvents: true,
      
      // Performance optimization
      disableButtonHold: false,
      
      onChange: (input: string) => {
        onChange(input);
      },
      
      onKeyPress: (button: string) => {
        console.log('🎹 Key pressed:', button);
        
        // Handle special keys
        if (['{shift}', '{lock}'].includes(button)) {
          handleShift();
        }
      }
    });

    // Set initial input
    keyboardRef.current.setInput(value);

    // Cleanup
    return () => {
      if (keyboardRef.current) {
        keyboardRef.current.destroy();
        keyboardRef.current = null;
      }
    };
  }, [isVisible, layoutName, theme, value]);

  // Update keyboard input when value changes externally
  useEffect(() => {
    if (keyboardRef.current && keyboardRef.current.getInput() !== value) {
      keyboardRef.current.setInput(value);
    }
  }, [value]);

  const handleShift = () => {
    const newLayoutName = layoutName === 'default' ? 'shift' : 'default';
    setLayoutName(newLayoutName);
  };

  if (!isVisible) return null;

  const keyboardStyles = {
    position: 'fixed' as const,
    left: 0,
    right: 0,
    width: '100%',
    [position]: 0,
    zIndex: 9999,
    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f5f5f5',
    borderTop: theme === 'dark' ? '1px solid #444' : '1px solid #ddd',
    borderRadius: position === 'bottom' ? '16px 16px 0 0' : '0 0 16px 16px',
    boxShadow: theme === 'dark' 
      ? '0 -8px 32px rgba(0,0,0,0.5)' 
      : '0 -8px 32px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.3s ease-out'
  };

  const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    p: 1,
    bgcolor: theme === 'dark' ? '#333' : '#e0e0e0',
    borderBottom: theme === 'dark' ? '1px solid #444' : '1px solid #ccc'
  };

  return (
    <Paper sx={keyboardStyles} elevation={8}>
      {/* Header with controls */}
      <Box sx={headerStyles}>
        <Box sx={{ fontSize: '0.9rem', color: theme === 'dark' ? '#fff' : '#666' }}>
          {placeholder || 'Virtual Keyboard'}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => setIsMinimized(!isMinimized)}
            sx={{ 
              color: theme === 'dark' ? '#fff' : '#666',
              width: 28, 
              height: 28 
            }}
          >
            {isMinimized ? '↑' : '↓'}
          </IconButton>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ 
              color: theme === 'dark' ? '#fff' : '#666',
              width: 28, 
              height: 28 
            }}
          >
            ×
          </IconButton>
        </Box>
      </Box>

      {/* Keyboard container */}
      {!isMinimized && (
        <Box sx={{ p: 1 }}>
          <div ref={keyboardContainerRef} />
        </Box>
      )}
    </Paper>
  );
};

// Custom CSS for theming
const keyboardCSS = `
.hg-theme-default.light-theme {
  background-color: #f5f5f5;
  border-radius: 8px;
}

.hg-theme-default.light-theme .hg-button {
  background: white;
  border: 1px solid #ccc;
  color: #333;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
}

.hg-theme-default.light-theme .hg-button:hover {
  background: #f0f0f0;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
}

.hg-theme-default.light-theme .hg-button:active {
  background: #e0e0e0;
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.hg-theme-default.dark-theme {
  background-color: #2d2d2d;
  border-radius: 8px;
}

.hg-theme-default.dark-theme .hg-button {
  background: #404040;
  border: 1px solid #555;
  color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
}

.hg-theme-default.dark-theme .hg-button:hover {
  background: #4a4a4a;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

.hg-theme-default.dark-theme .hg-button:active {
  background: #363636;
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.hg-theme-default .hg-red {
  background: #f44336 !important;
  color: white !important;
}

.hg-theme-default .hg-blue {
  background: #2196f3 !important;
  color: white !important;
}

.hg-theme-default .hg-highlight {
  background: #ff9800 !important;
  color: white !important;
}

/* Responsive sizing */
@media (max-width: 768px) {
  .hg-theme-default .hg-button {
    min-height: 48px;
    font-size: 14px;
  }
}

@media (min-width: 768px) {
  .hg-theme-default .hg-button {
    min-height: 56px;
    font-size: 16px;
  }
}

/* Layout spacing */
.hg-theme-default .hg-row {
  margin-bottom: 4px;
}

.hg-theme-default .hg-button {
  margin: 0 2px;
}
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = keyboardCSS;
  document.head.appendChild(styleElement);
}

export default SimpleKeyboard;
