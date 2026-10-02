import DraggableContainer from "@/components/atoms/DraggableContainer/DraggableContainer";
import Image from "next/image";
import Link from "next/link";
import classes from "./dashboardCard.module.css";

export default function DashboardCard({ data }) {
  return (
    <DraggableContainer className={classes.dashboardCardContainer}>
      {data?.map((item, idx) => (
        <Link key={idx} href={item.route}>
          <div
            className={classes.dashboardCard}
            key={idx}
            style={{
              background: `url(${
                idx % 2 === 0
                  ? "/app-images/dashboardCardBg.png"
                  : "/app-images/dashboardCardBgDark.png"
              }) no-repeat center center / cover`,
            }}
          >
            <div className={classes.dashboardCardHeader}>
              <Image src={item.icon} alt="card" width={55} height={55} />
            </div>
            <div className={classes.dashboardCardBody}>
              <h2>{item.label}</h2>
            </div>
          </div>
        </Link>
      ))}
    </DraggableContainer>
  );
}
