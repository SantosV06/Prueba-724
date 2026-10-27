export type PhoneCountry = {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  groups: number[];
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", dialCode: "1", groups: [3, 3, 4] },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", dialCode: "58", groups: [3, 3, 4] },
  { code: "PA", name: "Panamá", flag: "🇵🇦", dialCode: "507", groups: [4, 4] },
  { code: "CO", name: "Colombia", flag: "🇨🇴", dialCode: "57", groups: [3, 3, 4] },
  { code: "MX", name: "México", flag: "🇲🇽", dialCode: "52", groups: [2, 4, 4] },
  { code: "CA", name: "Canadá", flag: "🇨🇦", dialCode: "1", groups: [3, 3, 4] },
  { code: "BR", name: "Brasil", flag: "🇧🇷", dialCode: "55", groups: [2, 5, 4] },
  { code: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "54", groups: [2, 4, 4] },
  { code: "CL", name: "Chile", flag: "🇨🇱", dialCode: "56", groups: [1, 4, 4] },
  { code: "PE", name: "Perú", flag: "🇵🇪", dialCode: "51", groups: [3, 3, 3] },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", dialCode: "593", groups: [2, 3, 4] },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", dialCode: "506", groups: [4, 4] },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", dialCode: "502", groups: [4, 4] },
  { code: "HN", name: "Honduras", flag: "🇭🇳", dialCode: "504", groups: [4, 4] },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", dialCode: "503", groups: [4, 4] },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮", dialCode: "505", groups: [4, 4] },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴", dialCode: "1", groups: [3, 3, 4] },
  { code: "PR", name: "Puerto Rico", flag: "🇵🇷", dialCode: "1", groups: [3, 3, 4] },
  { code: "ES", name: "España", flag: "🇪🇸", dialCode: "34", groups: [3, 2, 2, 2] },
  { code: "PT", name: "Portugal", flag: "🇵🇹", dialCode: "351", groups: [3, 3, 3] },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧", dialCode: "44", groups: [4, 3, 3] },
  { code: "FR", name: "Francia", flag: "🇫🇷", dialCode: "33", groups: [1, 2, 2, 2, 2] },
  { code: "DE", name: "Alemania", flag: "🇩🇪", dialCode: "49", groups: [3, 3, 4] },
  { code: "IT", name: "Italia", flag: "🇮🇹", dialCode: "39", groups: [3, 3, 4] },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "91", groups: [5, 5] },
  { code: "PH", name: "Filipinas", flag: "🇵🇭", dialCode: "63", groups: [3, 3, 4] },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "61", groups: [3, 3, 3] },
  { code: "NZ", name: "Nueva Zelanda", flag: "🇳🇿", dialCode: "64", groups: [3, 3, 3] },
  { code: "JP", name: "Japón", flag: "🇯🇵", dialCode: "81", groups: [2, 4, 4] },
  { code: "CN", name: "China", flag: "🇨🇳", dialCode: "86", groups: [3, 4, 4] },
  { code: "KR", name: "Corea del Sur", flag: "🇰🇷", dialCode: "82", groups: [3, 3, 4] },
  { code: "ZA", name: "Sudáfrica", flag: "🇿🇦", dialCode: "27", groups: [2, 3, 4] },
  { code: "AE", name: "Emiratos Árabes Unidos", flag: "🇦🇪", dialCode: "971", groups: [2, 3, 4] },
];

export const normalizePhone = (value: string) => value.replace(/[ ()-]/g, "");

export function formatNationalPhone(value: string, country: PhoneCountry): string {
  const maxDigits = country.groups.reduce((sum, group) => sum + group, 0);
  const digits = value.replace(/\D/g, "").slice(0, maxDigits);
  const parts: string[] = [];
  let offset = 0;
  for (const size of country.groups) {
    if (offset >= digits.length) break;
    parts.push(digits.slice(offset, offset + size));
    offset += size;
  }
  return parts.join(" ");
}

export function isInternationalPhone(value: string) {
  return (
    value.length <= 40 &&
    /^\+[1-9][0-9 ()-]*$/.test(value) &&
    /^\+[1-9][0-9]{7,14}$/.test(normalizePhone(value))
  );
}
