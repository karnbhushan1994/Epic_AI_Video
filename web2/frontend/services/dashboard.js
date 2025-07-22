// D:/epic-app/epic-ai/web/frontend/api/categories.js

export const fetchCurrentMerchantTotalCreations = async () => {
    let url = "/api/v1/app/current-merchant-total-creations";

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
  