'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import {
  User, Shield, Monitor, Eye, EyeOff, Loader2, Trash2,
} from 'lucide-react';

import {
  useMe, useUpdateProfile, useChangePassword,
  useUserSessions, useRevokeSession,
} from '@/hooks/api/useUser';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago',     label: 'Central Time (US & Canada)' },
  { value: 'America/Denver',      label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Sao_Paulo',   label: 'Brasilia Time' },
  { value: 'Europe/London',       label: 'London (GMT/BST)' },
  { value: 'Europe/Paris',        label: 'Central European Time' },
  { value: 'Asia/Kolkata',        label: 'India Standard Time' },
  { value: 'Asia/Tokyo',          label: 'Japan Standard Time' },
  { value: 'Australia/Sydney',    label: 'Australian Eastern Time' },
] as const;

// ── Avatar ────────────────────────────────────────────────────────────────────

interface AvatarPlaceholderProps {
  firstName: string;
  lastName:  string | null;
  avatarUrl: string | null;
}

function AvatarPlaceholder({ firstName, lastName, avatarUrl }: AvatarPlaceholderProps) {
  const initials = [firstName[0], lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase();

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`${firstName} ${lastName ?? ''}`.trim()}
        className="h-20 w-20 rounded-full object-cover border-2 border-border"
      />
    );
  }

  return (
    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
      <span className="text-2xl font-semibold text-primary">{initials}</span>
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName:  z.string().max(80).optional(),
  bio:       z.string().max(500).optional(),
  timezone:  z.string().min(1, 'Timezone is required'),
});

type ProfileForm = z.infer<typeof profileSchema>;

function ProfileTab() {
  const { data: me, isLoading } = useMe();
  const updateProfile = useUpdateProfile();
  const authUser      = useAuthStore((s) => s.user);
  const displayUser   = me ?? authUser;

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver:      zodResolver(profileSchema),
    defaultValues: {
      firstName: displayUser?.firstName ?? '',
      lastName:  displayUser?.lastName ?? '',
      bio:       displayUser?.bio ?? '',
      timezone:  displayUser?.timezone ?? 'America/New_York',
    },
  });

  const watchedTimezone = watch('timezone');

  async function onSubmit(values: ProfileForm) {
    await updateProfile.mutateAsync({
      firstName: values.firstName,
      lastName:  values.lastName || undefined,
      bio:       values.bio || undefined,
      timezone:  values.timezone,
    });
  }

  if (isLoading && !displayUser) {
    return (
      <div className="space-y-4 p-1">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Avatar */}
      {displayUser && (
        <div className="flex items-center gap-4">
          <AvatarPlaceholder
            firstName={displayUser.firstName}
            lastName={displayUser.lastName}
            avatarUrl={displayUser.avatarUrl}
          />
          <div>
            <p className="text-sm font-medium">{displayUser.firstName} {displayUser.lastName ?? ''}</p>
            <p className="text-xs text-muted-foreground">{displayUser.email}</p>
          </div>
        </div>
      )}

      {/* First name */}
      <div className="space-y-1.5">
        <Label htmlFor="s-firstname">
          First name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="s-firstname"
          placeholder="First name"
          aria-invalid={!!errors.firstName}
          {...register('firstName')}
        />
        {errors.firstName && (
          <p className="text-xs text-destructive">{errors.firstName.message}</p>
        )}
      </div>

      {/* Last name */}
      <div className="space-y-1.5">
        <Label htmlFor="s-lastname">Last name</Label>
        <Input
          id="s-lastname"
          placeholder="Last name"
          {...register('lastName')}
        />
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <Label htmlFor="s-bio">Bio</Label>
        <Textarea
          id="s-bio"
          placeholder="Tell us a bit about yourself…"
          rows={3}
          {...register('bio')}
        />
      </div>

      {/* Timezone */}
      <div className="space-y-1.5">
        <Label>Timezone</Label>
        <Select
          value={watchedTimezone}
          onValueChange={(v) => setValue('timezone', v, { shouldDirty: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        loading={updateProfile.isPending}
        disabled={!isDirty && !updateProfile.isPending}
        className="w-full sm:w-auto"
      >
        Save changes
      </Button>
    </form>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const changePassword = useChangePassword();

  const {
    register, handleSubmit, reset,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(values: PasswordForm) {
    await changePassword.mutateAsync({
      currentPassword: values.currentPassword,
      newPassword:     values.newPassword,
    });
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold mb-1">Change password</h3>
        <p className="text-xs text-muted-foreground">
          Use a strong, unique password you don&apos;t use elsewhere.
        </p>
      </div>

      {/* Current password */}
      <div className="space-y-1.5">
        <Label htmlFor="s-current-pw">Current password</Label>
        <div className="relative">
          <Input
            id="s-current-pw"
            type={showCurrent ? 'text' : 'password'}
            placeholder="Current password"
            aria-invalid={!!errors.currentPassword}
            className="pr-10"
            {...register('currentPassword')}
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showCurrent ? 'Hide password' : 'Show password'}
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
        )}
      </div>

      {/* New password */}
      <div className="space-y-1.5">
        <Label htmlFor="s-new-pw">New password</Label>
        <div className="relative">
          <Input
            id="s-new-pw"
            type={showNew ? 'text' : 'password'}
            placeholder="New password"
            aria-invalid={!!errors.newPassword}
            className="pr-10"
            {...register('newPassword')}
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showNew ? 'Hide password' : 'Show password'}
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-xs text-destructive">{errors.newPassword.message}</p>
        )}
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <Label htmlFor="s-confirm-pw">Confirm new password</Label>
        <div className="relative">
          <Input
            id="s-confirm-pw"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirm new password"
            aria-invalid={!!errors.confirmPassword}
            className="pr-10"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        loading={changePassword.isPending}
        className="w-full sm:w-auto"
      >
        Update password
      </Button>
    </form>
  );
}

// ── Sessions Tab ──────────────────────────────────────────────────────────────

function SessionsTab() {
  const { data: sessions = [], isLoading } = useUserSessions();
  const revokeSession = useRevokeSession();

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  async function revokeAll() {
    await Promise.all(otherSessions.map((s) => revokeSession.mutateAsync(s.id)));
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Active sessions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} active
          </p>
        </div>
        {otherSessions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void revokeAll()}
            loading={revokeSession.isPending}
            className="text-destructive border-destructive/50 hover:bg-destructive/5"
          >
            Revoke all other sessions
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No sessions found.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-3',
                session.isCurrent ? 'border-primary/40 bg-primary/5' : 'border-border',
              )}
            >
              <div className="mt-0.5 rounded-lg p-1.5 bg-muted">
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">
                    {session.deviceName ?? 'Unknown device'}
                  </p>
                  {session.isCurrent && (
                    <Badge className="text-xs px-1.5 py-0 bg-primary/15 text-primary">
                      Current
                    </Badge>
                  )}
                </div>
                {session.userAgent && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {session.userAgent}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {session.ipAddress && (
                    <span className="text-xs text-muted-foreground">{session.ipAddress}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Active {format(parseISO(session.lastActive), "MMM d 'at' h:mm a")}
                  </span>
                </div>
              </div>
              {!session.isCurrent && (
                <button
                  type="button"
                  onClick={() => revokeSession.mutate(session.id)}
                  disabled={revokeSession.isPending}
                  aria-label="Revoke session"
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                >
                  {revokeSession.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SettingsView ──────────────────────────────────────────────────────────────

export function SettingsView() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="profile" className="h-full flex flex-col">
          <TabsList className="mx-4 mt-4 mb-0 w-auto self-start">
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="h-3.5 w-3.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Security
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-1.5">
              <Monitor className="h-3.5 w-3.5" />
              Sessions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="flex-1 px-4 py-5">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="security" className="flex-1 px-4 py-5">
            <SecurityTab />
          </TabsContent>
          <TabsContent value="sessions" className="flex-1 px-4 py-5">
            <SessionsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
