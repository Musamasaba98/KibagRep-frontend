import { createContext, useState } from "react";

export const AppContext = createContext(null);

const AppContextProvider = (props) => {
  const dummyProfiles = [
    {
      id: 1,
      name: "Dr. Sarah Mukasa",
      time: "9:00 AM - 10:00 AM",
      location: "Kampala, Uganda",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 2,
      name: "Dr. John Kintu",
      time: "10:15 AM - 11:15 AM",
      location: "Entebbe, Uganda",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 3,
      name: "Dr. Amanda Nalubega",
      time: "11:30 AM - 12:30 PM",
      location: "Jinja, Uganda",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 4,
      name: "Dr. James Kyagulanyi",
      time: "1:00 PM - 2:00 PM",
      location: "Mukono, Uganda",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 5,
      name: "Dr. Rebecca Namutebi",
      time: "2:15 PM - 3:15 PM",
      location: "Mbale, Uganda",
      image: "https://via.placeholder.com/150",
    },
  ];

  const data = {
    user: "Dr. Beninah",
    role: "Dispenser",
    dates: [
      {
        date: "31-May Friday",
        count: 55,
        profiles: [
          dummyProfiles[0],
          dummyProfiles[1],
          dummyProfiles[2],
          dummyProfiles[4],
          dummyProfiles[5],
          dummyProfiles[0],
          dummyProfiles[1],
          dummyProfiles[2],
          dummyProfiles[4],
          dummyProfiles[5],
        ],
      },
      { date: "30-May Friday", count: 5, profiles: [] },
      { date: "30-May Thursday", count: 14, profiles: [dummyProfiles[2]] },
      {
        date: "29-May Wednesday",
        count: 100,
        profiles: [dummyProfiles[3], dummyProfiles[4]],
      },
      { date: "25-December Wednesday", count: 14, profiles: [] },
      {
        date: "30-May Thursday",
        count: 14,
        profiles: [dummyProfiles[1], dummyProfiles[2]],
      },
      { date: "29-May Wednesday", count: 100, profiles: [] },
      {
        date: "31-May Friday",
        count: 55,
        profiles: [dummyProfiles[0], dummyProfiles[3]],
      },
      { date: "30-May Thursday", count: 14, profiles: [] },
      { date: "29-May Wednesday", count: 100, profiles: [dummyProfiles[4]] },
      { date: "25-December Wednesday", count: 14, profiles: [] },
      {
        date: "30-May Thursday",
        count: 14,
        profiles: [dummyProfiles[1], dummyProfiles[2]],
      },
      { date: "29-May Wednesday", count: 100, profiles: [] },
      {
        date: "31-May Friday",
        count: 55,
        profiles: [dummyProfiles[0], dummyProfiles[3]],
      },
      { date: "30-May Thursday", count: 14, profiles: [] },
      { date: "29-May Wednesday", count: 100, profiles: [dummyProfiles[4]] },
      { date: "25-December Wednesday", count: 14, profiles: [] },
      {
        date: "30-May Thursday",
        count: 14,
        profiles: [dummyProfiles[1], dummyProfiles[2]],
      },
      { date: "29-May Wednesday", count: 100, profiles: [] },
      {
        date: "31-May Friday",
        count: 55,
        profiles: [dummyProfiles[0], dummyProfiles[3]],
      },
      { date: "30-May Thursday", count: 14, profiles: [] },
      { date: "29-May Wednesday", count: 100, profiles: [dummyProfiles[4]] },
    ],
    backlogs: [
      { name: "Dr. ALEX KUMBURA", location: "KIBUYE", status: "Missed" },
      { name: "Dr. ALES", location: "KIBUYE", status: "Missed" },
      { name: "Dr Masaba Musa", location: "MASAJJA", status: "Missed" },
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

  const [showMenu, setShowMenu] = useState(false);
  const [showUnplanned, setShowUnplanned] = useState(false);
  const [showNca, setShowNca] = useState(false);

  const [showSidebar,setShowSidebar]=useState(false);

  const context_value = {
    data,
    showMenu,
    setShowMenu,
    showUnplanned,
    setShowUnplanned,
    setShowNca,
    showNca,
    setShowSidebar,
    showSidebar
  };

  return (
    <AppContext.Provider value={context_value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
