import {useState,useEffect, useRef} from 'react';
import { formatDatetime, formatSeconds } from 'utils';

interface TimerControlProps{
  seconds:number;
  secondsChangeHandler:(seconds:number)=>void;
  stateChangeHandler:(active:boolean)=>void;
  completedHandler:(seconds:number)=>void;
};

enum TimerState{
  Reset='Reset',
  Running='Running',
  Paused='Paused',
  Stopped='Stopped',
};

function TimerControl(props:TimerControlProps){
  //TODO: kodi integration
  //TODO: ticks and ending - sound and maybe toggle dark/light back and forwards?
  // const tickSeconds=props.initialSeconds >= 900 ? 300 : 60; //TODO: might want a select for this
  const [completedSeconds,setCompletedSeconds]=useState(0);
  const [timerState,setTimerState]=useState(TimerState.Reset);
  const timerRef=useRef<NodeJS.Timeout|null>(null);
  // const [startedAt,setStartedAt]=useState(new Date());
  const startedAtRef=useRef(new Date()); //useRef is immune to the delayed update weirdness that react does with useState

  useEffect(()=>{
    switch (timerState){
      case TimerState.Running:
        console.log('changed to running');
        const newStartedAt=new Date();
        newStartedAt.setSeconds(newStartedAt.getSeconds()-completedSeconds);
        // setStartedAt(newStartedAt);
        startedAtRef.current=newStartedAt;
        if (!timerRef.current){
          timerRef.current=setInterval(()=>{
            setCompletedSeconds((prevCompletedSeconds)=>{
              // const newCompletedSeconds=prevCompletedSeconds+1; //intervals don't fire when the screen is off so seconds will stop incrementing
              const newCompletedSeconds=Math.round((Date.now()-startedAtRef.current.valueOf())/1000);
              // console.log('interval prevCompletedSeconds',prevCompletedSeconds,'newCompletedSeconds',newCompletedSeconds,'timerState',timerState,'props.seconds',props.seconds);
              if (newCompletedSeconds>=props.seconds) setTimerState(TimerState.Stopped);
              return newCompletedSeconds;
            })
          },1000);
        }
        break;
      case TimerState.Paused:
        console.log('changed to paused');
        if (timerRef.current){
          clearInterval(timerRef.current);
          timerRef.current=null;
        };
        break;
      case TimerState.Stopped:
        console.log('changed to stopped');
        if (timerRef.current){
          clearInterval(timerRef.current);
          timerRef.current=null;
        };
        if (completedSeconds>0) props.completedHandler(Math.min(props.seconds,completedSeconds)); //if the tab got backgrounded, callback with the requested seconds rather than the realtime elapsed
        break;
      case TimerState.Reset:
        console.log('changed to reset');
        setCompletedSeconds(0);
        props.secondsChangeHandler(props.seconds)
        setTimerState(TimerState.Stopped);
        break;
    }
    props.stateChangeHandler([TimerState.Running,TimerState.Paused].includes(timerState));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[timerState]);

  return (
    <>
      <div className='d-flex flex-column gap-3 text-center'>
        <span className='fs-1'>{formatSeconds(completedSeconds)}</span>
        <span className='text-muted'>{formatSeconds(props.seconds-completedSeconds)} remaining</span>
        <span className='text-muted'>
          {timerState===TimerState.Running ? `Ends at ${formatDatetime(Date.now()+((props.seconds-completedSeconds)*1000))}` : String(timerState) }
        </span>
      </div>

      <div className='btn-group rounded-pill-group w-60 mx-auto d-flex mt-3'>
        <button className='flex-fill btn btn-outline-secondary' onClick={()=>{props.secondsChangeHandler(Math.max(props.seconds-300,completedSeconds))}}>-5</button>
        <button className='flex-fill btn btn-outline-secondary' onClick={()=>{props.secondsChangeHandler(Math.max(props.seconds-60,completedSeconds))}}>-1</button>
        <span className='flex-fill input-group-text rounded-0 border-start-0 border-end-0 justify-content-center'>{formatSeconds(props.seconds)} total</span>
        <button className='flex-fill btn btn-outline-secondary' onClick={()=>{props.secondsChangeHandler(props.seconds+60)}}>+1</button>
        <button className='flex-fill btn btn-outline-secondary' onClick={()=>{props.secondsChangeHandler(props.seconds+300)}}>+5</button>
      </div>

      <div className='button-group rounded-pill-group w-60 mx-auto d-flex mt-3'>
        <button
          type='button'
          className='btn btn-primary flex-fill py-2'
          onClick={()=>{setTimerState(timerState===TimerState.Running ? TimerState.Paused : TimerState.Running)}}
          >
            <i className={`bi bi-${timerState===TimerState.Running ? 'pause' : 'play'}`}></i>
          </button>
        <button
          type='button'
          className='btn btn-danger flex-fill py-2'
          onClick={()=>{setTimerState([TimerState.Stopped,TimerState.Reset].includes(timerState) ? TimerState.Reset : TimerState.Stopped)}}
          >
            <i className='bi bi-stop'></i>
        </button>
      </div>
    </>
  );
}

export default TimerControl;