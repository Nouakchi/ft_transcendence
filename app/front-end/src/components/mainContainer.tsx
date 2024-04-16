'use client'
import { FaAngleLeft } from "react-icons/fa";
import Offcanvas from 'react-bootstrap/Offcanvas';
import React, { useState } from 'react';
import SideBar from "./sideBar";
import RightBar from './rightBar';
import SrightBar from "./srightBar";
import Togglebar from './toggleBar';
import styles from './styles/mainContainer.module.css'
import Image from 'next/image'


export default function MainContainer({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [showSide, setShowSide] = useState(false);
  const handleClose = () => setShow(false);
  const toggleShow = () => setShow((s) => !s);
  const handleToggle = () => setShowSide(false);
  const showToggle = () => setShowSide(true);
  return (
      <div className="container-fluid p-0 vh-100" style={{backgroundColor: '#000000', overflow: 'hidden'}}>
      <div className="row">
          <div className={`col-1 ${styles.toglle} p-0`}>
            <Image src="/LOGO.svg" width={60} height={60} className={`${styles.logo} img-fluid rounded rounded-circle`} alt="ying" onClick={showToggle}/>
            <Offcanvas show={showSide} placement='start' onHide={handleToggle} scroll={false} backdrop={true} >
              <div className={`${styles.sidebar_toggle} vh-100`}>
                <Offcanvas.Header closeButton closeVariant='white'>
                  <Offcanvas.Title><Image src="/LOGO.svg" width={60} height={60} className={`${styles.logo} img-fluid rounded rounded-circle`} alt="ying"/></Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className='pt-0 d-flex justify-content-center' style={{height: '93%'}}>
                  <Togglebar handleToggle={handleToggle}/>
                </Offcanvas.Body>
                </div>
            </Offcanvas>
            <div className={`col-1 ${styles.slider} d-flex align-items-center justify-content-center`} onClick={toggleShow}>
              <FaAngleLeft  color="#FFEBEB"/>
            </div>
          </div>
          <div className="sidebar col-md-1 d-none d-sm-none d-md-block" style={{backgroundColor: '#000000'}}>
            <SideBar />
          </div>
          <div className="col-md-10 col-sm-12 p-0" style={{backgroundColor: '#000000'}}>
            {children}
          </div>
          <div className="rightbar col-md-1 d-none d-sm-none d-md-block p-0" style={{backgroundColor: '#161625'}}>
            <div className='row-fluid d-flex flex-row align-items-center p-0 vh-100'>
              <div className='col-1 vh-100 d-flex justify-content-end align-items-center text-center' style={{backgroundColor: '#000000'}}>
                <div className={`${styles.drag_class} pt-3 pb-3`} style={{backgroundColor: '#161625', borderRadius: '15px 0 0 15px', cursor: 'pointer'}} onClick={toggleShow}>
                  <FaAngleLeft  color="#FFEBEB" size='1.2em'/>
                  <RightBar show={show} setShow={setShow} handleClose={handleClose} toggleShow={toggleShow}/>
                </div>
              </div>
              <div className='col-11'>
                <SrightBar toggleShow={toggleShow}/>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}