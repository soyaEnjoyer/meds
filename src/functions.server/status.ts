import { displayName } from '@root/package.json';
import { createServerOnlyFn } from '@tanstack/react-start';
import { and, eq, gte, isNotNull, lte, sql } from 'drizzle-orm';

import { dateSet } from '@/lib/date';
import { db } from '@/lib/drizzle/db.server';
import { categoryTable, itemTable, scheduleTable } from '@/lib/drizzle/schema';

const getGroupedStatus = createServerOnlyFn(async () => {
  const now = new Date();
  const data = await db
    .select({
      category: categoryTable.name,
      item: itemTable.name,
      status: sql<string>`iif(${scheduleTable.dueAt} <= ${now}, 'Due', 'Later')`,
    })
    .from(scheduleTable)
    .innerJoin(itemTable, eq(itemTable.id, scheduleTable.itemId))
    .innerJoin(categoryTable, eq(categoryTable.id, scheduleTable.categoryId))
    .where(
      and(
        isNotNull(scheduleTable.dueAt),
        gte(scheduleTable.dueAt, dateSet(now, { hour: 0, minute: 0, ms: 0, second: 0 })),
        lte(scheduleTable.dueAt, dateSet(now, { hour: 23, minute: 59, ms: 999, second: 59 }))
      )
    );

  const grouped = Object.fromEntries(
    Object.entries(Object.groupBy(data, ({ status }) => status))
      .map(
        ([status, itemsA]) =>
          [
            status,
            Object.fromEntries(
              // oxlint-disable-next-line typescript/no-non-null-assertion
              Object.entries(Object.groupBy(itemsA!, ({ category }) => category))
                .map(
                  ([category, itemsB]) =>
                    [
                      category,
                      // oxlint-disable-next-line typescript/no-non-null-assertion
                      itemsB!
                        .map(({ item }) => item)
                        .toSorted((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
                    ] as const
                )
                .toSorted(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
            ),
          ] as const
      )
      .toSorted(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  );
  return grouped;
});

const getStatusBlob = createServerOnlyFn((status: string) => {
  if (status === 'Due') return '🟡';
  return '🟣';
});

export const getTextStatus = createServerOnlyFn(async () => {
  const grouped = await getGroupedStatus();
  const rows = Object.entries(grouped).map(([status, categoryGroups]) =>
    Object.entries(categoryGroups)
      .map(([category, items]) => `${getStatusBlob(status)} ${category}: ${items.join(', ')}`)
      .join(' ')
  );
  const title = Object.entries(grouped)
    .map(
      ([status, categoryGroups]) =>
        `${getStatusBlob(status)} ${status} [${Object.values(categoryGroups).reduce(
          (acc, item) => acc + item.length,
          0
        )}]`
    )
    .join(' ');
  if (rows.length)
    return {
      message: rows.join('\n'),
      title: `${displayName}: ${title}`,
    };
  return {
    message: '🟢 All done!',
    title: displayName,
  };
});
