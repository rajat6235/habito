import { PageLoader } from '@/components/shared/PageLoader';

// Covers the gap while a route segment's own chunk/data is still being prepared
// (slow connections, non-prefetched navigations like a typed URL). The Sidebar/
// TopBar/BottomNav in this segment's layout stay mounted around this — only the
// content area shows the loader, so the app shell never flashes to blank.
export default function AppLoading() {
  return <PageLoader fullScreen={false} />;
}
