import { useState,useRef } from "react"

interface SelectProps{
  default:number;
  options:Array<{value:number;label:string}>;
  classes?:string;
  changeHandler:(value:number)=>void;
}

function Select(props:SelectProps){
  const [value,setValue]=useState(props.default);
  const timeoutRef=useRef<NodeJS.Timeout|null>(null);

  function changeHandler(val:string){
    const i=parseInt(val);
    setValue(i);
    if (timeoutRef.current){
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current=setTimeout(()=>{
      timeoutRef.current=null;
      props.changeHandler(i);
    },500)
  }

  return (
    <select className={props.classes} value={value} onChange={(event)=>{changeHandler(event.target.value)}}>
      {props.options.map(item=>(
        <option key={item.value} value={item.value}>{item.label}</option>
      ))}
    </select>
  )
}

export default Select