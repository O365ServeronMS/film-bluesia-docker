import { HeroSlider } from "@/components/HeroSlider";
import { SectionRow } from "@/components/SectionRow";
import { TopBar } from "@/components/TopBar";
import { getHome } from "@/lib/ophim";
import { directImageSrcSet } from "@/lib/utils";

export const revalidate = 900; // 15 phút — cân bằng freshness và rebuild cost

export default async function HomePage() {
  const home = await getHome();

  const firstHeroImage = home.hero[0]?.thumb || home.hero[0]?.poster;
  const heroPreloadSrcSet = directImageSrcSet(firstHeroImage);

  return (
    <>
      {/* P2-A: Preload LCP image — browser fetches hero ảnh ngay khi nhận HTML */}
      {heroPreloadSrcSet && (
        <link
          rel="preload"
          as="image"
          imageSrcSet={heroPreloadSrcSet}
          imageSizes="(min-width: 640px) 688px, calc(100vw - 32px)"
        />
      )}
      <TopBar />
      <HeroSlider items={home.hero} />
      {home.sections.map((section) => (
        <SectionRow key={section.href} title={section.title} href={section.href} items={section.items} />
      ))}
    </>
  );
}
