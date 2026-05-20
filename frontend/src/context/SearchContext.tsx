import {createContext,useState,ReactNode, useContext} from 'react';

interface SearchContextInterface{
  getSearch:string;
  setSearch:(value:string)=>void;
};

const defaultContextValue:SearchContextInterface={
  getSearch:'',
  setSearch:()=>{},
};

export const SearchContext=createContext<SearchContextInterface>(defaultContextValue);
export const SearchProvider=({children}:{children:ReactNode})=>{
  const [getSearch,setSearch]=useState('');
  return (
    <SearchContext.Provider value={{getSearch,setSearch}}>
      {children}
    </SearchContext.Provider>
  )
}

export const useSearch=()=>{
  const context=useContext(SearchContext);
  return context;
}