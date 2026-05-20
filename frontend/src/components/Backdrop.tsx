import {useState,useEffect,useRef} from 'react';

interface BackdropProps{
  visible:boolean;
  clickHandler:()=>void;
}

function Backdrop(props:BackdropProps){
  const [isVisible,setIsVisible]=useState(props.visible);
  const backdropRef=useRef<HTMLDivElement>(null);
  const transitionMs=200;
  const timeoutRef=useRef<NodeJS.Timeout|null>(null);

  useEffect(()=>{
    if (backdropRef.current && backdropRef.current){
      backdropRef.current.classList.toggle('show',isVisible);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current=null;
      };
      timeoutRef.current=setTimeout(()=>{
        backdropRef.current?.classList.toggle('d-none',!isVisible);
      },transitionMs)
    }
  },[isVisible])

  function clickHandler(visible:boolean){
    setIsVisible(!visible);
    props.clickHandler();
  }

  // BUG: onClick isn't getting fired
  return (
    <div ref={backdropRef} className='offcanvas-backdrop fade' onClick={()=>{clickHandler(isVisible)}}></div>
  )
}

export default Backdrop;