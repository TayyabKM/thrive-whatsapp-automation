'use client';
import { timeAgo } from '@/lib/utils';

export default function ConversationList({ conversations, selected, onSelect }) {
  if (!conversations) return (
    <div className="space-y-2 p-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="divide-y divide-gray-100 overflow-y-auto scrollbar-thin flex-1">
      {conversations.map(({ contact, latestMessage, unreadCount }) => (
        <button
          key={contact.id}
          onClick={() => onSelect(contact.id)}
          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${selected === contact.id ? 'bg-green-50 border-r-2 border-green-500' : ''}`}
        >
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${contact.isImportant ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>
            {contact.avatar}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800 truncate">{contact.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                {latestMessage ? timeAgo(latestMessage.timestamp) : ''}
              </span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xs text-gray-500 truncate">
                {latestMessage?.direction === 'outbound' && <span className="text-green-600">You: </span>}
                {latestMessage?.body}
              </p>
              {unreadCount > 0 && (
                <span className="ml-2 flex-shrink-0 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
