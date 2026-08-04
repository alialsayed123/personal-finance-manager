import { z } from "zod";

import { APP_LANGUAGES, APP_THEMES } from "@/types/finance";

export const settingsSchema = z.object({
  language: z.enum(APP_LANGUAGES),
  theme: z.enum(APP_THEMES),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
