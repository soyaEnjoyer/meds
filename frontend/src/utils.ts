import {format,differenceInCalendarDays,differenceInCalendarWeeks,differenceInMinutes, formatISO,differenceInWeeks,differenceInMonths} from 'date-fns';

export function formatRepeatRules(enabled:boolean,restDays:number,cycleOnDays:number,cycleOffDays:number,cycleDayNum:number,dayMask:number,monthMask:number){
  if (!enabled) return 'None';
  const DAYS:{[key:string]:number}={
    Mo:1,
    Tu:2,
    We:4,
    Th:8,
    Fr:16,
    Sa:32,
    Su:64,
  };
  const MONTHS:{[key:string]:number}={
    Ja:1,
    Fe:2,
    Mr:4,
    Ap:8,
    My:16,
    Je:32,
    Jl:64,
    Au:128,
    Se:256,
    Oc:512,
    No:1024,
    De:2048,
  };
  type RangeAccumulator={
    ix:number|null;
    vals:[string,string|null][];
  };
  const items=[];
  if (restDays || cycleOffDays){
    items.push(`${restDays+1}d`)
    if (cycleOffDays){
      [cycleOnDays,cycleOffDays,cycleDayNum].forEach(item=>items.push(String(item)));
    }
  }
  if(dayMask!==127){
    items.push(
      dayMask===0 ? 'None' :
      Object.entries(DAYS)
      .reduce<RangeAccumulator>((acc,[lbl,mask],ix)=>{
        if (mask&dayMask){
          if (acc.ix!==null && ix===acc.ix+1){
            acc.vals[acc.vals.length-1][1]=lbl;
          }else{
            acc.vals.push([lbl,null]);
          }
          acc.ix = ix;
        }
        return acc;
      },{ix:null,vals:[]})
      .vals
      .map(([start,end])=>end ? `${start}-${end}` : start)
      .join(', ')
    );
  };
  if(monthMask!==4095){
    items.push(
      monthMask===0 ? 'None' :
      Object.entries(MONTHS)
      .reduce<RangeAccumulator>((acc,[lbl,mask],ix)=>{
        if (mask&monthMask){
          if (acc.ix!==null && ix===acc.ix+1){
            acc.vals[acc.vals.length-1][1]=lbl;
          }else{
            acc.vals.push([lbl,null]);
          }
          acc.ix = ix;
        }
        return acc;
      },{ix:null,vals:[]})
      .vals
      .map(([start,end])=>end ? `${start}-${end}` : start)
      .join(', ')
    );
  };

  // if (monthMask!==4095){
  //   items.push(monthMask===0 ? 'None' :
  //     Object.entries(MONTHS)
  //       .filter(([_,mask])=>(mask & monthMask)===mask)
  //       .map(([label,_])=>label.slice(0,2))
  //       .join(',')
  //   );
  // }
  return items.length ? items.join('/') : 'Daily';
}

export function formatDueDatetime(datetime:any):[number,string]{
  //BUG: '10' sorts before '7' obviously. need to rework the sort part of the tuple
  if (datetime===null) return [Infinity,'Not scheduled'];
  const dt=new Date(datetime);
  const now=new Date();
  const dayDiff=differenceInCalendarDays(dt,now);
  switch (true){
    case dayDiff<0: return [0,'Missed'];
    case dayDiff===0: return dt<now ? [1,'Due'] : [2+dt.getHours(),format(dt,'H:mm')];
    case dayDiff===1: return [30+dt.getHours(),`Tomorrow ${format(dt,'H:mm')}`];
    default:
      const calWeekDiff=differenceInCalendarWeeks(dt,now,{weekStartsOn:1});
      switch (calWeekDiff){
        case 0: return [60+dt.getDay(),format(dt,'eeee')];
        case 1: return [70+dt.getDay(),`Next ${format(dt,'eeee')}`];
        default:
          const monthDiff=differenceInMonths(dt,now);
          switch (monthDiff){
            case 0:
            case 1:
              const weekDiff=(differenceInWeeks(dt,now));
              return [80+weekDiff,`In ${weekDiff} week${weekDiff===1 ? '' : 's'}`];
            default:
              return [90+monthDiff,`In ${monthDiff} month${monthDiff===1 ? '' : 's'}`];
          }
      };
  };
}

export function formatCompletedDatetime(datetime:any):string{
  if (datetime===null) return 'Never';
  const dt=new Date(datetime);
  const now=new Date();
  const minDiff=differenceInMinutes(now,dt)
  const dayDiff=differenceInCalendarDays(now,dt);
  switch (true){
    case minDiff<=15: return 'Now';
    case minDiff<=45: return `${Math.round(minDiff/15)*15} min ago`;
    case minDiff<=60*8: return `${Math.round(minDiff/60)} hr ago`;
    case dayDiff===0: return format(dt,'H:mm');
    case dayDiff===1: return `Yday ${format(dt,'H:mm')}/${dayDiff}`;
    default:
      const calWeekDiff=differenceInCalendarWeeks(now,dt,{weekStartsOn:1});
      switch (calWeekDiff){
        case 0: return `${format(dt,'eee')}/${dayDiff}`;
        case 1: return `Last ${format(dt,'eee')}/${dayDiff}`;
        default:
          // const monthDiff=differenceInMonths(now,dt);
          const monthDiff=Math.round(dayDiff/30);
          switch (monthDiff){
            case 0:
            case 1:
              // return `${differenceInWeeks(now,dt)} wk ago/${dayDiff}`;
              return `${Math.round(dayDiff/7)} wk ago/${dayDiff}`;
            default:
              return `${monthDiff} mo ago/${dayDiff}`;
          }
      };
  };
};

export function formatDatetime(datetime:any,missing='Never'){
  if (!datetime) return missing;
  return format(new Date(datetime),'PP HH:mm');
};

export function formatDatetimeIso(datetime:any,missing=''){
  if (!datetime) return missing;
  try {return formatISO(new Date(datetime))}
  catch {return missing};
}

export function formatDate(datetime:any,missing='Never'){
  if (!datetime) return missing;
  return format(new Date(datetime),'PP');
};

export function formatNumber(value:number,signed:boolean=true){
  return Intl.NumberFormat('en-GB',{
    style: 'decimal',
    useGrouping: true,
    signDisplay: signed ? 'always' : 'auto', //second option should be "negative" but there's some old jank going on
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);

}

export function formatSeconds(value:number){
  const hours=Math.floor(value/3600);
  const minutes=Math.floor(value%3600/60);
  const seconds=Math.floor(value%60);
  return `${hours}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
}