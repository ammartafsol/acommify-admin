import { useRouter } from "@/i18n/navigation";
import classes from "./styles.module.css";
import Image from "next/image";
import { mergeClass } from "@/resources/utils/helper";

export default function DashboardStatsCard({
  data,
  cardClass,
  cardContainerClass,
}) {
  const router = useRouter();
  return (
    <div
      className={mergeClass(classes.dashboardCardContainer, cardContainerClass)}
    >
      {data?.map((item, idx) => (
        <div
          style={{ cursor: item?.router ? "pointer" : "default" }}
          onClick={() => {
            if (item?.router) {
              router.push(item?.router);
            }
          }}
          className={mergeClass(cardClass, classes.dashboardCard)}
          key={idx}
        >
          <div className={classes.dashboardCardHeader}>
            {item.isIcon ? (
              item.icon
            ) : (
              <Image src={item.icon} alt="card" width={26} height={26} />
            )}
          </div>
          <div className={classes.dashboardCardBody}>
            <p>{item.title}</p>
            <h2>{item.total}</h2>
          </div>
        </div>
      ))}
    </div>
  );
}
