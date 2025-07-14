import { Box, ChakraProvider, Flex } from '@chakra-ui/react';
import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import theme from './styles/theme';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Login from './components/Login';
import { useAuth } from './contexts/AuthContext';

const AppContent = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const { user } = useAuth();

  if (!user) { 
    return <Login />;
  }

  return (
    <Flex h="100vh" overflow="hidden">
      <Box
        w={{ base: 'full', md: '300px' }}
        h="100vh"
        position="fixed"
        left={0}
        top={0}
        zIndex={20}
      >
        <Sidebar onChatSelect={setSelectedChatId} selectedChatId={selectedChatId} />
      </Box>
      <Box
        flex={1}
        ml={{ base: 0, md: '300px' }}
        position="relative"
      >
        <ChatArea chatId={selectedChatId} />
      </Box>
    </Flex>
  );
};

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ChakraProvider>
  );
};

export default App; 
