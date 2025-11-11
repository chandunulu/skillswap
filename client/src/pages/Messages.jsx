import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { initializeSocket, getSocket } from '../services/socket';
import { Send, Search, MessageCircle, Code } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketInitialized = useRef(false);

  // Initialize socket once
  useEffect(() => {
    if (user?._id && !socketInitialized.current) {
      console.log('Initializing socket for user:', user._id);
      const socket = initializeSocket(user._id);
      socketInitialized.current = true;

      socket.emit('user-online', user._id);

      socket.on('receive-message', (message) => {
        console.log('Received message:', message);
        if (selectedUser && message.sender._id === selectedUser._id) {
          setMessages((prev) => [...prev, message]);
        }
        fetchConversations();
      });

      socket.on('user-typing', (data) => {
        console.log('User typing:', data);
        if (selectedUser && data.senderId === selectedUser._id) {
          setTyping(true);
          setTimeout(() => setTyping(false), 3000);
        }
      });

      return () => {
        socket.off('receive-message');
        socket.off('user-typing');
      };
    }
  }, [user?._id]);

  // Handle navigation state
  useEffect(() => {
    if (location.state?.selectedUser) {
      console.log('Auto-selecting user from navigation:', location.state.selectedUser);
      handleUserSelect(location.state.selectedUser);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch conversations and connections on mount
  useEffect(() => {
    if (user?._id) {
      fetchConversationsAndConnections();
    }
  }, [user?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversationsAndConnections = async () => {
    try {
      console.log('Fetching conversations and connections...');
      
      // Fetch both conversations and connections in parallel
      const [conversationsRes, connectionsRes] = await Promise.all([
        api.get('/messages/conversations').catch(() => ({ data: [] })),
        api.get('/connections/list').catch(() => ({ data: [] }))
      ]);

      console.log('Conversations response:', conversationsRes.data);
      console.log('Connections response:', connectionsRes.data);

      setConversations(conversationsRes.data);
      setConnections(connectionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      if (error.response?.status === 404) {
        setConversations([]);
      }
    }
  };

  const fetchMessages = async (userId) => {
    try {
      console.log('Fetching messages for user:', userId);
      const response = await api.get(`/messages/conversation/${userId}`);
      console.log('Messages response:', response.data);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 404) {
        setMessages([]);
      }
    }
  };

  const handleUserSelect = async (userOrConversation) => {
    console.log('Selecting user:', userOrConversation);
    
    let otherUser;
    
    // Handle different input formats
    if (userOrConversation._id && typeof userOrConversation._id === 'object') {
      // From conversations list
      otherUser = userOrConversation._id;
    } else if (userOrConversation._id || userOrConversation.id) {
      // Direct user object (from connections or navigation)
      otherUser = userOrConversation;
    } else {
      console.error('Invalid user selection:', userOrConversation);
      return;
    }
    
    setSelectedUser(otherUser);
    
    const userId = otherUser._id || otherUser.id;
    console.log('Selected user ID:', userId);
    
    if (userId) {
      await fetchMessages(userId);
      
      // Mark messages as read
      try {
        await api.put(`/messages/read/${userId}`);
        fetchConversations();
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) {
      console.log('Cannot send: missing message or user');
      return;
    }

    const receiverId = selectedUser._id || selectedUser.id;
    
    if (!receiverId) {
      console.error('No receiver ID found');
      return;
    }

    try {
      console.log('Sending message to:', receiverId);
      const response = await api.post('/messages/send', {
        receiverId: receiverId,
        content: newMessage
      });

      console.log('Message sent:', response.data);

      const socket = getSocket();
      if (socket) {
        socket.emit('send-message', {
          receiverId: receiverId,
          message: response.data
        });
      }

      setMessages([...messages, response.data]);
      setNewMessage('');
      
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleTyping = () => {
    if (!selectedUser) return;
    
    const socket = getSocket();
    if (!socket) return;
    
    const receiverId = selectedUser._id || selectedUser.id;
    
    if (receiverId) {
      socket.emit('typing', {
        receiverId: receiverId,
        senderId: user._id
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {}, 3000);
  };

  // Merge conversations and connections
  const getMergedList = () => {
    const conversationMap = new Map();
    
    // Add all conversations with their metadata
    conversations.forEach(conv => {
      const otherUser = conv._id || conv.user || conv;
      const userId = otherUser?._id || otherUser?.id;
      if (userId) {
        conversationMap.set(userId, {
          user: otherUser,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount || 0,
          hasConversation: true
        });
      }
    });

    // Add connections that don't have conversations
    connections.forEach(connection => {
      const userId = connection._id || connection.id;
      if (userId && !conversationMap.has(userId)) {
        conversationMap.set(userId, {
          user: connection,
          lastMessage: null,
          unreadCount: 0,
          hasConversation: false
        });
      }
    });

    // Convert to array and sort: conversations first, then alphabetically
    return Array.from(conversationMap.values()).sort((a, b) => {
      // Prioritize items with conversations
      if (a.hasConversation && !b.hasConversation) return -1;
      if (!a.hasConversation && b.hasConversation) return 1;
      
      // Then sort by last message time for conversations
      if (a.hasConversation && b.hasConversation) {
        const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      }
      
      // Alphabetically for non-conversation connections
      const nameA = a.user?.name || '';
      const nameB = b.user?.name || '';
      return nameA.localeCompare(nameB);
    });
  };

  const mergedList = getMergedList();

  const filteredList = mergedList.filter((item) => {
    const userName = item.user?.name || '';
    return userName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (date) => {
    if (!date) return '';
    
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white">
      {/* Connections/Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search connections..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageCircle className="text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-sm">No connections yet</p>
              <p className="text-gray-500 text-xs mt-2">Connect with users to start chatting</p>
            </div>
          ) : (
            filteredList.map((item) => {
              const otherUser = item.user;
              const userId = otherUser?._id || otherUser?.id;
              const userName = otherUser?.name || 'Unknown User';
              
              return (
                <div
                  key={userId || Math.random()}
                  onClick={() => handleUserSelect(otherUser)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedUser && (selectedUser._id === userId || selectedUser.id === userId)
                      ? 'bg-primary-50 border-l-4 border-l-primary-600'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{userName}</h3>
                        {item.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatTime(item.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {item.lastMessage?.content || 'Start a conversation'}
                      </p>
                    </div>

                    {item.unreadCount > 0 && (
                      <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {item.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedUser.name || 'Unknown User'}</h3>
                    <p className="text-xs text-gray-600">{selectedUser.email || ''}</p>
                  </div>
                </div>

                <a
                  href="https://c0desync.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  title="Start CodeSync Session"
                >
                  <Code size={18} />
                  <span className="text-sm">CodeSync</span>
                </a>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const senderId = message.sender?._id || message.sender;
                  const isOwn = senderId === user._id || senderId === user.id;
                  
                  return (
                    <div
                      key={message._id || index}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isOwn
                              ? 'bg-primary-600 text-white rounded-br-none'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              {typing && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 rounded-bl-none">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a connection from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;