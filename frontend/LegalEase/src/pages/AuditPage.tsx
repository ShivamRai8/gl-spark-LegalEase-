import { useEffect, useMemo, useState } from 'react';
import { Search, ScrollText } from 'lucide-react';
import { api } from '../api/client';
import { Badge, EmptyState, Spinner } from '../components/ui';
import { formatDate } from '../utils/helpers';
import type { AuditLog } from '../types';

const EVENT_FILTERS = [
  'ALL',
  'CASE_CREATED',
  'CASE_ASSIGNED',
  'CASE_STATUS_UPDATED',
  'EVIDENCE_UPLOADED',
  'EVIDENCE_VERIFIED',
  'EVIDENCE_VIEWED',
] as const;

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.getAuditLogs();
        if (alive) setLogs(data);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (filter !== 'ALL' && l.eventType !== filter) return false;
      if (
        q &&
        !(
          l.eventType.toLowerCase().includes(q) ||
          l.eventDetails.toLowerCase().includes(q) ||
          l.serviceName.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [logs, query, filter]);

  if (error) {
    return (
      <div className="card">
        <EmptyState icon={<ScrollText size={28} />} title="Could not load audit trail" hint={error} />
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit trail</h1>
          <p className="page-subtitle">
            Immutable, append-only record of every critical system event. Read-only by design.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            className="search-input"
            placeholder="Search events, services, details…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="segmented">
          {EVENT_FILTERS.map((f) => (
            <button
              key={f}
              className={`segment${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All events' : f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <section className="card">
        {loading ? (
          <div className="screen-center pad-y">
            <Spinner size={30} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ScrollText size={28} />}
            title="No audit events found"
            hint="System events will be recorded here as they occur."
          />
        ) : (
          <div className="timeline timeline-wide">
            {filtered.map((log) => (
              <div className="timeline-item" key={log.id}>
                <div className={`timeline-dot dot-${eventTone(log.eventType)}`} />
                <div className="timeline-body">
                  <div className="timeline-head">
                    <Badge tone={eventTone(log.eventType)}>{log.eventType.replace(/_/g, ' ')}</Badge>
                    <span>{formatDate(log.timestamp)}</span>
                  </div>
                  <p className="timeline-details">{log.eventDetails}</p>
                  <small className="mono muted">{log.serviceName}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function eventTone(eventType: string): string {
  if (eventType.includes('CREATED')) return 'indigo';
  if (eventType.includes('ASSIGNED')) return 'blue';
  if (eventType.includes('UPLOADED')) return 'amber';
  if (eventType.includes('VERIFIED')) return 'green';
  if (eventType.includes('REJECTED')) return 'red';
  if (eventType.includes('VIEWED')) return 'cyan';
  return 'gray';
}
