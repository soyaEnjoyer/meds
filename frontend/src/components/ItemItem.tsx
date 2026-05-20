import { ItemItemData } from 'routes/Item';
import TextInput from 'components/TextInput';
import Select from 'components/Select';
import NumberInput from 'components/NumberInput';

interface ItemItemProps{
  data:ItemItemData;
  units:Array<{id:number;unitName:string}>;
  classNames?:string;
  showId:boolean;
  updateFunction:(data:ItemItemData)=>void;
}

function ItemItem(props:ItemItemProps){
  return (
    <div className={'d-flex justify-content-between gap-2 px-2 align-items-center '+props.classNames}>
      { props.showId ? 
        <span className='fs-7 text-muted py-2'>{props.data.id}</span> :
        null
      }
      <TextInput default={props.data.itemName} classes='form-control' changeHandler={(value:string)=>{props.updateFunction({...props.data,itemName:value})}}/>
      <Select default={props.data.unitId} classes='form-select' options={props.units.map(unit=>({value:unit.id,label:unit.unitName}))} changeHandler={(value:number)=>{props.updateFunction({...props.data,unitId:value})}}/>
      <NumberInput defaultValue={props.data.stepSize} min={0.01} max={99999} changeHandler={(value:number)=>{props.updateFunction({...props.data,stepSize:value})}}/>
      <TextInput default={props.data.tags || ''} classes='form-control' changeHandler={(value:string)=>{props.updateFunction({...props.data,tags:value})}}/>
      {/* <span className='fs-6'><i className='bi me-1 bi-plus'></i>{formatDatetime(props.data.createdAt)}</span> */}
      {/* <span className='fs-6'><i className='bi me-1 bi-pen'></i>{formatDatetime(props.data.updatedAt)}</span> */}
    </div>
  )
}

export default ItemItem;