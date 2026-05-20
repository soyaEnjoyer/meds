import {useState,useEffect} from 'react';
import {useSearch} from 'context/SearchContext';
import ItemItem from 'components/ItemItem';
import {useSettings} from 'context/SettingsContext';
export interface ItemItemData{
  id:number;
  itemName:string;
  unitId:number
  unitName:string; //stored elsewhere
  sumTotal:boolean;
  tags:string|null;
  stepSize:number;
  createdAt:string;
  updatedAt:string;
}

function Item(){
  const [data,setData]=useState<Array<ItemItemData>>([]);
  const [units,setUnits]=useState<Array<{id:number;unitName:string}>>([]);
  const {getSearch}=useSearch();
  const {getSetting}=useSettings();
  const showIds=Boolean(getSetting('showIds'));

  const filteredData = data
    .filter((item) => item.itemName.toLowerCase().includes(getSearch))
    .sort((a, b) => a.itemName.localeCompare(b.itemName));

  useEffect(()=>{
    fetch('/api/data/itemView')
    .then(apiResponse=>apiResponse.json())
    .then(apiData=>setData(apiData));
    fetch('/api/data/unit')
    .then(apiResponse=>apiResponse.json())
    .then(apiData=>setUnits(apiData));
  },[])

  function updateItem(item:Omit<ItemItemData,'createdAt'|'updatedAt'>){
    fetch('/api/data/item',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(item)
    })
    .then(response=>response.json())
    .then((apiItem:{id:number})=>{
      fetch(`/api/data/itemView/${apiItem.id}`)
      .then(response=>response.json())
      .then((apiItem:ItemItemData)=>{
        const newData=[...data];
        const ix=newData.findIndex(item=>item.id===apiItem.id);
        ix===-1 ? newData.push(apiItem) : newData.splice(ix,1,apiItem);
        setData(newData);
      })
    })
  }

  return (
    <div className='container my-2 mx-0 mx-md-auto px-0 overflow-x-hidden'>
      <h4>Items</h4>
      <div className='d-flex flex-column gap-1 striped bg-body rounded'>
        <div className='d-flex justify-content-around gap-2 px-2 align-items-center fs-6 my-2 rounded-top'>
          <span>Name</span>
          <span>Unit</span>
          <span>Step</span>
          <span>Tags</span>
        </div>
        {
          filteredData.map((item,ix)=><ItemItem
            key={item.id}
            data={item}
            updateFunction={updateItem}
            units={units}
            classNames={ix===filteredData.length-1 ? 'rounded-bottom' : ''}
            showId={showIds}
          />)
        }
      </div>
    </div>
  )
}

export default Item;