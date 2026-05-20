import {useState,useEffect,useRef} from 'react';
import NavItemLink from 'components/NavItemLink';
import {useSearch} from 'context/SearchContext';
import Checkbox from 'components/Checkbox';
import {useSettings} from 'context/SettingsContext';

function Nav(){
  const {getSearch,setSearch}=useSearch();
  const {getSetting,setSetting}=useSettings();

  const [isExpanded,setIsExpanded]=useState(false);
  const navRef=useRef<HTMLDivElement>(null);
  const backdropRef=useRef<HTMLDivElement>(null);
  const transitionMs=200;
  const timeoutRef=useRef<NodeJS.Timeout|null>(null);

  useEffect(()=>{
    if (navRef.current && backdropRef.current){
      navRef.current.classList.add(isExpanded ? 'showing' : 'hiding');
      navRef.current.classList.remove(isExpanded ? 'hide' : 'show');
      backdropRef.current.classList.toggle('show',isExpanded);
      if (timeoutRef.current){
        clearTimeout(timeoutRef.current);
        timeoutRef.current=null;
      }
      timeoutRef.current=setTimeout(()=>{
        navRef.current?.classList.add(isExpanded ? 'show' : 'hide');
        navRef.current?.classList.remove('showing','hiding');
      backdropRef.current?.classList.toggle('d-none',!isExpanded);
      },transitionMs)
    }
  },[isExpanded])

  return (
    <nav className='navbar bg-body-tertiary sticky-top'>
      <div className='container'>
        <input type='search' className='form-control navbar-brand d-inline w-auto flex-grow-1' value={getSearch} onChange={(event)=>{setSearch(event.target.value.trim().toLowerCase())}}/>
        <button className='navbar-toggler' type='button' aria-controls='offcanvasNavbar' aria-label='Toggle navigation' onClick={()=>{setIsExpanded(!isExpanded)}}>
          <span className='navbar-toggler-icon'></span>
        </button>
        <div ref={navRef} className='offcanvas offcanvas-end' tabIndex={-1} aria-labelledby='offcanvasNavbarLabel' onClick={()=>{setIsExpanded(false)}}>
          <div className='offcanvas-header'>
            <h5 className='offcanvas-title'>Menu</h5>
          </div>
          <div className='offcanvas-body'>
            <ul className='navbar-nav justify-content-end flex-grow-1 pe-3'>
              <NavItemLink label='Schedule' target='/schedule'/>
              <NavItemLink label='Water' target='/water'/>
              <NavItemLink label='History' target='/history'/>
              <NavItemLink label='Timer' target='/timer'/>
              <NavItemLink label='Categories' target='/category'/>
              <NavItemLink label='Units' target='/unit'/>
              <NavItemLink label='Items' target='/item'/>
              <NavItemLink label='Targets' target='/target'/>
              <Checkbox
                label='Animations'
                default={Boolean(getSetting('animateAccordion'))}
                changeHandler={(value:boolean)=>{setSetting('animateAccordion',value)}}
              />
              <Checkbox
                label='Show IDs'
                default={Boolean(getSetting('showIds'))}
                changeHandler={(value:boolean)=>{setSetting('showIds',value)}}
              />
              {/* <NavItemLink label='Workout' target='/workout'/> */}
            </ul>
          </div>
        </div>
        <div ref={backdropRef} className='offcanvas-backdrop fade' onClick={()=>{setIsExpanded(false)}}></div>
      </div>
    </nav>
  )
}

export default Nav;