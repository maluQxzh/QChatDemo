
import React from 'react';
import { Message, MessageType, MessageStatus } from '../types';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  showAvatar?: boolean;
}

const formatTime = (ts: number) => {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe, showAvatar }) => {
  
  const getStatusIcon = () => {
    switch (message.status) {
      case MessageStatus.PENDING: return <Clock size={12} className="text-slate-400" />;
      case MessageStatus.SENT: return <Check size={12} className="text-slate-400" />;
      case MessageStatus.DELIVERED: return <CheckCheck size={12} className="text-blue-500" />;
      case MessageStatus.FAILED: return <AlertCircle size={12} className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className={`flex w-full mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {!isMe && showAvatar && (
        <div className="mr-2 flex-shrink-0 self-end">
           {/* Placeholder for avatar if needed, handled by parent usually */}
        </div>
      )}
      
      <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative px-4 py-2 shadow-sm ${
            message.type === MessageType.IMAGE ? 'p-1 bg-transparent shadow-none' : ''
          } ${
            isMe
              ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm'
          }`}
        >
          {message.type === MessageType.TEXT && (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
          )}

          {message.type === MessageType.IMAGE && (
            <div className="relative">
                <img 
                    src={message.content} 
                    alt="Attachment" 
                    className="rounded-lg max-h-64 object-cover border border-slate-200 dark:border-slate-700"
                    loading="lazy"
                />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 mt-1 px-1">
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {formatTime(message.timestamp)}
          </span>
          {isMe && getStatusIcon()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
