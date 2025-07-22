// D:/epic-app/epic-ai/web/frontend/api/categories.js

export const fetchCategories = async (type = null) => {
  let url = "/api/v1/app/list-categories";
  if (type) {
    url += `?type=${encodeURIComponent(type)}`;
  }

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Cache-Control": "no-cache",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return res.json();
};
