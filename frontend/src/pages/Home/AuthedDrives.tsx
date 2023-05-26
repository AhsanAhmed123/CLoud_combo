import React from 'react';
import { useDispatch, useSelector } from "react-redux";
import styles from "../../styles/Home.module.css";
import classNames from "classnames";
import NoDrives from "./NoDrives";
import DrivesList from "./DrivesList";
import DrivesSkeleton from "./DrivesSkeleton";
import { IonAlert, IonCol, IonRow, useIonViewDidEnter } from "@ionic/react";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { Capacitor } from "@capacitor/core";

const AuthedDrives = () => {
    const { authedDrives } = useSelector((state: any) => state.drives);
    const { drivesLoading, needsAuth } = useSelector((state: any) => state.ui);
    const dispatch = useDispatch();

    useIonViewDidEnter(() => {
        const platform = Capacitor.getPlatform();
        GoogleAuth.initialize({
            clientId: platform === 'ios'
                ? '1014272967728-g4jm0i6gjah51l987blnu9j4gqis0350.apps.googleusercontent.com'
                : '1014272967728-678ij3tttv1onmsqg52k2hl64vk7ftd9.apps.googleusercontent.com',
            scopes: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/drive'
            ],
            grantOfflineAccess: true,
        });
    });

    return (
        <div className={classNames(styles.drivesBox)}>
            <div className={styles.emptyWrapper}>
                {drivesLoading ? <DrivesSkeleton drive={'google'} /> : null}
                {drivesLoading ? <DrivesSkeleton drive={'dropbox'} /> : null}
                {!drivesLoading
                    ? authedDrives.filter((d: any) => d.cloud_provider === 'google').length === 0
                        ? <NoDrives provider='google' />
                        : <DrivesList drives={authedDrives.filter((d: any) => d.cloud_provider === 'google')} />
                    : null}

                {!drivesLoading
                    ? authedDrives.filter((d: any) => d.cloud_provider === 'dropbox').length === 0
                        ? <NoDrives provider='dropbox' />
                        : <DrivesList drives={authedDrives.filter((d: any) => d.cloud_provider === 'dropbox')} />
                    : null}
                {
                    needsAuth ? <IonRow>
                        <IonCol>
                            <IonAlert
                                isOpen={needsAuth}
                                onDidDismiss={() => dispatch({ type: 'set_needs_auth', payload: false })}
                                cssClass="my-custom-class"
                                header={"Attention!"}
                                message={"We noticed that you have drives that require authentication. Please authenticate them to continue."}
                                buttons={["Ok"]}
                            />
                        </IonCol>
                    </IonRow> : null
                }
            </div>
        </div>
    )
};

export default AuthedDrives;
