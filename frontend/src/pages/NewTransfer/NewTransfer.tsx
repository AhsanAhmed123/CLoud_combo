import { IonCol, IonGrid, IonImg, IonModal, IonPage, IonRow, IonText, IonToast, IonToolbar } from '@ionic/react';
import classNames from 'classnames';
import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../api_instance';
import Destination from './Destination';
import styles from './NewTransfer.module.css';
import Origin from './Origin';
import transferIllustration from "../../assets/svgs/transfer-illustration.svg";
import { formatBytes } from "../../utils/humanizeSize";
import { useHistory } from "react-router-dom";

const NewTransfer: React.FC = () => {
    const modal = useRef<HTMLIonModalElement>(null);

    const history = useHistory();
    const dispatch = useDispatch();
    const { fromData: from, toData: to } = useSelector((state: any) => state.transfer);
    const { userData } = useSelector((state: any) => state.user);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const isTransferButtonDisabled = from.length < 1 || !to.driveId || !to.folderId;
    let toSend = from.slice();
    const totalSize = toSend.reduce((acc: number, curr: any) => acc + parseInt(curr.size ? curr.size : 0), 0);

    const startTransfer = async () => {
        if (to.driveId.includes('dbid')) {
            toSend = from.filter((file: any) => file.size < 157286400);
            if (toSend.length !== from.length) {
                setShowToast(true);
            }
        }

        setIsButtonDisabled(true);
        const response = await api.post('/drive/transfer/new', {
            from: toSend,
            to,
            totalSize,
            userId: userData.id,
        });

        if (response.data.data) {
            dispatch({ type: 'clear_from_to_data' });
            modal.current?.dismiss();
            history.push('/transfers');
        }
        setIsButtonDisabled(false);
    };

    const dismiss = () => {
        modal.current?.dismiss();
    };

    return (
        <IonPage>
            <div className={styles.newTransferHeader}>
                <IonToolbar>
                    <IonRow className="ion-padding-horizontal">
                        <IonCol size="6" className="de-flex flex-center ion-no-padding center">
                            <IonText className="txt-h2 ion-no-padding actual-header ion-text-center">File Transfer</IonText>
                        </IonCol>

                        <IonCol size="6" className="de-flex flex-center">
                            <IonImg src={transferIllustration} className={styles.transferIllustration} />
                        </IonCol>
                    </IonRow>
                </IonToolbar>
            </div>

            <IonGrid className={classNames(styles.transferContent, 'ion-padding')}>
                <Origin />
                <Destination />

                <div className={styles.transferBtnContainer}>
                    <button className={styles.transferBtn} disabled={isTransferButtonDisabled} id='open-confirm-dialog'>
                        Start transfer
                    </button>
                </div>

                <IonModal className={styles.confirmModal} ref={modal} trigger="open-confirm-dialog">
                    <div className={styles.wrapper}>
                        <p className={styles.text}>
                            You are about to transfer {formatBytes(totalSize)} of data to {to.driveName}
                        </p>

                        <div className={styles.buttons}>
                            <button className={styles.confirmTransferButton} onClick={startTransfer} disabled={isButtonDisabled}>
                                Confirm
                            </button>

                            <button className={styles.outlinedBtn} onClick={dismiss}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </IonModal>
            </IonGrid>

            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message="Due to Dropbox API limitations, files larger than 150MB cannot be transferred. These files will be skipped."
                duration={10000}
            ></IonToast>
        </IonPage>
    );
};

export default NewTransfer;
