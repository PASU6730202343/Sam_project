import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-pistachio text-ink hover:bg-pistachio-600 hover:text-white focus-visible:ring-denim',
  secondary: 'bg-denim text-white hover:bg-denim-700 focus-visible:ring-pistachio',
  ghost: 'bg-transparent text-denim hover:bg-frost-200 focus-visible:ring-denim',
  danger: 'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-400',
};
const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-9',
  md: 'px-5 py-2.5 text-base min-h-11',
  lg: 'px-7 py-3.5 text-lg min-h-12',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    />
  );
}
