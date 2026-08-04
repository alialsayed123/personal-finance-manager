import "server-only";

import { APP_TIME_ZONE, getLocalIsoDate } from "@/lib/utils";

export function getTodayInAppTimeZone(): string {
  return getLocalIsoDate(new Date(), APP_TIME_ZONE);
}
