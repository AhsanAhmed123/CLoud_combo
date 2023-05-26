const initialState = {
    userData: {},
}

// Use the initialState as a default value
export default function userReducer(state = initialState, action: any) {
    // The reducer normally looks at the action type field to decide what happens
    switch (action.type) {
        case 'log_user_in': {
            return {
                ...state,
                userData: {
                    ...state.userData,
                    id: action.payload.id,
                    email: action.payload.email,
                    isLtdUser: action.payload.isLtdUser,
                }
            }
        }
        case 'update_ltd': {
            return {
                ...state,
                userData: {
                    ...state.userData,
                    isLtdUser: action.payload.isLtdUser,
                }
            }
        }
        // Do something here based on the different types of actions
        default:
            // If this reducer doesn't recognize the action type, or doesn't
            // care about this specific action, return the existing state unchanged
            return state
    }
}
