import {useState,useEffect} from 'react';
import HistoryItem from 'components/HistoryItem';
import {useSearch} from 'context/SearchContext';
import HistoryModal from 'components/HistoryModal';
import {useSettings} from 'context/SettingsContext';

export interface HistoryItemData{
  id:number;
  scheduleId:number;
  itemId:number;
  itemName:string;
  tags:string|null;
  categoryId:number;
  categoryName:string;
  unitId:number;
  stepSize:number;
  unitName:string;
  amount:number|null;
  scheduledAmount:number|null;
  statusId:number;
  statusName:string;
  scheduledAt:string;
  createdAt:string;
}

function History(){
  const [data,setData]=useState<Array<HistoryItemData>>([]);
  const [modalVisible,setModalVisible]=useState(false);
  const [modalItem,setModalItem]=useState<HistoryItemData|null>(null);
  const {getSearch}=useSearch();
  const {getSetting}=useSettings();
  const showIds=Boolean(getSetting('showIds'));

  const filteredData = data
    .filter((item) => `${item.categoryName} ${item.itemName} ${item.statusName} ${item.tags}`.toLowerCase().includes(getSearch))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id); //sort created,id desc

  // fetch the data once when the component is mounted
  //TODO: accept scheduleId in params and pass it to this api fetch in the get params
  //TODO: update api method to return from historyView filtered by scheduleId instead of historyNewestView if scheduleId is not null
  useEffect(()=>{
    fetch('/api/method/history') //returns the last history entry per scheduleId
    .then(apiResponse=>apiResponse.json())
    .then(apiData=>{
      setData(apiData);
    })
  },[])

  function apiMethod(itemId:number,edit:boolean=true,amount:number|null=null){
    // edit or delete the item
    // console.log('itemMethod',{itemId,edit,amount});
    fetch(`/api/method/history/${itemId}`,{
      method:edit ? 'POST' : 'DELETE',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        id:itemId,
        amount:amount,
      })
    })
    .then(apiResponse=>apiResponse.json())
    .then((apiData)=>{
      // delete the current item from the array
      const newData=[...data];
      const oldIndex=newData.findIndex(item=>item.id===itemId);
      if (oldIndex>-1) newData.splice(oldIndex,1);
      // then loop over the returned items (could be 0,1, or many) and push them to the array
      apiData.forEach((apiItem:HistoryItemData)=>newData.push(apiItem))
      setData(newData);
    })
  }

  function editHandler(itemId:number){
    setModalItem((data.find(item=>item.id===itemId))!);
    setModalVisible(true);
  }

  function hideModal(){
    setModalVisible(false);
    setModalItem(null);
  }

  return (
    <div className='container my-2 mx-0 mx-md-auto px-0 overflow-x-hidden'>
      { modalVisible ? <HistoryModal data={modalItem as HistoryItemData} apiMethod={apiMethod} hideModal={hideModal}/> : null }
      <h4>History</h4>
      <div className='d-flex flex-column gap-1 striped bg-body rounded'>
        {
          filteredData.map((item,ix)=><HistoryItem
            key={item.id}
            data={item}
            apiMethod={apiMethod}
            editHandler={editHandler}
            classNames={(ix===0 ? 'rounded-top ' : '')+(ix===filteredData.length-1 ? 'rounded-bottom ' : '')}
            showId={showIds}
          />)
        }
      </div>
    </div>
  );
}

export default History;