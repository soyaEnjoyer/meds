import {useState,useEffect} from 'react';
import {useSearch} from 'context/SearchContext';
import CategoryItem from 'components/CategoryItem';
import { useSettings } from 'context/SettingsContext';

export interface CategoryItemData{
  id:number;
  categoryName:string;
  hue:number;
  createdAt:string;
  updatedAt:string;
}

function Category(){
  const [data,setData]=useState<Array<CategoryItemData>>([]);
  const {getSearch}=useSearch();
  const {getSetting}=useSettings();
  const showIds=Boolean(getSetting('showIds'));

  const filteredData=data
    .filter(item=>item.categoryName.toLowerCase().includes(getSearch))
    .sort((a,b)=>a.categoryName.localeCompare(b.categoryName));

  useEffect(()=>{
    fetch('/api/data/category')
    .then(apiResponse=>apiResponse.json())
    .then(apiData=>setData(apiData));
  },[])

  function updateItem(item:Omit<CategoryItemData,'createdAt'|'updatedAt'>){
    fetch('/api/data/category',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(item)
    })
    .then(response=>response.json())
    .then((apiItem:CategoryItemData)=>{
      const newData=[...data];
      const ix=newData.findIndex(item=>item.id===apiItem.id);
      ix===-1 ? newData.push(apiItem) : newData.splice(ix,1,apiItem);
      setData(newData);
    })
  }

  return (
    <div className='container my-2 mx-0 mx-md-auto px-0 overflow-x-hidden'>
      <h4>Categories</h4>
      <div className='d-flex flex-column gap-1 striped bg-body rounded'>
        <div className='d-flex justify-content-around gap-2 px-2 align-items-center fs-6 my-2 rounded-top'>
          <span>Name</span>
          <span>Hue</span>
        </div>
        {
          filteredData.map((item,ix)=><CategoryItem
            key={item.id}
            data={item}
            updateFunction={updateItem}
            classNames={ix===filteredData.length-1 ? 'rounded-bottom ' : ''}
            showId={showIds}
          />)
        }
      </div>
    </div>
  )
}

export default Category;