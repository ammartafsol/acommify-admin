"use client";
import DashboardStatsCard from "@/components/molecules/DashboardStatsCards";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { CMSData } from "@/resources/utils/constant";
import { Container } from "react-bootstrap";
import classes from "./styles.module.css";
export default function Cms() {
  const t = useTranslations("cmsPage");
  return (
    <div className={classes.container}>
      <Container className="containerFluid">
        <div className={classes.main}>
          <SubHeader title={t("title")} topSearchSearchAndFilter={false} />

          
            <div className={classes.cardsStats}>
                <DashboardStatsCard
                  cardClass={classes.cardClass}
                  cardContainerClass={classes.cardContainerClass}
                  data={CMSData(t)}
                />
            </div>
        </div>
      </Container>
    </div>
  );
}
