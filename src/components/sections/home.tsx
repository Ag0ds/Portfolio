"use client";

import TextType from '@/src/components/TextType';
import LogoLoop from '@/src/components/LogoLoop';
import { DiNodejsSmall, DiMysql, DiPostgresql, DiPython, DiReact, DiWordpress, DiDocker, DiGithubBadge } from "react-icons/di";
import { SiN8N, SiArduino } from "react-icons/si";
import "@/src/style/SectionHome.css";
import { Press_Start_2P } from 'next/font/google'

export const pressStart = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
});

const techLogos = [
  { node: <DiNodejsSmall />, title: "Nodejs", href: "" },
  { node: <DiMysql />, title: "Mysql", href: "" },
  { node: <DiPostgresql />, title: "Postgresql", href: "" },
  { node: <DiPython />, title: "Python", href: "" },
  { node: <DiReact />, title: "React", href: "" },
  { node: <DiWordpress />, title: "Wordpress", href: "" },
  { node: <DiDocker />, title: "Docker", href: "" },
  { node: <DiGithubBadge />, title: "Github", href: "" },
  { node: <SiN8N />, title: "N8n", href: "" },
  { node: <SiArduino />, title: "Arduino", href: "" },

];

export default function SectionHome() {
  return (
    <>
      <TextType
        text={["Bem vindo ao meu humilde portfólio!", "Me chamo Gabriel Arthur"]}
        typingSpeed={75}
        pauseDuration={1500}
        showCursor={true}
        cursorCharacter="|"
        textColors={["#808080", "#808080"]}
        textStyle={{ fontSize: 40, letterSpacing: 1 }}
        cursorStyle={{ fontSize: 40, }}
        className={`section-home-intro ${pressStart.className}`}
      />

      <div className="logoloop-wrapper" style={{ height: 200 }}>
        <LogoLoop
          logos={techLogos}
          speed={120}
          direction="left"
          logoHeight={48}
          gap={40}
          pauseOnHover
          scaleOnHover
          fadeOut
          fadeOutColor="rgba(128, 128, 128, 0.1)"
          ariaLabel="Technology partners"
        />
      </div>

    </>
  );
}