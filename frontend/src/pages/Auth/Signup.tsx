import {
    IonAlert,
    IonButton,
    IonCol,
    IonContent,
    IonGrid,
    IonImg,
    IonInput,
    IonItem,
    IonLabel,
    IonPage,
    IonRow,
    IonTitle
} from '@ionic/react';
import React, { useState } from 'react';
import api from '../../api_instance';
import { useHistory } from "react-router-dom";
import styles from "../../styles/Auth.module.css";
import classNames from "classnames";
import authHeader from "../../assets/svgs/auth_header.svg";
import { useDispatch } from "react-redux";

function validateEmail(email: string) {
    const re = /^((?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\]))$/;
    return re.test(String(email).toLowerCase());
}

function validatePassword(password: string) {
    const re = /^(?=.*[!@#$%^&*]).{8,}$/;
    return re.test(password);
}

const Signup: React.FC = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [isError, setIsError] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");
    const [disableButton, setDisableButton] = useState<boolean>(false);

    const handleSignup = async () => {
        if (email === "" || password === "") {
            setIsError(true);
            setMessage("Please fill in all fields");
            return;
        }
        if (!validateEmail(email)) {
            setMessage("Please enter a valid email");
            setIsError(true);
            return;
        }
        if (!validatePassword(password)) {
            setMessage("Password must have at least 8 characters and one special character");
            setIsError(true);
            return;
        }

        setDisableButton(true);

        const signupData = {
            email: email,
            password: password
        };

        try {
            const result = await (await api.post("users/signup", signupData)).data;

            if (result.success) {
                let user = {
                    id: result.data.id,
                    email: result.data.email,
                    isLtdUser: result.data.isLtdUser,
                };

                localStorage.setItem('currentUser', JSON.stringify(user));
                resetForm();
                dispatch({ type: 'log_user_in', payload: user });
            } else {
                setMessage(result.message);
                setIsError(true);
                return;
            }
        } catch (error) {
            setMessage("Failed to signup user");
            setIsError(true);
            return;
        } finally {
            setDisableButton(false);
        }

    };

    const handleLogin = () => {
        resetForm();
        history.push('/login');
    }

    const resetForm = () => {
        setEmail("");
        setPassword("");
    }

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
                            <IonTitle className={styles.title}>Sign Up</IonTitle>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonItem className={styles.inputWrapper}>
                                <IonLabel position="stacked" mode="ios" className={styles.inputLabel}>Email</IonLabel>
                                <IonInput
                                    type="email"
                                    inputMode="email"
                                    inputmode="email"
                                    placeholder={"Enter your email"}
                                    value={email}
                                    className={styles.input}
                                    onIonChange={(e) => setEmail(e.detail.value!)}
                                    enterkeyhint="next"
                                >
                                </IonInput>
                            </IonItem>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonItem className={styles.inputWrapper}>
                                <IonLabel position="stacked" mode="ios" className={styles.inputLabel}>Password</IonLabel>
                                <IonInput
                                    type="password"
                                    value={password}
                                    placeholder={"********"}
                                    className={styles.input}
                                    onIonChange={(e) => setPassword(e.detail.value!)}
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
                                onClick={handleSignup}
                                disabled={disableButton}
                            >
                                Sign Up
                            </IonButton>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol className={styles.authActionWrapper}>
                            <IonLabel className={styles.authActionLabel}>Already have an account?</IonLabel>
                            <IonButton
                                fill="clear"
                                className={styles.authActionButton}
                                onClick={handleLogin}
                            >
                                Sign in
                            </IonButton>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default Signup;
