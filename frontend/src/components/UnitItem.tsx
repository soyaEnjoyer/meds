import { UnitItemData } from 'routes/Unit';
import TextInput from './TextInput';

interface UnitItemProps{
  data:UnitItemData;
  classNames?:string;
  showId:boolean;
  updateFunction:(data:UnitItemData)=>void;
}

function UnitItem(props:UnitItemProps){
  return (
    <div className={'d-flex justify-content-between gap-2 px-2 align-items-center '+props.classNames}>
      { props.showId ? 
        <span className='fs-7 text-muted py-2'>{props.data.id}</span> :
        null
      }
      <TextInput default={props.data.unitName} classes='form-control' changeHandler={(value:string)=>{props.updateFunction({...props.data,unitName:value})}}/>
    </div>
  )
}

export default UnitItem;