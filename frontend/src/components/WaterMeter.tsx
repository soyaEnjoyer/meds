import { CSSProperties } from "react";
import { formatNumber } from "utils";

interface WaterMeterProps{
  targetDay:number;
  targetNow:number;
  value:number;
  widthVw?:number;
  maxWidthPx?:number;
  unitName?:string;
}
function WaterMeter(props:WaterMeterProps){
  const progress=props.targetNow===0 ? 0 : props.value/props.targetNow*100;
  const widthVw=props.widthVw ?? 60;
  const maxWidthPx=props.maxWidthPx ?? 300;

  const unitName=props.unitName ?? 'cL';

  //TODO: this is quite grim. tidy up later
  return (
    <>
      <div className='progress mx-auto mt-3'
        style={{
          '--width':`min(${widthVw}vw, ${maxWidthPx}px)`,
          height:`calc(var(--width) * 1.5)`,
          width:`var(--width)`,
          clipPath: 'polygon(15% 100%, 85% 100%, 100% 15%, 100% 0%, 0% 0%, 0% 15%)',
        } as CSSProperties}
        >
        <span
          className='fs-6 text-muted position-absolute text-center mt-3 d-flex flex-column gap-1'
          style={{
            width:'var(--width)',
          } as CSSProperties}
        >
          <span className='fs-4 text-body'>{Math.round(progress)}%</span>
          <span>{formatNumber(props.value-props.targetNow)}{unitName}</span>
          {/* <span>Target {formatNumber(props.targetNow,false)}{unitName}</span> */}
          <span>Total {formatNumber(props.value,false)}{unitName}</span>
        </span>
        <div
          className='progress-bar w-100 mt-auto'
          style={{height:`${Math.min(progress,100)}%`} as CSSProperties}
        ></div>
      </div>
    </>
  )
}

export default WaterMeter