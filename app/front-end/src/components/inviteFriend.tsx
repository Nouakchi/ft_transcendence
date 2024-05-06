"use client";

import styles from './styles/inviteFriend.module.css';
import React, { useEffect, useState } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { InputGroup, Modal, Form, Button } from 'react-bootstrap';
import friends from './friends.json';
import Splayer from "./Splayer";
import Cookies from 'js-cookie';

import { TiUserAdd } from "react-icons/ti";
import { IoIosSearch, IoMdCheckmarkCircle, IoIosRemoveCircle } from "react-icons/io";
import { ImUserPlus , ImUserMinus , ImUsers } from "react-icons/im";
import { CgUnblock } from "react-icons/cg";

interface Props{
    show: boolean;
    close: () => void;
}

interface User {
  id: number;
  username: string;
  image_url: string;
}

interface Friend_ {
  user: User;
  is_accepted: boolean;
}

export default function InviteFriend( {show, close}: Props) {

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchedPendingFriends, setsearchedPendingFriends] = useState<Friend_[]>([]);
  const [searchedFriends, setsearchedFriends] = useState<Friend_[]>([]);
  const [users, setUsers] = useState<Friend_[]>([]);

  const fetchUsersData = async () => {
    const access = Cookies.get('access');
        if (access)
        {
          try {
            const res = await fetch('http://localhost:8000/api/friends', {
              headers: { Authorization: `Bearer ${access}` },
            });

            if (!res.ok)
              throw new Error('Failed to fetch data');

            const data = await res.json();
            const transData = data.friends.map((friend: Friend_) => ({
              user: {
                id: friend.user.id,
                username: friend.user.username,
                image_url: friend.user.image_url,
              },
              is_accepted: friend.is_accepted,
            }));

            setUsers(transData);
          } catch (error) {
              console.error('Error fetching data: ', error);
          }
        }
        else
          console.log('Access token is undefined or falsy');
  }

  const fetchSearchUser = async () => {
    const access = Cookies.get('access');
    if (access)
    {
      try {

        const res = await fetch('http://localhost:8000/api/user-search', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access}`
          },
          body: JSON.stringify({ username_search: searchTerm })
        });

        if (!res.ok)
          throw new Error('Failed to fetch data');

        const data = await res.json();
        const transData = data.map((user: User) => ({
          user: {
            id: user.id,
            username: user.username,
            image_url: user.image_url,
          },
          is_accepted: false,
        }));
        setsearchedFriends(transData);
        
      } catch (error) {
          console.error('Error fetching data: ', error);
      }
    }
    else
      console.log('Access token is undefined or falsy');
  }

  useEffect(() => {
    if (show)
      fetchUsersData();
  }, [show]);

  useEffect(() => {
    if (users)
    {
      setsearchedFriends(users.filter(friend => friend.is_accepted));
      setsearchedPendingFriends(users.filter(friend => !friend.is_accepted));
    }
  }, [users])

    
    const handle_search = () => {
      if (users)
      {
        const foundFriends = users.filter(friend => friend.is_accepted);
        if (searchTerm === '')
          setsearchedFriends(foundFriends);
        else
        {
          const data = foundFriends.filter(friend => friend.user.username.toLowerCase().startsWith(searchTerm.toLowerCase()));
          if (data.length !== 0)
            setsearchedFriends(data);
          else
            fetchSearchUser();
        }
      }
    }

    const handle_pending_search = () => {
      if (users)
      {
        const foundPendingFriends = users.filter(friend => !friend.is_accepted);
        if (searchTerm === '')
          setsearchedPendingFriends(foundPendingFriends);
        else
        {
          const foundFriends = foundPendingFriends.filter(friend => friend.user.username.toLowerCase().startsWith(searchTerm.toLowerCase()));
          setsearchedPendingFriends(foundFriends);
        }
      }
    }

    return (
        <>
            <Modal contentClassName={`${styles.friend_modal}`} show={show} aria-labelledby="add_friend" centered>
                    <Tabs
                      defaultActiveKey="friends"
                      id="justify-tab-example"
                      className="mb-3"
                      justify
                      transition={true}
                      style={{fontFamily: 'itim'}}
                    >
                      <Tab eventKey="friends" title="Friends" tabClassName={`${styles.tabs} ${styles.tabs_friend}`}>
                        <Modal.Header className='d-flex flex-column'>
                          <Modal.Title>
                            <span style={{color:'#FFEBEB', fontFamily: 'itim'}}><ImUserPlus color="#FFEBEB"/> Add Friend</span>
                          </Modal.Title>
                          <InputGroup className="mb-3" >
                            <InputGroup.Text id="basic-addon1" style={{backgroundColor: '#2C3143'}}><IoIosSearch color='#FFEBEB'/></InputGroup.Text>
                            <Form.Control
                                className={`${styles.form_control}`}
                                placeholder="Username"
                                aria-label="Username"
                                aria-describedby="basic-addon1"
                                style={{backgroundColor: '#2C3143'}}
                                value={searchTerm}
                                onChange={(e) => {setSearchTerm(e.target.value)}}
                            />
                            <Button className='border' variant="dark" id="button-addon2" onClick={handle_search}>
                              Search..
                            </Button>
                          </InputGroup>
                        </Modal.Header>
                        <Modal.Body style={{height: '200px', overflow: 'auto'}}>
                          { searchedFriends &&
                            searchedFriends.map((friend, index) =>
                                (
                                    <div key={index} className='row d-flex flex-row d-flex align-items-center justify-content-between px-3 py-1 m-2' style={{ borderRadius: '25px', backgroundColor: '#161625' }}>
                                        <div className='col-3 text-start'><Splayer nickname={friend.user.username} id={1} image={'/char3.png'} isConnected={false} /></div>
                                        {
                                          friend.is_accepted ? (
                                            <div className='col-9 text-end'><Button variant="dark">Remove <IoIosRemoveCircle color="#FFEBEB" /></Button></div>
                                          ) : (
                                            <div className='col-9 text-end'><Button variant="dark">Invite <TiUserAdd color="#FFEBEB" /></Button></div>
                                          )
                                        }
                                        
                                    </div>
                                )
                            )
                          }
                        </Modal.Body>
                      </Tab>
                      <Tab eventKey="pending" title="Pending" tabClassName={`${styles.tabs} ${styles.tabs_pending}`}>
                        <Modal.Header className='d-flex flex-column'>
                          <Modal.Title>
                            <span style={{color:'#FFEBEB', fontFamily: 'itim'}}><ImUsers color="#FFEBEB"/> Pending Users</span>
                          </Modal.Title>
                          <InputGroup className="mb-3" >
                            <InputGroup.Text id="basic-addon1" style={{backgroundColor: '#2C3143'}}><IoIosSearch color='#FFEBEB'/></InputGroup.Text>
                            <Form.Control
                                className={`${styles.form_control}`}
                                placeholder="Username"
                                aria-label="Username"
                                aria-describedby="basic-addon1"
                                style={{backgroundColor: '#2C3143'}}
                                value={searchTerm}
                                onChange={(e) => {setSearchTerm(e.target.value)}}
                            />
                            <Button className='border' variant="dark" id="button-addon2" onClick={handle_pending_search}>
                              Search..
                            </Button>
                          </InputGroup>
                        </Modal.Header>
                        <Modal.Body style={{height: '200px', overflow: 'auto'}}>
                          { searchedPendingFriends &&
                            searchedPendingFriends.map((friend, index) =>
                                (
                                    <div key={index} className='row d-flex flex-row d-flex align-items-center justify-content-between px-3 py-1 m-2' style={{ borderRadius: '25px', backgroundColor: '#161625' }}>
                                        <div className='col-3 text-start'><Splayer nickname={friend.user.username} id={1} image={'/char3.png'} isConnected={false} /></div>
                                        <div className='col-9 text-end'><Button variant="dark">Accept <IoMdCheckmarkCircle color="#FFEBEB" /></Button></div>
                                    </div>
                                )
                            )
                          }
                        </Modal.Body>
                      </Tab>
                      <Tab eventKey="blocked" title="Blocked" tabClassName={`${styles.tabs} ${styles.tabs_blocked}`}>
                        <Modal.Header className='d-flex flex-column'>
                          <Modal.Title>
                            <span style={{color:'#FFEBEB', fontFamily: 'itim'}}><ImUserMinus color="#FFEBEB"/> Blocked Users</span>
                          </Modal.Title>
                          <InputGroup className="mb-3" >
                            <InputGroup.Text id="basic-addon1" style={{backgroundColor: '#2C3143'}}><IoIosSearch color='#FFEBEB'/></InputGroup.Text>
                            <Form.Control
                                className={`${styles.form_control}`}
                                placeholder="Username"
                                aria-label="Username"
                                aria-describedby="basic-addon1"
                                style={{backgroundColor: '#2C3143'}}
                                value={searchTerm}
                                onChange={(e) => {setSearchTerm(e.target.value)}}
                            />
                            <Button className='border' variant="dark" id="button-addon2" onClick={() => alert()}>
                              Search..
                            </Button>
                          </InputGroup>
                        </Modal.Header>
                        <Modal.Body style={{height: '200px', overflow: 'auto'}}>
                          { searchedFriends &&
                            searchedFriends.map((friend, index) =>
                                (
                                    <div key={index} className='row d-flex flex-row d-flex align-items-center justify-content-between px-3 py-1 m-2' style={{ borderRadius: '25px', backgroundColor: '#161625' }}>
                                        <div className='col-3 text-start'><Splayer nickname={friend.user.username} id={1} image={'/char3.png'} isConnected={false} /></div>
                                        <div className='col-9 text-end'><Button variant="dark">Unblock <CgUnblock color="#FFEBEB" /></Button></div>
                                    </div>
                                )
                            )
                          }
                        </Modal.Body>
                      </Tab>
                    </Tabs>
                <Modal.Footer>
                        <div className={`${styles.edit_btn} col-md-3 col-sm-5 valo-font text-center m-2 px-2`} onClick={close}><button onClick={close}>Close</button></div>
                </Modal.Footer>
            </Modal>
        </>
    );
}