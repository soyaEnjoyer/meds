#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime,timedelta

def main():
  endpoint=f'http://{sys.argv[1]}/api/data'
  print(f'{endpoint=}')

  schedules=requests.get(f'{endpoint}/schedule').json()
  # print(schedules)
  items=requests.get(f'{endpoint}/itemView').json()
  # print(items)

  for item in items:
    schedule_amount=min([x['amount'] for x in schedules if x['itemId']==item['id']] or [1])
    match item['unitName']:
      case 'cL': step_size=10
      case '' | 'Daily' | 'Drop' | 'Min': step_size=1
      case 'Dropper': step_size=0.25
      case 'kg': step_size=0.1
      case 'mg': step_size=schedule_amount/4
      case 'Pill': step_size=0.25
      case 'Pump': step_size=min(schedule_amount,1)
      case 'mL': step_size=float('0.'+('0'*(len(str(schedule_amount).split('.')[1].rstrip('0'))-1))) if schedule_amount<1 else schedule_amount/4
      case _:
        print(f'unhandled {item=}')
        exit()
    if step_size!=1: print(f'''{item=} {schedule_amount=} {step_size=}''')
    if step_size!=item['stepSize']:
      requests.patch(f'{endpoint}/item',
        headers={'Content-Type':'application/json'},
        json={
          'id':item['id'],
          'stepSize':step_size,
        },
      )

if __name__=='__main__': main()