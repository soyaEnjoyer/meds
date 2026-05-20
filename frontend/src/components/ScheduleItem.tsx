import { ScheduleItemData,ScheduleMethodData } from 'routes/Schedule';

interface ScheduleItemProps{
  data:ScheduleItemData;
  apiMethod:(params:ScheduleMethodData)=>void;
  showModal:(modalType:number,item:ScheduleItemData)=>void;
  subItemRef:React.Ref<HTMLSpanElement>;
  isLast:boolean;
  showId:boolean;
}

function ScheduleItem(props:ScheduleItemProps){
  return (
    <div
      className={
        'd-flex align-items-center w-100 justify-content-between gap-3 pe-1 ps-2 ' + (props.isLast ? 'rounded-bottom' : '')
      }
    >
      {props.showId ? <span className='fs-7 text-muted py-2'>{props.data.id}</span> : null}
      <span
        className='fs-5 text-truncate py-2 flex-shrink-1 flex-grow-3 flex-basis-2'
        onClick={() => {
          props.showModal(1, props.data);
        }}
      >
        {props.data.isWarning || props.data.isInfo ? (
          <i
            className={
              'bi me-2 text-shadow text-' +
              (props.data.isWarning ? 'warning bi-exclamation-circle-fill' : 'info bi-info-circle-fill')
            }
          ></i>
        ) : null}
        {props.data.itemName}
      </span>
      <span
        ref={props.subItemRef}
        className='fs-7 d-flex flex-wrap text-nowrap align-items-end justify-content-end gap-1 flex-shrink-1 flex-grow-1 flex-basis-4 fit-rows-2'
      >
        <span>
          <i className='bi me-1 bi-calendar-check'></i>
          {props.data.formattedCompletedAt}
        </span>
        <span>
          <i className='bi me-1 bi-arrow-repeat'></i>
          {props.data.formattedRepeatRules}
        </span>
        {props.data.amount !== 1 || (props.data.lastAmount && props.data.amount !== props.data.lastAmount) ? (
          <span>
            <i className='bi me-1 bi-capsule'></i>
            {props.data.amount}{' '}
            {props.data.lastAmount && props.data.lastAmount !== props.data.amount ? `(${props.data.lastAmount}) ` : ''}
            {props.data.unitName}
          </span>
        ) : null}
      </span>
      <span className='d-flex gap-1'>
        <button
          type='button'
          onClick={() => props.apiMethod([{ id: props.data.id, amount: props.data.amount }])}
          className='btn btn-glow btn-sm btn-success rounded-pill px-4 py-1 fw-bold fs-4 shadow'
        >
          <i className='bi bi-check'></i>
        </button>
        <button
          type='button'
          onClick={() => props.apiMethod([{ id: props.data.id, amount: null }])}
          className='btn btn-glow btn-sm btn-warning rounded-pill px-4 py-1 fw-bold fs-4 shadow'
        >
          <i className='bi bi-x'></i>
        </button>
      </span>
    </div>
  );
}

export default ScheduleItem;