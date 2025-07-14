import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  useDisclosure,
  Collapse,
  Badge,
} from '@chakra-ui/react';
import {
  AiOutlinePlus,
  AiOutlineSearch,
  AiOutlineHistory,
  AiOutlineSetting,
  AiOutlineMessage,
  AiOutlineDelete,
} from 'react-icons/ai';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ChatItem = ({ chat, isSelected, onClick, onDelete }) => {
  return (
    <HStack
      w="100%"
      p={3}
      bg={isSelected ? 'brand.hover' : 'transparent'}
      _hover={{ bg: 'brand.hover' }}
      borderRadius="md"
      cursor="pointer"
      onClick={onClick}
      justify="space-between"
    >
      <HStack spacing={3}>
        <AiOutlineMessage />
        <Text noOfLines={1}>{chat.title || 'New Chat'}</Text>
      </HStack>
      {isSelected && (
        <IconButton
          icon={<AiOutlineDelete />}
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(chat.id);
          }}
          aria-label="Delete chat"
        />
      )}
    </HStack>
  );
};

const Sidebar = ({ onChatSelect, selectedChatId }) => {
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { isOpen, onToggle } = useDisclosure();
  const { user } = useAuth();

  useEffect(() => {
    // Fetch chats from your backend/database
    // This is a placeholder for demonstration
    setChats([
      { id: '1', title: 'Chat 1' },
      { id: '2', title: 'Chat 2' },
      // ... more chats
    ]);
  }, []);

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
    };
    setChats([newChat, ...chats]);
    onChatSelect(newChat.id);
  };

  const handleDeleteChat = (chatId) => {
    setChats(chats.filter(chat => chat.id !== chatId));
    if (selectedChatId === chatId) {
      onChatSelect(null);
    }
  };

  return (
    <Box
      w={{ base: 'full', md: '300px' }}
      h="100vh"
      bg="brand.primary"
      borderRight="1px"
      borderColor="brand.border"
      p={4}
    >
      <VStack spacing={4} align="stretch">
        {/* New Chat Button */}
        <Button
          leftIcon={<AiOutlinePlus />}
          onClick={handleNewChat}
          variant="outline"
          borderColor="brand.border"
          justifyContent="flex-start"
          w="100%"
        >
          New Chat
        </Button>

        {/* Search */}
        <InputGroup>
          <InputLeftElement>
            <AiOutlineSearch color="gray.500" />
          </InputLeftElement>
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>

        {/* Chat History */}
        <Box flex="1" overflowY="auto">
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between" py={2}>
              <Text fontSize="sm" color="gray.500">Recent Chats</Text>
              <IconButton
                icon={<AiOutlineHistory />}
                variant="ghost"
                size="sm"
                onClick={onToggle}
                aria-label="Toggle history"
              />
            </HStack>
            
            <Collapse in={isOpen}>
              <VStack spacing={1} align="stretch">
                {filteredChats.map(chat => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isSelected={selectedChatId === chat.id}
                    onClick={() => onChatSelect(chat.id)}
                    onDelete={handleDeleteChat}
                  />
                ))}
              </VStack>
            </Collapse>
          </VStack>
        </Box>

        {/* User Section */}
        <Divider />
        <HStack justify="space-between" py={2}>
          <HStack>
            <Box
              w="32px"
              h="32px"
              borderRadius="full"
              bg="brand.accent"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {user?.email?.[0].toUpperCase()}
            </Box>
            <Text>{user?.email}</Text>
          </HStack>
          <IconButton
            icon={<AiOutlineSetting />}
            variant="ghost"
            size="sm"
            aria-label="Settings"
          />
        </HStack>
      </VStack>
    </Box>
  );
};

export default Sidebar; 