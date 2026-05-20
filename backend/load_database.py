#!/usr/bin/env python3
import sqlite3
import json
import os
import sys
import subprocess
FROM_DB_PATH:str='/mnt/backup/pixel6/data/data/com.termux/files/home/script/meds.db'
TEMP_DB_PATH:str='/tmp/meds.db'
PULL_LIVE_CMD:list[str]=[
  'scp',
  '-P',
  '8022',
  'root@pixel6:/data/data/com.termux/files/home/script/meds.db',
  TEMP_DB_PATH
]
TO_DB_PATH:str=os.path.join(os.path.split(__file__)[0],'data.db')
IMPORT_TABLES:list[str]=[
  'category',
  'history',
  'item',
  'schedule',
  'target',
  'unit'
]
CLEAR_TABLES:list[str]=[
  *IMPORT_TABLES,
  'history_status',
  'schedule_status',
  'sqlite_sequence'
]

def main():
  if '-live' in sys.argv[1:]:
    print(PULL_LIVE_CMD)
    subprocess.run(PULL_LIVE_CMD,check=True)
    conn_from=sqlite3.connect(TEMP_DB_PATH)
  else:
    conn_from=sqlite3.connect(FROM_DB_PATH)
  conn_to=sqlite3.connect(TO_DB_PATH)
  conn_from.row_factory=sqlite3.Row
  conn_to.row_factory=sqlite3.Row

  print(f'deleting from {CLEAR_TABLES}')
  for table in CLEAR_TABLES:
    conn_to.execute(f'delete from {table}')
    conn_to.commit()

  categories=conn_from.execute('select name,hue from class order by lower(name)')
  conn_to.executemany('insert into category (category_name,hue) values (?,?)',categories)
  conn_to.commit()

  units=conn_from.execute('select name from unit order by lower(name)')
  conn_to.executemany('insert into unit (unit_name) values (?)',units)
  conn_to.commit()

  items=conn_from.execute('''select distinct
    m.name,
    u.name unit_name,
    1-m.agg sum_total
  from med m
  join unit u on u.id=m.unit_id
  order by lower(m.name),lower(u.name)''')
  conn_to.executemany('insert into item (item_name,unit_id,sum_total) values (?,(select u.id from unit u where u.unit_name=?),?)',items)
  conn_to.commit()

  #sqlite day nums are 0-6, where 0 is sunday. js is 1-7, where 1 is monday. left shift by 1 and wrap the day mask
  schedules=conn_from.execute('''select
    med item_name,
    unit unit_name,
    class category_name,
    cast(substring(time,1,2) as integer) hour,
    cast(substring(time,4,2) as integer) minute,
    dose amount,
    1 repeat_count,
    days-1 rest_days,
    onday cycle_on_days,
    offday cycle_off_days,
    unixepoch(start,'utc') start_at,
    unixepoch(end,'utc') end_at,
    ((mask<<1) & 127) | ((mask>>6) &1) day_mask,
    4095 month_mask,
    active enabled,
    sort,
    unixepoch(next,'utc') due_at,
    unixepoch(taken,'utc') completed_at,
    id migrated_id
  from sched_view''')
  # print(json.dumps(dict(list(schedules)[0]),indent=2))
  for schedule in list(schedules):
    # print(json.dumps(dict(schedule),indent=2))
    # print(dict(conn_to.execute('select * from item i join unit u on u.id=i.unit_id where i.name=? and u.name=?',(schedule['item_name'],schedule['unit_name'])).fetchone()))
    # print(dict(conn_to.execute('select * from category c where c.name=?',(schedule['category_name'],)).fetchone()))
    conn_to.execute('''insert into schedule (
      item_id,
      category_id,
      hour,
      minute,
      amount,
      repeat_count,
      rest_days,
      cycle_on_days,
      cycle_off_days,
      start_at,
      end_at,
      day_mask,
      month_mask,
      enabled,
      sort,
      due_at,
      completed_at,
      migrated_id
    ) values (
      (select i.id from item i join unit u on u.id=i.unit_id where i.item_name=? and u.unit_name=?),
      (select c.id from category c where c.category_name=?),
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?
    )''',schedule)
  conn_to.commit()

  # migrated_id is used since we don't have a unique key to look up the specific schedule item in the new db
  histories=conn_from.execute('''select
    h.sched_id migrated_id,
    h.dose amount,
    h.dose scheduled_amount,
    unixepoch(h.sched,'utc') scheduled_at,
    unixepoch(h.input,'utc') created_at
  from hist h''')
  conn_to.executemany('''insert into history (
    schedule_id,
    amount,
    scheduled_amount,
    scheduled_at,
    created_at
  ) values (
    (select id from schedule where migrated_id=?),
    ?,
    ?,
    ?,
    ?
  )''',histories)
  conn_to.commit()

  conn_to.execute('''insert into target (
    id,
    item_id,
    target_name,
    target_amount,
    hour_start,
    hour_end
  ) values (
    1,
    (select id from item where item_name='Water') ,
    'Water',
    300,
    4,
    22
  )''')
  conn_to.commit()

  for table in IMPORT_TABLES:
    stats=conn_to.execute(f'select ? name,count(1) count,max(id) max_id from {table}',(table,)).fetchone()
    print(dict(stats))

if __name__=='__main__': main()