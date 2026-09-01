'use client';
import { Users, User } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

function Row({ contact, latestMessage, unreadCount, selected, onSelect }) {
  const isGroup = contact.type === 'group';
  return (
    <button
      onClick={() => onSelect(contact.id)}
      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
        selected === contact.id ? 'bg-green-50 border-r-2 border-green-500' : ''
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        contact.isImportant ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
      }`}>
        {isGroup ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
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
            <span className="ml-2 flex-shrink-0 bg-green-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function Section({ label, Icon, items, selected, onSelect }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border-y border-gray-100">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          {label} ({items.length})
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map(c => (
          <Row key={c.contact.id} {...c} selected={selected} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

export default function ConversationList({ conversations, selected, onSelect }) {
  if (!conversations) return (
    <div className="space-y-2 p-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );

  const groups = conversations.filter(c => c.contact.type === 'group');
  const individuals = conversations.filter(c => c.contact.type !== 'group');

  return (
    <div className="overflow-y-auto scrollbar-thin flex-1">
      <Section label="Groups" Icon={Users} items={groups} selected={selected} onSelect={onSelect} />
      <Section label="Individuals" Icon={User} items={individuals} selected={selected} onSelect={onSelect} />
    </div>
  );
}
