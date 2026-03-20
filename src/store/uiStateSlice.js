import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "uiState",
  initialState: {
    showMenu: false,
    showUnplanned: false,
    showNca: false,
    showSidebarPanel: true,
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
  },
});

export const { toggleShowMenu, toggleShowUnplanned, toggleShowNca, toggleSidebarPanel } =
  uiSlice.actions;

export default uiSlice;
