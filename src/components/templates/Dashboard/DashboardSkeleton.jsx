import styles from "./styles.module.css";

const Bone = ({ className = "", style }) => (
  <span className={`${styles.skeleton} ${className}`} style={style} />
);

const ListSkeleton = ({ rows = 4 }) =>
  Array.from({ length: rows }).map((_, i) => (
    <div key={i} className={styles.skeletonListItem}>
      <Bone className={styles.skeletonIconSm} />
      <div className={styles.skeletonLines}>
        <Bone style={{ width: "40%", height: 14 }} />
        <Bone style={{ width: "85%", height: 12 }} />
      </div>
      <Bone style={{ width: 90, height: 12 }} />
    </div>
  ));

export default function DashboardSkeleton({ showSidePanels = true }) {
  return (
    <div className={styles.containerClass} aria-busy="true" aria-live="polite">
      <div className={styles.dashboardContainer}>
        <div className={styles.leftMain}>
          {/* Stats cards */}
          <div className={styles.skeletonStatsGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonStatCard}>
                <Bone className={styles.skeletonCircle} />
                <div className={styles.skeletonLines}>
                  <Bone style={{ width: 60, height: 26 }} />
                  <Bone style={{ width: "70%", height: 14 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Quick-action cards */}
          <div className={styles.skeletonActionRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Bone key={i} className={styles.skeletonActionCard} />
            ))}
          </div>

          {/* Chart */}
          {showSidePanels && (
            <div className={styles.activitiesCardMain}>
              <div className={styles.skeletonChartHeader}>
                <Bone style={{ width: 220, height: 22 }} />
                <Bone style={{ width: 100, height: 36 }} />
              </div>
              <Bone className={styles.skeletonChart} />
            </div>
          )}
        </div>

        {showSidePanels && (
          <div className={styles.rightMain}>
            <div className={styles.activitiesCardMain}>
              <div className={styles.skeletonLines}>
                <Bone style={{ width: 240, height: 24 }} />
                <Bone style={{ width: 180, height: 14 }} />
              </div>
              <ListSkeleton rows={4} />
            </div>

            <div className={styles.activitiesCardMain}>
              <div className={styles.skeletonLines}>
                <Bone style={{ width: 200, height: 24 }} />
                <Bone style={{ width: 160, height: 14 }} />
              </div>
              <div className={styles.skeletonTabs}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Bone key={i} style={{ width: 110, height: 36, borderRadius: 20 }} />
                ))}
              </div>
              <ListSkeleton rows={3} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
