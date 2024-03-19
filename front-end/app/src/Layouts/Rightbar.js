import { RiNotification4Fill } from "react-icons/ri";
import { IoIosSearch } from "react-icons/io";
import { ImUserPlus } from "react-icons/im";
// import { RxDotsVertical } from "react-icons/rx";
// import Player from '../Components/player/Player';

import './Rightbar.css'
import Player from "../Components/player/Player";
// import { useState } from "react";

function RightBar() {
    // const [isHoverd, setIsHoverd] = useState(false);
    return (
        <div className="container vh-100">
            <div className="d-flex flex-column vh-100">
                <div className="flex-grow-2">
                    <div className="row-inline">
                         <div className="col">
                             <div className="notification">
                                 <RiNotification4Fill color="#FF4755" size='1.5em'/>
                                 <span class="badge">3</span>
                             </div>
                         </div>
                         <div className="row d-flex flex-column text-center">
                             <div className="col">
                                 <img className="img-class" src="assets/char3.png" alt='Profile'/>
                             </div>
                             <div className="col mt-2">
                                 <h3 className="valo-font">!SNAKE_007</h3>
                                 <h4 style={{fontFamily: 'intim', color: '#FFEBEB'}}>#7777</h4>
                             </div>
                         </div>
                         <div className="col search-inpt p-2 m-2 d-flex align-items-center">
                             <div className="col-md-2">
                                 <IoIosSearch color="#FFEBEB" size='2em'/>
                             </div>
                             <div className="col-md-2 p-2">
                                 <input className="" type="text" placeholder="Find a player ..." style={{backgroundColor: '#2C3143', border: 0}}/>
                             </div>
                         </div>
                    </div>
                </div>
                <div className="p-3 flex-grow-1" style={{ overflowY: 'scroll' }}>
                    <Player nickname={"!Snake_007"} id={7777}/>
                    <Player nickname={"!Snake_007"} id={7777}/>
                    <Player nickname={"!Snake_007"} id={7777}/>
                    <Player nickname={"!Snake_007"} id={7777}/>
                    <Player nickname={"!Snake_007"} id={7777}/>
                    <Player nickname={"!Snake_007"} id={7777}/>
                    <Player nickname={"!Snake_007"} id={7777}/>
                    <Player nickname={"!Snake_007"} id={7777}/>
                    <Player nickname={"!Snake_007"} id={7777}/>
                    <Player nickname={"!Snake_007"} id={7777}/>
                    <Player nickname={"!Snake_007"} id={7777}/>
                    <Player nickname={"!Snake_007"} id={7777}/>
                    <Player nickname={"!Snake_007"} id={7777}/>
                    <Player nickname={"!Snake_007"} id={7777}/>
                </div>
                <div className="flex-grow-3">
                    <div className="row search-inpt p-2 mb-4 m-1" style={{cursor: "pointer"}}>
                        <div className="col-xl-8 col-12 p-2 text-center">
                            <div style={{fontFamily: 'intim', color: '#FFEBEB'}}>add friend</div>
                        </div>
                        <div className="col-xl-4 col-12">
                            <ImUserPlus color="#FFEBEB" size='2em'/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RightBar;