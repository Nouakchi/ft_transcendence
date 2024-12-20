'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import styles from './styles/LandingPage.module.css';

const ThreeScene = () => {
    const mountRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const mount = mountRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 30;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        mount?.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enableZoom = true;

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 0, 1);
        scene.add(directionalLight);

        const starGeometry = new THREE.SphereGeometry(0.1, 24, 24);
        const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        for (let i = 0; i < 1000; i++) {
            const star = new THREE.Mesh(starGeometry, starMaterial);
            star.position.x = THREE.MathUtils.randFloatSpread(200);
            star.position.y = THREE.MathUtils.randFloatSpread(200);
            star.position.z = THREE.MathUtils.randFloatSpread(200);
            scene.add(star);
        }

        const loader = new GLTFLoader();
        loader.load(
            '/3D/scene.gltf',
            (gltf: any) => {
                const model = gltf.scene;
                model.scale.set(0.005, 0.005, 0.005);
                model.position.set(1.65, 2, 1.5);
                model.rotation.y = Math.PI / 2;
                scene.add(model);
            },
            undefined,
            (error: any) => {
                console.log('An error happened while loading the model:', error);
            },
        );

        const initialPosition = new THREE.Vector3(0, 0, 30);
        const targetPosition = new THREE.Vector3(0, 0, 10);
        const duration = 2;
        const clock = new THREE.Clock();

        const animateCamera = () => {
            renderer.render(scene, camera);
            const elapsedTime = clock.getElapsedTime();
            if (elapsedTime < duration) {
                const t = elapsedTime / duration;
                camera.position.lerpVectors(initialPosition, targetPosition, t);
                camera.updateProjectionMatrix();
                requestAnimationFrame(animateCamera);
            } else {
                camera.position.copy(targetPosition);
                camera.updateProjectionMatrix();
            }
        };
        animateCamera();

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            mount?.removeChild(renderer.domElement);
            renderer.dispose();
            controls.dispose();
        };
    }, []);

    return <div ref={mountRef} className={`${styles.threeScene}`} />;
};

const LandingPage = () => {
    return (
        <div className={styles.container}>
            <ThreeScene />
            <div className={styles.content}>
                <div className={styles.buttonContainer}>
                    <Link className={`${styles.button} valo-font`} href="sign-in">
                        SIGN IN
                    </Link>
                    <Link className={`${styles.button} valo-font`} href="sign-up">
                        SIGN UP
                    </Link>
                </div>
            </div>
            <div className={styles.footer}>
                <p className={styles.copyright}>© 2024 ft_transcendence. All rights reserved.</p>
                <a
                    className={styles.githubLink}
                    href="https://github.com/zakarm/ft_transcendence"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Created by @zmrabet @ael-mouz @mfouadi @onouakch
                </a>
            </div>
        </div>
    );
};

export default LandingPage;
