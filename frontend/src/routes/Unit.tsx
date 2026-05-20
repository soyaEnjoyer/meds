import {useState,useEffect} from 'react';
import {useSearch} from 'context/SearchContext';
import UnitItem from 'components/UnitItem';
import {useSettings} from 'context/SettingsContext';

export interface UnitItemData{
  id:number;
  unitName:string;
  createdAt:string;
  updatedAt:string;
}

function Unit(){
  const [data,setData]=useState<Array<UnitItemData>>([]);
  const {getSearch}=useSearch();
  const {getSetting}=useSettings();
  const showIds=Boolean(getSetting('showIds'));

  const filteredData = data
    .filter((item) => item.unitName.toLowerCase().includes(getSearch))
    .sort((a, b) => a.unitName.localeCompare(b.unitName));

  useEffect(()=>{
    fetch('/api/data/unit')
    .then(apiResponse=>apiResponse.json())
    .then(apiData=>setData(apiData));
  },[])

  function updateItem(item:Omit<UnitItemData,'createdAt'|'updatedAt'>){
    fetch('/api/data/unit',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(item)
    })
    .then(response=>response.json())
    .then((apiItem:UnitItemData)=>{
      const newData=[...data];
      const ix=newData.findIndex(item=>item.id===apiItem.id);
      ix===-1 ? newData.push(apiItem) : newData.splice(ix,1,apiItem);
      setData(newData);
    })
  }

  return (
    <div className='container my-2 mx-0 mx-md-auto px-0 overflow-x-hidden'>
      <h4>Units</h4>
      <div className='d-flex flex-column gap-1 striped bg-body rounded'>
        {
          filteredData.map((item,ix)=><UnitItem
            key={item.id}
            data={item}
            updateFunction={updateItem}
            classNames={(ix===0 ? 'rounded-top ' : '')+(ix===filteredData.length-1 ? 'rounded-bottom ' : '')}
            showId={showIds}
          />)
        }
      </div>
    </div>
  )
}

export default Unit;