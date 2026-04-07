'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#1f1f1f',
          color: '#e5e7eb',
          border: '1px solid #333',
        },
        success: {
          iconTheme: { primary: '#22c55e', secondary: '#1f1f1f' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#1f1f1f' },
        },
      }}
    />
  );
}
