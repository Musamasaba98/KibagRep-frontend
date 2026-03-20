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

export default data;

export const conversations = [
  {
    avatar: "https://placehold.co/40x40",
    name: "Twesigye Fahad",
    lastMessage: "Sure, I will update the report by end of day.",
    time: "10:32 AM",
  },
  {
    avatar: "https://placehold.co/40x40",
    name: "Nakato Sarah",
    lastMessage: "The sample request has been approved.",
    time: "9:15 AM",
  },
  {
    avatar: "https://placehold.co/40x40",
    name: "Ssemwanga Paul",
    lastMessage: "Can we reschedule the JFW for Thursday?",
    time: "Yesterday",
  },
  {
    avatar: "https://placehold.co/40x40",
    name: "Auma Grace",
    lastMessage: "Doctor Kato was not available today.",
    time: "Yesterday",
  },
  {
    avatar: "https://placehold.co/40x40",
    name: "Okello James",
    lastMessage: "Submitted my tour plan for approval.",
    time: "Mon",
  },
];

export const dummyMessages = [
  {
    user: "Twesigye Fahad",
    message: "Good morning! Can you confirm the call cycle for next week?",
    timestamp: "9:01 AM",
  },
  {
    user: "You",
    message: "Yes, I'll share the updated list by noon.",
    timestamp: "9:04 AM",
  },
  {
    user: "Twesigye Fahad",
    message: "Also, three doctors on my list have moved facilities.",
    timestamp: "9:06 AM",
  },
  {
    user: "You",
    message: "Okay, send me their names and I'll update the directory.",
    timestamp: "9:08 AM",
  },
  {
    user: "Twesigye Fahad",
    message: "Sure, I will update the report by end of day.",
    timestamp: "10:32 AM",
  },
];
