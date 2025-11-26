// src/systems/tarot/utils/cardImageHelper.ts
/**
 * Helper to get card image sources for React Native
 * Maps card filenames to require() statements for local images
 * 
 * NOTE: All require() statements must be at the top level for Metro bundler
 */

// Import all card images at the top level (required for Metro bundler)
// Major Arcana
const img00_Fool = require('../../../../assets/images/cards/rws/00_Fool.jpg');
const img01_Magician = require('../../../../assets/images/cards/rws/01_Magician.jpg');
const img02_High_Priestess = require('../../../../assets/images/cards/rws/02_High_Priestess.jpg');
const img03_Empress = require('../../../../assets/images/cards/rws/03_Empress.jpg');
const img04_Emperor = require('../../../../assets/images/cards/rws/04_Emperor.jpg');
const img05_Hierophant = require('../../../../assets/images/cards/rws/05_Hierophant.jpg');
const img06_Lovers = require('../../../../assets/images/cards/rws/06_Lovers.jpg');
const img07_Chariot = require('../../../../assets/images/cards/rws/07_Chariot.jpg');
const img08_Strength = require('../../../../assets/images/cards/rws/08_Strength.jpg');
const img09_Hermit = require('../../../../assets/images/cards/rws/09_Hermit.jpg');
const img10_Wheel_of_Fortune = require('../../../../assets/images/cards/rws/10_Wheel_of_Fortune.jpg');
const img11_Justice = require('../../../../assets/images/cards/rws/11_Justice.jpg');
const img12_Hanged_Man = require('../../../../assets/images/cards/rws/12_Hanged_Man.jpg');
const img13_Death = require('../../../../assets/images/cards/rws/13_Death.jpg');
const img14_Temperance = require('../../../../assets/images/cards/rws/14_Temperance.jpg');
const img15_Devil = require('../../../../assets/images/cards/rws/15_Devil.jpg');
const img16_Tower = require('../../../../assets/images/cards/rws/16_Tower.jpg');
const img17_Star = require('../../../../assets/images/cards/rws/17_Star.jpg');
const img18_Moon = require('../../../../assets/images/cards/rws/18_Moon.jpg');
const img19_Sun = require('../../../../assets/images/cards/rws/19_Sun.jpg');
const img20_Judgement = require('../../../../assets/images/cards/rws/20_Judgement.jpg');
const img21_World = require('../../../../assets/images/cards/rws/21_World.jpg');

// Wands
const imgW01 = require('../../../../assets/images/cards/rws/W01_Ace_of_Wands.jpg');
const imgW02 = require('../../../../assets/images/cards/rws/W02_Two_of_Wands.jpg');
const imgW03 = require('../../../../assets/images/cards/rws/W03_Three_of_Wands.jpg');
const imgW04 = require('../../../../assets/images/cards/rws/W04_Four_of_Wands.jpg');
const imgW05 = require('../../../../assets/images/cards/rws/W05_Five_of_Wands.jpg');
const imgW06 = require('../../../../assets/images/cards/rws/W06_Six_of_Wands.jpg');
const imgW07 = require('../../../../assets/images/cards/rws/W07_Seven_of_Wands.jpg');
const imgW08 = require('../../../../assets/images/cards/rws/W08_Eight_of_Wands.jpg');
const imgW09 = require('../../../../assets/images/cards/rws/W09_Nine_of_Wands.jpg');
const imgW10 = require('../../../../assets/images/cards/rws/W10_Ten_of_Wands.jpg');
const imgW11 = require('../../../../assets/images/cards/rws/W11_Page_of_Wands.jpg');
const imgW12 = require('../../../../assets/images/cards/rws/W12_Knight_of_Wands.jpg');
const imgW13 = require('../../../../assets/images/cards/rws/W13_Queen_of_Wands.jpg');
const imgW14 = require('../../../../assets/images/cards/rws/W14_King_of_Wands.jpg');

// Cups
const imgC01 = require('../../../../assets/images/cards/rws/C01_Ace_of_Cups.jpg');
const imgC02 = require('../../../../assets/images/cards/rws/C02_Two_of_Cups.jpg');
const imgC03 = require('../../../../assets/images/cards/rws/C03_Three_of_Cups.jpg');
const imgC04 = require('../../../../assets/images/cards/rws/C04_Four_of_Cups.jpg');
const imgC05 = require('../../../../assets/images/cards/rws/C05_Five_of_Cups.jpg');
const imgC06 = require('../../../../assets/images/cards/rws/C06_Six_of_Cups.jpg');
const imgC07 = require('../../../../assets/images/cards/rws/C07_Seven_of_Cups.jpg');
const imgC08 = require('../../../../assets/images/cards/rws/C08_Eight_of_Cups.jpg');
const imgC09 = require('../../../../assets/images/cards/rws/C09_Nine_of_Cups.jpg');
const imgC10 = require('../../../../assets/images/cards/rws/C10_Ten_of_Cups.jpg');
const imgC11 = require('../../../../assets/images/cards/rws/C11_Page_of_Cups.jpg');
const imgC12 = require('../../../../assets/images/cards/rws/C12_Knight_of_Cups.jpg');
const imgC13 = require('../../../../assets/images/cards/rws/C13_Queen_of_Cups.jpg');
const imgC14 = require('../../../../assets/images/cards/rws/C14_King_of_Cups.jpg');

// Swords
const imgS01 = require('../../../../assets/images/cards/rws/S01_Ace_of_Swords.jpg');
const imgS02 = require('../../../../assets/images/cards/rws/S02_Two_of_Swords.jpg');
const imgS03 = require('../../../../assets/images/cards/rws/S03_Three_of_Swords.jpg');
const imgS04 = require('../../../../assets/images/cards/rws/S04_Four_of_Swords.jpg');
const imgS05 = require('../../../../assets/images/cards/rws/S05_Five_of_Swords.jpg');
const imgS06 = require('../../../../assets/images/cards/rws/S06_Six_of_Swords.jpg');
const imgS07 = require('../../../../assets/images/cards/rws/S07_Seven_of_Swords.jpg');
const imgS08 = require('../../../../assets/images/cards/rws/S08_Eight_of_Swords.jpg');
const imgS09 = require('../../../../assets/images/cards/rws/S09_Nine_of_Swords.jpg');
const imgS10 = require('../../../../assets/images/cards/rws/S10_Ten_of_Swords.jpg');
const imgS11 = require('../../../../assets/images/cards/rws/S11_Page_of_Swords.jpg');
const imgS12 = require('../../../../assets/images/cards/rws/S12_Knight_of_Swords.jpg');
const imgS13 = require('../../../../assets/images/cards/rws/S13_Queen_of_Swords.jpg');
const imgS14 = require('../../../../assets/images/cards/rws/S14_King_of_Swords.jpg');

// Pentacles
const imgP01 = require('../../../../assets/images/cards/rws/P01_Ace_of_Pentacles.jpg');
const imgP02 = require('../../../../assets/images/cards/rws/P02_Two_of_Pentacles.jpg');
const imgP03 = require('../../../../assets/images/cards/rws/P03_Three_of_Pentacles.jpg');
const imgP04 = require('../../../../assets/images/cards/rws/P04_Four_of_Pentacles.jpg');
const imgP05 = require('../../../../assets/images/cards/rws/P05_Five_of_Pentacles.jpg');
const imgP06 = require('../../../../assets/images/cards/rws/P06_Six_of_Pentacles.jpg');
const imgP07 = require('../../../../assets/images/cards/rws/P07_Seven_of_Pentacles.jpg');
const imgP08 = require('../../../../assets/images/cards/rws/P08_Eight_of_Pentacles.jpg');
const imgP09 = require('../../../../assets/images/cards/rws/P09_Nine_of_Pentacles.jpg');
const imgP10 = require('../../../../assets/images/cards/rws/P10_Ten_of_Pentacles.jpg');
const imgP11 = require('../../../../assets/images/cards/rws/P11_Page_of_Pentacles.jpg');
const imgP12 = require('../../../../assets/images/cards/rws/P12_Knight_of_Pentacles.jpg');
const imgP13 = require('../../../../assets/images/cards/rws/P13_Queen_of_Pentacles.jpg');
const imgP14 = require('../../../../assets/images/cards/rws/P14_King_of_Pentacles.jpg');

// Create the mapping
const imageMap: Record<string, any> = {
  '00_Fool.jpg': img00_Fool,
  '01_Magician.jpg': img01_Magician,
  '02_High_Priestess.jpg': img02_High_Priestess,
  '03_Empress.jpg': img03_Empress,
  '04_Emperor.jpg': img04_Emperor,
  '05_Hierophant.jpg': img05_Hierophant,
  '06_Lovers.jpg': img06_Lovers,
  '07_Chariot.jpg': img07_Chariot,
  '08_Strength.jpg': img08_Strength,
  '09_Hermit.jpg': img09_Hermit,
  '10_Wheel_of_Fortune.jpg': img10_Wheel_of_Fortune,
  '11_Justice.jpg': img11_Justice,
  '12_Hanged_Man.jpg': img12_Hanged_Man,
  '13_Death.jpg': img13_Death,
  '14_Temperance.jpg': img14_Temperance,
  '15_Devil.jpg': img15_Devil,
  '16_Tower.jpg': img16_Tower,
  '17_Star.jpg': img17_Star,
  '18_Moon.jpg': img18_Moon,
  '19_Sun.jpg': img19_Sun,
  '20_Judgement.jpg': img20_Judgement,
  '21_World.jpg': img21_World,
  'W01_Ace_of_Wands.jpg': imgW01,
  'W02_Two_of_Wands.jpg': imgW02,
  'W03_Three_of_Wands.jpg': imgW03,
  'W04_Four_of_Wands.jpg': imgW04,
  'W05_Five_of_Wands.jpg': imgW05,
  'W06_Six_of_Wands.jpg': imgW06,
  'W07_Seven_of_Wands.jpg': imgW07,
  'W08_Eight_of_Wands.jpg': imgW08,
  'W09_Nine_of_Wands.jpg': imgW09,
  'W10_Ten_of_Wands.jpg': imgW10,
  'W11_Page_of_Wands.jpg': imgW11,
  'W12_Knight_of_Wands.jpg': imgW12,
  'W13_Queen_of_Wands.jpg': imgW13,
  'W14_King_of_Wands.jpg': imgW14,
  'C01_Ace_of_Cups.jpg': imgC01,
  'C02_Two_of_Cups.jpg': imgC02,
  'C03_Three_of_Cups.jpg': imgC03,
  'C04_Four_of_Cups.jpg': imgC04,
  'C05_Five_of_Cups.jpg': imgC05,
  'C06_Six_of_Cups.jpg': imgC06,
  'C07_Seven_of_Cups.jpg': imgC07,
  'C08_Eight_of_Cups.jpg': imgC08,
  'C09_Nine_of_Cups.jpg': imgC09,
  'C10_Ten_of_Cups.jpg': imgC10,
  'C11_Page_of_Cups.jpg': imgC11,
  'C12_Knight_of_Cups.jpg': imgC12,
  'C13_Queen_of_Cups.jpg': imgC13,
  'C14_King_of_Cups.jpg': imgC14,
  'S01_Ace_of_Swords.jpg': imgS01,
  'S02_Two_of_Swords.jpg': imgS02,
  'S03_Three_of_Swords.jpg': imgS03,
  'S04_Four_of_Swords.jpg': imgS04,
  'S05_Five_of_Swords.jpg': imgS05,
  'S06_Six_of_Swords.jpg': imgS06,
  'S07_Seven_of_Swords.jpg': imgS07,
  'S08_Eight_of_Swords.jpg': imgS08,
  'S09_Nine_of_Swords.jpg': imgS09,
  'S10_Ten_of_Swords.jpg': imgS10,
  'S11_Page_of_Swords.jpg': imgS11,
  'S12_Knight_of_Swords.jpg': imgS12,
  'S13_Queen_of_Swords.jpg': imgS13,
  'S14_King_of_Swords.jpg': imgS14,
  'P01_Ace_of_Pentacles.jpg': imgP01,
  'P02_Two_of_Pentacles.jpg': imgP02,
  'P03_Three_of_Pentacles.jpg': imgP03,
  'P04_Four_of_Pentacles.jpg': imgP04,
  'P05_Five_of_Pentacles.jpg': imgP05,
  'P06_Six_of_Pentacles.jpg': imgP06,
  'P07_Seven_of_Pentacles.jpg': imgP07,
  'P08_Eight_of_Pentacles.jpg': imgP08,
  'P09_Nine_of_Pentacles.jpg': imgP09,
  'P10_Ten_of_Pentacles.jpg': imgP10,
  'P11_Page_of_Pentacles.jpg': imgP11,
  'P12_Knight_of_Pentacles.jpg': imgP12,
  'P13_Queen_of_Pentacles.jpg': imgP13,
  'P14_King_of_Pentacles.jpg': imgP14,
};

export const getCardImageSource = (filename: string): any => {
  return imageMap[filename] || null;
};

// Card back image (placeholder)
export const CARD_BACK_IMAGE = img00_Fool;
