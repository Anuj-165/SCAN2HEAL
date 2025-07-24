import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  glow = false 
}) => {
  return (
    <div className={`
      bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl
      ${hover ? 'hover:shadow-2xl hover:scale-105 transition-all duration-300' : ''}
      ${glow ? 'shadow-blue-500/20 dark:shadow-blue-400/20' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;