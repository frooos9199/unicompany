'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import Navbar from '@/components/layout/Navbar';
import Input from '@/components/ui/Input';
import { FiChevronLeft, FiList, FiSend, FiMessageSquare } from 'react-icons/fi';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { ChatMessage, Conversation } from '@/types';

export default function ChatPage() {
  const { locale, theme } = useAppStore();
  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const isAr = locale === 'ar';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/auth/login');
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConversations(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Conversation)));
    });

    return () => unsubscribe();
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!activeConversation) return;

    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', activeConversation),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as ChatMessage)));
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    return () => unsubscribe();
  }, [activeConversation]);

  useEffect(() => {
    const targetConversation = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('conversation')
      : null;

    if (targetConversation && conversations.some((conversation) => conversation.id === targetConversation)) {
      setActiveConversation(targetConversation);
      setShowConversationList(false);
      return;
    }

    if (!activeConversation && conversations.length > 0) {
      setActiveConversation(conversations[0].id);
    }
  }, [activeConversation, conversations]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !user) return;

    await addDoc(collection(db, 'messages'), {
      conversationId: activeConversation,
      senderId: user.uid,
      content: newMessage.trim(),
      createdAt: serverTimestamp(),
      read: false,
    });

    await updateDoc(doc(db, 'conversations', activeConversation), {
      lastMessage: newMessage.trim(),
      lastMessageAt: serverTimestamp(),
    });

    setNewMessage('');
  };

  if (authLoading || !user) return null;

  const getConversationTitle = (conversation: Conversation) => {
    const currentUserIndex = conversation.participants.findIndex((participant) => participant === user.uid);
    const otherParticipantIndex = currentUserIndex === 0 ? 1 : 0;
    return conversation.participantNames?.[otherParticipantIndex] || conversation.participantNames?.find((name) => name !== user.displayName) || 'User';
  };

  const activeConversationDetails = conversations.find((conversation) => conversation.id === activeConversation) || null;

  return (
    <main>
      <Navbar />
      <div className="pt-16 h-screen flex flex-col md:flex-row">
        {/* Conversations List */}
        <div className={`${showConversationList ? 'block' : 'hidden'} md:block w-full md:w-80 border-e border-[var(--border)] bg-[var(--card)] overflow-y-auto`}>
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-[var(--foreground)]">
                {isAr ? 'المحادثات' : 'Conversations'}
              </h2>
              <button
                onClick={() => setShowConversationList(false)}
                className="md:hidden text-[var(--foreground-secondary)] hover:text-[var(--primary-light)] transition-colors"
              >
                <FiChevronLeft size={18} />
              </button>
            </div>
          </div>
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-[var(--foreground-secondary)]">
              <FiMessageSquare size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">{isAr ? 'لا توجد محادثات' : 'No conversations'}</p>
            </div>
          ) : (
            conversations.map(conv => {
              const conversationTitle = getConversationTitle(conv);

              return (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveConversation(conv.id);
                  setShowConversationList(false);
                }}
                className={`w-full p-4 text-start border-b border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors ${
                  activeConversation === conv.id ? 'bg-[var(--background-secondary)]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-bold text-sm">
                    U
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--foreground)] text-sm truncate">
                      {conversationTitle}
                    </p>
                    <p className="text-xs text-[var(--foreground-secondary)] truncate">
                      {conv.lastMessage || ''}
                    </p>
                  </div>
                </div>
              </button>
              );
            })
          )}
        </div>

        {/* Chat Area */}
        <div className={`${showConversationList ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
          {activeConversation ? (
            <>
              <div className="md:hidden flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
                <button
                  onClick={() => setShowConversationList(true)}
                  className="inline-flex items-center gap-2 text-sm text-[var(--foreground-secondary)] hover:text-[var(--primary-light)] transition-colors"
                >
                  <FiList size={16} />
                  {isAr ? 'المحادثات' : 'Conversations'}
                </button>
                <p className="font-medium text-[var(--foreground)] truncate">{activeConversationDetails ? getConversationTitle(activeConversationDetails) : ''}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${
                      msg.senderId === user.uid
                        ? 'bg-[var(--primary)] text-white rounded-br-sm'
                        : 'bg-[var(--background-secondary)] text-[var(--foreground)] rounded-bl-sm'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[var(--border)] bg-[var(--card)]">
                <div className="flex gap-2">
                  <Input
                    placeholder={isAr ? 'اكتب رسالة...' : 'Type a message...'}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendMessage}
                    className="px-4 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-light)] transition-colors"
                  >
                    <FiSend size={20} />
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--foreground-secondary)]">
              <div className="text-center">
                <FiMessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>{isAr ? 'اختر محادثة للبدء' : 'Select a conversation to start'}</p>
                {conversations.length > 0 && (
                  <button
                    onClick={() => setShowConversationList(true)}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--primary-light)] hover:text-[var(--primary)] transition-colors md:hidden"
                  >
                    <FiList size={16} />
                    {isAr ? 'عرض المحادثات' : 'Show Conversations'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
