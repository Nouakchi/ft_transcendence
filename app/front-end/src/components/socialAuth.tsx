"use client"

import {FaGoogle, FaGithub} from "react-icons/fa"
import { Si42 } from "react-icons/si";

interface Props {
    className?: string;
    platform?: string;

}

export default function SocialAuth({ className, platform }: Props) {
  const handleAuthRedirect = async () => {
      try {
            window.location.href = `http://localhost:8000/api/social/${platform}/redirect`;
            console.log(window.location.href );
      } catch (error) {
          console.error('Error:', error);
      }
  }

  return (
      <button className={className} onClick={handleAuthRedirect} type="button">
          {platform === "google" && <FaGoogle color="#FFEBEB" />}
          {platform === "github" && <FaGithub color="#FFEBEB" />}
          {platform === "42" && <Si42 color="#FFEBEB" />}
      </button>
  );
}