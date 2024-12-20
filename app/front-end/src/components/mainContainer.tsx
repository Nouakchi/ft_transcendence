'use client';
import { FaAngleLeft } from 'react-icons/fa';
import Offcanvas from 'react-bootstrap/Offcanvas';
import React, { useState, useEffect, useMemo } from 'react';
import SideBar from './sideBar';
import RightBar from './rightBar';
import SrightBar from './srightBar';
import Togglebar from './toggleBar';
import styles from './styles/mainContainer.module.css';
import InviteFriend from './inviteFriend';
import { useGlobalContext } from './webSocket';
import Spinner from 'react-bootstrap/Spinner';
import Cookies from 'js-cookie';

interface FriendSocket {
    id: number;
    username: string;
    image_url: string;
    connected: boolean;
}

interface User {
    id: number;
    username: string;
    image_url: string;
    is_online: number;
}

interface UserNotification {
    id: number;
    username: string;
}

interface Notification {
    notification_id: number;
    image_url: string;
    message: string;
    title: string;
    link: string;
    count: number;
    is_chat_notif: boolean;
    is_friend_notif: boolean;
    is_tourn_notif: boolean;
    is_match_notif: boolean;
    action_by: string;
}

interface Friend {
    user: User;
    is_accepted: boolean;
}

interface ApiData {
    id: number;
    username: string;
    friends: Friend[];
}

export default function MainContainer({ children }: { children: React.ReactNode }) {
    const [show, setShow] = useState<boolean>(false);
    const [showSide, setShowSide] = useState<boolean>(false);
    const [friendModal, setFriendModal] = useState<boolean>(false);
    const handleClose = () => setShow(false);
    const toggleShow = () => setShow((s) => !s);
    const handleToggle = () => setShowSide(false);
    const showToggle = () => setShowSide(true);
    const [webSocketNotifications, setWebSocketNotifications] = useState<Notification[]>([]);
    const [userStatus, setUserStatus] = useState<User[]>([]);
    const { socket, isLoading } = useGlobalContext();
    const [friendsfetched, setFriendsFetched] = useState<FriendSocket[]>([]);
    const [notificationFetch, setNotificationFetch] = useState<Notification[]>([]);
    const [userData, setuserData] = useState<User>({
        id: 0,
        username: '',
        image_url: '',
        is_online: 0,
    });

    const spinner = useMemo(
        () => (
            <div className={`${styles.spinnerContainer} ${styles.spinnerOverlay}`}>
                <Spinner animation="border" variant="danger" />
                <p className={`${styles.loadingMessage} valo-font`}>LOADING ...</p>
            </div>
        ),
        [],
    );

    useEffect(() => {
        if (socket == null) return;
        socket.onmessage = (event: any) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'notification':
                    setWebSocketNotifications((prevNotifications: any) => [...prevNotifications, data]);
                    break;
                case 'user_status':
                    setUserStatus((prevUser: any) => [...prevUser, userData]);
            }
        };
        return () => {
            socket.close();
        };
    }, [socket]);
    useEffect(() => {
        if (friendModal) return;
        const fetchRightBarData = async () => {
            const access = Cookies.get('access');
            if (access) {
                try {
                    const csrftoken = Cookies.get('csrftoken') || '';
                    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/friends`, {
                        headers: { Authorization: `Bearer ${access}`, 'X-CSRFToken': csrftoken },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const transformedData = data.friends
                            .filter((friend: Friend) => friend.is_accepted == true)
                            .map((friend: Friend) => ({
                                id: friend.user.id,
                                username: friend.user.username,
                                image_url: friend.user.image_url,
                                connected: friend.user.is_online > 0 ? true : false,
                            }));
                        setFriendsFetched(transformedData);
                        setuserData({ id: data.id, username: data.username, image_url: data.image_url, is_online: 1 });
                    } else if (response.status === 401) {
                        console.log('Unauthorized');
                    } else {
                        console.error('An unexpected error happened:', response.status);
                    }
                } catch (error) {
                    console.error('An unexpected error happened:', error);
                }
            }
        };
        fetchRightBarData();
        const fetchNotifications = async () => {
            const access = Cookies.get('access');
            if (access) {
                try {
                    const csrftoken = Cookies.get('csrftoken') || '';
                    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/notifications`, {
                        headers: { Authorization: `Bearer ${access}`, 'X-CSRFToken': csrftoken },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const notificationFetch = data.notifications.map((notification: Notification) => ({
                            notification_id: notification.notification_id,
                            message: notification.message,
                            image_url: notification.image_url,
                            title: notification.title,
                            link: notification.link,
                            count: notification.count,
                            is_chat_notif: notification.is_chat_notif,
                            is_friend_notif: notification.is_friend_notif,
                            is_tourn_notif: notification.is_tourn_notif,
                            is_match_notif: notification.is_match_notif,
                            action_by: notification.action_by,
                        }));
                        setNotificationFetch(notificationFetch);
                    } else if (response.status === 401) {
                        console.log('Unauthorized');
                    } else {
                        console.error('An unexpected error happened:', response.status);
                    }
                } catch (error) {
                    console.error('An unexpected error happened:', error);
                }
            }
        };
        fetchNotifications();
    }, [webSocketNotifications, userStatus]);

    const memoizedSideBar = useMemo(() => <SideBar />, []);

    const memorizedSrightBar = useMemo(
        () => (
            <SrightBar
                webSocketNotifications={webSocketNotifications}
                notifications_data={notificationFetch}
                userdata={userData}
                friends_data={friendsfetched}
                setfriendModal={() => setFriendModal(true)}
                toggleShow={toggleShow}
            />
        ),
        [webSocketNotifications, notificationFetch, userData, friendsfetched, toggleShow],
    );

    const memorizedRightBar = useMemo(
        () => (
            <RightBar
                webSocketNotifications={webSocketNotifications}
                notifications_data={notificationFetch}
                userdata={userData}
                friends_data={friendsfetched}
                setfriendModal={() => setFriendModal(true)}
                show={show}
                setShow={setShow}
                handleClose={handleClose}
                toggleShow={toggleShow}
            />
        ),
        [webSocketNotifications, notificationFetch, userData, friendsfetched, setShow, handleClose, toggleShow],
    );

    return (
        <div
            className={`container-fluid p-0 vh-100 ${styles.mainContainer}`}
            style={{ backgroundColor: '#000000', overflow: 'hidden' }}
        >
            {isLoading && spinner}
            <div className="row">
                <div className={`col-1 ${styles.toglle} p-0`}>
                    <img
                        src="/assets/images/icons/LOGO.svg"
                        width={60}
                        height={60}
                        style={{ width: 'auto', height: 'auto' }}
                        className={`${styles.logo} img-fluid rounded rounded-circle`}
                        alt="ying"
                        onClick={showToggle}
                    />
                    <Offcanvas show={showSide} placement="start" onHide={handleToggle} scroll={false} backdrop={true}>
                        <div className={`${styles.sidebar_toggle} vh-100`}>
                            <Offcanvas.Header closeButton closeVariant="white">
                                <Offcanvas.Title>
                                    <img
                                        src="/assets/images/icons/LOGO.svg"
                                        width={60}
                                        height={60}
                                        style={{ width: 'auto', height: 'auto' }}
                                        className={`${styles.logo} img-fluid rounded rounded-circle`}
                                        alt="ying"
                                    />
                                </Offcanvas.Title>
                            </Offcanvas.Header>
                            <Offcanvas.Body className="pt-0 d-flex justify-content-center" style={{ height: '93%' }}>
                                <Togglebar handleToggle={handleToggle} />
                            </Offcanvas.Body>
                        </div>
                    </Offcanvas>
                    <div
                        className={`col-1 ${styles.slider} d-flex align-items-center justify-content-center`}
                        onClick={toggleShow}
                    >
                        <FaAngleLeft color="#FFEBEB" />
                    </div>
                </div>
                <div className="sidebar col-md-1 d-none d-sm-none d-md-block" style={{ backgroundColor: '#000000' }}>
                    {memoizedSideBar}
                </div>
                <div className="col-md-10 col-sm-12 p-0" style={{ backgroundColor: '#000000' }}>
                    {children}
                </div>
                <div
                    className="rightbar col-md-1 d-none d-sm-none d-md-block p-0"
                    style={{ backgroundColor: '#161625' }}
                >
                    <div className="row-fluid d-flex flex-row align-items-center p-0 vh-100" style={{ zIndex: '50' }}>
                        <div
                            className="col-1 vh-100 d-flex justify-content-end align-items-center text-center"
                            style={{ backgroundColor: '#000000' }}
                        >
                            <div
                                className={`${styles.drag_class} pt-3 pb-3`}
                                style={{ backgroundColor: '#161625', borderRadius: '15px 0 0 15px', cursor: 'pointer' }}
                                onClick={toggleShow}
                            >
                                <FaAngleLeft color="#FFEBEB" size="1.2em" />
                                {memorizedRightBar}
                            </div>
                        </div>
                        <div className="col-11">{memorizedSrightBar}</div>
                        <InviteFriend show={friendModal} close={() => setFriendModal(false)} />
                    </div>
                </div>
            </div>
        </div>
    );
}
