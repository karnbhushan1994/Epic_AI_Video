const fetchLibraryData = async (type) => {
  try {
    const res = await fetch(`/api/v1/app/get-library-data?type=${encodeURIComponent(type)}`);
    const contentType = res.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching library data:", err);
    return null;
  }
};

export default fetchLibraryData; // ✅ not fetchLibraryData()
