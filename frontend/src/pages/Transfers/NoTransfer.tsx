import React from "react";
import { IonRow, IonText } from "@ionic/react";
import { useHistory } from "react-router-dom";
import transferSvg from "../../assets/svgs/transfer-list.svg";
import './Transfers.css';

const NoTransfer = () => {
    const history = useHistory();
    return (
        <IonRow className="transfer">
            <div className='centered-content'>
                <img src={transferSvg} alt="transfer" />
            </div>

            <div className={`transfer-heading transfer-heading-completed`}>
                <IonText className="transfer-name">No transfer made yet</IonText>
            </div>

            <button
                className="start-transfer"
                onClick = {() => history.push('/newTransfer')}
            >
                Start New Transfer
            </button>
        </IonRow>
    );
}

export default NoTransfer;
