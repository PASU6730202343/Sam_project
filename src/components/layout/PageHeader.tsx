import type { ReactNode } from 'react';
import { Badge } from '../ui';

interface Props {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, children }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold text-denim">{title}</h1>
        {subtitle && <div className="mt-1 text-denim/80">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

/** แสดงในหน้าที่ยังไม่ได้ทำเนื้อหาเต็ม */
export function PhaseNote({ phase, text }: { phase: number; text: string }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed border-denim/30 bg-white/60 p-4">
      <Badge tone="blue">เฟส {phase}</Badge>
      <p className="text-denim">{text}</p>
    </div>
  );
}
