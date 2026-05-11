import { displayName } from '@root/package.json';
import { Link, useRouterState } from '@tanstack/react-router';
import type { LucideProps } from 'lucide-react';
import { Contrast, EllipsisVertical, Menu, Plus, X } from 'lucide-react';
import type { Dispatch, ForwardRefExoticComponent, KeyboardEvent, RefAttributes, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AppIcon } from '@/components/app-icon';
import { StateIcon } from '@/components/state-icon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InputGroup, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useDialog } from '@/hooks/dialog';
import type { ItemState } from '@/hooks/filter';
import { itemStateNames, itemStates, useFilter } from '@/hooks/filter';
import { cn } from '@/lib/utils';

const DEBOUNCE_MS = 300;

const links = [
  { href: '/', name: 'Home' },
  { href: '/history', name: 'History' },
  { href: '/categories', name: 'Categories' },
  { href: '/units', name: 'Units' },
  { href: '/items', name: 'Items' },
] as const satisfies { href: string; name: string }[];

function NavExtraMenu({
  setSideBarOpen,
  mode,
}: {
  setSideBarOpen?: Dispatch<SetStateAction<boolean>>;
  mode: 'dropdown' | 'buttons';
}) {
  const openDialog = useDialog((state) => state.actions.open);

  const buttons: [
    description: string,
    Icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>,
    label: string,
    handleClick: () => void,
  ][] = useMemo(
    () =>
      [
        [
          'New category',
          Plus,
          'Category',
          () => {
            openDialog('category', null);
            setSideBarOpen?.(false);
          },
        ],
        [
          'New unit',
          Plus,
          'Unit',
          () => {
            openDialog('unit', null);
            setSideBarOpen?.(false);
          },
        ],
        [
          'Newn item',
          Plus,
          'Item',
          () => {
            openDialog('item', null);
            setSideBarOpen?.(false);
          },
        ],
        [
          'New schedule',
          Plus,
          'Schedule',
          () => {
            openDialog('schedule', null);
            setSideBarOpen?.(false);
          },
        ],
        [
          'Edit theme',
          Contrast,
          'Theme',
          () => {
            openDialog('theme', null);
            setSideBarOpen?.(false);
          },
        ],
      ] as const,
    [setSideBarOpen, openDialog]
  );

  if (mode === 'buttons')
    return (
      <>
        {buttons.map(([description, Icon, label, handleClick]) => (
          <Button key={description} variant='ghost' onClick={handleClick} aria-description={description}>
            <Icon /> {label}
          </Button>
        ))}
      </>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant='outline' aria-description='Open menu' className='max-md:hidden'>
            <EllipsisVertical />
          </Button>
        }
      />
      <DropdownMenuContent align='end'>
        {buttons.map(([description, Icon, label, handleClick]) => (
          <DropdownMenuItem key={description} onClick={handleClick} aria-description={description}>
            <Icon /> {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLinks({ setSideBarOpen }: { setSideBarOpen?: Dispatch<SetStateAction<boolean>> }) {
  const pathName = useRouterState({ select: (state) => state.location.pathname });

  const handleLinkClick = useCallback(() => {
    setSideBarOpen?.(false);
  }, [setSideBarOpen]);

  return (
    <>
      {links.map(({ href, name }) => (
        <Button
          variant={pathName === href ? 'default' : 'ghost'}
          key={href}
          render={<Link to={href} />}
          nativeButton={false}
          onClick={handleLinkClick}
          size='lg'
        >
          {name}
        </Button>
      ))}
    </>
  );
}

function NavStateDropdownItem({ state: itemState }: { state: ItemState }) {
  const filterState = useFilter((state) => state.state);
  const setFilterState = useFilter((state) => state.actions.setState);

  const handleClick = useCallback(() => setFilterState(itemState), [setFilterState, itemState]);

  return (
    <DropdownMenuItem
      className={itemState === filterState ? 'bg-accent-foreground/10' : ''}
      onClick={handleClick}
      key={itemState}
    >
      <StateIcon state={itemState} />
      {itemStateNames[itemState]}
    </DropdownMenuItem>
  );
}

function NavStateDropdown() {
  const filterState = useFilter((state) => state.state);
  const pathName = useRouterState({ select: (state) => state.location.pathname });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='outline'
            className={cn('starting:scale-0 transition-transform', pathName === '/' || 'hidden')}
          >
            <StateIcon state={filterState} />
            {itemStateNames[filterState]}
          </Button>
        }
      />
      <DropdownMenuContent>
        {itemStates.map((state) => (
          <NavStateDropdownItem key={state} state={state} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavSearch() {
  const filterSearch = useFilter((state) => state.search);
  const setSearch = useFilter((state) => state.actions.setSearch);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleInputBlur = useCallback(() => {
    clearTimeoutRef();
    if (!inputRef.current) return;
    const search = inputRef.current.value;
    setSearch(search);
  }, [clearTimeoutRef, setSearch]);

  const handleInputKeyUp = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      clearTimeoutRef();
      if (event.key === 'Enter') handleInputBlur();
      else timeoutRef.current = setTimeout(handleInputBlur, DEBOUNCE_MS);
    },
    [clearTimeoutRef, handleInputBlur]
  );

  const handleInputClear = useCallback(() => setSearch(''), [setSearch]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.value = filterSearch;
  }, [filterSearch]);

  return (
    <InputGroup className='ms-auto max-w-[24ch]'>
      <InputGroupInput
        ref={inputRef}
        onBlur={handleInputBlur}
        onKeyUp={handleInputKeyUp}
        placeholder='Search'
        type='search'
        autoCapitalize='none'
        autoCorrect='off'
        autoComplete='off'
        className='rounded-s-lg'
      />
      <InputGroupButton onClick={handleInputClear} disabled={filterSearch === ''} aria-description='Clear input'>
        <X />
      </InputGroupButton>
    </InputGroup>
  );
}

// FIXME: do the notification button properly if i can send background notifications on mobile
export function Nav() {
  const [sideBarOpen, setSideBarOpen] = useState(false);

  const handleNotifyClick = useCallback(() => void Notification.requestPermission(), []);

  return (
    <header className='fixed top-0 z-10 flex min-h-14 w-full items-center justify-center bg-sidebar/50 p-2 text-sidebar-foreground shadow-xl backdrop-blur-sm transition-colors focus-within:bg-sidebar/75'>
      <nav className='flex w-full max-w-6xl items-center gap-4'>
        <span className='hidden items-center gap-1 md:flex'>
          <AppIcon className='size-8 text-theme' />
          <h1 className='text-lg'>{displayName}</h1>
        </span>

        <Sheet open={sideBarOpen} onOpenChange={setSideBarOpen}>
          <SheetTrigger
            className='md:hidden'
            render={
              <Button variant='outline' aria-description='Open menu'>
                <Menu />
              </Button>
            }
          />
          <SheetContent className='flex max-w-fit flex-col gap-4 p-4' side='left' showCloseButton={false}>
            <SheetClose className='flex items-center justify-center gap-1'>
              <AppIcon className='size-8 text-theme' />
              <h1 className='text-lg'>{displayName}</h1>
            </SheetClose>

            <NavLinks setSideBarOpen={setSideBarOpen} />
            <hr />
            <NavExtraMenu mode='buttons' setSideBarOpen={setSideBarOpen} />
          </SheetContent>
        </Sheet>

        <div className='hidden md:contents'>
          <NavLinks />
        </div>

        <NavStateDropdown />

        <Button onClick={handleNotifyClick}>Notify</Button>

        <NavSearch />

        <NavExtraMenu mode='dropdown' />
      </nav>
    </header>
  );
}
