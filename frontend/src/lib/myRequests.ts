// Tracks which assistance requests were submitted from this browser,
// so "My Requests" shows only the visitor's own requests (no login required).
const KEY = 'kindminds.myRequestIds';

export function getMyRequestIds(): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function addMyRequestId(id: string): void {
  try {
    const ids = getMyRequestIds();
    if (!ids.includes(id)) localStorage.setItem(KEY, JSON.stringify([id, ...ids]));
  } catch {
    /* storage unavailable */
  }
}
