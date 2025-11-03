import SectionHome from '@/src/components/sections/home';
import PictureBall from '@/src/components/PictureBall';


export default function Home() {
  return (
      <div className="container">
        <section className="section section-home">
          <SectionHome />
          <PictureBall />
        </section>
        <section className="section section-about">
        </section>
      </div>
  );
}
