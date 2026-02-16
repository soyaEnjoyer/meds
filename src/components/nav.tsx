import { Link } from '@tanstack/react-router';
import { Menu, Search, X } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { useNav } from '@/hooks/nav';

// FIXME: check docs for href type
const links = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Water',
    href: '/water',
  },
] as const satisfies { label: string; href: string }[];

export function Nav() {
  const { open, search, setOpen, setSearch } = useNav();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleMenuButtonClick = useCallback(() => setOpen((prev) => !prev), []);
  const handleClearButtonClick = useCallback(() => setSearch(''), []);
  const handleSearchButtonClick = useCallback(() => setSearch(inputRef.current?.value ?? ''), []);
  const handleLinkClick = useCallback(() => setOpen(false), []);

  return (
    <>
      <div className='w-full sticky top-0 flex gap-4 z-20 px-4 py-2 bg-black text-white'>
        <Menu role='button' className='border-2 rounded size-8 me-auto' onClick={handleMenuButtonClick} />
        <span className='grid grid-cols-[auto_auto] border-2 rounded-sm items-center h-8'>
          <input type='search' defaultValue={search} className='row-start-1 col-start-1' ref={inputRef} />
          <X className='size-6 row-start-1 col-start-1 ms-auto' role='button' onClick={handleClearButtonClick} />
          <Search className='size-6 row-start-1 col-start-2' role='button' onClick={handleSearchButtonClick} />
        </span>
      </div>
      <nav
        className={`h-full w-[min(20em,100vw)] fixed transition-translate duration-300 flex flex-col gap-4 z-10 bg-black text-white px-4 py-2 ${open ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}
      >
        {links.map(({ label, href }) => (
          <Link to={href} key={href} onClick={handleLinkClick}>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
