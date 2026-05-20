import WaterMeter from "components/WaterMeter";
import { useEffect, useState } from "react";
import { formatCompletedDatetime } from "utils";

interface WaterData{
  itemId:number;
  dayTargetAmount:number;
  nowTargetAmount:number;
  lastAmount:number;
  lastCompleted:string;
  history:Array<number>;
}

function Water(){
  const DEFAULT_AMOUNT=30;
  const AMOUNT_STEP=10;
  const MINIMUM_AMOUNT=10;
  const unitName='cL';
  const [addAmount,setAddAmount]=useState(DEFAULT_AMOUNT);
  const [data,setData]=useState<WaterData|null>();
  const [history,setHistory]=useState<Array<number>|null>();

  const fetchData=()=>{
    console.log('fetchData',new Date());
    fetch('/api/method/water')
    .then(response=>response.json())
    .then((response:WaterData)=>setData(response));
  };

  useEffect(()=>{
    //TODO: i'm not convinced that this won't go horribly out of sync if the browser tab isn't active or the machine hibernates. if necessary, remove the setInterval and just setTimeout dynamically each time
    console.log('useEffect',new Date());
    fetchData();
    const nextHour=new Date();
    nextHour.setHours(nextHour.getHours()+1,0,0,0);
    const millisUntilNextHour=Math.max(nextHour.getTime()-Date.now(),5_000);
    const timeout=setTimeout(()=>{
      console.log('timeout',new Date());
      const interval=setInterval(fetchData,3600_000);
      fetchData();
      return ()=>{clearInterval(interval)};
    },millisUntilNextHour);
    return ()=>{clearTimeout(timeout)};
  },[]);

  useEffect(()=>{
    //array.toReversed doesn't exist somewhere.
    if (data){
      const newHistory=data.history.slice(0,10);
      newHistory.reverse()
      setHistory(newHistory);
    }
  },[data]);

  function addHandler(){
    fetch('/api/method/water',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({amount:addAmount})
    })
    .then(response=>response.json())
    .then((response:WaterData)=>setData(response));
  };

  return (
    <div className='container my-2 mx-0 mx-md-auto px-0 overflow-x-hidden'>
      <WaterMeter targetDay={data?.dayTargetAmount ?? 0} targetNow={data?.nowTargetAmount ?? 0} value={history ? history[history.length-1] : 0} />
      <div className='d-flex flex-row my-3 w-80 mx-auto justify-content-center'>
        {history?.map((item,ix)=>{
          const target=(ix===history?.length-1 ? data?.nowTargetAmount : data?.dayTargetAmount) ?? 0;
          // const lightness=target ? 100-Math.min(item/target*50,50) : 50;
          const SUCCESS_HUE=152.2;
          const hue=target ? Math.min(item/target*SUCCESS_HUE,SUCCESS_HUE): SUCCESS_HUE;
          // return <span key={ix} className='badge text-dark' style={{backgroundColor:`hsl(152.2, 68.8%, ${lightness}%)`}}>{item}</span>
          return <span key={ix} className='badge text-dark' style={{backgroundColor:`hsl(${hue}, 68.8%, 50%)`}}>{item}</span>
        })}
      </div>
      <div className='row my-3 w-80 mx-auto'>
        <div className='input-group rounded-pill-group'>
          <span className='input-group-text'>Last</span>
          <span className='form-control text-center'>{data?.lastAmount}{unitName} {formatCompletedDatetime(data?.lastCompleted)}</span>
        </div>
      </div>
      <div className='row my-3 w-80 mx-auto'>
        <div className='col-9'>
          <div className="input-group rounded-pill-group">
            <button type="button" className="btn btn-secondary px-4" onClick={()=>{setAddAmount(Math.max(MINIMUM_AMOUNT,addAmount-AMOUNT_STEP))}}>-</button>
            <input type="number" className="form-control appearance-textfield text-center" value={addAmount} onChange={(event)=>{setAddAmount(parseInt(event.target.value))}}/>
            <span className='input-group-text' onClick={()=>{setAddAmount(DEFAULT_AMOUNT)}}>{unitName}</span>
            <button type="button" className="btn btn-secondary px-4" onClick={()=>{setAddAmount(addAmount+AMOUNT_STEP)}}>+</button>
          </div>
        </div>
        <div className='col-3 d-flex'>
          <button type="button" className="btn btn-primary flex-fill rounded-pill" onClick={()=>{addHandler()}}>Add</button>
        </div>
      </div>


    </div>
  )
}

export default Water;