#!/usr/bin/env python3

import requests
import json
import sys

def main():
  endpoint=f'http://{sys.argv[1]}/api/data'
  print(f'{endpoint=}')

  schedules=requests.get(f'{endpoint}/scheduleView').json()
  print(f'{len(schedules)=}')
  history=requests.get(f'{endpoint}/history').json()
  print(f'{len(history)=}')

  for schedule in schedules:
    last_completed_item=next(
      iter(
        sorted(
          [
            x for x in history if x['scheduleId']==schedule['id'] and x['amount']
          ],
          key=lambda y: y['createdAt'],
          reverse=True
        )
      ),None
    )
    if last_completed_item:
      completed_at=last_completed_item['createdAt']
      last_amount=last_completed_item['amount']
    else:
      completed_at=None
      last_amount=None

    last_skipped_item=next(
      iter(
        sorted(
          [
            x for x in history if x['scheduleId']==schedule['id'] and not(x['amount'])
          ],
          key=lambda y: y['createdAt'],
          reverse=True
        )
      ),None
    )
    if last_skipped_item:
      skipped_at=last_skipped_item['createdAt']
    else:
      skipped_at=None

    print(f'''{schedule['id']=} {schedule['categoryName']=} {schedule['itemName']=} {completed_at=} {skipped_at=} {last_amount=}''')
    requests.patch(f'{endpoint}/schedule',
      headers={'Content-Type':'application/json'},
      json={
        'id':schedule['id'],
        'completedAt':completed_at,
        'skippedAt':skipped_at,
        'lastAmount':last_amount,
      },
    )

if __name__=='__main__': main()