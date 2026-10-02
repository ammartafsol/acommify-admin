"use client";
import DashboardStatsCard from "@/components/molecules/DashboardStatsCards";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { CrudData } from "@/resources/utils/constant";
import { Container } from "react-bootstrap";
import { useSelector } from "react-redux";
import classes from "./styles.module.css";

export default function Crud() {
  const { permissions } = useSelector((state) => state.authReducer);
  const t = useTranslations("crudPage");
  const { user } = useSelector((state) => state.authReducer);
  return (
    <div className={classes.container}>
      <Container className="containerFluid">
        <div className={classes.main}>
          <SubHeader
            title={t("title")}
            showBackBtn
            topSearchSearchAndFilter={false}
          />

          <div className={classes.cardsStats}>
            <DashboardStatsCard
              cardClass={classes.cardClass}
              cardContainerClass={classes.cardContainerClass}
              data={CrudData(t, permissions, user?.role)}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
