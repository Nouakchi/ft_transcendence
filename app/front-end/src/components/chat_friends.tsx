"use client";
import styles from './styles/chat_friends.module.css';
import Image from 'next/image';
import { InputGroup } from 'react-bootstrap';
import UserChat from './user_chat';
import Form from 'react-bootstrap/Form';
import { useEffect, useState } from 'react';
import User from './user';
import { CiSearch } from "react-icons/ci";
import Cookies from 'js-cookie';

interface Props{
		setShow: React.Dispatch<React.SetStateAction<boolean>>;
		setAbout: React.Dispatch<React.SetStateAction<boolean>>;
}

interface User {
		id: number;
		username: string;
		image_url: string;
	}

export default function ChatFriends( {setShow , setAbout}: Props ) {

	const   [chatUsers, setChatUsers] = useState<User[]>([]);
	let		sortedData = null;
	// const   [friendsData, setFriendsData] = useState<User[]>([]);

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
							const transData = data.friends.map((friend: User) => ({
									id: friend.id,
									username: friend.username,
									image_url: friend.image_url,
							}));
	
							setChatUsers(transData);
						} catch (error) {
								console.error('Error fetching data: ', error);
						}
					}
					else
						console.log('Access token is undefined or falsy');
	}

	useEffect(() => {
		fetchUsersData();
	}, []);

	// useEffect(() => {
	// 		sortedData = chatUsers.map((user: User, index: number) => 
	// 				<User key={index} src={user.image_url} isConnected={true}/>
	// 		);

	// 		// setFriendsData(sortedData);
	// }, [chatUsers]);

		const handleShow = () => setAbout(true);

		return (
				<>
						<div className="d-flex flex-column vh-100">
							<div className="">
								<div className={`${styles.welcome}`}>
										<span className={`d-flex flex-column p-2 text-center valo-font`}>
												<span className='display-5' style={{color: '#FF4755'}}>GAME HUB</span>
												<span className='h2' style={{color: '#FFEBEB'}}>LET'S CHAT</span>
												<span className='h2' style={{color: '#FFEBEB'}}>& PLAY</span>
										</span>
										<Image className={`${styles.welcome_img}`} width={300} height={300} src="/welcome.png" alt='welcome' />
								</div>
									<div className={`mx-3 mb-2`}>
											<InputGroup size="lg">
												<InputGroup.Text style={{backgroundColor: '#2C3143'}}><CiSearch color='#FFEBEB'/></InputGroup.Text>
												<Form.Control className={`${styles.form_control}`} type="text" color='red' aria-label='search' placeholder='Enter for search...' style={{backgroundColor: '#2C3143'}}/>
											</InputGroup>
									</div>
									<div className={`${styles.usr_container} d-flex overflow-auto`}>
											{sortedData}
									</div>
									<hr className="mt-1" style={{color: '#FFEBEB', borderWidth: '2px'}}/>
							</div>
							<div className={`${styles.chat_container} p-2 flex-grow-1`}>
											<UserChat setShow={setShow} handleShow={handleShow}/>
											<UserChat setShow={setShow} handleShow={handleShow}/>
											<UserChat setShow={setShow} handleShow={handleShow}/>
											<UserChat setShow={setShow} handleShow={handleShow}/>
							</div>
						</div>
				</>
		);
}