// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useEffect, useState } from 'react';
import {
  getAuth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  Auth,
  ConfirmationResult,
} from "firebase/auth";
import { initializeApp } from 'firebase/app';
import { configExample } from './config.example';
import './sign-up.css';
import { jsObjToJson } from './js-obj-to-json.util';
import { anny } from '@firebase-phone-web-auth/types';

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace window {
  let recaptchaVerifier: RecaptchaVerifier;
  let confirmationResult: ConfirmationResult;
};

export const SignUp = () => {
  const configId = 'firebase-config-textarea';
  let offTimeout: any = null;
  const [config, setConfig] = useState('');
  const [isFocusConfig, setIsFocusConfig] = useState(true);
  const [isConfigReady, setIsConfigReady] = useState(false);
  // const [isShowConfig, setIsShowConfig] = useState(true);
  const [isDisableConfig, setIsDisableConfig] = useState(false);
  const [configJsonError, setConfigJsonError] = useState('');
  const [auth, setAuth] = useState<null | Auth>(null);
  // Json-config textarea
  const CONFIG_TEXTAREA = <>
    <textarea
      id={configId}
      value={config}
      disabled={isDisableConfig}
      style={{
        backgroundColor: configJsonError ? 'pink' : 'inherit',
      }}
      placeholder={JSON.stringify(configExample, null, 4)}
      onChange={(event) => {
        const { value } = event.currentTarget;

        setConfig(value);

        if (!value.length) {
          setConfigJsonError('');

          return;
        }

        try {
          const jData = jsObjToJson(value);

          if (!jData || !Object
            .keys(configExample)
            .every((k) => Object.keys(JSON.parse(jData)).includes(k))) {

            throw new Error(`Config should have: ${Object
              .keys(configExample)}`);
          }

          setIsConfigReady(true);
          setIsDisableConfig(true);
          setIsShowPhone(true);
          setIsFocusConfig(false);
          setIsFocusPhone(true);

          setConfigJsonError('');
        } catch (error: anny) {
          setConfigJsonError(error.message);
        }
      }}
    />
    {configJsonError && <label style={{
      color: 'red',
      display: 'block'
    }}>{configJsonError}</label>}
  </>;

  // Prepare firebase auth-configuration
  useEffect(() => {
    if (!isConfigReady) return;

    const _auth = getAuth(initializeApp(JSON.parse(jsObjToJson(config) as anny) as anny));

    setAuth(_auth);
    setIsConfigReady(false);
    window.recaptchaVerifier = new RecaptchaVerifier('captcha', {
      size: 'invisible',
      callback(res: unknown) {
        console.info('RecaptchaVerifier.callback res', res);
      },
    }, _auth);
  }, [isConfigReady]);


  const phoneId = 'phone-number-input';
  const [phone, setPhone] = useState('');
  const [isFocusPhone, setIsFocusPhone] = useState(false);
  const [isDisablePhone, setIsDisablePhone] = useState(false);
  const [isShowPhone, setIsShowPhone] = useState(false);
  const [sendPhone, setSendPhone] = useState(false);
  // Phone number input
  const PHONE_INPUT = <input
    id={phoneId}
    placeholder='phone number'
    type={'text'}
    value={phone}
    disabled={isDisablePhone}
    style={{
      display: isShowPhone ? 'block' : 'none',
    }}
    onChange={(event) => {
      const { value } = event.currentTarget;

      setPhone(value);

      if (value.length === 12) {
        offTimeout = setTimeout(() => {
          setSendPhone(true);
          setIsDisablePhone(true);
          offTimeout = null;
        }, 3000);
      }

      if (value.length === 13) {
        offTimeout && clearTimeout(offTimeout);
        setSendPhone(true);
        setIsDisablePhone(true);
      }
    }}
  />;
  // Send phone number
  useEffect(() => {
    if (!sendPhone || !auth) return;

    setSendPhone(false);
    signInWithPhoneNumber(auth, phone, window.recaptchaVerifier)
      .then((result) => {
        window.confirmationResult = result;
        console.log(JSON.stringify(result));
        setIsFocusPhone(false);
        setIsShowCode(true);
        setIsFocusCode(true);
      }).catch(console.error);
  }, [sendPhone]);
  const codeId = 'code-from-sms-input';
  const [code, setCode] = useState('');
  const [isFocusCode, setIsFocusCode] = useState(false);
  const [isDisableCode, setIsDisableCode] = useState(false);
  const [isShowCode, setIsShowCode] = useState(false);
  const [sendCode, setSendCode] = useState(false);
  // Sms code input
  const CODE_INPUT = <input
    id={codeId}
    placeholder='code from sms'
    type={'text'}
    value={code}
    disabled={isDisableCode}
    style={{
      display: isShowCode ? 'block' : 'none',
    }}
    onChange={(event) => {
      const { value } = event.currentTarget;

      setCode(value);

      if (value.length === 6) {
        setIsDisableCode(true);
        setIsFocusCode(false);
        setSendCode(true);
      }
    }}
  />;
  /**
   * Firebase user
   */
  const [user, setUser] = useState<null | object>(null);
  // Send code
  useEffect(() => {
    if (!sendCode) return;
    setSendCode(false);
    window.confirmationResult
      .confirm(code)
      .then(({ user }) => {
        setUser(user.toJSON());
      }).catch((error) => {
        console.error(error);
      });
  }, [sendCode]);
  // Autofocus on inputs
  useEffect(() => {
    if (isFocusConfig) {
      document.getElementById(configId)?.focus();
    } else if (isFocusPhone) {
      document.getElementById(phoneId)?.focus();
    } else if (isFocusCode) {
      document.getElementById(codeId)?.focus();
    }
  }, [isFocusPhone, isFocusCode, isFocusConfig]);

  return (
    <div>
      <div id='captcha' />
      {CONFIG_TEXTAREA}
      {PHONE_INPUT}
      {CODE_INPUT}
      {user && <button
        onClick={() => {
          navigator
            .clipboard
            .writeText((user as anny).stsTokenManager.accessToken);
        }}
      >Copy 'accessToken' to clipboard</button>}
      {user && <pre>{JSON.stringify(user, null, 8)}</pre>}
    </div>
  );
}
