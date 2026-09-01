'use client';
import { MessageSquare, Bell, Star, CalendarDays, Users, Reply } from 'lucide-react';

export default function StatsGrid({ stats }) {
  if (!stats) return null;

  const cards = [
    { label: 'Total Messages', value: stats.totalMessages, Icon: MessageSquare, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
    { label: 'Unread', value: stats.unreadMessages, Icon: Bell, color: 'bg-red-50 border-red-200', text: 'text-red-700' },
    { label: 'Important', value: stats.importantMessages, Icon: Star, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    { label: 'Today', value: stats.todayMessages, Icon: CalendarDays, color: 'bg-green-50 border-green-200', text: 'text-green-700' },
    { label: 'Active Contacts', value: stats.activeContacts, Icon: Users, color: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
    { label: 'Response Rate', value: `${stats.responseRate}%`, Icon: Reply, color: 'bg-teal-50 border-teal-200', text: 'text-teal-700' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map(({ label, value, Icon, color, text }) => (
        <div key={label} className={`rounded-xl border ${color} p-4 flex flex-col gap-1`}>
          <Icon className={`w-5 h-5 ${text}`} />
          <span className={`text-2xl font-bold ${text}`}>{value}</span>
          <span className="text-xs text-gray-500 font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}
