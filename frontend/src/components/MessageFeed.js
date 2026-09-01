'use client';
import { timeAgo } from '@/lib/utils';

function TagBadge({ tag }) {
  return (
    <span className="inline-block text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 mr-1">
      #{tag}
    </span>
  );
}

function MessageBubble({ message }) {
  const isOut = message.direction === 'outbound';
  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] ${isOut ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOut && (
          <span className="text-xs text-gray-500 mb-1 px-1">{message.contact?.name}</span>
        )}
        <div className={`relative px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
          isOut
            ? 'bg-green-500 text-white rounded-br-sm'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
        } ${message.isImportant ? 'ring-2 ring-yellow-400' : ''}`}>
          {message.isImportant && (
            <span className="absolute -top-2 -right-2 text-sm">⭐</span>
          )}
          {message.body}
        </div>
        <div className={`flex items-center gap-2 mt-1 px-1 ${isOut ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs text-gray-400">{timeAgo(message.timestamp)}</span>
          {message.tags?.map(t => <TagBadge key={t} tag={t} />)}
        </div>
      </div>
    </div>
  );
}

export default function MessageFeed({ messages, filter, search, onFilterChange, onSearchChange }) {
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
        <input
          type="text"
          placeholder="Search messages…"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-green-400 bg-gray-50"
        />
        <select
          value={filter}
          onChange={e => onFilterChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-gray-50 text-gray-700"
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="important">Important</option>
          <option value="inbound">Inbound</option>
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
        {!messages ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="h-12 w-64 bg-gray-100 rounded-2xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-4xl mb-2">💬</span>
            <p className="text-sm">No messages found</p>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>
    </div>
  );
}
