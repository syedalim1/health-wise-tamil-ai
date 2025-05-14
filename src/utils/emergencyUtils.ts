
// List of emergency symptoms by language
interface EmergencyTerms {
  english: string[];
  tamil: string[];
  hindi: string[];
  tanglish: string[];
}

export const emergencyTerms: EmergencyTerms = {
  english: [
    "chest pain", "heart attack", "stroke", "difficulty breathing", 
    "severe bleeding", "unconscious", "seizure", "severe burn", 
    "poisoning", "suicide", "overdose", "severe headache", 
    "head injury", "broken bone", "unable to breathe"
  ],
  tamil: [
    "மார்பு வலி", "இதய தாக்குதல்", "பக்கவாதம்", "சுவாசிக்க சிரமம்", 
    "அதிக இரத்தப்போக்கு", "மயக்கமடைதல்", "வலிப்பு", "கடுமையான எரிகாயம்", 
    "நஞ்சு", "தற்கொலை", "அளவுக்கதிகமான", "கடுமையான தலைவலி", 
    "தலை காயம்", "எலும்பு முறிவு", "சுவாசிக்க முடியவில்லை"
  ],
  hindi: [
    "सीने में दर्द", "दिल का दौरा", "स्ट्रोक", "सांस लेने में कठिनाई", 
    "गंभीर रक्तस्राव", "बेहोश", "दौरा", "गंभीर जलन", 
    "विषाक्तता", "आत्महत्या", "अधिक मात्रा", "गंभीर सिरदर्द", 
    "सिर की चोट", "हड्डी टूटना", "सांस नहीं ले पाना"
  ],
  tanglish: [
    "maarbu vali", "idhaya thaakkuthal", "pakkavatham", "suvaasikka siramam", 
    "adhiga ratthappokku", "mayakkamdaithal", "valippu", "kadumaiyana erikaayam", 
    "nanju", "tharkollai", "alavukkadhigamana", "kadumaiyana thalaivali", 
    "thalai kaayam", "elumbu morivu", "suvaasikka mudiyavillai"
  ]
};

export const isEmergencyMessage = (
  message: string, 
  language: 'english' | 'tamil' | 'hindi' | 'tanglish'
): boolean => {
  const lowerMessage = message.toLowerCase();
  return emergencyTerms[language].some(term => lowerMessage.includes(term));
};
