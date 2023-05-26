import styles from "../../styles/Home.module.css";
import { IonCol, IonImg, IonLabel, IonRow, IonSkeletonText } from "@ionic/react";
import classNames from "classnames";
import React from "react";
import google from "../../assets/svgs/drive.svg";
import dropbox from "../../assets/svgs/dropbox.svg";

interface DrivesSkeletonProps {
    drive: 'google' | 'dropbox'
}

const DrivesSkeleton = ({ drive }: DrivesSkeletonProps) => {
    return (
        <div className={classNames(styles.empty)}>
            <IonRow className={classNames(styles.rowWrapper)}>
                <IonCol size='2' className={styles.driveWrapper}>
                    <IonImg src={drive === 'google' ? google : dropbox} />
                </IonCol>
                <IonCol size='10'>
                    <IonRow className={styles.infoWrapper}>
                        <IonCol size='12' className={styles.emailWrapper}>
                            <IonLabel className={styles.driveLabel}>
                                <IonSkeletonText animated style={{ width: '50%' }} />
                            </IonLabel>
                            <IonLabel className={styles.driveEmailLabel}>
                                <IonSkeletonText animated style={{width: '80%', height: '100%'}}/>
                            </IonLabel>
                        </IonCol>
                    </IonRow>
                </IonCol>
            </IonRow>
            <IonRow>
                <IonCol size='4' className={styles.metricWrapper}>
                    <IonLabel className={styles.metricLabel}>
                        <IonSkeletonText animated style={{width: '50%', height: '80%'}}/>
                    </IonLabel>
                    <IonLabel className={styles.metricValue}>
                        <IonSkeletonText animated style={{ width: '100%', height: '80%' }} />
                    </IonLabel>
                </IonCol>
                <IonCol size='4' className={classNames(styles.metricWrapper, styles.middle)}>
                    <IonLabel className={styles.metricLabel}>
                        <IonSkeletonText animated style={{ width: '50%', height: '80%' }} />
                    </IonLabel>
                    <IonLabel className={styles.metricValue}>
                        <IonSkeletonText animated style={{ width: '100%', height: '80%' }} />
                    </IonLabel>
                </IonCol>
                <IonCol size='4' className={classNames(styles.metricWrapper, styles.right)}>
                    <IonLabel className={styles.metricLabel}>
                        <IonSkeletonText animated style={{ width: '50%', height: '80%' }} />
                    </IonLabel>
                    <IonLabel className={styles.metricValue}>
                        <IonSkeletonText animated style={{ width: '100%', height: '80%' }} />
                    </IonLabel>
                </IonCol>
            </IonRow>
        </div>
    )
};

export default DrivesSkeleton;
