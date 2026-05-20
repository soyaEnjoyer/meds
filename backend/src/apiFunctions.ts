// import Database from 'better-sqlite3';
import DatabaseConstructor, { Database } from 'better-sqlite3';
import { and, desc, eq, sql, isNull, max, isNotNull } from 'drizzle-orm';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { Request, Response } from 'express'; //TODO: NextFunction for hooks
import * as schema from './schema';
import fs from 'fs';
import { DefaultLogger, LogWriter } from 'drizzle-orm/logger';

import { createNamedLogger } from './logger';
import winston from 'winston/lib/winston/config';
import { create } from 'domain';

class DrizzleLogger implements LogWriter {
  logger = createNamedLogger('drizzle');
  write = (message: string) => this.logger.debug(message);
}

const ApiFunctions = (databasePath: string) => {
  const logger = createNamedLogger('apiFunctions');
  logger.debug('apifunctions constructor start');
  logger.debug({ databasePath });
  const sqlite = new DatabaseConstructor(databasePath, {
    fileMustExist: false,
    verbose: createNamedLogger('sqlite').debug,
  } as DatabaseConstructor.Options);
  logger.debug('apifunctions constructor pragmas');
  sqlite.pragma('foreign_keys=ON');
  sqlite.pragma('journal_mode=WAL');
  logger.debug('apifunctions constructor drizzle');
  const db = drizzle(sqlite, {
    schema,
    logger: new DefaultLogger({ writer: new DrizzleLogger() }),
  });
  const webhookUrls = process.env.WEBHOOK_URLS;
  let webhookTimeout: NodeJS.Timeout | undefined = undefined;
  logger.debug('apifunctions constructor done');

  const doMigrations = () => {
    //BUG: this seems unreliable at best
    logger.debug('migrations start');
    try {
      migrate(db, { migrationsFolder: './drizzle' });
      logger.debug('migrations done');
    } catch (error) {
      logger.error(error);
    }
  };

  const createViews = () => {
    Object.entries(schema.viewDefinitions).forEach(([name, query]) => {
      const { sql: querySql, params } = query.toSQL();
      [
        `drop view if exists ${name}`,
        `create view ${name} as ${querySql} ${params}`,
      ].forEach((statement) => {
        logger.debug(statement);
        if (params && params.length) logger.error({ params }); //having trouble with views trying to use params
        sqlite.exec(statement);
      });
    });
  };

  const preload = () => {
    fs.readFile('src/preload.sql', 'utf-8', (error, data) => {
      if (error) {
        logger.error(error);
      } else {
        sqlite.exec(data);
      }
    });
  };

  const sendWebhooks = async () => {
    if (!webhookUrls) return;
    logger.debug('sendWebhooks');
    if (webhookTimeout) clearTimeout(webhookTimeout);
    webhookTimeout = setTimeout(() => {
      const body = JSON.stringify(db.select().from(schema.statsView).get());
      webhookUrls.split(',').forEach((url) => {
        if (url) {
          logger.debug('sending webhook to', url);
          fetch(url, {
            method: 'POST',
            body: body,
          });
        }
      });
    }, 5000);
  };

  const viewFunctions = (view: any, viewName: string) => {
    return {
      get: (req: Request, res: Response) => {
        const itemId = parseInt(req.params.id);
        try {
          if (Number.isNaN(itemId)) {
            res.status(200).json(db.select().from(view).all());
          } else if (itemId === -1) {
            res
              .status(200)
              .json(
                db.select().from(view).orderBy(desc(view.id)).limit(1).get()
              );
          } else if (itemId < -1) {
            res
              .status(200)
              .json(
                db
                  .select()
                  .from(view)
                  .orderBy(desc(view.id))
                  .limit(Math.abs(itemId))
                  .all()
              );
          } else {
            res
              .status(200)
              .json(db.select().from(view).where(eq(view.id, itemId)).get());
          }
        } catch (error) {
          logger.error(error);
          res.status(500).json({ error });
        }
      },
    };
  };

  const tableFunctions = (table: any, tableName: string) => {
    type selectType = typeof table.$inferSelect;
    type insertType = typeof table.$inferInsert;
    return {
      get: (req: Request, res: Response) => {
        const itemId = parseInt(req.params.id);
        try {
          if (Number.isNaN(itemId)) {
            res.status(200).json(db.select().from(table).all());
          } else if (itemId === -1) {
            res
              .status(200)
              .json(
                db.select().from(table).orderBy(desc(table.id)).limit(1).get()
              );
          } else if (itemId < -1) {
            res
              .status(200)
              .json(
                db
                  .select()
                  .from(table)
                  .orderBy(desc(table.id))
                  .limit(Math.abs(itemId))
                  .all()
              );
          } else {
            res
              .status(200)
              .json(db.select().from(table).where(eq(table.id, itemId)).get());
          }
        } catch (error) {
          logger.error(error);
          res.status(500).json({ error });
        }
      },
      post: (req: Request, res: Response) => {
        try {
          res.status(200).json(
            db
              .insert(table)
              .values(req.body as insertType)
              .returning()
              .get()
          );
        } catch (error) {
          logger.error(error);
          res.status(500).json({ error });
        }
      },
      patch: (req: Request, res: Response) => {
        const itemId = parseInt(req.body.id ?? req.params.id);
        try {
          res.status(200).json(
            db
              .update(table)
              .set(
                Object.fromEntries([
                  ...Object.entries(req.body as insertType).filter(
                    ([key]) => key !== 'id'
                  ),
                  ['updatedAt', sql`(unixepoch())`],
                ])
              )
              .where(eq(table.id, itemId))
              .returning()
              .get()
          );
        } catch (error) {
          logger.error(error);
          res.status(500).json({ error });
        }
      },
      put: (req: Request, res: Response) => {
        const itemId = parseInt(req.body.id ?? req.params.id);
        try {
          res.status(200).json(
            db
              .update(table)
              .set(
                Object.fromEntries([
                  ...Object.entries(req.body as insertType).filter(
                    ([key]) => key !== 'id'
                  ),
                  ['updatedAt', sql`(unixepoch())`],
                ])
              )
              .where(eq(table.id, itemId))
              .returning()
              .get()
          );
        } catch (error) {
          logger.error(error);
          res.status(500).json({ error });
        }
      },
      delete: (req: Request, res: Response) => {
        const itemId = parseInt(req.body.id ?? req.params.id);
        try {
          res
            .status(200)
            .json(
              db.delete(table).where(eq(table.id, itemId)).returning().get()
            );
        } catch (error) {
          logger.error(error);
          res.status(500).json({ error });
        }
      },
    };
  };

  const scheduleHandler = async (req: Request, res: Response) => {
    const MAX_ITERATIONS = 1000;
    // need to use a ye olde for loop instead of a Array.forEach/map/reduce since forEach isn't async so we can't await the this.db calls. which would be bad.
    const reqBodies = req.body instanceof Array ? req.body : [req.body];
    const returnData: Array<any> = [];
    const now = new Date();
    const nowEnd = new Date();
    nowEnd.setHours(23, 59, 59, 999);

    for (const reqBody of reqBodies) {
      //get the relevant fields from the request body
      const itemId = Number(req.params.id ?? reqBody.id);
      const amount = Number(reqBody.amount) ? Number(reqBody.amount) : null;
      logger.debug({ itemId, amount });

      //select the schedule item
      const scheduleItem = await db
        .select()
        .from(schema.scheduleView)
        .where(eq(schema.scheduleView.id, itemId))
        .limit(1)
        .get();
      if (!scheduleItem) {
        logger.error(`item id ${itemId} not found`);
        continue;
      }
      // logger.debug('scheduleItem.dayMask',scheduleItem.dayMask,typeof scheduleItem.dayMask);
      // logger.debug('scheduleItem.monthMask',scheduleItem.monthMask,typeof scheduleItem.monthMask);

      //insert into history
      const historyItem = {
        scheduleId: itemId,
        amount: amount,
        scheduledAmount: scheduleItem.amount,
        scheduledAt: scheduleItem.dueAt,
        createdAt: now,
      };
      await db
        .insert(schema.history)
        .values(historyItem as typeof schema.history.$inferInsert);
      logger.debug('inserted ' + JSON.stringify(historyItem));

      // calculate the next due timestamp
      if (scheduleItem.enabled) {
        const stepSize = amount ? scheduleItem.restDays + 1 : 1;
        const nowToDueHours = scheduleItem.dueAt
          ? (now.getTime() - scheduleItem.dueAt.getTime()) / (1000 * 60 * 60)
          : 0;
        //use dueAt if skipped or now is less than 12h after dueAt. otherwise, now
        let testDate = new Date(
          Math.max(
            scheduleItem.startAt.getTime(),
            scheduleItem.dueAt &&
              (!amount || (0 < nowToDueHours && nowToDueHours < 12))
              ? scheduleItem.dueAt.getTime()
              : now.getTime()
          )
        );
        let testCycleDay =
          Math.floor(
            (testDate.getTime() - scheduleItem.startAt.getTime()) / 86400000
          ) % (scheduleItem.cycleTotalDays ?? 1);
        let skipFirstIncrement = testDate === scheduleItem.startAt;
        let found = false;

        testDate.setHours(scheduleItem.hour, scheduleItem.minute, 0, 0);
        logger.debug({
          label: 'hours',
          stepSize,
          testDate,
          testCycleDay,
          skipFirstIncrement,
          found,
        });
        for (let i = 0; i < MAX_ITERATIONS; i++) {
          //increment
          if (i > 0 || !skipFirstIncrement) {
            testDate.setDate(testDate.getDate() + stepSize);
            testCycleDay =
              (testCycleDay + stepSize) % (scheduleItem.cycleTotalDays ?? 1);
            logger.debug({
              label: `increment ${i}`,
              stepSize,
              testDate,
              testCycleDay,
              skipFirstIncrement,
              found,
            });
          }
          logger.debug({ testDate, testCycleDay });
          // reached endAt
          logger.debug({ endAt: scheduleItem.endAt });
          if (scheduleItem.endAt && scheduleItem.endAt < testDate) {
            logger.debug('item has reached endAt');
            await db
              .update(schema.schedule)
              .set({
                dueAt: null,
                enabled: false,
                ...(amount
                  ? {
                      completedAt: now,
                      lastAmount: amount,
                    }
                  : {
                      skippedAt: now,
                    }),
              })
              .where(eq(schema.schedule.id, itemId));
            logger.debug('item has reached endAt - updated');
            found = true;
            break;
          }
          logger.debug('not at end date');

          // in cycleOffDays
          if (testCycleDay >= scheduleItem.cycleOnDays) continue;
          logger.debug('not in cycle off');

          // day is masked
          if (!scheduleItem.dayMask.matches(testDate.getDay())) continue;
          logger.debug('day not masked');

          // month is masked
          if (!scheduleItem.monthMask.matches(testDate.getMonth())) continue;
          logger.debug('month not masked');

          // found
          logger.debug(`found next dueAt: ${testDate}`);
          await db
            .update(schema.schedule)
            .set({
              dueAt: testDate,
              ...(amount
                ? {
                    completedAt: now,
                    lastAmount: amount,
                  }
                : {
                    skippedAt: now,
                  }),
            })
            .where(eq(schema.schedule.id, itemId));
          logger.debug('found next dueAt', testDate, 'updated');
          found = true;
          break;
        }
        if (!found) {
          // we didn't find a new dueAt within MAX_ITERATIONS
          logger.error(
            `could not find a new dueAt within ${MAX_ITERATIONS} iterations for ` +
              JSON.stringify(scheduleItem)
          );
          await db
            .update(schema.schedule)
            .set({
              dueAt: null,
              ...(amount
                ? {
                    completedAt: now,
                    lastAmount: amount,
                  }
                : {
                    skippedAt: now,
                  }),
            })
            .where(eq(schema.schedule.id, itemId));
        }
      } else {
        await db
          .update(schema.schedule)
          .set({
            ...(!scheduleItem.dueAt || scheduleItem.dueAt <= nowEnd
              ? { dueAt: null }
              : {}),
            ...(amount
              ? {
                  completedAt: now,
                  lastAmount: amount,
                }
              : {
                  // skippedAt:now,
                }),
          })
          .where(eq(schema.schedule.id, itemId));
        logger.debug('skipped scheduling');
      }

      //push the updated scheduleView item to returnData
      try {
        returnData.push(
          await db
            .select()
            .from(schema.scheduleView)
            .where(eq(schema.scheduleView.id, itemId))
            .limit(1)
            .get()
        );
      } catch (error) {
        logger.error(error);
      }
    }

    try {
      res.status(200).json(returnData);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error });
    }
    sendWebhooks();
  };

  const historyHandler = async (req: Request, res: Response) => {
    // this will always return an array of historyLatestView items. it could contain no, one, or many entries
    // get returns all
    // delete deletes the history item and returns the next newest item (could be one or empty)
    // post/patch/put/etc edits the history item and returns the next newest item (could be one or empty)
    try {
      if (req.method === 'GET') {
        res
          .status(200)
          .json(await db.select().from(schema.historyNewestView).all());
      } else {
        const itemId = parseInt(req.params.id ?? req.body.id);
        const { scheduleId, scheduledAt, createdAt } = (await db
          .select({
            scheduleId: schema.history.scheduleId,
            scheduledAt: schema.history.scheduledAt,
            createdAt: schema.history.createdAt,
          })
          .from(schema.history)
          .where(eq(schema.history.id, itemId))
          .get())!;
        if (req.method === 'DELETE') {
          await db.delete(schema.history).where(eq(schema.history.id, itemId));
        } else {
          await db
            .update(schema.history)
            .set({
              amount: Number(req.params.amount ?? req.body.amount)
                ? Number(req.params.amount ?? req.body.amount)
                : null,
            })
            .where(eq(schema.history.id, itemId));
        }
        const { completedAt, lastAmount } = (await db
          .select({
            completedAt: schema.history.createdAt,
            lastAmount: schema.history.amount,
          })
          .from(schema.history)
          .where(
            and(
              eq(schema.history.scheduleId, scheduleId),
              isNotNull(schema.history.amount)
            )
          )
          .orderBy(desc(schema.history.createdAt))
          .limit(1)
          .get()) ?? { completedAt: null, lastAmount: null };
        const { skippedAt } = (await db
          .select({ skippedAt: schema.history.createdAt })
          .from(schema.history)
          .where(
            and(
              eq(schema.history.scheduleId, scheduleId),
              isNull(schema.history.amount)
            )
          )
          .orderBy(desc(schema.history.createdAt))
          .limit(1)
          .get()) ?? { skippedAt: null };
        if (req.method === 'DELETE') {
          //only update createdAt if we just deleted the newest history entry and the schedule is enabled
          const { lastCreatedAt } = (await db
            .select({ lastCreatedAt: schema.history.createdAt })
            .from(schema.history)
            .innerJoin(
              schema.schedule,
              and(
                eq(schema.schedule.id, schema.history.scheduleId),
                eq(schema.schedule.enabled, true)
              )
            )
            .where(eq(schema.history.scheduleId, scheduleId))
            .orderBy(desc(schema.history.createdAt))
            .limit(1)
            .get()) ?? { lastCreatedAt: null };
          await db
            .update(schema.schedule)
            .set({
              completedAt: completedAt,
              lastAmount: lastAmount,
              skippedAt: skippedAt,
              ...(lastCreatedAt && lastCreatedAt < createdAt
                ? { dueAt: scheduledAt }
                : {}),
            })
            .where(eq(schema.schedule.id, scheduleId));
        } else {
          await db
            .update(schema.schedule)
            .set({
              completedAt: completedAt,
              lastAmount: lastAmount,
              skippedAt: skippedAt,
            })
            .where(eq(schema.schedule.id, scheduleId));
        }
        res
          .status(200)
          .json(
            await db
              .select()
              .from(schema.historyNewestView)
              .where(eq(schema.historyNewestView.scheduleId, scheduleId))
              .all()
          );
      }
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error });
    }
  };

  const waterHandler = async (req: Request, res: Response) => {
    try {
      if (req.method === 'POST') {
        const amount = parseInt(req.body.amount ?? req.params.amount);
        const { scheduleId } = await db
          .select({ scheduleId: schema.scheduleView.id })
          .from(schema.scheduleView)
          .where(eq(schema.scheduleView.itemName, 'Water'))
          .limit(1)
          .get()!;
        const now = new Date();
        await db
          .insert(schema.history)
          .values({
            scheduleId,
            amount,
            scheduledAmount: amount,
            scheduledAt: now,
          });
        await db
          .update(schema.schedule)
          .set({ completedAt: now, lastAmount: amount })
          .where(eq(schema.schedule.id, scheduleId));
      }
      const viewData = await db.select().from(schema.waterView).get();
      const returnData = {
        itemId: viewData!.itemId,
        dayTargetAmount: viewData!.dayTargetAmount,
        nowTargetAmount: viewData!.nowTargetAmount,
        lastCompleted: viewData!.lastCompleted,
        lastAmount: viewData!.lastAmount,
        ...Object.fromEntries(
          Object.entries(viewData as Object).filter(
            ([key, value]) => !key.startsWith('amountDay')
          )
        ),
        history: Object.entries(viewData as Object)
          .filter(([key, value]) => key.startsWith('amountDay'))
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([key, value]) => value),
      };
      res.status(200).json(returnData);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error });
    }
  };

  const notifyHandler = async (req: Request, res: Response) => {
    try {
      const items = await db.select().from(schema.notifyView).all();
      res.status(200).json({
        body: items.map((item) => `${item.prefix} ${item.items}`).join('\n'),
        title: items.length
          ? items.map((item) => item.titlePart).join(' · ')
          : 'All done',
      });
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error });
    }
  };

  const statsHandler = async (req: Request, res: Response) => {
    try {
      res.status(200).json(await db.select().from(schema.statsView).get());
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error });
    }
  };

  return {
    doMigrations,
    createViews,
    preload,
    sendWebhooks,
    viewFunctions,
    tableFunctions,
    scheduleHandler,
    historyHandler,
    waterHandler,
    notifyHandler,
    statsHandler,
  };
};

export default ApiFunctions;
