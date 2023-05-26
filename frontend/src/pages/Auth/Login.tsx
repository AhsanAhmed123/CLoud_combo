import { IonContent, IonImg, IonPage, IonTitle } from '@ionic/react';
import React, { useState } from 'react';
import api from "../../api_instance";
import { IonGrid, IonRow, IonCol } from '@ionic/react';
import authHeader from '../../assets/svgs/auth_header.svg'
import { useHistory } from 'react-router-dom';
import { IonItem, IonLabel, IonInput, IonButton, IonAlert } from '@ionic/react';
import { useDispatch } from 'react-redux';
import styles from "../../styles/Auth.module.css";
import classNames from 'classnames';

function validateEmail(email: string) {
  const re =
    /^((?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\]))$/;
  return re.test(String(email).toLowerCase());
}

const Login: React.FC = () => {
    const dispatch = useDispatch();

    const history = useHistory();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isError, setIsError] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [disableButton, setDisableButton] = useState<boolean>(false);

    // const arrayToTree = (arr: any, parent: string) =>
    //     arr
    //         .filter((item: any) => (item.parents ? item.parents.includes(parent) : false))
    //         .map((child: any) => ({ ...child, children: arrayToTree(arr, child.id) }));

    const handleLogin = async () => {
        if (email === '' || password === '') {
            setIsError(true);
            setMessage('Please fill in all fields');
            return;
        }
        if (!validateEmail(email)) {
          setMessage('Your email is invalid');
          setIsError(true);
          return;
        }

        setDisableButton(true);

        const loginData = {
          email: email,
          password: password,
        };

        try {
          const result = await (await api.post('/users/login', loginData)).data;

          if (result.success) {
            let user = {
              id: result.data.id,
              email: result.data.email,
              isLtdUser: result.data.isLtdUser,
            };

            localStorage.setItem('currentUser', JSON.stringify(user));
            dispatch({ type: 'log_user_in', payload: user });

            setEmail('');
            setPassword('');
            } else {
                setMessage('Something went wrong, please try again.');
                setIsError(true);
                return;
            }
        } catch (error: any) {
          setMessage(error?.response?.data?.message);
          setIsError(true);
          return;
        } finally {
            setDisableButton(false);
        }
    };

  const handleSignup = () => {
    setEmail('');
    setPassword('');
    history.push('/signup');
  };

    return (
        <IonPage>
            <IonContent fullscreen className={classNames('ion-text-center', styles.authScreen)}>
                <IonImg src={authHeader} />
                <IonGrid className={styles.content}>
                    <IonRow>
                        <IonCol>
                            <IonAlert
                                isOpen={isError}
                                onDidDismiss={() => setIsError(false)}
                                cssClass="my-custom-class"
                                header={"Attention"}
                                message={message}
                                buttons={["Dismiss"]}
                            />
                        </IonCol>
                    </IonRow>
                    <IonRow className={styles.titleWrapper}>
                        <IonCol>
                            <IonTitle className={styles.title}>Sign In</IonTitle>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonItem className={styles.inputWrapper}>
                                <IonLabel position="stacked" mode="ios" className={styles.inputLabel}>Email Address</IonLabel>
                                <IonInput
                                    type="email"
                                    inputmode="email"
                                    placeholder="Email"
                                    value={email}
                                    onIonChange={(e) => setEmail(e.detail.value!)}
                                    className={styles.input}
                                    enterkeyhint="next"
                                />
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    <IonRow>
                        <IonCol>
                            <IonItem className={styles.inputWrapper}>
                                <IonLabel position="stacked" mode="ios" className={styles.inputLabel}>Password</IonLabel>
                                <IonInput
                                    type="password"
                                    placeholder="********"
                                    value={password}
                                    onIonChange={(e) => setPassword(e.detail.value!)}
                                    className={styles.input}
                                    enterkeyhint="done"
                                >
                                </IonInput>
                            </IonItem>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonButton
                                expand="block"
                                className={styles.submit}
                                onClick={handleLogin}
                                disabled={disableButton}
                            >
                                Sign in
                            </IonButton>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol className={styles.authActionWrapper}>
                            <IonLabel className={styles.authActionLabel}>Don't have an account yet?</IonLabel>
                            <IonButton
                                fill="clear"
                                className={styles.authActionButton}
                                onClick={handleSignup}
                            >
                                Sign up
                            </IonButton>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default Login;
