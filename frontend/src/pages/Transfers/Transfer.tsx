import React from "react";
import { IonProgressBar, IonRow, IonText } from "@ionic/react";
import googleToGoogle from "../../assets/svgs/transfer-list.svg";
import googleToDropbox from "../../assets/svgs/drive-to-dropbox.svg";
import dropboxToGoogle from "../../assets/svgs/dropbox-to-drive.svg";
import dropboxToDropbox from "../../assets/svgs/dropbox-to-dropbox.svg";
import './Transfers.css';
import { formatBytes } from "../../utils/humanizeSize";

const Transfer = (props: any) => {
    const { transfer, i, transfersLength } = props;

    return (
        <IonRow key={transfer.id} className="transfer">
            <div className='centered-content'>
                <img src={
                    transfer.fromProvider === 'google' && transfer.toProvider === 'dropbox'
                        ? googleToDropbox
                        : transfer.fromProvider === 'dropbox' && transfer.toProvider === 'google'
                            ? dropboxToGoogle
                            : transfer.fromProvider === 'google' && transfer.toProvider === 'google'
                                ? googleToGoogle
                                : transfer.fromProvider === 'dropbox' && transfer.toProvider === 'dropbox'
                                    ? dropboxToDropbox
                                    : googleToGoogle
                } alt="transfer" className="drive-to-drive" />
            </div>

            <div className='transfer-heading'>
                <IonText className="transfer-name">Transfer {transfersLength - i}</IonText>

                <div className="percentage">
                    <IonText>{transfer.progress}</IonText> %
                </div>
            </div>

            <IonProgressBar value={transfer.progress / 100} className="progress-bar"></IonProgressBar>

            <div className="stats">
                <div
                    className="stat"
                    style={{ borderRight: '1px solid #d0d2da', paddingRight: '1.5rem' }}
                >
                    <IonText className="stat-heading">{transfer.progress === 100 ? 'Sent' : 'Processed'}</IonText>
                    <IonText className="stat-value">
                        {transfer.filesCompleted} of {transfer.filesAttempted}
                    </IonText>
                </div>

                <div className="stat">
                    <IonText className="stat-heading">Transferred</IonText>
                    <IonText className="stat-value">{formatBytes(transfer.sizeCompleted)}</IonText>
                </div>

                <div
                    className="stat"
                    style={{ borderLeft: '1px solid #d0d2da', paddingLeft: '1.5rem' }}
                >
                    <IonText className="stat-heading">Size</IonText>
                    <IonText className="stat-value">{formatBytes(transfer.sizeAttempted)}</IonText>
                </div>
            </div>
        </IonRow>
    )
}

export default Transfer;