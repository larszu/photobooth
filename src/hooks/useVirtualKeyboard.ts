import { useState, useEffect, useRef } from 'react';

interface UseVirtualKeyboardOptions {
  autoShow?: boolean;
  position?: 'bottom' | 'top';
  persistOnInput?: boolean; // Bleibt nach Eingabe offen
}

interface UseVirtualKeyboardReturn {
  isKeyboardVisible: boolean;
  showKeyboard: () => void;
  hideKeyboard: () => void;
  handleKeyPress: (key: string) => void;
  handleBackspace: () => void;
  handleEnter: () => void;
  inputProps: {
    onFocus: () => void;
    onBlur: () => void;
    ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  };
}

export const useVirtualKeyboard = (
  value: string,
  onChange: (newValue: string) => void,
  options: UseVirtualKeyboardOptions = {}
): UseVirtualKeyboardReturn => {
  const { autoShow = true, persistOnInput = true } = options;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const showKeyboard = () => {
    setIsKeyboardVisible(true);
  };

  const hideKeyboard = () => {
    setIsKeyboardVisible(false);
  };

  const handleKeyPress = (key: string) => {
    const newValue = value.slice(0, cursorPosition) + key + value.slice(cursorPosition);
    onChange(newValue);
    setCursorPosition(cursorPosition + 1);
    
    // Cursor Position im echten Input aktualisieren
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = cursorPosition + 1;
        inputRef.current.selectionEnd = cursorPosition + 1;
      }
    }, 0);
  };

  const handleBackspace = () => {
    if (cursorPosition > 0) {
      const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
      onChange(newValue);
      setCursorPosition(cursorPosition - 1);
      
      // Cursor Position im echten Input aktualisieren
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = cursorPosition - 1;
          inputRef.current.selectionEnd = cursorPosition - 1;
        }
      }, 0);
    }
  };

  const handleEnter = () => {
    // Enter kann für Submit verwendet werden, schließt aber nicht die Tastatur
    if (inputRef.current && inputRef.current.form) {
      // Versuche Form zu submitten
      const form = inputRef.current.form;
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
    }
    // Tastatur bleibt offen für weitere Eingaben
  };

  const handleFocus = () => {
    if (autoShow) {
      showKeyboard();
    }
    // Cursor Position aktualisieren
    setTimeout(() => {
      if (inputRef.current) {
        setCursorPosition(inputRef.current.selectionStart || 0);
      }
    }, 0);
  };

  const handleBlur = () => {
    // Tastatur bleibt offen auch wenn Focus verloren geht
    // Sie wird nur manuell geschlossen
    setTimeout(() => {
      if (inputRef.current && document.activeElement === inputRef.current) {
        setCursorPosition(inputRef.current.selectionStart || 0);
      }
    }, 0);
  };

  // Cursor Position bei Klicks aktualisieren
  useEffect(() => {
    const handleSelectionChange = () => {
      if (inputRef.current && document.activeElement === inputRef.current) {
        setCursorPosition(inputRef.current.selectionStart || 0);
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener('click', handleSelectionChange);
      input.addEventListener('keyup', handleSelectionChange);
      
      return () => {
        input.removeEventListener('click', handleSelectionChange);
        input.removeEventListener('keyup', handleSelectionChange);
      };
    }
  }, []);

  return {
    isKeyboardVisible,
    showKeyboard,
    hideKeyboard,
    handleKeyPress,
    handleBackspace,
    handleEnter,
    inputProps: {
      onFocus: handleFocus,
      onBlur: handleBlur,
      ref: inputRef
    }
  };
};

export default useVirtualKeyboard;
