import { useState,CSSProperties,useRef } from "react"

interface HuePickerProps{
  default:number;
  classes?:string;
  changeHandler:(value:number)=>void;
}

function HuePicker(props:HuePickerProps){
  const [hue,setHue]=useState(props.default);
  const timeoutRef=useRef<NodeJS.Timeout|null>(null);

  function changeHandler(value:string){
    const i=parseInt(value);
    setHue(i);
    if (timeoutRef.current){
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current=setTimeout(()=>{
      timeoutRef.current=null;
      props.changeHandler(i)
    },500)
  }

  return (
  //   <span className={props.classes} style={{
  //     backgroundColor:`hsl(${hue} 40% 40%)`
  //   } as CSSProperties}>
  //   <input type="range" className='form-range' min="0" max="360" value={hue} onChange={(event)=>{changeHandler(event.target.value)}}/>
  // </span>

    <input type='range' min='0' max='360' value={hue}
      className={props.classes}
      style={{
        backgroundColor:`hsl(${hue} 40% 40%)`
      } as CSSProperties}
      onChange={(event)=>{changeHandler(event.target.value)}}/>

  )
}

export default HuePicker