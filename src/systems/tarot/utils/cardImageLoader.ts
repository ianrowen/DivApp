// src/systems/tarot/utils/cardImageLoader.ts

// Map of all card images
// Updated to use WebP format for optimized file sizes and better performance
const CARD_IMAGES: { [key: string]: any } = {
  // Major Arcana
  '00': require('../../../../assets/images/cards/rws/00_Fool.webp'),
  '01': require('../../../../assets/images/cards/rws/01_Magician.webp'),
  '02': require('../../../../assets/images/cards/rws/02_High_Priestess.webp'),
  '03': require('../../../../assets/images/cards/rws/03_Empress.webp'),
  '04': require('../../../../assets/images/cards/rws/04_Emperor.webp'),
  '05': require('../../../../assets/images/cards/rws/05_Hierophant.webp'),
  '06': require('../../../../assets/images/cards/rws/06_Lovers.webp'),
  '07': require('../../../../assets/images/cards/rws/07_Chariot.webp'),
  '08': require('../../../../assets/images/cards/rws/08_Strength.webp'),
  '09': require('../../../../assets/images/cards/rws/09_Hermit.webp'),
  '10': require('../../../../assets/images/cards/rws/10_Wheel_of_Fortune.webp'),
  '11': require('../../../../assets/images/cards/rws/11_Justice.webp'),
  '12': require('../../../../assets/images/cards/rws/12_Hanged_Man.webp'),
  '13': require('../../../../assets/images/cards/rws/13_Death.webp'),
  '14': require('../../../../assets/images/cards/rws/14_Temperance.webp'),
  '15': require('../../../../assets/images/cards/rws/15_Devil.webp'),
  '16': require('../../../../assets/images/cards/rws/16_Tower.webp'),
  '17': require('../../../../assets/images/cards/rws/17_Star.webp'),
  '18': require('../../../../assets/images/cards/rws/18_Moon.webp'),
  '19': require('../../../../assets/images/cards/rws/19_Sun.webp'),
  '20': require('../../../../assets/images/cards/rws/20_Judgement.webp'),
  '21': require('../../../../assets/images/cards/rws/21_World.webp'),
  
  // Cups
  'C01': require('../../../../assets/images/cards/rws/C01_Ace_of_Cups.webp'),
  'C02': require('../../../../assets/images/cards/rws/C02_Two_of_Cups.webp'),
  'C03': require('../../../../assets/images/cards/rws/C03_Three_of_Cups.webp'),
  'C04': require('../../../../assets/images/cards/rws/C04_Four_of_Cups.webp'),
  'C05': require('../../../../assets/images/cards/rws/C05_Five_of_Cups.webp'),
  'C06': require('../../../../assets/images/cards/rws/C06_Six_of_Cups.webp'),
  'C07': require('../../../../assets/images/cards/rws/C07_Seven_of_Cups.webp'),
  'C08': require('../../../../assets/images/cards/rws/C08_Eight_of_Cups.webp'),
  'C09': require('../../../../assets/images/cards/rws/C09_Nine_of_Cups.webp'),
  'C10': require('../../../../assets/images/cards/rws/C10_Ten_of_Cups.webp'),
  'C11': require('../../../../assets/images/cards/rws/C11_Page_of_Cups.webp'),
  'C12': require('../../../../assets/images/cards/rws/C12_Knight_of_Cups.webp'),
  'C13': require('../../../../assets/images/cards/rws/C13_Queen_of_Cups.webp'),
  'C14': require('../../../../assets/images/cards/rws/C14_King_of_Cups.webp'),
  
  // Wands
  'W01': require('../../../../assets/images/cards/rws/W01_Ace_of_Wands.webp'),
  'W02': require('../../../../assets/images/cards/rws/W02_Two_of_Wands.webp'),
  'W03': require('../../../../assets/images/cards/rws/W03_Three_of_Wands.webp'),
  'W04': require('../../../../assets/images/cards/rws/W04_Four_of_Wands.webp'),
  'W05': require('../../../../assets/images/cards/rws/W05_Five_of_Wands.webp'),
  'W06': require('../../../../assets/images/cards/rws/W06_Six_of_Wands.webp'),
  'W07': require('../../../../assets/images/cards/rws/W07_Seven_of_Wands.webp'),
  'W08': require('../../../../assets/images/cards/rws/W08_Eight_of_Wands.webp'),
  'W09': require('../../../../assets/images/cards/rws/W09_Nine_of_Wands.webp'),
  'W10': require('../../../../assets/images/cards/rws/W10_Ten_of_Wands.webp'),
  'W11': require('../../../../assets/images/cards/rws/W11_Page_of_Wands.webp'),
  'W12': require('../../../../assets/images/cards/rws/W12_Knight_of_Wands.webp'),
  'W13': require('../../../../assets/images/cards/rws/W13_Queen_of_Wands.webp'),
  'W14': require('../../../../assets/images/cards/rws/W14_King_of_Wands.webp'),
  
  // Swords
  'S01': require('../../../../assets/images/cards/rws/S01_Ace_of_Swords.webp'),
  'S02': require('../../../../assets/images/cards/rws/S02_Two_of_Swords.webp'),
  'S03': require('../../../../assets/images/cards/rws/S03_Three_of_Swords.webp'),
  'S04': require('../../../../assets/images/cards/rws/S04_Four_of_Swords.webp'),
  'S05': require('../../../../assets/images/cards/rws/S05_Five_of_Swords.webp'),
  'S06': require('../../../../assets/images/cards/rws/S06_Six_of_Swords.webp'),
  'S07': require('../../../../assets/images/cards/rws/S07_Seven_of_Swords.webp'),
  'S08': require('../../../../assets/images/cards/rws/S08_Eight_of_Swords.webp'),
  'S09': require('../../../../assets/images/cards/rws/S09_Nine_of_Swords.webp'),
  'S10': require('../../../../assets/images/cards/rws/S10_Ten_of_Swords.webp'),
  'S11': require('../../../../assets/images/cards/rws/S11_Page_of_Swords.webp'),
  'S12': require('../../../../assets/images/cards/rws/S12_Knight_of_Swords.webp'),
  'S13': require('../../../../assets/images/cards/rws/S13_Queen_of_Swords.webp'),
  'S14': require('../../../../assets/images/cards/rws/S14_King_of_Swords.webp'),
  
  // Pentacles
  'P01': require('../../../../assets/images/cards/rws/P01_Ace_of_Pentacles.webp'),
  'P02': require('../../../../assets/images/cards/rws/P02_Two_of_Pentacles.webp'),
  'P03': require('../../../../assets/images/cards/rws/P03_Three_of_Pentacles.webp'),
  'P04': require('../../../../assets/images/cards/rws/P04_Four_of_Pentacles.webp'),
  'P05': require('../../../../assets/images/cards/rws/P05_Five_of_Pentacles.webp'),
  'P06': require('../../../../assets/images/cards/rws/P06_Six_of_Pentacles.webp'),
  'P07': require('../../../../assets/images/cards/rws/P07_Seven_of_Pentacles.webp'),
  'P08': require('../../../../assets/images/cards/rws/P08_Eight_of_Pentacles.webp'),
  'P09': require('../../../../assets/images/cards/rws/P09_Nine_of_Pentacles.webp'),
  'P10': require('../../../../assets/images/cards/rws/P10_Ten_of_Pentacles.webp'),
  'P11': require('../../../../assets/images/cards/rws/P11_Page_of_Pentacles.webp'),
  'P12': require('../../../../assets/images/cards/rws/P12_Knight_of_Pentacles.webp'),
  'P13': require('../../../../assets/images/cards/rws/P13_Queen_of_Pentacles.webp'),
  'P14': require('../../../../assets/images/cards/rws/P14_King_of_Pentacles.webp'),
};

export function getCardImage(code: string) {
  // #region agent log
  const startTime = Date.now();
  const imageSource = CARD_IMAGES[code] || CARD_IMAGES['00']; // Fallback to Fool
  const endTime = Date.now();
  fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cardImageLoader.ts:96',message:'getCardImage called',data:{cardCode:code,lookupTime:endTime-startTime,found:!!CARD_IMAGES[code]},timestamp:endTime,sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  return imageSource;
}