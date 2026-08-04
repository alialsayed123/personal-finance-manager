export type ActionResult<T = undefined> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
