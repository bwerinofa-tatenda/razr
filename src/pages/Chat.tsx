import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getChatMessages, createChatMessage, invokeAIChat } from '../utils/api';
import { Send, Mic, Loader2, BookOpen, ChevronDown, X } from 'lucide-react';

type ChatMode = 'coach' | 'pre_session' | 'post_session' | 'psychology' | 'orderflow';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  user_id: string;
  created_at: string;
  metadata?: {
    usedNotes?: any[];
    hasKnowledgeBase?: boolean;
    mode?: ChatMode;
  };
}

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('coach');
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatModes = [
    { value: 'coach', label: 'Trading Coach', description: 'General coaching and guidance' },
    { value: 'pre_session', label: 'Pre-Session', description: 'Mental preparation routine' },
    { value: 'post_session', label: 'Post-Session', description: 'Review and learning extraction' },
    { value: 'psychology', label: 'Psychology', description: 'Mental edge and emotional control' },
    { value: 'orderflow', label: 'Order Flow', description: 'Market structure concepts' }
  ];

  useEffect(() => {
    loadMessages();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!user) return;
    try {
      const data = await getChatMessages(user.id);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleSourceExpansion = (index: number) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setLoading(true);

    // Add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      user_id: user.id,
      created_at: new Date().toISOString(),
      metadata: { mode: chatMode }
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      await createChatMessage(newUserMessage);

      // Call AI edge function
      const aiData = await invokeAIChat(userMessage, chatMode, user.id);

      const aiResponse: Message = {
        role: 'assistant',
        content: aiData.response,
        user_id: user.id,
        created_at: new Date().toISOString(),
        metadata: {
          usedNotes: aiData.usedNotes || [],
          hasKnowledgeBase: aiData.hasKnowledgeBase || false,
          mode: chatMode
        }
      };

      setMessages(prev => [...prev, aiResponse]);
      await createChatMessage(aiResponse);
      setLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please make sure the AI service is properly configured.',
        user_id: user.id,
        created_at: new Date().toISOString(),
        metadata: { mode: chatMode }
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
    }
  };

  const quickPrompts: Record<ChatMode, string[]> = {
    coach: [
      "How can I improve my trading discipline?",
      "What should I focus on in my next session?",
      "Help me understand my recent trading patterns",
      "What are key principles for order flow trading?"
    ],
    pre_session: [
      "Help me prepare for today's session",
      "What should I check before trading?",
      "Review my trading rules with me",
      "What's my mental state checklist?"
    ],
    post_session: [
      "Review my trading session",
      "What did I learn today?",
      "Analyze my decision-making quality",
      "What patterns should I note?"
    ],
    psychology: [
      "How do I handle fear in trading?",
      "Help me with FOMO issues",
      "Build my trading confidence",
      "Manage stress during volatility"
    ],
    orderflow: [
      "Explain auction theory",
      "What are liquidity concepts?",
      "How does volume profile work?",
      "Smart money vs retail behavior"
    ]
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-normal text-gray-900 dark:text-white">AI Trading Coach</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Get personalized coaching based on your trading knowledge base
        </p>
      </div>

      {/* Chat Mode Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Coaching Mode
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {chatModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setChatMode(mode.value as ChatMode)}
              className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                chatMode === mode.value
                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
              title={mode.description}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="mb-4 flex flex-wrap gap-2">
        {quickPrompts[chatMode].map((prompt, index) => (
          <button
            key={index}
            onClick={() => setInputMessage(prompt)}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">Start your coaching session!</p>
                <p className="text-sm">Ask me anything about your trading journey</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="p-4">
                    {/* Knowledge Base Indicator */}
                    {message.role === 'assistant' && message.metadata?.hasKnowledgeBase && (
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                        <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          Referenced your knowledge base
                        </span>
                      </div>
                    )}

                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {/* Coaching Mode Badge */}
                    {message.metadata?.mode && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                          {chatModes.find(m => m.value === message.metadata?.mode)?.label || message.metadata.mode}
                        </span>
                      </div>
                    )}

                    {/* Source Attribution */}
                    {message.role === 'assistant' && message.metadata?.usedNotes && message.metadata.usedNotes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={() => toggleSourceExpansion(index)}
                          className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                        >
                          <BookOpen className="h-3 w-3" />
                          <span>View {message.metadata.usedNotes.length} source(s)</span>
                          <ChevronDown
                            className={`h-3 w-3 transition-transform ${
                              expandedSources.has(index) ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {expandedSources.has(index) && (
                          <div className="mt-2 space-y-2">
                            {message.metadata.usedNotes.map((note: any, noteIdx: number) => (
                              <div
                                key={noteIdx}
                                className="text-xs p-2 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
                              >
                                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Note {noteIdx + 1}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {note.text || '(No content)'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                <span className="text-gray-500 dark:text-gray-400">Coach is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask your ${chatModes.find(m => m.value === chatMode)?.label.toLowerCase()}...`}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50"
            />
            <button
              type="button"
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Voice input (coming soon)"
            >
              <Mic className="h-5 w-5" />
            </button>
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
