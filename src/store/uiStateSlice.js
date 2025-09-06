import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "uiState",
  initialState: {
    showMenu: false,
    showUnplanned: false,
    showNca: false,
  },
  reducers: {
    toggleShowMenu: (state) => {
      console.log(state.showMenu);
      state.showMenu = !state.showMenu;
    },
    toggleShowUnplanned: (state) => {
      state.showUnplanned = !state.showUnplanned;
    },
    toggleShowNca: (state) => {
      state.showNca = !state.showNca;
    },
  },
});

export const { toggleShowMenu, toggleShowUnplanned, toggleShowNca } =
  uiSlice.actions;

export default uiSlice;
