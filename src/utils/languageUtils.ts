
export type Language = 'english' | 'tamil' | 'hindi' | 'tanglish';

export interface LanguageStrings {
  appTitle: string;
  tabletReminder: string;
  stockTracker: string;
  chatAssistant: string;
  morning: string;
  afternoon: string;
  evening: string;
  night: string;
  addMedication: string;
  medicationName: string;
  dosage: string;
  schedule: string;
  save: string;
  cancel: string;
  stockLeft: string;
  refillNeeded: string;
  refillAlert: string;
  chatPlaceholder: string;
  send: string;
  emergencyAlert: string;
  emergencyMessage: string;
}

// The base English strings
const englishStrings: LanguageStrings = {
  appTitle: "Smart Health Companion",
  tabletReminder: "Medication Reminders",
  stockTracker: "Stock Tracker",
  chatAssistant: "Health Assistant",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
  addMedication: "Add Medication",
  medicationName: "Medication Name",
  dosage: "Dosage",
  schedule: "Schedule",
  save: "Save",
  cancel: "Cancel",
  stockLeft: "Tablets Left",
  refillNeeded: "Refill Needed",
  refillAlert: "Only {count} tablets left. Time to refill your prescription.",
  chatPlaceholder: "Ask about your health concerns...",
  send: "Send",
  emergencyAlert: "Emergency Alert",
  emergencyMessage: "This might be an emergency. Please call 108 or visit the nearest hospital.",
};

// Tamil translations
const tamilStrings: LanguageStrings = {
  appTitle: "ஸ்மார்ட் ஹெல்த் கம்பானியன்",
  tabletReminder: "மருந்து நினைவூட்டல்கள்",
  stockTracker: "ஸ்டாக் ட்ராக்கர்",
  chatAssistant: "ஆரோக்கிய உதவியாளர்",
  morning: "காலை",
  afternoon: "மதியம்",
  evening: "மாலை",
  night: "இரவு",
  addMedication: "மருந்து சேர்க்க",
  medicationName: "மருந்து பெயர்",
  dosage: "அளவு",
  schedule: "அட்டவணை",
  save: "சேமி",
  cancel: "ரத்து செய்",
  stockLeft: "மிஞ்சியுள்ள மாத்திரைகள்",
  refillNeeded: "நிரப்ப வேண்டும்",
  refillAlert: "வெறும் {count} மாத்திரைகள் மட்டுமே உள்ளன. உங்கள் மருந்து சீட்டை நிரப்ப நேரம்.",
  chatPlaceholder: "உங்கள் ஆரோக்கிய கவலைகள் பற்றி கேளுங்கள்...",
  send: "அனுப்பு",
  emergencyAlert: "அவசர எச்சரிக்கை",
  emergencyMessage: "இது ஒரு அவசரநிலையாக இருக்கலாம். தயவுசெய்து 108ஐ அழைக்கவும் அல்லது அருகிலுள்ள மருத்துவமனைக்குச் செல்லவும்.",
};

// Hindi translations
const hindiStrings: LanguageStrings = {
  appTitle: "स्मार्ट हेल्थ कम्पैनियन",
  tabletReminder: "दवा अनुस्मारक",
  stockTracker: "स्टॉक ट्रैकर",
  chatAssistant: "स्वास्थ्य सहायक",
  morning: "सुबह",
  afternoon: "दोपहर",
  evening: "शाम",
  night: "रात",
  addMedication: "दवा जोड़ें",
  medicationName: "दवा का नाम",
  dosage: "खुराक",
  schedule: "अनुसूची",
  save: "सहेजें",
  cancel: "रद्द करें",
  stockLeft: "बची हुई गोलियां",
  refillNeeded: "रिफिल की आवश्यकता है",
  refillAlert: "केवल {count} गोलियां बची हैं। अपना नुस्खा रिफिल करने का समय।",
  chatPlaceholder: "अपने स्वास्थ्य संबंधी चिंताओं के बारे में पूछें...",
  send: "भेजें",
  emergencyAlert: "आपातकालीन अलर्ट",
  emergencyMessage: "यह एक आपातकालीन स्थिति हो सकती है। कृपया 108 पर कॉल करें या नजदीकी अस्पताल जाएँ।",
};

// Tanglish translations (Tamil written with English characters)
const tanglishStrings: LanguageStrings = {
  appTitle: "Smart Health Companion",
  tabletReminder: "Marundu Ninaivutalgal",
  stockTracker: "Stock Tracker",
  chatAssistant: "Arokkiya Uthaviyalar",
  morning: "Kaalai",
  afternoon: "Madhiyam",
  evening: "Maalai",
  night: "Iravu",
  addMedication: "Marundu Serka",
  medicationName: "Marundu Peyar",
  dosage: "Alavu",
  schedule: "Adavanai",
  save: "Save",
  cancel: "Rathu Sei",
  stockLeft: "Minchiyulla Mathiraigal",
  refillNeeded: "Nirappu Thevai",
  refillAlert: "Verum {count} mathiraigal mattume ullana. Ungal marundu seettai nirappu neram.",
  chatPlaceholder: "Ungal arokkiya kavalaikal patri kelungal...",
  send: "Anuppu",
  emergencyAlert: "Avasara Echcharikai",
  emergencyMessage: "Ithu oru avasara nilai irukkalam. Thayavu seithu 108 azhaikavum alladu arugil ulla maruthuvamanaikku sellvum.",
};

const allLanguages: Record<Language, LanguageStrings> = {
  english: englishStrings,
  tamil: tamilStrings,
  hindi: hindiStrings,
  tanglish: tanglishStrings,
};

export const getLanguageStrings = (language: Language): LanguageStrings => {
  return allLanguages[language] || englishStrings;
};

export const formatString = (
  template: string,
  values: Record<string, string | number>
): string => {
  return Object.keys(values).reduce((result, key) => {
    return result.replace(new RegExp(`{${key}}`, "g"), String(values[key]));
  }, template);
};
