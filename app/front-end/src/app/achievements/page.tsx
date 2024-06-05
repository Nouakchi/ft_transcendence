'use client';

import React from 'react';
import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import styles from './styles.module.css';
import Cookies from 'js-cookie';
import NavBar from '@/components/NavBar/NavBar';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: React.DetailedHTMLProps<React.HTMLAttributes<React.ElementType>, React.ElementType>;
        }
    }
}

interface Props {
    title?: string;
    subTitle?: string;
    imageURL?: string;
    achieved?: boolean;
}

type AchievementsType = {
    [key: string]: {
        [key: string]: boolean;
    };
};

type AchievementsProps = {
    achievements: Partial<AchievementsType>;
    choosenTab: string;
};

interface RenderBadgesProps {
    content: {
        title: string;
        subTitle: string;
        imageURL: string;
        achieved: any;
    }[];
}

type AchivProps = {
    choosenTab: string;
    achievements: Partial<AchievementsType>;
    setAchievements: Dispatch<SetStateAction<Partial<AchievementsType>>>;
};

const AchievementsProgressBar: React.FC<AchievementsProps> = React.memo(
    ({ achievements, choosenTab }: AchievementsProps) => {
        let achivementsUnlockedCount: number = 0;
        let totalUnlocked: number = 0;
        Object.values(achievements).map((value) => {
            if (value) {
                Object.values(value).map((v) => {
                    if (v === true) {
                        achivementsUnlockedCount += 1;
                    }
                    totalUnlocked++;
                });
            }
        });

        const unlockedAchievements: number =
            choosenTab === 'All'
                ? Math.ceil((achivementsUnlockedCount / totalUnlocked) * 100)
                : choosenTab === 'Match' && achievements.match
                ? Math.ceil(
                      (Object.values(achievements.match).filter((value) => value === true).length /
                          Object.entries(achievements.match).length) *
                          100,
                  )
                : choosenTab === 'Tournament' && achievements.tournament
                ? Math.ceil(
                      (Object.values(achievements.tournament).filter((value) => value === true).length /
                          Object.entries(achievements.tournament).length) *
                          100,
                  )
                : choosenTab === 'AI' && achievements.ai
                ? Math.ceil(
                      (Object.values(achievements.ai).filter((value) => value === true).length /
                          Object.entries(achievements.ai).length) *
                          100,
                  )
                : 0;
        return (
            <>
                <div className="col-12 d-flex">
                    <div
                        className={`${styles.progress} progress`}
                        role="progressbar"
                        aria-label="Animated striped example"
                        aria-valuenow={75}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            className={`${styles.progress_bar} itim-font progress-bar`}
                            style={{ width: `${unlockedAchievements}%` }}
                        >
                            {unlockedAchievements}%
                        </div>
                    </div>
                    <span className="valo-font ms-2 p-0">100%</span>
                </div>
            </>
        );
    },
);

const AchivementCard: React.FC<Props> = React.memo(({ title, subTitle, imageURL, achieved }: Props) => {
    return (
        <>
            <div
                className={`${styles.card_container} ${
                    achieved ? styles.achived : styles.not_achived
                } row p-0 m-1 align-items-center justify-content-between`}
            >
                <div className={`row ${styles.cardHolder} align-items-center m-0 p-0`}>
                    <div className={`${styles.right_subcard} col-8 p-3 m-0 `}>
                        <div className="row p-0 m-0">
                            <h3 className={`${styles.title} valo-font col p-0 m-2`}>{title}</h3>
                        </div>
                        <div className="row p-0 m-0">
                            <div className="itim-font col">{subTitle}</div>
                        </div>
                        <div className="row p-0 m-0 mt-4 ">
                            <h3 className={`col valo-font ${styles.achieved_text}`}>{achieved ? 'ACHIEVED' : ''}</h3>
                        </div>
                    </div>
                    <div className={`col-4 p-0 m-0`}>
                        <div className={`row p-0 m-0`}>
                            <div className={`col`}>
                                <img className={`${styles.achiv_img}`} src={imageURL}></img>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
});

const RenderBadges: React.FC<RenderBadgesProps> = React.memo(({ content }: RenderBadgesProps) => {
    return (
        <div className={`${styles.achi_container} row p-1 m-1`}>
            {content.map(({ title, subTitle, imageURL, achieved }) => {
                return (
                    <div
                        className="col-12 col-md-6 col-xxl-4 d-flex justify-content-center justify-content-md-start"
                        key={title}
                    >
                        <AchivementCard
                            title={title}
                            subTitle={subTitle}
                            imageURL={imageURL}
                            achieved={achieved}
                        ></AchivementCard>
                    </div>
                );
            })}
        </div>
    );
});

const Achievements: React.FC<AchivProps> = React.memo(({ choosenTab, achievements, setAchievements }: AchivProps) => {
    const access = Cookies.get('access');

    useEffect(() => {
        const getAchievements = async () => {
            try {
                const response = await fetch('', {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${access}` },
                });

                // const data = await response.json();
                setAchievements({
                    tournament: {
                        early: false,
                        triple: true,
                        front: false,
                    },
                    match: {
                        speedy: false,
                        last: true,
                        king: true,
                    },
                    ai: {
                        challenger: true,
                        rivalry: true,
                        legend: false,
                    },
                });
            } catch (error) {
                console.log('An unexpected error happened:', error);
            }
        };
        getAchievements();
    }, []);

    const badgeContent = [
        // MATCH achievements
        {
            title: 'AI CHALLENGER',
            subTitle: 'Defeat the AI bot at the highest difficulty level',
            imageURL: 'achiv_ai1.png',
            achieved: achievements.ai ? achievements.ai['challenger'] : false,
        },
        {
            title: 'ROBO-RIVALRY',
            subTitle: 'Engage in a match against the AI bot lasting longer than 20 minutes and win',
            imageURL: 'achiv_ai2.png',
            achieved: achievements.ai ? achievements.ai['rivalry'] : false,
        },
        {
            title: "I'M A LEGEND",
            subTitle: 'Defeat the AI bot with a score of 11-0',
            imageURL: 'achiv_ai3.png',
            achieved: achievements.ai ? achievements.ai['legend'] : false,
        },
        // TOURNAMENT achievements
        {
            title: 'EARLY BIRD',
            subTitle: 'Win a match within the first three minutes',
            imageURL: 'achiv_tourn1.png',
            achieved: achievements.tournament ? achievements.tournament['early'] : false,
        },
        {
            title: 'TRIPLE THREAT',
            subTitle: 'Score a hat-trick (three consecutive points) at least twice in a match',
            imageURL: 'achiv_tourn2.png',
            achieved: achievements.tournament ? achievements.tournament['triple'] : false,
        },
        {
            title: 'FRONTRUNNER',
            subTitle: 'Reach the finals of the tournament',
            imageURL: 'achiv_tourn3.png',
            achieved: achievements.tournament ? achievements.tournament['front'] : false,
        },
        // MATCH GAME achievements
        {
            title: 'SPEEDY VICTORY',
            subTitle: 'Win a game with a score of 11-0 within three minutes',
            imageURL: 'achiv_match1.png',
            achieved: achievements.match ? achievements.match['speedy'] : false,
        },
        {
            title: 'LAST-MINUTE COMEBACK',
            subTitle: 'Win a game after being down by five points',
            imageURL: 'achiv_match2.png',
            achieved: achievements.match ? achievements.match['last'] : false,
        },
        {
            title: 'TABLE KING/QUEEN',
            subTitle: 'Win ten games in a row without losing',
            imageURL: 'achiv_match3.png',
            achieved: achievements.match ? achievements.match['king'] : false,
        },
    ];

    return (
        <>
            {choosenTab === 'All' ? (
                <RenderBadges content={badgeContent} />
            ) : choosenTab === 'Match' ? (
                <RenderBadges content={badgeContent.slice(6, 9)} />
            ) : choosenTab === 'Tournament' ? (
                <RenderBadges content={badgeContent.slice(3, 6)} />
            ) : (
                <RenderBadges content={badgeContent.slice(0, 3)} />
            )}
        </>
    );
});

function AchievementsPage() {
    const options = ['All', 'Tournament', 'Match', 'AI'];
    const [choosenTab, setChoosenTab] = useState<string>('All');
    const [achievements, setAchievements] = useState<Partial<AchievementsType>>({});

    return (
        <div className={`${styles.wrapper} container-fluid vh-100`}>
            <div className="row p-0 m-0 mt-4">
                <div className="col">
                    <h1 className="valo-font col-6">ACHIEVEMENTS</h1>
                </div>
            </div>
            <div className="row p-0 m-0 mt-4">
                <AchievementsProgressBar achievements={achievements} choosenTab={choosenTab}></AchievementsProgressBar>
            </div>
            <div className="row p-0 mt-4">
                <div className="col">
                    <NavBar options={options} setChoosenTab={setChoosenTab} />
                </div>
            </div>
            <div className={`row p-1 mt-4 h-75`}>
                <Achievements
                    choosenTab={choosenTab}
                    achievements={achievements}
                    setAchievements={setAchievements}
                ></Achievements>
            </div>
        </div>
    );
}

export default AchievementsPage;