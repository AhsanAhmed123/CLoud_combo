import { mimeTypes } from "../utils/mimeTypes";

const initialState = {
    from: {},
    to: {},
    fromData: [],
    toData: {},
    fromState: {},
    toState: {},
};

const recursiveUpdate = (rootFiles: any, action: any) => {
    const { folderId, folderFiles } = action;

    const recur = (rootFiles: any, folderId: any, folderFiles: any) => {
        return rootFiles && rootFiles.map((file: any) =>
            file.mimeType === mimeTypes.FOLDER || file[".tag"] === mimeTypes.DROPBOX_FOLDER
                ? {
                    ...file,
                    children: file.id === folderId
                        ? folderFiles
                        : file.children
                            && recursiveUpdate(file.children, { folderId, folderFiles, })
                    ,
                }
                : file
        );
    };
    return recur(rootFiles, folderId, folderFiles);
};


// Use the initialState as a default value
export default function transferReducer(state = initialState, action: any) {
    // The reducer normally looks at the action type field to decide what happens
    switch (action.type) {
        case 'clear-reset_state': {
            return initialState;
        }
        case 'add_folder_tree': {
            return {
                ...state,
                to: {
                    ...state.to,
                    [action.payload.driveId]: action.payload.tree,
                },
            };
        }
        case 'add_root_files': {
            return {
                ...state,
                from: {
                    ...state.from,
                    [action.payload.driveId]: action.payload.files,
                }
            }
        }
        case 'add_root_folders': {
            return {
                ...state,
                to: {
                    ...state.to,
                    [action.payload.driveId]: action.payload.folders,
                }
            }
        }
        case 'add_to_origin_tree': {
            return {
                ...state,
                from: {
                    ...state.from,
                    [action.payload.driveId]: recursiveUpdate(state.from[action.payload.driveId as keyof typeof state.from], action.payload),
                }
            }
        }
        case 'add_to_destination_tree': {
            return {
                ...state,
                to: {
                    ...state.to,
                    [action.payload.driveId]: recursiveUpdate(state.to[action.payload.driveId as keyof typeof state.to], action.payload),
                }
            }
        }
        case 'add_file_tree': {
            return {
                ...state,
                from: {
                    ...state.from,
                    [action.payload.driveId]: action.payload.tree,
                },
            };
        }
        case 'add_destination_folder': {
            return {
                ...state,
                toData: { ...action.payload },
            };
        }
        case 'add_file_to_origin': {
            return {
                ...state,
                fromData: [...state.fromData, action.payload],
            };
        }
        case 'remove_file_from_origin': {
            return {
                ...state,
                fromData: state.fromData.filter(
                    (file: any) => file.fileId !== action.payload
                ),
            }
        }
        case 'empty_origin_folder': {
            return {
                ...state,
                fromData: [],
                fromState: {},
            };
        }
        case 'empty_destination_folder': {
            return {
                ...state,
                toData: {},
                toState: {},
            };
        }
        case 'update_to_state': {
            return {
                ...state,
                toState: {
                    ...state.toState,
                    [action.payload.driveId]: action.payload.open,
                },
            };
        }
        case 'update_from_state': {
            return {
                ...state,
                fromState: {
                    ...state.fromState,
                    [action.payload.driveId]: action.payload.open,
                },
            };
        }
        case 'clear_from_to_data': {
            return {
                ...state,
                fromData: [],
                toData: {},
                from: {},
            };
        }
        // Do something here based on the different types of actions
        default:
            // If this reducer doesn't recognize the action type, or doesn't
            // care about this specific action, return the existing state unchanged
            return state;
    }
}
