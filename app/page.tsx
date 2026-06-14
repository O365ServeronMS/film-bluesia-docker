import { HeroSlider } from "@/components/HeroSlider";
import { SectionRow } from "@/components/SectionRow";
import { TopBar } from "@/components/TopBar";
import { getHome } from "@/lib/ophim";
import type { Metadata } from "next";

export const revalidate = 900; // 15 phut, can bang freshness va rebuild cost

export const metadata: Metadata = {
  alternates: {
    canonical: "/"
  }
};

export default async function HomePage() {
  const home = await getHome();

  return (
    <>
      <TopBar />
      <HeroSlider items={home.hero} />
      {home.sections.map((section) => (
        <SectionRow key={section.href} title={section.title} href={section.href} items={section.items} />
      ))}
    </>
  );
}
