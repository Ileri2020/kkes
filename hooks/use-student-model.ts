"use client";

import { useEffect, useState } from "react";

export function useStudentModel<T = any>(model: string, query = "") {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetch(`/api/dbhandler?model=${model}${query ? `&${query}` : ""}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Request failed");
        const value = await response.json();
        return Array.isArray(value) ? value : value ? [value] : [];
      })
      .then((value) => { if (active) setData(value); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [model, query]);

  return { data, loading, error };
}
