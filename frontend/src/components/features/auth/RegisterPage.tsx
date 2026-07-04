'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Eye, EyeOff, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const passwordSchema = z.string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'One uppercase letter')
  .regex(/[0-9]/, 'One number');

const registerSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName:  z.string().min(1, 'Required'),
  username:  z.string().min(3, 'At least 3 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
  email:     z.string().email('Enter a valid email'),
  password:  passwordSchema,
  terms:     z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
});

type RegisterForm = z.infer<typeof registerSchema>;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters',    pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number',           pass: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ['bg-destructive', 'bg-amber-500', 'bg-amber-400', 'bg-emerald-500'];

  if (!password) return null;

  return (
    <div className="space-y-2 mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-200',
              i < score ? (colors[score] ?? 'bg-muted') : 'bg-muted',
            )}
          />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map((c) => (
          <span
            key={c.label}
            className={cn(
              'flex items-center gap-1 text-xs transition-colors',
              c.pass ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
            )}
          >
            <Check className={cn('h-3 w-3', !c.pass && 'opacity-0')} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register: registerUser, registerLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError]       = useState<string | null>(null);
  const [success, setSuccess]           = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const password = watch('password', '');

  function onSubmit(values: RegisterForm) {
    setFormError(null);
    registerUser(
      {
        firstName: values.firstName,
        lastName:  values.lastName,
        username:  values.username,
        email:     values.email,
        password:  values.password,
      },
      {
        onSuccess: () => setSuccess(true),
        onError:   (err) => setFormError(String(err)),
      },
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4 py-6"
      >
        <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold">Account created!</h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
            Check your inbox for a verification link. It expires in 24 hours.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Sign in
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={fadeUp}>
        <h2 className="text-2xl font-bold">Create your account</h2>
        <p className="text-muted-foreground mt-1 text-sm">Start your journey to better habits.</p>
      </motion.div>

      {formError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-sm">{formError}</p>
        </motion.div>
      )}

      <motion.form
        variants={fadeUp}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>First name</Label>
            <Input
              placeholder="Jane"
              aria-invalid={!!errors.firstName}
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="text-destructive text-xs">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Last name</Label>
            <Input
              placeholder="Doe"
              aria-invalid={!!errors.lastName}
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="text-destructive text-xs">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Username</Label>
          <Input
            placeholder="your_username"
            autoComplete="username"
            aria-invalid={!!errors.username}
            {...register('username')}
          />
          {errors.username && (
            <p className="text-destructive text-xs">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              className="pr-10"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrength password={password} />
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          )}
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-primary mt-0.5 cursor-pointer"
            {...register('terms')}
          />
          <span className="text-sm text-muted-foreground leading-relaxed">
            I agree to the{' '}
            <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
          </span>
        </label>
        {errors.terms && (
          <p className="text-destructive text-xs">{errors.terms.message}</p>
        )}

        <Button type="submit" className="w-full" loading={registerLoading}>
          Create account
        </Button>
      </motion.form>

      <motion.p variants={fadeUp} className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}
