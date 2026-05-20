#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime,timedelta

def main():
  endpoint=f'http://{sys.argv[1]}/api/data'
  print(f'{endpoint=}')

  cutoff=datetime.fromisoformat('2024-09-12T10:20:00Z')
  print(f'{cutoff=}')

  history_newest=requests.get(f'{endpoint}/historyNewestView').json()
  # print(history_newest)
  schedules=requests.get(f'{endpoint}/schedule').json()
  # print(schedules)

  for history_item in [x for x in history_newest if datetime.fromisoformat(x['createdAt'])>=cutoff]:
    schedule_item=next(iter([x for x in schedules if x['id']==history_item['scheduleId'] and x['enabled']]),None)
    if schedule_item:
      print(f'found {schedule_item=}')
      if schedule_item['cycleOffDays']==0 and schedule_item['dayMask']==127 and schedule_item['monthMask']==4095:
        due_at=(datetime.fromisoformat(history_item['createdAt']).replace(hour=schedule_item['hour'],minute=schedule_item['minute'],second=0,microsecond=0)+timedelta(days=schedule_item['restDays']+1)).strftime('%Y-%m-%d %H:%M:%S')
        print(f'{due_at=}')
        requests.patch(f'{endpoint}/schedule',
          headers={'Content-Type':'application/json'},
          json={
            'id':schedule_item['id'],
            'dueAt':due_at,
          },
        )
      else:
        print(f'unhandled recur rules for {schedule_item}')
    # else:
    #   print(f'could not find schedule item for {history_item=}')

if __name__=='__main__': main()