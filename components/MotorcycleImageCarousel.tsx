"use client";

import Image from "next/image";
import type { TouchEvent } from "react";
import { useRef, useState } from "react";

import type { MotorcycleGalleryImage } from "@/lib/motorcycle-gallery";
import { canOptimizePublicImage } from "@/lib/public-image";

import styles from "./MotorcycleImageCarousel.module.css";

type TouchStart = {
  x: number;
  y: number;
};

const SWIPE_DISTANCE = 48;

export function MotorcycleImageCarousel({
  images,
  motorcycleName,
}: {
  images: MotorcycleGalleryImage[];
  motorcycleName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef<TouchStart | null>(null);
  const touchDirection = useRef<
    "horizontal" | "vertical" | null
  >(null);

  const hasMultipleImages = images.length > 1;
  const activeImage = images[activeIndex] ?? images[0];

  function showPrevious() {
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  }

  function showNext() {
    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  }

  function handleTouchStart(
    event: TouchEvent<HTMLDivElement>,
  ) {
    if (!hasMultipleImages || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];

    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    touchDirection.current = null;
  }

  function handleTouchMove(
    event: TouchEvent<HTMLDivElement>,
  ) {
    const start = touchStart.current;

    if (!start || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (!touchDirection.current) {
      if (
        Math.abs(deltaX) < 8 &&
        Math.abs(deltaY) < 8
      ) {
        return;
      }

      touchDirection.current =
        Math.abs(deltaX) > Math.abs(deltaY)
          ? "horizontal"
          : "vertical";
    }

    if (touchDirection.current === "horizontal") {
      event.preventDefault();
    }
  }

  function handleTouchEnd(
    event: TouchEvent<HTMLDivElement>,
  ) {
    const start = touchStart.current;
    const touch = event.changedTouches[0];

    if (
      !start ||
      !touch ||
      touchDirection.current !== "horizontal"
    ) {
      touchStart.current = null;
      touchDirection.current = null;
      return;
    }

    const deltaX = touch.clientX - start.x;

    if (Math.abs(deltaX) >= SWIPE_DISTANCE) {
      if (deltaX < 0) {
        showNext();
      } else {
        showPrevious();
      }
    }

    touchStart.current = null;
    touchDirection.current = null;
  }

  if (!activeImage) {
    return null;
  }

  return (
    <section
      className={styles.carousel}
      aria-label={`Galeria de imagens da ${motorcycleName}`}
    >
      <div
        className={styles.stage}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          touchStart.current = null;
          touchDirection.current = null;
        }}
      >
        <Image
          className={styles.image}
          src={activeImage.url}
          alt={activeImage.alt}
          width={720}
          height={500}
          priority={activeIndex === 0}
          sizes="(max-width: 720px) 90vw, (max-width: 1180px) 48vw, 620px"
          unoptimized={!canOptimizePublicImage(activeImage.url)}
        />

        {hasMultipleImages ? (
          <>
            <button
              className={`${styles.arrow} ${styles.previous}`}
              type="button"
              onClick={showPrevious}
              aria-label="Mostrar foto anterior"
            >
              ‹
            </button>

            <button
              className={`${styles.arrow} ${styles.next}`}
              type="button"
              onClick={showNext}
              aria-label="Mostrar próxima foto"
            >
              ›
            </button>

            <span className={styles.counter}>
              {activeIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <>
          <div
            className={styles.dots}
            aria-label="Selecionar foto"
          >
            {images.map((image, index) => (
              <button
                className={
                  index === activeIndex
                    ? styles.dotActive
                    : ""
                }
                type="button"
                key={image.id}
                onClick={() => setActiveIndex(index)}
                aria-label={`Mostrar foto ${index + 1}`}
                aria-current={
                  index === activeIndex ? "true" : undefined
                }
              />
            ))}
          </div>

          <div className={styles.thumbnails}>
            {images.map((image, index) => (
              <button
                className={
                  index === activeIndex
                    ? styles.thumbnailActive
                    : ""
                }
                type="button"
                key={image.id}
                onClick={() => setActiveIndex(index)}
                aria-label={`Selecionar foto ${index + 1}`}
              >
                <Image
                  src={image.url}
                  alt=""
                  width={100}
                  height={70}
                  unoptimized={
                    !canOptimizePublicImage(image.url)
                  }
                />
              </button>
            ))}
          </div>

          <p className={styles.swipeHint}>
            <span aria-hidden="true">←</span>
            Arraste a foto para o lado
            <span aria-hidden="true">→</span>
          </p>
        </>
      ) : null}
    </section>
  );
}
