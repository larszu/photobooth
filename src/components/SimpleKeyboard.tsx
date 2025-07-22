import React, { useState } from 'react';
import Keyboard from 'react-simple-keyboard';

interface SimpleKeyboardProps {
  isVisible: boolean;
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  onClose: () => void;
  position?: 'bottom' | 'top';
  avoidCollision?: boolean;
  maxHeightPercent?: number;
}

const SimpleKeyboard: React.FC<SimpleKeyboardProps> = ({
  isVisible,
  onKeyPress,
  onBackspace,
  onEnter,
  onClose,
  position = 'bottom'
}) => {
  const [layoutName, setLayoutName] = useState('default');

  const qwertzLayout = {
    default: [
      'q w e r t z u i o p ü',
      'a s d f g h j k l ö ä', 
      'y x c v b n m , . -',
      '{shift} {space} {bksp} {enter}'
    ],
    shift: [
      'Q W E R T Z U I O P Ü',
      'A S D F G H J K L Ö Ä',
      'Y X C V B N M ; : _', 
      '{shift} {space} {bksp} {enter}'
    ]
  };

  const display = {
    '{bksp}': '⌫',
    '{enter}': '↵', 
    '{shift}': '⇧',
    '{space}': '␣'
  };

  const handleKeyPress = (button: string) => {
    if (button === '{bksp}') {
      onBackspace();
    } else if (button === '{enter}') {
      onEnter();
    } else if (button === '{shift}') {
      setLayoutName(layoutName === 'default' ? 'shift' : 'default');
    } else {
      onKeyPress(button);
    }
  };

  if (!isVisible) return null;

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    [position]: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: 'white',
    padding: '10px',
    borderTop: '1px solid #ccc',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
  };

  return (
    <div style={containerStyle}>
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '5px 10px',
          cursor: 'pointer',
          zIndex: 10000
        }}
      >
        ✕
      </button>
      <Keyboard
        onKeyPress={handleKeyPress}
        layout={qwertzLayout}
        layoutName={layoutName}
        display={display}
        theme="hg-theme-default"
      />
    </div>
  );
};

export default SimpleKeyboard;
