// Simple utility to provide test roles for development
export function getTestRoles(userId: string): string[] {
  // For the main admin/developer ID
  if (userId === "238329746671271936") {
    return [
      "932585751332421642", // Admin
      "1042168064805965864", // Mod
    ];
  }

  // Default case - no special roles
  return [];
}
