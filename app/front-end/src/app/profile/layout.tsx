
import MainContainer from '../../components/mainContainer';
import AuthChecker from "../../components/authChecker";
import { WebSocketProvider } from '@/components/webSocket'
import React from 'react';

export default function ProfileLayout({children}: {children: React.ReactNode})
{
    return (
        <AuthChecker>
            <WebSocketProvider>
                <MainContainer>{children}</MainContainer>
            </WebSocketProvider>
        </AuthChecker>
    );
}