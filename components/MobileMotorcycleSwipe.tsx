"use client";

import type { ReactNode, TouchEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./MobileMotorcycleSwipe.module.css";

type MotorcycleDirection = {
  href: string;
  name: string;
};

type MobileMotorcycleSwipeProps = {
  children: ReactNode;
  previous?: MotorcycleDirection | null;
  next?: MotorcycleDirection | null;
};

type TouchStart = {
  x: number;
  y: number;
  time: number;
};

const SWIPE_DISTANCE = 64;
const SWIPE_VELOCITY = 0.45;
const MAX_DRAG = 150;

export function MobileMotorcycleSwipe({
  children,
  previous,
  next,
}: MobileMotorcycleSwipeProps) {
  const router = useRouter();
  const startRef = useRef<TouchStart | null>(null);
  const offsetRef = useRef(0);
  const directionRef = useRef<"horizontal" | "vertical" | null>(null);

  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const hasNavigation = Boolean(previous || next);

  function updateOffset(value: number) {
    offsetRef.current = value;
    setOffset(value);
  }

  function navigateTo(direction: "previous" | "next") {
    if (navigating) {
      return;
    }

    const destination = direction === "previous" ? previous : next;

    if (!destination) {
      updateOffset(0);
      setDragging(false);
      return;
    }

    setNavigating(true);
    setDragging(false);

    const viewportWidth =
      typeof window === "undefined" ? 420 : window.innerWidth;

    updateOffset(direction === "previous" ? viewportWidth : -viewportWidth);

    window.setTimeout(() => {
      router.push(destination.href);
    }, 210);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (
      navigating ||
      !hasNavigation ||
      event.touches.length !== 1
    ) {
      return;
    }

    const touch = event.touches[0];

    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    directionRef.current = null;
    setDragging(false);
    updateOffset(0);
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const start = startRef.current;

    if (!start || navigating || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (!directionRef.current) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) {
        return;
      }

      directionRef.current =
        Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
    }

    if (directionRef.current !== "horizontal") {
      return;
    }

    event.preventDefault();
    setDragging(true);

    const hasDestination = deltaX > 0 ? Boolean(previous) : Boolean(next);
    const resistance = hasDestination ? 1 : 0.22;
    const resistedDelta = deltaX * resistance;
    const limitedDelta = Math.max(
      -MAX_DRAG,
      Math.min(MAX_DRAG, resistedDelta),
    );

    updateOffset(limitedDelta);
  }

  function handleTouchEnd() {
    const start = startRef.current;

    if (!start || navigating) {
      return;
    }

    const elapsed = Math.max(Date.now() - start.time, 1);
    const currentOffset = offsetRef.current;
    const velocity = Math.abs(currentOffset) / elapsed;

    const completedSwipe =
      Math.abs(currentOffset) >= SWIPE_DISTANCE ||
      (Math.abs(currentOffset) >= 36 && velocity >= SWIPE_VELOCITY);

    if (directionRef.current === "horizontal" && completedSwipe) {
      if (currentOffset > 0 && previous) {
        navigateTo("previous");
      } else if (currentOffset < 0 && next) {
        navigateTo("next");
      } else {
        setDragging(false);
        updateOffset(0);
      }
    } else {
      setDragging(false);
      updateOffset(0);
    }

    startRef.current = null;
    directionRef.current = null;
  }

  function handleTouchCancel() {
    startRef.current = null;
    directionRef.current = null;
    setDragging(false);
    updateOffset(0);
  }

  return (
    <div className={styles.shell}>
      <div
        className={`${styles.content} ${dragging ? styles.dragging : ""} ${
          navigating ? styles.navigating : ""
        }`}
        style={{
          transform: `translate3d(${offset}px, 0, 0)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {children}
      </div>

      {previous ? (
        <button
          className={`${styles.arrow} ${styles.previous}`}
          type="button"
          onClick={() => navigateTo("previous")}
          disabled={navigating}
          aria-label={`Abrir a moto anterior: ${previous.name}`}
        >
          <span aria-hidden="true">‹</span>
        </button>
      ) : null}

      {next ? (
        <button
          className={`${styles.arrow} ${styles.next}`}
          type="button"
          onClick={() => navigateTo("next")}
          disabled={navigating}
          aria-label={`Abrir a próxima moto: ${next.name}`}
        >
          <span aria-hidden="true">›</span>
        </button>
      ) : null}

      {hasNavigation ? (
        <div className={styles.hint} aria-hidden="true">
          <span>←</span>
          <strong>Arraste para trocar de moto</strong>
          <span>→</span>
        </div>
      ) : null}
    </div>
  );
}
