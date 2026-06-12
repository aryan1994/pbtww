import { Link } from '@tanstack/react-router';

interface LogoProps {
  href?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({
  href = '/',
  className = '',
  size = 'md',
  showText = true,
}: LogoProps) {
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <Link to={href} className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="PBTW Group Logo"
        className={`${sizeMap[size]} object-contain`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-blue-600 ${textSizeMap[size]}`}>
            PBTW
          </span>
          <span className={`text-xs text-blue-500`}>
            Pappu Bhai Tanker Wale
          </span>
        </div>
      )}
    </Link>
  );
}
