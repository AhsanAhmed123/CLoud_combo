import { combineReducers } from "redux";
import drivesReducer from './drivesReducer';
import userReducer from './userReducer';
import flowReducer from './flowReducer';
import transferReducer from './transferReducer';
import uiReducer from './uiReducer';

const appReducer = combineReducers({
    // Add your reducers here
    user: userReducer,
    drives: drivesReducer,
    flow: flowReducer,
    transfer: transferReducer,
    ui: uiReducer,
});

export default (state: any, action: any) =>
    appReducer(action.type === 'log_user_out' ? undefined : state, action);