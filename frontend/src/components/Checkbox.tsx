import {useState} from "react"

interface CheckboxProps{
  default:boolean;
  classes?:string;
  label:string;
  changeHandler:(value:boolean)=>void;
};

function Checkbox(props:CheckboxProps){
  const [checked,setChecked]=useState(props.default);

  function changeHandler(value:boolean){
    setChecked(value);
    props.changeHandler(value);
  };

  return (
    <div className='form-check form-switch'>
      <input type='checkbox' className={'form-check-input '+props.classes} onChange={(event)=>{changeHandler(event.target.checked)}} checked={checked}/>
      <label className='form-check-label'>{props.label}</label>
    </div>
  )
}

export default Checkbox