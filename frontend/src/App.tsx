// import React from 'react';
import {createBrowserRouter,RouterProvider,Navigate} from 'react-router-dom';
import Layout from 'Layout';
import Schedule from 'routes/Schedule';
import History from 'routes/History';
import Category from 'routes/Category';
import NotFound from 'routes/NotFound';
import {SearchProvider} from 'context/SearchContext';
import {SettingsProvider} from 'context/SettingsContext';
import Unit from 'routes/Unit';
import Item from 'routes/Item';
import Water from 'routes/Water';
import Timer from 'routes/Timer';

const router=createBrowserRouter([
  {
    path:'/',
    element:<Layout/>,
    errorElement:<NotFound/>,
    children:[
      {
        path:'',
        element:<Navigate to='/schedule' replace/>,
      },
      {
        path:'/schedule',
        element:<Schedule/>,
      },
      {
        path:'/history',
        element:<History/>,
      },
      {
        path:'/category',
        element:<Category/>,
      },
      {
        path:'/unit',
        element:<Unit/>,
      },
      {
        path:'/item',
        element:<Item/>,
      },
      {
        path:'/water',
        element:<Water/>,
      },
      {
        path:'/timer',
        element:<Timer/>,
      },
  ]},
])

function App() {
  return (
    <SearchProvider>
      <SettingsProvider>
        <RouterProvider router={router}/>
      </SettingsProvider>
    </SearchProvider>
  );
}

export default App;
