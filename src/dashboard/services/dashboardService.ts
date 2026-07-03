import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../Firebase/db";
import type { Project } from "../types";

export async function fetchClientProjects(uid: string): Promise<Project[]> {
  const q = query(collection(db, "projects"), where("clientId", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Project);
}

export function subscribeClientProjects(
  uid: string,
  onUpdate: (projects: Project[]) => void,
  onError: (error: Error) => void
) {
  const q = query(collection(db, "projects"), where("clientId", "==", uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const projects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Project);
      onUpdate(projects);
    },
    (error) => {
      onError(error);
    }
  );
}

export async function fetchProjectById(
  projectId: string,
): Promise<Project | null> {
  const snap = await getDoc(doc(db, "projects", projectId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Project;
}
