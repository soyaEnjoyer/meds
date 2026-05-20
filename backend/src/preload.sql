replace into history_status (status_id,status_name) values
  (0,'Skipped'),
  (1,'Partial'),
  (2,'Complete'),
  (3,'Extra'),
  (4,'Unscheduled')
;

replace into schedule_status (status_id,status_emoji,
status_name) values
  (0,'⚫','Disabled'),
  (1,'⚫','Not scheduled'),
  (2,'🔴','Missed'),
  (3,'🟡','Due'),
  (4,'🟢','Later'),
  (5,'🔵','Scheduled')
;
