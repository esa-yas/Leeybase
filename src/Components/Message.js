import {
  Box,
  Text,
  Flex,
  IconButton,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import { AiOutlineReload, AiOutlineLike } from 'react-icons/ai';
import ReactMarkdown from 'react-markdown';

const Message = ({ message, onReaction, onRegenerate, isTyping }) => {
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const bgColor = useColorModeValue(
    message.role === 'assistant' ? 'blue.50' : 'gray.50',
    message.role === 'assistant' ? 'whiteAlpha.200' : 'whiteAlpha.100'
  );

  return (
    <Box
      w="100%"
      p={4}
      bg={bgColor}
      borderRadius="lg"
      position="relative"
    >
      <Box
        className="markdown-content"
        color={textColor}
        css={{
          '& p': {
            marginBottom: '1em',
            whiteSpace: 'pre-wrap'
          },
          '& strong': {
            fontWeight: 'bold',
            color: 'inherit'
          },
          '& h1': {
            fontSize: '1.5em',
            fontWeight: 'bold',
            marginBottom: '0.5em',
            marginTop: '0.5em'
          },
          '& h2': {
            fontSize: '1.25em',
            fontWeight: 'semibold',
            marginBottom: '0.5em',
            marginTop: '0.5em'
          },
          '& h3': {
            fontSize: '1.1em',
            fontWeight: 'medium',
            marginBottom: '0.5em',
            marginTop: '0.5em'
          },
          '& ul, & ol': {
            paddingLeft: '1.5em',
            marginBottom: '1em'
          },
          '& li': {
            marginBottom: '0.25em'
          },
          '& code': {
            fontFamily: 'monospace',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            padding: '0.2em 0.4em',
            borderRadius: '3px'
          },
          '& pre': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            padding: '1em',
            borderRadius: '5px',
            overflow: 'auto',
            marginBottom: '1em'
          },
          '& blockquote': {
            borderLeft: '4px solid',
            borderColor: 'rgba(0, 0, 0, 0.2)',
            paddingLeft: '1em',
            marginLeft: '0',
            marginBottom: '1em'
          }
        }}
      >
        {isTyping ? (
          <Text as="div" style={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
            <Box as="span" animation="blink 1s infinite">▋</Box>
          </Text>
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}
      </Box>
      
      {!isTyping && (
        <Flex position="absolute" right={2} bottom={2} gap={2}>
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
            onClick={() => onReaction(message.id, 'like')}
            aria-label="Like response"
          />
        </Flex>
      )}
    </Box>
  );
};

export default Message; 