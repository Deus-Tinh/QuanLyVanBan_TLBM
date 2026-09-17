import React from 'react';

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'auto' | 'white' | 'dark';
}

const SIZE_MAP = {
  xs: 'h-5',
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-10',
  xl: 'h-12',
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'auto',
  className = '',
  alt = 'Bảo Long Insurance',
  ...props
}) => {
  const sizeClass = SIZE_MAP[size];

  if (variant === 'white') {
    return (
      <img
        src="/baolong-logo.png"
        alt={alt}
        className={`${sizeClass} w-auto object-contain ${className}`}
        {...props}
      />
    );
  }

  if (variant === 'dark') {
    return (
      <img
        src="/baolong-logo-black.png"
        alt={alt}
        className={`${sizeClass} w-auto object-contain ${className}`}
        {...props}
      />
    );
  }

  return (
    <span className="inline-flex items-center shrink-0">
      <img
        src="/baolong-logo.png"
        alt={alt}
        className={`${sizeClass} w-auto object-contain hidden dark:block ${className}`}
        {...props}
      />
      <img
        src="/baolong-logo-black.png"
        alt={alt}
        className={`${sizeClass} w-auto object-contain block dark:hidden ${className}`}
        {...props}
      />
    </span>
  );
};

export default Logo;
