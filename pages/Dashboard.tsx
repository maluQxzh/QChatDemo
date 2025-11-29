
import React, { useState, useEffect } from 'react';
import { Conversation, User, FriendRequest } from '../types';
import { storageService } from '../services/storageService';
import { socketService } from '../services/socketService';
import ChatInterface from '../components/ChatInterface';
import Avatar from '../components/Avatar';
import { Search, Settings, MessageSquare, LogOut, Wifi, WifiOff, Plus, UserPlus, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connectionState, setConnectionState] = useState(socketService.getState());
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  
  // Add Friend Inputs
  const [newFriendId, setNewFriendId] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    // Initialization
    const init = async () => {
      // Prevent fetching user from storage if we already have one (e.g. passed from login or kept in memory)
      if (socketService.getState() === 'CONNECTED' && currentUser) {
          refreshData();
          return;
      }

      await storageService.init();
      const user = await storageService.getCurrentUser();
      if (!user) {
          navigate('/');
          return;
      }
      setCurrentUser(user);

      // Re-connect if needed (page refresh)
      if (socketService.getState() === 'DISCONNECTED') {
          socketService.connect(user);
      }

      refreshData();
    };
    init();

    // Listeners
    const subSocket = socketService.onConnectionChange((state) => {
        setConnectionState(state);
    });
    
    // Refresh list on message AND PERSIST IT
    const subMsg = socketService.onMessage(async (msg) => {
        await storageService.saveMessage(msg);

        // FIX: If the message belongs to the active conversation, mark it as read immediately
        if (activeConversationId === msg.conversationId) {
            await storageService.markConversationRead(msg.conversationId);
        }
        
        refreshData();
    });

    // Handle Friend Signals
    const subReq = socketService.onFriendRequest(async (req) => {
        const request = req as { fromUser: User, timestamp: number };
        await storageService.addFriendRequest(request);
        refreshData();
    });

    const subAccept = socketService.onFriendAccept(async (data) => {
        const { user } = data as { user: User };
        await storageService.addContact(user);
        await storageService.createConversation(user.id);
        refreshData();
    });

    const subRemove = socketService.onFriendRemove(async (data) => {
        const { userId } = data as { userId: string };
        await storageService.removeContact(userId);
        await storageService.removeConversationByParticipantId(userId);
        if (activeConversationId) {
             const convo = conversations.find(c => c.id === activeConversationId);
             if (convo && convo.participantId === userId) {
                 setActiveConversationId(null);
             }
        }
        refreshData();
    });

    // Handle Force Logout
    const subForceLogout = socketService.onForceLogout(() => {
        alert('您的账号已在别处登录，当前连接已断开。');
        handleLogout();
    });

    return () => {
        subSocket();
        subMsg();
        subReq();
        subAccept();
        subRemove();
        subForceLogout();
    };
  }, [activeConversationId, conversations]);

  const refreshData = async () => {
      const storedConvos = await storageService.getConversations();
      const storedContacts = await storageService.getContacts();
      const storedRequests = await storageService.getFriendRequests();
      setConversations(storedConvos);
      setContacts(storedContacts);
      setFriendRequests(storedRequests);
  };

  const getContact = (id: string) => contacts.find(c => c.id === id) || { 
      id: id, 
      username: '未知用户', 
      status: 'offline' 
  } as User;

  const handleLogout = () => {
      socketService.disconnect();
      storageService.logout(); 
      navigate('/');
  };

  const handleSendRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFriendId.trim() || !currentUser) return;
      
      const targetId = newFriendId.trim();
      
      if (contacts.find(c => c.id === targetId)) {
          alert('已经是好友了');
          return;
      }
      
      if (targetId === currentUser.id) {
          alert('不能添加自己');
          return;
      }

      try {
          await socketService.sendFriendRequest(targetId, currentUser);
          setShowAddFriend(false);
          setNewFriendId('');
          alert('已发送好友请求');
      } catch (e) {
          alert('发送失败：未连接到服务器');
      }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
      if (!currentUser) return;
      await storageService.addContact(request.fromUser);
      const convoId = await storageService.createConversation(request.fromUser.id);
      await storageService.removeFriendRequest(request.fromUser.id);
      await socketService.acceptFriendRequest(request.fromUser.id, currentUser);
      
      refreshData();
      setActiveConversationId(convoId);
  };

  const handleRejectRequest = async (userId: string) => {
      await storageService.removeFriendRequest(userId);
      refreshData();
  };

  const handleDeleteFriend = async (friendId: string) => {
      await storageService.removeContact(friendId);
      await storageService.removeConversationByParticipantId(friendId);
      await socketService.removeFriend(friendId);
      setActiveConversationId(null);
      refreshData();
  };

  const ConnectionBanner = () => {
      if (connectionState === 'CONNECTED') return null;
      return (
          <div className={`px-4 py-1 text-xs text-white text-center font-medium ${
              connectionState === 'RECONNECTING' ? 'bg-yellow-500' : 'bg-red-500'
          }`}>
              {connectionState === 'RECONNECTING' ? '正在重连...' : '连接已断开 - 请启动服务器'}
          </div>
      );
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      
      {/* Sidebar - Contacts/Convos */}
      <aside className="w-80 flex flex-col border-r border-slate-200 bg-slate-50">
        
        {/* User Profile Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h1 className="font-bold text-xl text-indigo-700 tracking-tight flex items-center gap-2">
                <MessageSquare className="fill-current" size={24}/> QChat
            </h1>
            <div className="flex items-center gap-2">
                 <div className="text-xs text-right hidden sm:block">
                    <div className="font-bold text-slate-700">{currentUser.username}</div>
                    <div className="text-slate-400">ID: {currentUser.id}</div>
                 </div>
                 <button onClick={() => navigate('/settings')} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <Settings size={20} />
                </button>
            </div>
        </div>

        {/* Search & Add */}
        <div className="p-4 pb-2 flex gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="搜索会话..." 
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
            </div>
            <button 
                onClick={() => setShowAddFriend(true)}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                title="添加好友"
            >
                <Plus size={20} />
            </button>
        </div>

        {/* Friend Requests Section */}
        {friendRequests.length > 0 && (
            <div className="px-2 mt-2">
                <div className="text-[10px] font-bold text-slate-400 px-2 uppercase mb-1">新的好友申请</div>
                <div className="space-y-1">
                    {friendRequests.map(req => (
                        <div key={req.fromUser.id} className="bg-white border border-indigo-100 p-2 rounded-lg flex items-center gap-2 shadow-sm">
                            <Avatar name={req.fromUser.username} src={req.fromUser.avatarUrl} size="sm" />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold truncate">{req.fromUser.username}</div>
                                <div className="text-[10px] text-slate-400 truncate">ID: {req.fromUser.id}</div>
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => handleAcceptRequest(req)}
                                    className="p-1 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200" title="同意"
                                >
                                    <Check size={14} />
                                </button>
                                <button 
                                    onClick={() => handleRejectRequest(req.fromUser.id)}
                                    className="p-1 bg-slate-100 text-slate-400 rounded hover:bg-slate-200 hover:text-red-500" title="忽略"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 mt-2">
            {conversations.length === 0 && friendRequests.length === 0 && (
                <div className="text-center text-slate-400 mt-10 text-sm p-4">
                    暂无会话，点击右上角 "+" 添加好友开始聊天。
                </div>
            )}
            {conversations.map(convo => {
                const contact = getContact(convo.participantId);
                const isActive = activeConversationId === convo.id;
                
                return (
                    <button
                        key={convo.id}
                        onClick={() => setActiveConversationId(convo.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                            isActive ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-200/50'
                        }`}
                    >
                        <div className="relative">
                            <Avatar name={contact.username} src={contact.avatarUrl} status={contact.status} />
                            {convo.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                    {convo.unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <span className={`font-medium truncate ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>
                                    {contact.username}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    {convo.updatedAt ? new Date(convo.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                </span>
                            </div>
                            <p className={`text-xs truncate ${convo.unreadCount > 0 ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                                {convo.lastMessage?.type === 'IMAGE' ? '[图片]' : convo.lastMessage?.content || '已添加好友，开始聊天吧'}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                {connectionState === 'CONNECTED' ? (
                     <span className="flex items-center gap-1 text-green-600">
                        <Wifi size={14} /> 在线{(() => {
                          const url = socketService.getUrl?.() || '';
                          return (/^ws:\/\/(localhost|127\.0\.0\.1)/i).test(url) ? ' (本地)' : '';
                        })()}
                     </span>
                ) : (
                     <span className="flex items-center gap-1 text-red-500">
                        <WifiOff size={14} /> 离线
                     </span>
                )}
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 transition-colors" title="退出登录">
                <LogOut size={18} />
            </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 relative shadow-inner">
         <ConnectionBanner />
         {activeConversationId ? (
             <ChatInterface 
                conversationId={activeConversationId}
                currentUser={currentUser}
                recipient={getContact(conversations.find(c => c.id === activeConversationId)?.participantId || '')}
                onDeleteFriend={handleDeleteFriend}
             />
         ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                 <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare size={48} className="opacity-50"/>
                 </div>
                 <h3 className="text-lg font-medium text-slate-500">欢迎使用 QChat</h3>
                 <p className="text-sm">选择一个联系人开始安全聊天。</p>
             </div>
         )}
      </main>

      {/* Add Friend Modal */}
      {showAddFriend && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
                  <button 
                    onClick={() => setShowAddFriend(false)} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                  >
                      <X size={20} />
                  </button>
                  <div className="flex items-center gap-3 mb-6">
                      <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                        <UserPlus size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">添加好友</h3>
                  </div>
                  
                  <form onSubmit={handleSendRequest}>
                      <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">好友 ID</label>
                            <input 
                                type="text" 
                                value={newFriendId}
                                onChange={e => setNewFriendId(e.target.value)}
                                placeholder="输入对方 ID"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                            <p className="text-[10px] text-slate-400 mt-1">对方将收到好友申请。</p>
                        </div>
                        <button 
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-colors mt-2"
                        >
                            发送申请
                        </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
