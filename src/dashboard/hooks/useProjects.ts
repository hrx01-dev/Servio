import { useEffect, useState } from "react";
import { useAuth } from "../../Firebase/useAuth";
import { fetchClientProjects } from "../services/dashboardService";
import { DEMO_PROJECT } from "../services/demoData";
import type { Project } from "../types";

export function useProjects() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const data = await fetchClientProjects(currentUser!.uid);
        if (cancelled) return;
        if (data.length > 0) {
          setProjects(data);
          setIsDemo(false);
        } else {
          setProjects([DEMO_PROJECT]);
          setIsDemo(true);
        }
      } catch {
        if (cancelled) return;
        setProjects([DEMO_PROJECT]);
        setIsDemo(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return { projects, loading, isDemo };
}
