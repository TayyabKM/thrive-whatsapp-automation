'use client';
import { priorityColor, priorityDot } from '@/lib/utils';

export default function SummaryPanel({ summary }) {
  if (!summary) return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-48" />
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <span>🧠</span> AI Summary
        </h2>
        <span className="text-xs text-gray-400">Auto-generated</span>
      </div>

      <div className="space-y-2 mb-5">
        {summary.highlights.map((h, i) => (
          <div key={i} className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${priorityColor(h.priority)}`}>
            <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${priorityDot(h.priority)}`} />
            {h.text}
          </div>
        ))}
      </div>

      {summary.pendingActions?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pending Actions</p>
          <ul className="space-y-1">
            {summary.pendingActions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-gray-400 mt-0.5">→</span> {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
