import { createFileRoute } from '@tanstack/react-router';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useScheduleGroupsQuery } from '@/hooks/query/schedule';

export const Route = createFileRoute('/(ui)/')({
  component: SchedulePage,
});

function SchedulePage() {
  // const categoriesQuery = useCategoriesQuery();
  // const unitsQuery = useUnitsQuery();
  // const itemsQuery = useItemsQuery();
  // const schedulesQuery = useSchedulesQuery();
  const scheduleGroups = useScheduleGroupsQuery();

  return (
    <Accordion>
      {scheduleGroups.data?.map((group) => (
        <AccordionItem key={group.key}>
          <AccordionTrigger className='flex gap-4'>
            <span>{group.dueAtIso}</span>
            <span>{group.categoryName}</span>
          </AccordionTrigger>
          <AccordionContent className='flex flex-col gap-2'>
            {group.items.map((item) => (
              <div key={item.id} className='flex gap-4'>
                <span>{item.itemName}</span>
                <span>{item.amount}</span>
                <span>{item.unitName}</span>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  return (
    <div className='flex flex-col'>
      {scheduleGroups.data?.map((item) => (
        <span key={item.dueAtIso}>{JSON.stringify(item, null, 2)}</span>
      ))}
    </div>
  );

  // return (
  //   <div className='flex flex-row justify-between'>
  //     <article>
  //       <h2 className='font-semibold'>Categories</h2>
  //       <div className='flex flex-col'>
  //         {categoriesQuery.data.map((item) => (
  //           <span key={item.id}>{item.name}</span>
  //         ))}
  //       </div>
  //     </article>
  //     <article>
  //       <h2 className='font-semibold'>Units</h2>
  //       <div className='flex flex-col'>
  //         {unitsQuery.data.map((item) => (
  //           <span key={item.id}>{item.name}</span>
  //         ))}
  //       </div>
  //     </article>
  //     <article>
  //       <h2 className='font-semibold'>Items</h2>
  //       <div className='flex flex-col'>
  //         {itemsQuery.data.map((item) => (
  //           <span key={item.id}>{item.name}</span>
  //         ))}
  //       </div>
  //     </article>
  //     <article>
  //       <h2 className='font-semibold'>Schedules</h2>
  //       <div className='flex flex-col'>
  //         {schedulesQuery.data.map((item) => (
  //           <span key={item.id}>{formatDateIso(item.createdAt)}</span>
  //         ))}
  //       </div>
  //     </article>
  //   </div>
  // );
}
