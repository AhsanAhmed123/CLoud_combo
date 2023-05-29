import {
    IonAlert, IonButton,
    IonCol,
    IonGrid,
    IonIcon, IonInput,
    IonLabel, IonLoading,
    IonModal,
    IonPage,
    IonRow,
    IonText,
    IonToolbar,
    IonContent,
    IonHeader,
    IonTitle,
    IonToast,
    IonButtons,
    IonBackButton,
    IonFab,
     IonFabButton,
    useIonActionSheet
} from '@ionic/react';
import api from '../../api_instance';
import { add } from 'ionicons/icons';
import classNames from 'classnames';
import { addOutline, arrowBackOutline } from 'ionicons/icons';
import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import FilesArea from './FilesArea';
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import drive from '../../assets/svgs/drive.svg';
import dropbox from '../../assets/svgs/dropbox.svg';
import './CloudManager.css';
import { Browser } from "@capacitor/browser";

const CloudManager: React.FC = () => {
    const dispatch = useDispatch();
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showDropboxCodeModal, setShowDropboxCodeModal] = React.useState(false);
    const [showLoading, setShowLoading] = React.useState(false);
    const [dropboxCode, setDropboxCode] = React.useState<string | null>(null);
    const { id: userId } = useSelector((state: any) => state.user.userData);
    const { selectedDriveId, headerText, foldersVisited } = useSelector((state: any) => state.flow);
    const drives = useSelector((state: any) => state.drives.authedDrives);
    const restorePreviousView = useRef<any>(null);
    const filesDivRef = useRef<any>(null);
    const history = useHistory();
    const [ present ] = useIonActionSheet();
    const [showToast, setShowToast] = React.useState(false);

    const handleNewDrive = () => {
        present({
            header: 'Select a provider',
            buttons: [
                {
                    text: 'Google Drive',
                    icon: drive,
                    handler: () => googleLogin(),
                },
                {
                    text: 'Dropbox',
                    icon: dropbox,
                    handler: () => dropboxLogin(),
                }
            ],
        })
    }
    const [showPopup, setShowPopup] = useState(false);

    

    const handleFloatingButtonClick = () => {
      setShowPopup(true);
    };
  
    const handlePopupClose = () => {
      setShowPopup(false);
    };
  
    const handleBackButtonClick = () => {
      handlePopupClose();
    };
    
    const handleFileUpload = () => {
        setShowPopup(false);
        setShowLoading(true);
    
        // Simulating an asynchronous upload process
        setTimeout(() => {
          setShowLoading(false);
          setShowToast(true);
        }, 2000);
      };
    
      const handleToastClose = () => {
        setShowToast(false);
      };
    

    const googleLogin = () => {
        if (drives.length === 5) {
            setShowLimitModal(true);
            return;
        }

        void startGoogleAuth();
    };

    const dropboxLogin = async () => {
        if (drives.length === 5) {
            setShowLimitModal(true);
            return;
        }

        const res  = await api.get('drive/dropbox-url');
        await Browser.open({ url: res.data.authUrl });

        // Register a listener for the 'browserFinished' event
        Browser.addListener('browserFinished', () => {
            setShowDropboxCodeModal(true);
        });
        setShowDropboxCodeModal(true);
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
        setDropboxCode(null);
    }

    const startGoogleAuth = async () => {
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

        const { data: drives } = result.data;
        if (drives) {
            // API call to load drive files
            dispatch({ type: 'set_drives', payload: drives });
            dispatch({ type: 'set_active_drive', payload: drives.slice(-1)[0] });
        }
    };

    const renderPreviousView = () => {
        if (foldersVisited.length === 1 && foldersVisited[0] === 'root') {
            history.push('/');
            return;
        }
        restorePreviousView.current();
    };

    const scrollToTop = () => {
        filesDivRef.current!.scroll({
            top: 0,
            behavior: 'smooth',
        })
    }

    const handleDriveChange = (drive: any) => {
        dispatch({ type: 'set_active_drive', payload: drive });
        dispatch({ type: 'set_header_text', payload: 'Cloud Manager' });
    }

    return (
        <IonPage>
            {/* Heading */}
            <div className="header bg-card manager-header">
                <IonToolbar>
                    <IonRow className="ion-padding-horizontal">
                        <IonCol size="2" className="de-flex flex-start ion-no-padding">
                            <button onClick={renderPreviousView} className="burger-btn">
                                <IonIcon src={arrowBackOutline} className="burger-icon"></IonIcon>
                            </button>
                        </IonCol>

                        <IonCol size="8" className="de-flex flex-center">
                            <IonText className="txt-h2 ion-no-padding actual-header">{headerText}</IonText>
                        </IonCol>
                    </IonRow>
                </IonToolbar>
            </div>
            <IonGrid className="page-content" ref={filesDivRef}>
                <IonRow className="de-flex flex-start">
                    <IonText className="txt-h2 drives-list-heading">My Accounts</IonText>
                </IonRow>

                <IonRow className="ion-padding-horizontal drives-row">
                    {drives.map((actualDrive: any, index: number) => (
                        <IonCol key={index} size="2" className="de-flex flex-start manager-topbar">
                            <div
                                className={classNames('drives-box sm-box de-flex-col flex-center', {
                                    'active-box': actualDrive.provider_user_id === selectedDriveId,
                                })}
                                onClick={() => handleDriveChange(actualDrive)}
                            >
                                <img src={actualDrive.cloud_provider === 'google' ? drive : dropbox} alt="drive" className=""></img>
                                <IonLabel className="ion-text-center drives-label">
                                    {actualDrive.provider_email.split('@')[0]}
                                </IonLabel>
                            </div>
                        </IonCol>
                    ))}
                    <IonCol size="2" className="de-flex flex-start" onClick={handleNewDrive}>
                        <div className="sm-box de-flex-col flex-center add-btn">
                            <IonIcon src={addOutline} className=""></IonIcon>
                            <IonLabel className="ion-text-center">Add</IonLabel>
                        </div>
                    </IonCol>
                </IonRow>

                <FilesArea
                    restorePreviousView={restorePreviousView}
                    scrollToTop={scrollToTop}
                />

                <IonModal isOpen={showDropboxCodeModal} className="dropbox-modal">
                    <IonRow>
                        <IonCol className='dropbox-code'>
                            <IonLabel position="stacked">Enter code from Dropbox</IonLabel>
                            <IonInput
                                placeholder='Enter code here'
                                value={dropboxCode}
                                onIonChange={(e) => setDropboxCode(e.detail.value!)}
                            />
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol className='action-buttons'>
                            <IonButton onClick={handleCodeSubmit}>Submit</IonButton>
                            <IonButton fill='outline' onClick={() => {
                                setShowDropboxCodeModal(false);
                                setDropboxCode('');
                            }}>Cancel</IonButton>
                        </IonCol>
                    </IonRow>
                </IonModal>

                {showLimitModal && (
                    <IonAlert
                        isOpen={showLimitModal}
                        onDidDismiss={() => setShowLimitModal(false)}
                        cssClass="my-custom-class"
                        header={"Attention!"}
                        message={'You have reached the limit of 5 authed drives. You have to un-link one of your drives in the homepage in order to link a new one.'}
                        buttons={["Dismiss"]}
                    />
                )}
            </IonGrid>

            {/* Floating button */}
            <IonFab class="btn_ic">
                <IonFabButton class="floating_button_btn" onClick={handleFloatingButtonClick}>
                <IonIcon icon={add} class="floating_button_icon" />
                </IonFabButton>
            </IonFab>

            <IonModal isOpen={showPopup} class="float_popup">
            <IonHeader>
        
            <IonToolbar>
                <IonButtons slot="start">
                
                </IonButtons>
             
                <IonButton expand="block" class="close_pop" onClick={handlePopupClose}>
                x
                
            </IonButton>
            
            
            </IonToolbar>
            <h5 id="heading">Upload File</h5>
            </IonHeader>
            
            
            <IonContent>
                
            <div className="center-content">
            <div className="center">
                <input type="file" required/>
            </div>
            <div className="corner">
                <IonButton onClick={handleFileUpload}>Submit</IonButton>
            </div>
            </div>
        </IonContent>
        </IonModal>


            <IonLoading message="Loading..." isOpen={showLoading} spinner="circles" />
            <IonToast
        isOpen={showToast}
        message="Successfully uploaded!"
        duration={2000}
        onDidDismiss={handleToastClose}
      />
        </IonPage>
    );
};

export default CloudManager;
