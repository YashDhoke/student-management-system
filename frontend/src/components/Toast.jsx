import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgClass =
    type === 'success'
      ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-300'
      : type === 'error'
      ? 'border-rose-500/30 bg-rose-950/80 text-rose-300'
      : 'border-blue-500/30 bg-blue-950/80 text-blue-300';

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 transform translate-y-0 animate-bounce-short ${bgClass}`}>
      <span className="text-sm font-semibold">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
