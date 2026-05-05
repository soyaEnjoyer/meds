import { Bell, BellMinus, BellOff, Circle } from 'lucide-react';
import type { ComponentProps, ForwardRefExoticComponent, RefAttributes } from 'react';

import { ItemState, itemStateNames } from '@/hooks/filter';
import { cn } from '@/lib/utils';

const variants = {
  [ItemState.Active]: { Icon: Bell, baseClass: 'text-success' },
  [ItemState.Due]: { Icon: Bell, baseClass: 'text-success fill-success' },
  [ItemState.NotDue]: { Icon: BellMinus, baseClass: 'text-warning' },
  [ItemState.Inactive]: { Icon: BellOff, baseClass: 'text-danger' },
  [ItemState.All]: { Icon: Circle, baseClass: 'text-foreground' },
} as const satisfies Record<
  ItemState,
  { Icon: ForwardRefExoticComponent<RefAttributes<SVGSVGElement>>; baseClass: string }
>;

export function StateIcon({ state, className, ...props }: { state: ItemState } & ComponentProps<typeof Bell>) {
  const { Icon, baseClass } = variants[state];
  return <Icon className={cn(baseClass, className)} {...props} aria-description={itemStateNames[state]} />;
}
