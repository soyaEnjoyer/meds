import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return <AccordionPrimitive.Root data-slot='accordion' className={cn('flex w-full flex-col', className)} {...props} />;
}

function AccordionItem(props: AccordionPrimitive.Item.Props) {
  return <AccordionPrimitive.Item data-slot='accordion-item' {...props} />;
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className='flex'>
      <AccordionPrimitive.Trigger
        data-slot='accordion-trigger'
        className={cn(
          'group/accordion-trigger relative flex flex-1 items-center justify-between rounded-lg border border-transparent py-2 text-left text-sm font-medium transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring aria-disabled:pointer-events-none aria-disabled:opacity-50 shadow-md',
          className
        )}
        {...props}
      >
        <span className='-me-2 shrink-0 rounded-full shadow-sm'>
          <ChevronDownIcon
            data-slot='accordion-trigger-icon'
            className='pointer-events-none size-6 transition-[rotate] duration-300 group-aria-expanded/accordion-trigger:-rotate-180'
          />
        </span>
        {children}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot='accordion-content'
      className='overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up'
      {...props}
    >
      <div
        className={cn(
          'h-(--accordion-panel-height) pt-0 pb-2.5 data-ending-style:h-0 data-starting-style:h-0 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4',
          className
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
