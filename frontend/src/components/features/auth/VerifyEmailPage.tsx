'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth.api';
import { ApiRequestError } from '@/lib/api/client';

export function VerifyEmailPage() {
  const params  = useParams();
  const token   = String(params['token'] ?? '');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid link.'); return; }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((e) => {
        setStatus('error');
        setMessage(e instanceof ApiRequestError ? e.message : 'Verification failed.');
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
        <p className="text-muted-foreground">Verifying your email…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
        <h2 className="text-2xl font-bold">Email verified!</h2>
        <p className="text-muted-foreground text-sm">Your account is confirmed. You can now sign in.</p>
        <Link href="/login" className="inline-block px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <XCircle className="h-12 w-12 text-destructive mx-auto" />
      <h2 className="text-2xl font-bold">Verification failed</h2>
      <p className="text-muted-foreground text-sm">{message || 'The link may have expired.'}</p>
      <Link href="/login" className="text-primary text-sm hover:underline">Back to sign in</Link>
    </div>
  );
}
