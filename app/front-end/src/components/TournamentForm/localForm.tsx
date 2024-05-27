'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import styles from './localForm.module.css';
import { notificationStyle } from '../ToastProvider';
import { toast } from 'react-toastify';
import Tournament from '@/app/game/Tournament/Tournament';

function getFormattedDateTime(): string {
    const date: Date = new Date();
    const optionsDate: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };
    const optionsTime: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    };
    const formattedDate: string = date.toLocaleDateString('en-US', optionsDate);
    const formattedTime: string = date.toLocaleTimeString('en-US', optionsTime);
    const formattedDateTime: string = `${formattedDate}, ${formattedTime}`;
    return formattedDateTime;
}

interface LocalPlayersProps {
    [key: string]:
        | string
        | number
        | {
              [key: string]: {
                  [key: string]: { [key: string]: { [key: string]: string | number } };
              };
          };
}

interface getInputProps {
    type: string;
    id: string;
    label: string;
    updatePlayersList: (key: string, val: string) => void;
    inputClassName?: string;
    labelClassName?: string;
    inputLength?: number;
}

function InputRange({ id, updatePlayersList }: { id: string; updatePlayersList: (key: string, val: string) => void }) {
    return (
        <>
            <div className={`  row justify-content-center ${styles.slidecontainer} p-0 mt-2`}>
                <label className={`  col-9 itim-font text-left p-1 ${styles.rangeTitle}`} htmlFor="myRange">
                    Game Difficulty
                </label>
                <div className={`  col-9 d-flex justify-content-center p-0 my-3 ${styles.rangeTitle}`}>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="1"
                        className={`${styles.slider}`}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updatePlayersList(id, e.target.value)}
                        id="myRange"
                    />
                </div>
                <div className={`row p-0 mb-2 justify-content-center ${styles.rangeTitle}`}>
                    <div className="col-3">
                        <p className={`  itim-font`}>Easy</p>
                    </div>
                    <div className="col-3 d-flex justify-content-center">
                        <p className={`itim-font`}>Medium</p>
                    </div>
                    <div className="col-3 d-flex justify-content-end">
                        <p className={`itim-font`}>Hard</p>
                    </div>
                </div>
            </div>
        </>
    );
}

function GetInput({
    type,
    id,
    label,
    updatePlayersList,
    labelClassName,
    inputClassName,
    inputLength = 20,
}: getInputProps) {
    return (
        <>
            <div className={`row  justify-content-center`}>
                <div className="col-9 my-2 ms-4 d-flex">
                    <label
                        htmlFor={id}
                        className={`col-9 itim-font text-left p-0 m-0 ${styles.labelClass} ${styles.input_title}`}
                    >
                        {label}
                    </label>
                </div>
                <div className={`col-9 ${styles.input_holder} row justify-content-center p-0 m-2`}>
                    <input
                        type={type}
                        className={`${inputClassName} ${styles.input_text} ps-4`}
                        maxLength={inputLength}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updatePlayersList(id, e.target.value)}
                        required
                    />
                </div>
            </div>
        </>
    );
}

function LocalTournamentForm({ setRerender }: { setRerender: React.Dispatch<React.SetStateAction<boolean>> }) {
    const [players, setPlayers] = useState<LocalPlayersProps>({
        tournament_name: '',
        tournamentImage: '/Ping_Pong_Battle_4.png',
        player_1: '',
        player_2: '',
        player_3: '',
        player_4: '',
        player_5: '',
        player_6: '',
        player_7: '',
        player_8: '',
        difficulty: '1',
        date: '',
        Participants: 8,
        data: {
            quatre_final: {
                match1: {
                    user1: { name: '', photoUrl: '/yoru.jpeg', score: 0 },
                    user2: { name: '', photoUrl: '/yoru.jpeg', score: 0 },
                },
                match2: {
                    user1: { name: '', photoUrl: '/yoru.jpeg', score: 0 },
                    user2: { name: '', photoUrl: '/yoru.jpeg', score: 0 },
                },
                match3: {
                    user1: { name: '', photoUrl: '/yoru.jpeg', score: 0 },
                    user2: { name: '', photoUrl: '/yoru.jpeg', score: 0 },
                },
                match4: {
                    user1: { name: '', photoUrl: '/yoru.jpeg', score: 0 },
                    user2: { name: '', photoUrl: '/yoru.jpeg', score: 0 },
                },
            },
            semi_final: {
                match1: { user1: { name: '', photoUrl: '', score: 0 }, user2: { name: '', photoUrl: '', score: 0 } },
                match2: { user1: { name: '', photoUrl: '', score: 0 }, user2: { name: '', photoUrl: '', score: 0 } },
            },
            final: {
                match1: { user1: { name: '', photoUrl: '', score: 0 }, user2: { name: '', photoUrl: '', score: 0 } },
            },
        },
    });

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = localStorage.getItem('tournaments');
        let tournaments: LocalPlayersProps[] = [];

        if (data) {
            try {
                tournaments = JSON.parse(data);
            } catch (error) {
                console.error('Error parsing JSON data from localStorage:', error);
                toast.error('Error reading stored tournaments data. Please try again later.', notificationStyle);
                return;
            }
        }
        if (tournaments.length >= 5) {
            toast.error('You can only create 5 tournaments', notificationStyle);
            return;
        }
        for (const key in tournaments) {
            if (tournaments[key].tournament_name === players['tournament_name']) {
                toast.error('Tournament name already exists', notificationStyle);
                return;
            }
        }
        players['date'] = getFormattedDateTime();
        tournaments.push(players);
        localStorage.setItem('tournaments', JSON.stringify(tournaments));
        toast.success(`${players['tournament_name']} local tournament created successfully`, notificationStyle);
        setRerender((prev: boolean) => !prev);
    };

    const updatePlayersList: (key: string, val: string) => void = (key: string, val: string) => {
        const newValues = { ...players };
        newValues[key] = val;
        setPlayers(newValues);
    };

    const inputData = [
        {
            type: 'text',
            id: 'tournament_name',
            label: 'Tournament name',
        },
        {
            type: 'text',
            id: 'player_1',
            label: 'player 1',
        },
        {
            type: 'text',
            id: 'player_2',
            label: 'player 2',
        },
        {
            type: 'text',
            id: 'player_3',
            label: 'player 3',
        },
        {
            type: 'text',
            id: 'player_4',
            label: 'player 4',
        },
        {
            type: 'text',
            id: 'player_5',
            label: 'player 5',
        },
        {
            type: 'text',
            id: 'player_6',
            label: 'player 6',
        },
        {
            type: 'text',
            id: 'player_7',
            label: 'player 7',
        },
        {
            type: 'text',
            id: 'player_8',
            label: 'player 8',
        },
    ];
    return (
        <form className={`row p-0 m-0 ${styles.form_container}`} onSubmit={handleSubmit}>
            <fieldset className="row justify-content-center p-0 m-0">
                <div className="row">
                    <div className={`col text-center`}>
                        <legend className="valo-font align-self-center text-center mt-4">
                            CREATE LOCAL TOURNAMENT
                        </legend>
                    </div>
                </div>
                <div className="row justify-content-center">
                    <GetInput
                        type={inputData[0].type}
                        label={inputData[0].label}
                        id={inputData[0].id}
                        inputLength={30}
                        labelClassName="itim-font"
                        updatePlayersList={updatePlayersList}
                    />
                    <>
                        {inputData.map((elem) => (
							<GetInput
                                type={elem.type}
                                label={elem.label}
                                id={elem.id}
                                inputLength={20}
                                labelClassName="itim-font"
                                updatePlayersList={updatePlayersList}
                            />
                        ))}
                    </>
                    <InputRange id="difficulty" updatePlayersList={updatePlayersList}></InputRange>
                </div>
                <div className="col-12 d-flex flex-row justify-content-center">
                    <button className={`valo-font mb-4 ${styles.create_button}`} type="submit">
                        CREATE
                    </button>
                </div>
            </fieldset>
        </form>
    );
}

export { LocalTournamentForm };
