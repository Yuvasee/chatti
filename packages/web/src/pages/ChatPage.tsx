import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Divider, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ChatHeader from '../components/ChatHeader';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import { useAuth } from '../contexts/AuthContext';

// Mock data - will be replaced with API calls
const MOCK_MESSAGES = [
  {
    id: 'msg-1',
    content: 'Hello! How are you doing today?',
    sender: {
      id: 'user-456',
      name: 'Alice',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=alice',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    translations: [
      { language: 'es', text: '¡Hola! ¿Cómo estás hoy?' },
      { language: 'fr', text: 'Bonjour! Comment allez-vous aujourd\'hui?' },
      { language: 'de', text: 'Hallo! Wie geht es dir heute?' },
    ],
  },
  {
    id: 'msg-2',
    content: 'I\'m doing great! Just working on a new project.',
    sender: {
      id: 'user-123',
      name: 'Current User',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=currentuser',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 14),
    translations: [
      { language: 'es', text: '¡Estoy muy bien! Solo trabajando en un nuevo proyecto.' },
      { language: 'fr', text: 'Je vais très bien! Je travaille juste sur un nouveau projet.' },
      { language: 'de', text: 'Mir geht es gut! Ich arbeite gerade an einem neuen Projekt.' },
    ],
  },
  {
    id: 'msg-3',
    content: 'That sounds interesting! What kind of project is it?',
    sender: {
      id: 'user-456',
      name: 'Alice',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=alice',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    translations: [
      { language: 'es', text: '¡Eso suena interesante! ¿Qué tipo de proyecto es?' },
      { language: 'fr', text: 'Ça a l\'air intéressant! Quel genre de projet est-ce?' },
      { language: 'de', text: 'Das klingt interessant! Was für ein Projekt ist das?' },
    ],
  },
  {
    id: 'msg-4',
    content: 'It\'s a multilingual chat application called Chatti.',
    sender: {
      id: 'user-123',
      name: 'Current User',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=currentuser',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    translations: [
      { language: 'es', text: 'Es una aplicación de chat multilingüe llamada Chatti.' },
      { language: 'fr', text: 'C\'est une application de chat multilingue appelée Chatti.' },
      { language: 'de', text: 'Es ist eine mehrsprachige Chat-Anwendung namens Chatti.' },
    ],
  },
];

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, setUserLanguage } = useAuth();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Simulate loading chat data
  useEffect(() => {
    if (isAuthenticated) {
      const loadChat = async () => {
        try {
          // Mock API call - will be replaced with real API
          await new Promise(resolve => setTimeout(resolve, 1000));
          setIsLoading(false);
        } catch (error) {
          console.error('Failed to load chat:', error);
          // Redirect to login on error
          navigate('/login');
        }
      };

      loadChat();
    }
  }, [chatId, isAuthenticated, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!user) return;
    
    const newMessage = {
      id: `msg-${Date.now()}`,
      content,
      sender: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
      timestamp: new Date(),
      translations: [], // Would be populated by backend
    };

    setMessages([...messages, newMessage]);

    // Mock API call - would send to backend in reality
    // await sendMessageToApi(chatId, content);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setUserLanguage(newLanguage);
  };

  if (!chatId || !user) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <ChatHeader 
        chatId={chatId}
        selectedLanguage={user.language}
        onLanguageChange={handleLanguageChange}
      />
      
      <Box sx={{ 
        flexGrow: 1, 
        backgroundColor: 'background.default', 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
      }}>
        {isLoading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%' 
          }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            flexDirection: 'column',
            textAlign: 'center',
            gap: 2,
          }}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2, maxWidth: 400 }}>
              <Typography variant="h6" gutterBottom>
                No messages yet
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">
                Start the conversation by sending a message below.
              </Typography>
            </Paper>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1 }}>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                sender={message.sender}
                timestamp={message.timestamp}
                isCurrentUser={message.sender.id === user.id}
                translations={message.translations}
                selectedLanguage={user.language}
              />
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>
      
      <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isLoading}
        />
      </Box>
    </Box>
  );
};

export default ChatPage; 