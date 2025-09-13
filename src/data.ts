import { icons } from "./assets/assets";

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


export const all_tasks = [
  {
    id: 1,
    title: "Follow up with client A",
    state: "pending",
    dueDate: "2025-09-08",
    priority: "high",
  },
  {
    id: 7,
    title: "Deliver samples to clinic",
    state: "missed",
    dueDate: "2025-09-04",
    priority: "medium",
  },
  {
    id: 8,
    title: "Submit weekly expenses",
    state: "completed",
    dueDate: "2025-09-05",
    priority: "low",
  },
  {
    id: 13,
    title: "Missed call with distributor",
    state: "missed",
    dueDate: "2025-09-03",
    priority: "high",
  }
];


export const recentActivities = [
  {
    time: "08:30 AM",
    title: "Visited Dr. John Smith",
    description: "Samples delivered for Product A",
    status: "completed", // completed, pending, missed
    type: "visit" // visit, call, follow-up
  },
  {
    time: "11:45 AM",
    title: "Follow-up with Dr. Mary Lee",
    description: "Pending prescription approvals",
    status: "missed",
    type: "follow-up"
  },
  {
    time: "01:30 PM",
    title: "Visited Pharmacy XYZ",
    description: "Delivered promotional materials",
    status: "completed",
    type: "visit"
  }
];



export const conversations = [
  {
    id: 1,
    name: "John Doe",
    lastMessage: "Hey, are we still meeting today?",
    time: "2:45 PM",
    avatar: icons.member_1,
  },
  {
    id: 2,
    name: "Jane Smith",
    lastMessage: "I’ve sent you the report.",
    time: "1:15 PM",
    avatar: icons.member_2,
  },
  {
    id: 3,
    name: "Michael Brown",
    lastMessage: "Let’s catch up tomorrow.",
    time: "12:05 PM",
    avatar: icons.member_4,
  },
  {
    id: 4,
    name: "Sarah Johnson",
    lastMessage: "Can you check the new task?",
    time: "Yesterday",
    avatar: icons.member_5,
  },
  {
    id: 5,
    name: "David Wilson",
    lastMessage: "Great job on the project! 👏",
    time: "Mon",
    avatar: icons.member_7,
  },
];


export const dummyMessages = [
  { id: 1, user: "Alice", avatar: icons.member_1, message: "Hey, how are you doing today?", timestamp: "09:00 AM", sentByMe: false },
  { id: 2, user: "You", avatar: icons.member_4, message: "I'm good, thanks! Working on my chat app.", timestamp: "09:01 AM", sentByMe: true },
  { id: 3, user: "Alice", avatar: icons.member_1, message: "Oh nice! Let me know if you need any help.", timestamp: "09:02 AM", sentByMe: false },
  { id: 4, user: "You", avatar: icons.member_4, message: "Sure! I just want to test the scroll and layout first.", timestamp: "09:03 AM", sentByMe: true },
  { id: 5, user: "Alice", avatar: icons.member_1, message: "Perfect. By the way, your chat UI is looking great so far!", timestamp: "09:04 AM", sentByMe: false },
  { id: 6, user: "You", avatar: icons.member_4, message: "Thanks! Still need to fix the bottom input though.", timestamp: "09:05 AM", sentByMe: true },
  { id: 7, user: "Alice", avatar: icons.member_1, message: "No worries, you're doing amazing.", timestamp: "09:06 AM", sentByMe: false },
  { id: 8, user: "You", avatar: icons.member_4, message: "Appreciate that! I’m learning a lot.", timestamp: "09:07 AM", sentByMe: true },
  { id: 9, user: "Alice", avatar: icons.member_1, message: "Have you thought about adding emojis?", timestamp: "09:08 AM", sentByMe: false },
  { id: 10, user: "You", avatar: icons.member_4, message: "Yes, I plan to implement them soon.", timestamp: "09:09 AM", sentByMe: true },
  { id: 11, user: "Alice", avatar: icons.member_1, message: "Cool! That will make chats more lively.", timestamp: "09:10 AM", sentByMe: false },
  { id: 12, user: "You", avatar: icons.member_4, message: "Exactly! Also thinking of typing indicators.", timestamp: "09:11 AM", sentByMe: true },
  { id: 13, user: "Alice", avatar: icons.member_1, message: "Nice! Users love that small touch.", timestamp: "09:12 AM", sentByMe: false },
  { id: 14, user: "You", avatar: icons.member_4, message: "I agree. It makes the app feel alive.", timestamp: "09:13 AM", sentByMe: true },
  { id: 15, user: "Alice", avatar: icons.member_1, message: "Are you going to add real-time notifications?", timestamp: "09:14 AM", sentByMe: false },
  { id: 16, user: "You", avatar: icons.member_4, message: "Yes, push notifications will come later.", timestamp: "09:15 AM", sentByMe: true },
  { id: 17, user: "Alice", avatar: icons.member_1, message: "Great! That will make the app more interactive.", timestamp: "09:16 AM", sentByMe: false },
  { id: 18, user: "You", avatar: icons.member_4, message: "Exactly what I’m aiming for.", timestamp: "09:17 AM", sentByMe: true },
  { id: 19, user: "Alice", avatar: icons.member_1, message: "By the way, do you plan to add media sharing?", timestamp: "09:18 AM", sentByMe: false },
  { id: 20, user: "You", avatar: icons.member_4, message: "Yes! Images and later videos.", timestamp: "09:19 AM", sentByMe: true },
  { id: 21, user: "Alice", avatar: icons.member_1, message: "Awesome, people will love that.", timestamp: "09:20 AM", sentByMe: false },
  { id: 22, user: "You", avatar: icons.member_4, message: "Thanks! I want it to feel like a real chat app.", timestamp: "09:21 AM", sentByMe: true },
  { id: 23, user: "Alice", avatar: icons.member_1, message: "You're definitely on the right track.", timestamp: "09:22 AM", sentByMe: false },
  { id: 24, user: "You", avatar: icons.member_4, message: "I hope it works well for testing.", timestamp: "09:23 AM", sentByMe: true },
  { id: 25, user: "Alice", avatar: icons.member_1, message: "It will! Keep pushing.", timestamp: "09:24 AM", sentByMe: false },
  { id: 26, user: "You", avatar: icons.member_4, message: "I will. Just adding final touches now.", timestamp: "09:25 AM", sentByMe: true },
  { id: 27, user: "Alice", avatar: icons.member_1, message: "Looking forward to seeing it live!", timestamp: "09:26 AM", sentByMe: false },
  { id: 28, user: "You", avatar: icons.member_4, message: "Me too! Almost done with this page.", timestamp: "09:27 AM", sentByMe: true },
  { id: 29, user: "Alice", avatar: icons.member_1, message: "Congrats on getting this far!", timestamp: "09:28 AM", sentByMe: false },
  { id: 30, user: "You", avatar: icons.member_4, message: "Thanks, Alice! Couldn’t have done it without your tips.", timestamp: "09:29 AM", sentByMe: true },
];


export const recent_reports = [

  {
    "reportTitle": "Product Feedback Report",
    "repName": "Michael Brown",
    "date": "2025-09-07",
    "status": "Rejected"
  },
  {
    "reportTitle": "Product Feedback Report",
    "repName": "Michael Brown",
    "date": "2025-09-07",
    "status": "Rejected"
  },
  {
    "reportTitle": "Weekly Territory Coverage",
    "repName": "Emily Davis",
    "date": "2025-09-06",
    "status": "Approved"
  },
  {
    "reportTitle": "Weekly Territory Coverage",
    "repName": "Emily Davis",
    "date": "2025-09-06",
    "status": "Approved"
  },
  {
    "reportTitle": "Hospital Engagement Report",
    "repName": "David Wilson",
    "date": "2025-09-05",
    "status": "Pending"
  }
]



export const visitsTrendData = [
  { date: "Sun", value: 12, type: "Planned Visits" },
  { date: "Mon", value: 16, type: "Completed Visits" },
  { date: "Tue", value: 10, type: "Completed Visits" },
  { date: "Wed", value: 15, type: "Planned Visits" },
  { date: "Thur", value: 14, type: "Completed Visits" },
  { date: "Fri", value: 30, type: "Planned Visits" },
  { date: "Sat", value: 8,  type: "Completed Visits" },
];