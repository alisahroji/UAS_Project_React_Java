import React from 'react';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';

export function PlaceholderPage({ title, description }) {
  const { addToast } = useToast();

  const handleTestToast = () => {
    addToast({
      title: 'Toast Works!',
      description: 'The foundation toast system is correctly configured.',
      variant: 'success'
    });
  };

  return (
    <div className="flex flex-col h-full items-center justify-center pt-20">
      <EmptyState 
        title={title} 
        description={description || "This page is a placeholder for future implementation."} 
        action={
          <Button onClick={handleTestToast} variant="outline" className="mt-4">
            Test Toast
          </Button>
        }
      />
    </div>
  );
}
