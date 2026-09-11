import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../ui/Spinner';

export function PublicLayout() {
  const { isLoading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex flex-col">
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
