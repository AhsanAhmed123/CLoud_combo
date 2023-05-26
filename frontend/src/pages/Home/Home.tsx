import {
    IonCol,
    IonImg,
    IonPage,
    IonRow,
    IonToolbar
} from '@ionic/react';
import styles from '../../styles/Home.module.css';
import "../../styles/Home.module.css";
import logo from '../../assets/svgs/logo.svg';
import premium from '../../assets/svgs/premium.svg';
import offer from '../../assets/svgs/offer.svg';
import ComingSoonDrives from "./ComingSoonDrives";
import AuthedDrives from "./AuthedDrives";
import classNames from "classnames";
import { useSelector } from "react-redux";
import { Browser } from "@capacitor/browser";

const Home: React.FC = () => {
    const { authedDrives } = useSelector((state: any) => state.drives);
    const { isLtdUser } = useSelector((state: any) => state.user.userData);

    const googleDrivesNumber = authedDrives.filter((drive: any) => drive.cloud_provider === 'google').length;
    const dropboxDrivesNumber = authedDrives.filter((drive: any) => drive.cloud_provider === 'dropbox').length;

    const openWebsite = async () => {
        await Browser.open({url: 'https://cloudcombo.app/pricing-plan.html'});
    };

    return (
        <IonPage className={classNames(
            {
                [styles.page]: true,
                [styles.minGap]: googleDrivesNumber < 2 || dropboxDrivesNumber < 2,
                [styles.noGap]: googleDrivesNumber === 0 && dropboxDrivesNumber === 0,
            }
        )}>
          <div className={styles.header}>
            <IonToolbar className='ion-padding'>
              <IonRow>
                <IonCol size='12' className='de-flex flex-center'>
                    <IonImg src={logo} />
                </IonCol>

                  {isLtdUser ? (
                      <IonImg src={premium} className={styles.premium} />
                  ) : (
                      <IonImg src={offer} onClick={openWebsite} className={styles.premium} />
                  )}
              </IonRow>
            </IonToolbar>
          </div>

            <div className={styles.contentWrapper}>
                <AuthedDrives />
                <ComingSoonDrives />
            </div>
        </IonPage>
    );
};

export default Home;
