'use client';
import { Sparkles, AlertCircle, CheckCircle2, Clock, Circle } from 'lucide-react';

const PRIORITY_STYLES = {
  high: 'text-red-600',
  medium: 'text-amber-600',
  low: 'text-gray-400',
};

export default function InboxSummary({ summary, stats }) {
  if (!summary || !stats) {
    return <div className="h-40 bg-white rounded-xl border border-gray-200 animate-pulse mb-4" />;
  }

  const status = stats.status; // 'attention' | 'pending' | 'clear'
  const head = {
    attention: { Icon: AlertCircle, tone: 'text-red-600', bg: 'bg-red-50 border-red-200',
      line: `${stats.urgentUnread} important message${stats.urgentUnread === 1 ? '' : 's'} need a reply` },
    pending: { Icon: Clock, tone: 'text-amber-600', bg: 'bg-amber-50 border-amber-200',
      line: `${stats.needsReply} message${stats.needsReply === 1 ? '' : 's'} waiting for a reply` },
    clear: { Icon: CheckCircle2, tone: 'text-green-600', bg: 'bg-green-50 border-green-200',
      line: 'All caught up — nothing waiting for a reply' },
  }[status] || {};

  const { Icon = Circle } = head;

  return (
    <div className={`rounded-xl border ${head.bg} p-5 mb-4`}>
      {/* Headline */}
      <div className="flex items-center gap-2.5 mb-4">
        <Icon className={`w-5 h-5 flex-shrink-0 ${head.tone}`} />
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">WhatsApp status</p>
          <p className={`text-sm font-bold ${head.tone}`}>{head.line}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        {/* Overview bullets */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-gray-400" />
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Overview</h3>
          </div>
          <ul className="space-y-1.5">
            {summary.overview?.map((line, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700 leading-snug">
                <span className="text-gray-300 select-none">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Unread digest */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Unread &amp; needs reply
            </h3>
          </div>
          {summary.unreadDigest?.length ? (
            <ul className="space-y-1.5">
              {summary.unreadDigest.map((u, i) => (
                <li key={i} className="flex gap-2 text-sm leading-snug">
                  <Circle className={`w-2 h-2 mt-1.5 flex-shrink-0 fill-current ${PRIORITY_STYLES[u.priority] || PRIORITY_STYLES.low}`} />
                  <span className="text-gray-700">
                    <span className="font-semibold text-gray-900">{u.contact}:</span> {u.point}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No unread messages.</p>
          )}
        </div>
      </div>

      <p className="mt-4 pt-3 border-t border-black/5 text-[11px] text-gray-400">
        {summary.summarizer === 'llm' ? 'AI-generated' : 'Auto-generated'} · updated{' '}
        {new Date(summary.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}
