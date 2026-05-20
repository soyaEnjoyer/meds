import {CSSProperties,useState,useRef, useCallback, useLayoutEffect} from 'react';
import ScheduleItem from 'components/ScheduleItem';
import { ScheduleMethodData, ScheduleGroupData, ScheduleItemData } from 'routes/Schedule';

interface ScheduleGroupProps{
  data:ScheduleGroupData;
  scheduleMethod:(params:ScheduleMethodData)=>void;
  showModal:(modalType:number,item:ScheduleItemData)=>void;
  startExpanded:boolean;
  animateAccordion:boolean;
  showIds:boolean;
}

function ScheduleGroup(props:ScheduleGroupProps){
  const [isExpanded,setIsExpanded]=useState(props.startExpanded);
  const contentRef=useRef<HTMLDivElement>(null);
  const subItemRefs=useRef<(HTMLSpanElement|null)[]>([]);
  const [renderItems,setRenderItems]=useState(props.startExpanded);
  // const [height,setHeight]=useState(props.startExpanded ? 'auto' : '0px');
  const timerRef=useRef<NodeJS.Timeout>();

  // const renderItems=true;

  // useEffect(()=>{
  //   if (isExpanded && !renderItems) setRenderItems(()=>true);
  // },[isExpanded,renderItems]);

  useLayoutEffect(()=>{
    subItemRefs.current.forEach(subItemRef=>{
      if (subItemRef){
        const childWidths=Array.from(subItemRef.children).map(child=>(child as HTMLElement).scrollWidth);
        const maxWidth=childWidths.length===3 ? Math.min(childWidths[0],childWidths[2])+childWidths[1] : Math.max(...childWidths);
        subItemRef.style.maxWidth=`${maxWidth+20}px`;
      }
    });
  },[renderItems,props.data]);

  useLayoutEffect(()=>{
    if (!contentRef.current) return;
    const scrollHeight=`${contentRef.current.scrollHeight}px`;
    const finalHeight=isExpanded ? 'auto' : '0px';
    
    if (props.animateAccordion){
      if (timerRef.current) clearTimeout(timerRef.current);
      const animStartHeight=isExpanded ? '0px' : scrollHeight;
      const animEndHeight=isExpanded ? scrollHeight : '0px';
      if (contentRef.current.style.height!==animStartHeight) {
        contentRef.current.style.height=animStartHeight;
        requestAnimationFrame(()=>contentRef.current!.style.height=animEndHeight);
      } else {
        contentRef.current.style.height=animEndHeight;
      }
      if (animEndHeight!==finalHeight) timerRef.current=setTimeout(()=>contentRef.current!.style.height=finalHeight,250);
    } else {
      contentRef.current.style.height=finalHeight;
    };
    return ()=>{if (timerRef.current) clearTimeout(timerRef.current)};
  },[isExpanded,props.animateAccordion]);

  const buttonHandler=useCallback((params:ScheduleMethodData)=>{
    setIsExpanded(()=>false);
    props.scheduleMethod(params);
  },[props]);

  return (
    <div className='accordion-item border-0 rounded mb-3 shadow'>
      <h2 className='accordion-header shadow rounded border-0'>
        <div
          className={'accordion-button px-1 py-1 rounded border-0 '+(isExpanded ? '' : 'collapsed')}
          onClick={()=>{
            // if (!renderItems) setRenderItems(()=>true);
            setIsExpanded(()=>!isExpanded);
            if (!renderItems) setRenderItems(true);
          }}
          aria-expanded={isExpanded}
          style={{'--bg-hue':props.data.hue} as CSSProperties}
        >
        <div className='d-flex justify-content-between align-items-center w-100 ps-4 ms-3 border-0'>
          <span className='fs-5'>
            {props.data.categoryName}
            {props.data.items.some(item=>item.isWarning) ?
              <i className='bi text-warning bi-exclamation-circle-fill ms-2 text-shadow'></i> :
              null
            }
            {props.data.items.some(item=>item.isInfo && !item.isWarning) ?
              <i className='bi text-info bi-info-circle-fill ms-2 text-shadow'></i> :
              null
            }
          </span>
          <span className='badge fw-normal py-2 fs-7 rounded-pill shadow transition-all-2 bg-light-translucent'
            >{`${props.data.items.length} item${props.data.items.length===1 ? '' : 's'}`}
          </span>
          <span
            className={'badge fw-normal py-2 fs-7 rounded-pill shadow transition-all-2 '+
            (props.data.items.some(item=>item.dueDay===-1) ? 'bg-danger-translucent' : 'bg-light-translucent')}
            >{props.data.dueAtLabel}
          </span>
          <span
            onClick={(event)=>event.stopPropagation()}
            className={'d-flex gap-1 transition-all-2 '+(isExpanded ? '' : 'scale-0')}
            >
            <button
              type='button'
              onClick={()=>buttonHandler(props.data.items.map(item=>({id:item.id,amount:item.amount})))} 
              className='btn btn-glow btn-sm btn-success rounded-pill px-4 py-1 fw-bold fs-4 shadow'
              ><i className='bi bi-check-all'></i>
            </button>
            <button
              type='button'
              onClick={()=>buttonHandler(props.data.items.map(item=>({id:item.id,amount:null})))}
              className='btn btn-glow btn-sm btn-danger rounded-pill px-4 py-1 fw-bold fs-4 shadow'
              ><i className='bi bi-x'></i>
            </button>
          </span>
        </div>
        </div>
      </h2>
      <div
        ref={contentRef}
/*         style={{height:isExpanded ? 
          contentRef.current ? `${contentRef.current.scrollHeight}px` : 'auto' :
          // `${contentRef.current?.scrollHeight ?? 0}px` : 
          // `${props.data.items.length*50}px` :
          '0px'
        }} */
        className={'overflow-hidden '+(props.animateAccordion ? 'transition-all-2' : '')}
        >
        <div className='accordion-body d-flex flex-column gap-1 p-0 m-0 p-child-y-1 striped'>
          {
            renderItems ?
              props.data.items.map((item,ix)=>(
                <ScheduleItem
                  key={`${item.dueAtValue}.${item.id}`} 
                  data={item} 
                  apiMethod={props.scheduleMethod} 
                  showModal={props.showModal} 
                  subItemRef={(el)=>(subItemRefs.current[ix]=el)}
                  isLast={ix===props.data.items.length-1}
                  showId={props.showIds}
                />
              )) :
              null
          }
        </div>
      </div>
    </div>
  )
}
export default ScheduleGroup;
