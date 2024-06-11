const useFeatureFlag = (flagKey: string, defaultValue: boolean) => {
  const flagValue = process.env[`NEXT_PUBLIC_${flagKey}`];
  return flagValue === "true" ? true : defaultValue;
};

export default useFeatureFlag;
