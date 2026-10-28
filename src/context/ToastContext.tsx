'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Element */}
      <div
        className={`pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
          toast.visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
        }`}
      >
        <div className="flex items-center gap-2.5 rounded-full border border-[#342f30]/40 bg-black px-5 py-3 text-white shadow-2xl">
          <Icon name="check_circle" size={19} className="text-[#ffd9dd]" />
          <span className="font-label-md text-label-md font-medium tracking-wide">
            {toast.message}
          </span>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
