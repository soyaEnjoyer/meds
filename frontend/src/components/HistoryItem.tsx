import {formatCompletedDatetime} from 'utils';
import { HistoryItemData } from 'routes/History';

interface HistoryItemProps{
  data:HistoryItemData;
  classNames?:string;
  showId:boolean;
  apiMethod:(itemId:number,edit:boolean,amount:number|null)=>void;
  editHandler:(itemId:number)=>void;
}

function HistoryItem(props:HistoryItemProps){
  const iconClassMap:{[key:number]:string}={
    0:'bi-exclamation-circle-fill text-warning',
    1:'bi-check-circle-fill text-warning',
    2:'bi-check-circle-fill text-success',
    3:'bi-star-fill text-success',
    4:'bi-stars text-success',
  }
  // silly padding is so text-shadow isn't clipped
  return (
    <div className={'d-flex justify-content-between gap-2 pe-2 align-items-center '+props.classNames}>
      { props.showId ? 
        <>
          <span className='fs-7 text-muted py-2 ms-2'>{props.data.id}</span>
          <span className='fs-7 text-muted py-2'>{props.data.scheduleId}</span>
        </> :
        null
      }
      <span className='fs-5 text-truncate py-2 ps-2 flex-grow-1'>
        <i className={`bi me-1 text-shadow ${iconClassMap[props.data.statusId]}`}></i>
        {props.data.itemName}
      </span>
      <span className='fs-6 d-flex flex-column align-items-end'>
        <span className='d-flex gap-1'><i className='bi bi-calendar-check'></i>{formatCompletedDatetime(props.data.createdAt)}</span>
        <span className='d-flex gap-1'>
          <span className='d-flex gap-1'><i className='bi bi-tag'></i>{props.data.categoryName}</span>
          { props.data.statusId===0 ? null : <span className='d-flex gap-1'><i className='bi bi-capsule'></i>{props.data.amount} {props.data.unitName}</span>}
        </span>
      </span>
      <span className='d-flex gap-1'>
        <button type='button' onClick={()=>{props.editHandler(props.data.id);}} className='btn btn-sm btn-secondary rounded-pill px-4 py-1 fw-bold fs-4 shadow'><i className='bi bi-pen'></i></button>
        {/* <button type='button' onClick={()=>{props.apiMethod(props.data.id,false,null);}} className='btn btn-sm btn-warning rounded-pill px-4 py-1 fw-bold fs-4 shadow'><i className='bi bi-x'></i></button> */}
      </span>
    </div>
  )
}

export default HistoryItem;