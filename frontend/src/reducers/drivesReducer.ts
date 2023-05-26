const initialState = {
    authedDrives: [],
}

// Use the initialState as a default value
export default function drivesReducer(state = initialState, action: any) {
    // The reducer normally looks at the action type field to decide what happens
    switch (action.type) {
        case 'set_drives': {
            return {
                ...state,
                authedDrives: action.payload
            }
        }
        case 'reset_state': {
            return initialState
        }
        // Do something here based on the different types of actions
        default:
            // If this reducer doesn't recognize the action type, or doesn't
            // care about this specific action, return the existing state unchanged
            return state
    }
}
