import { createContext, useState } from "react";


export const AppContext=createContext(null);


const AppContextProvider=(props)=>{


    const data = {
        user: "Dr. Beninah",
        role: "Dispenser",
        dates: [
          { date: "31-May Friday", count: 55 },
          { date: "30-May Friday", count: 5 },
          { date: "30-May Thursday", count: 14 },
          { date: "29-May Wednesday", count: 100 },
          { date: "31-May Friday", count: 55 },
          { date: "30-May Thursday", count: 14 },
          { date: "29-May Wednesday", count: 100 },
          { date: "31-May Friday", count: 55 },
          { date: "30-May Thursday", count: 14 },
          { date: "29-May Wednesday", count: 100 },
          { date: "31-May Friday", count: 55 },
          { date: "30-May Thursday", count: 14 },
          { date: "29-May Wednesday", count: 100 },
          { date: "31-May Friday", count: 55 },
          { date: "30-May Thursday", count: 14 },
          { date: "29-May Wednesday", count: 100 },
          { date: "31-May Friday", count: 55 },
          { date: "30-May Thursday", count: 14 },
          { date: "29-May Wednesday", count: 100 },
          { date: "31-May Friday", count: 55 },
          { date: "30-May Thursday", count: 14 },
          { date: "29-May Wednesday", count: 100 },
          { date: "31-May Friday", count: 55 },
          { date: "30-May Thursday", count: 14 },
          { date: "29-May Wednesday", count: 100 },
          // Add more dates as required
        ],
        backlogs: [
          { name: "Dr. ALEX KUMBURA", location: "KIBUYE", status: "Missed" },
          { name: "Dr. ALES", location: "KIBUYE", status: "Missed" },
          { name: 'Dr Masaba Musa', location:'MASAJJA',status:'Missed'}
          // Add more backlogs as required
        ],
        summary: {
          missed: 22,
          draft: 0,
          rescheduled: 9,
          skipped: 0,
          submitted: 1285,
        },
      };

      const [showMenu,setShowMenu]=useState(false);
      const [showUnplanned,setShowUnplanned]=useState(false);
      const [showNca,setShowNca]=useState(false)


    const context_value={
    data,
    showMenu,
    setShowMenu,
    showUnplanned,
    setShowUnplanned,
    setShowNca,
    showNca
    }

    return(
        <AppContext.Provider value={context_value}>
            {props.children}
        </AppContext.Provider>
    )
}


export default AppContextProvider;