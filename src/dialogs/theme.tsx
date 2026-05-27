import type { ChangeEvent } from 'react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDialog } from '@/hooks/dialog';
import type { Font, Scheme } from '@/hooks/theme';
import { useTheme } from '@/hooks/theme';
import { lowerToSentenceCase } from '@/lib/utils';

function SchemeButton({ scheme }: { scheme: Scheme }) {
  const currentScheme = useTheme((state) => state.scheme);
  const setScheme = useTheme((state) => state.actions.setScheme);

  const handleClick = useCallback(() => setScheme(scheme), [setScheme, scheme]);

  return (
    <Button variant={scheme === currentScheme ? 'default' : 'secondary'} onClick={handleClick}>
      {lowerToSentenceCase(scheme)}
    </Button>
  );
}

function FontButton({ font, className }: { font: Font; className?: string }) {
  const currentFont = useTheme((state) => state.font);
  const setFont = useTheme((state) => state.actions.setFont);

  const handleClick = useCallback(() => setFont(font), [setFont, font]);

  return (
    <Button variant={font === currentFont ? 'default' : 'secondary'} onClick={handleClick} className={className}>
      {lowerToSentenceCase(font)}
    </Button>
  );
}

export function ThemeDialog() {
  const setDialog = useDialog((state) => state.actions.set);
  const dialogState = useDialog((state) => state.theme);
  const scale = useTheme((state) => state.scale);
  const radius = useTheme((state) => state.radius);
  const { reset, setScale, setRadius } = useTheme((state) => state.actions);

  const handleScaleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setScale(event.target.valueAsNumber),
    [setScale]
  );

  const handleRadiusChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setRadius(event.target.valueAsNumber),
    [setRadius]
  );

  const handleOpenChange = useCallback((open: boolean) => setDialog('theme', open), [setDialog]);

  return (
    <Dialog open={dialogState.open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent>
        <DialogHeader>Theme preferences</DialogHeader>
        <DialogBody className='grid grid-cols-[auto_1fr] items-center gap-4'>
          <label className='contents'>
            Scheme
            <div className='flex gap-2 *:grow *:basis-0'>
              <SchemeButton scheme='dark' />
              <SchemeButton scheme='light' />
              <SchemeButton scheme='auto' />
            </div>
          </label>
          <label className='contents'>
            Font
            <div className='flex gap-2 *:grow *:basis-0'>
              <FontButton font='mono' className='font-mono' />
              <FontButton font='sans' className='font-sans' />
              <FontButton font='serif' className='font-serif' />
            </div>
          </label>
          <label className='contents'>
            Scale
            <div className='flex items-center gap-4'>
              <Input
                type='range'
                value={scale}
                min={0.75}
                max={1.5}
                step={0.125}
                onChange={handleScaleChange}
                required
              />
              <span>{scale}x</span>
            </div>
          </label>
          <label className='contents'>
            Radius
            <div className='flex items-center gap-4'>
              <Input type='range' value={radius} min={0} max={1} step={0.125} onChange={handleRadiusChange} required />
              <span>{radius} rem</span>
            </div>
          </label>
        </DialogBody>
        <DialogFooter className='flex justify-around gap-4'>
          <Button variant='destructive' size='lg' onClick={reset}>
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
