import React from "react";
import { IonCol, IonImg, IonLabel, IonRow, useIonActionSheet } from "@ionic/react";
import { useDispatch } from "react-redux";
import { Swiper, SwiperSlide } from "swiper/react";
import { useHistory } from "react-router-dom";
import { Pagination } from "swiper";
import classNames from "classnames";
import { formatBytes } from "../../utils/humanizeSize";
import api from "../../api_instance";
import drive from "../../assets/svgs/drive.svg";
import dropbox from "../../assets/svgs/dropbox.svg";
import dots from "../../assets/svgs/dots.svg";
import styles from "../../styles/Home.module.css";

import 'swiper/css';
import "swiper/css/pagination";

interface DrivesListProps {
    drives: any
}

const DrivesList = (props: DrivesListProps) => {
    const history = useHistory();
    const dispatch = useDispatch();
    const { drives: authedDrives } = props;
    const [ present ] = useIonActionSheet();

    const removeDrive = async (driveId: any) => {
        const result = await api.post('users/auth/remove', { driveId, userId: JSON.parse(localStorage.getItem('currentUser')!).id });
        if (result.status === 200) {
            dispatch({ type: 'reset_state' });
            dispatch({ type: 'set_drives_loading', payload: true });
            void fetchDrives();
        }
    }

    const fetchDrives = async () => {
        const drivesResponse = await api.post('users/auth/verify', {
            userId: JSON.parse(localStorage.getItem('currentUser')!).id,
        });

        const { data: allDrives } = drivesResponse.data;

        const drives = allDrives && allDrives.filter((drive: any) => !drive.needsAuth);
        if (drives.length !== allDrives.length) {
            dispatch({ type: 'set_needs_auth', payload: true });
        }

        if (drives) {
            dispatch({ type: 'set_drives', payload: drives });
            dispatch({ type: 'set_drives_loading', payload: false });
            if (drives.length > 0) {
                dispatch({ type: 'set_active_drive', payload: drives[0] });
            }
        }
    };

    const openDrive = (driveId: any) => {
        dispatch({ type: 'set_active_drive', payload: authedDrives.find((drive: any) => drive.provider_user_id === driveId) });
        history.push('/CloudManager');
    }

    return (
        <div className={classNames(styles.empty, styles.emptyHeight, {
            [styles.singleDrive]: authedDrives.length === 1,
        })}>
            <Swiper
                slidesPerView={1}
                modules={[Pagination]}
                pagination={{
                    dynamicBullets: true,
                }}
            >
                {authedDrives.map((authedDrive: any) => (
                    <SwiperSlide key={authedDrive.id}>
                        <IonRow className={classNames(styles.rowWrapper, styles.driveRow)} onClick={() => openDrive(authedDrive.provider_user_id)}>
                            <IonCol size='2' className={styles.driveWrapper}>
                                <IonImg src={authedDrive.cloud_provider === 'google' ? drive : dropbox} />
                            </IonCol>
                            <IonCol size='10'>
                                <IonRow className={styles.infoWrapper}>
                                    <IonCol size='11' className={styles.emailWrapper}>
                                        <IonLabel className={styles.driveLabel}>
                                            {authedDrive.cloud_provider === 'google' ? 'Google Drive' : 'Dropbox'}
                                        </IonLabel>
                                        <IonLabel className={styles.driveEmailLabel}>{authedDrive.provider_email}</IonLabel>
                                    </IonCol>
                                    <IonCol size='1'>
                                        <IonImg
                                            src={dots}
                                            className={styles.dots}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                void present({
                                                    header: 'Remove Drive',
                                                    subHeader: authedDrive.provider_email,
                                                    buttons: [
                                                        {
                                                            text: 'Remove',
                                                            role: 'destructive',
                                                            handler: () => removeDrive(authedDrive.provider_user_id),
                                                        },
                                                        {
                                                            text: 'Cancel',
                                                            role: 'cancel'
                                                        }]
                                                })
                                            }}
                                        />
                                    </IonCol>
                                </IonRow>
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol size='4' className={styles.metricWrapper}>
                                <IonLabel className={styles.metricLabel}>Used</IonLabel>
                                <IonLabel className={styles.metricValue}>
                                    {authedDrive.storageQuota && formatBytes(authedDrive.storageQuota.usage)}
                                </IonLabel>
                            </IonCol>
                            <IonCol size='4' className={classNames(styles.metricWrapper, styles.middle)}>
                                <IonLabel className={styles.metricLabel}>Available</IonLabel>
                                <IonLabel className={styles.metricValue}>
                                    {authedDrive.storageQuota &&
                                        parseInt(authedDrive.storageQuota.usage) > parseInt(authedDrive.storageQuota.limit)
                                            ? '0 MB'
                                            : ''}
                                    {authedDrive.storageQuota &&
                                        parseInt(authedDrive.storageQuota.usage) <= parseInt(authedDrive.storageQuota.limit)
                                            && formatBytes(authedDrive.storageQuota.limit - authedDrive.storageQuota.usage)}
                                </IonLabel>
                            </IonCol>
                            <IonCol size='4' className={classNames(styles.metricWrapper, styles.right)}>
                                <IonLabel className={styles.metricLabel}>Total</IonLabel>
                                <IonLabel className={styles.metricValue}>
                                    {authedDrive.storageQuota && formatBytes(authedDrive.storageQuota.limit)}
                                </IonLabel>
                            </IonCol>
                        </IonRow>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    )
};

export default DrivesList;
