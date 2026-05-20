import { useState,useRef } from "react"

interface TextInputProps{
  default:string;
  classes?:string;
  changeHandler:(value:string)=>void;
}

function TextInput(props:TextInputProps){
  const [text,setText]=useState(props.default);
  const timeoutRef=useRef<NodeJS.Timeout|null>(null);

  function changeHandler(value:string){
    setText(value);
    if (timeoutRef.current){
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current=setTimeout(()=>{
      timeoutRef.current=null;
      props.changeHandler(value);
    },500)
  }

  return (
    <input type='text' className={props.classes} value={text} onChange={(event)=>{changeHandler(event.target.value)}}/>
  )
}

export default TextInput