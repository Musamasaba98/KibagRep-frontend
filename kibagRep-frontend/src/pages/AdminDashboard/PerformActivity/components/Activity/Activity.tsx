import React from 'react'
import Tasks from './Tasks/Tasks';
import Events from './Events/Events';
import CatchingUp from './CatchingUp/CatchingUp';

const Activity = () => {
  return (
    <div className='w-full grid grid-cols-2'>
      <Tasks/>
      <CatchingUp/>
    </div>
  )
}

export default Activity;
