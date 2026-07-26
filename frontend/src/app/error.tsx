'use client';

import { RecoveryScreen } from '@/components/shared/RecoveryScreen';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RecoveryScreen error={error} reset={reset} />;
}
