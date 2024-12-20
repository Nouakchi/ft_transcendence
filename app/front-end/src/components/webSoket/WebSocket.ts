// Web_Socket.ts
'use client';
import { useEffect, useState } from 'react';

// Define the interface for the connection information
interface ConnectionInfo {
    index: number;
    roomName: string;
    user: string;
    user_image: string;
    username: string;
    user1: string;
    user1_image: string;
    username1: string;
    user2: string;
    user2_image: string;
    username2: string;
    table_color: string;
    ball_color: string;
    paddle_color: string;
    table_position: string;
}

// Define the hook function with TypeScript
const useWebSocket = (url: string) => {
    const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
    const [gameState, setGameState] = useState<string>('lobby');
    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
        index: 0,
        roomName: '',
        user: '',
        user_image: '',
        username: '',
        user1: '',
        user1_image: '',
        username1: '',
        user2: '',
        user2_image: '',
        username2: '',
        table_color: '',
        ball_color: '',
        paddle_color: '',
        table_position: '',
    });

    const [countDown, setCountDown] = useState<number>(15);
    useEffect(() => {
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('-> Connected to WebSocket');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.message.action === 'created') {
                console.log('-> Room Created', data.message);
                setGameState('lobby');
            }

            if (data.message.action === 'connection_ack') {
                setConnectionInfo((prev: ConnectionInfo) => ({
                    ...prev,
                    index: data.message.index,
                    roomName: data.message.Room_name,
                    user: data.message.User,
                    user_image: data.message.image_url,
                    username: data.message.username,
                    table_color: data.message.table_color,
                    ball_color: data.message.ball_color,
                    paddle_color: data.message.paddle_color,
                    table_position: data.message.table_position,
                }));
                console.log('-> Connection Acknowledged', data.message);
            }

            if (data.message.action === 'opponents') {
                setGameState('opponentFound');
                setConnectionInfo((prev: ConnectionInfo) => ({
                    ...prev,
                    user1: data.message.user1,
                    user1_image: data.message.user1_image_url,
                    username1: data.message.user1_username,
                    user2: data.message.user2,
                    user2_image: data.message.user2_image_url,
                    username2: data.message.user2_username,
                }));
                console.log('-> opponents', data.message);
                console.log('-> connectionInfo', connectionInfo);
            }

            if (data.message.action === 'load_game') {
                setGameState('load_game');
                console.log('-> load_game', data.message);
            }

            if (data.message.action === 'start_game') {
                setGameState('start_game');
                console.log('-> start_game', data.message);
            }
            if (data.message.action === 'reconnected') {
                setGameState('lobby');
                console.log('-> reconnected', data.message);
            }
            if (data.message.action === 'reconnecting') {
                setGameState('reconnecting');
                console.log('-> reconnecting', data.message);
            }
            if (data.message.action === 'pause') {
                setGameState('pause');
                console.log('-> pause', data.message);
            }
            if (data.message.action === 'countdown') {
                setCountDown(data.message.count);
                console.log('-> pause', data.message);
            }
            if (data.message.action === 'end_game') {
                if (data.message.status === 'winner') setGameState('winner');
                else setGameState('loser');
                console.log('-> end_game', data.message);
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from WebSocket');
        };

        setWebSocket(ws);

        return () => {
            ws.close();
        };
    }, [url]);

    return { webSocket, gameState, connectionInfo, countDown };
};

export default useWebSocket;
