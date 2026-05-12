import type { ComponentProps } from 'react';

export function AppIcon({
  fill = 'currentColor',
  stroke = 'currentColor',
  backgroundFill = 'none',
  viewBox = '0 0 24 24',
  withBadge = false,
  badgeFill = 'currentColor',
  ...props
}: ComponentProps<'svg'> & { backgroundFill?: string; withBadge?: boolean; badgeFill?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='none' viewBox={viewBox} {...props}>
      <path
        d='m 15.5,15.5 -7,-7 -5,5 c -4.761662,4.666424 2.333576,11.761662 7,7 z'
        fill={fill}
        strokeWidth='1'
        stroke={stroke}
      />
      <path
        d='M 16.761719,1.9277344 C 15.65803,1.9841417 14.52078,2.4583864 13.5,3.5 l -5,5 7,7 5,-5 C 24.220048,6.8543563 20.703466,1.7262797 16.761719,1.9277344 Z'
        fill={backgroundFill}
        strokeWidth='1'
        stroke={stroke}
      />
      {withBadge && <circle stroke='none' fill={badgeFill} cx={20} cy={20} r={4} />}
    </svg>
  );
}
