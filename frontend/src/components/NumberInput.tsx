import { useState,useRef, useEffect } from "react"

interface NumberInputProps{
  defaultValue?:number;
  classes?:string;
  min?:number;
  max?:number;
  step?:number;
  debounceMs?:number;
  changeHandler:(value:number)=>void;
};

function NumberInput({
  defaultValue=0,
  classes='form-control',
  min=0,
  max=100,
  step=1,
  debounceMs=100,
  changeHandler
}:NumberInputProps){
  const [value,setValue]=useState(String(defaultValue));
  const timeoutRef=useRef<NodeJS.Timeout|null>(null);
  const elemRef=useRef<(HTMLInputElement|null)>(null);;
  const [valid,setValid]=useState(true);

  const innerChangeHandler=(inputValue:string)=>{
    //TODO: validate functionality then refactor
    let numberValue=parseFloat(inputValue);
    const cleanedValue=Math.max(min,Math.min(max,numberValue));
    console.debug('component',inputValue,numberValue,cleanedValue);
    if (inputValue==='' && min<=0 && max>=0){
      //value is empty, and 0 is allowed. don't replace with a '0' since that makes editing hard
      setValue(inputValue);
      numberValue=0;
    }else if (isNaN(cleanedValue) || Math.abs(cleanedValue-numberValue)===step){
      //allow invalid numbers during editing but return without passing them to the outer handler
      setValue(inputValue);
      setValid(false);
      // console.debug('invalid ignore');
      return;
    } else if (numberValue===cleanedValue){
      //use the raw string value where possible so that '0.0' being edited to '0.01' doesn't get replaced with '0'
      setValue(inputValue);
      // console.debug('valid');
    } else {
      //value was outside of valid range and must be replaced
      setValue(String(cleanedValue));
      // console.debug('invalid override');
    };
    setValid(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current=setTimeout(()=>{
      timeoutRef.current=null;
      changeHandler(numberValue);
    },debounceMs);
  };

  useEffect(()=>{
    if (!elemRef.current) return;
    const elem=elemRef.current;
    const wheelHandler=(event:WheelEvent)=>{
      if (event.deltaY===0) return;
      event.preventDefault();
      innerChangeHandler(String(parseFloat(value)+(step*event.deltaY > 0 ? -1 : 1)));
    };
    elem.addEventListener('wheel',wheelHandler)
    return ()=>{elem.removeEventListener('wheel',wheelHandler)};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[innerChangeHandler,step]);

  return (
    <input
      ref={elemRef}
      type='number'
      className={classes+` ${valid ? 'border-success' : 'border-danger'} border-2`}
      value={value || ''}
      min={min ?? 0}
      max={max ?? 100}
      step={step ?? 1}
      onChange={(event)=>innerChangeHandler(event.target.value)}
    />
  );
};

export default NumberInput;