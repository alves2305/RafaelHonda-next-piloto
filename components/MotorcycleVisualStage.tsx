import Image from "next/image";

import { canOptimizePublicImage } from "@/lib/public-image";

import styles from "./MotorcycleVisualStage.module.css";

type MotorcycleVisualStageProps = {
  imageUrl: string;
  motorcycleName: string;
  variant: "consortium" | "financing";
  mobileFirst?: boolean;
  priority?: boolean;
};

export function MotorcycleVisualStage({
  imageUrl,
  motorcycleName,
  variant,
  mobileFirst = false,
  priority = true,
}: MotorcycleVisualStageProps) {
  return (
    <div
      className={`${styles.stage} ${
        variant === "financing"
          ? styles.financing
          : styles.consortium
      } ${mobileFirst ? styles.mobileFirst : ""}`}
    >
      <div className={styles.softGlow} aria-hidden="true" />
      <div className={styles.orbit} aria-hidden="true">
        <span />
      </div>

      <Image
        className={styles.motorcycle}
        src={imageUrl}
        alt={motorcycleName}
        width={760}
        height={520}
        priority={priority}
        sizes="(max-width: 720px) 92vw, (max-width: 1180px) 48vw, 680px"
        unoptimized={!canOptimizePublicImage(imageUrl)}
        style={{
          width: "100%",
          height: "auto",
          marginTop: 0,
          objectFit: "contain",
        }}
      />
    </div>
  );
}
