import React, { useRef, useState } from 'react';
import {
    IonCol,
    IonGrid,
    IonImg,
    IonPage,
    IonRow,
    IonSkeletonText,
    IonText,
    IonToolbar,
    useIonViewWillEnter,
    useIonViewWillLeave,
} from '@ionic/react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../api_instance';
import socketIOClient from 'socket.io-client';
import NoTransfer from "./NoTransfer";
import Transfer from "./Transfer";
import transferIllustration from '../../assets/svgs/transfer-illustration.svg';
import transferSvg from "../../assets/svgs/transfer-list.svg";
import './Transfers.css';

const skeletonsArray = [1, 2];

const Transfers = () => {
    const dispatch = useDispatch();
    const { userData: user } = useSelector((state: any) => state.user);
    const [showSkeletons, setShowSkeletons] = useState(true);
    const [transfers, setTransfers] = useState([]);
    const [timeoutId, setTimeoutId] = useState<any>(null);

    const socket = useRef<any>();

    useIonViewWillEnter(() => {
        socket.current = socketIOClient(`https://184.174.36.243:3000`, {
            transports: ['websocket'],
            query: {
                userId: user.id,
            },
        });

        setShowSkeletons(true);
        setTimeoutId(setTimeout(() => {
            void fetchTransfers();
        }, 1000));

        socket.current.on('progress', (data: any) => {
            updateProgress(data);
        });
    });

    useIonViewWillLeave(() => {
        socket.current.emit('disconnect-user', user.id);
        clearTimeout(timeoutId);
    });

    const updateProgress = (data: any) => {
        setTransfers((prevTransfers: any) => {
            return prevTransfers.map((transfer: any) => {
                if (transfer.jobId === data.id) {
                    return {
                        ...transfer,
                        progress: data.progress,
                        filesCompleted: transfer.filesCompleted + 1,
                        sizeCompleted: data.sizeCompleted,
                    };
                }
                return transfer;
            });
        });

        if (data.progress === 100) {
            void fetchTransfers();
            dispatch({ type: 'clear_manager_file_tree' });
            dispatch({ type: 'set_fetch_filetree', payload: true });
        }
    };

    const fetchTransfers = async () => {
        const { data } = await api.get('transfers/get', {
            params: {
                userId: user.id,
            },
        });
        setTransfers(data.data);
        setShowSkeletons(false);
    };

    return (
        <IonPage>
            <div className="header bg-card transfer-header">
                <IonToolbar>
                    <IonRow className="ion-padding-horizontal">
                        <IonCol size="6" className="de-flex flex-center ion-no-padding center">
                            <IonText className="txt-h2 ion-no-padding actual-header ion-text-center">Transfer List</IonText>
                        </IonCol>

                        <IonCol size="6" className="de-flex flex-center">
                            <IonImg src={transferIllustration} className='transfer-illustration' />
                        </IonCol>
                    </IonRow>
                </IonToolbar>
            </div>

            <IonGrid className="transfer-page-content">
                {showSkeletons ?
                    skeletonsArray.map((i: number, index: number) => (
                        <IonRow key={index} className="transfer">
                            <div className='centered-content'>
                                <img src={transferSvg} alt="transfer" />
                            </div>

                            <IonSkeletonText animated style={{ width: '100%' }} className="progress-bar" />

                            <div className="stats">
                                <div className="stat" style={{ borderRight: '1px solid #d0d2da', paddingRight: '1.5rem' }}>
                                    <IonText className="stat-heading">Sent</IonText>
                                    <IonText className="stat-value">
                                        <IonSkeletonText animated style={{ width: '100%' }} />
                                    </IonText>
                                </div>

                                <div className="stat">
                                    <IonText className="stat-heading">Transferred</IonText>
                                    <IonText className="stat-value">
                                        <IonSkeletonText animated style={{ width: '100%' }} />
                                    </IonText>
                                </div>

                                <div className="stat" style={{ borderLeft: '1px solid #d0d2da', paddingLeft: '1.5rem' }}>
                                    <IonText className="stat-heading">Size</IonText>
                                    <IonText className="stat-value">
                                        <IonSkeletonText animated style={{ width: '100%' }} />
                                    </IonText>
                                </div>
                            </div>
                        </IonRow>
                )): null}

                {!showSkeletons && transfers && transfers.length === 0 && <NoTransfer />}

                {!showSkeletons && transfers && transfers.length > 0 && transfers.map((transfer: any, i) => (
                    <Transfer transfer={transfer} i={i} key={transfer.id} transfersLength={transfers.length} />
                ))}
            </IonGrid>
        </IonPage>
    );
};

export default Transfers;
