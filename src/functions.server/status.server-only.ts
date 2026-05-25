import { createHash } from 'node:crypto';

import { displayName } from '@root/package.json';
import { createServerOnlyFn } from '@tanstack/react-start';
import { and, eq, isNotNull, lte } from 'drizzle-orm';

import { dateAdd, dateSet } from '@/lib/date';
import { db } from '@/lib/drizzle/db.server';
import { categoryTable, itemTable, scheduleTable } from '@/lib/drizzle/schema';

// oxlint-disable node/no-process-env

const HASH_LENGTH = 8;
const NEXT_MAX_HOURS = 3;

enum State {
  Due = 0,
  Next = 1,
  Later = 2,
}

export const getTextStatusServer = createServerOnlyFn(async () => {
  const now = new Date();

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const data = (await db
    .select({
      category: categoryTable.name,
      dueAt: scheduleTable.dueAt,
      item: itemTable.name,
    })
    .from(scheduleTable)
    .innerJoin(itemTable, eq(itemTable.id, scheduleTable.itemId))
    .innerJoin(categoryTable, eq(categoryTable.id, scheduleTable.categoryId))
    .where(
      and(
        isNotNull(scheduleTable.dueAt),
        lte(scheduleTable.dueAt, dateSet(now, { hour: 23, minute: 59, ms: 999, second: 59 }))
      )
    )
    .orderBy(categoryTable.name, itemTable.name)) as {
    category: string;
    dueAt: Date;
    item: string;
  }[];

  const nextAt = data
    .map(({ dueAt }) => dueAt)
    .filter((dueAt) => dueAt !== null)
    .toSorted((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .find((dueAt) => dueAt > now);

  const stateRows = data.map((item) =>
    Object.assign(
      item,
      item.dueAt <= now
        ? { blob: '🔴', state: State.Due }
        : nextAt && nextAt <= dateAdd(now, { hour: NEXT_MAX_HOURS }) && item.dueAt <= nextAt
          ? { blob: '🟠', state: State.Next }
          : { blob: '🟡', state: State.Later }
    )
  );

  const due = stateRows.filter((row) => row.state === State.Due);
  const next = stateRows.filter((row) => row.state === State.Next);
  const later = stateRows.filter((row) => row.state === State.Later);

  const appName = `${import.meta.hot ? '[DEV] ' : ''}${displayName}`;

  const summary = [
    due.length ? `${due[0].blob} Due: ${due.length}` : null,
    next.length ? `${next[0].blob} Next: ${next.length}` : null,
    later.length ? `${later[0].blob} Later: ${later.length}` : null,
  ]
    .filter((item) => item !== null)
    .join(' ');

  const message =
    [
      due.length
        ? Object.entries(Object.groupBy(due, (item) => item.category))
            .map(
              ([category, items]) => `${items?.at(0)?.blob} ${category}: ${items?.map(({ item }) => item).join(', ')}`
            )
            .join(' ')
        : null,
      next.length
        ? Object.entries(Object.groupBy(next, (item) => item.category))
            .map(
              ([category, items]) => `${items?.at(0)?.blob} ${category}: ${items?.map(({ item }) => item).join(', ')}`
            )
            .join(' ')
        : null,
      later.length
        ? Object.entries(Object.groupBy(later, (item) => item.category))
            .map(
              ([category, items]) => `${items?.at(0)?.blob} ${category}: ${items?.map(({ item }) => item).join(', ')}`
            )
            .join(' ')
        : null,
    ]
      .filter((item) => item !== null)
      .join('\n') || '🟢 All done!';

  const status = { due: due.length, message, title: `${appName}${summary ? ` ${summary}` : ''}` };

  const hash = createHash('sha256', { encoding: 'utf8' })
    .update(JSON.stringify(status))
    .digest('base64url')
    .slice(-HASH_LENGTH);

  return Object.assign(status, { hash });
});

export type StatusMessage = Awaited<ReturnType<typeof getTextStatusServer>>;
