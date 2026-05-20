import {ScheduleEditData, ScheduleItemData} from 'routes/Schedule';
import {useState,useEffect} from 'react';
import Backdrop from 'components/Backdrop';
import { formatDatetimeIso } from 'utils';
import Select from 'react-select';
import ButtonArray from './ButtonArray';
import NumberInput from './NumberInput';


interface ScheduleEditModalProps{
  data:ScheduleItemData;
  scheduleDelete:(itemId:number)=>void;
  scheduleEdit:(item:ScheduleEditData)=>void;
  hideModal:()=>void;
}

//TODO: these probably need to be nullable for schedule creation
interface FormValues{
  id?:number;
  itemId:number;
  itemName:string; //not stored, ui only
  unitName:string; //not stored, ui only
  categoryId:number;
  hour:number;
  minute:number;
  amount:number;
  repeatCount:number;
  restDays:number;
  cycleOnDays:number;
  cycleOffDays:number;
  startAt:string;
  endAt:string;
  dayMask:number;
  monthMask:number;
  enabled:boolean;
  sort:number;
  dueAt:string; //reconstructed from dueAt.slice(0,10), hour, and minute
}

interface CategoryType{
  id:number;
  categoryName:string;
}

interface ItemType{
  id:number;
  itemName:string;
  unitName:string;
}

function ScheduleEditModal(props:ScheduleEditModalProps){
  const [formValues,setFormValues]=useState(props.data as FormValues);
  const [categories,setCategories]=useState<Array<CategoryType>>([]);
  const [items,setItems]=useState<Array<ItemType>>([]);

  useEffect(()=>{
    fetch('/api/data/category')
    .then((response)=>response.json())
    .then((apiResponse:Array<any>)=>setCategories(apiResponse.map(item=>item as CategoryType)))
    .catch((error)=>console.error(error));

    fetch('/api/data/itemView')
    .then((response)=>response.json())
    .then((apiResponse:Array<any>)=>setItems(apiResponse.map(item=>item as ItemType)))
    .catch((error)=>console.error(error));
  },[])

  function changeHandler(event:React.SyntheticEvent){
    //sanitise inputs
    //TODO: this also catches events for child components. probably need to add onChange to every single input
    const target=event.target as HTMLElement;
    if (target instanceof HTMLInputElement){
      const {name,value}=target;
      switch (target.type.toLowerCase()){
        case 'checkbox':
          switch (name){
            case 'enabled':
              setFormValues((prevFormValues)=>({
                ...prevFormValues,
                [name]:target.checked,
                ...(target.checked ? {} : {dueAt:''}),
              }));
              break;
            default:
              setFormValues((prevFormValues)=>({
                ...prevFormValues,[name]:target.checked
              }));
          }
          break;
        case 'date':
          const date=target.valueAsDate;
          switch (name){
            case 'dueDate':
              // console.log('changeHandler',name,date,value);
              setFormValues((prevFormValues)=>({
                ...prevFormValues,
                dueAt:date ? formatDatetimeIso(date.setHours(formValues.hour,formValues.minute,0,0)) : '',
              }));
              break;
            default:
              setFormValues((prevFormValues)=>({
                ...prevFormValues,[name]:formatDatetimeIso(date)
              }));
          }
          break;
        case 'number':
          switch (name){
            case 'amount':
              // setFormValues((prevFormValues)=>({
              //   ...prevFormValues,[name]:Math.max(0.01,Number(value))
              // }));
              break;
            case 'cycleOnDays':
            case 'repeatCount':
              setFormValues((prevFormValues)=>({
                ...prevFormValues,[name]:Math.max(1,parseInt(value))
              }));
              break;
            default:
              setFormValues((prevFormValues)=>({
                ...prevFormValues,[name]:Math.max(0,parseInt(value))
              }));
          }
          break;
        case 'time':
          const [hour,minute]=value.split(':');
          switch (name){
            case 'time':
              setFormValues((prevFormValues)=>({
                ...prevFormValues,
                hour:Number(hour),
                minute:Number(minute),
              }));
              break;
            default:
              console.error('unhandled HTMLInputElement time change',name,value);
          }
          break;
        default:
          console.error('unhandled HTMLInputElement change',target.type.toLowerCase(),name,value);
      }
    } else if(target instanceof HTMLSelectElement){
      const {name,value}=target;
      switch (name){
        case 'categoryId':
          setFormValues((prevFormValues)=>({
            ...prevFormValues,[name]:Number(value)
          }));
          break;
        case 'itemId':
          setFormValues((prevFormValues)=>({
            ...prevFormValues,
            itemId:Number(value),
            unitName:items.find(item=>item.id===Number(value))?.unitName ?? '',
          }));
          break;
        default:
          console.error('unhandled HTMLSelectElement change',name,value);
      }
    } else {
      console.error('unhandled change',event.target);
    }
  }

  return (
    <>
      <Backdrop visible={true} clickHandler={props.hideModal}/>
      <div className='modal fade show d-block' aria-hidden='false'>
        <div className='modal-dialog'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h1 className='modal-title fs-5'>Edit schedule</h1>
              <button type='button' onClick={()=>{props.hideModal()}} className='btn-close' aria-label='Close'></button>
            </div>
            <div className='modal-body'>
              <div className='row row-cols-1' onChange={(event)=>{changeHandler(event)}}>
                <div className='input-group rounded-pill-group mb-3'>
              <label className='input-group-text user-select-none border-end-0'>Item</label>
                  <Select
                    options={items.map(item=>({
                      value:item.id,
                      label:`${item.itemName}${item.unitName ? ` (${item.unitName})` : ''}`,
                    }))}
                    defaultValue={{
                      value:formValues.itemId,
                      label:`${formValues.itemName}${formValues.unitName ? ` (${formValues.unitName})` : ''}`,
                    }}
                    onChange={(newValue)=>{
                      if (newValue){
                        const item=items.find(i=>i.id===newValue.value)!;
                        setFormValues((prevFormValues)=>({
                          ...prevFormValues,
                          itemId:item.id,
                          itemName:item.itemName,
                          unitName:item.unitName,
                        }))
                      }
                    }}
                    className='flex-grow-1'
                    classNames={{
                      control:({isFocused})=>`form-select rounded-start-0 rounded-end-pill ${isFocused ? 'focus' : ''}`, //note: not the top-level element hence no right border on the label
                      menu:()=>'bg-body px-2 py-1 border rounded-3 shadow fs-5 bg-body-tertiary', //menu items
                      indicatorsContainer:()=>'d-none', //caret
                    }}
                    unstyled={true}
                  />
                </div>
                <div className='input-group rounded-pill-group mb-3'>
                  <label className='input-group-text user-select-none'>Category</label>
                  <select className='form-select' value={formValues.categoryId}>
                    {categories.sort((a,b)=>a.categoryName.localeCompare(b.categoryName)).map(item=>(
                      <option key={item.id} value={item.id}>{item.categoryName}</option>
                    ))}
                  </select>
                </div>
                <div className='input-group rounded-pill-group mb-3'>
                  <label className='input-group-text user-select-none'>Amount</label>
                  {/* <input name='amount' type='number' className='form-control' min='0' value={formValues.amount}></input> */}
                  <NumberInput
                    defaultValue={formValues.amount}
                    min={props.data.stepSize}
                    max={props.data.amount*10}
                    step={props.data.stepSize}
                    changeHandler={(value:number)=>{setFormValues((prevFormValues)=>({
                      ...prevFormValues,
                      amount:Number(value),
                    }))}}
                  />
                  {formValues.unitName ? <span className='input-group-text '>{formValues.unitName}</span> : null}
                  <span className='input-group-text '>x</span>
                  <input name='repeat' type='number' className='form-control' min='1' value={formValues.repeatCount}></input>
                </div>
                <div className='input-group rounded-pill-group mb-3'>
                  <label className='input-group-text user-select-none'>Time</label>
                  <input name='time' type='time' className='form-control' value={`${formValues.hour.toString().padStart(2,'0')}:${formValues.minute.toString().padStart(2,'0')}`}></input>
                  <label className='input-group-text user-select-none'>Due</label>
                  <input name='dueDate' type='date' className='form-control' value={formValues.dueAt ? formValues.dueAt.slice(0,10) : ''}></input>
                </div>
                <div className='input-group rounded-pill-group mb-3'>
                  <label className='input-group-text user-select-none'>Start</label>
                  <input name='startAt' type='date' className='form-control' value={formValues.startAt.slice(0,10)}></input>
                  <label className='input-group-text user-select-none'>End</label>
                  <input name='endAt' type='date' className='form-control' value={formValues.endAt?.slice(0,10)}></input>
                </div>
                <div className='input-group rounded-pill-group mb-3'>
                  <label className='input-group-text user-select-none'>Rest</label>
                  <input name='restDays' type='number' className='form-control' min='0' value={formValues.restDays}></input>
                  <label className='input-group-text user-select-none'>On</label>
                  <input name='cycleOnDays' type='number' className='form-control' min='1' value={formValues.cycleOnDays}></input>
                  <label className='input-group-text user-select-none'>Off</label>
                  <input name='cycleOffDays' type='number' className='form-control' min='0' value={formValues.cycleOffDays}></input>
                </div>
                <div className='input-group rounded-pill-group mb-3'>
                  <label className='input-group-text user-select-none'>Enabled</label>
                  <div className='input-group-text bg-body w-30'>
                    <input name='enabled' type='checkbox' className='form-checkbox' checked={formValues.enabled}></input>
                  </div>
                  <label className='input-group-text user-select-none'>Sort</label>
                  <input name='sort' type='number' className='form-control' value={formValues.sort}></input>
                </div>

                <ButtonArray
                  label='Days'
                  colour='success'
                  classNames='rounded-pill-group'
                  value={formValues.dayMask}
                  items={'MTWTFSS'.split('')}
                  changeHandler={(value)=>setFormValues((prevFormValues)=>({
                    ...prevFormValues,
                    dayMask:value,
                  }))}
                />

                <ButtonArray
                  label='Months'
                  colour='success'
                  classNames='rounded-pill-group'
                  value={formValues.monthMask}
                  items={'JFMAMJJASOND'.split('')}
                  changeHandler={(value)=>setFormValues((prevForValues)=>({
                    ...prevForValues,
                    monthMask:value,
                  }))}
                />

              </div>
            </div>
            <div className='modal-footer'>
              <button type='button' onClick={()=>{props.hideModal()}} className='btn btn-glow btn-sm btn-secondary rounded-pill px-4 py-1 fs-4 shadow'><i className='bi bi-backspace'></i></button>
              <button type='button' onClick={()=>{
                props.scheduleEdit(formValues as ScheduleEditData);
                props.hideModal()
              }} className='btn btn-glow btn-sm btn-warning rounded-pill px-4 py-1 fs-4 shadow'><i className='bi bi-pen'></i></button>
              {/* <button type='button' onClick={()=>{
                props.scheduleDelete(formValues?.id ?? -1);
                props.hideModal()
              }} className='btn btn-glow btn-sm btn-danger rounded-pill px-4 py-1 fs-4 shadow'><i className='bi bi-x'></i></button> */}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ScheduleEditModal;