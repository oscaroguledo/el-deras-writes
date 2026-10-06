interface BrandLogoProps {
  /** `mark` is the DW monogram with quill (small spaces); `full` adds the DERAWRITES wordmark. */
  variant?: 'mark' | 'full';
  /** Tailwind size classes, e.g. "h-9 w-9". */
  className?: string;
  alt?: string;
}

const SOURCES = {
  mark: { light: '/brand/mark-black.png', dark: '/brand/mark-white.png' },
  full: { light: '/brand/logo-full-black.png', dark: '/brand/logo-full-white.png' },
} as const;

/** The site logo; shows the black artwork in light mode and the white one in dark mode. */
export function BrandLogo({ variant = 'mark', className = 'h-9 w-9', alt = '' }: BrandLogoProps) {
  const { light, dark } = SOURCES[variant];
  return (
    <>
      <img src={light} alt={alt} className={`${className} dark:hidden`} />
      <img src={dark} alt={alt} className={`${className} hidden dark:block`} />
    </>
  );
}
