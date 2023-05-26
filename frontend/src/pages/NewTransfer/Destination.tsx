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
    IonIcon,
    IonImg,
    IonItem,
    IonLabel,
    IonModal,
    IonSpinner,
    IonTitle,
    IonToolbar,
} from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isArray, isEmpty } from "lodash";
import { chevronDownOutline } from "ionicons/icons";
import classNames from "classnames";
import api from "../../api_instance";
import cloudDownload from '../../assets/svgs/cloud_download.svg';
import styles from './NewTransfer.module.css';
import { Capacitor } from "@capacitor/core";
import googleDrive from "../../assets/svgs/drive.svg";
import dropbox from "../../assets/svgs/dropbox.svg";

const Destination: React.FC = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const { authedDrives } = useSelector((state: any) => state.drives);
    const { to, toData } = useSelector((state: any) => state.transfer);

    const modal = useRef<HTMLIonModalElement>(null);
    const page = useRef(null);

    const [presentingElement, setPresentingElement] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setPresentingElement(page.current);
    }, []);

    function dismiss() {
        modal.current?.dismiss();
    }

    const actualDriveId = useRef<any>();

    const renderDriveChildren = (driveId: string) => {
        if (!to[driveId]) return;

        const folders = to[driveId];
        actualDriveId.current = driveId;
        return renderFolders(folders);
    };

    const renderFolders = useCallback((folders: any, driveId: string = actualDriveId.current) => {
        return (
            folders &&
            folders.map((folder: any, index: number) => {
                const isCheckboxChecked = toData.driveId === driveId && toData.folderId === folder.id;
                const folderInfo = {
                    driveId,
                    folderId: folder.id,
                    folderName: folder.name,
                }
                return (
                    <IonAccordionGroup
                        multiple={true}
                        key={index}
                        onIonChange={(e) => handleAccordionToggle(e)}
                        mode="ios"
                    >
                        <IonAccordion key={index} mode="ios" toggleIconSlot='start' value={JSON.stringify({
                            driveId,
                            folderId: folder.id,
                        })}>
                            <IonItem slot="header" color="light" mode="ios">
                                <IonCheckbox
                                    slot="start"
                                    className={styles.checkbox}
                                    mode="ios"
                                    onClick={(e) => {
                                        onCheckboxChange(e, folderInfo, !isCheckboxChecked)
                                    }}
                                    checked={isCheckboxChecked}
                                ></IonCheckbox>
                                <IonLabel>{folder.name}</IonLabel>
                            </IonItem>
                            <div className="ion-padding" slot="content">
                                {folder.children && folder.children.length > 0 && renderFolders(folder.children)}
                            </div>
                        </IonAccordion>
                    </IonAccordionGroup>
                );
            })
        );
    },
        [to, toData]
    );

    const onCheckboxChange = useCallback((e: any, driveInfo: any, isChecked: boolean) => {
        e.stopPropagation();
        const { driveId, folderId, folderName } = driveInfo;

        if (isChecked) {
            if (folderId === 'root') {
                dispatch({
                    type: 'add_destination_folder',
                    payload: {
                        driveId,
                        folderName: 'root',
                        folderId: 'root',
                        driveName: folderName,
                    },
                });
                return;
            }

            dispatch({
                type: 'add_destination_folder',
                payload: {
                    driveId,
                    folderName,
                    folderId,
                    driveName: authedDrives.find((drive: any) => drive.provider_user_id === driveId).provider_email,
                },
            });
        } else {
            dispatch({
                type: 'add_destination_folder',
                payload: {},
            });
        }
    }, [authedDrives, dispatch]);

    const handleRootAccordionToggle = (e: any) => {
        const { detail: { value } } = e;

        if (isEmpty(value)) {
            return;
        }

        const driveId = value[0];
        if (!to[driveId]) {
            setLoading(true);
            void fetchDriveFolders(driveId, driveId.includes('dbid') ? 'dropbox' : 'google');
            return;
        }

        renderDriveChildren(driveId);
    }

    const fetchDriveFolders = async (driveId: string, cloudProvider: string) => {
        const driveFolders = await api.get(`drive/root-folders`, {
            params: {
                driveId: driveId,
                cloudProvider,
                userId: JSON.parse(localStorage.getItem('currentUser')!).id,
            },
        });
        if (driveFolders.status === 200) {
            setLoading(false);
            dispatch({
                type: 'add_root_folders',
                payload: {
                    driveId,
                    folders: driveFolders.data.data
                }
            });
        }
    }

    const handleAccordionToggle = (e: any) => {
        e.stopPropagation();
        const { detail: { value } } = e;

        if (isEmpty(value) || !isArray(value)) {
            return;
        }

        const { driveId, folderId } = JSON.parse(value);
        const children = findChildren(folderId, to[driveId]);

        if (children === false || children === undefined) {
            setLoading(true);
            void fetchFolderChildren(driveId, folderId, driveId.includes('dbid') ? 'dropbox' : 'google');
            return;
        }
    }

    const fetchFolderChildren = async (driveId: string, folderId: string, cloudProvider: string) => {
        const folderFiles = await api.get('drive/folder-children', {
            params: {
                folderId,
                cloudProvider,
                driveId,
                userId: JSON.parse(localStorage.getItem('currentUser')!).id,
            },
        });

        if (folderFiles.status === 200) {
            setLoading(false);
            dispatch({ type: 'add_to_destination_tree', payload: {
                driveId,
                folderId,
                folderFiles: folderFiles.data.data,
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

    return (
        <>
            <IonCard className={styles.card}>
                <IonCardHeader className={styles.cardHeader}>
                    <IonCardTitle className={styles.cardTitle}>Select Destination</IonCardTitle>
                    <IonCardSubtitle className={styles.cardSubTitle}>Select your destination</IonCardSubtitle>
                </IonCardHeader>

                <IonCardContent className={styles.cardContent} id="open-destination-modal">
                    {toData.driveId && toData.folderName && toData.driveName ? (
                        <div className={styles.selectedFiles}>
                            <div onClick={(e) => e.preventDefault()} className={styles.selectedFile}>
                                <p className={styles.selectedFileTitle}>
                                    {toData.driveName}
                                </p>
                                <p className={styles.selectedFileMetaData}>
                                    {toData.folderName}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <IonIcon ios={cloudDownload} />

                            <IonCardSubtitle className={styles.cardSubTitle}>
                                Tap here to choose your folder
                            </IonCardSubtitle>
                        </>
                    )}
                </IonCardContent>
            </IonCard>

            <IonModal ref={modal} trigger="open-destination-modal" presentingElement={presentingElement!} className={classNames({
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
                    {authedDrives.map((drive: any, index: number) => {
                        const folderInfo = {
                            driveId: drive.provider_user_id,
                            folderId: 'root',
                            folderName: drive.provider_email,
                        }
                        const isChecked = toData.driveId === drive.provider_user_id && toData.folderId === 'root';
                        return (
                            <IonAccordionGroup
                                multiple={true}
                                key={index}
                                onIonChange={(e) => handleRootAccordionToggle(e)}
                                mode="ios"
                            >
                                <IonAccordion className={'main'} toggleIconSlot="start" toggleIcon={chevronDownOutline} value={drive.provider_user_id} mode="ios">
                                    <IonItem slot="header" lines='none' className={classNames(styles.accordionHeader, 'ion-no-padding')} mode="ios">
                                        <IonCheckbox
                                            slot="start"
                                            className={styles.rootCheckbox}
                                            mode="ios"
                                            onClick={(e) => {
                                                onCheckboxChange(e, folderInfo, !isChecked)
                                            }}
                                            checked={isChecked}
                                        ></IonCheckbox>
                                        <IonImg
                                            src={drive.cloud_provider === 'google' ? googleDrive : dropbox}
                                            className={styles.driveIcon}
                                        />
                                        <IonLabel>{drive.provider_email}</IonLabel>
                                    </IonItem>
                                    <div className="ion-padding" slot="content">
                                        {renderDriveChildren(drive.provider_user_id)}
                                    </div>
                                </IonAccordion>
                            </IonAccordionGroup>
                        )
                    })}
                </IonContent>
            </IonModal>
        </>
    );
};

export default Destination;
