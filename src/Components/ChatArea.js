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
import { GoogleGenerativeAI } from "@google/generative-ai";

// Google Gemini API configuration
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const GEMINI_TEXT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

if (!GOOGLE_API_KEY) {
  console.error('Google API key is not configured. Please check your .env file.');
}

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
      if (!GOOGLE_API_KEY) {
        throw new Error('Google API key is not configured');
      }

      // Format messages for Gemini
      const formattedMessages = messages.map(msg => msg.content).join('\n');

      const headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': GOOGLE_API_KEY
      };

      const data = {
        "contents": [
          {
            "parts": [
              {
                "text": systemPrompt
              },
              {
                "text": formattedMessages
              }
            ]
          }
        ]
      };

      const response = await fetch(GEMINI_TEXT_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates.length > 0) {
        const content = result.candidates[0].content;
        if (content.parts && content.parts.length > 0) {
          return content.parts[0].text;
        }
      }
      
      throw new Error('Unexpected response format from Gemini API');
    } catch (error) {
      if (error.message.includes('Rate limit') && currentRetry < MAX_RETRIES) {
        const delay = calculateBackoff(currentRetry);
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeApiCall(messages, currentRetry + 1);
      }
      throw error;
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
      
      // Remove typing indicator and add final response
      setVisibleMessages(prev => prev.filter(msg => msg.id !== typingId));
      const assistantMessage = { 
        role: 'assistant', 
        content: response,
        id: `response-${messageId}` 
      };
      setVisibleMessages(prev => [...prev, assistantMessage]);
      await sendMessage(response, false, null, 'assistant', chatId);
      
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
