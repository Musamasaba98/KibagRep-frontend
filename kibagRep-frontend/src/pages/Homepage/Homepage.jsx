import React from 'react';
import Navbar from '../../componets/Navbar/Navbar';
import DatePicker from '../../componets/DatePicker/DatePicker';
import Sidebar from '../../componets/Sidebar/Sidebar';
import Dashboard from '../../componets/Dashboard/Dashboard';

const Homepage = () => {
  return (
    <div>

    <Navbar/>

    <div className="flex w-full">

        <div className="w-[31%]">

        <DatePicker/>

        <Sidebar/>
        
        </div>

        <div className="w-[70%]">
        <Dashboard/>
        </div>

    </div>
      
    </div>
  )
}

export default Homepage
