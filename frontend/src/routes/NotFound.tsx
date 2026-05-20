import {useEffect} from 'react';
import {Link,useNavigate} from 'react-router-dom';

function NotFound(){
  const navigate=useNavigate();
  useEffect(()=>{
    const timeout=setTimeout(()=>{navigate('/')},2000);
    return ()=>{clearTimeout(timeout)};
  })
  return (
    <div className='container d-flex flex-column align-items-center justify-content-center min-vh-100'>
      <span className='d-flex gap-2 fs-2'>
        <span className='text-warning'><i className='bi bi-emoji-dizzy'></i></span>
        <span>That page doesn't exist</span>
      </span>
      <Link to='/'>Home</Link>
    </div>
  );
}

export default NotFound;