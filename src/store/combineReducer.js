import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import commonReducer from "./common/commonSlice";

const rootReducer = combineReducers({
  authReducer,
  commonReducer,
});

export default rootReducer;
