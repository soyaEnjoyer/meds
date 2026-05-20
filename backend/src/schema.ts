import {text,integer,real,blob,unique,sqliteTable,sqliteView,QueryBuilder,customType,index} from 'drizzle-orm/sqlite-core';
import { sql, SQL, eq, max, and, sum, gte, Subquery, lt, isNotNull, or } from 'drizzle-orm';
import {createNamedLogger} from './logger';

const logger=createNamedLogger('schema');

export class SelectedDays{
  public static readonly DAYS:{[key:string]:number}={
    Monday:1,
    Tuesday:2,
    Wednesday:4,
    Thursday:8,
    Friday:16,
    Saturday:32,
    Sunday:64,
  };
  public static readonly DEFAULT:number=127;
  private mask:number;
  constructor(mask:number=SelectedDays.DEFAULT){
    this.mask=SelectedDays.DEFAULT;
    this.setMask(mask);
  }
  setMask(mask:number){
    if (mask<0 || mask>127) throw new Error('mask must be an integer between 0 and 127');
    this.mask=mask;
  }
  matches(dayId:number):boolean{
    const mask=dayId===1 ? 1 : 2<<((dayId===0 ? 7 : dayId)-2);
    return (mask & this.mask)===mask;
  }
  toArray():string[]{
    return Object.entries(SelectedDays.DAYS)
      .filter(([_,mask])=>(mask & this.mask)===mask)
      .map(([label,_])=>label);
  }
  toString():string{
    return this.toArray()
      .map(label=>label.slice(0,3))
      .join(',');
  }
  toJSON():number{
    return this.mask;
  }
  toNumber():number{
    return this.mask;
  }
  valueOf():number{
    return this.mask;
  }
}

export class SelectedMonths{
  public static readonly MONTHS:{[key:string]:number}={
    January:1,
    February:2,
    March:4,
    April:8,
    May:16,
    June:32,
    July:64,
    August:128,
    September:256,
    October:512,
    November:1024,
    December:2048,
  }
  public static readonly DEFAULT:number=4095;
  private mask:number;
  constructor(mask:number=SelectedMonths.DEFAULT){
    this.mask=SelectedMonths.DEFAULT;
    this.setMask(mask);
  }
  setMask(mask:number){
    if (mask<0 || mask>4095) throw new Error('mask must be an integer between 0 and 4095');
    this.mask=mask;
  }
  matches(monthId:number):boolean{
    const mask=monthId===0 ? 1 : 2<<(monthId-1);
    return (mask & this.mask)===mask;
  }
  toArray():string[]{
    return Object.entries(SelectedMonths.MONTHS)
      .filter(([_,mask])=>(mask & this.mask)===mask)
      .map(([label,_])=>label);
  }
  toString():string{
    return this.toArray()
      .map(label=>label.slice(0,3))
      .join(',');
  }
  toJSON():number{
    return this.mask;
  }
  toNumber():number{
    return this.mask;
  }
  valueOf():number{
    return this.mask;
  }
}

const selectedDaysType=customType<{data:SelectedDays,driverData:number}>({
  dataType(){
    return 'integer';
  },
  toDriver(value:SelectedDays|number){
    if (value instanceof SelectedDays) return value.toNumber();
    return value
  },
  fromDriver(value:number){
    return new SelectedDays(value);
  }
})

const selectedMonthsType=customType<{data:SelectedMonths,driverData:number}>({
  dataType(){
    return 'integer';
  },
  toDriver(value:SelectedMonths|number){
    if (value instanceof SelectedMonths) return value.toNumber();
    return value
  },
  fromDriver(value:number){
    return new SelectedMonths(value);
  }
})

const datetime = customType<{
  data: Date;
  driverData: number;
}>({
  dataType() {
    return 'integer';
  },
  toDriver(value: Date | string | number): number {
    let returnValue:number;
    switch (true){
      case value instanceof Date: returnValue=Math.floor(value.getTime() / 1000); break;
      case typeof value === 'number': returnValue=Math.floor(value); break;
      case typeof value === 'string': returnValue=Math.floor(new Date(value).getTime() / 1000); break;
      default: throw new Error('Invalid date value',value);
    }
    logger.debug(`datetime toDriver ${value} ${returnValue}`);
    return returnValue;
  },
  fromDriver(value: number): Date {
    return new Date(value * 1000);
  },
});

const nullableDatetime = customType<{
  data: Date | null;
  driverData: number | null;
}>({
  dataType() {
    return 'integer';
  },
  toDriver(value: Date | string | number | null): number | null {
    let returnValue:number|null=null;
    switch (true){
      case value===null: break;
      case value instanceof Date: returnValue=Math.floor(value.getTime() / 1000); break;
      case typeof value === 'number': returnValue=Math.floor(value); break;
      case typeof value === 'string': returnValue=Math.floor(new Date(value).getTime() / 1000); break;
      default: throw new Error('Invalid date value',value);
    };
    //TODO: disable after debugging scheduleHandler
    logger.debug(`nullableDatetime toDriver ${value} ${returnValue}`);
    return returnValue;
  },
  fromDriver(value: number | null): Date | null {
    return value === null ? null : new Date(value * 1000);
  },
});

// tables
export const testTable=sqliteTable('test',{
  id:integer('id').primaryKey({autoIncrement:true}),
  dayMask:selectedDaysType('day_mask').notNull(),
  someText:text('some_text'),
  createdAt:datetime('created_at').notNull().default(sql`(unixepoch())`),
});

export const category=sqliteTable('category',{
  id:integer('id').primaryKey({autoIncrement:true}),
  categoryName:text('category_name').unique().notNull(),
  hue:real('hue').notNull(), //.default(sql`(360.0/(select count(1) from category)*id)`), //TODO: this will need to be retriggered after every insert/delete. drizzle doesn't have triggers
  createdAt:datetime('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt:datetime('updated_at').notNull().default(sql`(unixepoch())`),
});

export const unit=sqliteTable('unit',{
  id:integer('id').primaryKey({autoIncrement:true}),
  unitName:text('unit_name').unique().notNull(),
  createdAt:datetime('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt:datetime('updated_at').notNull().default(sql`(unixepoch())`),
});

export const item=sqliteTable('item',{
  id:integer('id').primaryKey({autoIncrement:true}),
  itemName:text('item_name').notNull(),
  unitId:integer('unit_id').notNull().references(()=>unit.id),
  sumTotal:integer('sum_total',{mode:'boolean'}).notNull().default(true),
  tags:text('tags'),
  stepSize:real('step_size').notNull().default(1),
  createdAt:datetime('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt:datetime('updated_at').notNull().default(sql`(unixepoch())`),
},(t)=>({
  uniqueKey:unique().on(t.itemName,t.unitId),
}));

export const schedule=sqliteTable('schedule',{
  id:integer('id').primaryKey({autoIncrement:true}),
  itemId:integer('item_id').notNull().references(()=>item.id),
  categoryId:integer('category_id').notNull().references(()=>category.id),
  hour:integer('hour').notNull().default(7),
  minute:integer('minute').notNull().default(0),
  amount:real('amount').notNull().default(1),
  repeatCount:integer('repeat_count').notNull().default(1),
  restDays:integer('rest_days').notNull().default(0),
  cycleOnDays:integer('cycle_on_days').notNull().default(1),
  cycleOffDays:integer('cycle_off_days').notNull().default(0),
  cycleTotalDays:integer('cycle_total_days_gen').generatedAlwaysAs(():SQL=>sql`cycle_on_days+cycle_off_days`,{mode:'virtual'}),
  startAt:datetime('start_at').notNull().default(sql`(unixepoch('now','start of day'))`),
  endAt:nullableDatetime('end_at'),
  // object mappings don't work/aren't implemented for sqlite. apparently there's mapFrom/mapTo/mapWith but none work on sqlite tables. so we'll just do ints here and represent correctly in scheduleView
  // dayMask:integer('day_mask').$type<SelectedDays>().notNull().default(new SelectedDays()),
  // monthMask:integer('month_mask').$type<SelectedMonths>().notNull().default(new SelectedMonths()),
  // dayMask:integer('day_mask').notNull().default(SelectedDays.DEFAULT),
  // monthMask:integer('month_mask').notNull().default(SelectedMonths.DEFAULT),
  dayMask:selectedDaysType('day_mask').notNull().default(new SelectedDays()),
  monthMask:selectedMonthsType('month_mask').notNull().default(new SelectedMonths()),
  enabled:integer('enabled',{mode:'boolean'}).notNull().default(true),
  sort:integer('sort').notNull().default(0),
  dueAt:nullableDatetime('due_at'),
  completedAt:nullableDatetime('completed_at'),
  skippedAt:nullableDatetime('skipped_at'),
  lastAmount:real('last_amount'),
  migratedId:integer('migrated_id').unique(),
  createdAt:datetime('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt:datetime('updated_at').notNull().default(sql`(unixepoch())`),
});

export const scheduleStatus=sqliteTable('schedule_status',{
  statusId:integer('status_id').primaryKey({autoIncrement:true}),
  statusName:text('status_name').unique().notNull(),
  statusEmoji:text('status_emoji').notNull(),
});

export const history=sqliteTable('history',{
  id:integer('id').primaryKey({autoIncrement:true}),
  scheduleId:integer('schedule_id').notNull().references(()=>schedule.id),
  amount:real('amount'),
  scheduledAmount:real('scheduled_amount'),
  scheduledAt:nullableDatetime('scheduled_at'),
  createdAt:datetime('created_at').notNull().default(sql`(unixepoch())`),
},(table)=>({
  //TODO: verify that this index is what i need for history_newest_view
  scheduleIdCreatedAtIndex:index('schedule_id_created_at_ix').on(table.scheduleId,table.createdAt)
}));

export const historyStatus=sqliteTable('history_status',{
  statusId:integer('status_id').primaryKey({autoIncrement:true}),
  statusName:text('status_name').unique().notNull(),
});

export const target=sqliteTable('target',{
  id:integer('id').primaryKey({autoIncrement:true}),
  itemId:integer('item_id').references(()=>item.id),
  categoryId:integer('category_id').references(()=>category.id),
  unitId:integer('unit_id').references(()=>unit.id),
  scheduleId:integer('schedule_id').references(()=>schedule.id),
  targetName:text('target_name').notNull(),
  targetAmount:real('target_amount').notNull(),
  numDays:integer('num_days').notNull().default(1),
  hourStart:integer('hour_start').notNull().default(0),
  hourEnd:integer('hour_end').notNull().default(23),
  enabled:integer('enabled',{mode:'boolean'}).notNull().default(true),
  sort:integer('sort').notNull().default(0),
  createdAt:datetime('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt:datetime('updated_at').notNull().default(sql`(unixepoch())`),
});

export const tables={category,unit,item,schedule,scheduleStatus,history,historyStatus,target,testTable};

// views
//BUG: drizzle-kit currently does not create views. instead, we need to use a QueryBuilder to generate the sql and then create a view object based on that

const qb=new QueryBuilder();
const itemViewQuery=qb.select({
  id:item.id,
  itemName:item.itemName,
  unitId:item.unitId,
  unitName:unit.unitName,
  sumTotal:item.sumTotal,
  tags:item.tags,
  stepSize:item.stepSize,
  createdAt:item.createdAt,
  updatedAt:item.updatedAt,
})
  .from(item)
  .innerJoin(unit,eq(unit.id,item.unitId));

export const itemView=sqliteView('item_view').as(itemViewQuery);

const historyViewQuery = qb
  .select({
    id: history.id,
    scheduleId: history.scheduleId,
    itemId: schedule.itemId,
    itemName: item.itemName,
    tags: item.tags,
    categoryId: schedule.categoryId,
    categoryName: category.categoryName,
    unitId: item.unitId,
    stepSize: item.stepSize,
    unitName: unit.unitName,
    amount: history.amount,
    scheduledAmount: history.scheduledAmount,
    statusId: historyStatus.statusId,
    statusName: historyStatus.statusName,
    scheduledAt: history.scheduledAt,
    createdAt: history.createdAt,
  })
  .from(history)
  .innerJoin(schedule, eq(schedule.id, history.scheduleId))
  .innerJoin(item, eq(item.id, schedule.itemId))
  .innerJoin(category, eq(category.id, schedule.categoryId))
  .innerJoin(unit, eq(unit.id, item.unitId))
  .innerJoin(
    historyStatus,
    eq(
      historyStatus.statusId,
      sql`case
      when coalesce(history.amount,0)<=0 then 0
      when history.scheduled_amount is null then 4
      when history.amount<history.scheduled_amount then 1
      when history.amount=history.scheduled_amount then 2
      else 3
    end`
    )
  );

export const historyView=sqliteView('history_view').as(historyViewQuery);

const historyNewestSubquery=qb.select({
  scheduleId:history.scheduleId,
  maxCreatedAt:max(history.createdAt).as('max_created_at'),
}).from(history)
  .groupBy(history.scheduleId)
  .as('history_newest')
;

const historyNewestViewQuery = qb
  .select({
    id: historyView.id,
    scheduleId: historyView.scheduleId,
    itemId: historyView.itemId,
    itemName: historyView.itemName,
    tags: historyView.tags,
    categoryId: historyView.categoryId,
    categoryName: historyView.categoryName,
    unitId: historyView.unitId,
    unitName: historyView.unitName,
    amount: historyView.amount,
    scheduledAmount: historyView.scheduledAmount,
    statusId: historyView.statusId,
    statusName: historyView.statusName,
    scheduledAt: historyView.scheduledAt,
    createdAt: historyView.createdAt,
  })
  .from(historyView)
  .leftJoin(
    historyNewestSubquery,
    and(
      eq(historyNewestSubquery.scheduleId, historyView.scheduleId),
      eq(historyNewestSubquery.maxCreatedAt, historyView.createdAt)
    )
  )
  .where(or(isNotNull(historyNewestSubquery.scheduleId), gte(historyView.createdAt, sql`datetime('now','-1 day')`)));
;

export const historyNewestView=sqliteView('history_newest_view').as(historyNewestViewQuery);

const scheduleViewQuery=qb.select({
  id:schedule.id,
  itemId:schedule.itemId,
  itemName:item.itemName,
  unitId:item.unitId,
  unitName:unit.unitName,
  categoryId:schedule.categoryId,
  categoryName:category.categoryName,
  hue:category.hue,
  hour:schedule.hour,
  minute:schedule.minute,
  amount:schedule.amount,
  repeatCount:schedule.repeatCount,
  restDays:schedule.restDays,
  cycleOnDays:schedule.cycleOnDays,
  cycleOffDays:schedule.cycleOffDays,
  cycleTotalDays:schedule.cycleTotalDays,
  startAt:schedule.startAt,
  endAt:schedule.endAt,
  cycleDayNum:sql`
    (
      cast(
        (unixepoch('now','start of day')-start_at)
        /86400
        as integer
      )
    )%(
      cycle_total_days_gen
    )`
    .as('cycle_day_num'),
  dayMask:schedule.dayMask,
  monthMask:schedule.monthMask,
  enabled:schedule.enabled,
  sort:schedule.sort,
  tags:item.tags,
  stepSize:item.stepSize,
  dueAt:schedule.dueAt,
  completedAt:schedule.completedAt,
  skippedAt:schedule.skippedAt,
  lastAmount:schedule.lastAmount,
  // isOverdue:sql<Boolean>`enabled=1 and completed_at is not null and completed_at+((rest_days+1)*86400)<unixepoch('now','start of day')`.as('is_overdue'),
  isWarning:sql<Boolean>`enabled=1
    and (
      (
        skipped_at is not null
      and skipped_at>coalesce(completed_at,0)
      and due_at<unixepoch('now','start of day','+2 day')
      )
    or due_at<unixepoch('now','start of day')
    or due_at is null
    )`.as('is_warning'),
  isInfo:sql<Boolean>`due_at is not null
    and (
      completed_at is null
      or unixepoch(completed_at,'unixepoch','start of day')<unixepoch('now','-1 day','start of day')
      or rest_days>0
      or cycle_on_days>1
      or cycle_off_days>0
      or day_mask<127
      or month_mask<4095
      or end_at is not null
      or enabled=0
    )`.as('is_info'),
  statusId:scheduleStatus.statusId,
  statusName:scheduleStatus.statusName,
  statusEmoji:scheduleStatus.statusEmoji,
  migratedId:schedule.migratedId,
  createdAt:schedule.createdAt,
  updatedAt:schedule.updatedAt,
}).from(schedule)
  .innerJoin(item,eq(item.id,schedule.itemId))
  .innerJoin(category,eq(category.id,schedule.categoryId))
  .innerJoin(unit,eq(unit.id,item.unitId))
  .innerJoin(scheduleStatus,eq(scheduleStatus.statusId,sql`case
      when enabled=0 then 0
      when due_at is null then 1
      when due_at<unixepoch('now','start of day') then 2
      when due_at<unixepoch() then 3
      when due_at<unixepoch('now','start of day','+1 day') then 4
      else 5
    end`));

export const scheduleView=sqliteView('schedule_view').as(scheduleViewQuery);

const waterViewTargetQuery=qb.select({
  itemId:target.itemId,
  dayTargetAmount:target.targetAmount,
  nowTargetAmount:sql`
    round(
      target_amount/iif(
        hour_end=hour_start,
        1.0,
        1.0*(hour_end-hour_start)/(cast(strftime('%H','now','localtime') as integer)-hour_start)
      )
    )`.as('now_target_amount'),
}).from(target)
.where(eq(target.targetName,sql`'Water'`))
.as('water_target');

const waterViewHistoryQuery=qb.select({
  lastCompleted:max(historyView.createdAt).as('last_completed'),
  lastAmount:sql`coalesce(first_value(amount)over(order by created_at desc),0)`.as('last_amount'),
  amountDay0:sql`coalesce(sum(amount)filter(where created_at>=unixepoch('now','start of day')),0)`.as('amount_day_0'),
  amountDay1:sql`coalesce(sum(amount)filter(where created_at between unixepoch('now','start of day','-1 day') and unixepoch('now','start of day')),0)`.as('amount_day_1'),
  amountDay2:sql`coalesce(sum(amount)filter(where created_at between unixepoch('now','start of day','-2 day') and unixepoch('now','start of day','-1 day')),0)`.as('amount_day_2'),
  amountDay3:sql`coalesce(sum(amount)filter(where created_at between unixepoch('now','start of day','-3 day') and unixepoch('now','start of day','-2 day')),0)`.as('amount_day_3'),
  amountDay4:sql`coalesce(sum(amount)filter(where created_at between unixepoch('now','start of day','-4 day') and unixepoch('now','start of day','-3 day')),0)`.as('amount_day_4'),
  amountDay5:sql`coalesce(sum(amount)filter(where created_at between unixepoch('now','start of day','-5 day') and unixepoch('now','start of day','-4 day')),0)`.as('amount_day_5'),
  amountDay6:sql`coalesce(sum(amount)filter(where created_at between unixepoch('now','start of day','-6 day') and unixepoch('now','start of day','-5 day')),0)`.as('amount_day_6'),
  amountDay7:sql`coalesce(sum(amount)filter(where created_at between unixepoch('now','start of day','-7 day') and unixepoch('now','start of day','-6 day')),0)`.as('amount_day_7'),
  amountDay8:sql`coalesce(sum(amount)filter(where created_at between unixepoch('now','start of day','-8 day') and unixepoch('now','start of day','-7 day')),0)`.as('amount_day_8'),
  amountDay9:sql`coalesce(sum(amount)filter(where created_at between unixepoch('now','start of day','-9 day') and unixepoch('now','start of day','-8 day')),0)`.as('amount_day_9'),
  amountDay10:sql`coalesce(sum(amount)filter(where created_at between unixepoch('now','start of day','-10 day') and unixepoch('now','start of day','-9 day')),0)`.as('amount_day_10'),
  amountDay11:sql`coalesce(sum(amount)filter(where created_at between unixepoch('now','start of day','-11 day') and unixepoch('now','start of day','-10 day')),0)`.as('amount_day_11'),
  amountDay12:sql`coalesce(sum(amount)filter(where created_at between unixepoch('now','start of day','-12 day') and unixepoch('now','start of day','-11 day')),0)`.as('amount_day_12'),
  amountDay13:sql`coalesce(sum(amount)filter(where created_at between unixepoch('now','start of day','-13 day') and unixepoch('now','start of day','-12 day')),0)`.as('amount_day_13'),
}).from(historyView)
.where(and(
  eq(historyView.itemName,sql`'Water'`),
  gte(historyView.createdAt,sql`unixepoch('now','start of day','-13 day')`)
))
.as('water_history');

const waterViewQuery=qb.select({
  itemId:waterViewTargetQuery.itemId,
  dayTargetAmount:waterViewTargetQuery.dayTargetAmount,
  nowTargetAmount:waterViewTargetQuery.nowTargetAmount,
  lastCompleted:waterViewHistoryQuery.lastCompleted,
  lastAmount:waterViewHistoryQuery.lastAmount,
  amountDay0:waterViewHistoryQuery.amountDay0,
  amountDay1:waterViewHistoryQuery.amountDay1,
  amountDay2:waterViewHistoryQuery.amountDay2,
  amountDay3:waterViewHistoryQuery.amountDay3,
  amountDay4:waterViewHistoryQuery.amountDay4,
  amountDay5:waterViewHistoryQuery.amountDay5,
  amountDay6:waterViewHistoryQuery.amountDay6,
  amountDay7:waterViewHistoryQuery.amountDay7,
  amountDay8:waterViewHistoryQuery.amountDay8,
  amountDay9:waterViewHistoryQuery.amountDay9,
  amountDay10:waterViewHistoryQuery.amountDay10,
  amountDay11:waterViewHistoryQuery.amountDay11,
  amountDay12:waterViewHistoryQuery.amountDay12,
  amountDay13:waterViewHistoryQuery.amountDay13,
})
.from(waterViewTargetQuery)
.innerJoin(waterViewHistoryQuery,eq(sql`1`,sql`1`))
;

export const waterView=sqliteView('water_view').as(waterViewQuery);

const notifyViewSubSubQuery=qb.select()
.from(scheduleView)
.orderBy(scheduleView.dueAt,scheduleView.sort,scheduleView.itemName)
.as('schedule_sort');

const notifyViewSubQuery=qb.select({
  statusId:notifyViewSubSubQuery.statusId,
  statusName:notifyViewSubSubQuery.statusName,
  statusEmoji:notifyViewSubSubQuery.statusEmoji,
  categoryName:notifyViewSubSubQuery.categoryName,
  // itemNames:sql`group_concat(item_name,' · ')`.as('item_names'),
  itemNames:sql`replace(
    group_concat(distinct item_name),
    ',',
    ' · ')`.as('item_names'),
  itemCount:sql`count(1)`.as('item_count'),
})
.from(notifyViewSubSubQuery)
.where(lt(notifyViewSubSubQuery.dueAt,sql`unixepoch('now','start of day','+1 day')`))
.groupBy(notifyViewSubSubQuery.statusId,notifyViewSubSubQuery.categoryId)
.orderBy(notifyViewSubSubQuery.statusId,notifyViewSubSubQuery.categoryName)
.as('schedule_today');

const notifyViewQuery=qb.select({
  titlePart:sql`printf('%s %d %s',status_emoji,sum(item_count),lower(status_name))`.as('title_part'),
  prefix:sql`printf('%s %s [%d]: ',status_emoji,status_name,sum(item_count))`.as('prefix'),
  items:sql`group_concat(category_name || ': ' || item_names,' '||status_emoji||' ')`.as('items'),
})
.from(notifyViewSubQuery)
.groupBy(notifyViewSubQuery.statusId)
.orderBy(notifyViewSubQuery.statusId);

export const notifyView=sqliteView('notify_view').as(notifyViewQuery);

const statsViewQuery=qb.select({
  disabled:sql`count(1)filter(where status_id=0)`.as('count_disabled'),
  notScheduled:sql`count(1)filter(where status_id=1)`.as('count_not_scheduled'),
  missed:sql`count(1)filter(where status_id=2)`.as('count_missed'),
  due:sql`count(1)filter(where status_id=3)`.as('count_due'),
  later:sql`count(1)filter(where status_id=4)`.as('count_later'),
  scheduled:sql`count(1)filter(where status_id=5)`.as('count_scheduled'),
})
.from(scheduleView);

export const statsView=sqliteView('stats_view').as(statsViewQuery);

// these are exported so that restApi can create the views as drizzle-kit currently doesn't support views
export const viewDefinitions=({
  item_view:itemViewQuery,
  history_view:historyViewQuery,
  history_newest_view:historyNewestViewQuery,
  schedule_view:scheduleViewQuery,
  water_view:waterViewQuery,
  notify_view:notifyViewQuery,
  stats_view:statsViewQuery,
});

export const views={itemView,historyView,historyNewestView,scheduleView,waterView,notifyView,statsView};

//TODO: not super sure that these are needed
// export type Category=typeof category.$inferSelect;
// export type InsertCategory=typeof category.$inferInsert;
// export type Unit=typeof unit.$inferSelect;
// export type InsertUnit=typeof unit.$inferInsert;
// export type Item=typeof item.$inferSelect;
// export type InsertItem=typeof item.$inferInsert;
// export type Schedule=typeof schedule.$inferSelect;
// export type InsertSchedule=typeof schedule.$inferInsert;
// export type History=typeof history.$inferSelect;
// export type InsertHistory=typeof history.$inferInsert;
// export type HistoryStatus=typeof historyStatus.$inferSelect;
// export type InsertHistoryStatus=typeof historyStatus.$inferInsert;
// export type Target=typeof target.$inferSelect;
// export type InsertTarget=typeof target.$inferInsert;