const initialState = {
    drivesLoading: true,
    needsToFetchFiletree: false,
}

// Use the initialState as a default value
export default function uiReducer(state = initialState, action: any) {
    // The reducer normally looks at the action type field to decide what happens
    switch (action.type) {
        case 'set_drives_loading': {
            return {
                ...state,
                drivesLoading: action.payload,
            }
        }
        case 'set_needs_auth': {
            return {
                ...state,
                needsAuth: action.payload,
            }
        }
        case 'set_fetch_filetree': {
            return {
                ...state,
                needsToFetchFiletree: action.payload,
            }
        }
        // Do something here based on the different types of actions
        default:
            // If this reducer doesn't recognize the action type, or doesn't
            // care about this specific action, return the existing state unchanged
            return state
    }
}
