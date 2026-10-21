interface DishBarLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  tone?: 'default' | 'light';
  className?: string;
}

export default function DishBarLogo({
  size = 'md',
  showText = true,
  tone = 'default',
  className = '',
}: DishBarLogoProps) {
  const mark = {
    sm: 'h-6 w-6',
    md: 'h-7 w-7',
    lg: 'h-9 w-9',
  }[size];

  const word = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  }[size];

  const dish = tone === 'light' ? 'text-[#F6F1E8]' : 'text-[#17352C]';

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg viewBox="0 0 32 32" className={`${mark} text-[#E07A68]`} aria-hidden="true">
        <path
          fill="currentColor"
          d="M16 1.2c.4 5.2 2.4 8.6 6.2 11.6C25.2 15.6 28.6 17.2 30.8 16c-5.2.4-8.6 2.4-11.6 6.2C16.4 25.2 14.8 28.6 16 30.8c-.4-5.2-2.4-8.6-6.2-11.6C6.8 16.4 3.4 14.8 1.2 16c5.2-.4 8.6-2.4 11.6-6.2C15.6 6.8 17.2 3.4 16 1.2z"
        />
      </svg>
      {showText && (
        <span className={`font-extrabold lowercase leading-none tracking-[-0.04em] ${word}`}>
          <span className={dish}>dish</span>
          <span className="text-[#E07A68]">bar</span>
        </span>
      )}
    </span>
  );
}
