import React, { useEffect } from 'react';
import {
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonImg,
  useIonActionSheet,
} from '@ionic/react';
import { Route, useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isEmpty } from 'lodash';
import classNames from 'classnames';
import Login from '../pages/Auth/Login';
import Signup from '../pages/Auth/Signup';
import CloudManager from '../pages/CloudManager/CloudManager';
import Home from '../pages/Home/Home';
import NewTransfer from '../pages/NewTransfer/NewTransfer';
import Transfers from "../pages/Transfers/Transfers";
import api from '../api_instance';

import home from '../assets/svgs/home.svg';
import filledHome from '../assets/svgs/filled-home.svg';
import manager from '../assets/svgs/manager.svg';
import filledManager from '../assets/svgs/filled-manager.svg';
import logout from '../assets/svgs/logout.svg';
import transfers from '../assets/svgs/transfers.svg';
import filledTransfers from '../assets/svgs/filled-transfers.svg';
import newTransfer from '../assets/svgs/new-transfer.svg';

import styles from '../styles/NavigationBar.module.css';

const NavigationBar: React.FC = () => {
  const user = useSelector((state: any) => state.user.userData);
  const { authedDrives } = useSelector((state: any) => state.drives);
  const areTabsDisabled = authedDrives.length === 0;
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const [ present ] = useIonActionSheet();

  useEffect(() => {
    let userLS: any = localStorage.getItem('currentUser');
    let userObj = JSON.parse(userLS);
    if (userObj) {
      dispatch({ type: 'log_user_in', payload: userObj });
      void checkUserLtd();
    }
  }, []);

  useEffect(() => {
    if (isEmpty(user)) {
        return history.push('/login');
    }
    void getDrives();
    history.push('/');
  }, [user]);

  const checkUserLtd = async () => {
    const res = await api.post('users/auth/ltd', {
      userId: JSON.parse(localStorage.getItem('currentUser')!).id,
    });

    const { data: { isLtdUser } } = res.data;

    dispatch({ type: 'update_ltd', payload: {
      isLtdUser: isLtdUser || false,
    } });
  }

  const getDrives = async () => {
    const drivesResponse = await api.post('users/auth/verify', {
      userId: JSON.parse(localStorage.getItem('currentUser')!).id,
    });

    const { data: allDrives } = drivesResponse.data;

    const drives = allDrives && allDrives.filter((drive: any) => !drive.needsAuth);
    if (drives.length !== allDrives.length) {
      dispatch({ type: 'set_needs_auth', payload: true });
    }

    if (drives) {
      dispatch({ type: 'set_drives', payload: drives });
      dispatch({ type: 'set_drives_loading', payload: false });

      if (drives.length > 0) {
        dispatch({ type: 'set_active_drive', payload: drives[0] });
      }

    }
  };

  const logUserOut = () => {
    localStorage.removeItem('currentUser');
    dispatch({ type: 'log_user_out' });
  };

  return (
    <IonTabs>
      <IonRouterOutlet id="main">
        <Route exact path="/CloudManager">
          <CloudManager />
        </Route>
        <Route exact path="/transfers">
          <Transfers />
        </Route>
        <Route exact path="/NewTransfer">
          <NewTransfer />
        </Route>
        <Route path="/login">
          <Login />
        </Route>
        <Route path="/signup">
          <Signup />
        </Route>
        <Route exact path="/">
          <Home />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" className={classNames(styles.navigationBarWrapper, { [styles.hidden]: isEmpty(user) })}>
        <IonTabButton tab="Home" href="/" className={styles.menuItemWrapper}>
          <IonImg
              src={location.pathname === '/' ? filledHome : home}
              className={classNames(styles.navigationIcon)}
          />
          <IonLabel className={classNames(styles.navigationLabel, { [styles.activeTab]: location.pathname === '/' })}>
            Cloud
            <br />
            Home
          </IonLabel>
        </IonTabButton>
        <IonTabButton tab="CloudManager" href="/CloudManager" disabled={areTabsDisabled} className={styles.menuItemWrapper}>
          <IonImg
              src={location.pathname === '/CloudManager' ? filledManager : manager}
          />
          <IonLabel className={classNames(styles.navigationLabel, { [styles.activeTab]: location.pathname === '/CloudManager' })}>
            Cloud
            <br />
            Manager
          </IonLabel>
        </IonTabButton>
        <IonTabButton tab="CloudSync" href="/NewTransfer" disabled={areTabsDisabled}>
          <IonImg src={newTransfer} className={styles.newTransfer} />
          <IonLabel className={styles.navigationLabel}>
            New
            <br />
            Transfer
          </IonLabel>
        </IonTabButton>
        <IonTabButton tab="CloudBackup" href="/transfers" disabled={areTabsDisabled} className={styles.menuItemWrapper}>
          <IonImg
              src={location.pathname === '/transfers' ? filledTransfers : transfers}
          />
          <IonLabel className={classNames(styles.navigationLabel, { [styles.activeTab]: location.pathname === '/transfers' })}>
            Transfer
            <br />
            List
          </IonLabel>
        </IonTabButton>
        <IonTabButton
            tab="Settings"
            onClick={(e) => {
              e.stopPropagation();
              void present({
                header: 'Choose action',
                buttons: [
                  {
                    text: 'Join WhatsApp Community',
                    handler: () => {
                      window.open('https://chat.whatsapp.com/FXobl3HyZgUEqyUeIAdDf6', '_blank');
                    },
                  },
                  {
                    text: 'Log Out',
                    role: 'destructive',
                    handler: () => logUserOut(),
                  },
                  {
                    text: 'Cancel',
                    role: 'cancel'
                  }]
              })
            }}
            className={styles.menuItemWrapper}
        >
          <IonImg src={logout} className={styles.navigationIcon} />
          <IonLabel className={styles.navigationLabel}>
            App
            <br />
            Settings
          </IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default React.memo(NavigationBar);
