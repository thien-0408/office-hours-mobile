import { api } from './client';
import type { CampusRoom } from './domainTypes';

/** GET /campus/rooms?buildingCode: plain array ordered by buildingCode, floor, name. */
export function listCampusRooms(buildingCode?: string): Promise<CampusRoom[]> {
  return api.get<CampusRoom[]>('/campus/rooms', { query: { buildingCode } });
}
