'use client';
import MainContainer from '../../components/mainContainer';
import AuthChecker from '../../components/authChecker';
import { WebSocketProvider } from '@/components/webSocket'
import React from 'react';

export default function GameLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthChecker>
            <WebSocketProvider>
                <MainContainer>{children}</MainContainer>
            </WebSocketProvider>
        </AuthChecker>
    );
}
