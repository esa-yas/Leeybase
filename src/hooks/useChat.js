import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useChat = (chatId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    
    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [chatId]);

  const sendMessage = async (content, isCode = false, language = null, role = 'user', specificChatId = chatId) => {
    if (!user || !content.trim() || !specificChatId) return false;

    const message = {
      chat_id: specificChatId,
      user_id: user.id,
      content,
      role,
      is_code: isCode,
      language,
    };

    const { error } = await supabase
      .from('messages')
      .insert(message);

    if (error) {
      console.error('Error sending message:', error);
      return false;
    }

    return true;
  };

  const updateReaction = async (messageId, reactionType) => {
    const { data, error } = await supabase
      .from('messages')
      .select('reactions')
      .eq('id', messageId)
      .single();

    if (error) {
      console.error('Error fetching reactions:', error);
      return;
    }

    const updatedReactions = {
      ...data.reactions,
      [reactionType]: (data.reactions[reactionType] || 0) + 1,
    };

    const { error: updateError } = await supabase
      .from('messages')
      .update({ reactions: updatedReactions })
      .eq('id', messageId);

    if (updateError) {
      console.error('Error updating reaction:', updateError);
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    updateReaction,
  };
}; 
