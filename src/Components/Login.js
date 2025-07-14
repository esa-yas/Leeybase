import {
  Box,
  Button,
  Stack,
  Input,
  VStack,
  Text,
  Container,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  FormLabel,
  FormControl,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCustomToast } from '../hooks/useCustomToast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const toast = useCustomToast();

  const handleAuth = async (isSignUp = false) => {
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = isSignUp
        ? await signUp({ email, password })
        : await signIn({ email, password });

      if (error) throw error;

      toast({
        title: isSignUp ? 'Account created!' : 'Welcome back!',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="brand.primary"
    >
      <Container maxW="md" p={8}>
        <VStack spacing={8}>
          <Heading color="white">Welcome to Leeybase AI</Heading>
          <Box
            w="100%"
            bg="brand.secondary"
            p={8}
            borderRadius="xl"
            boxShadow="xl"
          >
            <Tabs isFitted variant="enclosed">
              <TabList mb={4}>
                <Tab color="gray.300" _selected={{ color: 'white', bg: 'brand.highlight' }}>Login</Tab>
                <Tab color="gray.300" _selected={{ color: 'white', bg: 'brand.highlight' }}>Sign Up</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Stack spacing={4}>
                    <FormControl>
                      <FormLabel color="gray.300">Email</FormLabel>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        bg="brand.highlight"
                        border="none"
                        _focus={{
                          borderColor: 'blue.500',
                          boxShadow: '0 0 0 1px blue.500',
                        }}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel color="gray.300">Password</FormLabel>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        bg="brand.highlight"
                        border="none"
                        _focus={{
                          borderColor: 'blue.500',
                          boxShadow: '0 0 0 1px blue.500',
                        }}
                      />
                    </FormControl>
                    <Button
                      w="100%"
                      colorScheme="blue"
                      onClick={() => handleAuth(false)}
                      isLoading={loading}
                    >
                      Login
                    </Button>
                  </Stack>
                </TabPanel>
                <TabPanel>
                  <Stack spacing={4}>
                    <FormControl>
                      <FormLabel color="gray.300">Email</FormLabel>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        bg="brand.highlight"
                        border="none"
                        _focus={{
                          borderColor: 'blue.500',
                          boxShadow: '0 0 0 1px blue.500',
                        }}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel color="gray.300">Password</FormLabel>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        bg="brand.highlight"
                        border="none"
                        _focus={{
                          borderColor: 'blue.500',
                          boxShadow: '0 0 0 1px blue.500',
                        }}
                      />
                    </FormControl>
                    <Button
                      w="100%"
                      colorScheme="blue"
                      onClick={() => handleAuth(true)}
                      isLoading={loading}
                    >
                      Sign Up
                    </Button>
                  </Stack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
          <Text color="gray.500" fontSize="sm" textAlign="center">
            Powered by Gemini AI & Supabase
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default Login; 
