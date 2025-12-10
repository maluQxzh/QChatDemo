const { EntitySchema } = require('typeorm');

const KvEntity = new EntitySchema({
  name: 'KvStore',
  tableName: 'kv_store',
  columns: {
    key: { type: String, primary: true },
    valueJson: { type: 'text', nullable: true },
  },
});

const MessageEntity = new EntitySchema({
  name: 'Message',
  tableName: 'messages',
  columns: {
    id: { type: String, primary: true },
    conversationId: { type: String },
    senderId: { type: String },
    content: { type: 'text' },
    type: { type: String },
    status: { type: String },
    timestamp: { type: 'integer' },
  },
});

const ConversationEntity = new EntitySchema({
  name: 'Conversation',
  tableName: 'conversations',
  columns: {
    id: { type: String, primary: true },
    participantId: { type: String },
    unreadCount: { type: 'integer', default: 0 },
    updatedAt: { type: 'integer', nullable: true },
    lastMessageId: { type: String, nullable: true },
  },
});

const ContactEntity = new EntitySchema({
  name: 'Contact',
  tableName: 'contacts',
  columns: {
    id: { type: String, primary: true },
    username: { type: String },
    avatarUrl: { type: String, nullable: true },
    status: { type: String, nullable: true },
  },
});

const FriendRequestEntity = new EntitySchema({
  name: 'FriendRequest',
  tableName: 'friend_requests',
  columns: {
    id: { type: 'integer', primary: true, generated: true },
    fromUserId: { type: String },
    payloadJson: { type: 'text' },
    createdAt: { type: 'integer' },
  },
});

const SettingEntity = new EntitySchema({
  name: 'Setting',
  tableName: 'settings',
  columns: {
    key: { type: String, primary: true },
    valueJson: { type: 'text' },
  },
});

module.exports = {
  KvEntity,
  MessageEntity,
  ConversationEntity,
  ContactEntity,
  FriendRequestEntity,
  SettingEntity,
};
