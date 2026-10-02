"use client";
import { BsThreeDots } from "react-icons/bs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { useMemo } from "react";
import classes from "./DemographicBreakdown.module.css";

// Helper function to group ages into age ranges
const groupAgesIntoRanges = (ages, isChildren) => {
  if (!ages || ages.length === 0) return {};
  
  const ageGroups = {};
  
  ages.forEach((age) => {
    let range;
    if (isChildren) {
      if (age <= 5) range = "0-5";
      else if (age <= 10) range = "6-10";
      else if (age <= 17) range = "11-17";
      else range = "18+";
    } else {
      if (age <= 25) range = "18-25";
      else if (age <= 35) range = "26-35";
      else if (age <= 45) range = "36-45";
      else range = "46+";
    }
    
    if (!ageGroups[range]) {
      ageGroups[range] = 0;
    }
    ageGroups[range]++;
  });
  
  return ageGroups;
};

// Transform API data to chart format
const transformData = (apiData) => {
  if (!apiData || (!apiData.children && !apiData.adults)) {
    return null;
  }

  const transformGroup = (group, isChildren) => {
    if (!group || !group.genders) {
      return {
        total: 0,
        byAge: [],
        byGender: { male: 0, female: 0, other: 0 },
      };
    }

    // Calculate gender totals
    let maleTotal = 0;
    let femaleTotal = 0;
    let otherTotal = 0;
    const ageGroupsMap = {};

    group.genders.forEach((genderData) => {
      const gender = genderData.gender?.toLowerCase();
      const count = genderData.total || 0;

      if (gender === "male") {
        maleTotal += count;
      } else if (gender === "female") {
        femaleTotal += count;
      } else {
        // Handle "other" or any other gender value
        otherTotal += count;
      }

      // Group ages by range
      if (genderData.ages && genderData.ages.length > 0) {
        const groupedAges = groupAgesIntoRanges(genderData.ages, isChildren);
        
        Object.keys(groupedAges).forEach((range) => {
          if (!ageGroupsMap[range]) {
            ageGroupsMap[range] = { male: 0, female: 0, other: 0 };
          }
          if (gender === "male") {
            ageGroupsMap[range].male += groupedAges[range];
          } else if (gender === "female") {
            ageGroupsMap[range].female += groupedAges[range];
          } else {
            ageGroupsMap[range].other += groupedAges[range];
          }
        });
      }
    });

    // Convert age groups map to array
    const ageRanges = isChildren
      ? ["0-5", "6-10", "11-17", "18+"]
      : ["18-25", "26-35", "36-45", "46+"];

    const byAge = ageRanges
      .filter((range) => ageGroupsMap[range])
      .map((range) => ({
        age: range,
        male: ageGroupsMap[range].male || 0,
        female: ageGroupsMap[range].female || 0,
        other: ageGroupsMap[range].other || 0,
        total: (ageGroupsMap[range].male || 0) + (ageGroupsMap[range].female || 0) + (ageGroupsMap[range].other || 0),
      }));

    return {
      total: group.total || 0,
      byAge,
      byGender: {
        male: maleTotal,
        female: femaleTotal,
        other: otherTotal,
      },
    };
  };

  return {
    children: transformGroup(apiData.children, true),
    adults: transformGroup(apiData.adults, false),
  };
};

export default function DemographicBreakdown({ title, data }) {
  const t = useTranslations("reportsAnalyticsPage");

  // Transform API data to chart format
  const transformedData = useMemo(() => {
    if (!data || Object.keys(data).length === 0) {
      return null;
    }
    return transformData(data);
  }, [data]);

  // If no data, show empty state
  if (!transformedData) {
    return (
      <div className={classes.container}>
        <div className={classes.header}>
          <p>{title}</p>
          <BsThreeDots size={24} color="#000" />
        </div>
        <div className={classes.content}>
          <p style={{ padding: "24px", textAlign: "center", color: "rgba(0, 0, 0, 0.60)" }}>
            {t("noData") || "No data available"}
          </p>
        </div>
      </div>
    );
  }

  // Prepare children data for chart
  const childrenData = transformedData.children.byAge.map((item) => ({
    age: item.age,
    Male: item.male,
    Female: item.female,
    Other: item.other,
  }));

  // Prepare adults data for chart
  const adultsData = transformedData.adults.byAge.map((item) => ({
    age: item.age,
    Male: item.male,
    Female: item.female,
    Other: item.other,
  }));
  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <p>{title}</p>
      </div>

      <div className={classes.content}>
        {/* Children Section */}
        <div className={classes.section}>
          <div className={classes.sectionHeader}>
            <h3 className={classes.sectionTitle}>
              {transformedData.children.total} {t("children") || "Children"}
            </h3>
            <div className={classes.genderStats}>
              <span className={classes.genderItem}>
                {t("male") || "Male"}: {transformedData.children.byGender.male}
              </span>
              <span className={classes.genderItem}>
                {t("female") || "Female"}: {transformedData.children.byGender.female}
              </span>
              <span className={classes.genderItem}>
                {t("other") || "Other"}: {transformedData.children.byGender.other}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={childrenData} tabIndex={-1}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="age"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `age (${value})`}
                tick={{
                  fontSize: 13,
                  fontWeight: 400,
                  fill: "rgba(0, 0, 0, 0.60)",
                }}
              />
              <YAxis
                axisLine={false}
                tick={{
                  fontSize: 13,
                  fontWeight: 400,
                  fill: "rgba(0, 0, 0, 0.60)",
                }}
              />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Legend />
              <Bar dataKey="Male" fill="#1997ED" barSize={40} name={t("male") || "Male"} />
              <Bar dataKey="Female" fill="#FF6B9D" barSize={40} name={t("female") || "Female"} />
              <Bar dataKey="Other" fill="#9B59B6" barSize={40} name={t("other") || "Other"} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Adults Section */}
        <div className={classes.section}>
          <div className={classes.sectionHeader}>
            <h3 className={classes.sectionTitle}>
              {transformedData.adults.total} {t("adults") || "Adults"}
            </h3>
            <div className={classes.genderStats}>
              <span className={classes.genderItem}>
                {t("male") || "Male"}: {transformedData.adults.byGender.male}
              </span>
              <span className={classes.genderItem}>
                {t("female") || "Female"}: {transformedData.adults.byGender.female}
              </span>
              <span className={classes.genderItem}>
                {t("other") || "Other"}: {transformedData.adults.byGender.other}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={adultsData} tabIndex={-1}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="age"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `age (${value})`}
                tick={{
                  fontSize: 13,
                  fontWeight: 400,
                  fill: "rgba(0, 0, 0, 0.60)",
                }}
              />
              <YAxis
                axisLine={false}
                tick={{
                  fontSize: 13,
                  fontWeight: 400,
                  fill: "rgba(0, 0, 0, 0.60)",
                }}
              />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Legend />
              <Bar dataKey="Male" fill="#1997ED" barSize={40} name={t("male") || "Male"} />
              <Bar dataKey="Female" fill="#FF6B9D" barSize={40} name={t("female") || "Female"} />
              <Bar dataKey="Other" fill="#9B59B6" barSize={40} name={t("other") || "Other"} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
