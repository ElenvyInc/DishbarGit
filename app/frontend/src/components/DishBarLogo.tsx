interface DishBarLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const LOGO_URL = 'https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-16/stjjbhycaiyq/dishbar-logo-full.png';
const FAVICON_URL = 'https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-16/stjjbwqcaiza/dishbar-favicon.png';

export default function DishBarLogo({ size = 'md', showText = true, className = '' }: DishBarLogoProps) {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={FAVICON_URL}
        alt="DishBar"
        className={`${sizeClasses[size]} rounded-lg object-contain`}
      />
      {showText && (
        <span className={`font-bold ${textClasses[size]}`}>DishBar</span>
      )}
    </div>
  );
}

export { LOGO_URL, FAVICON_URL };