import { Link } from '@tanstack/react-router';
import type { ComponentProps } from 'react';

const links: [label: string, url: string][] = [
  ['Home', '/'],
  ['Categories', '/categories'],
  ['Items', '/items'],
  ['Schedules', '/schedules'],
  ['Units', '/units'],
];

const activeProps: ComponentProps<typeof Link>['activeProps'] = { className: 'bg-foreground text-background' };

export function Nav() {
  return (
    <header className='fixed top-0 z-10 flex min-h-16 w-full items-center justify-center bg-sidebar/50 shadow-xl backdrop-blur-sm'>
      <nav className='flex max-w-2xl'>
        {links.map(([label, url]) => (
          <Link key={url} to={url} className='px-4 py-1 transition-colors' activeProps={activeProps}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
