
export const isRTL = (lang) => {
  const rtlLanguages = ['ar', 'ur', 'fa', 'he'];
  return rtlLanguages.includes(lang);
};