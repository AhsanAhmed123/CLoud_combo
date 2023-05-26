import { mimeTypes } from "../utils/mimeTypes";

const initialState = {
    selectedDriveId: {},
    headerText: "Cloud Manager",
    foldersVisited: ['root'],
    fileTree: {},
}

const recursiveUpdate = (rootFiles: any, action: any) => {
    const { parentId, folderFiles } = action;
    const recur = (rootFiles: any, parentId: any, folderFiles: any) => {
        return rootFiles && rootFiles.map((file: any) =>
            file.mimeType === mimeTypes.FOLDER || file[".tag"] === mimeTypes.DROPBOX_FOLDER
                ? {
                    ...file,
                    children: file.id === parentId
                        ? folderFiles
                        : file.children
                            && recursiveUpdate(file.children, { parentId, folderFiles, })
                    ,
                }
                : file
        );
    };
    return recur(rootFiles, parentId, folderFiles);
};

// Use the initialState as a default value
export default function flowReducer(state = initialState, action: any) {
    // The reducer normally looks at the action type field to decide what happens
    switch (action.type) {
        case 'set_active_drive': {
            return {
                ...state,
                selectedDriveId: action.payload.provider_user_id,
                cloudProvider: action.payload.cloud_provider,
            }
        }
        case 'empty_folder_ids': {
            return {
                ...state,
                foldersVisited: ['root'],
            }
        }
        case 'add_folder_visited': {
            return {
                ...state,
                foldersVisited: [...state.foldersVisited, action.payload],
            }
        }
        case 'remove_folder_visited': {
            return {
                ...state,
                foldersVisited: state.foldersVisited.filter( (_,i) =>
                    i !== state.foldersVisited.length-1
                ),
            }
        }
        case 'set_header_text': {
            return {
                ...state,
                headerText: action.payload,
            }
        }
        case 'add_root_file': {
            return {
                ...state,
                fileTree: {
                    ...state.fileTree,
                    [action.payload.driveId]: action.payload.files,
                }
            }
        }
        case 'add_to_tree': {
            return {
                ...state,
                fileTree: {
                    ...state.fileTree,
                    // [state.selectedDriveId.toString()]: recursiveUpdate(state.fileTree[state.selectedDriveId as keyof typeof state.fileTree], action.payload),
                    [state.selectedDriveId.toString()]: recursiveUpdate(state.fileTree[state.selectedDriveId as keyof typeof state.fileTree], action.payload),
                }
            }
        }
        case 'clear_manager_file_tree': {
            return {
                ...state,
                fileTree: {},
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
