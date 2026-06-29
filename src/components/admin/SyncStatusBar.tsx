/**
 * SyncStatusBar — شريط صغير في أعلى لوحة الإدارة
 * يُظهر حالة المزامنة مع Supabase + زر "مزامنة الآن" لو في عمليات معلّقة
 */
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CloudOff, Check, AlertCircle, Clock } from 'lucide-react';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

interface SyncStatusBarProps {
  status: SyncStatus;
  label: string;
  pendingCount: number;
  lastSync: string | null;
  onSyncNow: () => void;
}

const icons: Record<SyncStatus, React.ReactNode> = {
  idle: <Clock size={14} />,
  syncing: <RefreshCw size={14} className="animate-spin" />,
  synced: <Check size={14} />,
  offline: <CloudOff size={14} />,
  error: <AlertCircle size={14} />,
};

const colors: Record<SyncStatus, string> = {
  idle: 'bg-white/5 text-white/50',
  syncing: 'bg-blue-500/20 text-blue-300',
  synced: 'bg-green-500/20 text-green-300',
  offline: 'bg-orange-500/20 text-orange-300',
  error: 'bg-red-500/20 text-red-300',
};

export function SyncStatusBar({ status, label, pendingCount, lastSync, onSyncNow }: SyncStatusBarProps) {
  const formattedLastSync = lastSync
    ? new Date(lastSync).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${colors[status]}`}
      >
        {icons[status]}
        <span>{label}</span>

        {formattedLastSync && status !== 'offline' && (
          <span className="opacity-60">· آخر مزامنة {formattedLastSync}</span>
        )}

        {(status === 'error' || status === 'offline') && pendingCount > 0 && (
          <button
            onClick={onSyncNow}
            className="mr-2 underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            مزامنة الآن ({pendingCount})
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
