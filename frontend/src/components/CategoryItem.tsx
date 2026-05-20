import { CategoryItemData } from 'routes/Category';
import HuePicker from './HuePicker';
import TextInput from './TextInput';

interface CategoryItemProps{
  data:CategoryItemData;
  classNames?:string;
  showId:boolean;
  updateFunction:(data:CategoryItemData)=>void;
}

function CategoryItem(props:CategoryItemProps){
  return (
    <div className={'d-flex justify-content-between gap-2 px-2 align-items-center '+props.classNames}>
      { props.showId ? 
        <span className='fs-7 text-muted py-2'>{props.data.id}</span> :
        null
      }
      <TextInput default={props.data.categoryName} classes='form-control w-30' changeHandler={(value:string)=>{props.updateFunction({...props.data,categoryName:value})}}/>
      <HuePicker default={props.data.hue} classes='fs-6 py-2 w-60 h-100 form-range flex-fill rounded-1' changeHandler={(value:number)=>{props.updateFunction({...props.data,hue:value})}}/>
    </div>
  )
}

export default CategoryItem;