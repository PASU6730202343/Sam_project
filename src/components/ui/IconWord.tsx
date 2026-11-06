interface Props {
  icon: string;
  size?: 'md' | 'lg';
  label?: string;
}

/** วงกลมไอคอน emoji ประกอบคำศัพท์ (ตกแต่ง — ซ่อนจาก screen reader ถ้าไม่มี label) */
export function IconWord({ icon, size = 'md', label }: Props) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl bg-frost ${size === 'lg' ? 'h-20 w-20 text-5xl' : 'h-12 w-12 text-2xl'}`}
    >
      {icon}
    </span>
  );
}
