'use client';

import { useRouter } from 'next/navigation';
import { HistoryPage } from '../components/HistoryPage';

export default function History() {
  const router = useRouter();

  const handleNavigateToHome = () => {
    router.push('/');
  };

  const handleNavigateToRecovery = (id: string) => {
    router.push(`/recovery/${id}`);
  };

  return (
    <HistoryPage
      onNavigateToHome={handleNavigateToHome}
      onNavigateToRecovery={handleNavigateToRecovery}
    />
  );
}
