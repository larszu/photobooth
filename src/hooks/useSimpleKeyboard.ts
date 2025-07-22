import { useState, useRef } from 'react';

interface UseSimpleKeyboardOptions {
  autoShow?: boolean;
}

interface UseSimpleKeyboardReturn {
  isVisible: boolean;
  showKeyboard: () => void;
  hideKeyboard: () => void;
  toggleKeyboard: () => void;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  inputProps: {
    onFocus: () => void;
    onBlur: () => void;
    ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  };
}

export const useSimpleKeyboard = (
  options: UseSimpleKeyboardOptions = {}
): UseSimpleKeyboardReturn => {
  const { autoShow = true } = options;
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const showKeyboard = () => {
    setIsVisible(true);
  };

  const hideKeyboard = () => {
    setIsVisible(false);
  };

  const toggleKeyboard = () => {
    setIsVisible(!isVisible);
  };

  const handleFocus = () => {
    if (autoShow) {
      showKeyboard();
    }
  };

  const handleBlur = () => {
    // Keep keyboard open for touch devices
    // It will be closed manually or when another input gets focus
  };

  return {
    isVisible,
    showKeyboard,
    hideKeyboard,
    toggleKeyboard,
    inputRef,
    inputProps: {
      onFocus: handleFocus,
      onBlur: handleBlur,
      ref: inputRef
    }
  };
};

export default useSimpleKeyboard;
