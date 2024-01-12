import Image from "next/image";

export default function RankIcon(eloScore: number) {
    var rankIconSrc: string = "/rankedicons/";
    var altTag: string;
    if (eloScore >= 1800) {
      rankIconSrc = rankIconSrc + "diamond_v002.png";
      altTag = "Diamond";
    } else if (eloScore >= 1500) {
      rankIconSrc = rankIconSrc + "platinum_v002.png";
      altTag = "Platinum";
    } else if (eloScore >= 1300) {
      rankIconSrc = rankIconSrc + "03_gold.png";
      altTag = "Gold";
    } else if (eloScore >= 1100) {
      rankIconSrc = rankIconSrc + "02_silver.png";
      altTag = "Silver";
    } else {
      rankIconSrc = rankIconSrc + "01_bronze.png";
      altTag = "Bronze";
    }
    return <Image src={rankIconSrc} alt={altTag} width="24" height="0" />;
  };