"use client";

import { InputGroup } from 'react-bootstrap';
import styles from './style.module.css';
import Image from 'next/image';
import User from '../../components/user';
import friends from '../../components/friends.json'

import { CiSearch } from "react-icons/ci";
import Form from 'react-bootstrap/Form';
import UserChat from '@/components/user_chat';

export default function ()
{
    const friendsData = friends.sort((usr1, usr2) => {
        if (usr1.connected && !usr2.connected) {
            return -1;
        }
          // Sort disconnected users second
        if (!usr1.connected && usr2.connected) {
            return 1;
        }
          // Sort by ID if isConnected flag is the same
        return usr1.id - usr2.id;
    })
    // .slice(0, 5)
    .map((user, index) => 
        <User key={index} src={user.image_url} isConnected={user.connected}/>
    );;
    return (
        <>
            <div className="row vh-100 p-0 m-0 ">
              <div className="col-10 p-0 m-0 d-flex flex-row ">
                <div className="col-4 ">
                  <div className="d-flex flex-column  vh-100">
                    <div className="w-100">
                        <div className={`${styles.welcome}  text-start`}>
                            <span className='d-flex flex-column p-2 text-center valo-font '>
                                <span className='display-5' style={{color: '#FF4755'}}>GAME HUB</span>
                                <span className='h2' style={{color: '#FFEBEB'}}>LET'S CHAT</span>
                                <span className='h2' style={{color: '#FFEBEB'}}>& PLAY</span>
                            </span>
                            <Image className={`${styles.welcome_img}`} width={200} height={200} src="/welcome.png" alt='welcome'/>
                        </div>
                        <div className={`mx-3 mb-2`}>
                            <InputGroup size="lg">
                              <InputGroup.Text style={{backgroundColor: '#2C3143'}}><CiSearch color='#FFEBEB'/></InputGroup.Text>
                              <Form.Control className={`${styles.form_control}`} type="text" color='red' aria-label='search' placeholder='Enter for search...' style={{backgroundColor: '#2C3143'}}/>
                            </InputGroup>
                        </div>
                        <div className={`${styles.usr_container} d-flex overflow-auto`}>
                            {friendsData}
                        </div>
                        <hr className="m-3" style={{color: '#FFEBEB', borderWidth: '2px'}}/>
                    </div>
                    <div className={`${styles.chat_container} p-2 flex-grow-1`}>
                            <UserChat />
                            <UserChat />
                            <UserChat />
                            <UserChat />
                            <UserChat />
                            <UserChat />
                            <UserChat />
                            <UserChat />
                            <UserChat />
                            <UserChat />
                            <UserChat />
                    </div>
                  </div>
                </div>
                <div className="col-8 p-0 m-0 border border-warning">

                </div>
              </div>
              <div className="col-2 p-0 m-0 border">

              </div>
            </div>

        </>
    );
}