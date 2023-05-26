import React from "react";
import styles from "../../styles/Home.module.css";
import {IonButton, IonCol, IonImg, IonLabel, IonRow, IonModal, IonInput, IonLoading} from "@ionic/react";
import drive from "../../assets/svgs/drive.svg";
import dropbox from "../../assets/svgs/dropbox.svg";
import api from "../../api_instance"
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { Browser } from "@capacitor/browser";

interface NoDrivesProps {
    provider: 'google' | 'dropbox';
}

const NoDrives = ({ provider }: NoDrivesProps) => {
    const [showLoading, setShowLoading] = React.useState(false);
    const [showDropboxCodeModal, setShowDropboxCodeModal] = React.useState(false);
    const [connectDropboxDisabled, setConnectDropboxDisabled] = React.useState(false);
    const [dropboxCode, setDropboxCode] = React.useState<string | null>(null);
    const dispatch = useDispatch();
    const history = useHistory();
    const { id: userId } = useSelector((state: any) => state.user.userData);

    const dropboxLogin = async () => {
        setConnectDropboxDisabled(true);
        const res  = await api.get('drive/dropbox-url');
        setConnectDropboxDisabled(false);
        await Browser.open({ url: res.data.authUrl });

        // Register a listener for the 'browserFinished' event
        Browser.addListener('browserFinished', () => {
            setShowDropboxCodeModal(true);
        });
        setShowDropboxCodeModal(true);
    }

    const googleLogin = async () => {
        await GoogleAuth.signOut();
        let googleUser = await GoogleAuth.signIn();

        if (!googleUser.authentication.refreshToken && !googleUser.serverAuthCode) {
            return;
        }

        setShowLoading(true);

        await api.post('users/auth/google', {
            googleUser,
            userId,
        });
        await isAuthed();
        setShowLoading(false);
    }

    const isAuthed = async () => {
        const result = await api.post('users/auth/verify', {
            userId,
        });
        // if already authed then load the drive files
        if (result.data.data && result.data.data.length > 0) {
            // API call to load drive files
            dispatch({ type: 'set_drives', payload: result.data.data });
            dispatch({ type: 'set_active_drive', payload: result.data.data.slice(-1)[0] });
            history.push('/CloudManager');
        }
    }

    const handleCodeSubmit = async () => {
        setShowDropboxCodeModal(false);
        setShowLoading(true);
        await api.post('drive/auth/dropbox', {
            code: dropboxCode,
            userId,
        });
        await isAuthed();
        setShowLoading(false);
    }

    return (
        <>
            {provider === 'dropbox' && (
                <IonModal isOpen={showDropboxCodeModal} className={styles.dropboxModal}>
                    <IonRow>
                        <IonCol className={styles.dropboxCode}>
                            <IonLabel position="stacked">Enter code from Dropbox</IonLabel>
                            <IonInput
                                placeholder='Enter code here'
                                value={dropboxCode}
                                onIonChange={(e) => setDropboxCode(e.detail.value!)}
                            />
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol className={styles.actionButtons}>
                            <IonButton onClick={handleCodeSubmit}>Submit</IonButton>
                            <IonButton fill='outline' onClick={() => {
                                setShowDropboxCodeModal(false);
                                setDropboxCode(null);
                            }}>Cancel</IonButton>
                        </IonCol>
                    </IonRow>
                </IonModal>
            )}

            <div className={styles.empty}>
                {provider === 'google' && (
                    <div className={styles.drive}>
                        <IonRow className={styles.rowWrapper}>
                            <IonCol size='2' className={styles.driveWrapper}>
                                <IonImg src={drive} />
                            </IonCol>
                            <IonCol size='10'>
                                <IonLabel className={styles.driveLabel}>Google Drive</IonLabel>
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol>
                                <IonButton
                                    className={styles.connect}
                                    onClick={googleLogin}
                                >
                                    Connect with Google Drive
                                </IonButton>
                            </IonCol>
                        </IonRow>
                    </div>
                )}

                {provider === 'dropbox' && (
                    <div className={styles.drive}>
                        <IonRow className={styles.rowWrapper}>
                            <IonCol size='2' className={styles.driveWrapper}>
                                <IonImg src={dropbox} />
                            </IonCol>
                            <IonCol size='10'>
                                <IonLabel className={styles.driveLabel}>Dropbox</IonLabel>
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol>
                                <IonButton
                                    className={styles.connect}
                                    onClick={dropboxLogin}
                                    disabled={connectDropboxDisabled}
                                >
                                    Connect with Dropbox
                                </IonButton>
                            </IonCol>
                        </IonRow>
                    </div>
                )}
            </div>

            <IonLoading message="Loading..." isOpen={showLoading} spinner="circles" />
        </>
    )
};

export default NoDrives;
