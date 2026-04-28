export interface LauncherChangelogEntry {
  version: string;
  date: string;
  notes: string[];
}

export interface LauncherChangelogResponse {
  entries: LauncherChangelogEntry[];
}
