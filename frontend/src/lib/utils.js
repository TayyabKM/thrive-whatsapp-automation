export function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function priorityColor(priority) {
  return { high: 'text-red-600 bg-red-50', medium: 'text-yellow-600 bg-yellow-50', low: 'text-green-600 bg-green-50' }[priority] || '';
}

export function priorityDot(priority) {
  return { high: 'bg-red-500', medium: 'bg-yellow-500', low: 'bg-green-500' }[priority] || 'bg-gray-400';
}
