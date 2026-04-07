import React from 'react';

interface ProjectGridProps {
  children: React.ReactNode;
}

export default function ProjectGrid({ children }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  );
}
