import {formatDatetime} from 'utils';
import {HistoryItemData} from 'routes/History';
import {useState} from 'react';
import Backdrop from 'components/Backdrop';
import NumberInput from 'components/NumberInput';

interface HistoryModalProps{
  data:HistoryItemData;
  apiMethod:(itemId:number,edit:boolean,amount:number|null)=>void;
  hideModal:()=>void;
}

function HistoryModal(props:HistoryModalProps){
  const [amount,setAmount]=useState(props.data.amount);

  return (
    <>
      <Backdrop visible={true} clickHandler={props.hideModal}/>
      <div className="modal fade show d-block" aria-hidden="false">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5">{props.data.itemName} ({props.data.statusName})</h1>
              <button type="button" onClick={()=>{props.hideModal()}} className="btn-close" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="row row-cols-1">
                <div className="input-group rounded-pill-group mb-3">
                  <label className="input-group-text fw-bold user-select-none">Category</label>
                  <span className="form-control text-muted">{props.data.categoryName}</span>
                </div>
                <div className="input-group rounded-pill-group mb-3">
                  <label className="input-group-text fw-bold user-select-none">Created</label>
                  <span className="form-control text-muted">{formatDatetime(props.data.createdAt)}</span>
                </div>
                <div className="input-group rounded-pill-group mb-3">
                  <label className="input-group-text fw-bold user-select-none">Scheduled</label>
                  <span className="form-control text-muted">{formatDatetime(props.data.scheduledAt)}</span>
                </div>
                <div className="input-group rounded-pill-group mb-3">
                  <label className="input-group-text fw-bold user-select-none">Scheduled Amount</label>
                  <span className="form-control text-muted">{props.data.scheduledAmount} {props.data.unitName}</span>
                </div>
                <div className="input-group rounded-pill-group mb-3">
                  <label className="input-group-text fw-bold user-select-none">Amount</label>
                  {/* <input type="number" className="form-control" value={Number(amount)} onChange={(event)=>{amountChangeHandler(event.target.value)}}/> */}
                  <NumberInput
                    defaultValue={amount || undefined}
                    min={0}
                    max={(props.data.scheduledAmount||props.data.stepSize)*10}
                    step={props.data.stepSize}
                    changeHandler={(value:number)=>{setAmount(value || null)}}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={()=>{props.hideModal()}} className='btn btn-glow btn-sm btn-secondary rounded-pill px-4 py-1 fw-bold fs-4 shadow'><i className='bi bi-backspace'></i></button>
              <button type="button" onClick={()=>{props.apiMethod(props.data.id,true,amount);props.hideModal()}} className='btn btn-glow btn-sm btn-warning rounded-pill px-4 py-1 fw-bold fs-4 shadow'><i className='bi bi-pen'></i></button>
              <button type="button" onClick={()=>{props.apiMethod(props.data.id,false,null);props.hideModal()}} className='btn btn-glow btn-sm btn-danger rounded-pill px-4 py-1 fw-bold fs-4 shadow'><i className='bi bi-x'></i></button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default HistoryModal;