import {
    IonAlert,
    IonApp,
    setupIonicReact,
} from '@ionic/react';
import React, { useEffect } from 'react';
import { IonReactRouter } from '@ionic/react-router';
import NavigationBar from "./components/NavigationBar";
import * as Sentry from '@sentry/capacitor';
import * as SentrySibling from '@sentry/react';
import { BrowserTracing } from "@sentry/tracing";
import { Integration } from '@sentry/types';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import api from './api_instance';


/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import './theme/tabs.css';
import './theme/global.css';
import './theme/utility.css';

const config = require('./config.json');





setupIonicReact();




interface AppConfig {
    NODE_PROD_URL: string;
    // Other properties...
  }

const App: React.FC = () => {
    const [showAppUpdate, setShowAppUpdate] = React.useState(false);

    useEffect(() => {
        Sentry.init(
            {
                dsn: process.env.SENTRY_DSN || (config as any).SENTRY_DSN,
                release: '1.0.0',
                dist: '1',
                // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
                // We recommend adjusting this value in production.
                tracesSampleRate: 1.0,
                integrations: [
                    new BrowserTracing({
                       tracingOrigins: ['localhost', config.NODE_PROD_URL],
                    }) as unknown as Integration,
                ]
            },
            // Forward the init method to the sibling Framework.
            SentrySibling.init
        );

        const platform = Capacitor.getPlatform();
        if (platform !== 'web') {
            void checkForUpdates();
        }
    }, []);

    const checkForUpdates = async () => {
        const response = await api.post('users/app-version');
        const version = response.data.data;
        const appInfo = await CapacitorApp.getInfo();

        if (Capacitor.getPlatform() === 'ios' && appInfo.version === '1.0.4' && version === '1.0.3') {
            return;
        }

        if (appInfo.version !== version) {
            setShowAppUpdate(true);
        }
    }

    const openStore = async (platform: any) => {
        if (platform === 'ios') {
            await Browser.open({ url: 'itms-apps://https://apps.apple.com/app/cloud-combo/id1671984457' });
            return;
        }

        await Browser.open({ url: 'https://play.google.com/store/apps/details?id=cloud.combo.app&hl=en&gl=US' });
    }

    return (
        <IonApp>
            <IonAlert
                isOpen={showAppUpdate}
                header={"Attention!"}
                message={"There is a new version of the app available. Please update the app in the market and launch it again."}
                backdropDismiss={false}
                buttons={[
                    {
                        text: 'OK',
                        handler: () => {
                            openStore(Capacitor.getPlatform());
                        }
                    }
                ]}
            />
            <IonReactRouter>
                <NavigationBar />
            </IonReactRouter>
        </IonApp>
    )
};

export default App;
