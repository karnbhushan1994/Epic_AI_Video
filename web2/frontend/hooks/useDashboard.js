
import { useState, useEffect } from "react";
import { fetchCurrentMerchantTotalCreations } from "../services/dashboard";

const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalCreations: 0,
    videoTemplates: 89, // Keeping static for now as per dashboard page
    imageTemplates: 53, // Keeping static for now as per dashboard page
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const creationsData = await fetchCurrentMerchantTotalCreations();
        console.log(creationsData);
        setDashboardData(prevData => ({
          ...prevData,
          totalCreations: creationsData.creations,
        }));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return { dashboardData, loading, error };
};

export default useDashboard;
