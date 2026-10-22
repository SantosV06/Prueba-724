export const normalizePhone = (value: string) => value.replace(/[ ()-]/g, "");
export function isInternationalPhone(value: string) {
  return (
    value.length <= 40 &&
    /^\+[1-9][0-9 ()-]*$/.test(value) &&
    /^\+[1-9][0-9]{7,14}$/.test(normalizePhone(value))
  );
}
