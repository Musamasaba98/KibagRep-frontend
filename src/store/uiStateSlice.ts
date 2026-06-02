import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "uiState",
  initialState: {
    showMenu: false,
    showUnplanned: false,
    showNca: false,
    showSidebarPanel: true,
    showSupervisorSidebar:false
  },
  reducers: {
    toggleShowMenu: (state) => {
      state.showMenu = !state.showMenu;
    },
    toggleShowUnplanned: (state) => {
      state.showUnplanned = !state.showUnplanned;
    },
    toggleShowNca: (state) => {
      state.showNca = !state.showNca;
    },
    toggleSidebarPanel: (state) => {
      state.showSidebarPanel = !state.showSidebarPanel;
    },
    toggleSupervisorPannel:(state)=>{
       if(state.showSupervisorSidebar){
          state.showSupervisorSidebar = false
       }else{
        state.showSupervisorSidebar = true
       }
    }
  },
});

export const { toggleShowMenu,toggleSupervisorPannel ,toggleShowUnplanned, toggleShowNca, toggleSidebarPanel } =
  uiSlice.actions;

export default uiSlice;
