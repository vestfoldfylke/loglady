export const isNodeEnvironment = (): boolean => {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  );
};