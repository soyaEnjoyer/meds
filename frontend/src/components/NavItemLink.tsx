import {NavLink} from 'react-router-dom';

export interface NavItemLinkProps{
  label:string;
  target:string;
}


function NavItemLink(props:NavItemLinkProps){
  return (
    <li className='nav-item'>
      <NavLink
        to={props.target}
        className={
          ({isActive})=>{
            return `nav-link ${isActive ? 'active' : ''}`;
          }
        }
      >{props.label}</NavLink>
    </li>
  )
}

export default NavItemLink;