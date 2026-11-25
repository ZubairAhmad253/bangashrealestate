/* Website areas list and URL — used by admin dropdowns */
import { AREAS } from '../data/areas';

export const AREA_OPTIONS = AREAS.map((a) => ({ slug: a.slug, name: a.name }));
export const areaName = (slug: string) => AREA_OPTIONS.find((a) => a.slug === slug)?.name ?? (slug === 'other' ? 'Other' : slug);
/** Website links from the admin panel stay on the same domain the admin is opened on */
export const SITE_URL = '';
