
import { User } from './types';

export const APP_NAME = 'QChat';

// Mock Contacts to populate the DB initially
export const INITIAL_CONTACTS: User[] = [
  {
    id: 'user_002',
    username: '莎拉·康纳',
    avatarUrl: 'https://picsum.photos/200/200?random=1',
    status: 'online',
  },
  {
    id: 'user_003',
    username: '张三',
    avatarUrl: 'https://picsum.photos/200/200?random=2',
    status: 'offline',
    lastSeen: Date.now() - 3600000,
  },
  {
    id: 'user_004',
    username: '技术支持',
    avatarUrl: 'https://picsum.photos/200/200?random=3',
    status: 'busy',
  }
];

// Simulation Constants
export const SOCKET_RECONNECT_INTERVAL = 3000;
export const SOCKET_HEARTBEAT_INTERVAL = 10000;
export const MOCK_NETWORK_LATENCY_MS = 600;
