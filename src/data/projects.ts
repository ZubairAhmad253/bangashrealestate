/* Construction projects (gallery) — admin panel (/admin → Projects) se aate hain. */
import { remote, type ProjectRow } from '../lib/remote';

export type Project = ProjectRow;

export const PROJECTS: Project[] = remote.projects.filter((p) => p.images?.length);

export const categoryLabel: Record<Project['category'], string> = {
  house: 'House Construction',
  flats: 'Flats / Apartments',
  renovation: 'Renovation',
  commercial: 'Commercial',
};

export const statusLabel: Record<Project['status'], string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
};
