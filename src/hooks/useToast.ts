import { showMessage } from 'react-native-flash-message';

export const useToast = () => {
  const success = (message: string, description?: string) => {
    showMessage({ message, description, type: 'success', duration: 3000 });
  };

  const error = (message: string, description?: string) => {
    showMessage({ message, description, type: 'danger', duration: 4000 });
  };

  const warning = (message: string, description?: string) => {
    showMessage({ message, description, type: 'warning', duration: 3000 });
  };

  const info = (message: string, description?: string) => {
    showMessage({ message, description, type: 'info', duration: 3000 });
  };

  return { success, error, warning, info };
};
