import type { Metadata } from "next";

import { SettingsClient } from "@/components/settings/settings-client";
import { getSettings } from "@/services/finance-service";
import { getAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const [settings, user] = await Promise.all([getSettings(), getAuthenticatedUser()]);
  return <SettingsClient settings={settings} email={user.email} />;
}
