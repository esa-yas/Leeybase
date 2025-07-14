import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  useClipboard,
  useToast,
  Flex,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { AiOutlineCopy, AiOutlineEye } from 'react-icons/ai';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

const CodeBlock = ({ code, language }) => {
  const { hasCopied, onCopy } = useClipboard(code);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [previewError, setPreviewError] = useState(null);

  // Detect if code is HTML/CSS
  const isPreviewable = language === 'html' || 
    (language === 'css' && code.includes('<style>')) || 
    code.includes('<!DOCTYPE html>') ||
    (code.includes('<html>') && code.includes('<body>'));

  const handleCopy = () => {
    onCopy();
    toast({
      title: 'Code copied!',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handlePreview = () => {
    try {
      setPreviewError(null);
      onOpen();
    } catch (error) {
      setPreviewError('Failed to render preview');
      toast({
        title: 'Preview Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Format code using Prism
  const formattedCode = Prism.highlight(
    code,
    Prism.languages[language] || Prism.languages.javascript,
    language
  );

  return (
    <Box position="relative" w="100%">
      <Flex 
        justify="space-between" 
        align="center" 
        bg="gray.800" 
        p={2} 
        borderTopRadius="md"
      >
        <Text color="gray.300" fontSize="sm">
          {language}
        </Text>
        <Flex gap={2}>
          {isPreviewable && (
            <IconButton
              icon={<AiOutlineEye />}
              size="sm"
              onClick={handlePreview}
              aria-label="Preview code"
              colorScheme="blue"
              variant="ghost"
            />
          )}
          <IconButton
            icon={<AiOutlineCopy />}
            size="sm"
            onClick={handleCopy}
            aria-label="Copy code"
            colorScheme={hasCopied ? "green" : "gray"}
            variant="ghost"
          />
        </Flex>
      </Flex>

      <Box
        p={4}
        bg="gray.900"
        borderBottomRadius="md"
        overflow="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.600',
            borderRadius: '4px',
          },
        }}
      >
        <pre style={{ margin: 0 }}>
          <code
            dangerouslySetInnerHTML={{ __html: formattedCode }}
            style={{ fontFamily: 'monospace' }}
          />
        </pre>
      </Box>

      {/* Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="90vw" maxH="90vh">
          <ModalHeader>Code Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={0}>
            {previewError ? (
              <Text color="red.500" p={4}>{previewError}</Text>
            ) : (
              <Box
                as="iframe"
                width="100%"
                height="70vh"
                srcDoc={code}
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CodeBlock; 