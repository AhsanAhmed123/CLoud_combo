import React from 'react';
import { IonCol, IonLabel, IonRow } from '@ionic/react';
import styles from "../../styles/Home.module.css";
import cloud from "../../assets/svgs/cloud.svg";
import pcloud from "../../assets/svgs/pcloud.svg";
import mega from "../../assets/svgs/mega.svg";
import icloud from "../../assets/svgs/icloud.svg";

const comingSoonDrives = [
    {
        icon: cloud,
        label: "OneDrive"
    },
    {
        icon: pcloud,
        label: "pCloud"
    },
    {
        icon: mega,
        label: "MEGA"
    },
    {
        icon: icloud,
        label: "iCloud"
    },
]

const ComingSoonDrives = () => {
    return (
        <div className={styles.drives}>
            <IonLabel className={styles.comingSoon}>Coming Soon</IonLabel>
            <IonRow>
                {comingSoonDrives.map((drive, index) => (
                    <IonCol size='6' key={index}>
                        <div className={styles.box}>
                            <img src={drive.icon} alt={drive.icon}></img>
                            <IonLabel>{drive.label}</IonLabel>
                        </div>
                    </IonCol>
                ))}
            </IonRow>
        </div>
    )
};

export default ComingSoonDrives;
