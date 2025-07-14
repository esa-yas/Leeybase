import { useToast } from '@chakra-ui/react';

export const useCustomToast = () => {
  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });
  
  return toast;
}; 