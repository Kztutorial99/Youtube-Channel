'use client';

import { useEffect, useRef } from 'react';
import type { IssueCheck } from '@/lib/youtube';

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
    const reg = await navigator.serviceWorker.ready;
    if ('periodicSync' in reg) {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName });
      if (status.state === 'granted') {
        // @ts-expect-error — periodicSync not in standard TS types yet
        await reg.periodicSync.register('check-critical', { minInterval: 15 * 60 * 1000 });
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

  const stored = localStorage.getItem('kz_notified');
  if (stored === key) return;

  if (Notification.permission === 'default') {
    const result = await Notification.requestPermission();
    if (result !== 'granted') return;
  }
  if (Notification.permission !== 'granted') return;

  localStorage.setItem('kz_notified', key);

  const reg = await navigator.serviceWorker.ready;
  const body = critical.length === 1
    ? `"${critical[0].title}" belum diselesaikan!`
    : `${critical.length} isu kritis perlu perhatianmu sekarang!`;

  await reg.showNotification('Isu Kritis di Channel @kz.tutorial!', {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'kz-critical',
    renotify: true,
    data: { url: '/' },
  });
}
