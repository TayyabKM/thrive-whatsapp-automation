'use client';

export default function StatsGrid({ stats }) {
  if (!stats) return null;

  const cards = [
    { label: 'Total Messages', value: stats.totalMessages, icon: '💬', color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
    { label: 'Unread', value: stats.unreadMessages, icon: '🔔', color: 'bg-red-50 border-red-200', text: 'text-red-700' },
    { label: 'Important', value: stats.importantMessages, icon: '⭐', color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
    { label: 'Today', value: stats.todayMessages, icon: '📅', color: 'bg-green-50 border-green-200', text: 'text-green-700' },
    { label: 'Active Contacts', value: stats.activeContacts, icon: '👥', color: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
    { label: 'Response Rate', value: `${stats.responseRate}%`, icon: '↩️', color: 'bg-teal-50 border-teal-200', text: 'text-teal-700' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-xl border ${c.color} p-4 flex flex-col gap-1`}>
          <span className="text-xl">{c.icon}</span>
          <span className={`text-2xl font-bold ${c.text}`}>{c.value}</span>
          <span className="text-xs text-gray-500 font-medium">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
