import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Phone, Video, Send, Paperclip, Plus, ArrowLeft, MessageSquare, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState<'general' | string>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch initial messages for General Chat (receiver_id is null)
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .is('receiver_id', null)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        // Only add if it belongs to current chat (General = null receiver)
        if (newMsg.receiver_id === null) {
          setMessages(prev => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msgContent = newMessage;
    setNewMessage(''); // Optimistic clear

    const { error } = await supabase.from('messages').insert([{
      content: msgContent.trim(),
      sender_id: user.id,
      receiver_id: null // General Chat
    }]);

    if (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar mensaje');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-full bg-background overflow-hidden relative">
      {/* Chat List Sidebar */}
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col bg-surface/50 h-full ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3 mb-4 md:hidden">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white">Mensajes</h1>
          </div>
          <h1 className="text-xl font-bold text-white mb-4 hidden md:block">Mensajes</h1>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-primary outline-none placeholder-gray-600"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* General Chat Item */}
          <div
            onClick={() => setActiveChat('general')}
            className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-white/5 md:border-none ${activeChat === 'general' ? 'bg-white/10' : 'hover:bg-white/5'}`}
          >
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <MessageSquare size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-bold text-white truncate">Chat General</h3>
                <span className="text-xs text-gray-500">Ahora</span>
              </div>
              <p className="text-sm text-gray-400 truncate">Canal de equipo global</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-background h-full ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat === 'general' ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-surface/30 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat('')} className="md:hidden text-gray-400 hover:text-white">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-white">Chat General</h2>
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> En línea
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex gap-2">
                  <button onClick={() => alert("Llamada de voz no disponible en esta versión.")} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Phone size={20} /></button>
                  <button onClick={() => alert("Videollamada no disponible en esta versión.")} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Video size={20} /></button>
                  <button onClick={() => alert("Opciones:\n- Ver perfil\n- Buscar en el chat\n- Silenciar notificaciones")} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><MoreVertical size={20} /></button>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0c0c1a]">
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl p-4 ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-surface border border-white/10 rounded-tl-none'}`}>
                      {!isMe && <p className="text-xs font-bold text-primary mb-1">Usuario</p>}
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-surface border-t border-white/5">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 bg-[#05050a] border border-white/10 rounded-xl p-2 focus-within:border-primary/50 transition-colors"
              >
                <button type="button" onClick={() => alert('Función de adjuntar archivo próximamente.')} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <Plus size={20} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
                />
                <button type="button" onClick={() => alert('Función de adjuntar archivo próximamente.')} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <Paperclip size={20} />
                </button>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          // Empty State if no chat selected (Desktop)
          <div className="hidden md:flex flex-1 flex-col bg-background h-full items-center justify-center text-gray-500">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <MessageSquare size={32} className="opacity-50" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Tus Mensajes</h2>
            <p className="text-sm max-w-xs text-center">Selecciona una conversación.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;