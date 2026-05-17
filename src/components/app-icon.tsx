import type { ComponentProps } from 'react';

const MAIN_COLOUR = '#9810fa';
const BADGE_COLOUR = '#e11d48';

export function AppIcon({
  viewBox = '0 0 24 24',
  withBadge = false,
  opaque = false,
  ...props
}: Omit<ComponentProps<'svg'>, 'fill' | 'stroke' | 'strokeWidth'> & { withBadge?: boolean; opaque?: boolean }) {
  // oxlint-disable-next-line react-perf/jsx-no-new-array-as-prop
  const [mainColour, badgeColour] = import.meta.hot ? [BADGE_COLOUR, MAIN_COLOUR] : [MAIN_COLOUR, BADGE_COLOUR];

  return (
    <svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='none' viewBox={viewBox} {...props}>
      <path
        d='m 15.5,15.5 -7,-7 -5,5 c -4.761662,4.666424 2.333576,11.761662 7,7 z'
        fill={mainColour}
        strokeWidth='1'
        stroke={mainColour}
      />
      <path
        d='M 16.761719,1.9277344 C 15.65803,1.9841417 14.52078,2.4583864 13.5,3.5 l -5,5 7,7 5,-5 C 24.220048,6.8543563 20.703466,1.7262797 16.761719,1.9277344 Z'
        fill={opaque ? '#f5f5f5' : 'none'}
        strokeWidth='1'
        stroke={mainColour}
      />
      {withBadge && <circle stroke='none' fill={badgeColour} cx={19} cy={19} r={5} />}
    </svg>
  );
}
