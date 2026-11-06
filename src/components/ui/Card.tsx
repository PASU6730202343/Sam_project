import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-frost-200 bg-white p-5 shadow-sm ${
        interactive ? 'transition duration-200 hover:-translate-y-1 hover:shadow-md' : ''
      } ${className}`}
      {...rest}
    />
  );
}
