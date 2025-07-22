// D:/epic-app/epic-ai/web/frontend/hooks/useCategories.js

import { useState, useEffect } from "react";
import { fetchCategories } from "../services/categories"; // adjust path if needed

const useCategories = (type = null) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log(`Fetching categories${type ? ` of type ${type}` : ""}...`);
        const data = await fetchCategories(type);
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [type]);

  return { categories, loading, error };
};

export default useCategories;
