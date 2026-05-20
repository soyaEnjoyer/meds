import Select from "components/Select";
import TimerControl from "components/TimerControl";
import { useState,useEffect } from "react";

interface ScheduleItem {
  scheduleId:number;
  itemName:string;
  scheduledAmount:number;
}

function Timer(){
  const [schedules,setSchedules]=useState<Array<ScheduleItem>>([]);
  const [selectedId,setSelectedId]=useState(0);
  const [timerSeconds,setTimerSeconds]=useState(0);
  const [timerActive,setTimerActive]=useState(false);

  useEffect(()=>{
    fetch('/api/data/scheduleView')
    .then(response=>response.json())
    .then((response:Array<any>)=>{
      const data=response
      .filter(item=>item.unitName==='Min' && item.categoryName==='Fit')
      .sort((a,b)=>Number(b.enabled)-Number(a.enabled) || a.itemName.localeCompare(b.itemName))
      .map(item=>({
        scheduleId:item.id,
        itemName:item.itemName,
        scheduledAmount:item.amount
      } as ScheduleItem));
      setSchedules(data);
      setSelectedId(data[0].scheduleId);
      setTimerSeconds(data[0].scheduledAmount*60);
    });
  },[]);

  function selectHandler(id:number){
    setSelectedId(id);
    setTimerSeconds((schedules.find(item=>item.scheduleId===id)?.scheduledAmount ?? 0)*60);
  }

  function callScheduleApi(scheduleId:number,seconds:number){
    fetch('/api/method/schedule',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        id:scheduleId,
        amount:Math.round(seconds/60),
      })
    });
  }

  return (
    <div className='container my-2 mx-0 mx-md-auto px-0 overflow-x-hidden'>
      { timerActive ? null :
        <div className='d-flex w-60 my-3 mx-auto'>
          <Select options={schedules.map(item=>({value:item.scheduleId,label:item.itemName}))} default={selectedId} changeHandler={(value)=>{selectHandler(value)}} classes='flex-fill form-select rounded-pill'/>
        </div>
      }
      <TimerControl seconds={timerSeconds} completedHandler={(seconds)=>{callScheduleApi(selectedId,seconds)}} secondsChangeHandler={(seconds)=>{setTimerSeconds(seconds)}} stateChangeHandler={(active)=>{setTimerActive(active)}}/> :
    </div>
  )
};

export default Timer;