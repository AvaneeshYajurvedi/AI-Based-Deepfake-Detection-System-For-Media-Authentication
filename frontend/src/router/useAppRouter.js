import { useEffect, useState } from "react";
import { DEFAULT_PAGE, getPageFromPath, getPathForPage } from "./routes";
import { updateSeoForPage } from "./seo";

export default function useAppRouter() {
  const [page, setPage] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_PAGE;
    return getPageFromPath(window.location.pathname);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    updateSeoForPage(page);
    const nextPath = getPathForPage(page);

    if (window.location.pathname !== nextPath) {
      window.history.pushState({ page }, "", nextPath);
    }
  }, [page]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      setPage(getPageFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return {
    page,
    setPage,
  };
}
