import type { HTMLAttributes } from 'react';

const tones = {
  green: 'bg-pistachio-100 text-ink',
  blue: 'bg-frost-200 text-denim',
  solid: 'bg-denim text-white',
};

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof tones;
}

export function Badge({ tone = 'blue', className = '', ...rest }: Props) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-medium ${tones[tone]} ${className}`} {...rest} />;
}
