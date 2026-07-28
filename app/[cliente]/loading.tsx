import styles from "./loading.module.css";

export default function ClientLoading() {
  return (
    <main className={styles.page} aria-label="Carregando catálogo">
      <div className={styles.banner} />

      <section className={styles.profile}>
        <div className={`${styles.skeleton} ${styles.photo}`} />

        <div className={styles.profileText}>
          <div className={`${styles.skeleton} ${styles.logo}`} />
          <div className={`${styles.skeleton} ${styles.title}`} />
          <div className={`${styles.skeleton} ${styles.text}`} />
          <div className={styles.actions}>
            <div className={`${styles.skeleton} ${styles.button}`} />
            <div className={`${styles.skeleton} ${styles.button}`} />
          </div>
        </div>
      </section>

      <section className={styles.catalog}>
        <div className={`${styles.skeleton} ${styles.heading}`} />
        <div className={`${styles.skeleton} ${styles.search}`} />

        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <article className={styles.card} key={index}>
              <div className={`${styles.skeleton} ${styles.cardTitle}`} />
              <div className={`${styles.skeleton} ${styles.motorcycle}`} />
              <div className={`${styles.skeleton} ${styles.cardButton}`} />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
