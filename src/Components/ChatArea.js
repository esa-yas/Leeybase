import {
  Box,
  VStack,
  Input,
  IconButton,
  Button,
  Flex,
  Image,
  Tooltip,
  useColorModeValue,
  Text,
  Center,
  Heading,
  Grid,
  Spinner,
  InputGroup,
  InputRightElement,
  Switch,
  FormControl,
  FormLabel,
  Collapse,
  useDisclosure,
  Divider,
  Badge,
  HStack,
} from '@chakra-ui/react';
import { 
  AiOutlinePaperClip, 
  AiOutlineArrowUp, 
  AiOutlineClose,
  AiOutlineSearch,
  AiOutlineFilter,
  AiOutlineReload,
  AiOutlineLike,
  AiOutlineCopy
} from 'react-icons/ai';
import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useCustomToast } from '../hooks/useCustomToast';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { useClipboard } from '@chakra-ui/react';

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Rate limiting configuration
const MAX_RETRIES = 3;
const BASE_DELAY = 2000; // 2 seconds
const MAX_DELAY = 10000; // 10 seconds

const calculateBackoff = (retryCount) => {
  // Exponential backoff: 2s, 4s, 8s
  const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
  // Add some randomness to prevent all retries happening at exactly the same time
  return delay + (Math.random() * 1000);
};

// System prompt for the AI
const systemPrompt = `
You are Leeybase, an AI assistant specifically designed for Ethiopian users. Your responses should be:
1. Culturally aware and respectful of Ethiopian traditions
2. Able to understand and respond to questions about Ethiopian context
3. Helpful in both English and Amharic (when requested)
4. Focused on providing practical solutions for Ethiopian users
5. Knowledgeable about Ethiopian history, culture, and current affairs
6. Professional yet friendly in tone
7. Always truthful and accurate
8. Respectful of Ethiopian values and customs
9. And You are Built by Esayas Desta

When formatting your responses, follow these rules:
1. Use ** for main headings (H1), like: **Main Topic**
2. Use * for subheadings (H2), like: *Subtopic*
3. For lists and sections, use proper markdown:
   - ### for section headers
   - 1. 2. 3. for numbered lists
   - - for bullet points
4. Important terms or concepts should be in **bold**
5. Include relevant Amharic translations in parentheses when appropriate
6. End responses about Ethiopian topics with an Amharic summary in **bold**
`;

// Function to detect code blocks in message content
const processMessageContent = (content) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      });
    }

    // Add code block
    parts.push({
      type: 'code',
      language: match[1] || 'plaintext',
      content: match[2].trim()
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex)
    });
  }

  return parts;
};

const CodeFrame = ({ code, language }) => {
  const { hasCopied, onCopy } = useClipboard(code);
  
  return (
    <Box
      bg="gray.800"
      borderRadius="md"
      overflow="hidden"
      my={4}
    >
      <HStack 
        justify="space-between" 
        bg="gray.700" 
        p={2}
        borderBottom="1px solid"
        borderColor="gray.600"
      >
        <Text fontSize="sm" color="gray.300">{language}</Text>
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<AiOutlineCopy />}
          onClick={onCopy}
          color="gray.300"
          _hover={{ bg: 'gray.600' }}
        >
          {hasCopied ? 'Copied!' : 'Copy code'}
        </Button>
      </HStack>
      <Box p={4} overflowX="auto">
        <pre style={{ margin: 0 }}>
          <code className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </Box>
    </Box>
  );
};

const Message = ({ message, onRegenerate }) => {
  const isAssistant = message.role === 'assistant';
  const bgColor = useColorModeValue(
    isAssistant ? 'gray.50' : 'white',
    isAssistant ? 'gray.800' : 'gray.700'
  );

  const parts = processMessageContent(message.content);

  return (
    <Box
      w="100%"
      bg={bgColor}
      p={6}
      borderBottom="1px solid"
      borderColor="gray.700"
    >
      <Box maxW="3xl" mx="auto">
        <HStack mb={4} spacing={3}>
          <Box
            w="30px"
            h="30px"
            borderRadius="md"
            bg={isAssistant ? 'brand.accent' : 'gray.600'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            fontSize="sm"
          >
            {isAssistant ? 'AI' : 'Y'}
          </Box>
          <Text fontWeight="bold" color="gray.300">
            {isAssistant ? 'Assistant' : 'You'}
          </Text>
        </HStack>

        <Box color="gray.100">
          {parts.map((part, index) => {
            if (part.type === 'code') {
              return (
                <CodeFrame
                  key={index}
                  code={part.content}
                  language={part.language}
                />
              );
            }
            return (
              <Box key={index} className="markdown-content">
                <ReactMarkdown>{part.content}</ReactMarkdown>
              </Box>
            );
          })}
        </Box>

        {isAssistant && (
          <HStack mt={4} spacing={2} justify="flex-end">
            <IconButton
              icon={<AiOutlineReload />}
              size="sm"
              variant="ghost"
              onClick={() => onRegenerate(message.id)}
              aria-label="Regenerate response"
            />
            <IconButton
              icon={<AiOutlineLike />}
              size="sm"
              variant="ghost"
              aria-label="Like response"
            />
          </HStack>
        )}
      </Box>
    </Box>
  );
};

const ChatArea = ({ chatId }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef(null);
  const toast = useCustomToast();
  const { messages: chatMessages, sendMessage } = useChat(chatId);
  const { user } = useAuth();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages]);

  // Update visible messages when chat messages change
  useEffect(() => {
    setVisibleMessages(chatMessages);
  }, [chatMessages]);

  const makeApiCall = async (messages, currentRetry = 0) => {
    try {
      if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key is not configured');
      }

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Leeybase AI',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3-0324:free',
          messages,
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 0.95,
          stream: true
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        
        if (response.status === 429 && currentRetry < MAX_RETRIES) {
          const delay = calculateBackoff(currentRetry);
          setRetryCount(currentRetry + 1);
          
          // Show retry toast
          toast({
            title: 'Rate limit reached',
            description: `Retrying in ${Math.round(delay/1000)} seconds... (Attempt ${currentRetry + 1}/${MAX_RETRIES})`,
            status: 'info',
            duration: delay,
          });

          await new Promise(resolve => setTimeout(resolve, delay));
          return makeApiCall(messages, currentRetry + 1);
        }

        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a few minutes before trying again.');
        }

        throw new Error(error.message || `API Error: ${response.status}`);
      }

      // Reset retry count on successful request
      setRetryCount(0);
      return response;
    } catch (error) {
      if (error.message.includes('Rate limit') || currentRetry >= MAX_RETRIES) {
        throw error;
      }
      
      const delay = calculateBackoff(currentRetry);
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeApiCall(messages, currentRetry + 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userInput = input.trim();

    if (!userInput || isLoading) return;

    setIsLoading(true);
    const messageId = `msg-${Date.now()}`;

    // Add user message immediately
    const userMessage = { role: 'user', content: userInput, id: messageId };
    setVisibleMessages(prev => [...prev, userMessage]);
    
    // Add typing indicator
    const typingId = `typing-${messageId}`;
    setVisibleMessages(prev => [...prev, { 
      role: 'assistant', 
      content: '', 
      id: typingId,
      isTyping: true 
    }]);

    try {
      await sendMessage(userInput, false, null, 'user', chatId);

      const messages = [
        { role: 'system', content: systemPrompt },
        ...visibleMessages.filter(msg => !msg.isTyping),
        userMessage
      ];

      const response = await makeApiCall(messages);
      const reader = response.body.getReader();
      let accumulatedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                accumulatedResponse += content;
                setVisibleMessages(prev => 
                  prev.map(msg => 
                    msg.id === typingId 
                      ? { ...msg, content: accumulatedResponse }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      // Remove typing indicator and add final response
      setVisibleMessages(prev => prev.filter(msg => msg.id !== typingId));
      const assistantMessage = { 
        role: 'assistant', 
        content: accumulatedResponse, 
        id: `response-${messageId}` 
      };
      setVisibleMessages(prev => [...prev, assistantMessage]);
      await sendMessage(accumulatedResponse, false, null, 'assistant', chatId);
      
      setInput('');
    } catch (error) {
      console.error('Error:', error);
      // Remove typing indicator and add error message
      setVisibleMessages(prev => prev.filter(msg => msg.id !== typingId));
      const errorMessage = error.message.includes('Rate limit') 
        ? "I apologize, but we've hit the rate limit. Please wait a few minutes before sending another message."
        : "I apologize, but I encountered an error. Please try again in a moment.";
      
      setVisibleMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage, 
        id: `error-${messageId}` 
      }]);
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (messageId) => {
    toast({
      title: 'Regenerating response',
      status: 'info',
      duration: 2000,
    });
  };

  return (
    <Box h="100vh" display="flex" flexDirection="column" bg="gray.900">
      <Box flex="1" overflowY="auto" pb={32}>
        {visibleMessages.map((message) => (
          <Message
            key={message.id}
            message={message}
            onRegenerate={handleRegenerate}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <Box
        position="fixed"
        bottom={0}
        left={{ base: 0, md: '300px' }}
        right={0}
        p={4}
        bg="gray.900"
        borderTop="1px solid"
        borderColor="gray.700"
      >
        <Box maxW="3xl" mx="auto">
          <form onSubmit={handleSubmit}>
            <HStack spacing={4}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Leeybase..."
                size="lg"
                bg="gray.800"
                border="1px solid"
                borderColor="gray.700"
                _hover={{ borderColor: 'gray.600' }}
                _focus={{
                  borderColor: 'brand.accent',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-accent)'
                }}
                pr="4.5rem"
              />
              <IconButton
                type="submit"
                icon={isLoading ? <Spinner size="sm" /> : <AiOutlineArrowUp />}
                colorScheme="brand"
                size="lg"
                isDisabled={!input.trim() || isLoading}
                aria-label="Send message"
              />
            </HStack>
          </form>
          
          <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
            Leeybase may produce inaccurate information about people, places, or facts.
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatArea; 