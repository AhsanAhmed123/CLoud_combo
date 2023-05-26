import { IonCol, IonImg, IonLabel, IonRow, IonSkeletonText, useIonViewWillEnter } from '@ionic/react';
import api from '../../api_instance';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import fileSVG from '../../assets/svgs/file.svg';
import zip from '../../assets/svgs/zip.svg';
import spreadsheet from '../../assets/svgs/spreadsheet.svg';
import document from '../../assets/svgs/document.svg';
import csv from '../../assets/svgs/csv.svg';
import mp3 from '../../assets/svgs/mp3.svg';
import photo from '../../assets/svgs/photo.svg';
import unknown from '../../assets/svgs/unknown.svg';
import { mimeTypes } from '../../utils/mimeTypes';
import './CloudManager.css';
import classNames from "classnames";
import { getFileExtension } from "../../utils/getFileExtension";

interface Props {
    restorePreviousView: any;
    scrollToTop: any;
}

const possibleDropboxThumbnails = ['jpg', 'jpeg', 'png'];
const skeletonsArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const FilesArea = (props: Props) => {
    const [filesToShow, setFilesToShow] = useState<any[]>([]);
    const [showSkeletons, setShowSkeletons] = useState(false);
    const dispatch = useDispatch();

    const { selectedDriveId, fileTree, foldersVisited, cloudProvider } = useSelector(
        (state: any) => state.flow
    );
    const { authedDrives } = useSelector((state: any) => state.drives);
    const { needsToFetchFiletree } = useSelector((state: any) => state.ui);

    useEffect(() => {
        props.restorePreviousView.current = restorePreviousView;
    }, [foldersVisited]);

    useIonViewWillEnter(() => {
        dispatch({ type: 'set_header_text', payload: 'Cloud Manager' });
        if (needsToFetchFiletree) {
            setFilesToShow([]);
            dispatch({ type: 'empty_folder_ids' });
            void fetchFiles();
            dispatch({ type: 'set_fetch_filetree', payload: false });
            return;
        }
    }, [needsToFetchFiletree]);

    useEffect(() => {
        if (needsToFetchFiletree) {
            return;
        }

        const fileTreeFolderIds = Object.keys(fileTree);
        if (fileTreeFolderIds.includes(selectedDriveId)) {
            setFilesToShow(fileTree[selectedDriveId]);
            setShowSkeletons(false);
            return;
        }
        void fetchFiles();
    }, [selectedDriveId]);

    const restorePreviousView = () => {
        if (foldersVisited.length === 2) {
            setFilesToShow(fileTree[selectedDriveId]);
            dispatch({ type: 'remove_folder_visited' });
            dispatch({ type: 'set_header_text', payload: 'Cloud Manager' });
            return;
        }
        const rootFiles = fileTree[selectedDriveId];
        const folder = findFolder(foldersVisited.at(-2), rootFiles);

        if (folder && folder.children) {
            setFilesToShow(folder.children);
            dispatch({ type: 'remove_folder_visited' });
            dispatch({ type: 'set_header_text', payload: folder.name });
        }
    };

    const fetchFiles = async () => {
        setFilesToShow([]);
        setShowSkeletons(true);
        const driveFiles = await api.get(`drive/files`, {
            params: {
                driveId: selectedDriveId,
                cloudProvider,
                userId: JSON.parse(localStorage.getItem('currentUser')!).id,
            },
        });

        const files = driveFiles.data.data;

        dispatch({ type: 'add_root_file', payload: {
            driveId: selectedDriveId,
            files,
        } });

        if (cloudProvider === 'dropbox' && files.length > 0) {
            void startThumbnailFetching(files.filter((file: any) => possibleDropboxThumbnails.includes(getFileExtension(file.name))));
        }

        setFilesToShow(files);
        setShowSkeletons(false);
        await optimizeFolders(files);
    };

    const startThumbnailFetching = async (files: any) => {
        if (files.length === 0) {
            return;
        }

        const batchSize = 25;
        const numBatches = Math.ceil(files.length / batchSize);

        for (let i = 0; i < numBatches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, files.length);
            const batch = files.slice(start, end);

            await fetchThumbnails(batch);
        }
    }

    const fetchThumbnails = async (files: any) => {
        const thumbnailUrls = await api.post('drive/dropbox-thumbnails', {
            files,
            driveId: authedDrives.find((drive: any) => drive.provider_user_id === selectedDriveId).provider_user_id,
            userId: JSON.parse(localStorage.getItem('currentUser')!).id,
        });

        setFilesToShow((prevFiles: any) => {
            return prevFiles.map((file: any) => {
                const actualFile = thumbnailUrls.data.data.find((thumbnail: any) => thumbnail.metadata.id === file.id);
                if (actualFile) {
                    file.thumbnailLink = actualFile.thumbnail;
                }
                return file;
            });
        });
    }

    const handleFileClick = (file: any) => {
        const { mimeType } = file;
        if (mimeType === mimeTypes.FOLDER || file[".tag"] === mimeTypes.DROPBOX_FOLDER) {
            void openFolder(file);
        }
    };

    const findFolder = (id: any, items: any): any => {
        var i = 0,
            found;

        for (; i < items.length; i++) {
            if (items[i].id === id) {
                return items[i];
            } else if (_.isArray(items[i].children)) {
                found = findFolder(id, items[i].children);
                if (found) {
                    return found;
                }
            }
        }
    };

    const openFolder = async (file: any) => {
        props.scrollToTop();
        const rootFiles = fileTree[selectedDriveId];
        const folder = findFolder(file.id, rootFiles);

        if (folder && folder.children) {
            setFilesToShow(folder.children);

            if (cloudProvider === 'dropbox' && folder.children.length > 0) {
                void startThumbnailFetching(folder.children.filter((file: any) => possibleDropboxThumbnails.includes(getFileExtension(file.name))));
            }

            dispatch({ type: 'add_folder_visited', payload: folder.id });
            dispatch({ type: 'set_header_text', payload: folder.name });
            await optimizeFolders(folder.children);
            return;
        }
        setShowSkeletons(true);
        await fetchFolder(file);
    };

    const fetchFolder = async (file: any) => {
        const folderFiles = await api.get('drive/folder/files', {
            params: {
                folderId: file.id,
                cloudProvider,
                driveId: authedDrives.find((drive: any) => drive.provider_user_id === selectedDriveId).provider_user_id,
                userId: JSON.parse(localStorage.getItem('currentUser')!).id,
            },
        });

        if (folderFiles.status === 200) {
            const { files } = folderFiles.data.data;
            dispatch({ type: 'set_header_text', payload: file.name });
            setFilesToShow(files);
            setShowSkeletons(false);
            if (files.length !== 0) {
                await optimizeFolders(folderFiles.data.data);
            }
        }
    };

    const optimizeFolders = async (files: any[]) => {
        const folders = files && files.filter((f: any) => (f.mimeType === mimeTypes.FOLDER || f[".tag"] === mimeTypes.DROPBOX_FOLDER) && !f.children);

        if (!folders || folders.length === 0) {
            return;
        }

        await Promise.allSettled(
            folders.map(async (folder: any) => {
                const folderFiles = await api.get('drive/folder/files', {
                    params: {
                        folderId: folder.id,
                        cloudProvider,
                        driveId: authedDrives.find((drive: any) => drive.provider_user_id === selectedDriveId).provider_user_id,
                        userId: JSON.parse(localStorage.getItem('currentUser')!).id,
                    },
                });

                if (folderFiles.status === 200) {
                    dispatch({
                        type: 'add_to_tree',
                        payload: { parentId: folder.id, folderFiles: folderFiles.data.data.files },
                    });
                }
            })
        );
    };

    const determineFileIcon = (file: any) => {
        let type;
        if (file.mimeType) {
            type = file.mimeType;
        } else if (file[".tag"]) {
            if (file[".tag"] === 'file' && !file.thumbnailLink) {
                const extension = getFileExtension(file.name);

                switch (extension) {
                    case 'zip':
                        type = mimeTypes.ZIP;
                        break;
                    case 'pdf':
                    case 'doc':
                    case 'docx':
                    case 'ppt':
                    case 'csv':
                        type = mimeTypes.DOCUMENT;
                        break;
                    case 'png':
                    case 'jpg':
                    case 'jpeg':
                        type = mimeTypes.PHOTO;
                        break;
                    default:
                        type = file[".tag"];
                }
            } else {
                type = file[".tag"];
            }
        }

        switch (type) {
            case mimeTypes.DROPBOX_FOLDER:
            case mimeTypes.FOLDER: {
                return <IonImg src={fileSVG} alt="folder" />;
            }
            case mimeTypes.PHOTO: {
                return <IonImg src={photo} />;
            }
            case mimeTypes.ZIP: {
                return <IonImg src={zip} />;
            }
            case mimeTypes.DOCUMENT: {
                return <IonImg src={document} />;
            }
            case mimeTypes.SPREADSHEET:
            case mimeTypes.SPREADSHEET1: {
                return <IonImg src={spreadsheet} />;
            }
            case mimeTypes.CSV: {
                return <IonImg src={csv} />;
            }
            case mimeTypes.MP3:
            case mimeTypes.MP4: {
                return <IonImg src={mp3} />;
            }
            case mimeTypes.DROPBOX_FILE: {
                return <IonImg src={
                    file.thumbnailLink
                        ? `data:image/jpeg;base64,${file.thumbnailLink}`
                        : unknown
                } alt="file" />;
            }
            default:
                return <IonImg className='file-image-preview' src={file.thumbnailLink || unknown} alt="file" />;
        }
    };

    return (
        <div className="transfer-content">
            <IonRow>
                {showSkeletons ? (
                    <>
                        {skeletonsArray.map((i: number, index: number) => (
                            <IonCol
                                size="4"
                                className="ion-text-center file-skeleton"
                                key={index}
                            >
                                <div className={classNames('de-flex-col', 'flex-center', 'file')}>
                                    <IonSkeletonText animated style={{ width: '100%' }} />
                                </div>
                                <IonSkeletonText animated style={{ width: '100%' }} />
                            </IonCol>
                        ))}
                    </>
                    ) : null}
                {filesToShow && filesToShow.length > 0 &&
                    filesToShow.map((file, index) => (
                        <IonCol
                            size="4"
                            className="ion-text-center"
                            key={index}
                            onClick={() => handleFileClick(file)}
                        >
                            <div
                                className={classNames('de-flex-col', 'flex-center', 'file', {
                                    ['file-image']: file.mimeType !== mimeTypes.FOLDER && file[".tag"] !== mimeTypes.DROPBOX_FOLDER,
                                })}
                            >
                                {determineFileIcon(file)}
                            </div>

                            <FileLabel file={file} findFolder={findFolder} />
                        </IonCol>
                    ))}
            </IonRow>
        </div>
    );
};

interface FileLabelProps {
    file: any;
    // Create a utility file in the future?
    findFolder: (id: any, items: any) => any;
}

const FileLabel = ({ file, findFolder }: FileLabelProps) => {
    const { selectedDriveId, fileTree } = useSelector((state: any) => state.flow);

    const { mimeType } = file;

    const isFolder = mimeType === mimeTypes.FOLDER || file[".tag"] === mimeTypes.DROPBOX_FOLDER;

    const rootFiles = fileTree[selectedDriveId];

    let folder;

    if (rootFiles) {
        folder = findFolder(file.id, rootFiles);
    }

    return (
        <IonCol className='file-label'>
            <IonLabel
                className={classNames('file-name', 'ion-text-center', {
                    ['file-name-folder']: isFolder,
                })}
            >
                {file.name}
            </IonLabel>
            {isFolder && folder && !folder.children && (
                <IonSkeletonText animated style={{ width: '100%' }} />
            )}
            {isFolder && folder && folder.children && (
                <IonLabel className="file-size ion-text-center">
                    {folder.children.length} file{folder.children.length === 1 ? '' : 's'}
                </IonLabel>
            )}
        </IonCol>
    );
};

export default FilesArea;
