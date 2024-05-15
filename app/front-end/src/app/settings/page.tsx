'use client'

import React,  { ChangeEvent, useState, useEffect, useRef, MutableRefObject } from 'react'
import Cookies from 'js-cookie'
import styles from './styles.module.css'
import AccountTab from '@/components/SettingsForm/account-tab/accountTab'
import SecurityTab from '@/components/SettingsForm/security-tab/security'
import { FormContext, SettingsProps } from '@/components/SettingsForm/form-components/formContext'
import { toast } from 'react-toastify';
import { notificationStyle } from '@/components/ToastProvider'


async function    getInitialData({setValuesToPost, setAccountValues} :
    {
        setValuesToPost : SettingsProps['setValuesToPost'],
        setAccountValues : SettingsProps['setAccountValues']
    }) {

    try {
        const   access = Cookies.get('access');
        const   response = await fetch('', {
            method : "GET",
            headers :{ Authorization : `Bearer ${access}` },
        })

        // const data = await response.json();
        setValuesToPost(
            {
                "first_name" : "Mushigarou",
                "last_name" : "HobaHoba",
                "nickname" : "saba",
                "email" : "hey@hey.com",
                "country" : "Morocco",
                "city" : "",
                "image" : "C:/ste7/nte7",
                "new_password" : "",
                "repeat_password" : "",
                "is_two_fact" : false,
                "two_fact_secret" : ""
            }
        )
        setAccountValues(
            {
                "first_name" : "Mushigarou",
                "last_name" : "HobaHoba",
                "nickname" : "saba",
                "email" : "hey@hey.com",
                "country" : "Morocco",
                "city" : "",
                "image" : "C:/ste7/nte7",
                "new_password" : "",
                "repeat_password" : "",
                "is_two_fact" : false,
                "two_fact_secret" : ""
            }
        )
    } catch(error) {
        console.error("Unexpected error : ", error);
    }
}

/* Submits the form */
const   postFormData = async ({valuesToPost, isChanged} :
    {
        valuesToPost : SettingsProps['valuesToPost'],
        isChanged : MutableRefObject<boolean>
    }) => {
    try {

        const   validateEmail : (email : string) => boolean = (email) => {
            let rgx : RegExp = /^([a-zA-Z0-9\._]+)@([a-zA-Z0-9])+.([a-z]+)(.[a-z]+)?$/;
            return rgx.test(email);
        }

        const   validateInput : () => boolean = () => {
            const   toCheck : string[] = ["first_name", "last_name", "nickname"];
            let     isValid : boolean = true;

            toCheck.map((key) => {
                if (valuesToPost[key] === "") {
                    toast.error(`Invalid input : ${key}`, notificationStyle)
                    isValid = false;
                }
            });
            if (! validateEmail(valuesToPost["email"] as string)) {
                toast.error(`Invalid input : email`, notificationStyle);
                isValid = false;
            }

            if (valuesToPost['new_password'] !== valuesToPost['repeat_password']) {
                toast.error(`Invalid input : new_password or repeat_password`, notificationStyle);
                isValid = false;
            }
            return isValid;
        }

        if (isChanged.current && validateInput()) {
            isChanged.current = false;
            const   access = Cookies.get('access');
            
            console.log('------> JSON To Post', JSON.stringify(valuesToPost));
            const   res = await fetch('', {
            method : "POST",
            headers : {
                "content-type" : "application/json",
                "Authorization" : `Bearer ${access}`
                },
                body : JSON.stringify(valuesToPost)
            });

            if (res.ok) {
                toast.success("To be saved...", notificationStyle);
                /* .... updates form placeholders */
            }
        }

    } catch (error) {
        console.error("Unexpected error : ", error);
    }
}

function    SettingsPage()
{
    const   [valuesToPost, setValuesToPost] =  useState<SettingsProps['valuesToPost']>({})
    const   [accountValues, setAccountValues] = useState<SettingsProps['accountValues']>({});
    const   [tab, setTab] = useState<string>("account");
    const   isChanged = useRef<boolean>(false);

    /* Updates a specific field of the input */
    const   updateField = (key : string, value : string | boolean) => {
        const   newValues = { ...accountValues };
        newValues[key] = value;
        setAccountValues(newValues);
    }

    /* Compares values in  [accountValues, valuesToPost] */    
    const   checkDifferences = () => {
        const   compareDictValues = (d1 : SettingsProps['accountValues'], d2 : SettingsProps['valuesToPost']) => {
            let count : number = 0;
            for (const key in d1) {
                if (d1[key] !== d2[key]) {
                    break ;
                }
                count++;
            }

            return ( ! (Object.entries(d1).length === count) )
        }

        const updatePostValues = (values: SettingsProps['accountValues']) => {

            let newValues: SettingsProps['accountValues'] = { ...values };
            for (const [key, value] of Object.entries(values)) {
                newValues[key] = value;
            }
            if (compareDictValues(accountValues, valuesToPost)) {
                setValuesToPost(newValues);
                isChanged.current = true;
            }
        }

        updatePostValues(accountValues)
    }
    
    /*  Gets Initial Values From Backend */
    useEffect(() => {
        getInitialData({setValuesToPost, setAccountValues});
    }, []);

    /*  Updates PostValues */
    useEffect(() => {
        checkDifferences();
    }, [accountValues])

    return (
        <div className={` ${styles.wrapper} container-fluid vh-100  -warning p-0 m-0`}>
            <div className="row h-100 p-0 m-0">

                <section className="row p-0 m-0 mt-5">
                    <div className="col">
                        <h1 className="valo-font">SETTINGS</h1>
                    </div>
                </section>

                <main className={`${styles.main_container} row p-0 m-0 my-5 justify-content-center align-items-center`}>
                    <form className={`row ${styles.form_container} p-0 m-0 justify-content-center align-items-center`}>

                        <fieldset className={`${styles.tab_container} row p-0 m-0`}>
                            <div className="col m-2 p-2 d-flex flex-row flex-nowrap">
                                <h2 className="col-4 m-1 col-xl-2 itim-font" onClick={() => setTab("account")}>Account</h2>
                                <h2 className="col-4 m-1 col-xl-2 itim-font" onClick={() => setTab("security")}>Security</h2>
                                <h2 className="col-4 m-1 col-xl-2 itim-font" onClick={() => setTab("game")}>Game</h2>
                            </div>
                        </fieldset>
                    <FormContext.Provider value={{accountValues, valuesToPost, updateField, setValuesToPost, setAccountValues}}>
                        <div className={`${styles.content_container} row  p-0 m-0  justify-content-center align-items-center`}>
                            {
                                tab === "account" &&  <AccountTab/>
                                ||
                                tab === "security" &&  <SecurityTab/>
                            }
                        </div>
                    </FormContext.Provider>

                    </form>
                    <div className="col-12 d-flex justify-content-center my-4">
                        <button
                            className={`valo-font col-8 col-md-6 ${styles.create_button}`}
                            onClick={() =>{ postFormData({valuesToPost, isChanged}) } }>
                                SAVE
                        </button>
                    </div>
                </main>
                </div>

        </div>
    );
}

export default SettingsPage;