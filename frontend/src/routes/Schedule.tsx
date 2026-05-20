import {useState,useEffect, useCallback} from 'react';
import ScheduleGroup from 'components/ScheduleGroup';
import {useSearch} from 'context/SearchContext';
import {formatDueDatetime,formatRepeatRules, formatCompletedDatetime} from 'utils';
import ScheduleAmountModal from 'components/ScheduleAmountModal';
import ScheduleEditModal from 'components/ScheduleEditModal';
import {useSettings} from 'context/SettingsContext';

interface RawData {
  id:number;
  itemId:number;
  itemName:string;
  unitId:number;
  unitName:string;
  categoryId:number;
  categoryName:string;
  hue:number;
  hour:number;
  minute:number;
  amount:number;
  repeatCount:number;
  restDays:number;
  cycleOnDays:number;
  cycleOffDays:number;
  cycleTotalDays:number;
  startAt:string;
  endAt:string;
  cycleDayNum:number;
  dayMask:number;
  monthMask:number;
  enabled:boolean;
  sort:number;
  tags:string|null;
  stepSize:number;
  dueAt:string|null;
  completedAt:string|null;
  skippedAt:string|null;
  lastAmount:number|null;
  // isOverdue:boolean;
  isWarning:boolean;
  isInfo:boolean;
  statusId:number;
  statusName:string;
  migratedId:number;
  createdAt:string;
  updatedAt:string;
};

export interface ScheduleItemData extends RawData{
  dueAtLabel:string,
  dueAtValue:number,
  dueDay:number,
  formattedCompletedAt:string,
  formattedRepeatRules:string,
};

export interface ScheduleGroupData{
  dueAtLabel:string,
  minDueAtValue:number,
  dueDay:number,
  categoryId:number;
  categoryName:string;
  hue:number;
  items:Array<ScheduleItemData>;
};

export interface ScheduleMethodData extends Array<{
  id:number,
  amount:number|null
}>{};

export interface ScheduleEditData{
  id?:number;
  itemId:number;
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
  dueAt:string;
};

export enum ModalVisibility {
  Hidden=0,
  Amount=1,
  Edit=2,
};

function Schedule(){
  const [rawData,setRawData]=useState<RawData[]>([]);
  const [processedData,setProcessedData]=useState<ScheduleGroupData[]>([]);
  const [modalVisible,setModalVisible]=useState<ModalVisibility>(ModalVisibility.Hidden);
  const [modalItem,setModalItem]=useState<ScheduleItemData|undefined>(undefined);
  const [needRefresh,setNeedRefresh]=useState(true);
  const {getSearch}=useSearch();
  const {getSetting}=useSettings();

  // const animateAccordion=!(navigator.userAgent.includes('Chrome') && navigator.userAgent.includes('Mobile'));
  const animateAccordion=Boolean(getSetting('animateAccordion'));
  const showIds=Boolean(getSetting('showIds'));

  const fetchData=useCallback(()=>{
    console.log('fetchData',new Date());
    fetch('/api/data/scheduleView')
    .then(apiResponse=>apiResponse.json())
    .then((apiData)=>setRawData(apiData))
    .then(()=>setNeedRefresh(false));
  },[]);

  useEffect(()=>{
    if (needRefresh) fetchData();
    const timeout=setTimeout(()=>setNeedRefresh(true),3605_000-(Date.now()%3600_000));
    return ()=>clearTimeout(timeout);
  },[fetchData,needRefresh]);

  // process raw data into schedule groups
  useEffect(()=>{
    console.debug('process raw data useeffect');
    if (rawData.length===0 && processedData.length===0) return; //don't do anything on initial renders until we actually have some raw data to process
    const dayStart=new Date();
    dayStart.setHours(0,0,0,0);
    const dayStartValue=dayStart.getTime();
    // const dayEndValue=dayStartValue+86400_000;
    const dayEndValue=Date.now()+(3600_000*5); //collapse groups due more than 5 hours from now
    const baseData=rawData.map(item=>({
      ...item,
      dueAtLabel:formatDueDatetime(item.dueAt)[1],
      dueAtValue:item.dueAt ? new Date(item.dueAt).getTime() : Infinity,
      formattedCompletedAt:formatCompletedDatetime(item.completedAt),
      formattedRepeatRules:formatRepeatRules(item.enabled,item.restDays,item.cycleOnDays,item.cycleOffDays,item.cycleDayNum,item.dayMask,item.monthMask),
    }))
    .map(item=>({
      ...item,
      dueDay:item.dueAtValue<dayStartValue ? -1 : item.dueAtValue<dayEndValue ? 0 : 1,
    }))
    .sort((a,b)=>(a.dueAt ?? 'ZZZ').localeCompare(b.dueAt ?? 'ZZZ') || a.categoryName.localeCompare(b.categoryName) || a.sort-b.sort || a.itemName.localeCompare(b.itemName));
    const itemGroups=Array.from(
      new Map(
        baseData.map(item=>([
          [item.dueAtLabel,item.categoryId].join('.'),
          {
            categoryId:item.categoryId,
            categoryName:item.categoryName,
            dueAtLabel:item.dueAtLabel,
            hue:item.hue,
          }
        ]))
      )
      .values()
    )
    .map(itemGroup=>({
      ...itemGroup,
      items:baseData.filter(({dueAtLabel,categoryId})=>dueAtLabel===itemGroup.dueAtLabel && categoryId===itemGroup.categoryId),
    }))
    .map(itemGroup=>({
      ...itemGroup,
      //preserve the previous minDueAtValue so groups don't jump around in the dom after their scheduleItems with minDueAt are removed
      minDueAtValue:processedData.find(oldGroup=>oldGroup.categoryId===itemGroup.categoryId && oldGroup.dueAtLabel===itemGroup.dueAtLabel)?.minDueAtValue ?? Math.min(...itemGroup.items.map(item=>item.dueAtValue),Infinity),
      dueDay:Math.min(...itemGroup.items.map(item=>item.dueDay),1),
    }))
    .sort((a,b)=>a.minDueAtValue-b.minDueAtValue || a.categoryName.localeCompare(b.categoryName))
    setProcessedData(itemGroups);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[rawData])

  const scheduleMethod=useCallback((params:ScheduleMethodData)=>{
    console.log('scheduleMethod',params);
    fetch('/api/method/schedule',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(params),
    })
    .then(apiResponse=>apiResponse.json())
    .then((apiData:Array<RawData>)=>{
      const rawDataCopy=[...rawData];
      apiData.forEach(apiItem=>{
        const rawDataIndex=rawDataCopy.findIndex(item=>item.id===apiItem.id);
        console.log('rawDataIndex',rawDataIndex);
        if (rawDataIndex===-1){
          rawDataCopy.push(apiItem);
        } else {
          rawDataCopy.splice(rawDataIndex,1,apiItem);
        }
      })
      setRawData(rawDataCopy);
    });
  },[rawData]);

  const scheduleEdit=useCallback((params:ScheduleEditData)=>{
    console.log('scheduleEdit',params);
    fetch('/api/data/schedule',{
      method:params.id ? 'PATCH' : 'POST', //patch for edit, post for create
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ //i love typescript this is great
        id:params.id,
        itemId:params.itemId,
        categoryId:params.categoryId,
        hour:params.hour,
        minute:params.minute,
        amount:params.amount,
        repeatCount:params.repeatCount,
        restDays:params.restDays,
        cycleOnDays:params.cycleOnDays,
        cycleOffDays:params.cycleOffDays,
        startAt:params.startAt,
        endAt:params.endAt,
        dayMask:params.dayMask,
        monthMask:params.monthMask,
        enabled:params.enabled,
        sort:params.sort,
        dueAt:params.dueAt,
      }),
    })
    .then(apiResponse=>apiResponse.json())
    .then((apiItem:{id:number})=>{ //returns the edited/created item from schedule table
      fetch(`/api/data/scheduleView/${apiItem.id}`) //but we need the extra fields from scheduleView
      .then(viewResponse=>viewResponse.json())
      .then((viewItem:RawData)=>{ //returns the single item from scheduleView
        const rawDataCopy=[...rawData];
        const ix=rawDataCopy.findIndex(item=>item.id===viewItem.id);
        ix===-1 ? rawDataCopy.push(viewItem) : rawDataCopy.splice(ix,1,viewItem);
        setRawData(rawDataCopy);
      })
    });
  },[rawData]);

  const scheduleDelete=useCallback((itemId:number)=>{
    console.log('scheduleDelete',itemId);
    fetch(`/api/data/schedule/${itemId}`,{
      method:'DELETE',
      headers:{'Content-Type':'application/json'},
    })
    .then(()=>{
      const rawDataCopy=[...rawData];
      const rawDataIndex=rawDataCopy.findIndex(item=>item.id===itemId);
      if (rawDataIndex>-1){
        rawDataCopy.splice(rawDataIndex,1);
        setRawData(rawDataCopy);
      }
    });
  },[rawData]);

  const showModal=useCallback((modalType:ModalVisibility,item:ScheduleItemData)=>{
    setModalItem(item);
    setModalVisible(modalType);
  },[]);

  const hideModal=useCallback(()=>{
    setModalVisible(ModalVisibility.Hidden);
    setModalItem(undefined);
  },[]);
  function renderModal(){
    switch(modalVisible){
      case ModalVisibility.Amount: return <ScheduleAmountModal data={modalItem as ScheduleItemData} scheduleMethod={scheduleMethod} hideModal={hideModal} showModal={showModal}/>;
      case ModalVisibility.Edit: return <ScheduleEditModal data={modalItem as ScheduleItemData} scheduleEdit={scheduleEdit} scheduleDelete={scheduleDelete} hideModal={hideModal}/>;
      default: return null;
    }
  }

  return (
    <div className='container my-2 mx-0 mx-md-auto px-0 overflow-x-hidden'>
      { renderModal() }
      <div className='accordion'>
        {
          processedData.map(itemGroup=>{
            return getSearch && itemGroup.categoryName.toLowerCase().includes(getSearch) ?
              itemGroup :
              {
                ...itemGroup,
                items:getSearch ? itemGroup.items.filter(item=>`${item.itemName} ${item.statusName} ${item.isWarning ? 'overdue' : ''} ${item.tags ?? ''}`.toLowerCase().includes(getSearch)) : itemGroup.items,
              }
          })
          .filter(itemGroup=>itemGroup.items.length>0)
          .map(scheduleGroup=><ScheduleGroup
            key={`${scheduleGroup.minDueAtValue}.${scheduleGroup.categoryId}`}
            data={scheduleGroup}
            scheduleMethod={scheduleMethod}
            showModal={showModal}
            startExpanded={Boolean(getSearch) || scheduleGroup.dueDay<=0}
            animateAccordion={animateAccordion}
            showIds={showIds}
          />)
        }
      </div>
    </div>
  );
}
export default Schedule;