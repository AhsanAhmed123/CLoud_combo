import {
    IonAccordion,
    IonAccordionGroup,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonIcon, IonImg,
    IonItem,
    IonLabel,
    IonModal, IonSpinner,
    IonTitle,
    IonToolbar,
} from '@ionic/react';
import { chevronDownOutline } from 'ionicons/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import cloudUpload from '../../assets/svgs/cloud_upload.svg';
import { formatBytes } from '../../utils/humanizeSize';
import { isEmpty, isArray } from "lodash";
import { mimeTypes } from '../../utils/mimeTypes';
import styles from './NewTransfer.module.css';
import folderIcon from '../../assets/svgs/file.svg';
import googleDrive from '../../assets/svgs/drive.svg';
import dropbox from '../../assets/svgs/dropbox.svg';
import classNames from "classnames";
import api from "../../api_instance";
import { Capacitor } from "@capacitor/core";

const Origin: React.FC = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const { authedDrives } = useSelector((state: any) => state.drives);
    const { from, fromData } = useSelector((state: any) => state.transfer);

    const [presentingElement, setPresentingElement] = useState<HTMLElement | null>(null);
    const modal = useRef<HTMLIonModalElement>(null);
    const page = useRef(null);
    const actualDriveId = useRef<any>();

    useEffect(() => {
        setPresentingElement(page.current);
    }, []);

    function dismiss() {
        modal.current?.dismiss();
    }

    const onCheckboxChange = (e: any, fileInfo: any) => {
        const { driveId, fileId, fileName, size } = fileInfo;
        e.stopPropagation();

        if (e.detail.checked) {
            dispatch({
                type: 'add_file_to_origin',
                payload: {
                    fileId,
                    fileName,
                    size,
                    driveId,
                    driveName: authedDrives.find((drive: any) => drive.provider_user_id === driveId).provider_email,
                },
            });
        } else {
            dispatch({
                type: 'remove_file_from_origin',
                payload: fileId,
            });
        }
    };

    const handleAccordionToggle = (e: any) => {
        e.stopPropagation();
        const { detail: { value } } = e;

        if (isEmpty(value)) {
            return;
        }

        const { driveId, folderId } = JSON.parse(value);
        const children = findChildren(folderId, from[driveId]);

        if (children === false || children === undefined) {
            setLoading(true);
            void fetchFolderFiles(driveId, folderId, driveId.includes('dbid') ? 'dropbox' : 'google');
            return;
        }
    }

    const fetchFolderFiles = async (driveId: string, folderId: string, cloudProvider: string) => {
        const folderFiles = await api.get('drive/folder/files', {
            params: {
                folderId,
                cloudProvider,
                driveId,
                userId: JSON.parse(localStorage.getItem('currentUser')!).id,
            },
        });

        if (folderFiles.status === 200) {
            setLoading(false);
            dispatch({ type: 'add_to_origin_tree', payload: {
                driveId,
                folderId,
                folderFiles: folderFiles.data.data.files,
            }});
        }
    }

    const findChildren = (folderId: string, fileTree: any) => {
        let children: any;

        for (let i = 0; i < fileTree.length; i++) {
            const item = fileTree[i];
            if (item.id === folderId) {
                if ('children' in item && isArray(item.children) && item.children !== undefined) {
                    children = item.children;
                    break;
                } else {
                    children = false;
                    break;
                }
            }
            else if (item.children) {
                children = findChildren(folderId, item.children);
                if (children) {
                    break;
                }
            }
        }

        return children;
    }

    const handleRootAccordionToggle = (e: any) => {
        const { detail: { value } } = e;

        if (isEmpty(value)) {
            return;
        }

        const driveId = value[0];

        if (!from[driveId]) {
            setLoading(true);
            void fetchDriveFiles(driveId, driveId.includes('dbid') ? 'dropbox' : 'google');
            return;
        }

        renderDriveChildren(driveId);
    }

    const renderDriveChildren = (driveId: string) => {
        if (!from[driveId]) return;

        const files = from[driveId];
        actualDriveId.current = driveId;
        return renderFolders(files);
    };

    const fetchDriveFiles = async (driveId: string, cloudProvider: string) => {
        const driveFiles = await api.get(`drive/files`, {
            params: {
                driveId: driveId,
                cloudProvider,
                userId: JSON.parse(localStorage.getItem('currentUser')!).id,
            },
        });

        if (driveFiles.status === 200) {
            setLoading(false);
            dispatch({
                type: 'add_root_files',
                payload: {
                    driveId,
                    files: driveFiles.data.data
                }
            });
        }
    }

    const renderFolders = useCallback(
        (files: any, driveId: string = actualDriveId.current) => {
            return (
                files &&
                files.map((file: any, index: number) => {
                    const isCheckboxChecked = fromData.some((fromDataFile: any) => fromDataFile.fileId === file.id && fromDataFile.driveId === driveId);
                    const fileInfo = {
                        driveId,
                        fileId: file.id,
                        fileName: file.name,
                        size: file.size,
                    }
                    return file.mimeType === mimeTypes.FOLDER || file[".tag"] === mimeTypes.DROPBOX_FOLDER ? (
                        <IonAccordionGroup
                            multiple={true}
                            key={index}
                            mode="ios"
                            onIonChange={(e) => handleAccordionToggle(e)}
                        >
                            <IonAccordion key={index} value={JSON.stringify({
                                driveId,
                                folderId: file.id,
                            })} toggleIconSlot='start' mode="ios">
                                <IonItem slot="header" lines='none' className={styles.innerAccordionHeader} mode="ios">
                                    <IonImg src={folderIcon} className={styles.folderIcon} />
                                    <IonLabel mode="ios">{file.name}</IonLabel>
                                </IonItem>
                                <div className="ion-padding" slot="content">
                                    {file.children && file.children.length > 0 && renderFolders(file.children)}
                                </div>
                            </IonAccordion>
                        </IonAccordionGroup>
                    ) : (
                        <IonItem slot="header" key={index} lines='none' mode="ios">
                            <IonCheckbox
                                className={styles.checkbox}
                                slot="start"
                                mode="ios"
                                onClick={(e) => e.stopPropagation()}
                                checked={isCheckboxChecked}
                                onIonChange={(e) => {
                                    if (e.detail.checked === undefined) return;
                                    onCheckboxChange(e, fileInfo)
                                }}
                            ></IonCheckbox>
                            <IonLabel mode="ios">{file.name}</IonLabel>
                        </IonItem>
                    );
                })
            );
        },
        [from, fromData]
    );

    return (
        <>
            <IonCard className={styles.card}>
                <IonCardHeader className={styles.cardHeader}>
                    <IonCardTitle className={styles.cardTitle}>Transform from</IonCardTitle>
                    <IonCardSubtitle className={styles.cardSubTitle}>Select your origin files</IonCardSubtitle>
                </IonCardHeader>

                <IonCardContent className={styles.cardContent} id="open-origin-modal">
                    {fromData.length > 0 ? (
                        <div className={styles.selectedFiles}>
                            {fromData.length > 0 &&
                                fromData.map((data: any, index: number) => (
                                    <div
                                        onClick={(e) => e.preventDefault()}
                                        key={index}
                                        className={styles.selectedFile}
                                    >
                                        <p className={styles.selectedFileTitle}>
                                            {index + 1}. {data.fileName}
                                        </p>
                                        <p className={styles.selectedFileMetaData}>
                                            1 file, {formatBytes(data.size ? data.size : 0, 2)}
                                        </p>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <>
                            <IonIcon ios={cloudUpload} />
                            <IonCardSubtitle className={styles.cardSubTitle}>
                                Tap here to choose your files
                            </IonCardSubtitle>
                        </>
                    )}
                </IonCardContent>
            </IonCard>

            <IonModal ref={modal} trigger="open-origin-modal" presentingElement={presentingElement!} className={classNames({
                [styles.androidPadding]: Capacitor.getPlatform() === 'android',
            })}>
                <IonHeader className={styles.modalHeader}>
                    <IonToolbar className={styles.modalToolbar} mode="ios">
                        <IonTitle slot="start">
                            Please Select
                        </IonTitle>
                        <IonButtons slot="end">
                            {loading
                                ? <IonSpinner name="crescent" color="white" />
                                : <IonButton
                                    className={classNames({
                                        [styles.androidMargin]: Capacitor.getPlatform() === 'android',
                                    })}
                                    onClick={() => dismiss()}>
                                    Done
                                </IonButton>
                            }
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    {authedDrives.map((drive: any, index: number) => (
                        <IonAccordionGroup
                            multiple={true}
                            mode="ios"
                            key={index}
                            onIonChange={(e) => handleRootAccordionToggle(e)}
                        >
                            <IonAccordion
                                toggleIconSlot="start"
                                toggleIcon={chevronDownOutline}
                                className={'main'}
                                mode="ios"
                                value={drive.provider_user_id}
                            >
                                <IonItem slot="header" lines='none' className={classNames(styles.accordionHeader, 'ion-no-padding')}>
                                    <IonImg
                                        src={drive.cloud_provider === 'google' ? googleDrive : dropbox}
                                        className={styles.driveIcon}
                                    />
                                    <IonLabel mode="ios">{drive.provider_email}</IonLabel>
                                </IonItem>

                                <div className="ion-padding" slot="content">
                                    {renderDriveChildren(drive.provider_user_id)}
                                </div>
                            </IonAccordion>
                        </IonAccordionGroup>
                    ))}
                </IonContent>
            </IonModal>
        </>
    );
};

export default Origin;
