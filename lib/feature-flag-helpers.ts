export const getFeatureFlag = (
  flagKey: string,
  defaultValue: boolean = false,
  searchParams?: { [key: string]: string }
) => {
  const queryFlag = searchParams?.[flagKey];
  if (searchParams !== null && queryFlag !== null) {
    return queryFlag === "true";
  }
  const envFlag = process.env[`NEXT_PUBLIC_${flagKey}`];
  return envFlag === "true" ? true : defaultValue;
};
