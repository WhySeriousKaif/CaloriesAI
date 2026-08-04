import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12 w-full ${className}`}>
      {children}
    </div>
  );
};
