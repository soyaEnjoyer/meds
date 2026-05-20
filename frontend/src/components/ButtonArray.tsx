interface ButtonArrayProps{
  items:string[];
  label:string;
  value:number;
  colour?:'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'danger' | 'light' | 'dark';
  classNames?:string;
  changeHandler:(value:number)=>void;
};

function ButtonArray({
  items,
  label,
  value,
  colour='primary',
  classNames='',
  changeHandler,
}:ButtonArrayProps){
  const valueMax=(1<<items.length)-1;

  // const valueToBits=(val:number)=>{
  //   return val.toString(2).split('').reverse().join();
  // }

  // console.debug('component render',value,valueToBits(value));

  const toggleOne=(ix:number)=>{
    const newValue=value^(1<<ix);
    // console.debug('component toggleOne',newValue,valueToBits(newValue));
    changeHandler(newValue); //toggle ix
  };
  
  const toggleAll=()=>{
    const newValue=value===valueMax ? 0 : valueMax;
    // console.debug('component toggleAll',newValue,valueToBits(newValue));
    changeHandler(newValue); //toggle all
  };

  return (
    <div className={`input-group mb-3 w-100 justify-content-between d-flex ${classNames}`}>
      <label
        className='input-group-text user-select-none'
        onClick={()=>{toggleAll()}}
      >{label}</label>
      {items.map((item,ix)=>(
          <button
            key={ix}
            type='button'
            // value={value & (1<<ix) ? ix : 0}
            className={`btn mx-0 px-0 flex-fill
              btn-outline-${colour}
              ${ix===0 ? '' : 'border-start-0'}
              ${value & (1<<ix) ? 'active' : ''}
            `}
            onClick={()=>toggleOne(ix)}
          >{item}</button>
        )
      )}
    </div>
  )
}

export default ButtonArray