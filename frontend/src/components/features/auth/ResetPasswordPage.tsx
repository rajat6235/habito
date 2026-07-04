'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api/auth.api';
import { ApiRequestError } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const schema = z.object({
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords must match', path: ['confirm'] });

type Form = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const params   = useParams();
  const router   = useRouter();
  const token    = String(params['token'] ?? '');
  const [done, setDone]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showPw, setShowPw]     = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit({ password }: Form) {
    setSubmitting(true); setError(null);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
        <h2 className="text-2xl font-bold">Password updated!</h2>
        <p className="text-muted-foreground text-sm">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Set new password</h2>
        <p className="text-muted-foreground mt-1 text-sm">Choose a strong password for your account.</p>
      </div>
      {error && <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">{error}</p>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">New password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} className={cn('w-full px-3 py-2 pr-10 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring', errors.password ? 'border-destructive' : 'border-input')} {...register('password')} />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-xs">Min 8 chars, one uppercase, one number</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Confirm password</label>
          <input type="password" className={cn('w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring', errors.confirm ? 'border-destructive' : 'border-input')} {...register('confirm')} />
          {errors.confirm && <p className="text-destructive text-xs">{errors.confirm.message}</p>}
        </div>
        <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Set new password
        </button>
      </form>
    </div>
  );
}
