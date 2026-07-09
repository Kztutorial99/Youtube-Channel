'use client';

import { useEffect, useRef } from 'react';

interface IssueCheck {
  id: string; severity: string; status: string; name: string;
}

interface Props {
  issues: IssueCheck[];
}

export default function NotificationManager({ issues }: Props) {
  const lastNotifiedRef = useRef<string>('');

  useEffect(() => {
    registerSW();
  }, []);

  useEffect(() => {
    if (!issues || issues.length === 0) return;
    checkAndNotify(issues, lastNotifiedRef);
  }, [issues]);

  return null;
}

async function registerSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    // Register periodic sync jika didukung
    const reg = await navigator.serviceWorker.ready;
    if ('periodicSync' in reg) {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName });
      if (status.state === 'granted') {
        await (reg as unknown as { periodicSync: { register: (tag: string, opts: object) => Promise<void> } })
          .periodicSync.register('check-critical', { minInterval: 15 * 60 * 1000 });
      }
    }
  } catch (err) {
    console.warn('SW registration failed:', err);
  }
}

async function checkAndNotify(issues: IssueCheck[], lastRef: React.MutableRefObject<string>) {
  if (!('Notification' in window)) return;

  const critical = issues.filter(i => i.severity === 'critical' && i.status !== 'fixed');
  if (critical.length === 0) return;

  const key = critical.map(i => i.id).sort().join(',');
  if (key === lastRef.current) return;
  lastRef.current = key;

  // Cek apakah sudah pernah notify isu yang sama (localStorage)
  const stored = localStorage.getItem('kz_notified');
  if (stored === key) return;

  // Minta permission jika belum
  if (Notification.permission === 'default') {
    const result = await Notification.requestPermission();
    if (result !== 'granted') return;
  }
  if (Notification.permission !== 'granted') return;

  localStorage.setItem('kz_notified', key);

  // Kirim via Service Worker (lebih reliable di mobile)
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification('Isu Kritis di Channel @kz.tutorial!', {
    body: critical.length === 1
      ? `"${critical[0].name}" belum diselesaikan!`
      : `${critical.length} isu kritis perlu perhatianmu sekarang!`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'kz-critical',
    renotify: true,
    data: { url: '/' },
    actions: [
      { action: 'open', title: 'Lihat Detail' },
    ],
  } as NotificationOptions);
}
