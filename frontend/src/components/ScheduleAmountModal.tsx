import {formatDatetime,formatDate} from 'utils';
import {ScheduleItemData,ScheduleMethodData,ModalVisibility} from 'routes/Schedule';
import {useState} from 'react';
import Backdrop from 'components/Backdrop';
import NumberInput from './NumberInput';

interface ScheduleAmountModalProps{
  data:ScheduleItemData;
  scheduleMethod:(item:ScheduleMethodData)=>void;
  hideModal:()=>void;
  showModal:(modalType:ModalVisibility,item:ScheduleItemData)=>void;
}

interface FormValues{
  amount:number;
}

function ScheduleAmountModal(props:ScheduleAmountModalProps){
  const [formValues,setFormValues]=useState(props.data as FormValues);

  return (
    <>
      <Backdrop visible={true} clickHandler={props.hideModal}/>
      <div className="modal fade show d-block" aria-hidden="false">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5">Custom amount</h1>
              <button type="button" onClick={()=>{props.hideModal()}} className="btn-close" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="row row-cols-1">
                <div className="input-group rounded-pill-group mb-3">
                  <label className="input-group-text user-select-none">Item</label>
                  <span className="form-control text-muted">{props.data.itemName}</span>
                  <label className="input-group-text user-select-none">Category</label>
                  <span className="form-control text-muted">{props.data.categoryName}</span>
                </div>
                <div className="input-group rounded-pill-group mb-3">
                  <label className="input-group-text user-select-none">ID</label>
                  <span className="form-control text-muted">{props.data.itemId}</span>
                  <label className="input-group-text user-select-none">Status</label>
                  <span className="form-control text-muted">{props.data.statusName}</span>
                </div>
                <div className="input-group rounded-pill-group mb-3">
                  <label className="input-group-text user-select-none">Created</label>
                  <span className="form-control text-muted">{formatDatetime(props.data.createdAt)}</span>
                </div>
                <div className="input-group rounded-pill-group mb-3">
                  <label className="input-group-text user-select-none">Scheduled</label>
                  <span className="form-control text-muted">{formatDatetime(props.data.dueAt)}</span>
                </div>
                <div className='input-group rounded-pill-group mb-3'>
                  <label className='input-group-text user-select-none'>Start</label>
                  <span className="form-control text-muted">{formatDate(props.data.startAt)}</span>
                  <label className='input-group-text user-select-none'>End</label>
                  <span className="form-control text-muted">{formatDate(props.data.endAt)}</span>
                </div>
                <div className="input-group rounded-pill-group mb-3">
                  <label className="input-group-text user-select-none">Completed</label>
                  <span className="form-control text-muted">{formatDatetime(props.data.completedAt)}</span>
                </div>
                <div className="input-group rounded-pill-group mb-3">
                  <label className="input-group-text user-select-none">Skipped</label>
                  <span className="form-control text-muted">{formatDatetime(props.data.skippedAt)}</span>
                </div>
                <div className="input-group rounded-pill-group mb-3">
                  <label className="input-group-text user-select-none">Amount</label>
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
                  <label className="input-group-text user-select-none">Scheduled</label>
                  <span className="form-control text-muted">{props.data.amount} {props.data.unitName}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={()=>{props.hideModal()}} className='btn btn-glow btn-sm btn-secondary rounded-pill px-4 py-1 fs-4 shadow'><i className='bi bi-backspace'></i></button>
              <button type="button" onClick={()=>{
                props.scheduleMethod([{id:props.data.id,amount:formValues.amount}]);
                props.hideModal();
              }} className='btn btn-glow btn-sm btn-success rounded-pill px-4 py-1 fs-4 shadow'><i className='bi bi-check'></i></button>
              <button type="button" onClick={()=>{props.showModal(ModalVisibility.Edit,props.data)}} className='btn btn-glow btn-sm btn-warning rounded-pill px-4 py-1 fs-4 shadow'><i className='bi bi-pen'></i></button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ScheduleAmountModal;