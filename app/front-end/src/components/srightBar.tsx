import Dropdown from 'react-bootstrap/Dropdown';
import { IoIosSearch } from 'react-icons/io';
import { ImUserPlus } from 'react-icons/im';
import styles from './styles/srightBar.module.css';
import Splayer from './Splayer';
import Notification from './Notification';
import React, { forwardRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Friend {
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

interface Props {
    webSocketNotifications: any;
    notifications_data: any;
    userdata: User;
    friends_data: any;
    toggleShow: () => void;
    setfriendModal: () => void;
}

interface NotificationWebSocket {
    notification_id: number;
    message: string;
    title: string;
    user: number;
    image_url: string;
}

interface CustomToggleProps {
    children: React.ReactNode;
    onClick: () => void;
}

const CustomToggle = forwardRef<HTMLDivElement, CustomToggleProps>(({ children, onClick }, ref) => (
    <div ref={ref} onClick={onClick}>
        {children}
    </div>
));

CustomToggle.displayName = 'CustomToggle';

export default function SrightBar({
    webSocketNotifications,
    notifications_data,
    userdata,
    toggleShow,
    setfriendModal,
    friends_data,
}: Props) {
    const data = friends_data
        .sort((usr1: any, usr2: any) => {
            if (usr1.connected && !usr2.connected) {
                return -1;
            }
            if (!usr1.connected && usr2.connected) {
                return 1;
            }
            return usr1.id - usr2.id;
        })
        .map((user: Friend, index: number) => (
            <Splayer
                key={index}
                nickname={user.username}
                id={user.id}
                image={user.image_url}
                isConnected={user.connected}
            />
        ));

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (notifications_data.length > 0) {
            setDropdownOpen(true);
        }
    }, [notifications_data]);

    return (
        <div className="d-flex flex-column vh-100 py-2">
            <div className="pb-1" style={{ width: '91%' }}>
                <div className=" d-flex flex-column align-items-center justify-content-center p-0">
                    <div className={`${styles.holder} text-center p-2`}>
                        <div className={`col-inline ${styles.notification1}`}>
                            <Dropdown show={dropdownOpen} onToggle={() => setDropdownOpen(!dropdownOpen)}>
                                <img
                                    className={`${styles.img_class1}`}
                                    width={60}
                                    height={60}
                                    src={userdata.image_url || '/assets/images/gameProfiles/default_profile.png'}
                                    alt="Profile"
                                    onClick={() => router.push('/profile')}
                                />
                                <Dropdown.Toggle as={CustomToggle} id="dropdown-custom-components">
                                    <span className={`${styles.badge1}`}>
                                        {notifications_data.length > 0
                                            ? notifications_data[notifications_data.length - 1].count
                                            : 0}
                                    </span>
                                </Dropdown.Toggle>
                                {notifications_data && notifications_data.length > 0 && (
                                    <Dropdown.Menu className="drop-class border" style={{ background: '#161625' }}>
                                        {notifications_data &&
                                            notifications_data.map((key: Notification, index: number) => (
                                                <Dropdown.Item
                                                    style={{ background: '#161625' }}
                                                    key={index}
                                                    eventKey={index}
                                                >
                                                    <Notification notification={key} />
                                                </Dropdown.Item>
                                            ))}
                                    </Dropdown.Menu>
                                )}
                            </Dropdown>
                        </div>
                        <div className={`${styles.usr} col pt-1`}>
                            <h5 className="valo-font">Me</h5>
                        </div>
                    </div>
                </div>
                <div className="row d-flex text-center justify-content-center m-0">
                    <div className={`col-6 ${styles.search_inpt1} p-2 m-2`} onClick={toggleShow}>
                        <IoIosSearch color="#FFEBEB" />
                    </div>
                </div>
            </div>
            <div className=" mb-2 flex-grow-1 text-center" style={{ overflowY: 'auto', width: '91%' }}>
                {data}
            </div>
            <div className="flex-grow-3 row-inline d-flex justify-content-center text-center" style={{ width: '91%' }}>
                <div
                    className={`col-6 ${styles.search_inpt1} my-1 p-2 mx-2 text-center`}
                    style={{ cursor: 'pointer' }}
                    onClick={setfriendModal}
                >
                    <ImUserPlus color="#FFEBEB" />
                </div>
            </div>
        </div>
    );
}
