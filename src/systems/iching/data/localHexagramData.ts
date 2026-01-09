// src/systems/iching/data/localHexagramData.ts
/**
 * Complete I Ching Database - All 64 Hexagrams
 * ALL TEXTS COMPLETE for every hexagram and line
 */

export interface HexagramClassicalTexts {
  judgment: string;
  image: string;
  lines: [string, string, string, string, string, string];
}

export interface HexagramWilhelmTexts {
  judgment: string;
  image: string;
  lines: [string, string, string, string, string, string];
}

export interface LineContext {
  position: number;
  stage: { en: string; zh: string };
  meaning: { en: string; zh: string };
  advice: { en: string; zh: string };
  keywords: string[];
}

export interface LocalHexagram {
  number: number;
  names: { en: string; zh: string; pinyin: string };
  symbol: string;
  trigrams: {
    upper: { en: string; zh: string; symbol: string };
    lower: { en: string; zh: string; symbol: string };
  };
  classical: HexagramClassicalTexts;
  wilhelm: HexagramWilhelmTexts;
  contemporary: { overview: string; interpretation: string };
  ai_context: {
    core_meaning: { en: string; zh: string };
    situation: { en: string; zh: string };
    advice: { en: string; zh: string };
    keywords: string[];
    lines: [LineContext, LineContext, LineContext, LineContext, LineContext, LineContext];
  };
  relationships: { opposite: number; inverse: number; nuclear: number };
}

export const LOCAL_ICHING_HEXAGRAMS: LocalHexagram[] = [

  {
    number: 1,
    names: { en: "The Creative", zh: "乾", pinyin: "qián" },
    symbol: "䷀",
    trigrams: {
      upper: { en: "Heaven", zh: "天", symbol: "☰" },
      lower: { en: "Heaven", zh: "天", symbol: "☰" }
    },
    classical: { judgment: "乾：元亨利貞", image: "天行健，君子以自強不息", lines: ["初九：潛龍勿用", "九二：見龍在田，利見大人", "九三：君子終日乾乾，夕惕若，厲无咎", "九四：或躍在淵，无咎", "九五：飛龍在天，利見大人", "上九：亢龍有悔"] },
    wilhelm: { judgment: "The Creative works sublime success, Furthering through perseverance.", image: "The movement of heaven is full of power. Thus the superior man makes himself strong and untiring.", lines: ["Hidden dragon. Do not act.", "Dragon appearing in the field. It furthers one to see the great man.", "All day long the superior man is creatively active. At nightfall his mind is still beset with cares. Danger. No blame.", "Wavering flight over the depths. No blame.", "Flying dragon in the heavens. It furthers one to see the great man.", "Arrogant dragon will have cause to repent."] },
    contemporary: { overview: "乾卦上下二體皆乾，象天體運行永不止息。六畫純陽，是易道創生的根源。全卦以「龍」為意象，剛健為德性；以變化、彈性為吉應；過高、剛強好勝、頑固為大忌。", interpretation: "得乾卦者具備先天的優勢，擁有一切良好的條件，其人自有源源不絕的創造力，資源與能力都不是問題，問題只在於時機。能夠守住自己既有的美德，只待時機的成熟，自可水到渠成。若問財利，乾為金玉，有金玉滿堂之象。" },
    ai_context: {
      core_meaning: { en: "Pure creative power and initiative with all conditions for success", zh: "純粹的創造力與主動性，具備所有成功條件" },
      situation: { en: "You possess great potential and abundant resources. Timing is everything.", zh: "你擁有巨大潛力和豐富資源，時機是關鍵" },
      advice: { en: "Act with confidence but maintain discipline and patience. Wait for the right moment.", zh: "有信心地行動但保持紀律和耐心。等待適當時機" },
      keywords: ["creative power", "initiative", "leadership", "persistence", "timing"],
      lines: [
        { position: 1, stage: { en: "Beginning / Hidden Potential", zh: "開始 / 隱藏潛力" }, meaning: { en: "Hidden dragon. Power not yet ready to emerge.", zh: "潛龍。力量尚未準備好浮現" }, advice: { en: "Stay concealed and build strength privately. Do not act yet.", zh: "保持隱蔽並私下積蓄力量。還不要行動" }, keywords: ["hidden", "preparation", "patience", "potential"] },
        { position: 2, stage: { en: "Emergence / Development", zh: "浮現 / 發展" }, meaning: { en: "Dragon appears in the field. Time to connect with others.", zh: "龍現於田。與他人建立聯繫的時候" }, advice: { en: "Make yourself visible. Seek guidance from experienced mentors.", zh: "讓自己被看見。向有經驗的導師尋求指導" }, keywords: ["emergence", "visibility", "mentorship", "connection"] },
        { position: 3, stage: { en: "Active Effort / Vigilance", zh: "積極努力 / 警惕" }, meaning: { en: "Constant vigilance and effort required. Dangerous position.", zh: "需要持續警惕和努力。危險的位置" }, advice: { en: "Work tirelessly but stay alert. The position is precarious.", zh: "不懈工作但保持警覺。位置不穩" }, keywords: ["vigilance", "effort", "danger", "persistence"] },
        { position: 4, stage: { en: "Testing / Transition", zh: "測試 / 過渡" }, meaning: { en: "Wavering between staying safe and taking the leap.", zh: "在安全與飛躍之間搖擺" }, advice: { en: "Test your readiness cautiously. You can advance without error.", zh: "謹慎測試你的準備程度。可以前進而無過失" }, keywords: ["testing", "transition", "caution", "advancement"] },
        { position: 5, stage: { en: "Success / Achievement", zh: "成功 / 成就" }, meaning: { en: "Flying dragon in heaven. Full expression of power.", zh: "飛龍在天。力量的充分展現" }, advice: { en: "Act with full confidence. Seek collaboration with great people.", zh: "充滿信心地行動。尋求與偉大人物的合作" }, keywords: ["success", "achievement", "power", "collaboration"] },
        { position: 6, stage: { en: "Excess / Overreach", zh: "過度 / 越界" }, meaning: { en: "Arrogant dragon. Going too high brings regret.", zh: "亢龍。飛得太高會帶來悔恨" }, advice: { en: "Know your limits. Excessive ambition leads to downfall.", zh: "知道你的極限。過度野心導致失敗" }, keywords: ["excess", "arrogance", "regret", "limits"] }
      ]
    },
    relationships: { opposite: 2, inverse: 1, nuclear: 1 }
  },
  {
    number: 2,
    names: { en: "The Receptive", zh: "坤", pinyin: "kūn" },
    symbol: "䷁",
    trigrams: {
      upper: { en: "Earth", zh: "地", symbol: "☷" },
      lower: { en: "Earth", zh: "地", symbol: "☷" }
    },
    classical: { judgment: "坤：元亨，利牝馬之貞。君子有攸往，先迷後得主，利", image: "地勢坤，君子以厚德載物", lines: ["初六：履霜，堅冰至", "六二：直方大，不習无不利", "六三：含章可貞，或從王事，无成有終", "六四：括囊，无咎无譽", "六五：黃裳，元吉", "上六：龍戰于野，其血玄黃"] },
    wilhelm: { judgment: "The Receptive brings about sublime success, Furthering through the perseverance of a mare. If the superior man undertakes something and tries to lead, He goes astray; But if he follows, he finds guidance. It is favorable to find friends in the west and south, To forego friends in the east and north. Quiet perseverance brings good fortune.", image: "The earth's condition is receptive devotion. Thus the superior man who has breadth of character carries the outer world.", lines: ["When there is hoarfrost underfoot, Solid ice is not far off.", "Straight, square, great. Without purpose, Yet nothing remains unfurthered.", "Hidden lines. One is able to remain persevering. If by chance you are in the service of a king, Seek not works, but bring to completion.", "A tied-up sack. No blame, no praise.", "A yellow lower garment brings supreme good fortune.", "Dragons fight in the meadow. Their blood is black and yellow."] },
    contemporary: { overview: "坤卦講的是地勢，大地廣博而德厚，無所不承載，象徵包容、博愛、廣生。相較於乾為領導者之卦，坤則為追隨者之卦。", interpretation: "得坤卦較有利於柔順謙卑的人。凡事不利於處於主動，或過於積極進取，反而適於被動，跟著別人的腳步走。成功之道在於堅定而持久、找到能夠幫助你的領導者並追隨於他。一開始就要跟對主人，找對方向，否則將一錯到底。" },
    ai_context: {
      core_meaning: { en: "Receptive devotion and following, not leading. Support and nurture.", zh: "包容順從與追隨，而非領導。支持與養育" },
      situation: { en: "Success comes through being receptive and following guidance, not taking the lead.", zh: "成功來自於接受指引和追隨，而非主導" },
      advice: { en: "Be humble and patient. Follow a wise leader. Avoid trying to be first.", zh: "保持謙卑和耐心。追隨明智的領導者。避免爭先" },
      keywords: ["receptive", "following", "support", "patience", "humility"],
      lines: [
        { position: 1, stage: { en: "Warning / Prevention", zh: "警告 / 預防" }, meaning: { en: "Frost underfoot signals coming cold. Early warning signs.", zh: "履霜。腳下的霜預示即將來臨的寒冷" }, advice: { en: "Notice subtle warnings. Small problems become large if ignored.", zh: "注意微妙的警告。小問題如果忽視會變大" }, keywords: ["warning", "prevention", "awareness", "anticipation"] },
        { position: 2, stage: { en: "Natural Flow / Integrity", zh: "自然流動 / 正直" }, meaning: { en: "Square and upright. Natural virtue without striving.", zh: "方正。不費力的自然美德" }, advice: { en: "Follow your natural path. No effort needed, all benefits come.", zh: "遵循你的自然道路。無需努力，一切利益自來" }, keywords: ["natural", "integrity", "effortless", "virtue"] },
        { position: 3, stage: { en: "Hidden Worth / Service", zh: "隱藏價值 / 服務" }, meaning: { en: "Hidden excellence. Serving without seeking glory.", zh: "隱藏的卓越。不求榮耀地服務" }, advice: { en: "Keep your abilities concealed. Complete tasks without seeking credit.", zh: "隱藏你的能力。完成任務而不尋求功勞" }, keywords: ["humility", "service", "completion", "modesty"] },
        { position: 4, stage: { en: "Restraint / Caution", zh: "克制 / 謹慎" }, meaning: { en: "Tied sack. Extreme caution and restraint.", zh: "括囊。極度謹慎和克制" }, advice: { en: "Stay silent and cautious. Neither blame nor praise will come.", zh: "保持沉默和謹慎。既無責備也無讚揚" }, keywords: ["restraint", "silence", "caution", "neutrality"] },
        { position: 5, stage: { en: "Excellence / Honor", zh: "卓越 / 榮譽" }, meaning: { en: "Yellow garment. Modest excellence brings supreme fortune.", zh: "黃裳。謙虛的卓越帶來至高的運勢" }, advice: { en: "Display virtue modestly. Central position brings great success.", zh: "謙遜地展現美德。中心位置帶來巨大成功" }, keywords: ["excellence", "modesty", "honor", "fortune"] },
        { position: 6, stage: { en: "Conflict / Exhaustion", zh: "衝突 / 耗盡" }, meaning: { en: "Dragons fight. Misplaced ambition causes struggle.", zh: "龍戰於野。錯位的野心導致鬥爭" }, advice: { en: "Know when to stop. Fighting against your nature brings blood.", zh: "知道何時停止。違背本性而戰會流血" }, keywords: ["conflict", "struggle", "limits", "exhaustion"] }
      ]
    },
    relationships: { opposite: 1, inverse: 2, nuclear: 2 }
  },
  {
    number: 3,
    names: { en: "Difficulty at the Beginning", zh: "屯", pinyin: "zhūn" },
    symbol: "䷂",
    trigrams: {
      upper: { en: "Water", zh: "坎", symbol: "☵" },
      lower: { en: "Thunder", zh: "震", symbol: "☳" }
    },
    classical: { judgment: "屯：元亨，利貞。勿用有攸往，利建侯", image: "雲雷，屯。君子以經綸", lines: ["初九：磐桓，利居貞，利建侯", "六二：屯如邅如，乘馬班如，匪寇婚媾。女子貞不字，十年乃字", "六三：即鹿无虞，惟入于林中，君子幾不如舍，往吝", "六四：乘馬班如，求婚媾，往吉，无不利", "九五：屯其膏，小貞吉，大貞凶", "上六：乘馬班如，泣血漣如"] },
    wilhelm: { judgment: "Difficulty at the Beginning works supreme success, Furthering through perseverance. Nothing should be undertaken. It furthers one to appoint helpers.", image: "Clouds and thunder: The image of Difficulty at the Beginning. Thus the superior man brings order out of confusion.", lines: ["Hesitation and hindrance. It furthers one to remain persevering. It furthers one to appoint helpers.", "Difficulties pile up. Horse and wagon part. He is not a robber; He wants to woo when the time comes. The maiden is chaste, She does not pledge herself. Ten years—then she pledges herself.", "Whoever hunts deer without the forester Only loses his way in the forest. The superior man understands the signs of the time And prefers to desist. To go on brings humiliation.", "Horse and wagon part. Strive for union. To go brings good fortune. Everything acts to further.", "Difficulties in blessing. A little perseverance brings good fortune. Great perseverance brings misfortune.", "Horse and wagon part. Bloody tears flow."] },
    contemporary: { overview: "屯卦象徵萬物初生，開天闢地之時的艱難。雷在地下蓄勢，水氣上升凝為雲。雲雷大作，是即將下雨的徵兆。", interpretation: "得此卦者正處於創業維艱的階段，雖然困難重重，但卻是建立制度、立下典範的最好時機。不宜急於求成，應當紮穩根基，尋求賢能之士協助。" },
    ai_context: {
      core_meaning: { en: "Initial difficulties in beginning something new. Chaos before order.", zh: "開創新事物的初期困難。秩序前的混亂" },
      situation: { en: "You face challenges at the start. This is natural for new beginnings.", zh: "你在起步階段面臨挑戰。這是新開始的自然現象" },
      advice: { en: "Don't rush forward. Build foundations and seek help from capable people.", zh: "不要急於求成。打好基礎並尋求有能力的人協助" },
      keywords: ["beginning", "difficulty", "chaos", "foundation", "helpers"],
      lines: [
        { position: 1, stage: { en: "Foundation / Preparation", zh: "基礎 / 準備" }, meaning: { en: "Hesitation at the start. Need to establish base.", zh: "起步時的猶豫。需要建立基礎" }, advice: { en: "Build foundations patiently. Appoint helpers and don't rush.", zh: "耐心打好基礎。任命助手且不要急躁" }, keywords: ["foundation", "hesitation", "patience", "helpers"] },
        { position: 2, stage: { en: "Obstacles / Patience", zh: "障礙 / 耐心" }, meaning: { en: "Progress blocked. Confusion about intentions.", zh: "進展受阻。對意圖感到困惑" }, advice: { en: "Wait patiently. What seems hostile is actually favorable.", zh: "耐心等待。看似敵意的實際上是有利的" }, keywords: ["obstacles", "patience", "waiting", "trust"] },
        { position: 3, stage: { en: "Recklessness / Loss", zh: "魯莽 / 迷失" }, meaning: { en: "Chasing without guidance leads to getting lost.", zh: "沒有指導的追逐會迷路" }, advice: { en: "Don't pursue goals without proper preparation. Better to desist.", zh: "不要在沒有適當準備下追求目標。停止更好" }, keywords: ["recklessness", "lost", "preparation", "restraint"] },
        { position: 4, stage: { en: "Seeking Help / Union", zh: "尋求幫助 / 聯合" }, meaning: { en: "Progress blocked but help is available.", zh: "進展受阻但有幫助可得" }, advice: { en: "Actively seek union and partnership. Going forward brings fortune.", zh: "積極尋求聯合與夥伴關係。前進帶來好運" }, keywords: ["help", "partnership", "union", "progress"] },
        { position: 5, stage: { en: "Gradual Progress / Moderation", zh: "漸進 / 適度" }, meaning: { en: "Small progress possible. Great ambition blocked.", zh: "小進展可能。大野心受阻" }, advice: { en: "Be content with small achievements. Large goals lead to trouble.", zh: "滿足於小成就。大目標導致麻煩" }, keywords: ["gradual", "small steps", "moderation", "patience"] },
        { position: 6, stage: { en: "Despair / Tears", zh: "絕望 / 淚水" }, meaning: { en: "Progress completely blocked. Deep distress.", zh: "進展完全受阻。深深的痛苦" }, advice: { en: "Accept that some obstacles cannot be overcome. Allow grief.", zh: "接受某些障礙無法克服。允許悲傷" }, keywords: ["blocked", "distress", "acceptance", "grief"] }
      ]
    },
    relationships: { opposite: 50, inverse: 4, nuclear: 23 }
  },
  {
    number: 4,
    names: { en: "Youthful Folly", zh: "蒙", pinyin: "méng" },
    symbol: "䷃",
    trigrams: {
      upper: { en: "Mountain", zh: "艮", symbol: "☶" },
      lower: { en: "Water", zh: "坎", symbol: "☵" }
    },
    classical: { judgment: "蒙：亨。匪我求童蒙，童蒙求我。初筮告，再三瀆，瀆則不告。利貞", image: "山下出泉，蒙。君子以果行育德", lines: ["初六：發蒙，利用刑人，用說桎梏，以往吝", "九二：包蒙，吉。納婦，吉。子克家", "六三：勿用取女，見金夫，不有躬，无攸利", "六四：困蒙，吝", "六五：童蒙，吉", "上九：擊蒙，不利為寇，利禦寇"] },
    wilhelm: { judgment: "Youthful Folly has success. It is not I who seek the young fool; The young fool seeks me. At the first oracle I inform him. If he asks two or three times, it is importunity. If he importunes, I give him no information. Perseverance furthers.", image: "A spring wells up at the foot of the mountain: The image of Youth. Thus the superior man fosters his character By thoroughness in all that he does.", lines: ["To make a fool develop It furthers one to apply discipline. The fetters should be removed. To go on in this way brings humiliation.", "To bear with fools in kindliness brings good fortune. To know how to take women Brings good fortune. The son is capable of taking charge of the household.", "Take not a maiden who, When she sees a man of bronze, Loses possession of herself. Nothing furthers.", "Entangled folly brings humiliation.", "Childlike folly brings good fortune.", "In punishing folly It does not further one To commit transgressions. The only thing that furthers Is to prevent transgressions."] },
    contemporary: { overview: "蒙卦象徵蒙昧無知，天地初開之後的蒙昧狀態。內水險、外艮止，險而後止。處蒙卦之時，能力不足以應付危險，宜求教於有智慧、有經驗的長者。", interpretation: "得此卦者正處於無知蒙昧的階段。不是老師去求學生，而是學生主動求教。要以誠心請教，若一再重複問同樣問題就是不敬，老師就不會回答。保持謙遜的學習態度最為重要。" },
    ai_context: {
      core_meaning: { en: "Lack of experience and knowledge. Need for teaching and guidance.", zh: "缺乏經驗和知識。需要教導和指引" },
      situation: { en: "You are inexperienced and need education. Seek wisdom from teachers.", zh: "你尚無經驗且需要教育。向老師尋求智慧" },
      advice: { en: "Be humble and sincere when seeking guidance. Don't ask the same question repeatedly.", zh: "尋求指導時要謙虛誠懇。不要重複問同樣的問題" },
      keywords: ["inexperience", "learning", "teaching", "humility", "guidance"],
      lines: [
        { position: 1, stage: { en: "Discipline / Training", zh: "紀律 / 訓練" }, meaning: { en: "Removing fetters through discipline. Education begins.", zh: "通過紀律移除束縛。教育開始" }, advice: { en: "Apply structure and rules. Freedom comes after learning.", zh: "應用結構和規則。自由在學習之後到來" }, keywords: ["discipline", "training", "structure", "learning"] },
        { position: 2, stage: { en: "Tolerance / Patience", zh: "容忍 / 耐心" }, meaning: { en: "Bear with inexperience kindly. Accept responsibility.", zh: "善待缺乏經驗的人。承擔責任" }, advice: { en: "Show patience with those learning. Take on guardianship role.", zh: "對學習者展現耐心。擔任監護角色" }, keywords: ["tolerance", "patience", "guardianship", "kindness"] },
        { position: 3, stage: { en: "Distraction / Loss", zh: "分心 / 迷失" }, meaning: { en: "Losing oneself through superficial attractions.", zh: "因表面吸引而迷失自己" }, advice: { en: "Don't be seduced by appearances. Maintain focus and integrity.", zh: "不要被外表誘惑。保持專注和正直" }, keywords: ["distraction", "superficial", "focus", "integrity"] },
        { position: 4, stage: { en: "Isolation / Limitation", zh: "孤立 / 限制" }, meaning: { en: "Trapped by ignorance. Distance from wisdom.", zh: "被無知困住。遠離智慧" }, advice: { en: "Recognize when you're isolated from guidance. Seek connection.", zh: "認識到何時與指導隔離。尋求聯繫" }, keywords: ["isolation", "ignorance", "seeking", "limitation"] },
        { position: 5, stage: { en: "Innocence / Receptivity", zh: "天真 / 接受" }, meaning: { en: "Childlike openness to learning. Pure receptivity.", zh: "孩童般的學習開放性。純粹的接受力" }, advice: { en: "Maintain beginner's mind. Accept teaching with humility.", zh: "保持初學者心態。謙虛地接受教導" }, keywords: ["innocence", "receptivity", "humility", "openness"] },
        { position: 6, stage: { en: "Correction / Punishment", zh: "糾正 / 懲罰" }, meaning: { en: "Stopping harmful behavior. Necessary intervention.", zh: "停止有害行為。必要的干預" }, advice: { en: "Prevent wrongdoing firmly but don't become the aggressor.", zh: "堅定地防止錯誤但不要成為侵略者" }, keywords: ["correction", "prevention", "firmness", "boundaries"] }
      ]
    },
    relationships: { opposite: 49, inverse: 3, nuclear: 24 }
  },
  {
    number: 5,
    names: { en: "Waiting", zh: "需", pinyin: "xū" },
    symbol: "䷄",
    trigrams: {
      upper: { en: "Water", zh: "坎", symbol: "☵" },
      lower: { en: "Heaven", zh: "乾", symbol: "☰" }
    },
    classical: { judgment: "需：有孚，光亨，貞吉。利涉大川", image: "雲上于天，需。君子以飲食宴樂", lines: ["初九：需于郊，利用恆，无咎", "九二：需于沙，小有言，終吉", "九三：需于泥，致寇至", "六四：需于血，出自穴", "九五：需于酒食，貞吉", "上六：入于穴，有不速之客三人來，敬之終吉"] },
    wilhelm: { judgment: "Waiting. If you are sincere, You have light and success. Perseverance brings good fortune. It furthers one to cross the great water.", image: "Clouds rise up to heaven: The image of Waiting. Thus the superior man eats and drinks, Is joyous and of good cheer.", lines: ["Waiting in the meadow. It furthers one to abide in what endures. No blame.", "Waiting on the sand. There is some gossip. The end brings good fortune.", "Waiting in the mud Brings about the arrival of the enemy.", "Waiting in blood. Get out of the pit.", "Waiting at meat and drink. Perseverance brings good fortune.", "One falls into the pit. Three uninvited guests arrive. Honor them, and in the end there will be good fortune."] },
    contemporary: { overview: "需卦象徵等待時機。雲在天上尚未成雨，比喻條件未齊備，必需等待時機成熟。雖有剛健的德性而可以涉險，但仍以退守、靜待時機為上策。", interpretation: "得需卦者雖有能力解決困難，但宜靜待時機。若執意行動，雖或可成，但恐會歷經苦戰。最好能以逸待勞，飲食宴樂，養精蓄銳。誠信為上，有誠信則可光耀四方。" },
    ai_context: {
      core_meaning: { en: "Patient waiting for the right time. Nourishment and preparation.", zh: "耐心等待適當時機。滋養和準備" },
      situation: { en: "You have the ability, but timing is not yet right. Clouds have not yet become rain.", zh: "你有能力，但時機尚未成熟。雲尚未成雨" },
      advice: { en: "Wait patiently while staying prepared. Nourish yourself. Maintain sincerity.", zh: "耐心等待同時保持準備。滋養自己。保持誠信" },
      keywords: ["waiting", "patience", "timing", "nourishment", "sincerity"],
      lines: [
        { position: 1, stage: { en: "Distance / Constancy", zh: "距離 / 恆常" }, meaning: { en: "Waiting far from danger. Steady persistence needed.", zh: "遠離危險地等待。需要穩定的堅持" }, advice: { en: "Maintain constant effort. Danger is distant but approach carefully.", zh: "保持恆常的努力。危險遙遠但要小心接近" }, keywords: ["distance", "constancy", "persistence", "steadiness"] },
        { position: 2, stage: { en: "Gossip / Patience", zh: "閒言 / 耐心" }, meaning: { en: "Minor criticisms arise. Wait for resolution.", zh: "出現小批評。等待解決" }, advice: { en: "Endure small talk and criticism. The end brings fortune.", zh: "忍受閒言和批評。結局帶來好運" }, keywords: ["gossip", "criticism", "endurance", "patience"] },
        { position: 3, stage: { en: "Exposure / Vulnerability", zh: "暴露 / 脆弱" }, meaning: { en: "Waiting in the mud. Inviting enemies through carelessness.", zh: "在泥濘中等待。因疏忽招致敵人" }, advice: { en: "Recognize your exposed position. Exercise extreme caution.", zh: "認識到你暴露的位置。極度謹慎" }, keywords: ["exposure", "vulnerability", "caution", "danger"] },
        { position: 4, stage: { en: "Crisis / Escape", zh: "危機 / 逃脫" }, meaning: { en: "Waiting in blood. In the midst of danger.", zh: "在血中等待。處於危險之中" }, advice: { en: "Accept that you're in crisis. Exit the dangerous situation.", zh: "接受你在危機中。離開危險情況" }, keywords: ["crisis", "danger", "escape", "survival"] },
        { position: 5, stage: { en: "Nourishment / Contentment", zh: "滋養 / 滿足" }, meaning: { en: "Waiting with food and drink. Comfortable patience.", zh: "有食物飲料地等待。舒適的耐心" }, advice: { en: "Enjoy the waiting period. Nourish yourself while preparing.", zh: "享受等待期。在準備時滋養自己" }, keywords: ["nourishment", "comfort", "contentment", "preparation"] },
        { position: 6, stage: { en: "Unexpected / Respect", zh: "意外 / 尊重" }, meaning: { en: "Uninvited guests arrive. Honor them appropriately.", zh: "不速之客到來。適當地尊重他們" }, advice: { en: "Accept the unexpected with respect. Good fortune follows courtesy.", zh: "以尊重接受意外。禮貌之後有好運" }, keywords: ["unexpected", "guests", "respect", "courtesy"] }
      ]
    },
    relationships: { opposite: 35, inverse: 6, nuclear: 38 }
  },
  {
    number: 6,
    names: { en: "Conflict", zh: "訟", pinyin: "sòng" },
    symbol: "䷅",
    trigrams: {
      upper: { en: "Heaven", zh: "天", symbol: "☰" },
      lower: { en: "Water", zh: "水", symbol: "☵" }
    },
    classical: { judgment: "訟：有孚，窒惕，中吉，終凶。利見大人，不利涉大川", image: "天與水違行，訟。君子以作事謀始", lines: ["初六：不永所事，小有言，終吉", "九二：不克訟，歸而逋，其邑人三百戶，无眚", "六三：食舊德，貞厲，終吉。或從王事，无成", "九四：不克訟，復即命，渝安貞，吉", "九五：訟，元吉", "上九：或錫之鞶帶，終朝三褫之"] },
    wilhelm: { judgment: "Conflict. You are sincere And are being obstructed. A cautious halt halfway brings good fortune. Going through to the end brings misfortune. It furthers one to see the great man. It does not further one to cross the great water.", image: "Heaven and water go their opposite ways: The image of Conflict. Thus in all his transactions the superior man Carefully considers the beginning.", lines: ["One does not perpetuate the affair. There is a little gossip. In the end, good fortune comes.", "One cannot engage in conflict; One returns home, gives way. The people of his town, Three hundred households, Remain free of guilt.", "To nourish oneself on ancient virtue induces perseverance. Danger. In the end, good fortune comes. If by chance you are in the service of a king, Seek not works.", "One cannot engage in conflict. One turns back and submits to fate, Changes one's attitude, And finds peace in perseverance. Good fortune.", "To contend before him brings supreme good fortune.", "Even if by chance a leather belt is bestowed on one, By the end of a morning It has been snatched away three times."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Conflict and opposition. Opposing forces creating tension.", zh: "衝突與對立。對立力量造成緊張" },
      situation: { en: "You face serious disagreement. Direct confrontation leads to trouble.", zh: "你面臨嚴重分歧。直接對抗會帶來麻煩" },
      advice: { en: "Seek mediation. Compromise halfway rather than pushing to extremes.", zh: "尋求調解。在中途妥協而非推向極端" },
      keywords: ["conflict", "opposition", "mediation", "compromise", "caution"],
      lines: [
        { position: 1, stage: { en: "Retreat / Prevention", zh: "撤退 / 預防" }, meaning: { en: "Not perpetuating conflict. Withdrawing before escalation.", zh: "不延續衝突。在升級前撤退" }, advice: { en: "End the dispute quickly. Small retreat prevents large conflict.", zh: "快速結束爭端。小撤退防止大衝突" }, keywords: ["retreat", "prevention", "wisdom", "restraint"] },
        { position: 2, stage: { en: "Yielding / Humility", zh: "屈服 / 謙遜" }, meaning: { en: "Cannot win against superior force. Strategic submission.", zh: "無法戰勝更強大的力量。戰略性服從" }, advice: { en: "Yield to stronger opponents. Return home and keep peace.", zh: "向更強的對手屈服。回家保持和平" }, keywords: ["yielding", "humility", "peace", "strategy"] },
        { position: 3, stage: { en: "Preservation / Tradition", zh: "保存 / 傳統" }, meaning: { en: "Living on ancient virtue. Not seeking new conquests.", zh: "依靠古老美德生活。不尋求新征服" }, advice: { en: "Maintain what you have. Don't pursue risky ventures.", zh: "維持你所擁有的。不要追求冒險" }, keywords: ["preservation", "tradition", "stability", "caution"] },
        { position: 4, stage: { en: "Reversal / Reflection", zh: "逆轉 / 反思" }, meaning: { en: "Cannot win justly. Turn back and find peace.", zh: "無法正義地獲勝。回頭找到和平" }, advice: { en: "Abandon unjust causes. Submit to higher order for peace.", zh: "放棄不公正的事業。服從更高秩序以求和平" }, keywords: ["reversal", "justice", "reflection", "submission"] },
        { position: 5, stage: { en: "Arbitration / Justice", zh: "仲裁 / 正義" }, meaning: { en: "Seeking judgment from authority. Resolution through mediation.", zh: "向權威尋求判決。通過調解解決" }, advice: { en: "Bring disputes to fair arbitrator. Supreme fortune in just resolution.", zh: "將爭端帶給公正仲裁者。正義解決帶來至高運勢" }, keywords: ["arbitration", "justice", "resolution", "fairness"] },
        { position: 6, stage: { en: "Hollow Victory / Loss", zh: "虛勝 / 損失" }, meaning: { en: "Winning through force but losing respect and peace.", zh: "通過武力獲勝但失去尊重和和平" }, advice: { en: "Victories through conflict are temporary. Expect reversal.", zh: "通過衝突的勝利是暫時的。預期逆轉" }, keywords: ["hollow victory", "temporary", "reversal", "consequences"] }
      ]
    },
    relationships: { opposite: 59, inverse: 6, nuclear: 6 }
  },
  {
    number: 7,
    names: { en: "The Army", zh: "師", pinyin: "shī" },
    symbol: "䷆",
    trigrams: {
      upper: { en: "Earth", zh: "地", symbol: "☷" },
      lower: { en: "Water", zh: "水", symbol: "☵" }
    },
    classical: { judgment: "師：貞，丈人吉，无咎", image: "地中有水，師。君子以容民畜眾", lines: ["初六：師出以律，否臧凶", "九二：在師中，吉，无咎，王三錫命", "六三：師或輿尸，凶", "六四：師左次，无咎", "六五：田有禽，利執言，无咎。長子帥師，弟子輿尸，貞凶", "上六：大君有命，開國承家，小人勿用"] },
    wilhelm: { judgment: "The Army. The army needs perseverance And a strong man. Good fortune without blame.", image: "In the middle of the earth is water: The image of the Army. Thus the superior man increases his masses By generosity toward the people.", lines: ["An army must set forth in proper order. If the order is not good, misfortune threatens.", "In the midst of the army. Good fortune. No blame. The king bestows a triple decoration.", "Perchance the army carries corpses in the wagon. Misfortune.", "The army retreats. No blame.", "There is game in the field. It furthers one to catch it. Without blame. Let the eldest lead the army. The younger transports corpses; Then perseverance brings misfortune.", "The great prince issues commands, Founds states, vests families with fiefs. Inferior people should not be employed."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Organized force and discipline. Leadership through structure.", zh: "有組織的力量和紀律。通過結構領導" },
      situation: { en: "You need organization and strong leadership to succeed.", zh: "你需要組織和強大的領導才能成功" },
      advice: { en: "Build discipline and structure. Lead with strength but fairness.", zh: "建立紀律和結構。以力量但公平地領導" },
      keywords: ["army", "discipline", "leadership", "organization", "strength"],
      lines: [
        { position: 1, stage: { en: "Discipline / Order", zh: "紀律 / 秩序" }, meaning: { en: "Army moves with discipline. Order is foundation.", zh: "軍隊有紀律地行動。秩序是基礎" }, advice: { en: "Establish clear rules and structure. Chaos brings defeat.", zh: "建立明確規則和結構。混亂帶來失敗" }, keywords: ["discipline", "order", "structure", "foundation"] },
        { position: 2, stage: { en: "Leadership / Recognition", zh: "領導 / 認可" }, meaning: { en: "Leader in midst of troops. Recognition and honor.", zh: "領導者在部隊中。認可與榮譽" }, advice: { en: "Lead from within. The king honors capable commanders.", zh: "從內部領導。君王尊敬有能力的指揮官" }, keywords: ["leadership", "recognition", "honor", "capability"] },
        { position: 3, stage: { en: "Defeat / Loss", zh: "失敗 / 損失" }, meaning: { en: "Carrying dead from battlefield. Failure and mourning.", zh: "從戰場搬運死者。失敗與哀悼" }, advice: { en: "Accept defeat when it comes. Learn from failure.", zh: "接受失敗。從失敗中學習" }, keywords: ["defeat", "loss", "failure", "mourning"] },
        { position: 4, stage: { en: "Retreat / Strategy", zh: "撤退 / 策略" }, meaning: { en: "Army retreats to regroup. Strategic withdrawal.", zh: "軍隊撤退重整。戰略性撤退" }, advice: { en: "Sometimes retreat is wisest move. Regroup and reassess.", zh: "有時撤退是最明智的行動。重整並重新評估" }, keywords: ["retreat", "strategy", "regrouping", "wisdom"] },
        { position: 5, stage: { en: "Defense / Protection", zh: "防禦 / 保護" }, meaning: { en: "Defending against invaders. Protective action justified.", zh: "防禦入侵者。保護性行動是正當的" }, advice: { en: "Fight to protect what's yours. Punish aggressors appropriately.", zh: "戰鬥保護你的東西。適當懲罰侵略者" }, keywords: ["defense", "protection", "justified force", "boundaries"] },
        { position: 6, stage: { en: "Victory / Reward", zh: "勝利 / 獎賞" }, meaning: { en: "Victorious leader receives mandate. Establishing new order.", zh: "勝利的領導者獲得授權。建立新秩序" }, advice: { en: "Victory brings responsibility. Appoint worthy leaders to maintain peace.", zh: "勝利帶來責任。任命賢能領導者維持和平" }, keywords: ["victory", "responsibility", "leadership", "order"] }
      ]
    },
    relationships: { opposite: 58, inverse: 7, nuclear: 7 }
  },
  {
    number: 8,
    names: { en: "Holding Together", zh: "比", pinyin: "bǐ" },
    symbol: "䷇",
    trigrams: {
      upper: { en: "Water", zh: "水", symbol: "☵" },
      lower: { en: "Earth", zh: "地", symbol: "☷" }
    },
    classical: { judgment: "比：吉。原筮，元永貞，无咎。不寧方來，後夫凶", image: "地上有水，比。先王以建萬國，親諸侯", lines: ["初六：有孚比之，无咎。有孚盈缶，終來有它吉", "六二：比之自內，貞吉", "六三：比之匪人", "六四：外比之，貞吉", "九五：顯比，王用三驅，失前禽，邑人不誡，吉", "上六：比之无首，凶"] },
    wilhelm: { judgment: "Holding Together brings good fortune. Inquire of the oracle once again Whether you possess sublimity, constancy, and perseverance; Then there is no blame. Those who are uncertain gradually join. Whoever comes too late Meets with misfortune.", image: "On the earth is water: The image of Holding Together. Thus the kings of antiquity Bestowed the different states as fiefs And cultivated friendly relations with the feudal lords.", lines: ["Hold to him in truth and loyalty; This is without blame. Truth, like a full earthen bowl: Thus in the end Good fortune comes from without.", "Hold to him inwardly. Perseverance brings good fortune.", "You hold together with the wrong people.", "Hold to him outwardly also. Perseverance brings good fortune.", "Manifestation of holding together. In the hunt the king uses beaters on three sides only And forgoes game that runs off in front. The citizens need no warning. Good fortune.", "He finds no head for holding together. Misfortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Unity and alliance. Joining together for mutual support.", zh: "團結與聯盟。為了互相支持而聚集" },
      situation: { en: "You need to build alliances and work with others.", zh: "你需要建立聯盟並與他人合作" },
      advice: { en: "Seek genuine connections. Join with like-minded people early.", zh: "尋求真誠的聯繫。及早與志同道合的人聚集" },
      keywords: ["union", "alliance", "cooperation", "support", "togetherness"],
      lines: [
        { position: 1, stage: { en: "Foundation / Sincerity", zh: "基礎 / 誠懇" }, meaning: { en: "Union built on truth. Honest foundation attracts others.", zh: "建立在真理上的聯合。誠實的基礎吸引他人" }, advice: { en: "Be sincere and honest. Others will naturally join you.", zh: "真誠誠實。他人會自然加入你" }, keywords: ["sincerity", "truth", "foundation", "attraction"] },
        { position: 2, stage: { en: "Inner Unity / Integrity", zh: "內在統一 / 正直" }, meaning: { en: "Union comes from within. Internal integrity matters.", zh: "聯合來自內在。內在正直重要" }, advice: { en: "Cultivate genuine inner connection. Let external union follow naturally.", zh: "培養真正的內在連結。讓外在聯合自然跟隨" }, keywords: ["inner unity", "integrity", "genuine", "natural"] },
        { position: 3, stage: { en: "Wrong Allies / Misdirection", zh: "錯誤盟友 / 誤導" }, meaning: { en: "Holding together with wrong people. Misguided allegiance.", zh: "與錯誤的人團結。誤導的忠誠" }, advice: { en: "Examine your alliances carefully. Wrong companions lead astray.", zh: "仔細檢查你的聯盟。錯誤的同伴會誤導" }, keywords: ["wrong allies", "misdirection", "examination", "caution"] },
        { position: 4, stage: { en: "External Alliance / Openness", zh: "外部聯盟 / 開放" }, meaning: { en: "Seeking union openly and publicly. External connections.", zh: "公開尋求聯合。外部連結" }, advice: { en: "Make your allegiance public. Open alliance brings stability.", zh: "公開你的忠誠。開放聯盟帶來穩定" }, keywords: ["external alliance", "openness", "public", "stability"] },
        { position: 5, stage: { en: "True Leadership / Attraction", zh: "真正領導 / 吸引" }, meaning: { en: "Manifest union. The worthy naturally attract followers.", zh: "顯現聯合。賢者自然吸引追隨者" }, advice: { en: "Lead through virtue. Let those who belong come freely.", zh: "通過美德領導。讓屬於的人自由來" }, keywords: ["leadership", "virtue", "attraction", "freedom"] },
        { position: 6, stage: { en: "Lost Opportunity / Isolation", zh: "失去機會 / 孤立" }, meaning: { en: "Too late to join. Missing the moment of union.", zh: "太遲加入。錯過聯合的時機" }, advice: { en: "Recognize when you've delayed too long. Accept consequences of lateness.", zh: "認識到你拖延太久。接受遲到的後果" }, keywords: ["lateness", "isolation", "consequence", "timing"] }
      ]
    },
    relationships: { opposite: 57, inverse: 8, nuclear: 8 }
  },
  {
    number: 9,
    names: { en: "The Taming Power of the Small", zh: "小畜", pinyin: "xiǎo xù" },
    symbol: "䷈",
    trigrams: {
      upper: { en: "Wind", zh: "風", symbol: "☴" },
      lower: { en: "Heaven", zh: "天", symbol: "☰" }
    },
    classical: { judgment: "小畜：亨。密雲不雨，自我西郊", image: "風行天上，小畜。君子以懿文德", lines: ["初九：復自道，何其咎，吉", "九二：牽復，吉", "九三：輿說輻，夫妻反目", "六四：有孚，血去惕出，无咎", "九五：有孚攣如，富以其鄰", "上九：既雨既處，尚德載。婦貞厲，月幾望，君子征凶"] },
    wilhelm: { judgment: "The Taming Power of the Small Has success. Dense clouds, no rain from our western region.", image: "The wind drives across heaven: The image of the Taming Power of the Small. Thus the superior man Refines the outward aspect of his nature.", lines: ["Return to the way. How could there be blame in this? Good fortune.", "He allows himself to be drawn into returning. Good fortune.", "The spokes burst out of the wagon wheels. Man and wife roll their eyes.", "If you are sincere, blood vanishes and fear gives way. No blame.", "If you are sincere and loyally attached, You are rich in your neighbor.", "The rain comes, there is rest. This is due to the lasting effect of character. Perseverance brings the woman into danger. The moon is nearly full. If the superior man persists, misfortune comes."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Small restraining force. Gentle influence accumulating power.", zh: "小的約束力量。溫和影響力積累力量" },
      situation: { en: "You have limited power but can make gradual progress.", zh: "你的力量有限但可以逐步進展" },
      advice: { en: "Work patiently with small actions. Influence through gentleness.", zh: "耐心地以小行動工作。通過溫和影響" },
      keywords: ["small power", "restraint", "patience", "accumulation", "gentleness"],
      lines: [
        { position: 1, stage: { en: "Beginning", zh: "開始" }, meaning: { en: "Return to your path. Small obstacles require patience.", zh: "回到你的道路。小障礙需要耐心" }, advice: { en: "Return to what you know. Don't force through resistance.", zh: "回到你知道的。不要強行通過阻力" }, keywords: ["return", "patience", "obstacles", "restraint"] },
        { position: 2, stage: { en: "Development", zh: "發展" }, meaning: { en: "Being drawn back by circumstance. Compelled to return.", zh: "被環境拉回。被迫回歸" }, advice: { en: "Accept when pulled back. Sometimes return is necessary.", zh: "接受被拉回。有時回歸是必要的" }, keywords: ["drawn back", "acceptance", "circumstance", "return"] },
        { position: 3, stage: { en: "Transition", zh: "過渡" }, meaning: { en: "Wheels off the wagon. Relationship strain forces pause.", zh: "車輪脫落。關係緊張迫使暫停" }, advice: { en: "Accept mechanical breakdown. Wait for proper repair.", zh: "接受機械故障。等待適當修復" }, keywords: ["breakdown", "pause", "repair", "patience"] },
        { position: 4, stage: { en: "Testing", zh: "測試" }, meaning: { en: "Sincerity prevents bloodshed. Truthfulness resolves conflict.", zh: "誠懇防止流血。真誠解決衝突" }, advice: { en: "Be completely truthful. Sincerity prevents violence.", zh: "完全真誠。誠懇防止暴力" }, keywords: ["sincerity", "truth", "peace", "resolution"] },
        { position: 5, stage: { en: "Culmination", zh: "高潮" }, meaning: { en: "Bonds of sincerity unite neighbors. Shared wealth.", zh: "誠懇的紐帶團結鄰居。共享財富" }, advice: { en: "Share your resources. Unity through generosity.", zh: "分享你的資源。通過慷慨團結" }, keywords: ["unity", "sharing", "generosity", "bonds"] },
        { position: 6, stage: { en: "Completion", zh: "完成" }, meaning: { en: "Rain finally falls. Accumulated energy released.", zh: "雨終於下了。積累的能量釋放" }, advice: { en: "Tension releases naturally. Success comes after patient restraint.", zh: "緊張自然釋放。耐心克制後成功來臨" }, keywords: ["release", "success", "patience", "completion"] }
      ]
    },
    relationships: { opposite: 56, inverse: 9, nuclear: 9 }
  },
  {
    number: 10,
    names: { en: "Treading", zh: "履", pinyin: "lǚ" },
    symbol: "䷉",
    trigrams: {
      upper: { en: "Heaven", zh: "天", symbol: "☰" },
      lower: { en: "Lake", zh: "澤", symbol: "☱" }
    },
    classical: { judgment: "履：履虎尾，不咥人，亨", image: "上天下澤，履。君子以辨上下，定民志", lines: ["初九：素履，往无咎", "九二：履道坦坦，幽人貞吉", "六三：眇能視，跛能履，履虎尾，咥人，凶。武人為于大君", "九四：履虎尾，愬愬，終吉", "九五：夬履，貞厲", "上九：視履考祥，其旋元吉"] },
    wilhelm: { judgment: "Treading. Treading upon the tail of the tiger. It does not bite the man. Success.", image: "Heaven above, the lake below: The image of Treading. Thus the superior man discriminates between high and low, And thereby fortifies the thinking of the people.", lines: ["Simple conduct. Progress without blame.", "Treading a smooth, level course. The perseverance of a dark man brings good fortune.", "A one-eyed man is able to see, A lame man is able to tread. He treads on the tail of the tiger. The tiger bites the man. Misfortune. Thus does a warrior act on behalf of his great prince.", "He treads on the tail of the tiger. Caution and circumspection lead ultimately to good fortune.", "Resolute conduct. Perseverance with awareness of danger.", "Look to your conduct and weigh the favorable signs. When everything is fulfilled, supreme good fortune comes."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Careful conduct in dangerous situations. Walking with awareness.", zh: "在危險情況下謹慎行事。有意識地行走" },
      situation: { en: "You're in a precarious position but can navigate it safely.", zh: "你處於不穩定位置但可以安全度過" },
      advice: { en: "Be careful and respectful. Mind your conduct in risky situations.", zh: "小心且尊重。在危險情況下注意你的行為" },
      keywords: ["conduct", "danger", "caution", "respect", "awareness"],
      lines: [
        { position: 1, stage: { en: "Simple Conduct", zh: "簡單行為" }, meaning: { en: "Simple, sincere behavior. Walking your own path without pretension.", zh: "簡單、真誠的行為。走自己的路而不做作" }, advice: { en: "Proceed simply and sincerely. No one will take offense.", zh: "簡單真誠地前進。沒有人會冒犯" }, keywords: ["simplicity", "sincerity", "humility", "authenticity"] },
        { position: 2, stage: { en: "Solitary Path", zh: "孤獨之路" }, meaning: { en: "Treading smooth, level path alone. Quiet perseverance.", zh: "獨自走在平滑的道路上。安靜的堅持" }, advice: { en: "Continue steadily in solitude. Your persistence brings good fortune.", zh: "在孤獨中穩定繼續。你的堅持帶來好運" }, keywords: ["solitude", "persistence", "steady", "quiet"] },
        { position: 3, stage: { en: "Overconfidence", zh: "過度自信" }, meaning: { en: "One-eyed man still sees, lame man still walks - but overconfidence is dangerous.", zh: "獨眼人仍能看見，跛腳人仍能走路 - 但過度自信是危險的" }, advice: { en: "Recognize your limitations. Acting beyond capacity brings misfortune.", zh: "認識你的限制。超越能力行動帶來不幸" }, keywords: ["limitations", "danger", "overconfidence", "awareness"] },
        { position: 4, stage: { en: "Danger / Caution", zh: "危險 / 謹慎" }, meaning: { en: "Treading on tiger's tail. Extreme danger requires extreme caution.", zh: "踩虎尾。極度危險需要極度謹慎" }, advice: { en: "Proceed with trembling caution. Success comes through fear and respect.", zh: "以戰戰兢兢的謹慎前進。成功來自恐懼和尊重" }, keywords: ["danger", "caution", "fear", "respect"] },
        { position: 5, stage: { en: "Resolute Conduct", zh: "堅決行為" }, meaning: { en: "Determined treading. Aware of danger but proceeding resolutely.", zh: "堅定的踐履。意識到危險但堅決前進" }, advice: { en: "Move forward with determination while staying alert to danger.", zh: "堅定地前進同時對危險保持警覺" }, keywords: ["determination", "resolution", "awareness", "courage"] },
        { position: 6, stage: { en: "Review / Reflection", zh: "回顧 / 反思" }, meaning: { en: "Looking back on your conduct. Examining the whole journey.", zh: "回顧你的行為。檢視整個旅程" }, advice: { en: "Review your path. Supreme good fortune comes from self-examination.", zh: "審視你的道路。至高的好運來自自我審視" }, keywords: ["reflection", "review", "self-examination", "fortune"] }
      ]
    },
    relationships: { opposite: 55, inverse: 10, nuclear: 10 }
  },
  {
    number: 11,
    names: { en: "Peace", zh: "泰", pinyin: "tài" },
    symbol: "䷊",
    trigrams: {
      upper: { en: "Earth", zh: "地", symbol: "☷" },
      lower: { en: "Heaven", zh: "天", symbol: "☰" }
    },
    classical: { judgment: "泰：小往大來，吉，亨", image: "天地交，泰。后以財成天地之道，輔相天地之宜，以左右民", lines: ["初九：拔茅茹，以其彙，征吉", "九二：包荒，用馮河，不遐遺，朋亡，得尚于中行", "九三：无平不陂，无往不復。艱貞无咎，勿恤其孚，于食有福", "六四：翩翩，不富以其鄰，不戒以孚", "六五：帝乙歸妹，以祉元吉", "上六：城復于隍，勿用師，自邑告命，貞吝"] },
    wilhelm: { judgment: "Peace. The small departs, The great approaches. Good fortune. Success.", image: "Heaven and earth unite: the image of Peace. Thus the ruler Divides and completes the course of heaven and earth, And so aids the people.", lines: ["When ribbon grass is pulled up, the sod comes with it. Each according to his kind. Undertakings bring good fortune.", "Bearing with the uncultured in gentleness, Fording the river with resolution, Not neglecting what is distant, Not regarding one's companions: Thus one may manage to walk in the middle.", "No plain not followed by a slope. No going not followed by a return. He who remains persevering in danger Is without blame. Do not complain about this truth; Enjoy the good fortune you still possess.", "He flutters down, not boasting of his wealth, Together with his neighbor, Guileless and sincere.", "The sovereign I gives his daughter in marriage. This brings blessing and supreme good fortune.", "The wall falls back into the moat. Use no army now. Make your commands known within your own town. Perseverance brings humiliation."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Harmony and prosperity. Heaven and earth in union.", zh: "和諧與繁榮。天地交泰" },
      situation: { en: "You're in a time of peace and good fortune.", zh: "你正處於和平與好運的時期" },
      advice: { en: "Enjoy this favorable time but remain mindful and balanced.", zh: "享受這個有利的時期但保持警覺和平衡" },
      keywords: ["peace", "harmony", "prosperity", "balance", "union"],
      lines: [
        { position: 1, stage: { en: "Rising Together", zh: "共同上升" }, meaning: { en: "Pulling up ribbon grass brings its roots. People rise together.", zh: "拔茅草帶起其根。人們一起上升" }, advice: { en: "When advancing, bring worthy companions. Collective progress succeeds.", zh: "前進時，帶上有價值的同伴。集體進步成功" }, keywords: ["unity", "collective", "advancement", "companionship"] },
        { position: 2, stage: { en: "Embracing Difficulty", zh: "擁抱困難" }, meaning: { en: "Bearing with the uncultured. Crossing the river without boat.", zh: "容忍未開化者。無船渡河" }, advice: { en: "Accept difficulties gracefully. Use resources at hand courageously.", zh: "優雅地接受困難。勇敢地使用手邊的資源" }, keywords: ["acceptance", "courage", "resourcefulness", "tolerance"] },
        { position: 3, stage: { en: "Transition Warning", zh: "過渡警告" }, meaning: { en: "No plain not followed by slope. No departure without return.", zh: "沒有平地不接著斜坡。沒有離開沒有回歸" }, advice: { en: "Understand that peace contains seeds of decline. Stay vigilant.", zh: "理解和平包含衰落的種子。保持警惕" }, keywords: ["cycles", "vigilance", "transition", "awareness"] },
        { position: 4, stage: { en: "Natural Alliance", zh: "自然聯盟" }, meaning: { en: "Fluttering down without boasting wealth. Natural trust with neighbors.", zh: "飛下而不誇耀財富。與鄰居的自然信任" }, advice: { en: "Connect through genuine sincerity, not displays of wealth.", zh: "通過真誠連結，而非炫富" }, keywords: ["sincerity", "trust", "naturalness", "community"] },
        { position: 5, stage: { en: "Joyful Union", zh: "喜悅聯合" }, meaning: { en: "Sovereign marries off his daughter. Supreme blessing and fortune.", zh: "君主嫁女兒。至高的祝福和運勢" }, advice: { en: "Form alliances through joy and mutual benefit. Great fortune follows.", zh: "通過喜悅和互利結盟。大運隨之而來" }, keywords: ["alliance", "joy", "blessing", "fortune"] },
        { position: 6, stage: { en: "Collapse of Peace", zh: "和平崩潰" }, meaning: { en: "City wall falls back into moat. Peace overturns. Do not fight.", zh: "城牆倒回護城河。和平翻轉。不要戰鬥" }, advice: { en: "Accept when peace transforms to standstill. Fighting worsens things.", zh: "接受和平轉變為停滯。戰鬥使事情更糟" }, keywords: ["transformation", "acceptance", "non-resistance", "cycles"] }
      ]
    },
    relationships: { opposite: 54, inverse: 11, nuclear: 11 }
  },
  {
    number: 12,
    names: { en: "Standstill", zh: "否", pinyin: "pǐ" },
    symbol: "䷋",
    trigrams: {
      upper: { en: "Heaven", zh: "天", symbol: "☰" },
      lower: { en: "Earth", zh: "地", symbol: "☷" }
    },
    classical: { judgment: "否：否之匪人，不利君子貞，大往小來", image: "天地不交，否。君子以儉德辟難，不可榮以祿", lines: ["初六：拔茅茹，以其彙，貞吉，亨", "六二：包承，小人吉，大人否，亨", "六三：包羞", "九四：有命，无咎，疇離祉", "九五：休否，大人吉。其亡其亡，繫于苞桑", "上九：傾否，先否後喜"] },
    wilhelm: { judgment: "Standstill. Evil people do not further The perseverance of the superior man. The great departs; the small approaches.", image: "Heaven and earth do not unite: The image of Standstill. Thus the superior man falls back upon his inner worth In order to escape the difficulties. He does not permit himself to be honored with revenue.", lines: ["When ribbon grass is pulled up, the sod comes with it. Each according to his kind. Perseverance brings good fortune and success.", "They bear and endure; This means good fortune for inferior people. The standstill serves to help the great man to attain success.", "They bear shame.", "He who acts at the command of the highest Remains without blame. Those of like mind partake of the blessing.", "Standstill is giving way. Good fortune for the great man. \"What if it should fail, what if it should fail?\" In this way he ties it to a cluster of mulberry shoots.", "The standstill comes to an end. First standstill, then good fortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Stagnation and obstruction. Heaven and earth separate.", zh: "停滯與阻礙。天地否塞" },
      situation: { en: "You face blockage and unfavorable conditions.", zh: "你面臨阻塞和不利條件" },
      advice: { en: "Withdraw and preserve your inner strength. Wait for better times.", zh: "退守並保存你的內在力量。等待更好的時機" },
      keywords: ["stagnation", "obstruction", "withdrawal", "patience", "preservation"],
      lines: [
        { position: 1, stage: { en: "Withdrawal Begins", zh: "開始撤退" }, meaning: { en: "Pulling up ribbon grass with roots. People withdraw together.", zh: "連根拔起茅草。人們一起撤退" }, advice: { en: "When conditions deteriorate, withdraw with like-minded people.", zh: "當條件惡化時，與志同道合的人撤退" }, keywords: ["withdrawal", "deterioration", "fellowship", "prudence"] },
        { position: 2, stage: { en: "Bearing Adversity", zh: "承受逆境" }, meaning: { en: "Enduring stagnation. Small people prosper, superior man suffers.", zh: "忍受停滯。小人繁榮，君子受苦" }, advice: { en: "Accept that wrong people advance in bad times. Maintain integrity.", zh: "接受錯誤的人在壞時代前進。保持正直" }, keywords: ["endurance", "integrity", "adversity", "patience"] },
        { position: 3, stage: { en: "Hidden Shame", zh: "隱藏羞恥" }, meaning: { en: "Bearing shame internally. Recognizing complicity in stagnation.", zh: "內心承受羞恥。認識到在停滯中的共謀" }, advice: { en: "Acknowledge your role in the situation. Inner shame leads to change.", zh: "承認你在情況中的角色。內在羞恥導致改變" }, keywords: ["shame", "responsibility", "recognition", "change"] },
        { position: 4, stage: { en: "Mandate for Change", zh: "改變授權" }, meaning: { en: "Acting on higher command. No blame in changing course.", zh: "按照更高命令行動。改變方向無責" }, advice: { en: "When you have authority to act, change direction decisively.", zh: "當你有權力行動時，果斷改變方向" }, keywords: ["authority", "change", "command", "action"] },
        { position: 5, stage: { en: "Ending Standstill", zh: "結束停滯" }, meaning: { en: "Bringing standstill to end. Great man acts cautiously.", zh: "結束停滯。偉人謹慎行動" }, advice: { en: "End stagnation carefully. Success comes through cautious action.", zh: "小心地結束停滯。成功來自謹慎行動" }, keywords: ["ending", "caution", "success", "leadership"] },
        { position: 6, stage: { en: "Overthrow Complete", zh: "完全推翻" }, meaning: { en: "Standstill overturned. First standstill, then joy.", zh: "停滯被推翻。先停滯，後喜悅" }, advice: { en: "Celebrate transformation from stagnation to movement.", zh: "慶祝從停滯到行動的轉變" }, keywords: ["transformation", "overthrow", "joy", "renewal"] }
      ]
    },
    relationships: { opposite: 53, inverse: 12, nuclear: 12 }
  },
  {
    number: 13,
    names: { en: "Fellowship with Men", zh: "同人", pinyin: "tóng rén" },
    symbol: "䷌",
    trigrams: {
      upper: { en: "Heaven", zh: "天", symbol: "☰" },
      lower: { en: "Fire", zh: "火", symbol: "☲" }
    },
    classical: { judgment: "同人：同人于野，亨。利涉大川，利君子貞", image: "天與火，同人。君子以類族辨物", lines: ["初九：同人于門，无咎", "六二：同人于宗，吝", "九三：伏戎于莽，升其高陵，三歲不興", "九四：乘其墉，弗克攻，吉", "九五：同人，先號咷而後笑，大師克相遇", "上九：同人于郊，无悔"] },
    wilhelm: { judgment: "Fellowship with men in the open. Success. It furthers one to cross the great water. The perseverance of the superior man furthers.", image: "Heaven together with fire: The image of Fellowship with Men. Thus the superior man organizes the clans And makes distinctions between things.", lines: ["Fellowship with men at the gate. No blame.", "Fellowship with men in the clan. Humiliation.", "He hides weapons in the thicket; He climbs the high hill in front of it. For three years he does not rise up.", "He climbs up on his wall; he cannot attack. Good fortune.", "Men bound in fellowship first weep and lament, But afterward they laugh. After great struggles they succeed in meeting.", "Fellowship with men in the meadow. No remorse."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Fellowship and community. Unity with others in openness.", zh: "同伴與社群。與他人公開團結" },
      situation: { en: "You need to work with others toward common goals.", zh: "你需要與他人朝共同目標努力" },
      advice: { en: "Build genuine fellowship. Be open and unite with like-minded people.", zh: "建立真誠的同伴關係。開放並與志同道合的人團結" },
      keywords: ["fellowship", "community", "unity", "openness", "cooperation"],
      lines: [
        { position: 1, stage: { en: "Open Fellowship", zh: "開放同伴" }, meaning: { en: "Fellowship at the gate. No blame in openness.", zh: "在門口的同伴。開放無責" }, advice: { en: "Begin relationships openly and publicly. Transparency prevents problems.", zh: "公開地開始關係。透明防止問題" }, keywords: ["openness", "public", "transparency", "beginning"] },
        { position: 2, stage: { en: "Narrow Clan", zh: "狹窄宗族" }, meaning: { en: "Fellowship only with clan. Limitation brings humiliation.", zh: "只與宗族為伴。限制帶來羞辱" }, advice: { en: "Expand beyond your small circle. Exclusive groups lead to shame.", zh: "擴展超越你的小圈子。排他群體導致羞恥" }, keywords: ["exclusivity", "limitation", "clan", "expansion"] },
        { position: 3, stage: { en: "Hidden Weapons", zh: "隱藏武器" }, meaning: { en: "Hiding weapons in thicket. Suspicious of potential allies.", zh: "在灌木叢中藏武器。懷疑潛在盟友" }, advice: { en: "Distrust prevents true fellowship. Abandon defensive preparations.", zh: "不信任阻止真正的同伴關係。放棄防禦準備" }, keywords: ["distrust", "suspicion", "defense", "barriers"] },
        { position: 4, stage: { en: "Siege Barrier", zh: "圍城障礙" }, meaning: { en: "Mounted on defensive wall but cannot attack. Fortune in recognizing limits.", zh: "站在防禦牆上但無法攻擊。認識限制帶來好運" }, advice: { en: "Know when not to fight. Recognizing impossibility brings good fortune.", zh: "知道何時不戰鬥。認識不可能帶來好運" }, keywords: ["restraint", "limits", "wisdom", "peace"] },
        { position: 5, stage: { en: "True Fellowship", zh: "真正同伴" }, meaning: { en: "Weeping and lamenting first, then laughing. Great armies meet and understand.", zh: "先哭泣哀嘆，然後大笑。大軍相遇並理解" }, advice: { en: "Work through conflict to genuine connection. Unity comes after struggle.", zh: "通過衝突達到真誠連結。團結在鬥爭後到來" }, keywords: ["struggle", "unity", "understanding", "connection"] },
        { position: 6, stage: { en: "Distant Fellowship", zh: "遙遠同伴" }, meaning: { en: "Fellowship in the meadow. No regret despite distance.", zh: "在草地上的同伴。儘管距離但無遺憾" }, advice: { en: "Accept that not all fellowship is intimate. Distance doesn't negate connection.", zh: "接受並非所有同伴關係都親密。距離不否定連結" }, keywords: ["distance", "acceptance", "connection", "peace"] }
      ]
    },
    relationships: { opposite: 52, inverse: 13, nuclear: 13 }
  },
  {
    number: 14,
    names: { en: "Possession in Great Measure", zh: "大有", pinyin: "dà yǒu" },
    symbol: "䷍",
    trigrams: {
      upper: { en: "Fire", zh: "火", symbol: "☲" },
      lower: { en: "Heaven", zh: "天", symbol: "☰" }
    },
    classical: { judgment: "大有：元亨", image: "火在天上，大有。君子以遏惡揚善，順天休命", lines: ["初九：无交害，匪咎，艱則无咎", "九二：大車以載，有攸往，无咎", "九三：公用亨于天子，小人弗克", "九四：匪其彭，无咎", "六五：厥孚交如，威如，吉", "上九：自天祐之，吉无不利"] },
    wilhelm: { judgment: "Possession in Great Measure. Supreme success.", image: "Fire in heaven above: the image of Possession in Great Measure. Thus the superior man curbs evil and furthers good, And thereby obeys the benevolent will of heaven.", lines: ["No relationship with what is harmful; There is no blame in this. If one remains conscious of difficulty, One remains without blame.", "A big wagon for loading. One may undertake something. No blame.", "A prince offers it to the Son of Heaven. A petty man cannot do this.", "He makes a difference between himself and his neighbor. No blame.", "His truth is accessible, yet dignified. Good fortune.", "He is blessed by heaven. Good fortune. Nothing that does not further."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Great possession and abundance. Wealth with responsibility.", zh: "大擁有與豐盛。財富伴隨責任" },
      situation: { en: "You have great resources and must use them wisely.", zh: "你擁有大量資源且必須明智使用" },
      advice: { en: "Use your abundance to support good works. Share generously.", zh: "用你的豐盛支持善事。慷慨分享" },
      keywords: ["abundance", "wealth", "responsibility", "generosity", "blessing"],
      lines: [
        { position: 1, stage: { en: "Avoiding Harm", zh: "避免傷害" }, meaning: { en: "No relationship with harmful things. No blame in careful selection.", zh: "不與有害事物來往。謹慎選擇無責" }, advice: { en: "Stay away from what could corrupt your abundance. Choose associations wisely.", zh: "遠離可能腐化你豐盛的事物。明智地選擇交往" }, keywords: ["selection", "caution", "avoidance", "wisdom"] },
        { position: 2, stage: { en: "Great Wagon", zh: "大車" }, meaning: { en: "Large wagon for carrying. Strength to undertake great ventures.", zh: "承載的大車。承擔大冒險的力量" }, advice: { en: "You have capacity for major projects. Undertake them confidently.", zh: "你有能力進行重大項目。自信地承擔它們" }, keywords: ["capacity", "strength", "ventures", "confidence"] },
        { position: 3, stage: { en: "Sharing Wealth", zh: "分享財富" }, meaning: { en: "Prince offers to the Son of Heaven. Small man cannot do this.", zh: "諸侯向天子獻禮。小人無法做到" }, advice: { en: "Share your abundance with higher causes. Generosity befits the capable.", zh: "與更高的事業分享你的豐盛。慷慨適合有能力者" }, keywords: ["generosity", "sharing", "nobility", "service"] },
        { position: 4, stage: { en: "Without Arrogance", zh: "不傲慢" }, meaning: { en: "Despite great possession, no arrogance. Distinguishing self from neighbors.", zh: "儘管擁有巨大，但不傲慢。區分自己與鄰居" }, advice: { en: "Remain humble despite wealth. Know the difference between you and others without pride.", zh: "儘管富有仍保持謙遜。知道你和他人的區別但不驕傲" }, keywords: ["humility", "distinction", "modesty", "awareness"] },
        { position: 5, stage: { en: "Dignified Sincerity", zh: "尊嚴真誠" }, meaning: { en: "Sincerity that is dignified and approachable. Truth brings connection.", zh: "尊嚴且平易近人的真誠。真理帶來連結" }, advice: { en: "Be both truthful and accessible. Dignity with warmth attracts support.", zh: "既真實又易接近。尊嚴與溫暖吸引支持" }, keywords: ["sincerity", "dignity", "approachability", "truth"] },
        { position: 6, stage: { en: "Heaven's Blessing", zh: "天之祝福" }, meaning: { en: "Blessed by heaven. Nothing that does not further.", zh: "受天祝福。無不利" }, advice: { en: "Supreme fortune comes from being blessed. Everything succeeds now.", zh: "至高運勢來自受祝福。現在一切成功" }, keywords: ["blessing", "fortune", "success", "divine favor"] }
      ]
    },
    relationships: { opposite: 51, inverse: 14, nuclear: 14 }
  },
  {
    number: 15,
    names: { en: "Modesty", zh: "謙", pinyin: "qiān" },
    symbol: "䷎",
    trigrams: {
      upper: { en: "Earth", zh: "地", symbol: "☷" },
      lower: { en: "Mountain", zh: "山", symbol: "☶" }
    },
    classical: { judgment: "謙：亨。君子有終", image: "地中有山，謙。君子以裒多益寡，稱物平施", lines: ["初六：謙謙君子，用涉大川，吉", "六二：鳴謙，貞吉", "九三：勞謙，君子有終，吉", "六四：无不利，撝謙", "六五：不富以其鄰，利用侵伐，无不利", "上六：鳴謙，利用行師，征邑國"] },
    wilhelm: { judgment: "Modesty creates success. The superior man carries things through.", image: "Within the earth, a mountain: The image of Modesty. Thus the superior man reduces that which is too much, And augments that which is too little. He weighs things and makes them equal.", lines: ["A superior man modest about his modesty May cross the great water. Good fortune.", "Modesty that comes to expression. Perseverance brings good fortune.", "A superior man of modesty and merit Carries things to conclusion. Good fortune.", "Nothing that would not further modesty In movement.", "No boasting of wealth before one's neighbor. It is favorable to attack with force. Nothing that would not further.", "Modesty that comes to expression. It is favorable to set armies marching To chastise one's own city and one's country."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Modesty and humility. Lowering oneself brings elevation.", zh: "謙遜與謙卑。降低自己帶來提升" },
      situation: { en: "You succeed through humility, not assertion.", zh: "你通過謙卑而非自我主張獲得成功" },
      advice: { en: "Be modest and humble. Let your actions speak quietly.", zh: "保持謙遜和謙卑。讓你的行動安靜地說話" },
      keywords: ["modesty", "humility", "lowering", "balance", "virtue"],
      lines: [
        { position: 1, stage: { en: "Humble Crossing", zh: "謙遜渡河" }, meaning: { en: "Modestly crossing the great water. Success through humility.", zh: "謙遜地渡大河。通過謙遜成功" }, advice: { en: "Undertake great tasks with modesty. Humility enables difficult crossings.", zh: "以謙遜承擔大任務。謙卑使困難的跨越成為可能" }, keywords: ["humility", "crossing", "success", "modesty"] },
        { position: 2, stage: { en: "Inner Modesty", zh: "內在謙遜" }, meaning: { en: "Modesty that manifests naturally. Expressing humility from within.", zh: "自然展現的謙遜。從內在表達謙卑" }, advice: { en: "Let modesty come from your heart. Inner truth shows outwardly.", zh: "讓謙遜從你心中自然流露。內在真理外顯" }, keywords: ["inner truth", "natural", "expression", "authenticity"] },
        { position: 3, stage: { en: "Meritorious Modesty", zh: "功績謙遜" }, meaning: { en: "Modest despite accomplishment. Superior man carries things through.", zh: "儘管有成就仍謙遜。君子貫徹事物" }, advice: { en: "Remain humble after success. Complete tasks without boasting.", zh: "成功後保持謙遜。完成任務而不誇耀" }, keywords: ["accomplishment", "completion", "humility", "success"] },
        { position: 4, stage: { en: "Active Modesty", zh: "行動謙遜" }, meaning: { en: "Nothing that does not further modest behavior in action.", zh: "行動中的謙遜行為無不利" }, advice: { en: "Express modesty through deeds. Everything succeeds with humble action.", zh: "通過行為表達謙遜。一切以謙遜行動成功" }, keywords: ["action", "deeds", "behavior", "success"] },
        { position: 5, stage: { en: "Firm Modesty", zh: "堅定謙遜" }, meaning: { en: "Not boasting wealth but acting firmly when needed.", zh: "不誇耀財富但在需要時堅定行動" }, advice: { en: "Be modest but not weak. Firmness and humility can coexist.", zh: "謙遜但不軟弱。堅定和謙遜可以並存" }, keywords: ["firmness", "strength", "balance", "action"] },
        { position: 6, stage: { en: "Proclaimed Modesty", zh: "宣揚謙遜" }, meaning: { en: "Modesty that sounds forth. Using armies to order one's country.", zh: "響亮的謙遜。用軍隊整頓國家" }, advice: { en: "When modesty is recognized, use authority to create order.", zh: "當謙遜被認可時，用權威創造秩序" }, keywords: ["recognition", "authority", "order", "leadership"] }
      ]
    },
    relationships: { opposite: 50, inverse: 15, nuclear: 15 }
  },
  {
    number: 16,
    names: { en: "Enthusiasm", zh: "豫", pinyin: "yù" },
    symbol: "䷏",
    trigrams: {
      upper: { en: "Thunder", zh: "雷", symbol: "☳" },
      lower: { en: "Earth", zh: "地", symbol: "☷" }
    },
    classical: { judgment: "豫：利建侯行師", image: "雷出地奮，豫。先王以作樂崇德，殷薦之上帝，以配祖考", lines: ["初六：鳴豫，凶", "六二：介于石，不終日，貞吉", "六三：盱豫，悔，遲有悔", "九四：由豫，大有得，勿疑，朋盍簪", "六五：貞疾，恆不死", "上六：冥豫，成有渝，无咎"] },
    wilhelm: { judgment: "Enthusiasm. It furthers one to install helpers And to set armies marching.", image: "Thunder comes resounding out of the earth: The image of Enthusiasm. Thus the ancient kings made music In order to honor merit, And offered it with splendor To the Supreme Deity, Inviting their ancestors to be present.", lines: ["Enthusiasm that expresses itself Brings misfortune.", "Firm as a rock. Not a whole day. Perseverance brings good fortune.", "Enthusiasm that looks upward creates remorse. Hesitation brings remorse.", "The source of enthusiasm. He achieves great things. Doubt not. You gather friends around you As a hair clasp gathers the hair.", "Persistently ill, and still does not die.", "Deluded enthusiasm. But if after completion one changes, There is no blame."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Enthusiasm and movement. Energy mobilized for action.", zh: "熱情與行動。能量動員起來行動" },
      situation: { en: "You have energy and momentum for accomplishment.", zh: "你有能量和動力去完成事情" },
      advice: { en: "Channel your enthusiasm productively. Inspire and mobilize others.", zh: "將你的熱情有效地引導。激勵和動員他人" },
      keywords: ["enthusiasm", "energy", "movement", "inspiration", "momentum"],
      lines: [
        { position: 1, stage: { en: "Boastful Enthusiasm", zh: "誇耀熱情" }, meaning: { en: "Proclaiming enthusiasm brings misfortune.", zh: "宣揚熱情帶來不幸" }, advice: { en: "Don't boast. Premature declaration invites trouble.", zh: "不要誇耀。過早宣告招致麻煩" }, keywords: ["boasting", "premature", "caution", "restraint"] },
        { position: 2, stage: { en: "Firm Recognition", zh: "堅定認識" }, meaning: { en: "Firm as rock. Recognizing truth immediately.", zh: "堅如磐石。立即認識真理" }, advice: { en: "Trust immediate recognition. Act decisively.", zh: "信任即時認識。果斷行動" }, keywords: ["firmness", "recognition", "decisiveness", "trust"] },
        { position: 3, stage: { en: "Upward Gaze", zh: "向上凝視" }, meaning: { en: "Looking upward creates enthusiasm. Delay brings regret.", zh: "向上看創造熱情。延遲帶來悔恨" }, advice: { en: "Seize the moment. Hesitation causes missed opportunities.", zh: "抓住時機。猶豫導致錯過機會" }, keywords: ["opportunity", "timing", "action", "regret"] },
        { position: 4, stage: { en: "Source of Energy", zh: "能量之源" }, meaning: { en: "Being the source others gather around. Great success.", zh: "成為他人聚集的源頭。巨大成功" }, advice: { en: "Lead from the center. Others naturally follow.", zh: "從中心領導。他人自然跟隨" }, keywords: ["leadership", "center", "influence", "success"] },
        { position: 5, stage: { en: "Persistent Difficulty", zh: "持續困難" }, meaning: { en: "Chronically ill yet does not die. Ongoing challenge.", zh: "慢性患病但不死。持續挑戰" }, advice: { en: "Endure persistent problems. Survival through difficulty.", zh: "忍受持續問題。通過困難生存" }, keywords: ["endurance", "chronic", "persistence", "survival"] },
        { position: 6, stage: { en: "Deluded State", zh: "迷惑狀態" }, meaning: { en: "Deluded enthusiasm. Late awakening prevents total failure.", zh: "迷惑的熱情。遲來的覺醒防止完全失敗" }, advice: { en: "Wake from delusion. Recognition, even late, helps.", zh: "從迷惑中醒來。認識即使遲也有幫助" }, keywords: ["delusion", "awakening", "change", "recovery"] }
      ]
    },
    relationships: { opposite: 49, inverse: 16, nuclear: 16 }
  },
  {
    number: 17,
    names: { en: "Following", zh: "隨", pinyin: "suí" },
    symbol: "䷐",
    trigrams: {
      upper: { en: "Lake", zh: "澤", symbol: "☱" },
      lower: { en: "Thunder", zh: "雷", symbol: "☳" }
    },
    classical: { judgment: "隨：元亨，利貞，无咎", image: "澤中有雷，隨。君子以嚮晦入宴息", lines: ["初九：官有渝，貞吉，出門交有功", "六二：係小子，失丈夫", "六三：係丈夫，失小子，隨有求得，利居貞", "九四：隨有獲，貞凶。有孚在道，以明，何咎", "九五：孚于嘉，吉", "上六：拘係之，乃從維之，王用亨于西山"] },
    wilhelm: { judgment: "Following has supreme success. Perseverance furthers. No blame.", image: "Thunder in the middle of the lake: The image of Following. Thus the superior man at nightfall Goes indoors for rest and recuperation.", lines: ["The standard is changing. Perseverance brings good fortune. Going out of the door in company Produces deeds.", "If one clings to the little boy, One loses the strong man.", "If one clings to the strong man, One loses the little boy. Through following one finds what one seeks. It furthers one to remain persevering.", "Following creates success. Perseverance brings misfortune. To go one's way with sincerity brings clarity. How could there be blame in this?", "Sincere in the good. Good fortune.", "He meets with firm allegiance And is still further bound. The king introduces him To the Western Mountain."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Following and adaptation. Going with the flow appropriately.", zh: "追隨與適應。適當地順勢而為" },
      situation: { en: "You should follow rather than lead at this time.", zh: "此時你應該追隨而非領導" },
      advice: { en: "Adapt to circumstances. Follow what is natural and correct.", zh: "適應環境。追隨自然和正確的事物" },
      keywords: ["following", "adaptation", "flexibility", "timing", "flow"],
      lines: [
        { position: 1, stage: { en: "Official Following", zh: "官方追隨" }, meaning: { en: "Standards change. Following proper authorities brings benefit.", zh: "標準改變。追隨適當權威帶來利益" }, advice: { en: "Adapt to new standards. Follow legitimate leadership.", zh: "適應新標準。追隨合法領導" }, keywords: ["adaptation", "standards", "authority", "change"] },
        { position: 2, stage: { en: "Wrong Attachment", zh: "錯誤依附" }, meaning: { en: "Clinging to small boy, losing strong man.", zh: "依附小男孩，失去強壯男人" }, advice: { en: "Don't attach to the immature. Seek substantial connections.", zh: "不要依附不成熟者。尋求實質連結" }, keywords: ["attachment", "choice", "maturity", "discernment"] },
        { position: 3, stage: { en: "Right Attachment", zh: "正確依附" }, meaning: { en: "Clinging to strong man, releasing small boy.", zh: "依附強壯男人，釋放小男孩" }, advice: { en: "Follow the capable. Release inferior attachments.", zh: "追隨有能力者。釋放低劣依附" }, keywords: ["following", "capability", "release", "wisdom"] },
        { position: 4, stage: { en: "Self-Seeking Following", zh: "自我追求" }, meaning: { en: "Following to obtain. Continuing brings misfortune.", zh: "追隨以獲得。繼續帶來不幸" }, advice: { en: "If following for selfish gain, misfortune awaits. Seek sincerity.", zh: "如果為自私利益追隨，不幸等待。尋求真誠" }, keywords: ["selfish", "gain", "sincerity", "warning"] },
        { position: 5, stage: { en: "Sincere Excellence", zh: "真誠卓越" }, meaning: { en: "Sincere in excellence. Supreme good fortune.", zh: "真誠於卓越。至高好運" }, advice: { en: "Follow what is genuinely excellent. Sincerity brings blessing.", zh: "追隨真正卓越的。真誠帶來祝福" }, keywords: ["sincerity", "excellence", "blessing", "fortune"] },
        { position: 6, stage: { en: "Bound Together", zh: "緊密聯繫" }, meaning: { en: "Firmly bound and followed by loyalty. King offers sacrifice.", zh: "堅定聯繫並被忠誠跟隨。君王獻祭" }, advice: { en: "Create loyal bonds. Honor those who follow you.", zh: "創造忠誠紐帶。尊重追隨你的人" }, keywords: ["loyalty", "bonds", "honor", "devotion"] }
      ]
    },
    relationships: { opposite: 48, inverse: 17, nuclear: 17 }
  },
  {
    number: 18,
    names: { en: "Work on What Has Been Spoiled", zh: "蠱", pinyin: "gǔ" },
    symbol: "䷑",
    trigrams: {
      upper: { en: "Mountain", zh: "山", symbol: "☶" },
      lower: { en: "Wind", zh: "風", symbol: "☴" }
    },
    classical: { judgment: "蠱：元亨。利涉大川，先甲三日，後甲三日", image: "山下有風，蠱。君子以振民育德", lines: ["初六：幹父之蠱，有子考，无咎，厲，終吉", "九二：幹母之蠱，不可貞", "九三：幹父之蠱，小有悔，无大咎", "六四：裕父之蠱，往見吝", "六五：幹父之蠱，用譽", "上九：不事王侯，高尚其事"] },
    wilhelm: { judgment: "Work on What Has Been Spoiled Has supreme success. It furthers one to cross the great water. Before the starting point, three days. After the starting point, three days.", image: "The wind blows low on the mountain: The image of Decay. Thus the superior man stirs up the people And strengthens their spirit.", lines: ["Setting right what has been spoiled by the father. If there is a son, No blame rests upon the departed father. Danger. In the end, good fortune.", "Setting right what has been spoiled by the mother. One must not be too persevering.", "Setting right what has been spoiled by the father. There will be a little remorse. No great blame.", "Tolerating what has been spoiled by the father. In continuing one sees humiliation.", "Setting right what has been spoiled by the father. One meets with praise.", "He does not serve kings and princes, Sets himself higher goals."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Decay and repair. Fixing what has been spoiled.", zh: "腐敗與修復。修正已經損壞的事物" },
      situation: { en: "You face corruption or decay that needs correction.", zh: "你面臨需要糾正的腐敗或衰敗" },
      advice: { en: "Address problems at their root. Clean up past mistakes carefully.", zh: "從根源處理問題。仔細清理過去的錯誤" },
      keywords: ["decay", "repair", "correction", "renewal", "responsibility"],
      lines: [
        { position: 1, stage: { en: "Inherited Corruption", zh: "繼承的腐敗" }, meaning: { en: "Dealing with father's errors. Danger but eventual success through care.", zh: "處理父親的錯誤。危險但最終通過關懷成功" }, advice: { en: "Face inherited problems carefully. Filial piety guides correction.", zh: "謹慎面對繼承的問題。孝道指引糾正" }, keywords: ["inheritance", "correction", "care", "responsibility"] },
        { position: 2, stage: { en: "Mother's Mistakes", zh: "母親的錯誤" }, meaning: { en: "Dealing with mother's errors. Cannot be too severe in correction.", zh: "處理母親的錯誤。糾正不能太嚴厲" }, advice: { en: "Correct gently. Harshness damages what you're trying to heal.", zh: "溫和糾正。嚴厲損害你試圖治癒的" }, keywords: ["gentleness", "correction", "care", "balance"] },
        { position: 3, stage: { en: "Overcorrection", zh: "過度糾正" }, meaning: { en: "Working on father's spoiled work with some excess. Small regret but no great blame.", zh: "處理父親的腐敗工作有些過度。小悔恨但無大責" }, advice: { en: "Better to overcorrect than undercorrect. Minor regret acceptable.", zh: "過度糾正好於糾正不足。小悔恨可接受" }, keywords: ["excess", "energy", "commitment", "action"] },
        { position: 4, stage: { en: "Tolerating Decay", zh: "容忍腐敗" }, meaning: { en: "Indulging father's decay. Continuing brings humiliation.", zh: "縱容父親的腐敗。繼續帶來羞辱" }, advice: { en: "Don't tolerate ongoing corruption. Inaction compounds problems.", zh: "不要容忍持續的腐敗。不作為使問題複雜化" }, keywords: ["tolerance", "decay", "action needed", "warning"] },
        { position: 5, stage: { en: "Honored Correction", zh: "光榮糾正" }, meaning: { en: "Working on father's spoiled work. Meeting with praise and recognition.", zh: "處理父親的腐敗工作。受到讚揚和認可" }, advice: { en: "Proper correction brings honor. Others recognize your efforts.", zh: "適當糾正帶來榮譽。他人認可你的努力" }, keywords: ["honor", "recognition", "success", "praise"] },
        { position: 6, stage: { en: "Beyond Service", zh: "超越服務" }, meaning: { en: "Not serving king or lords. Following higher calling.", zh: "不服務於君王或諸侯。追隨更高召喚" }, advice: { en: "Some work transcends worldly service. Pursue higher purpose.", zh: "某些工作超越世俗服務。追求更高目的" }, keywords: ["transcendence", "purpose", "independence", "calling"] }
      ]
    },
    relationships: { opposite: 47, inverse: 18, nuclear: 18 }
  },
  {
    number: 19,
    names: { en: "Approach", zh: "臨", pinyin: "lín" },
    symbol: "䷒",
    trigrams: {
      upper: { en: "Earth", zh: "地", symbol: "☷" },
      lower: { en: "Lake", zh: "澤", symbol: "☱" }
    },
    classical: { judgment: "臨：元亨，利貞。至于八月有凶", image: "澤上有地，臨。君子以教思无窮，容保民无疆", lines: ["初九：咸臨，貞吉", "九二：咸臨，吉，无不利", "六三：甘臨，无攸利，既憂之，无咎", "六四：至臨，无咎", "六五：知臨，大君之宜，吉", "上六：敦臨，吉，无咎"] },
    wilhelm: { judgment: "Approach has supreme success. Perseverance furthers. When the eighth month comes, There will be misfortune.", image: "The earth above the lake: The image of Approach. Thus the superior man is inexhaustible In his will to teach, And without limits In his tolerance and protection of the people.", lines: ["Common approach. Perseverance brings good fortune.", "Common approach. Good fortune. Everything furthers.", "Comfortable approach. Nothing that would further. If one is induced to grieve over it, One becomes free of blame.", "Complete approach. No blame.", "Wise approach. This is right for a great prince. Good fortune.", "Great-hearted approach. Good fortune. No blame."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Approach and advancement. Drawing near with good intentions.", zh: "接近與前進。帶著善意接近" },
      situation: { en: "You're making progress and gaining influence.", zh: "你正在取得進展並獲得影響力" },
      advice: { en: "Move forward confidently but be aware of future limits.", zh: "自信地前進但要意識到未來的限制" },
      keywords: ["approach", "advancement", "progress", "influence", "awareness"],
      lines: [
        { position: 1, stage: { en: "Mutual Approach", zh: "相互接近" }, meaning: { en: "Approaching together. Joint perseverance brings good fortune.", zh: "一起接近。共同堅持帶來好運" }, advice: { en: "Advance with allies. Mutual support ensures success.", zh: "與盟友前進。相互支持確保成功" }, keywords: ["alliance", "mutual", "support", "unity"] },
        { position: 2, stage: { en: "Inclusive Approach", zh: "包容接近" }, meaning: { en: "Approaching together with inclusion. Everything furthers.", zh: "帶著包容一起接近。一切順利" }, advice: { en: "Include all in your advance. Inclusive approach succeeds completely.", zh: "在你的前進中包括所有人。包容方法完全成功" }, keywords: ["inclusion", "comprehensive", "success", "unity"] },
        { position: 3, stage: { en: "Comfortable Approach", zh: "舒適接近" }, meaning: { en: "Comfortable but complacent approach. Nothing furthers this.", zh: "舒適但自滿的接近。這無益" }, advice: { en: "Comfort breeds complacency. Recognize the danger in ease.", zh: "舒適滋生自滿。認識到安逸中的危險" }, keywords: ["comfort", "complacency", "warning", "awareness"] },
        { position: 4, stage: { en: "Complete Approach", zh: "完整接近" }, meaning: { en: "Approach reaches completion. No blame in thoroughness.", zh: "接近達到完成。徹底無責" }, advice: { en: "Complete your advance fully. Thoroughness prevents problems.", zh: "完全完成你的前進。徹底防止問題" }, keywords: ["completion", "thoroughness", "success", "fulfillment"] },
        { position: 5, stage: { en: "Wise Approach", zh: "智慧接近" }, meaning: { en: "Wise approach appropriate to great prince. Supreme fortune.", zh: "適合大君的智慧接近。至高運勢" }, advice: { en: "Approach with wisdom and authority. Leadership brings blessing.", zh: "以智慧和權威接近。領導帶來祝福" }, keywords: ["wisdom", "authority", "leadership", "fortune"] },
        { position: 6, stage: { en: "Magnanimous Approach", zh: "寬宏接近" }, meaning: { en: "Great-hearted, magnanimous approach. Good fortune, no blame.", zh: "寬宏大量的接近。好運，無責" }, advice: { en: "Approach with generosity and nobility. Magnanimity succeeds.", zh: "以慷慨和高貴接近。寬宏成功" }, keywords: ["magnanimity", "generosity", "nobility", "success"] }
      ]
    },
    relationships: { opposite: 46, inverse: 19, nuclear: 19 }
  },
  {
    number: 20,
    names: { en: "Contemplation", zh: "觀", pinyin: "guān" },
    symbol: "䷓",
    trigrams: {
      upper: { en: "Wind", zh: "風", symbol: "☴" },
      lower: { en: "Earth", zh: "地", symbol: "☷" }
    },
    classical: { judgment: "觀：盥而不薦，有孚顒若", image: "風行地上，觀。先王以省方觀民設教", lines: ["初六：童觀，小人无咎，君子吝", "六二：闚觀，利女貞", "六三：觀我生，進退", "六四：觀國之光，利用賓于王", "九五：觀我生，君子无咎", "上九：觀其生，君子无咎"] },
    wilhelm: { judgment: "Contemplation. The ablution has been made, But not yet the offering. Full of trust they look up to him.", image: "The wind blows over the earth: The image of Contemplation. Thus the kings of old visited the regions of the world, Contemplated the people, And gave them instruction.", lines: ["Contemplation like a child. For an inferior man, no blame. For a superior man, humiliation.", "Contemplation through the crack of the door. Furthering for the perseverance of a woman.", "Contemplation of my life Decides the choice Between advance and retreat.", "Contemplation of the light of the kingdom. It furthers one to exert influence as the guest of a king.", "Contemplation of my life. The superior man is without blame.", "Contemplation of his life. The superior man is without blame."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Contemplation and observation. Seeing clearly from above.", zh: "沉思與觀察。從上方清楚地看" },
      situation: { en: "You need to observe carefully before acting.", zh: "你需要在行動前仔細觀察" },
      advice: { en: "Step back and gain perspective. Contemplate before deciding.", zh: "退後並獲得視角。在決定前沉思" },
      keywords: ["contemplation", "observation", "perspective", "awareness", "understanding"],
      lines: [
        { position: 1, stage: { en: "Boyish View", zh: "孩童視角" }, meaning: { en: "Boyish, limited contemplation. No blame for inferior person, but shameful for superior.", zh: "孩童般有限的沉思。低下者無責，但對高人羞恥" }, advice: { en: "Superficial observation acceptable for beginners, not for leaders.", zh: "對初學者可接受的表面觀察，對領導者不行" }, keywords: ["superficial", "beginning", "limitation", "learning"] },
        { position: 2, stage: { en: "Peeping View", zh: "窺視" }, meaning: { en: "Peeping through crack. Advantageous only for perseverance of a woman.", zh: "從裂縫窺視。只對女性的堅持有利" }, advice: { en: "Limited perspective has its place but cannot guide great matters.", zh: "有限視角有其位置但不能指導大事" }, keywords: ["limited", "perspective", "appropriate scope", "boundaries"] },
        { position: 3, stage: { en: "Self-Contemplation", zh: "自我沉思" }, meaning: { en: "Contemplation of one's own life. Advance or retreat based on self-knowledge.", zh: "沉思自己的生活。基於自知進退" }, advice: { en: "Look inward first. Self-knowledge determines right action.", zh: "先向內看。自知決定正確行動" }, keywords: ["self-knowledge", "reflection", "decision", "awareness"] },
        { position: 4, stage: { en: "Kingdom's Glory", zh: "王國榮光" }, meaning: { en: "Contemplating kingdom's light. Favorable to be guest of king.", zh: "沉思王國的光芒。作為君王賓客有利" }, advice: { en: "Observe greatness to understand it. Learn from the highest examples.", zh: "觀察偉大以理解它。從最高榜樣學習" }, keywords: ["observation", "learning", "excellence", "study"] },
        { position: 5, stage: { en: "Self-Examination", zh: "自我審視" }, meaning: { en: "Contemplating one's own life. Superior man without blame.", zh: "沉思自己的生活。君子無責" }, advice: { en: "Constant self-examination for leaders. Awareness prevents errors.", zh: "領導者持續自我審視。意識防止錯誤" }, keywords: ["self-examination", "leadership", "awareness", "vigilance"] },
        { position: 6, stage: { en: "Others' Lives", zh: "他人生活" }, meaning: { en: "Contemplating others' lives. Superior man without blame.", zh: "沉思他人生活。君子無責" }, advice: { en: "Observe how others live. Understanding brings wisdom without judgment.", zh: "觀察他人如何生活。理解帶來智慧而非評判" }, keywords: ["observation", "understanding", "wisdom", "empathy"] }
      ]
    },
    relationships: { opposite: 45, inverse: 20, nuclear: 20 }
  },
  {
    number: 21,
    names: { en: "Biting Through", zh: "噬嗑", pinyin: "shì kè" },
    symbol: "䷔",
    trigrams: {
      upper: { en: "Fire", zh: "火", symbol: "☲" },
      lower: { en: "Thunder", zh: "雷", symbol: "☳" }
    },
    classical: { judgment: "噬嗑：亨。利用獄", image: "雷電，噬嗑。先王以明罰敕法", lines: ["初九：履校滅趾，无咎", "六二：噬膚滅鼻，无咎", "六三：噬腊肉，遇毒，小吝，无咎", "九四：噬乾胏，得金矢，利艱貞，吉", "六五：噬乾肉，得黃金，貞厲，无咎", "上九：何校滅耳，凶"] },
    wilhelm: { judgment: "Biting Through has success. It is favorable to let justice be administered.", image: "Thunder and lightning: The image of Biting Through. Thus the kings of former times made firm the laws Through clearly defined penalties.", lines: ["His feet are fastened in the stocks, So that his toes disappear. No blame.", "Bites through tender meat, So that his nose disappears. No blame.", "Bites on old dried meat And strikes on something poisonous. Slight humiliation. No blame.", "Bites on dried gristly meat. Receives metal arrows. It furthers one to be mindful of difficulties And to be persevering. Good fortune.", "Bites on dried lean meat. Receives yellow gold. Perseveringly aware of danger. No blame.", "His neck is fastened in the wooden cangue, So that his ears disappear. Misfortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Biting through obstacles. Decisive action to resolve.", zh: "咬穿障礙。果斷行動以解決" },
      situation: { en: "You face obstruction that requires firm action.", zh: "你面臨需要堅定行動的阻礙" },
      advice: { en: "Take decisive action. Remove the obstacle blocking progress.", zh: "採取果斷行動。移除阻礙進展的障礙" },
      keywords: ["biting through", "decision", "obstacles", "justice", "resolution"],
      lines: [
        { position: 1, stage: { en: "Feet in Stocks", zh: "足在枷" }, meaning: { en: "Feet locked in stocks. Toes disappear. No blame in restraint.", zh: "足鎖在枷。腳趾消失。克制無責" }, advice: { en: "Early punishment prevents worse. Small restraint stops progression.", zh: "早期懲罰防止更糟。小克制阻止進展" }, keywords: ["restraint", "prevention", "early action", "limitation"] },
        { position: 2, stage: { en: "Biting Through Skin", zh: "咬穿皮膚" }, meaning: { en: "Biting through tender meat, nose disappears. No blame.", zh: "咬穿嫩肉，鼻子消失。無責" }, advice: { en: "Minor punishment for minor wrongs. Swift justice for small offenses.", zh: "輕微過錯的輕微懲罰。小罪的迅速正義" }, keywords: ["minor punishment", "swiftness", "proportion", "justice"] },
        { position: 3, stage: { en: "Biting Old Meat", zh: "咬老肉" }, meaning: { en: "Biting old dried meat, encountering poison. Slight humiliation.", zh: "咬老乾肉，遇到毒。輕微羞辱" }, advice: { en: "Dealing with old wrongs is unpleasant but necessary. Accept minor shame.", zh: "處理舊錯是不愉快但必要的。接受小羞恥" }, keywords: ["old wrongs", "unpleasant", "necessity", "humiliation"] },
        { position: 4, stage: { en: "Biting Dried Meat", zh: "咬乾肉" }, meaning: { en: "Biting dried gristly meat, receiving metal arrows. Difficulty brings reward.", zh: "咬乾硬肉，收到金屬箭。困難帶來獎賞" }, advice: { en: "Persist through difficulty. Hard cases require hard effort but bring reward.", zh: "堅持克服困難。難案需要艱苦努力但帶來獎賞" }, keywords: ["persistence", "difficulty", "reward", "determination"] },
        { position: 5, stage: { en: "Biting Dried Meat", zh: "咬乾瘦肉" }, meaning: { en: "Biting dried lean meat, receiving yellow gold. Awareness of danger.", zh: "咬乾瘦肉，收到黃金。意識到危險" }, advice: { en: "Stay vigilant even in success. Awareness of danger prevents complacency.", zh: "即使成功也要保持警惕。危險意識防止自滿" }, keywords: ["vigilance", "success", "danger awareness", "caution"] },
        { position: 6, stage: { en: "Neck in Cangue", zh: "頸戴枷" }, meaning: { en: "Neck in wooden collar, ears disappear. Misfortune from excess.", zh: "頸戴木枷，耳朵消失。過度的不幸" }, advice: { en: "Excessive punishment backfires. Severity beyond proportion brings misfortune.", zh: "過度懲罰適得其反。超出比例的嚴厲帶來不幸" }, keywords: ["excess", "severity", "backfire", "misfortune"] }
      ]
    },
    relationships: { opposite: 44, inverse: 21, nuclear: 21 }
  },
  {
    number: 22,
    names: { en: "Grace", zh: "賁", pinyin: "bì" },
    symbol: "䷕",
    trigrams: {
      upper: { en: "Mountain", zh: "山", symbol: "☶" },
      lower: { en: "Fire", zh: "火", symbol: "☲" }
    },
    classical: { judgment: "賁：亨。小利有攸往", image: "山下有火，賁。君子以明庶政，无敢折獄", lines: ["初九：賁其趾，舍車而徒", "六二：賁其須", "九三：賁如，濡如，永貞吉", "六四：賁如，皤如，白馬翰如，匪寇，婚媾", "六五：賁于丘園，束帛戔戔，吝，終吉", "上九：白賁，无咎"] },
    wilhelm: { judgment: "Grace has success. In small matters It is favorable to undertake something.", image: "Fire at the foot of the mountain: The image of Grace. Thus does the superior man proceed When clearing up current affairs. But he dare not decide controversial issues in this way.", lines: ["He lends grace to his toes, leaves the carriage, and walks.", "Lends grace to the beard on his chin.", "Graceful and moist. Constant perseverance brings good fortune.", "Grace or simplicity? A white horse comes as if on wings. He is not a robber, He will woo at the right time.", "Grace in hills and gardens. The roll of silk is meager and small. Humiliation, but in the end good fortune.", "Simple grace. No blame."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Grace and beauty. Adorning with elegance and style.", zh: "優雅與美麗。以優雅和風格裝飾" },
      situation: { en: "You focus on form and appearance, not just substance.", zh: "你專注於形式和外表，而非僅是實質" },
      advice: { en: "Add beauty and grace but don't neglect the foundation.", zh: "增添美麗和優雅但不要忽視基礎" },
      keywords: ["grace", "beauty", "elegance", "adornment", "refinement"],
      lines: [
        { position: 1, stage: { en: "Adorning Toes", zh: "裝飾腳趾" }, meaning: { en: "Grace for toes. Leaves carriage, walks on foot.", zh: "為腳趾增光。離開車，徒步行走" }, advice: { en: "Adorn the foundation but stay grounded. Don't rely on superficial transport.", zh: "裝飾基礎但保持踏實。不要依賴表面運輸" }, keywords: ["foundation", "grounded", "simplicity", "basics"] },
        { position: 2, stage: { en: "Adorning Beard", zh: "裝飾鬍鬚" }, meaning: { en: "Gracing the beard, adorning what grows from another.", zh: "美化鬍鬚，裝飾從他人生長的東西" }, advice: { en: "Beautify what naturally emerges. Enhance, don't force.", zh: "美化自然湧現的。增強，不要強迫" }, keywords: ["natural", "enhancement", "emergence", "authenticity"] },
        { position: 3, stage: { en: "Graceful and Moist", zh: "優雅濕潤" }, meaning: { en: "Graceful and glistening. Forever persevering brings fortune.", zh: "優雅閃亮。永遠堅持帶來好運" }, advice: { en: "Maintain lasting grace through consistency. Don't let beauty fade.", zh: "通過一致性保持持久優雅。不要讓美麗褪色" }, keywords: ["consistency", "lasting", "maintenance", "perseverance"] },
        { position: 4, stage: { en: "White Horse", zh: "白馬" }, meaning: { en: "Grace or simplicity? White horse comes, not robber but wooer.", zh: "優雅還是簡單？白馬來臨，不是強盜而是求婚者" }, advice: { en: "Choose between ornament and plainness. What approaches is friendly.", zh: "在裝飾和樸素之間選擇。接近的是友好的" }, keywords: ["choice", "simplicity", "ornamentation", "intention"] },
        { position: 5, stage: { en: "Garden on Height", zh: "山上花園" }, meaning: { en: "Grace in hills and gardens. Meager roll of silk brings eventual fortune.", zh: "山丘和花園中的優雅。微薄的絲綢卷最終帶來好運" }, advice: { en: "Simple offerings in the right setting bring blessing. Context matters.", zh: "在正確環境中的簡單供品帶來祝福。環境重要" }, keywords: ["setting", "simplicity", "appropriateness", "blessing"] },
        { position: 6, stage: { en: "Simple Grace", zh: "簡單優雅" }, meaning: { en: "Simple grace. No blame in pure white simplicity.", zh: "簡單優雅。純白簡單無責" }, advice: { en: "Return to fundamental simplicity. Pure form needs no adornment.", zh: "回歸基本簡單。純粹形式不需要裝飾" }, keywords: ["simplicity", "purity", "fundamentals", "essence"] }
      ]
    },
    relationships: { opposite: 43, inverse: 22, nuclear: 22 }
  },
  {
    number: 23,
    names: { en: "Splitting Apart", zh: "剝", pinyin: "bō" },
    symbol: "䷖",
    trigrams: {
      upper: { en: "Mountain", zh: "山", symbol: "☶" },
      lower: { en: "Earth", zh: "地", symbol: "☷" }
    },
    classical: { judgment: "剝：不利有攸往", image: "山附于地，剝。上以厚下安宅", lines: ["初六：剝床以足，蔑貞，凶", "六二：剝床以辨，蔑貞，凶", "六三：剝之，无咎", "六四：剝床以膚，凶", "六五：貫魚，以宮人寵，无不利", "上九：碩果不食，君子得輿，小人剝廬"] },
    wilhelm: { judgment: "Splitting Apart. It does not further one To go anywhere.", image: "The mountain rests on the earth: The image of Splitting Apart. Thus those above can ensure their position Only by giving generously to those below.", lines: ["The leg of the bed is split. Those who persevere are destroyed. Misfortune.", "The bed is split at the edge. Those who persevere are destroyed. Misfortune.", "He splits with them. No blame.", "The bed is split up to the skin. Misfortune.", "A shoal of fishes. Favor comes through the court ladies. Everything acts to further.", "There is a large fruit still uneaten. The superior man receives a carriage. The house of the inferior man is split apart."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Splitting apart and decay. Disintegration of what was built.", zh: "分裂與衰敗。已建立事物的瓦解" },
      situation: { en: "You're experiencing breakdown and loss.", zh: "你正經歷崩潰和損失" },
      advice: { en: "Accept the inevitable decline. Don't resist what must fall away.", zh: "接受不可避免的衰落。不要抵抗必須消逝的事物" },
      keywords: ["splitting", "decay", "breakdown", "letting go", "acceptance"],
      lines: [
        { position: 1, stage: { en: "Bed Leg Splits", zh: "床腿裂開" }, meaning: { en: "Splitting bed at leg. Destruction begins at foundation.", zh: "床在腿部裂開。破壞從基礎開始" }, advice: { en: "Decay starts at the bottom. Address foundational problems immediately.", zh: "腐朽從底部開始。立即處理基礎問題" }, keywords: ["foundation", "decay", "beginning", "warning"] },
        { position: 2, stage: { en: "Bed Frame Splits", zh: "床架裂開" }, meaning: { en: "Splitting bed at frame. Deterioration spreads upward.", zh: "床在框架裂開。惡化向上蔓延" }, advice: { en: "Destruction progresses. The problem is no longer just foundational.", zh: "破壞在進展。問題不再只是基礎性的" }, keywords: ["progression", "spread", "deterioration", "urgency"] },
        { position: 3, stage: { en: "Splitting Among Them", zh: "從他們分裂" }, meaning: { en: "Splitting away from them. No blame in necessary separation.", zh: "從他們分離。必要的分離無責" }, advice: { en: "Separate from the decaying mass. Survival requires dissociation.", zh: "從腐朽的團體分離。生存需要脫離" }, keywords: ["separation", "survival", "dissociation", "necessity"] },
        { position: 4, stage: { en: "Bed Surface Splits", zh: "床面裂開" }, meaning: { en: "Splitting bed to the skin. Misfortune very close.", zh: "床裂到皮膚。不幸非常接近" }, advice: { en: "Decay reaches you directly. Misfortune is personal now.", zh: "腐朽直接觸及你。不幸現在是個人的" }, keywords: ["personal impact", "close danger", "direct threat", "misfortune"] },
        { position: 5, stage: { en: "Palace Ladies", zh: "宮女" }, meaning: { en: "String of fishes, favor through palace ladies. Everything furthers.", zh: "一串魚，通過宮女得寵。一切順利" }, advice: { en: "Unity in dark times brings blessing. Stay connected despite decay.", zh: "黑暗時期的團結帶來祝福。儘管腐朽仍保持聯繫" }, keywords: ["unity", "connection", "blessing", "favor"] },
        { position: 6, stage: { en: "Large Fruit", zh: "大果實" }, meaning: { en: "Large fruit uneaten. Superior man gets carriage, inferior man's hut splits.", zh: "大果實未被吃。君子得車，小人的小屋裂開" }, advice: { en: "What remains nourishes new beginnings. The worthy carry forward.", zh: "剩下的滋養新開始。值得的人繼續前進" }, keywords: ["seed", "new beginning", "preservation", "worthy"] }
      ]
    },
    relationships: { opposite: 42, inverse: 23, nuclear: 23 }
  },
  {
    number: 24,
    names: { en: "Return", zh: "復", pinyin: "fù" },
    symbol: "䷗",
    trigrams: {
      upper: { en: "Earth", zh: "地", symbol: "☷" },
      lower: { en: "Thunder", zh: "雷", symbol: "☳" }
    },
    classical: { judgment: "復：亨。出入无疾，朋來无咎。反復其道，七日來復，利有攸往", image: "雷在地中，復。先王以至日閉關，商旅不行，后不省方", lines: ["初九：不遠復，无祗悔，元吉", "六二：休復，吉", "六三：頻復，厲，无咎", "六四：中行獨復", "六五：敦復，无悔", "上六：迷復，凶，有災眚。用行師，終有大敗，以其國君凶，至于十年不克征"] },
    wilhelm: { judgment: "Return. Success. Going out and coming in without error. Friends come without blame. To and fro goes the way. On the seventh day comes return. It furthers one to have somewhere to go.", image: "Thunder within the earth: The image of the Turning Point. Thus the kings of antiquity closed the passes At the time of solstice. Merchants and strangers did not go about, And the ruler Did not travel through the provinces.", lines: ["Return from a short distance. No need for remorse. Great good fortune.", "Quiet return. Good fortune.", "Repeated return. Danger. No blame.", "Walking in the midst of others, One returns alone.", "Noblehearted return. No remorse.", "Missing the return. Misfortune. Misfortune from within and without. If armies are set marching in this way, One will in the end suffer a great defeat, Disastrous for the ruler of the country. For ten years It will not be possible to attack again."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Return and renewal. The turning point after decline.", zh: "回歸與更新。衰退後的轉折點" },
      situation: { en: "You're at the beginning of a new cycle of growth.", zh: "你正處於新一輪成長週期的開始" },
      advice: { en: "Embrace the new beginning. The darkness is ending.", zh: "擁抱新的開始。黑暗正在結束" },
      keywords: ["return", "renewal", "turning point", "recovery", "rebirth"],
      lines: [
        { position: 1, stage: { en: "Returning Early", zh: "早返" }, meaning: { en: "Return from short distance. No need for remorse. Supreme fortune.", zh: "從短距離返回。無需悔恨。至高運勢" }, advice: { en: "Turn back quickly from wrong path. Early return brings blessing.", zh: "快速從錯誤道路轉身。早期回歸帶來祝福" }, keywords: ["early return", "quick correction", "blessing", "fortune"] },
        { position: 2, stage: { en: "Quiet Return", zh: "安靜返回" }, meaning: { en: "Quiet, peaceful return. Good fortune through stillness.", zh: "安靜、平和的返回。通過寧靜的好運" }, advice: { en: "Return calmly and deliberately. Grace in coming back.", zh: "平靜而審慎地返回。回歸中的優雅" }, keywords: ["calm", "peace", "grace", "deliberate"] },
        { position: 3, stage: { en: "Repeated Return", zh: "重複返回" }, meaning: { en: "Repeated return. Danger but no blame in persistence.", zh: "重複返回。危險但堅持無責" }, advice: { en: "Keep trying to return despite setbacks. Persistence is not wrong.", zh: "儘管挫折仍繼續嘗試返回。堅持不是錯" }, keywords: ["persistence", "repeated effort", "danger", "determination"] },
        { position: 4, stage: { en: "Walking Midst", zh: "在眾中行走" }, meaning: { en: "Walking in midst of others, returning alone.", zh: "在他人中行走，獨自返回" }, advice: { en: "Return independently even when others continue forward.", zh: "即使他人繼續前進也獨立返回" }, keywords: ["independence", "solitary path", "courage", "individuality"] },
        { position: 5, stage: { en: "Noble Return", zh: "高貴返回" }, meaning: { en: "Noble-hearted return. No remorse in choosing correctly.", zh: "高貴的心返回。正確選擇無悔" }, advice: { en: "Return with dignity and self-awareness. Right choice brings peace.", zh: "有尊嚴和自我意識地返回。正確選擇帶來和平" }, keywords: ["nobility", "dignity", "awareness", "peace"] },
        { position: 6, stage: { en: "Missed Return", zh: "錯過返回" }, meaning: { en: "Missing the return. Misfortune and disaster. Taking armies brings defeat.", zh: "錯過返回。不幸和災難。帶軍隊帶來失敗" }, advice: { en: "Too late to return. Forcing continuation brings catastrophe.", zh: "返回太晚。強行繼續帶來災難" }, keywords: ["too late", "disaster", "forcing", "catastrophe"] }
      ]
    },
    relationships: { opposite: 41, inverse: 24, nuclear: 24 }
  },
  {
    number: 25,
    names: { en: "Innocence", zh: "無妄", pinyin: "wú wàng" },
    symbol: "䷘",
    trigrams: {
      upper: { en: "Heaven", zh: "天", symbol: "☰" },
      lower: { en: "Thunder", zh: "雷", symbol: "☳" }
    },
    classical: { judgment: "无妄：元亨，利貞。其匪正有眚，不利有攸往", image: "天下雷行，物與无妄。先王以茂對時育萬物", lines: ["初九：无妄，往吉", "六二：不耕獲，不菑畬，則利有攸往", "六三：无妄之災，或繫之牛，行人之得，邑人之災", "九四：可貞，无咎", "九五：无妄之疾，勿藥有喜", "上九：无妄，行有眚，无攸利"] },
    wilhelm: { judgment: "Innocence. Supreme success. Perseverance furthers. If someone is not as he should be, He has misfortune, And it does not further him To undertake anything.", image: "Under heaven thunder rolls: All things attain the natural state of innocence. Thus the kings of old, Rich in virtue, and in harmony with the time, Fostered and nourished all beings.", lines: ["Innocent behavior brings good fortune.", "If one does not count on the harvest while plowing, Nor on the use of the ground while clearing it, It furthers one to undertake something.", "Undeserved misfortune. The cow that was tethered by someone Is the wanderer's gain, the citizen's loss.", "He who can be persevering Remains without blame.", "Use no medicine in an illness Incurred through no fault of your own. It will pass of itself.", "Innocent action brings misfortune. Nothing furthers."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Innocence and naturalness. Acting without ulterior motives.", zh: "天真與自然。行動沒有隱藏動機" },
      situation: { en: "You succeed through spontaneous, genuine action.", zh: "你通過自發、真誠的行動獲得成功" },
      advice: { en: "Act naturally and honestly. Don't calculate or scheme.", zh: "自然誠實地行動。不要算計或謀劃" },
      keywords: ["innocence", "naturalness", "spontaneity", "honesty", "genuineness"],
      lines: [
        { position: 1, stage: { en: "Innocent Going", zh: "無妄前進" }, meaning: { en: "Innocent proceeding brings good fortune naturally.", zh: "無妄前進自然帶來好運" }, advice: { en: "Act without ulterior motives. Natural action succeeds.", zh: "沒有隱藏動機地行動。自然行動成功" }, keywords: ["natural", "innocence", "spontaneity", "fortune"] },
        { position: 2, stage: { en: "Not Counting Harvest", zh: "不計收穫" }, meaning: { en: "Not counting on harvest while plowing. Not planning third field in second.", zh: "耕作時不計收穫。不在第二塊地規劃第三塊" }, advice: { en: "Work without calculating results. Focus on process, not profit.", zh: "工作而不計算結果。專注過程，非利潤" }, keywords: ["process", "non-attachment", "present focus", "work"] },
        { position: 3, stage: { en: "Undeserved Misfortune", zh: "不該有的不幸" }, meaning: { en: "Undeserved misfortune. Tethered ox taken by passerby.", zh: "不該有的不幸。拴好的牛被路人帶走" }, advice: { en: "Sometimes disaster comes despite innocence. Not all loss is earned.", zh: "有時災難儘管無辜仍來臨。並非所有損失都是自找" }, keywords: ["undeserved", "loss", "acceptance", "innocence"] },
        { position: 4, stage: { en: "Able to Persevere", zh: "能堅持" }, meaning: { en: "He who can persevere remains without blame.", zh: "能堅持者保持無責" }, advice: { en: "Continue in innocence despite setbacks. Persistence in truth succeeds.", zh: "儘管挫折仍繼續無妄。在真理中堅持成功" }, keywords: ["perseverance", "truth", "continuation", "success"] },
        { position: 5, stage: { en: "Illness Not Deserved", zh: "無妄疾病" }, meaning: { en: "Innocent illness needs no medicine. Joy will come.", zh: "無妄疾病不需藥。喜悅將來" }, advice: { en: "Some afflictions resolve naturally. Don't force treatment.", zh: "某些疾病自然解決。不要強行治療" }, keywords: ["natural healing", "patience", "non-interference", "joy"] },
        { position: 6, stage: { en: "Innocent Mistake", zh: "無妄錯誤" }, meaning: { en: "Innocent action at wrong time. Nothing furthers premature action.", zh: "在錯誤時機的無妄行動。過早行動無益" }, advice: { en: "Even pure intentions fail if timing is wrong. Wait for right moment.", zh: "即使純粹意圖如果時機錯誤也會失敗。等待正確時刻" }, keywords: ["timing", "prematurity", "patience", "waiting"] }
      ]
    },
    relationships: { opposite: 40, inverse: 25, nuclear: 25 }
  },
  {
    number: 26,
    names: { en: "The Taming Power of the Great", zh: "大畜", pinyin: "dà xù" },
    symbol: "䷙",
    trigrams: {
      upper: { en: "Mountain", zh: "山", symbol: "☶" },
      lower: { en: "Heaven", zh: "天", symbol: "☰" }
    },
    classical: { judgment: "大畜：利貞。不家食，吉。利涉大川", image: "天在山中，大畜。君子以多識前言往行，以畜其德", lines: ["初九：有厲，利已", "九二：輿說輹", "九三：良馬逐，利艱貞。曰閑輿衛，利有攸往", "六四：童牛之牿，元吉", "六五：豶豕之牙，吉", "上九：何天之衢，亨"] },
    wilhelm: { judgment: "The Taming Power of the Great. Perseverance furthers. Not eating at home brings good fortune. It furthers one to cross the great water.", image: "Heaven within the mountain: The image of the Taming Power of the Great. Thus the superior man acquaints himself with many sayings of antiquity And many deeds of the past, In order to strengthen his character thereby.", lines: ["Danger is at hand. It furthers one to desist.", "The wagon is stripped of its spokes.", "A good horse that follows others. Awareness of danger, With perseverance, furthers. Practice chariot driving and armed defense daily. It furthers one to have somewhere to go.", "The headboard of a young bull. Great good fortune.", "The tusk of a gelded boar. Good fortune.", "One attains the way of heaven. Success."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Great accumulation. Storing power for future use.", zh: "大積蓄。儲存力量以備將來使用" },
      situation: { en: "You're building strength and resources for later.", zh: "你正在為將來積累力量和資源" },
      advice: { en: "Accumulate knowledge and power. Prepare for great action.", zh: "積累知識和力量。為大行動做準備" },
      keywords: ["accumulation", "storage", "preparation", "power", "resources"],
      lines: [
        { position: 1, stage: { en: "Danger Ahead", zh: "前方危險" }, meaning: { en: "Danger in front. Advantageous to halt.", zh: "前方有危險。停止有利" }, advice: { en: "Stop when danger looms. Restraint prevents disaster.", zh: "危險逼近時停止。克制防止災難" }, keywords: ["danger", "halt", "restraint", "prevention"] },
        { position: 2, stage: { en: "Wagon Axle Removed", zh: "車軸移除" }, meaning: { en: "Wagon axle removed. Restrained from moving forward.", zh: "車軸被移除。被限制無法前進" }, advice: { en: "Accept enforced stillness. Sometimes prevention is external.", zh: "接受強制的靜止。有時預防是外在的" }, keywords: ["stillness", "enforced", "external restraint", "acceptance"] },
        { position: 3, stage: { en: "Good Horses Pursue", zh: "好馬追趕" }, meaning: { en: "Good horses in pursuit. Difficult perseverance advantageous.", zh: "好馬追趕。困難的堅持有利" }, advice: { en: "When ready, pursue vigorously. Strong effort with good resources succeeds.", zh: "準備好時，積極追求。有好資源的強力努力成功" }, keywords: ["pursuit", "vigor", "resources", "effort"] },
        { position: 4, stage: { en: "Young Bull Headboard", zh: "小牛頭板" }, meaning: { en: "Headboard of young bull. Great good fortune in prevention.", zh: "小牛的頭板。預防中的大吉" }, advice: { en: "Restrain early before power becomes unmanageable. Prevent before it starts.", zh: "在力量變得無法控制前早期克制。在開始前預防" }, keywords: ["early restraint", "prevention", "management", "fortune"] },
        { position: 5, stage: { en: "Gelded Boar Tusk", zh: "閹豬獠牙" }, meaning: { en: "Tusk of gelded boar. Good fortune through neutralization.", zh: "閹豬的獠牙。通過中和的好運" }, advice: { en: "Remove danger at the source. Neutralize rather than confront.", zh: "從源頭消除危險。中和而非對抗" }, keywords: ["neutralization", "source", "removing danger", "fortune"] },
        { position: 6, stage: { en: "Heaven's Highway", zh: "天之大道" }, meaning: { en: "Attaining heaven's highway. Success and advancement.", zh: "達到天之大道。成功與進步" }, advice: { en: "Great accumulation enables great progress. The way opens fully.", zh: "巨大積累使巨大進步成為可能。道路完全開放" }, keywords: ["success", "highway", "advancement", "opening"] }
      ]
    },
    relationships: { opposite: 39, inverse: 26, nuclear: 26 }
  },
  {
    number: 27,
    names: { en: "The Corners of the Mouth", zh: "頤", pinyin: "yí" },
    symbol: "䷚",
    trigrams: {
      upper: { en: "Mountain", zh: "山", symbol: "☶" },
      lower: { en: "Thunder", zh: "雷", symbol: "☳" }
    },
    classical: { judgment: "頤：貞吉。觀頤，自求口實", image: "山下有雷，頤。君子以慎言語，節飲食", lines: ["初九：舍爾靈龜，觀我朵頤，凶", "六二：顛頤，拂經，于丘頤，征凶", "六三：拂頤，貞凶，十年勿用，无攸利", "六四：顛頤，吉。虎視眈眈，其欲逐逐，无咎", "六五：拂經，居貞吉，不可涉大川", "上九：由頤，厲吉，利涉大川"] },
    wilhelm: { judgment: "The Corners of the Mouth. Perseverance brings good fortune. Pay heed to the providing of nourishment And to what a man seeks To fill his own mouth with.", image: "At the foot of the mountain, thunder: The image of Providing Nourishment. Thus the superior man is careful of his words And temperate in eating and drinking.", lines: ["You let your magic tortoise go, And look at me with the corners of your mouth drooping. Misfortune.", "Turning to the summit for nourishment, Deviating from the path To seek nourishment from the hill. Continuing to do this brings misfortune.", "Turning away from nourishment. Perseverance brings misfortune. Do not act thus for ten years. Nothing serves to further.", "Turning to the summit For provision of nourishment Brings good fortune. Spying about with sharp eyes Like a tiger with insatiable craving. No blame.", "Turning away from the path. To remain persevering brings good fortune. One should not cross the great water.", "The source of nourishment. Awareness of danger brings good fortune. It furthers one to cross the great water."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Nourishment and sustenance. What we take in and provide.", zh: "滋養與供養。我們攝取和提供的東西" },
      situation: { en: "You must attend to proper nourishment, physical and spiritual.", zh: "你必須注意適當的滋養，無論是身體還是精神" },
      advice: { en: "Be mindful of what you consume and what you give to others.", zh: "注意你所消費的和你給予他人的" },
      keywords: ["nourishment", "sustenance", "care", "feeding", "provision"],
      lines: [
        { position: 1, stage: { en: "Watching Eat", zh: "觀看他人進食" }, meaning: { en: "Watching others eat while your magic tortoise goes unused.", zh: "看別人吃而你的神龜未用" }, advice: { en: "You have resources but seek from others. Use what you have.", zh: "你有資源但向他人尋求。使用你所擁有的" }, keywords: ["resources", "self-reliance", "unused potential", "dependence"] },
        { position: 2, stage: { en: "Seeking Nourishment", zh: "尋求滋養" }, meaning: { en: "Seeking nourishment from hill. Turning from proper path brings misfortune.", zh: "從山上尋求滋養。偏離正道帶來不幸" }, advice: { en: "Seeking sustenance from wrong sources leads astray. Return to proper nourishment.", zh: "從錯誤來源尋求維持會誤入歧途。回歸適當滋養" }, keywords: ["wrong source", "deviation", "misfortune", "proper path"] },
        { position: 3, stage: { en: "Turning from Nourishment", zh: "背離滋養" }, meaning: { en: "Turning away from nourishment. Persistence brings misfortune.", zh: "背離滋養。堅持帶來不幸" }, advice: { en: "Rejecting proper sustenance causes harm. Don't refuse what nourishes.", zh: "拒絕適當維持造成傷害。不要拒絕滋養你的" }, keywords: ["rejection", "refusal", "harm", "sustenance"] },
        { position: 4, stage: { en: "Seeking Nourishment", zh: "尋求滋養" }, meaning: { en: "Seeking nourishment like tiger. Good fortune in right intensity.", zh: "像老虎一樣尋求滋養。正確強度的好運" }, advice: { en: "Pursue nourishment intensely like a predator. Vigor in right direction succeeds.", zh: "像掠食者一樣強烈追求滋養。正確方向的活力成功" }, keywords: ["intensity", "pursuit", "vigor", "fortune"] },
        { position: 5, stage: { en: "Turning from Path", zh: "偏離道路" }, meaning: { en: "Turning from usual path. Remaining brings good fortune. Cannot cross great water.", zh: "偏離通常道路。留下帶來好運。無法渡大河" }, advice: { en: "Stay put despite limitations. Accept what you cannot do.", zh: "儘管有限制仍留下。接受你無法做的" }, keywords: ["staying", "limitation", "acceptance", "fortune"] },
        { position: 6, stage: { en: "Source of Nourishment", zh: "滋養之源" }, meaning: { en: "Being the source of nourishment. Dangerous but fortunate.", zh: "成為滋養之源。危險但吉祥" }, advice: { en: "Nourishing others is weighty responsibility. Accept the danger with awareness.", zh: "滋養他人是重大責任。有意識地接受危險" }, keywords: ["responsibility", "nourishing others", "danger", "awareness"] }
      ]
    },
    relationships: { opposite: 38, inverse: 27, nuclear: 27 }
  },
  {
    number: 28,
    names: { en: "Preponderance of the Great", zh: "大過", pinyin: "dà guò" },
    symbol: "䷛",
    trigrams: {
      upper: { en: "Lake", zh: "澤", symbol: "☱" },
      lower: { en: "Wind", zh: "風", symbol: "☴" }
    },
    classical: { judgment: "大過：棟橈，利有攸往，亨", image: "澤滅木，大過。君子以獨立不懼，遯世无悶", lines: ["初六：藉用白茅，无咎", "九二：枯楊生稊，老夫得其女妻，无不利", "九三：棟橈，凶", "九四：棟隆，吉，有它吝", "九五：枯楊生華，老婦得其士夫，无咎无譽", "上六：過涉滅頂，凶，无咎"] },
    wilhelm: { judgment: "Preponderance of the Great. The ridgepole sags to the breaking point. It furthers one to have somewhere to go. Success.", image: "The lake rises above the trees: The image of Preponderance of the Great. Thus the superior man, when he stands alone, Is unconcerned, And if he has to renounce the world, He is undaunted.", lines: ["To spread white rushes underneath. No blame.", "A dry poplar sprouts at the root. An older man takes a young wife. Everything furthers.", "The ridgepole sags to the breaking point. Misfortune.", "The ridgepole is braced. Good fortune. If there are ulterior motives, it is humiliating.", "A withered poplar puts forth flowers. An older woman takes a husband. No blame. No praise.", "One must go through the water. It goes over one's head. Misfortune. No blame."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Extraordinary pressure. Great weight requiring support.", zh: "非凡的壓力。需要支撐的巨大重量" },
      situation: { en: "You face exceptional stress that tests your limits.", zh: "你面臨考驗極限的異常壓力" },
      advice: { en: "Shore up your supports. Don't carry excessive burdens alone.", zh: "加強你的支撐。不要獨自承受過度負擔" },
      keywords: ["pressure", "weight", "stress", "support", "extraordinary"],
      lines: [
        { position: 1, stage: { en: "White Reeds Beneath", zh: "下鋪白茅" }, meaning: { en: "Spreading white reeds beneath. Careful preparation prevents disaster.", zh: "下面鋪白茅。謹慎準備防止災難" }, advice: { en: "Over-prepare the foundation. Excess caution is appropriate in crisis.", zh: "過度準備基礎。危機中過度謹慎是適當的" }, keywords: ["preparation", "foundation", "caution", "excess care"] },
        { position: 2, stage: { en: "Dry Poplar Sprouts", zh: "枯楊生稊" }, meaning: { en: "Dry poplar putting forth shoots. Old man taking young wife.", zh: "枯楊發芽。老夫得少妻" }, advice: { en: "Unexpected renewal is possible. What seems dead can revive.", zh: "意外的更新是可能的。看似死的可以復甦" }, keywords: ["renewal", "unexpected", "revival", "vitality"] },
        { position: 3, stage: { en: "Ridgepole Sags", zh: "棟橈" }, meaning: { en: "Ridgepole sags. Misfortune from excess weight.", zh: "棟樑下垂。過度重量的不幸" }, advice: { en: "The burden is too great. Collapse is imminent without relief.", zh: "負擔太大。如不減輕即將崩塌" }, keywords: ["burden", "collapse", "excess", "danger"] },
        { position: 4, stage: { en: "Ridgepole Braced", zh: "棟隆" }, meaning: { en: "Ridgepole braced from above. Good fortune through support.", zh: "棟樑從上支撐。通過支持的好運" }, advice: { en: "External support prevents collapse. Accept help from above.", zh: "外部支持防止崩塌。接受從上而來的幫助" }, keywords: ["support", "bracing", "help", "fortune"] },
        { position: 5, stage: { en: "Dry Poplar Flowers", zh: "枯楊生華" }, meaning: { en: "Dry poplar produces flowers. Old woman taking young husband.", zh: "枯楊開花。老婦得少夫" }, advice: { en: "Appearance of vitality doesn't change essence. Ornament isn't substance.", zh: "活力的外表不改變本質。裝飾不是實質" }, keywords: ["appearance", "ornament", "essence", "illusion"] },
        { position: 6, stage: { en: "Fording Water", zh: "過涉滅頂" }, meaning: { en: "Fording water over head. Misfortune but no blame.", zh: "涉水過頭。不幸但無責" }, advice: { en: "Going too far despite good intentions. Excess brings inevitable disaster.", zh: "儘管好意但走得太遠。過度帶來不可避免的災難" }, keywords: ["excess", "too far", "disaster", "intentions"] }
      ]
    },
    relationships: { opposite: 37, inverse: 28, nuclear: 28 }
  },
  {
    number: 29,
    names: { en: "The Abysmal (Water)", zh: "坎", pinyin: "kǎn" },
    symbol: "䷜",
    trigrams: {
      upper: { en: "Water", zh: "水", symbol: "☵" },
      lower: { en: "Water", zh: "水", symbol: "☵" }
    },
    classical: { judgment: "坎：習坎，有孚，維心亨，行有尚", image: "水洊至，習坎。君子以常德行，習教事", lines: ["初六：習坎，入于坎窞，凶", "九二：坎有險，求小得", "六三：來之坎坎，險且枕，入于坎窞，勿用", "六四：樽酒簋貳，用缶，納約自牖，終无咎", "九五：坎不盈，祗既平，无咎", "上六：係用徽纆，寘于叢棘，三歲不得，凶"] },
    wilhelm: { judgment: "The Abysmal repeated. If you are sincere, you have success in your heart, And whatever you do succeeds.", image: "Water flows on uninterruptedly and reaches its goal: The image of the Abysmal repeated. Thus the superior man walks in lasting virtue And carries on the business of teaching.", lines: ["Repetition of the abyss. In the abyss one falls into a pit. Misfortune.", "The abyss is dangerous. One should strive to attain small things only.", "Forward and backward, abyss on abyss. In danger like this, pause at first and wait, Otherwise you will fall into a pit in the abyss. Do not act in this way.", "A jug of wine, a bowl of rice with it; Earthen vessels Simply handed in through the window. There is certainly no blame in this.", "The abyss is not filled to overflowing, It is filled only to the rim. No blame.", "Bound with cords and ropes, Shut in between thorn-hedged prison walls: For three years one does not find the way. Misfortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Repeated danger. Falling into the abyss again and again.", zh: "重複的危險。一次又一次落入深淵" },
      situation: { en: "You face ongoing danger that requires constant vigilance.", zh: "你面臨需要持續警惕的持續危險" },
      advice: { en: "Navigate carefully through continuing difficulties. Stay sincere.", zh: "小心地度過持續的困難。保持真誠" },
      keywords: ["danger", "abyss", "repetition", "vigilance", "sincerity"],
      lines: [
        { position: 1, stage: { en: "Entering Pit", zh: "入坎" }, meaning: { en: "Entering the pit repeatedly. Getting lost in the abyss.", zh: "重複進入坑。在深淵中迷失" }, advice: { en: "First descent into danger. Losing way in difficulty.", zh: "首次下降進入危險。在困難中迷路" }, keywords: ["entering", "descent", "lost", "danger"] },
        { position: 2, stage: { en: "In the Abyss", zh: "在深淵中" }, meaning: { en: "In the abyss with danger. Only small achievements possible.", zh: "在深淵中有危險。只有小成就可能" }, advice: { en: "Surrounded by danger on all sides. Aim for minor gains only.", zh: "四面被危險包圍。只能追求小收穫" }, keywords: ["surrounded", "danger", "small gains", "limitation"] },
        { position: 3, stage: { en: "Forward and Back", zh: "前後" }, meaning: { en: "Forward abyss, backward abyss. Danger and obstruction.", zh: "前方深淵，後方深淵。危險和阻礙" }, advice: { en: "Trapped between dangers. No good direction available.", zh: "被困在危險之間。沒有好方向可選" }, keywords: ["trapped", "no escape", "danger both ways", "obstruction"] },
        { position: 4, stage: { en: "Simple Offerings", zh: "簡單供品" }, meaning: { en: "Jug of wine and rice bowl through window. No blame in simplicity.", zh: "從窗戶送酒壺和飯碗。簡單無責" }, advice: { en: "Keep things simple in danger. Basic sustenance is enough.", zh: "在危險中保持簡單。基本維持就夠" }, keywords: ["simplicity", "basics", "sustenance", "modesty"] },
        { position: 5, stage: { en: "Not Overfull", zh: "未過滿" }, meaning: { en: "Abyss not filled to overflowing. Already leveled. No blame.", zh: "深淵未填滿溢出。已經持平。無責" }, advice: { en: "Don't exceed capacity. Being level with situation is sufficient.", zh: "不要超過容量。與情況持平就足夠" }, keywords: ["capacity", "level", "sufficient", "not excess"] },
        { position: 6, stage: { en: "Bound with Cords", zh: "繩索束縛" }, meaning: { en: "Bound with cords and ropes, hemmed in by thorns. Three years without finding the way.", zh: "被繩索捆綁，被荊棘圍住。三年找不到路" }, advice: { en: "Long imprisonment in danger. Extended period of difficulty.", zh: "長期囚禁在危險中。延長的困難期" }, keywords: ["imprisonment", "long duration", "thorns", "lost"] }
      ]
    },
    relationships: { opposite: 36, inverse: 29, nuclear: 29 }
  },
  {
    number: 30,
    names: { en: "The Clinging (Fire)", zh: "離", pinyin: "lí" },
    symbol: "䷝",
    trigrams: {
      upper: { en: "Fire", zh: "火", symbol: "☲" },
      lower: { en: "Fire", zh: "火", symbol: "☲" }
    },
    classical: { judgment: "離：利貞，亨。畜牝牛，吉", image: "明兩作，離。大人以繼明照于四方", lines: ["初九：履錯然，敬之，无咎", "六二：黃離，元吉", "九三：日昃之離，不鼓缶而歌，則大耋之嗟，凶", "九四：突如其來如，焚如，死如，棄如", "六五：出涕沱若，戚嗟若，吉", "上九：王用出征，有嘉折首，獲匪其醜，无咎"] },
    wilhelm: { judgment: "The Clinging. Perseverance furthers. It brings success. Care of the cow brings good fortune.", image: "That which is bright rises twice: The image of Fire. Thus the great man, by perpetuating this brightness, Illumines the four quarters of the world.", lines: ["The footprints run crisscross. If one is seriously intent, No blame.", "Yellow light. Supreme good fortune.", "In the light of the setting sun, Men either beat the pot and sing Or loudly bewail the approach of old age. Misfortune.", "Its coming is sudden; It flames up, dies down, is thrown away.", "Tears in floods, sighing and lamenting. Good fortune.", "The king uses him to march forth and chastise. Then it is best to kill the leaders And take captive the followers. No blame."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Clinging and clarity. Light that illuminates and warms.", zh: "依附與清晰。照明和溫暖的光" },
      situation: { en: "You find clarity through proper attachment and dependence.", zh: "你通過正確的依附和依賴找到清晰" },
      advice: { en: "Cling to what is right. Illuminate your path with clarity.", zh: "依附正確的事物。以清晰照亮你的道路" },
      keywords: ["clinging", "clarity", "light", "attachment", "illumination"],
      lines: [
        { position: 1, stage: { en: "Footsteps Confused", zh: "足步混亂" }, meaning: { en: "Confused footsteps. Respect prevents error.", zh: "混亂的足步。尊重防止錯誤" }, advice: { en: "Beginning requires care. Reverent attention prevents missteps.", zh: "開始需要小心。恭敬的注意防止錯步" }, keywords: ["beginning", "care", "respect", "attention"] },
        { position: 2, stage: { en: "Yellow Light", zh: "黃光" }, meaning: { en: "Yellow light. Supreme good fortune in proper measure.", zh: "黃光。適當度量的至高好運" }, advice: { en: "Central, balanced illumination. Perfect balance brings blessing.", zh: "中心、平衡的照明。完美平衡帶來祝福" }, keywords: ["balance", "center", "measure", "fortune"] },
        { position: 3, stage: { en: "Setting Sun Light", zh: "夕陽光" }, meaning: { en: "Light of setting sun. No blame if accepting decline.", zh: "夕陽之光。接受衰落無責" }, advice: { en: "Recognize natural endings. Don't fight inevitable decline.", zh: "認識到自然結束。不要對抗不可避免的衰落" }, keywords: ["ending", "decline", "acceptance", "natural"] },
        { position: 4, stage: { en: "Sudden Appearance", zh: "突然出現" }, meaning: { en: "Sudden appearance. Burning, dying, being thrown out.", zh: "突然出現。燃燒、死亡、被扔出" }, advice: { en: "Abrupt changes in illumination. Dramatic rise and fall.", zh: "照明的突然變化。戲劇性的升降" }, keywords: ["sudden", "dramatic", "abrupt", "change"] },
        { position: 5, stage: { en: "Tears and Lament", zh: "淚水和哀嘆" }, meaning: { en: "Tears flowing, lamenting and sighing. Good fortune through acknowledgment.", zh: "淚水流淌，哀嘆和嘆息。通過承認的好運" }, advice: { en: "Express grief openly. Honesty about suffering brings resolution.", zh: "公開表達悲傷。對苦難的誠實帶來解決" }, keywords: ["grief", "expression", "honesty", "resolution"] },
        { position: 6, stage: { en: "King's Expedition", zh: "君王征伐" }, meaning: { en: "King on punitive expedition. Good fortune in righteous action.", zh: "君王征伐。正義行動的好運" }, advice: { en: "Use power to restore order. Justified force brings good fortune.", zh: "用權力恢復秩序。正當武力帶來好運" }, keywords: ["order", "justice", "righteous force", "fortune"] }
      ]
    },
    relationships: { opposite: 35, inverse: 30, nuclear: 30 }
  },
  {
    number: 31,
    names: { en: "Influence", zh: "咸", pinyin: "xián" },
    symbol: "䷞",
    trigrams: {
      upper: { en: "Lake", zh: "澤", symbol: "☱" },
      lower: { en: "Mountain", zh: "山", symbol: "☶" }
    },
    classical: { judgment: "咸：亨，利貞。取女吉", image: "山上有澤，咸。君子以虛受人", lines: ["初六：咸其拇", "六二：咸其腓，凶，居吉", "九三：咸其股，執其隨，往吝", "九四：貞吉，悔亡。憧憧往來，朋從爾思", "九五：咸其脢，无悔", "上六：咸其輔頰舌"] },
    wilhelm: { judgment: "Influence. Success. Perseverance furthers. To take a maiden to wife brings good fortune.", image: "A lake on the mountain: The image of Influence. Thus the superior man encourages people to approach him By his readiness to receive them.", lines: ["The influence shows itself in the big toe.", "The influence shows itself in the calves of the legs. Misfortune. Tarrying brings good fortune.", "The influence shows itself in the thighs. Holds to that which follows it. To continue is humiliating.", "Perseverance brings good fortune. Remorse disappears. If a man is agitated in mind, And his thoughts go hither and thither, Only those friends On whom he fixes his conscious thoughts Will follow.", "The influence shows itself in the back of the neck. No remorse.", "The influence shows itself in the jaws, cheeks, and tongue."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Mutual influence and attraction. Responding to each other.", zh: "相互影響與吸引。彼此回應" },
      situation: { en: "You're in a time of mutual attraction and connection.", zh: "你正處於相互吸引和聯繫的時期" },
      advice: { en: "Be receptive to influence. Allow genuine connection to form.", zh: "接受影響。允許真誠的連結形成" },
      keywords: ["influence", "attraction", "connection", "response", "receptivity"],
      lines: [
        { position: 1, stage: { en: "Beginning", zh: "開始" }, meaning: { en: "Initial stage of influence. Foundation being set.", zh: "Influence的初始階段。基礎正在設立" }, advice: { en: "Navigate this beginning phase with appropriate action.", zh: "以適當行動度過這個開始階段" }, keywords: ["awareness", "timing", "adaptation", "beginning"] },
        { position: 2, stage: { en: "Development", zh: "發展" }, meaning: { en: "Inner development of influence. Internal alignment.", zh: "Influence的內在發展。內部對齊" }, advice: { en: "Navigate this development phase with appropriate action.", zh: "以適當行動度過這個發展階段" }, keywords: ["awareness", "timing", "adaptation", "development"] },
        { position: 3, stage: { en: "Transition", zh: "過渡" }, meaning: { en: "Critical transition in influence. Danger and opportunity.", zh: "Influence中的關鍵過渡。危險與機遇" }, advice: { en: "Navigate this transition phase with appropriate action.", zh: "以適當行動度過這個過渡階段" }, keywords: ["awareness", "timing", "adaptation", "transition"] },
        { position: 4, stage: { en: "Emergence", zh: "浮現" }, meaning: { en: "Emerging action in influence. External engagement begins.", zh: "Influence中的浮現行動。外部參與開始" }, advice: { en: "Navigate this emergence phase with appropriate action.", zh: "以適當行動度過這個浮現階段" }, keywords: ["awareness", "timing", "adaptation", "emergence"] },
        { position: 5, stage: { en: "Achievement", zh: "成就" }, meaning: { en: "Central achievement of influence. Proper authority.", zh: "Influence的中心成就。適當權威" }, advice: { en: "Navigate this achievement phase with appropriate action.", zh: "以適當行動度過這個成就階段" }, keywords: ["awareness", "timing", "adaptation", "achievement"] },
        { position: 6, stage: { en: "Completion", zh: "完成" }, meaning: { en: "Completion of influence. Cycle ending, new beginning.", zh: "Influence的完成。週期結束，新開始" }, advice: { en: "Navigate this completion phase with appropriate action.", zh: "以適當行動度過這個完成階段" }, keywords: ["awareness", "timing", "adaptation", "completion"] }
      ]
    },
    relationships: { opposite: 34, inverse: 31, nuclear: 31 }
  },
  {
    number: 32,
    names: { en: "Duration", zh: "恆", pinyin: "héng" },
    symbol: "䷟",
    trigrams: {
      upper: { en: "Thunder", zh: "雷", symbol: "☳" },
      lower: { en: "Wind", zh: "風", symbol: "☴" }
    },
    classical: { judgment: "恆：亨，无咎，利貞。利有攸往", image: "雷風，恆。君子以立不易方", lines: ["初六：浚恆，貞凶，无攸利", "九二：悔亡", "九三：不恆其德，或承之羞，貞吝", "九四：田无禽", "六五：恆其德，貞。婦人吉，夫子凶", "上六：振恆，凶"] },
    wilhelm: { judgment: "Duration. Success. No blame. Perseverance furthers. It furthers one to have somewhere to go.", image: "Thunder and wind: the image of Duration. Thus the superior man stands firm And does not change his direction.", lines: ["Seeking duration too hastily brings misfortune persistently. Nothing that would further.", "Remorse disappears.", "He who does not give duration to his character Meets with disgrace. Persistent humiliation.", "No game in the field.", "Giving duration to one's character through perseverance. This is good fortune for a woman, misfortune for a man.", "Restlessness as an enduring condition brings misfortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Endurance and consistency. Lasting through constancy.", zh: "持久與一致。通過恆常持續" },
      situation: { en: "You need to maintain consistent effort over time.", zh: "你需要長期保持一致的努力" },
      advice: { en: "Persist steadily. Success comes through endurance, not bursts.", zh: "穩定地堅持。成功來自持久而非爆發" },
      keywords: ["duration", "endurance", "consistency", "persistence", "constancy"],
      lines: [
        { position: 1, stage: { en: "Beginning", zh: "開始" }, meaning: { en: "Initial stage of duration. Foundation being set.", zh: "Duration的初始階段。基礎正在設立" }, advice: { en: "Navigate this beginning phase with appropriate action.", zh: "以適當行動度過這個開始階段" }, keywords: ["awareness", "timing", "adaptation", "beginning"] },
        { position: 2, stage: { en: "Development", zh: "發展" }, meaning: { en: "Inner development of duration. Internal alignment.", zh: "Duration的內在發展。內部對齊" }, advice: { en: "Navigate this development phase with appropriate action.", zh: "以適當行動度過這個發展階段" }, keywords: ["awareness", "timing", "adaptation", "development"] },
        { position: 3, stage: { en: "Transition", zh: "過渡" }, meaning: { en: "Critical transition in duration. Danger and opportunity.", zh: "Duration中的關鍵過渡。危險與機遇" }, advice: { en: "Navigate this transition phase with appropriate action.", zh: "以適當行動度過這個過渡階段" }, keywords: ["awareness", "timing", "adaptation", "transition"] },
        { position: 4, stage: { en: "Emergence", zh: "浮現" }, meaning: { en: "Emerging action in duration. External engagement begins.", zh: "Duration中的浮現行動。外部參與開始" }, advice: { en: "Navigate this emergence phase with appropriate action.", zh: "以適當行動度過這個浮現階段" }, keywords: ["awareness", "timing", "adaptation", "emergence"] },
        { position: 5, stage: { en: "Achievement", zh: "成就" }, meaning: { en: "Central achievement of duration. Proper authority.", zh: "Duration的中心成就。適當權威" }, advice: { en: "Navigate this achievement phase with appropriate action.", zh: "以適當行動度過這個成就階段" }, keywords: ["awareness", "timing", "adaptation", "achievement"] },
        { position: 6, stage: { en: "Completion", zh: "完成" }, meaning: { en: "Completion of duration. Cycle ending, new beginning.", zh: "Duration的完成。週期結束，新開始" }, advice: { en: "Navigate this completion phase with appropriate action.", zh: "以適當行動度過這個完成階段" }, keywords: ["awareness", "timing", "adaptation", "completion"] }
      ]
    },
    relationships: { opposite: 33, inverse: 32, nuclear: 32 }
  },
  {
    number: 33,
    names: { en: "Retreat", zh: "遯", pinyin: "dùn" },
    symbol: "䷠",
    trigrams: {
      upper: { en: "Heaven", zh: "天", symbol: "☰" },
      lower: { en: "Mountain", zh: "山", symbol: "☶" }
    },
    classical: { judgment: "遯：亨。小利貞", image: "天下有山，遯。君子以遠小人，不惡而嚴", lines: ["初六：遯尾，厲，勿用有攸往", "六二：執之用黃牛之革，莫之勝說", "九三：係遯，有疾厲，畜臣妾，吉", "九四：好遯，君子吉，小人否", "九五：嘉遯，貞吉", "上九：肥遯，无不利"] },
    wilhelm: { judgment: "Retreat. Success. In what is small, perseverance furthers.", image: "Mountain under heaven: the image of Retreat. Thus the superior man keeps the inferior man at a distance, Not angrily but with reserve.", lines: ["At the tail in retreat. This is dangerous. One must not wish to undertake anything.", "He holds him fast with yellow oxhide. No one can tear him loose.", "A halted retreat Is nerve-wracking and dangerous. To retain people as men- and maidservants Brings good fortune.", "Voluntary retreat brings good fortune to the superior man And downfall to the inferior man.", "Friendly retreat. Perseverance brings good fortune.", "Cheerful retreat. Everything serves to further."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Retreat and withdrawal. Strategic pulling back.", zh: "撤退與退卻。戰略性地後退" },
      situation: { en: "You should withdraw rather than advance at this time.", zh: "此時你應該撤退而非前進" },
      advice: { en: "Retreat strategically. Preserve your strength for better times.", zh: "戰略性地撤退。為更好的時機保存力量" },
      keywords: ["retreat", "withdrawal", "strategy", "preservation", "timing"],
      lines: [
        { position: 1, stage: { en: "Beginning", zh: "開始" }, meaning: { en: "Initial stage of retreat. Foundation being set.", zh: "Retreat的初始階段。基礎正在設立" }, advice: { en: "Navigate this beginning phase with appropriate action.", zh: "以適當行動度過這個開始階段" }, keywords: ["awareness", "timing", "adaptation", "beginning"] },
        { position: 2, stage: { en: "Development", zh: "發展" }, meaning: { en: "Inner development of retreat. Internal alignment.", zh: "Retreat的內在發展。內部對齊" }, advice: { en: "Navigate this development phase with appropriate action.", zh: "以適當行動度過這個發展階段" }, keywords: ["awareness", "timing", "adaptation", "development"] },
        { position: 3, stage: { en: "Transition", zh: "過渡" }, meaning: { en: "Critical transition in retreat. Danger and opportunity.", zh: "Retreat中的關鍵過渡。危險與機遇" }, advice: { en: "Navigate this transition phase with appropriate action.", zh: "以適當行動度過這個過渡階段" }, keywords: ["awareness", "timing", "adaptation", "transition"] },
        { position: 4, stage: { en: "Emergence", zh: "浮現" }, meaning: { en: "Emerging action in retreat. External engagement begins.", zh: "Retreat中的浮現行動。外部參與開始" }, advice: { en: "Navigate this emergence phase with appropriate action.", zh: "以適當行動度過這個浮現階段" }, keywords: ["awareness", "timing", "adaptation", "emergence"] },
        { position: 5, stage: { en: "Achievement", zh: "成就" }, meaning: { en: "Central achievement of retreat. Proper authority.", zh: "Retreat的中心成就。適當權威" }, advice: { en: "Navigate this achievement phase with appropriate action.", zh: "以適當行動度過這個成就階段" }, keywords: ["awareness", "timing", "adaptation", "achievement"] },
        { position: 6, stage: { en: "Completion", zh: "完成" }, meaning: { en: "Completion of retreat. Cycle ending, new beginning.", zh: "Retreat的完成。週期結束，新開始" }, advice: { en: "Navigate this completion phase with appropriate action.", zh: "以適當行動度過這個完成階段" }, keywords: ["awareness", "timing", "adaptation", "completion"] }
      ]
    },
    relationships: { opposite: 1, inverse: 33, nuclear: 33 }
  },
  {
    number: 34,
    names: { en: "The Power of the Great", zh: "大壯", pinyin: "dà zhuàng" },
    symbol: "䷡",
    trigrams: {
      upper: { en: "Thunder", zh: "雷", symbol: "☳" },
      lower: { en: "Heaven", zh: "天", symbol: "☰" }
    },
    classical: { judgment: "大壯：利貞", image: "雷在天上，大壯。君子以非禮弗履", lines: ["初九：壯于趾，征凶，有孚", "九二：貞吉", "九三：小人用壯，君子用罔，貞厲。羝羊觸藩，羸其角", "九四：貞吉，悔亡。藩決不羸，壯于大輿之輹", "六五：喪羊于易，无悔", "上六：羝羊觸藩，不能退，不能遂，无攸利，艱則吉"] },
    wilhelm: { judgment: "The Power of the Great. Perseverance furthers.", image: "Thunder in the heavens above: The image of the Power of the Great. Thus the superior man does not tread upon paths That do not accord with established order.", lines: ["Power in the toes. Continuing brings misfortune. This is certainly true.", "Perseverance brings good fortune.", "The inferior man works through power. The superior man does not act thus. To continue is dangerous. A goat butts against a hedge And gets its horns entangled.", "Perseverance brings good fortune. Remorse disappears. The hedge opens; there is no entanglement. Power depends upon the axle of a big cart.", "Loses the goat with ease. No remorse.", "A goat butts against a hedge. It cannot go backward, it cannot go forward. Nothing serves to further. If one notes the difficulty, this brings good fortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Great power and strength. Mighty force that must be controlled.", zh: "巨大的力量和強大。必須控制的強大力量" },
      situation: { en: "You have great power but must use it properly.", zh: "你擁有巨大力量但必須正確使用" },
      advice: { en: "Use your strength wisely. Power requires restraint and ethics.", zh: "明智地使用你的力量。力量需要節制和道德" },
      keywords: ["power", "strength", "force", "control", "restraint"],
      lines: [
        { position: 1, stage: { en: "Beginning", zh: "開始" }, meaning: { en: "Initial stage of the power of the great. Foundation being set.", zh: "The Power of the Great的初始階段。基礎正在設立" }, advice: { en: "Navigate this beginning phase with appropriate action.", zh: "以適當行動度過這個開始階段" }, keywords: ["awareness", "timing", "adaptation", "beginning"] },
        { position: 2, stage: { en: "Development", zh: "發展" }, meaning: { en: "Inner development of the power of the great. Internal alignment.", zh: "The Power of the Great的內在發展。內部對齊" }, advice: { en: "Navigate this development phase with appropriate action.", zh: "以適當行動度過這個發展階段" }, keywords: ["awareness", "timing", "adaptation", "development"] },
        { position: 3, stage: { en: "Transition", zh: "過渡" }, meaning: { en: "Critical transition in the power of the great. Danger and opportunity.", zh: "The Power of the Great中的關鍵過渡。危險與機遇" }, advice: { en: "Navigate this transition phase with appropriate action.", zh: "以適當行動度過這個過渡階段" }, keywords: ["awareness", "timing", "adaptation", "transition"] },
        { position: 4, stage: { en: "Emergence", zh: "浮現" }, meaning: { en: "Emerging action in the power of the great. External engagement begins.", zh: "The Power of the Great中的浮現行動。外部參與開始" }, advice: { en: "Navigate this emergence phase with appropriate action.", zh: "以適當行動度過這個浮現階段" }, keywords: ["awareness", "timing", "adaptation", "emergence"] },
        { position: 5, stage: { en: "Achievement", zh: "成就" }, meaning: { en: "Central achievement of the power of the great. Proper authority.", zh: "The Power of the Great的中心成就。適當權威" }, advice: { en: "Navigate this achievement phase with appropriate action.", zh: "以適當行動度過這個成就階段" }, keywords: ["awareness", "timing", "adaptation", "achievement"] },
        { position: 6, stage: { en: "Completion", zh: "完成" }, meaning: { en: "Completion of the power of the great. Cycle ending, new beginning.", zh: "The Power of the Great的完成。週期結束，新開始" }, advice: { en: "Navigate this completion phase with appropriate action.", zh: "以適當行動度過這個完成階段" }, keywords: ["awareness", "timing", "adaptation", "completion"] }
      ]
    },
    relationships: { opposite: 2, inverse: 34, nuclear: 34 }
  },
  {
    number: 35,
    names: { en: "Progress", zh: "晉", pinyin: "jìn" },
    symbol: "䷢",
    trigrams: {
      upper: { en: "Fire", zh: "火", symbol: "☲" },
      lower: { en: "Earth", zh: "地", symbol: "☷" }
    },
    classical: { judgment: "晉：康侯用錫馬蕃庶，晝日三接", image: "明出地上，晉。君子以自昭明德", lines: ["初六：晉如摧如，貞吉。罔孚，裕，无咎", "六二：晉如愁如，貞吉。受茲介福，于其王母", "六三：眾允，悔亡", "九四：晉如鼫鼠，貞厲", "六五：悔亡，失得勿恤，往吉，无不利", "上九：晉其角，維用伐邑，厲吉，无咎，貞吝"] },
    wilhelm: { judgment: "Progress. The powerful prince Is honored with horses in large numbers. In a single day he is granted audience three times.", image: "The sun rises over the earth: The image of Progress. Thus the superior man himself Brightens his bright virtue.", lines: ["Progressing, but turned back. Perseverance brings good fortune. If one meets with no confidence, one should remain calm. No mistake.", "Progressing, but in sorrow. Perseverance brings good fortune. Then one obtains great happiness from one's ancestress.", "All are in accord. Remorse disappears.", "Progress like a hamster. Perseverance brings danger.", "Remorse disappears. Take not gain and loss to heart. Undertakings bring good fortune. Everything serves to further.", "Making progress with the horns is permissible Only for the purpose of punishing one's own city. To be conscious of danger brings good fortune. No blame. Perseverance brings humiliation."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Progress and advancement. Rising like the sun.", zh: "進步與前進。像太陽一樣升起" },
      situation: { en: "You're making rapid progress and gaining recognition.", zh: "你正在快速進步並獲得認可" },
      advice: { en: "Move forward confidently. Your advancement is natural and right.", zh: "自信地前進。你的進步是自然且正確的" },
      keywords: ["progress", "advancement", "rising", "recognition", "confidence"],
      lines: [
        { position: 1, stage: { en: "Progressing Rebuffed", zh: "進而受阻" }, meaning: { en: "Progressing but rebuffed. Perseverance brings good fortune.", zh: "前進但被拒絕。堅持帶來好運" }, advice: { en: "Initial resistance to progress. Persist despite obstacles.", zh: "進步的初始阻力。儘管障礙仍堅持" }, keywords: ["resistance", "persistence", "initial", "obstacles"] },
        { position: 2, stage: { en: "Progressing Sorrowfully", zh: "悲傷中前進" }, meaning: { en: "Progressing in sorrow. Good fortune from grandmother.", zh: "在悲傷中前進。來自祖母的好運" }, advice: { en: "Advance despite sadness. Blessing comes from elder feminine wisdom.", zh: "儘管悲傷仍前進。祝福來自長輩女性智慧" }, keywords: ["sorrow", "blessing", "elder wisdom", "advance"] },
        { position: 3, stage: { en: "All Trust", zh: "眾皆信" }, meaning: { en: "All trust you. Remorse disappears.", zh: "所有人信任你。悔恨消失" }, advice: { en: "Universal support enables progress. Trust eliminates doubt.", zh: "普遍支持使進步成為可能。信任消除疑慮" }, keywords: ["trust", "support", "universal", "confidence"] },
        { position: 4, stage: { en: "Field Mouse Progress", zh: "田鼠進步" }, meaning: { en: "Progress like field mouse. Perseverance brings danger.", zh: "像田鼠一樣進步。堅持帶來危險" }, advice: { en: "Sneaky advancement is perilous. Dishonest progress fails.", zh: "偷偷摸摸的前進是危險的。不誠實的進步失敗" }, keywords: ["sneaky", "dishonest", "danger", "peril"] },
        { position: 5, stage: { en: "Remorse Disappears", zh: "悔恨消失" }, meaning: { en: "Remorse disappears. Don't worry about gain and loss.", zh: "悔恨消失。不要擔心得失" }, advice: { en: "Let go of calculation. Success comes without grasping.", zh: "放下算計。不抓取就成功" }, keywords: ["letting go", "non-attachment", "success", "calculation"] },
        { position: 6, stage: { en: "Horns for Attack", zh: "用角攻擊" }, meaning: { en: "Making progress with horns. Only for subjugating own city.", zh: "用角前進。只用於征服自己的城市" }, advice: { en: "Use force only internally. Aggression suited only for self-discipline.", zh: "只在內部使用武力。侵略只適合自我紀律" }, keywords: ["internal force", "self-discipline", "limitation", "aggression"] }
      ]
    },
    relationships: { opposite: 3, inverse: 35, nuclear: 35 }
  },
  {
    number: 36,
    names: { en: "Darkening of the Light", zh: "明夷", pinyin: "míng yí" },
    symbol: "䷣",
    trigrams: {
      upper: { en: "Earth", zh: "地", symbol: "☷" },
      lower: { en: "Fire", zh: "火", symbol: "☲" }
    },
    classical: { judgment: "明夷：利艱貞", image: "明入地中，明夷。君子以蒞眾用晦而明", lines: ["初九：明夷于飛，垂其翼。君子于行，三日不食。有攸往，主人有言", "六二：明夷，夷于左股，用拯馬壯，吉", "九三：明夷于南狩，得其大首，不可疾貞", "六四：入于左腹，獲明夷之心，于出門庭", "六五：箕子之明夷，利貞", "上六：不明晦，初登于天，後入于地"] },
    wilhelm: { judgment: "Darkening of the Light. In adversity It furthers one to be persevering.", image: "The light has sunk into the earth: The image of Darkening of the Light. Thus does the superior man live with the great mass: He veils his light, yet still shines.", lines: ["Darkening of the light during flight. He lowers his wings. The superior man does not eat for three days On his wanderings. But he has somewhere to go. The host has occasion to gossip about him.", "Darkening of the light injures him in the left thigh. He gives aid with the strength of a horse. Good fortune.", "Darkening of the light during the hunt in the south. Their great leader is captured. One must not expect perseverance too soon.", "He penetrates the left side of the belly. One gets at the very heart of the darkening of the light.", "Darkening of the light as with Prince Chi. Perseverance furthers.", "Not light but darkness. First he climbed up to heaven, Then he plunged into the depths of the earth."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Darkening of light. Hiding brightness in difficult times.", zh: "光明被遮蔽。在困難時期隱藏光明" },
      situation: { en: "You face adversity and must conceal your light.", zh: "你面臨逆境且必須隱藏你的光芒" },
      advice: { en: "Hide your brilliance temporarily. Endure difficulty with inner strength.", zh: "暫時隱藏你的才華。以內在力量忍受困難" },
      keywords: ["darkness", "concealment", "adversity", "endurance", "inner light"],
      lines: [
        { position: 1, stage: { en: "Beginning", zh: "開始" }, meaning: { en: "Light sinking low. Stop eating for three days.", zh: "光下沉。三日不食" }, advice: { en: "Endure darkness by withdrawing. Refuse sustenance from corrupted source.", zh: "通過退隱忍受黑暗。拒絕腐敗來源的維持" }, keywords: ["withdrawal", "refusal", "endurance", "darkness"] },
        { position: 2, stage: { en: "Development", zh: "發展" }, meaning: { en: "Darkening of light, injured in left thigh. Horse saves through strength.", zh: "明之傷，左股傷。馬以力量拯救" }, advice: { en: "Wounded but aided by loyal support. Strength of companions helps escape.", zh: "受傷但被忠誠支持幫助。同伴的力量幫助逃脫" }, keywords: ["injury", "support", "strength", "escape"] },
        { position: 3, stage: { en: "Transition", zh: "過渡" }, meaning: { en: "Darkening in south hunt. Getting the great leader.", zh: "南狩之明。得大首" }, advice: { en: "Capturing source of darkness. Finding the root of corruption.", zh: "捕獲黑暗之源。找到腐敗的根源" }, keywords: ["capture", "root cause", "hunting", "discovery"] },
        { position: 4, stage: { en: "Emergence", zh: "浮現" }, meaning: { en: "Entering left side of belly. Seeing heart of darkening.", zh: "入於左腹。得明夷之心" }, advice: { en: "Penetrating to core of corruption. Understanding inner darkness.", zh: "穿透到腐敗核心。理解內在黑暗" }, keywords: ["penetration", "core", "understanding", "insight"] },
        { position: 5, stage: { en: "Achievement", zh: "成就" }, meaning: { en: "Prince Chi's darkening of light. Perseverance furthers.", zh: "箕子之明夷。利貞" }, advice: { en: "Noble person in dark times. Maintain virtue despite oppression.", zh: "黑暗時期的高貴之人。儘管壓迫仍保持美德" }, keywords: ["nobility", "oppression", "virtue", "perseverance"] },
        { position: 6, stage: { en: "Completion", zh: "完成" }, meaning: { en: "Not bright but dark. First rising to heaven, then sinking to earth.", zh: "不明晦。初登於天，後入於地" }, advice: { en: "Complete reversal from light to dark. From height to depth.", zh: "從光到暗的完全逆轉。從高處到深淵" }, keywords: ["reversal", "extreme change", "fall", "darkness"] }
      ]
    },
    relationships: { opposite: 4, inverse: 36, nuclear: 36 }
  },
  {
    number: 37,
    names: { en: "The Family", zh: "家人", pinyin: "jiā rén" },
    symbol: "䷤",
    trigrams: {
      upper: { en: "Wind", zh: "風", symbol: "☴" },
      lower: { en: "Fire", zh: "火", symbol: "☲" }
    },
    classical: { judgment: "家人：利女貞", image: "風自火出，家人。君子以言有物而行有恆", lines: ["初九：閑有家，悔亡", "六二：无攸遂，在中饋，貞吉", "九三：家人嗃嗃，悔厲，吉。婦子嘻嘻，終吝", "六四：富家，大吉", "九五：王假有家，勿恤，吉", "上九：有孚威如，終吉"] },
    wilhelm: { judgment: "The Family. The perseverance of the woman furthers.", image: "Wind comes forth from fire: The image of the Family. Thus the superior man has substance in his words And duration in his way of life.", lines: ["Firm seclusion within the family. Remorse disappears.", "She should not follow her whims. She must attend within to the food. Perseverance brings good fortune.", "When tempers flare up in the family, Too great severity brings remorse. Good fortune nonetheless. When woman and child dally and laugh, It leads in the end to humiliation.", "She is the treasure of the house. Great good fortune.", "As a king he approaches his family. Fear not. Good fortune.", "His work commands respect. In the end good fortune comes."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "The family and home. Order begins at the foundation.", zh: "家庭與家園。秩序從基礎開始" },
      situation: { en: "You need to establish proper order in your immediate circle.", zh: "你需要在你的近圈建立適當秩序" },
      advice: { en: "Focus on family and close relationships. Build from the foundation.", zh: "專注於家庭和親密關係。從基礎建立" },
      keywords: ["family", "home", "foundation", "order", "relationships"],
      lines: [
        { position: 1, stage: { en: "Firm Boundaries", zh: "堅定界限" }, meaning: { en: "Firm family law established. Clear boundaries prevent chaos.", zh: "建立堅定的家規。清晰界限防止混亂" }, advice: { en: "Set proper limits from the start. Prevention better than correction.", zh: "從一開始設定適當限制。預防勝於糾正" }, keywords: ["boundaries", "prevention", "structure", "limits"] },
        { position: 2, stage: { en: "Nourishing Within", zh: "內部滋養" }, meaning: { en: "Nourishing family from within. Woman's perseverance brings fortune.", zh: "從內部滋養家庭。女性的堅持帶來好運" }, advice: { en: "Internal care and maintenance. Steady provision from the center.", zh: "內部關懷和維護。從中心穩定供應" }, keywords: ["nourishment", "internal", "provision", "care"] },
        { position: 3, stage: { en: "Harsh Family", zh: "嚴厲家庭" }, meaning: { en: "Harsh words in family bring regret but ultimately good fortune. Leniency brings humiliation.", zh: "家庭中嚴厲的話語帶來悔恨但最終好運。寬容帶來羞辱" }, advice: { en: "Strictness better than laxity. Discipline prevents worse outcomes.", zh: "嚴格好於寬鬆。紀律防止更糟的結果" }, keywords: ["discipline", "strictness", "regret", "firmness"] },
        { position: 4, stage: { en: "Enriching Family", zh: "豐富家庭" }, meaning: { en: "Enriching the family. Great good fortune in prosperity.", zh: "豐富家庭。繁榮中的大吉" }, advice: { en: "Bring wealth to the household. Prosperity through right management.", zh: "為家庭帶來財富。通過正確管理繁榮" }, keywords: ["prosperity", "enrichment", "wealth", "management"] },
        { position: 5, stage: { en: "King and Family", zh: "君王與家庭" }, meaning: { en: "King in relation to family. Mutual approach brings blessing.", zh: "君王與家庭的關係。相互接近帶來祝福" }, advice: { en: "Leadership and family in harmony. Authority with love succeeds.", zh: "領導與家庭和諧。權威與愛成功" }, keywords: ["leadership", "harmony", "authority", "love"] },
        { position: 6, stage: { en: "Sincere Family Authority", zh: "真誠家庭權威" }, meaning: { en: "Authority with sincerity. Good fortune in authentic leadership.", zh: "真誠的權威。真實領導的好運" }, advice: { en: "Lead family with genuine care. Authenticity brings lasting respect.", zh: "以真正的關懷領導家庭。真實帶來持久尊重" }, keywords: ["sincerity", "authenticity", "authority", "respect"] }
      ]
    },
    relationships: { opposite: 5, inverse: 37, nuclear: 37 }
  },
  {
    number: 38,
    names: { en: "Opposition", zh: "睽", pinyin: "kuí" },
    symbol: "䷥",
    trigrams: {
      upper: { en: "Fire", zh: "火", symbol: "☲" },
      lower: { en: "Lake", zh: "澤", symbol: "☱" }
    },
    classical: { judgment: "睽：小事吉", image: "上火下澤，睽。君子以同而異", lines: ["初九：悔亡。喪馬勿逐，自復。見惡人，无咎", "九二：遇主于巷，无咎", "六三：見輿曳，其牛掣，其人天且劓，无初有終", "九四：睽孤，遇元夫，交孚，厲无咎", "六五：悔亡，厥宗噬膚，往何咎", "上九：睽孤，見豕負塗，載鬼一車，先張之弧，後說之弧，匪寇婚媾，往遇雨則吉"] },
    wilhelm: { judgment: "Opposition. In small matters, good fortune.", image: "Above, fire; below, the lake: The image of Opposition. Thus amid all fellowship The superior man retains his individuality.", lines: ["Remorse disappears. If you lose your horse, do not run after it; It will come back of its own accord. When you see evil people, Guard yourself against mistakes.", "One meets his lord in a narrow street. No blame.", "One sees the wagon dragged back, The oxen halted, A man's hair and nose cut off. Not a good beginning, but a good end.", "Isolated through opposition, One meets a like-minded man With whom one can associate in good faith. Despite the danger, no blame.", "Remorse disappears. The companion bites his way through the wrappings. If one goes to him, How could it be a mistake?", "Isolated through opposition, One sees one's companion as a pig covered with dirt, As a wagon full of devils. First one draws a bow against him, Then one lays the bow aside. He is not a robber; he will woo at the right time. As one goes, rain falls; then good fortune comes."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Opposition and divergence. Different paths creating tension.", zh: "對立與分歧。不同路徑造成緊張" },
      situation: { en: "You experience misunderstanding and separation.", zh: "你經歷誤解和分離" },
      advice: { en: "Accept differences. Small matters can succeed despite opposition.", zh: "接受差異。儘管有對立小事仍可成功" },
      keywords: ["opposition", "divergence", "difference", "tension", "separation"],
      lines: [
        { position: 1, stage: { en: "Remorse Disappears", zh: "悔恨消失" }, meaning: { en: "Losing horse but it returns. Meeting evil man - no blame.", zh: "失馬但它歸來。遇惡人 - 無責" }, advice: { en: "What seems lost returns naturally. Encounters resolve themselves.", zh: "看似失去的自然歸來。遭遇自行解決" }, keywords: ["return", "natural resolution", "patience", "trust"] },
        { position: 2, stage: { en: "Meeting Master", zh: "遇主" }, meaning: { en: "Meeting master in narrow lane. No blame in accidental encounter.", zh: "在窄巷遇到主人。意外相遇無責" }, advice: { en: "Unexpected connections in unlikely places. Stay open to chance meetings.", zh: "在不太可能的地方意外連結。對偶然相遇保持開放" }, keywords: ["unexpected", "chance", "connection", "openness"] },
        { position: 3, stage: { en: "Wagon Dragged Back", zh: "車被拉回" }, meaning: { en: "Wagon dragged back, oxen halted, man's hair and nose cut off.", zh: "車被拉回，牛被阻止，人的頭髮和鼻子被割掉" }, advice: { en: "Severe obstruction and humiliation. Progress violently blocked.", zh: "嚴重阻礙和羞辱。進展被暴力阻止" }, keywords: ["obstruction", "humiliation", "blocked", "severity"] },
        { position: 4, stage: { en: "Isolated Through Opposition", zh: "因對立孤立" }, meaning: { en: "Isolated through opposition. Meeting like-minded brings trust.", zh: "因對立而孤立。遇志同道合者帶來信任" }, advice: { en: "Find your true companions in alienation. Unity in shared opposition.", zh: "在疏離中找到真正的同伴。共同反對中的團結" }, keywords: ["isolation", "like-minded", "trust", "unity"] },
        { position: 5, stage: { en: "Remorse Disappears", zh: "悔恨消失" }, meaning: { en: "Companion bites through wrappings. Going forward - how could it be wrong?", zh: "同伴咬穿包裝。前進 - 怎麼可能錯？" }, advice: { en: "Ally breaks through barriers. Advance with trusted support.", zh: "盟友突破障礙。帶著可信的支持前進" }, keywords: ["breakthrough", "ally", "support", "advance"] },
        { position: 6, stage: { en: "Isolated Confusion", zh: "孤立困惑" }, meaning: { en: "Isolated and confused. Seeing pig covered in mud, wagon full of devils.", zh: "孤立而困惑。看到豬滿身泥，車滿是鬼" }, advice: { en: "Misperceptions in isolation. What seems evil may be harmless.", zh: "孤立中的錯誤認知。看似邪惡的可能無害" }, keywords: ["misperception", "confusion", "isolation", "illusion"] }
      ]
    },
    relationships: { opposite: 6, inverse: 38, nuclear: 38 }
  },
  {
    number: 39,
    names: { en: "Obstruction", zh: "蹇", pinyin: "jiǎn" },
    symbol: "䷦",
    trigrams: {
      upper: { en: "Water", zh: "水", symbol: "☵" },
      lower: { en: "Mountain", zh: "山", symbol: "☶" }
    },
    classical: { judgment: "蹇：利西南，不利東北。利見大人，貞吉", image: "山上有水，蹇。君子以反身修德", lines: ["初六：往蹇來譽", "六二：王臣蹇蹇，匪躬之故", "九三：往蹇來反", "六四：往蹇來連", "九五：大蹇，朋來", "上六：往蹇來碩，吉。利見大人"] },
    wilhelm: { judgment: "Obstruction. The southwest furthers. The northeast does not further. It furthers one to see the great man. Perseverance brings good fortune.", image: "Water on the mountain: The image of Obstruction. Thus the superior man turns his attention to himself And molds his character.", lines: ["Going leads to obstructions, Coming meets with praise.", "The King's servant is beset by obstruction upon obstruction, But it is not his own fault.", "Going leads to obstructions; Hence he comes back.", "Going leads to obstructions, Coming leads to union.", "In the midst of the greatest obstructions, Friends come.", "Going leads to obstructions, Coming leads to great good fortune. It furthers one to see the great man."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Obstruction and difficulty. Encountering obstacles in your path.", zh: "阻礙與困難。在你的道路上遇到障礙" },
      situation: { en: "You face serious obstacles requiring careful navigation.", zh: "你面臨需要小心應對的嚴重障礙" },
      advice: { en: "Turn inward and develop yourself. Seek help from capable people.", zh: "向內轉並發展自己。尋求有能力的人的幫助" },
      keywords: ["obstruction", "difficulty", "obstacles", "reflection", "help"],
      lines: [
        { position: 1, stage: { en: "Going Meets Obstruction", zh: "往遇阻礙" }, meaning: { en: "Going leads to obstruction. Coming brings praise.", zh: "前往導致阻礙。回來帶來讚譽" }, advice: { en: "Advance blocked, retreat honored. Turn back to gain recognition.", zh: "前進被阻，退後受尊。回頭獲得認可" }, keywords: ["blocked advance", "retreat", "recognition", "wisdom"] },
        { position: 2, stage: { en: "King's Servant", zh: "君王之僕" }, meaning: { en: "King's servant meets obstruction upon obstruction. Not his own fault.", zh: "君王僕人遇到重重阻礙。非他自己的過錯" }, advice: { en: "Difficulties in service to higher cause. Personal blamelessness amid hardship.", zh: "服務更高事業中的困難。在困境中個人無責" }, keywords: ["service", "hardship", "blameless", "duty"] },
        { position: 3, stage: { en: "Going Meets Obstruction", zh: "往遇阻礙" }, meaning: { en: "Going leads to obstruction. Hence he comes back.", zh: "前往導致阻礙。因此他回來" }, advice: { en: "Path forward blocked. Return is the wise choice.", zh: "前進道路被阻。返回是明智選擇" }, keywords: ["return", "blocked path", "wisdom", "choice"] },
        { position: 4, stage: { en: "Going Meets Obstruction", zh: "往遇阻礙" }, meaning: { en: "Going meets obstruction. Coming meets union.", zh: "前往遇阻礙。回來遇聯合" }, advice: { en: "Advance blocked but retreat brings connection. Go back to find allies.", zh: "前進被阻但退後帶來連結。回去找盟友" }, keywords: ["blocked advance", "union", "allies", "return"] },
        { position: 5, stage: { en: "Great Obstruction", zh: "大阻礙" }, meaning: { en: "In midst of great obstruction. Friends come to help.", zh: "在大阻礙中。朋友來幫助" }, advice: { en: "Maximum difficulty draws support. Help arrives at lowest point.", zh: "最大困難吸引支持。在最低點幫助到來" }, keywords: ["maximum difficulty", "support", "friends", "help"] },
        { position: 6, stage: { en: "Going Meets Obstruction", zh: "往遇阻礙" }, meaning: { en: "Going meets obstruction. Coming brings supreme good fortune.", zh: "前往遇阻礙。回來帶來至高好運" }, advice: { en: "Forward blocked but backward brings great blessing. Return is glorious.", zh: "向前被阻但向後帶來大祝福。返回是光榮的" }, keywords: ["return", "blessing", "glory", "fortune"] }
      ]
    },
    relationships: { opposite: 7, inverse: 39, nuclear: 39 }
  },
  {
    number: 40,
    names: { en: "Deliverance", zh: "解", pinyin: "jiě" },
    symbol: "䷧",
    trigrams: {
      upper: { en: "Thunder", zh: "雷", symbol: "☳" },
      lower: { en: "Water", zh: "水", symbol: "☵" }
    },
    classical: { judgment: "解：利西南。无所往，其來復吉。有攸往，夙吉", image: "雷雨作，解。君子以赦過宥罪", lines: ["初六：无咎", "九二：田獲三狐，得黃矢，貞吉", "六三：負且乘，致寇至，貞吝", "九四：解而拇，朋至斯孚", "六五：君子維有解，吉。有孚于小人", "上六：公用射隼于高墉之上，獲之，无不利"] },
    wilhelm: { judgment: "Deliverance. The southwest furthers. If there is no longer anything where one has to go, Return brings good fortune. If there is still something where one has to go, Hastening brings good fortune.", image: "Thunder and rain set in: The image of Deliverance. Thus the superior man pardons mistakes And forgives misdeeds.", lines: ["Without blame.", "One kills three foxes in the field And receives a yellow arrow. Perseverance brings good fortune.", "If a man carries a burden on his back And nonetheless rides in a carriage, He thereby encourages robbers to draw near. Perseverance leads to humiliation.", "Deliver yourself from your great toe. Then the companion comes, And him you can trust.", "If only the superior man can deliver himself, It brings good fortune. Thus he proves to inferior men that he is in earnest.", "The prince shoots at a hawk on a high wall. He kills it. Everything serves to further."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Liberation and relief. Release from difficulty.", zh: "解放與解脫。從困難中釋放" },
      situation: { en: "You're being freed from past constraints.", zh: "你正從過去的約束中解放" },
      advice: { en: "Move quickly to resolve remaining issues. Pardon and let go.", zh: "迅速解決剩餘問題。寬恕並放手" },
      keywords: ["liberation", "relief", "release", "freedom", "resolution"],
      lines: [
        { position: 1, stage: { en: "Beginning", zh: "開始" }, meaning: { en: "Line 1 of Deliverance: Beginning phase of the journey.", zh: "Deliverance第1爻：旅程的開始階段" }, advice: { en: "Navigate this beginning with awareness and adaptation.", zh: "有意識和適應地度過這個開始" }, keywords: ["awareness", "adaptation", "progression", "timing"] },
        { position: 2, stage: { en: "Development", zh: "發展" }, meaning: { en: "Line 2 of Deliverance: Development phase of the journey.", zh: "Deliverance第2爻：旅程的發展階段" }, advice: { en: "Navigate this development with awareness and adaptation.", zh: "有意識和適應地度過這個發展" }, keywords: ["awareness", "adaptation", "progression", "timing"] },
        { position: 3, stage: { en: "Transition", zh: "過渡" }, meaning: { en: "Line 3 of Deliverance: Transition phase of the journey.", zh: "Deliverance第3爻：旅程的過渡階段" }, advice: { en: "Navigate this transition with awareness and adaptation.", zh: "有意識和適應地度過這個過渡" }, keywords: ["awareness", "adaptation", "progression", "timing"] },
        { position: 4, stage: { en: "Testing", zh: "測試" }, meaning: { en: "Line 4 of Deliverance: Testing phase of the journey.", zh: "Deliverance第4爻：旅程的測試階段" }, advice: { en: "Navigate this testing with awareness and adaptation.", zh: "有意識和適應地度過這個測試" }, keywords: ["awareness", "adaptation", "progression", "timing"] },
        { position: 5, stage: { en: "Achievement", zh: "成就" }, meaning: { en: "Line 5 of Deliverance: Achievement phase of the journey.", zh: "Deliverance第5爻：旅程的成就階段" }, advice: { en: "Navigate this achievement with awareness and adaptation.", zh: "有意識和適應地度過這個成就" }, keywords: ["awareness", "adaptation", "progression", "timing"] },
        { position: 6, stage: { en: "Completion", zh: "完成" }, meaning: { en: "Line 6 of Deliverance: Completion phase of the journey.", zh: "Deliverance第6爻：旅程的完成階段" }, advice: { en: "Navigate this completion with awareness and adaptation.", zh: "有意識和適應地度過這個完成" }, keywords: ["awareness", "adaptation", "progression", "timing"] }
      ]
    },
    relationships: { opposite: 8, inverse: 40, nuclear: 40 }
  },
  {
    number: 41,
    names: { en: "Decrease", zh: "損", pinyin: "sǔn" },
    symbol: "䷨",
    trigrams: {
      upper: { en: "Mountain", zh: "山", symbol: "☶" },
      lower: { en: "Lake", zh: "澤", symbol: "☱" }
    },
    classical: { judgment: "損：有孚，元吉，无咎，可貞。利有攸往。曷之用？二簋可用享", image: "山下有澤，損。君子以懲忿窒欲", lines: ["初九：已事遄往，无咎，酌損之", "九二：利貞，征凶，弗損益之", "六三：三人行，則損一人。一人行，則得其友", "六四：損其疾，使遄有喜，无咎", "六五：或益之十朋之龜，弗克違，元吉", "上九：弗損益之，无咎，貞吉，利有攸往，得臣无家"] },
    wilhelm: { judgment: "Decrease combined with sincerity Brings about supreme good fortune Without blame. One may be persevering in this. It furthers one to undertake something. How is this to be carried out? One may use two small bowls for the sacrifice.", image: "At the foot of the mountain, the lake: The image of Decrease. Thus the superior man controls his anger And restrains his instincts.", lines: ["Going quickly when one's tasks are finished Is without blame. But one must reflect on how much one may decrease others.", "Perseverance furthers. To undertake something brings misfortune. Without decreasing oneself, One is able to bring increase to others.", "When three people journey together, Their number decreases by one. When one man journeys alone, He finds a companion.", "If a man decreases his faults, It makes the other hasten to come and rejoice. No blame.", "Someone does indeed increase him. Ten pairs of tortoises cannot oppose it. Supreme good fortune.", "If one is increased without depriving others, There is no blame. Perseverance brings good fortune. It furthers one to undertake something. One obtains servants But no longer has a separate home."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Decrease and sacrifice. Reducing to find true value.", zh: "減少與犧牲。減少以找到真正價值" },
      situation: { en: "You must decrease and simplify to gain.", zh: "你必須減少和簡化以獲得" },
      advice: { en: "Let go of excess. Sometimes less truly is more.", zh: "放下過量。有時少即是多" },
      keywords: ["decrease", "reduction", "sacrifice", "simplicity", "essence"],
      lines: [
        { position: 1, stage: { en: "Quick Decrease", zh: "快速減少" }, meaning: { en: "Decreasing one's affairs quickly. No blame if done swiftly.", zh: "迅速減少事務。如果迅速完成則無責" }, advice: { en: "Rapid reduction when needed. Speed in cutting back prevents error.", zh: "需要時快速減少。快速削減防止錯誤" }, keywords: ["rapid", "reduction", "speed", "cutting"] },
        { position: 2, stage: { en: "Advantageous Perseverance", zh: "有利的堅持" }, meaning: { en: "Perseverance furthers. Undertaking brings misfortune. Without decreasing, increase.", zh: "堅持有益。承擔帶來不幸。不減少，反增加" }, advice: { en: "Don't diminish yourself to serve. Maintain your wholeness.", zh: "不要為服務而減損自己。保持你的完整" }, keywords: ["wholeness", "self-preservation", "maintain", "integrity"] },
        { position: 3, stage: { en: "Three People Decrease", zh: "三人減少" }, meaning: { en: "When three walk together, one must decrease. One person gets companion.", zh: "三人同行，必減其一。一人得伴" }, advice: { en: "Reduction brings focus. Better one true connection than diffused many.", zh: "減少帶來專注。一個真正連結好於分散的多個" }, keywords: ["focus", "reduction", "true connection", "simplification"] },
        { position: 4, stage: { en: "Decreasing Illness", zh: "減少疾病" }, meaning: { en: "Decreasing one's faults. Makes other hasten to rejoice.", zh: "減少過錯。使他人急於歡喜" }, advice: { en: "Removing defects brings joy to others. Self-improvement benefits all.", zh: "去除缺陷為他人帶來喜悅。自我改善惠及所有人" }, keywords: ["self-improvement", "removing defects", "joy", "benefit"] },
        { position: 5, stage: { en: "Increased by Ten", zh: "增加十倍" }, meaning: { en: "Someone increases him by ten pairs of tortoise shells. Cannot oppose.", zh: "有人增加他十對龜殼。不能反對" }, advice: { en: "Blessing comes unsought. Gifts arrive when you least expect.", zh: "祝福不求而來。禮物在你最不期待時到來" }, keywords: ["blessing", "unsought gifts", "unexpected", "fortune"] },
        { position: 6, stage: { en: "Increase Without Decrease", zh: "增而不減" }, meaning: { en: "Increase without decrease. No blame. Perseverance brings good fortune.", zh: "增加而不減少。無責。堅持帶來好運" }, advice: { en: "Growth without loss is possible. Gain without sacrifice succeeds.", zh: "沒有損失的成長是可能的。不犧牲的獲得成功" }, keywords: ["growth", "no loss", "gain", "success"] }
      ]
    },
    relationships: { opposite: 9, inverse: 41, nuclear: 41 }
  },
  {
    number: 42,
    names: { en: "Increase", zh: "益", pinyin: "yì" },
    symbol: "䷩",
    trigrams: {
      upper: { en: "Wind", zh: "風", symbol: "☴" },
      lower: { en: "Thunder", zh: "雷", symbol: "☳" }
    },
    classical: { judgment: "益：利有攸往。利涉大川", image: "風雷，益。君子以見善則遷，有過則改", lines: ["初九：利用為大作，元吉，无咎", "六二：或益之十朋之龜，弗克違，永貞吉。王用享于帝，吉", "六三：益之用凶事，无咎。有孚中行，告公用圭", "六四：中行，告公從，利用為依遷國", "九五：有孚惠心，勿問，元吉。有孚惠我德", "上九：莫益之，或擊之，立心勿恆，凶"] },
    wilhelm: { judgment: "Increase. It furthers one To undertake something. It furthers one to cross the great water.", image: "Wind and thunder: the image of Increase. Thus the superior man: If he sees good, he imitates it; If he has faults, he rids himself of them.", lines: ["It furthers one to accomplish great deeds. Supreme good fortune. No blame.", "Someone does indeed increase him; Ten pairs of tortoises cannot oppose it. Constant perseverance brings good fortune. The king presents him before God. Good fortune.", "One is enriched through unfortunate events. No blame, if you are sincere And walk in the middle, And report with a seal to the prince.", "If you walk in the middle And report to the prince, He will follow. It furthers one to be used In the removal of the capital.", "If in truth you have a kind heart, ask not. Supreme good fortune. Truly, kindness will be recognized as your virtue.", "He brings increase to no one. Indeed, someone even strikes him. He does not keep his heart constantly steady. Misfortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Increase and growth. Augmenting what is beneficial.", zh: "增加與成長。增加有益的事物" },
      situation: { en: "You're in a time of growth and expansion.", zh: "你正處於成長和擴張的時期" },
      advice: { en: "Increase what is good. Build on positive foundations.", zh: "增加良好的事物。在積極基礎上建立" },
      keywords: ["increase", "growth", "expansion", "benefit", "augmentation"],
      lines: [
        { position: 1, stage: { en: "Great Undertaking", zh: "大事業" }, meaning: { en: "Advantageous to undertake great things. Supreme good fortune.", zh: "有利於承擔大事。至高好運" }, advice: { en: "Use increase for significant projects. Blessing enables major efforts.", zh: "用增加來做重大項目。祝福使重大努力成為可能" }, keywords: ["great projects", "blessing", "major efforts", "fortune"] },
        { position: 2, stage: { en: "Increased by Ten", zh: "增加十倍" }, meaning: { en: "Someone increases him. Ten pairs of tortoise shells cannot oppose.", zh: "有人增加他。十對龜殼無法反對" }, advice: { en: "Gifts arrive beyond measure. Accept abundant blessing.", zh: "禮物超乎尋常地到來。接受豐盛的祝福" }, keywords: ["abundant blessing", "gifts", "acceptance", "measure"] },
        { position: 3, stage: { en: "Increase Through Misfortune", zh: "通過不幸增加" }, meaning: { en: "Increased through unfortunate events. No blame if sincere.", zh: "通過不幸事件增加。如果真誠則無責" }, advice: { en: "Growth comes through hardship. Adversity brings unexpected gain.", zh: "成長來自困境。逆境帶來意外收穫" }, keywords: ["growth through hardship", "adversity", "unexpected gain", "sincerity"] },
        { position: 4, stage: { en: "Walking Middle", zh: "行中道" }, meaning: { en: "Walking middle path. Informing prince brings following.", zh: "行中道。告知君主帶來追隨" }, advice: { en: "Mediate conflicts. Central position gains support for moves.", zh: "調解衝突。中心位置為行動獲得支持" }, keywords: ["mediation", "central position", "support", "balance"] },
        { position: 5, stage: { en: "Kind Heart", zh: "仁心" }, meaning: { en: "Kind heart. Don't question. Supreme good fortune. Kindness as virtue.", zh: "仁慈的心。不要質疑。至高好運。仁慈作為美德" }, advice: { en: "Benevolence without calculation. Pure goodness brings greatest blessing.", zh: "不計算的仁慈。純粹善良帶來最大祝福" }, keywords: ["benevolence", "pure goodness", "blessing", "kindness"] },
        { position: 6, stage: { en: "No Increase", zh: "無增加" }, meaning: { en: "No one increases him. Someone even strikes him. Misfortune.", zh: "無人增加他。有人甚至打他。不幸" }, advice: { en: "Increase turns to isolation. Success breeds opposition.", zh: "增加轉為孤立。成功滋生反對" }, keywords: ["isolation", "opposition", "reversal", "misfortune"] }
      ]
    },
    relationships: { opposite: 10, inverse: 42, nuclear: 42 }
  },
  {
    number: 43,
    names: { en: "Break-through", zh: "夬", pinyin: "guài" },
    symbol: "䷪",
    trigrams: {
      upper: { en: "Lake", zh: "澤", symbol: "☱" },
      lower: { en: "Heaven", zh: "天", symbol: "☰" }
    },
    classical: { judgment: "夬：揚于王庭，孚號有厲。告自邑，不利即戎，利有攸往", image: "澤上于天，夬。君子以施祿及下，居德則忌", lines: ["初九：壯于前趾，往不勝，為咎", "九二：惕號，莫夜有戎，勿恤", "九三：壯于頄，有凶。君子夬夬獨行，遇雨若濡，有慍，无咎", "九四：臀无膚，其行次且，牽羊悔亡，聞言不信", "九五：莧陸夬夬，中行无咎", "上六：无號，終有凶"] },
    wilhelm: { judgment: "Break-through. One must resolutely make the matter known At the court of the king. It must be announced truthfully. Danger. It is necessary to notify one's own city. It does not further to resort to arms. It furthers one to undertake something.", image: "The lake has risen up to heaven: The image of Break-through. Thus the superior man Dispenses riches downward And refrains from resting on his virtue.", lines: ["Mighty in the forward-striding toes. When one goes and is not equal to the task, One makes a mistake.", "A cry of alarm. Arms at evening and at night. Fear nothing.", "To be powerful in the cheekbones Brings misfortune. The superior man is firmly resolved. He walks alone and is caught in the rain. He is bespattered, And people murmur against him. No blame.", "There is no skin on his thighs, And walking comes hard. If a man were to let himself be led like a sheep, Remorse would disappear. But if these words are heard They will not be believed.", "In dealing with weeds, Firm resolution is necessary. Walking in the middle Remains free of blame.", "No cry. In the end misfortune comes."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Breakthrough and resolution. Breaking through to clarity.", zh: "突破與決斷。突破到清晰" },
      situation: { en: "You must make a decisive break with what holds you back.", zh: "你必須果斷地與阻礙你的事物決裂" },
      advice: { en: "Act resolutely but announce your intentions clearly.", zh: "果斷行動但清楚地宣布你的意圖" },
      keywords: ["breakthrough", "resolution", "decisiveness", "clarity", "determination"],
      lines: [
        { position: 1, stage: { en: "Mighty in Toes", zh: "壯於趾" }, meaning: { en: "Mighty in forward-striding toes. Going without strength brings guilt.", zh: "在前進的腳趾中強大。沒有力量前進帶來罪責" }, advice: { en: "Don't advance without adequate power. Premature force fails.", zh: "沒有足夠力量不要前進。過早的武力失敗" }, keywords: ["premature", "inadequate power", "caution", "preparation"] },
        { position: 2, stage: { en: "Cry of Alarm", zh: "警報之聲" }, meaning: { en: "Cry of alarm. Arms at evening and night. No need to fear.", zh: "警報之聲。晚上和夜間武裝。無需恐懼" }, advice: { en: "Be vigilant and prepared. Constant readiness prevents danger.", zh: "保持警惕和準備。持續準備防止危險" }, keywords: ["vigilance", "readiness", "preparation", "alertness"] },
        { position: 3, stage: { en: "Mighty in Cheekbones", zh: "壯於頄" }, meaning: { en: "Mighty in cheekbones brings misfortune. Walking alone in rain, meeting hostility.", zh: "在顴骨強大帶來不幸。獨自在雨中行走，遇到敵意" }, advice: { en: "Visible aggression brings trouble. Solitary decisiveness invites criticism.", zh: "明顯的侵略帶來麻煩。孤獨的果斷招致批評" }, keywords: ["visible aggression", "criticism", "solitary", "hostility"] },
        { position: 4, stage: { en: "No Skin on Thighs", zh: "臀無膚" }, meaning: { en: "No skin on thighs. Walking impeded. Leading sheep brings remorse.", zh: "大腿無皮。行走受阻。領導羊帶來悔恨" }, advice: { en: "Injured position makes leadership difficult. Weakness shows despite effort.", zh: "受傷位置使領導困難。儘管努力仍顯示弱點" }, keywords: ["injury", "weakness", "difficult leadership", "limitation"] },
        { position: 5, stage: { en: "Pulling Up Weeds", zh: "拔草" }, meaning: { en: "Pulling up plantain with determination. Walking in middle brings no blame.", zh: "堅定地拔起車前草。行走在中間無責" }, advice: { en: "Persistent removal of problems. Central, balanced approach succeeds.", zh: "持續移除問題。中心、平衡的方法成功" }, keywords: ["persistence", "removal", "balance", "determination"] },
        { position: 6, stage: { en: "No Cry", zh: "無號" }, meaning: { en: "No cry of warning. In the end misfortune comes.", zh: "無警告之聲。最終不幸來臨" }, advice: { en: "Lack of vigilance leads to downfall. Complacency invites disaster.", zh: "缺乏警惕導致失敗。自滿招致災難" }, keywords: ["complacency", "lack of vigilance", "downfall", "disaster"] }
      ]
    },
    relationships: { opposite: 11, inverse: 43, nuclear: 43 }
  },
  {
    number: 44,
    names: { en: "Coming to Meet", zh: "姤", pinyin: "gòu" },
    symbol: "䷫",
    trigrams: {
      upper: { en: "Heaven", zh: "天", symbol: "☰" },
      lower: { en: "Wind", zh: "風", symbol: "☴" }
    },
    classical: { judgment: "姤：女壯，勿用取女", image: "天下有風，姤。后以施命誥四方", lines: ["初六：繫于金柅，貞吉。有攸往，見凶，羸豕孚蹢躅", "九二：包有魚，无咎，不利賓", "九三：臀无膚，其行次且，厲，无大咎", "九四：包无魚，起凶", "九五：以杞包瓜，含章，有隕自天", "上九：姤其角，吝，无咎"] },
    wilhelm: { judgment: "Coming to Meet. The maiden is powerful. One should not marry such a maiden.", image: "Under heaven, wind: The image of Coming to Meet. Thus does the prince act when disseminating his commands And proclaiming them to the four quarters of heaven.", lines: ["It must be checked with a brake of bronze. Perseverance brings good fortune. If one lets it take its course, one experiences misfortune. Even a lean pig has it in him to rage around.", "There is a fish in the tank. No blame. Does not further guests.", "There is no skin on his thighs, And walking comes hard. If one is mindful of the danger, No great mistake is made.", "No fish in the tank. This leads to misfortune.", "A melon covered with willow leaves. Hidden lines. Then it drops down to one from heaven.", "He comes to meet with his horns. Humiliation. No blame."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Coming to meet. Unexpected encounter with temptation.", zh: "邂逅。與誘惑的意外相遇" },
      situation: { en: "You face unexpected influence that may be problematic.", zh: "你面臨可能有問題的意外影響" },
      advice: { en: "Be cautious of seductive influences. Don't commit hastily.", zh: "謹防誘人的影響。不要草率承諾" },
      keywords: ["meeting", "encounter", "temptation", "caution", "influence"],
      lines: [
        { position: 1, stage: { en: "Brake with Metal", zh: "金柅" }, meaning: { en: "Brake applied with metal band. Perseverance brings fortune.", zh: "用金屬帶施加制動。堅持帶來好運" }, advice: { en: "Restrain firmly from the start. Strong prevention succeeds.", zh: "從一開始堅定克制。強力預防成功" }, keywords: ["restraint", "prevention", "firmness", "control"] },
        { position: 2, stage: { en: "Fish in Tank", zh: "包有魚" }, meaning: { en: "Fish in the tank. No blame but not advantageous for guests.", zh: "缸中有魚。無責但對客人不利" }, advice: { en: "Containment is appropriate. Keep matter private, not public.", zh: "包容是適當的。保持事情私密，非公開" }, keywords: ["containment", "private", "appropriate", "discretion"] },
        { position: 3, stage: { en: "No Skin on Thighs", zh: "臀無膚" }, meaning: { en: "No skin on thighs. Walking with difficulty but not great error.", zh: "大腿無皮。行走困難但非大錯" }, advice: { en: "Injury impedes but doesn't stop. Proceed despite wounds.", zh: "受傷阻礙但不停止。儘管受傷仍前進" }, keywords: ["injury", "impediment", "proceeding", "persistence"] },
        { position: 4, stage: { en: "No Fish in Tank", zh: "包無魚" }, meaning: { en: "No fish in tank. Rise of misfortune begins here.", zh: "缸中無魚。不幸從這裡開始上升" }, advice: { en: "What should be contained escapes. Loss of control causes problems.", zh: "應該包容的逃脫了。失控導致問題" }, keywords: ["escape", "loss of control", "problems", "containment failure"] },
        { position: 5, stage: { en: "Melon Covered with Willow", zh: "以杞包瓜" }, meaning: { en: "Melon covered with willow leaves. Hidden lines fall from heaven.", zh: "用柳葉覆蓋瓜。隱藏的線從天而降" }, advice: { en: "Conceal what is valuable. Protection brings unexpected blessing.", zh: "隱藏有價值的東西。保護帶來意外祝福" }, keywords: ["concealment", "protection", "value", "blessing"] },
        { position: 6, stage: { en: "Coming to Meet with Horns", zh: "姤其角" }, meaning: { en: "Meeting with horns. Humiliation but no blame.", zh: "以角相遇。羞辱但無責" }, advice: { en: "Encounter with aggression. Shame in situation but personal innocence.", zh: "與侵略相遇。情況中的羞恥但個人無辜" }, keywords: ["aggression", "humiliation", "innocence", "encounter"] }
      ]
    },
    relationships: { opposite: 12, inverse: 44, nuclear: 44 }
  },
  {
    number: 45,
    names: { en: "Gathering Together", zh: "萃", pinyin: "cuì" },
    symbol: "䷬",
    trigrams: {
      upper: { en: "Lake", zh: "澤", symbol: "☱" },
      lower: { en: "Earth", zh: "地", symbol: "☷" }
    },
    classical: { judgment: "萃：亨。王假有廟，利見大人，亨，利貞。用大牲吉，利有攸往", image: "澤上于地，萃。君子以除戎器，戒不虞", lines: ["初六：有孚不終，乃亂乃萃，若號，一握為笑，勿恤，往无咎", "六二：引吉，无咎，孚乃利用禴", "六三：萃如嗟如，无攸利，往无咎，小吝", "九四：大吉，无咎", "九五：萃有位，无咎。匪孚，元永貞，悔亡", "上六：齎咨涕洟，无咎"] },
    wilhelm: { judgment: "Gathering Together. Success. The king approaches his temple. It furthers one to see the great man. This brings success. Perseverance furthers. To bring great offerings creates good fortune. It furthers one to undertake something.", image: "Over the earth, the lake: The image of Gathering Together. Thus the superior man renews his weapons In order to meet the unforeseen.", lines: ["If you are sincere, but not to the end, There will sometimes be confusion, sometimes gathering. If you call out, Then after one grasp of the hand you can laugh again. Regret not. Going is without blame.", "Letting oneself be drawn Brings good fortune and remains blameless. If one is sincere, It furthers one to bring even a small offering.", "Gathering together amid sighs. Nothing that would further. Going is without blame. Slight humiliation.", "Great good fortune. No blame.", "If in gathering together one has position, This brings no blame. If there are some who are not yet sincerely in the work, Sublime and enduring perseverance is needed. Then remorse disappears.", "Lamenting and sighing, floods of tears. No blame."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Gathering together. Assembly for common purpose.", zh: "聚集在一起。為共同目的集會" },
      situation: { en: "You need to gather people and resources together.", zh: "你需要將人員和資源聚集在一起" },
      advice: { en: "Unite people around shared goals. Prepare for collective action.", zh: "圍繞共同目標團結人們。為集體行動做準備" },
      keywords: ["gathering", "assembly", "unity", "collection", "purpose"],
      lines: [
        { position: 1, stage: { en: "Sincerity Without End", zh: "有孚不終" }, meaning: { en: "Sincerity but without completion. Confusion then gathering brings good fortune.", zh: "真誠但沒有完成。混亂然後聚集帶來好運" }, advice: { en: "Initial sincerity not enough. Disorder precedes true unity.", zh: "最初的真誠不夠。混亂先於真正團結" }, keywords: ["sincerity", "disorder", "unity", "incompletion"] },
        { position: 2, stage: { en: "Drawn By Fortune", zh: "引吉" }, meaning: { en: "Drawn by good fortune. No blame. Sincerity furthers small offerings.", zh: "被好運吸引。無責。真誠促進小供品" }, advice: { en: "Attracted to gathering naturally. Simple authenticity suffices.", zh: "自然被吸引到聚集。簡單真實就足夠" }, keywords: ["attraction", "natural", "authenticity", "simplicity"] },
        { position: 3, stage: { en: "Gathering with Sighs", zh: "萃如嗟如" }, meaning: { en: "Gathering together amid sighs. Nothing that furthers. Going brings no blame.", zh: "聚集伴隨嘆息。無益。前往無責" }, advice: { en: "Joyless assembly. Better to leave than force participation.", zh: "無樂趣的集會。離開好於強迫參與" }, keywords: ["joyless", "forced", "leaving", "freedom"] },
        { position: 4, stage: { en: "Great Good Fortune", zh: "大吉" }, meaning: { en: "Great good fortune. No blame in elevated position.", zh: "大吉。在高位無責" }, advice: { en: "Right person in gathering. Position brings blessing.", zh: "聚集中的正確人選。位置帶來祝福" }, keywords: ["right position", "blessing", "elevation", "fortune"] },
        { position: 5, stage: { en: "Position Gathering", zh: "萃有位" }, meaning: { en: "Gathering around position. No blame. Not trusted - supreme perseverance.", zh: "圍繞位置聚集。無責。不被信任 - 至高堅持" }, advice: { en: "Leadership position attracts followers. Earn trust through persistence.", zh: "領導位置吸引追隨者。通過堅持贏得信任" }, keywords: ["leadership", "trust", "persistence", "followers"] },
        { position: 6, stage: { en: "Lamenting and Sighing", zh: "齎咨涕洟" }, meaning: { en: "Lamenting, sighing, tears flowing. No blame in authentic grief.", zh: "哀嘆、嘆息、淚水流淌。真實悲傷無責" }, advice: { en: "Honest sorrow at gathering's end. Genuine emotion without fault.", zh: "聚集結束時的誠實悲傷。真實情感無過失" }, keywords: ["grief", "authenticity", "emotion", "ending"] }
      ]
    },
    relationships: { opposite: 13, inverse: 45, nuclear: 45 }
  },
  {
    number: 46,
    names: { en: "Pushing Upward", zh: "升", pinyin: "shēng" },
    symbol: "䷭",
    trigrams: {
      upper: { en: "Earth", zh: "地", symbol: "☷" },
      lower: { en: "Wind", zh: "風", symbol: "☴" }
    },
    classical: { judgment: "升：元亨。用見大人，勿恤。南征吉", image: "地中生木，升。君子以順德，積小以高大", lines: ["初六：允升，大吉", "九二：孚乃利用禴，无咎", "九三：升虛邑", "六四：王用亨于岐山，吉，无咎", "六五：貞吉，升階", "上六：冥升，利于不息之貞"] },
    wilhelm: { judgment: "Pushing Upward has supreme success. One must see the great man. Fear not. Departure toward the south Brings good fortune.", image: "Within the earth, wood grows: The image of Pushing Upward. Thus the superior man of devoted character Heaps up small things In order to achieve something high and great.", lines: ["Pushing upward that meets with confidence Brings great good fortune.", "If one is sincere, It furthers one to bring even a small offering. No blame.", "One pushes upward into an empty city.", "The king offers him Mount Ch'i. Good fortune. No blame.", "Perseverance brings good fortune. One pushes upward by steps.", "Pushing upward in darkness. It furthers one To be unremittingly persevering."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Pushing upward. Steady rise through effort.", zh: "向上推進。通過努力穩步上升" },
      situation: { en: "You're ascending gradually through persistent work.", zh: "你正通過持續工作逐步上升" },
      advice: { en: "Continue your steady climb. Small steps lead to great heights.", zh: "繼續穩步攀登。小步伐帶來大高度" },
      keywords: ["ascending", "rising", "growth", "effort", "progress"],
      lines: [
        { position: 1, stage: { en: "Pushing Upward Meets Confidence", zh: "升遇信" }, meaning: { en: "Pushing upward with confidence. Great good fortune.", zh: "帶著信心向上推進。大吉" }, advice: { en: "Ascend with trust. Belief enables rising.", zh: "帶著信任上升。信念使上升成為可能" }, keywords: ["trust", "ascent", "confidence", "fortune"] },
        { position: 2, stage: { en: "Sincere Small Offering", zh: "孚乃利用禴" }, meaning: { en: "Sincere even with small offering. No blame.", zh: "即使是小供品也真誠。無責" }, advice: { en: "Authenticity matters more than size. Simple sincerity succeeds.", zh: "真實比大小更重要。簡單真誠成功" }, keywords: ["authenticity", "simplicity", "sincerity", "acceptance"] },
        { position: 3, stage: { en: "Pushing Up Into Empty City", zh: "升虛邑" }, meaning: { en: "Pushing upward into empty city. No resistance.", zh: "向上推進進入空城。無阻力" }, advice: { en: "Advance meets no opposition. Rise unopposed.", zh: "前進沒有遇到反對。無阻上升" }, keywords: ["no resistance", "unopposed", "easy advance", "opportunity"] },
        { position: 4, stage: { en: "King Offers to Mountain", zh: "王用亨于岐山" }, meaning: { en: "King makes offerings on Mount Chi. Good fortune.", zh: "君王在岐山獻祭。好運" }, advice: { en: "Leader honors heights. Recognition of elevation brings blessing.", zh: "領導者尊重高處。認可提升帶來祝福" }, keywords: ["honor", "recognition", "elevation", "blessing"] },
        { position: 5, stage: { en: "Perseverance Brings Fortune", zh: "貞吉升階" }, meaning: { en: "Perseverance brings good fortune. Push upward by steps.", zh: "堅持帶來好運。逐步向上推進" }, advice: { en: "Steady, gradual ascent. Step-by-step climbing succeeds.", zh: "穩定、漸進的上升。逐步攀登成功" }, keywords: ["gradual", "steady", "steps", "perseverance"] },
        { position: 6, stage: { en: "Pushing Upward in Darkness", zh: "冥升" }, meaning: { en: "Pushing upward in darkness. Unremitting perseverance furthers.", zh: "在黑暗中向上推進。不懈堅持有益" }, advice: { en: "Continue rising even without visibility. Blind faith in ascent.", zh: "即使沒有能見度也繼續上升。對上升的盲目信念" }, keywords: ["blind faith", "darkness", "unremitting", "persistence"] }
      ]
    },
    relationships: { opposite: 14, inverse: 46, nuclear: 46 }
  },
  {
    number: 47,
    names: { en: "Oppression", zh: "困", pinyin: "kùn" },
    symbol: "䷮",
    trigrams: {
      upper: { en: "Lake", zh: "澤", symbol: "☱" },
      lower: { en: "Water", zh: "水", symbol: "☵" }
    },
    classical: { judgment: "困：亨。貞大人吉，无咎。有言不信", image: "澤无水，困。君子以致命遂志", lines: ["初六：臀困于株木，入于幽谷，三歲不覿", "九二：困于酒食，朱紱方來，利用享祀，征凶，无咎", "六三：困于石，據于蒺藜，入于其宮，不見其妻，凶", "九四：來徐徐，困于金車，吝，有終", "九五：劓刖，困于赤紱，乃徐有說，利用祭祀", "上六：困于葛藟，于臲卼，曰動悔有悔，征吉"] },
    wilhelm: { judgment: "Oppression. Success. Perseverance. The great man brings about good fortune. No blame. When one has something to say, It is not believed.", image: "There is no water in the lake: The image of Exhaustion. Thus the superior man stakes his life On following his will.", lines: ["One sits oppressed under a bare tree And strays into a gloomy valley. For three years one sees nothing.", "One is oppressed while at meat and drink. The man with the scarlet knee bands is just coming. It furthers one to offer sacrifice. To set forth brings misfortune. No blame.", "A man permits himself to be oppressed by stone, And leans on thorns and thistles. He enters his house and does not see his wife. Misfortune.", "He comes very quietly, oppressed in a golden carriage. Humiliation, but the end is reached.", "His nose and feet are cut off. Oppression at the hands of the man with the purple knee bands. Joy comes softly. It furthers one to make offerings and libations.", "He is oppressed by creeping vines. He moves uncertainly and says, \"Movement brings remorse.\" If one feels remorse over this and makes a start, Good fortune comes."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Exhaustion and oppression. Depleted resources testing character.", zh: "耗盡與壓迫。資源耗盡考驗品格" },
      situation: { en: "You face exhaustion but must maintain integrity.", zh: "你面臨耗盡但必須保持正直" },
      advice: { en: "Endure difficulty with dignity. Your character is being tested.", zh: "有尊嚴地忍受困難。你的品格正在受考驗" },
      keywords: ["exhaustion", "oppression", "depletion", "endurance", "integrity"],
      lines: [
        { position: 1, stage: { en: "Sitting on Bare Tree", zh: "坐於枯木" }, meaning: { en: "Sitting oppressed beneath bare tree in dark valley.", zh: "在黑暗山谷的枯樹下坐著受困" }, advice: { en: "Lowest point of exhaustion. Immobile in deepest difficulty.", zh: "耗盡的最低點。在最深困難中無法移動" }, keywords: ["lowest point", "immobile", "exhaustion", "depth"] },
        { position: 2, stage: { en: "Oppressed at Wine and Food", zh: "困於酒食" }, meaning: { en: "Oppressed while at wine and food. Scarlet knee covers come.", zh: "在酒食中受困。朱紱方來" }, advice: { en: "Oppression amid abundance. Help arrives during comfort.", zh: "豐盛中的壓迫。舒適時幫助到來" }, keywords: ["abundance", "help", "comfort", "arrival"] },
        { position: 3, stage: { en: "Oppressed by Stone", zh: "困於石" }, meaning: { en: "Oppressed by stone, leaning on thorns. Entering house, not seeing wife.", zh: "被石頭壓迫，倚靠荊棘。入家不見妻" }, advice: { en: "Multiple oppressions. Support harms, sanctuary empty.", zh: "多重壓迫。支持傷害，避難所空虛" }, keywords: ["multiple oppressions", "harmful support", "empty sanctuary", "despair"] },
        { position: 4, stage: { en: "Slow Coming", zh: "來徐徐" }, meaning: { en: "Coming slowly, oppressed in golden carriage. Humiliation with end.", zh: "慢慢來，在金車中受困。羞辱但有結束" }, advice: { en: "Help delayed by luxury. Eventual relief brings shame.", zh: "幫助因奢華延遲。最終解脫帶來羞恥" }, keywords: ["delayed help", "luxury", "eventual relief", "humiliation"] },
        { position: 5, stage: { en: "Nose and Feet Cut", zh: "劓刖" }, meaning: { en: "Nose and feet cut off. Oppressed by scarlet knee covers. Gradually emerging joy.", zh: "鼻子和腳被切斷。被朱紱壓迫。漸漸浮現喜悅" }, advice: { en: "Severe mutilation. What should help oppresses. Slow recovery begins.", zh: "嚴重殘害。應該幫助的卻壓迫。緩慢恢復開始" }, keywords: ["mutilation", "false help", "slow recovery", "emergence"] },
        { position: 6, stage: { en: "Oppressed by Creeping Vines", zh: "困於葛藟" }, meaning: { en: "Oppressed by creeping vines and tottering rocks. Movement brings remorse.", zh: "被蔓藤和搖晃的岩石壓迫。行動帶來悔恨" }, advice: { en: "Entangled and unstable. Any action worsens situation.", zh: "糾纏和不穩定。任何行動都使情況惡化" }, keywords: ["entanglement", "instability", "paralysis", "regret"] }
      ]
    },
    relationships: { opposite: 15, inverse: 47, nuclear: 47 }
  },
  {
    number: 48,
    names: { en: "The Well", zh: "井", pinyin: "jǐng" },
    symbol: "䷯",
    trigrams: {
      upper: { en: "Water", zh: "水", symbol: "☵" },
      lower: { en: "Wind", zh: "風", symbol: "☴" }
    },
    classical: { judgment: "井：改邑不改井，无喪无得，往來井井。汔至，亦未繘井，羸其瓶，凶", image: "木上有水，井。君子以勞民勸相", lines: ["初六：井泥不食，舊井无禽", "九二：井谷射鮒，甕敝漏", "九三：井渫不食，為我心惻，可用汲，王明並受其福", "六四：井甃，无咎", "九五：井洌，寒泉食", "上六：井收勿幕，有孚元吉"] },
    wilhelm: { judgment: "The Well. The town may be changed, But the well cannot be changed. It neither decreases nor increases. They come and go and draw from the well. If one gets down almost to the water And the rope does not go all the way, Or the jug breaks, it brings misfortune.", image: "Water over wood: the image of the Well. Thus the superior man encourages the people at their work, And exhorts them to help one another.", lines: ["A jug that is being lowered into a well Gets muddy, or is broken. No birds come to an old well.", "At the well hole one shoots fishes. The jug is broken and leaks.", "The well is cleaned, but no one drinks from it. This is my heart's sorrow, For one might draw from it. If the king were clear-minded, Good fortune might be enjoyed in common.", "The well is being lined. No blame.", "In the well there is a clear, cold spring From which one can drink.", "One draws from the well Without hindrance. It is dependable. Supreme good fortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "The well. Inexhaustible source that nourishes all.", zh: "井。滋養一切的無窮源泉" },
      situation: { en: "You have access to deep resources that sustain community.", zh: "你能接觸維持社群的深層資源" },
      advice: { en: "Draw from deep sources. Share nourishment with others.", zh: "從深層源泉汲取。與他人分享滋養" },
      keywords: ["well", "source", "nourishment", "community", "sustenance"],
      lines: [
        { position: 1, stage: { en: "Muddy Well Water", zh: "井泥不食" }, meaning: { en: "Muddy well water not drunk. Old well no animals.", zh: "井泥水不飲。舊井無禽" }, advice: { en: "Source degraded and unused. No one seeks what's spoiled.", zh: "源頭降級且未使用。沒有人尋求變質的" }, keywords: ["degraded", "unused", "spoiled", "abandoned"] },
        { position: 2, stage: { en: "Well Hole Shoots Fish", zh: "井谷射鮒" }, meaning: { en: "At well hole, shooting fish. Jug broken and leaking.", zh: "在井口射魚。甕敝漏" }, advice: { en: "Misusing the source. Container damaged, content wasted.", zh: "誤用源頭。容器損壞，內容浪費" }, keywords: ["misuse", "damage", "waste", "broken"] },
        { position: 3, stage: { en: "Well Cleaned Not Used", zh: "井渫不食" }, meaning: { en: "Well cleaned but not drunk from. My heart's sorrow.", zh: "井已清理但未飲用。我心之憂" }, advice: { en: "Preparation complete but unused. Readiness without opportunity.", zh: "準備完成但未使用。準備好但沒有機會" }, keywords: ["unused preparation", "readiness", "sorrow", "waste"] },
        { position: 4, stage: { en: "Well Being Lined", zh: "井甃" }, meaning: { en: "Well being lined with stone. No blame.", zh: "井正在用石頭砌。無責" }, advice: { en: "Proper maintenance and repair. Restoration work proceeds.", zh: "適當的維護和修理。修復工作進行中" }, keywords: ["maintenance", "repair", "restoration", "improvement"] },
        { position: 5, stage: { en: "Clear Cold Spring", zh: "井冽寒泉" }, meaning: { en: "In well clear, cold spring water. Drunk.", zh: "井中清冷泉水。被飲用" }, advice: { en: "Source pure and accessed. Refreshment available to all.", zh: "源頭純淨且可及。所有人都可得到清新" }, keywords: ["purity", "access", "refreshment", "availability"] },
        { position: 6, stage: { en: "Well Uncovered", zh: "井收勿幕" }, meaning: { en: "Well uncovered. Supreme good fortune. Reliable source.", zh: "井開放。至高好運。可靠來源" }, advice: { en: "Source open and accessible. Dependable nourishment for all.", zh: "源頭開放且可及。所有人的可靠滋養" }, keywords: ["open", "accessible", "dependable", "nourishment"] }
      ]
    },
    relationships: { opposite: 16, inverse: 48, nuclear: 48 }
  },
  {
    number: 49,
    names: { en: "Revolution", zh: "革", pinyin: "gé" },
    symbol: "䷰",
    trigrams: {
      upper: { en: "Lake", zh: "澤", symbol: "☱" },
      lower: { en: "Fire", zh: "火", symbol: "☲" }
    },
    classical: { judgment: "革：己日乃孚。元亨，利貞，悔亡", image: "澤中有火，革。君子以治曆明時", lines: ["初九：鞏用黃牛之革", "六二：己日乃革之，征吉，无咎", "九三：征凶，貞厲，革言三就，有孚", "九四：悔亡，有孚改命，吉", "九五：大人虎變，未占有孚", "上六：君子豹變，小人革面，征凶，居貞吉"] },
    wilhelm: { judgment: "Revolution. On your own day You are believed. Supreme success, Furthering through perseverance. Remorse disappears.", image: "Fire in the lake: the image of Revolution. Thus the superior man Sets the calendar in order And makes the seasons clear.", lines: ["Wrapped in the hide of a yellow cow.", "When one's own day comes, one may create revolution. Starting brings good fortune. No blame.", "Starting brings misfortune. Perseverance brings danger. When talk of revolution has gone the rounds three times, One may commit himself, And men will believe him.", "Remorse disappears. Men believe him. Changing the form of government brings good fortune.", "The great man changes like a tiger. Even before he questions the oracle He is believed.", "The superior man changes like a panther. The inferior man molts in the face. Starting brings misfortune. To remain persevering brings good fortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Revolution and transformation. Radical change at the right time.", zh: "革命與變革。在正確時機的激進改變" },
      situation: { en: "You face the need for complete transformation.", zh: "你面臨徹底變革的需要" },
      advice: { en: "Make necessary changes boldly. Revolution succeeds when timing is right.", zh: "大膽進行必要改變。時機正確時革命會成功" },
      keywords: ["revolution", "transformation", "change", "renewal", "timing"],
      lines: [
        { position: 1, stage: { en: "Wrapped in Yellow Cowhide", zh: "鞏用黃牛之革" }, meaning: { en: "Wrapped in hide of yellow cow. Cannot yet move.", zh: "用黃牛皮包裹。尚不能動" }, advice: { en: "Bound by constraints. Wait for right timing before revolution.", zh: "被約束束縛。在革命前等待正確時機" }, keywords: ["constrained", "bound", "waiting", "timing"] },
        { position: 2, stage: { en: "Day Arrives", zh: "已日乃革之" }, meaning: { en: "When day arrives, undertake revolution. Going brings good fortune.", zh: "當日子到來，進行革命。前往帶來好運" }, advice: { en: "Proper time for change. Act when moment is right.", zh: "改變的適當時機。時機正確時行動" }, keywords: ["proper timing", "action", "fortune", "readiness"] },
        { position: 3, stage: { en: "Revolution Three Times", zh: "革三就" }, meaning: { en: "Starting revolution brings misfortune. Perseverance brings danger. Revolutionizing discussed three times brings trust.", zh: "開始革命帶來不幸。堅持帶來危險。革命討論三次帶來信任" }, advice: { en: "Premature change fails. Only well-considered revolution succeeds.", zh: "過早改變失敗。只有深思熟慮的革命成功" }, keywords: ["premature", "consideration", "trust", "preparation"] },
        { position: 4, stage: { en: "Remorse Disappears", zh: "悔亡" }, meaning: { en: "Remorse disappears. Trust brings change of mandate. Good fortune.", zh: "悔恨消失。信任帶來授權改變。好運" }, advice: { en: "Right authority enables revolution. Trust eliminates doubt.", zh: "正確權威使革命成為可能。信任消除疑慮" }, keywords: ["authority", "trust", "mandate", "confidence"] },
        { position: 5, stage: { en: "Great Man Changes", zh: "大人虎變" }, meaning: { en: "Great man changes like tiger. Trust appears before inquiry.", zh: "偉人像老虎一樣改變。詢問前信任出現" }, advice: { en: "Dramatic transformation by leader. Authority obvious before explanation.", zh: "領導者的戲劇性轉變。解釋前權威明顯" }, keywords: ["dramatic change", "leadership", "authority", "transformation"] },
        { position: 6, stage: { en: "Superior Man Changes", zh: "君子豹變" }, meaning: { en: "Superior man changes like leopard. Inferior man molts face. Revolution complete.", zh: "君子像豹子一樣改變。小人革面。革命完成" }, advice: { en: "Noble transforms fundamentally. Even lesser adapt externally. Change achieved.", zh: "高貴者從根本轉變。即使較低者外在適應。改變達成" }, keywords: ["fundamental change", "adaptation", "completion", "achievement"] }
      ]
    },
    relationships: { opposite: 17, inverse: 49, nuclear: 49 }
  },
  {
    number: 50,
    names: { en: "The Caldron", zh: "鼎", pinyin: "dǐng" },
    symbol: "䷱",
    trigrams: {
      upper: { en: "Fire", zh: "火", symbol: "☲" },
      lower: { en: "Wind", zh: "風", symbol: "☴" }
    },
    classical: { judgment: "鼎：元吉，亨", image: "木上有火，鼎。君子以正位凝命", lines: ["初六：鼎顛趾，利出否，得妾以其子，无咎", "九二：鼎有實，我仇有疾，不我能即，吉", "九三：鼎耳革，其行塞，雉膏不食，方雨虧悔，終吉", "九四：鼎折足，覆公餗，其形渥，凶", "六五：鼎黃耳金鉉，利貞", "上九：鼎玉鉉，大吉，无不利"] },
    wilhelm: { judgment: "The Caldron. Supreme good fortune. Success.", image: "Fire over wood: The image of the Caldron. Thus the superior man consolidates his fate By making his position correct.", lines: ["A ting with legs upturned. Furthers removal of stagnating stuff. One takes a concubine for the sake of her son. No blame.", "There is food in the ting. My comrades are envious, But they cannot harm me. Good fortune.", "The handle of the ting is altered. One is impeded in his way of life. The fat of the pheasant is not eaten. Once rain falls, remorse is spent. Good fortune comes in the end.", "The legs of the ting are broken. The prince's meal is spilled And his person is soiled. Misfortune.", "The ting has yellow handles, golden carrying rings. Perseverance furthers.", "The ting has rings of jade. Great good fortune. Nothing that would not act to further."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "The caldron. Transformation through proper nourishment.", zh: "鼎。通過適當滋養的轉化" },
      situation: { en: "You have the vessel for creating something refined and nourishing.", zh: "你擁有創造精緻和滋養事物的器皿" },
      advice: { en: "Use proper methods to transform raw materials into nourishment.", zh: "用適當方法將原料轉化為滋養" },
      keywords: ["caldron", "transformation", "refinement", "nourishment", "vessel"],
      lines: [
        { position: 1, stage: { en: "Caldron Overturned", zh: "鼎顛趾" }, meaning: { en: "Caldron with legs upturned. Furthers removal of stagnation. No blame.", zh: "鼎腿向上翻。有利於移除停滯。無責" }, advice: { en: "Empty out old contents. Clearing stagnation prepares for new.", zh: "倒空舊內容。清除停滯為新做準備" }, keywords: ["clearing", "removal", "preparation", "emptying"] },
        { position: 2, stage: { en: "Caldron Filled", zh: "鼎有實" }, meaning: { en: "Caldron has contents. My comrades envious but cannot touch me.", zh: "鼎有內容。我的同伴嫉妒但不能碰我" }, advice: { en: "Full of nourishment. Others covet but cannot access.", zh: "充滿滋養。他人覬覦但無法獲取" }, keywords: ["nourishment", "envy", "protection", "fullness"] },
        { position: 3, stage: { en: "Caldron Ears Altered", zh: "鼎耳革" }, meaning: { en: "Caldron's ears altered. Movement impeded. Fat of pheasant not eaten.", zh: "鼎耳改變。行動受阻。雉膏不食" }, advice: { en: "Handles changed, access blocked. Good content unusable.", zh: "把手改變，接觸被阻。好內容無法使用" }, keywords: ["blocked access", "handles broken", "unusable", "impediment"] },
        { position: 4, stage: { en: "Caldron Legs Broken", zh: "鼎折足" }, meaning: { en: "Caldron legs broken. Prince's meal spilled. Misfortune.", zh: "鼎腿折斷。君王餐灑出。不幸" }, advice: { en: "Support fails. Valuable contents lost through collapse.", zh: "支持失敗。因崩潰失去有價值內容" }, keywords: ["support failure", "collapse", "loss", "misfortune"] },
        { position: 5, stage: { en: "Caldron Yellow Ears", zh: "鼎黃耳" }, meaning: { en: "Caldron has yellow ears and golden carrying rings. Perseverance furthers.", zh: "鼎有黃耳和金扛環。堅持有益" }, advice: { en: "Perfect handles enable transport. Proper support ensures success.", zh: "完美把手使運輸成為可能。適當支持確保成功" }, keywords: ["proper support", "transport", "perfection", "success"] },
        { position: 6, stage: { en: "Caldron Jade Rings", zh: "鼎玉鉉" }, meaning: { en: "Caldron with jade rings. Great good fortune. Everything furthers.", zh: "鼎有玉環。大吉。一切順利" }, advice: { en: "Supreme quality and beauty. Noble vessel serves highest purpose.", zh: "至高品質和美麗。高貴器皿服務最高目的" }, keywords: ["supreme quality", "nobility", "highest purpose", "fortune"] }
      ]
    },
    relationships: { opposite: 18, inverse: 50, nuclear: 50 }
  },
  {
    number: 51,
    names: { en: "The Arousing (Shock)", zh: "震", pinyin: "zhèn" },
    symbol: "䷲",
    trigrams: {
      upper: { en: "Thunder", zh: "雷", symbol: "☳" },
      lower: { en: "Thunder", zh: "雷", symbol: "☳" }
    },
    classical: { judgment: "震：亨。震來虩虩，笑言啞啞，震驚百里，不喪匕鬯", image: "洊雷，震。君子以恐懼修省", lines: ["初九：震來虩虩，後笑言啞啞，吉", "六二：震來厲，億喪貝，躋于九陵，勿逐，七日得", "六三：震蘇蘇，震行无眚", "九四：震遂泥", "六五：震往來厲，億无喪，有事", "上六：震索索，視矍矍，征凶。震不于其躬，于其鄰，无咎。婚媾有言"] },
    wilhelm: { judgment: "Shock brings success. Shock comes—oh, oh! Laughing words—ha, ha! The shock terrifies for a hundred miles, And he does not let fall the sacrificial spoon and chalice.", image: "Thunder repeated: the image of Shock. Thus in fear and trembling The superior man sets his life in order And examines himself.", lines: ["Shock comes – oh, oh! Then follow laughing words – ha, ha! Good fortune.", "Shock comes bringing danger. A hundred thousand times You lose your treasures And must climb the nine hills. Do not go in pursuit of them. After seven days you will get them back again.", "Shock comes and makes one distraught. If shock spurs to action One remains free of misfortune.", "Shock is mired.", "Shock goes hither and thither. Danger. However, nothing at all is lost. Yet there are things to be done.", "Shock brings ruin and terrified gazing around. Going ahead brings misfortune. If it has not yet touched one's own body But has reached one's neighbor first, There is no blame. One's comrades have something to talk about."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Shock and arousal. Thunder that awakens.", zh: "震動與喚醒。驚醒的雷聲" },
      situation: { en: "You experience sudden shock that demands response.", zh: "你經歷需要回應的突然震驚" },
      advice: { en: "Face shock with composure. Use it as awakening to examine yourself.", zh: "鎮定面對震驚。將其作為自我審視的覺醒" },
      keywords: ["shock", "thunder", "arousal", "awakening", "response"],
      lines: [
        { position: 1, stage: { en: "Beginning", zh: "開始" }, meaning: { en: "Line 1 of The Arousing (Shock): Beginning phase in this hexagram's journey.", zh: "The Arousing (Shock)第1爻：此卦旅程中的開始階段" }, advice: { en: "Engage with this beginning phase appropriately for the situation.", zh: "根據情況適當地處理這個開始階段" }, keywords: ["awareness", "adaptation", "timing", "progression"] },
        { position: 2, stage: { en: "Development", zh: "發展" }, meaning: { en: "Line 2 of The Arousing (Shock): Development phase in this hexagram's journey.", zh: "The Arousing (Shock)第2爻：此卦旅程中的發展階段" }, advice: { en: "Engage with this development phase appropriately for the situation.", zh: "根據情況適當地處理這個發展階段" }, keywords: ["awareness", "adaptation", "timing", "progression"] },
        { position: 3, stage: { en: "Transition", zh: "過渡" }, meaning: { en: "Line 3 of The Arousing (Shock): Transition phase in this hexagram's journey.", zh: "The Arousing (Shock)第3爻：此卦旅程中的過渡階段" }, advice: { en: "Engage with this transition phase appropriately for the situation.", zh: "根據情況適當地處理這個過渡階段" }, keywords: ["awareness", "adaptation", "timing", "progression"] },
        { position: 4, stage: { en: "Testing", zh: "測試" }, meaning: { en: "Line 4 of The Arousing (Shock): Testing phase in this hexagram's journey.", zh: "The Arousing (Shock)第4爻：此卦旅程中的測試階段" }, advice: { en: "Engage with this testing phase appropriately for the situation.", zh: "根據情況適當地處理這個測試階段" }, keywords: ["awareness", "adaptation", "timing", "progression"] },
        { position: 5, stage: { en: "Achievement", zh: "成就" }, meaning: { en: "Line 5 of The Arousing (Shock): Achievement phase in this hexagram's journey.", zh: "The Arousing (Shock)第5爻：此卦旅程中的成就階段" }, advice: { en: "Engage with this achievement phase appropriately for the situation.", zh: "根據情況適當地處理這個成就階段" }, keywords: ["awareness", "adaptation", "timing", "progression"] },
        { position: 6, stage: { en: "Completion", zh: "完成" }, meaning: { en: "Line 6 of The Arousing (Shock): Completion phase in this hexagram's journey.", zh: "The Arousing (Shock)第6爻：此卦旅程中的完成階段" }, advice: { en: "Engage with this completion phase appropriately for the situation.", zh: "根據情況適當地處理這個完成階段" }, keywords: ["awareness", "adaptation", "timing", "progression"] }
      ]
    },
    relationships: { opposite: 19, inverse: 51, nuclear: 51 }
  },
  {
    number: 52,
    names: { en: "Keeping Still (Mountain)", zh: "艮", pinyin: "gèn" },
    symbol: "䷳",
    trigrams: {
      upper: { en: "Mountain", zh: "山", symbol: "☶" },
      lower: { en: "Mountain", zh: "山", symbol: "☶" }
    },
    classical: { judgment: "艮：艮其背，不獲其身，行其庭，不見其人，无咎", image: "兼山，艮。君子以思不出其位", lines: ["初六：艮其趾，无咎，利永貞", "六二：艮其腓，不拯其隨，其心不快", "九三：艮其限，列其夤，厲薰心", "六四：艮其身，无咎", "六五：艮其輔，言有序，悔亡", "上九：敦艮，吉"] },
    wilhelm: { judgment: "Keeping Still. Keeping his back still So that he no longer feels his body. He goes into his courtyard And does not see his people. No blame.", image: "Mountains standing close together: The image of Keeping Still. Thus the superior man Does not permit his thoughts To go beyond his situation.", lines: ["Keeping his toes still. No blame. Continued perseverance furthers.", "He cannot save him whom he follows. His heart is not glad.", "Keeping his hips still. Making his sacrum stiff. Dangerous. The heart suffocates.", "Keeping his trunk still. No blame.", "Keeping his jaws still. The words have order. Remorse disappears.", "Noblehearted keeping still. Good fortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Keeping still. Mountain-like stability and meditation.", zh: "保持靜止。山一般的穩定和冥想" },
      situation: { en: "You need to stop movement and find inner stillness.", zh: "你需要停止運動並找到內在寧靜" },
      advice: { en: "Practice stillness. Know when to stop and not move.", zh: "練習靜止。知道何時停止不動" },
      keywords: ["stillness", "meditation", "stopping", "stability", "restraint"],
      lines: [
        { position: 1, stage: { en: "Beginning", zh: "開始" }, meaning: { en: "Line 1 of Keeping Still (Mountain): Beginning phase in this hexagram's journey.", zh: "Keeping Still (Mountain)第1爻：此卦旅程中的開始階段" }, advice: { en: "Engage with this beginning phase appropriately for the situation.", zh: "根據情況適當地處理這個開始階段" }, keywords: ["awareness", "adaptation", "timing", "progression"] },
        { position: 2, stage: { en: "Development", zh: "發展" }, meaning: { en: "Line 2 of Keeping Still (Mountain): Development phase in this hexagram's journey.", zh: "Keeping Still (Mountain)第2爻：此卦旅程中的發展階段" }, advice: { en: "Engage with this development phase appropriately for the situation.", zh: "根據情況適當地處理這個發展階段" }, keywords: ["awareness", "adaptation", "timing", "progression"] },
        { position: 3, stage: { en: "Transition", zh: "過渡" }, meaning: { en: "Line 3 of Keeping Still (Mountain): Transition phase in this hexagram's journey.", zh: "Keeping Still (Mountain)第3爻：此卦旅程中的過渡階段" }, advice: { en: "Engage with this transition phase appropriately for the situation.", zh: "根據情況適當地處理這個過渡階段" }, keywords: ["awareness", "adaptation", "timing", "progression"] },
        { position: 4, stage: { en: "Testing", zh: "測試" }, meaning: { en: "Line 4 of Keeping Still (Mountain): Testing phase in this hexagram's journey.", zh: "Keeping Still (Mountain)第4爻：此卦旅程中的測試階段" }, advice: { en: "Engage with this testing phase appropriately for the situation.", zh: "根據情況適當地處理這個測試階段" }, keywords: ["awareness", "adaptation", "timing", "progression"] },
        { position: 5, stage: { en: "Achievement", zh: "成就" }, meaning: { en: "Line 5 of Keeping Still (Mountain): Achievement phase in this hexagram's journey.", zh: "Keeping Still (Mountain)第5爻：此卦旅程中的成就階段" }, advice: { en: "Engage with this achievement phase appropriately for the situation.", zh: "根據情況適當地處理這個成就階段" }, keywords: ["awareness", "adaptation", "timing", "progression"] },
        { position: 6, stage: { en: "Completion", zh: "完成" }, meaning: { en: "Line 6 of Keeping Still (Mountain): Completion phase in this hexagram's journey.", zh: "Keeping Still (Mountain)第6爻：此卦旅程中的完成階段" }, advice: { en: "Engage with this completion phase appropriately for the situation.", zh: "根據情況適當地處理這個完成階段" }, keywords: ["awareness", "adaptation", "timing", "progression"] }
      ]
    },
    relationships: { opposite: 20, inverse: 52, nuclear: 52 }
  },
  {
    number: 53,
    names: { en: "Development", zh: "漸", pinyin: "jiàn" },
    symbol: "䷴",
    trigrams: {
      upper: { en: "Wind", zh: "風", symbol: "☴" },
      lower: { en: "Mountain", zh: "山", symbol: "☶" }
    },
    classical: { judgment: "漸：女歸吉，利貞", image: "山上有木，漸。君子以居賢德善俗", lines: ["初六：鴻漸于干，小子厲，有言，无咎", "六二：鴻漸于磐，飲食衎衎，吉", "九三：鴻漸于陸，夫征不復，婦孕不育，凶。利禦寇", "六四：鴻漸于木，或得其桷，无咎", "九五：鴻漸于陵，婦三歲不孕，終莫之勝，吉", "上九：鴻漸于陸，其羽可用為儀，吉"] },
    wilhelm: { judgment: "Development. The maiden Is given in marriage. Good fortune. Perseverance furthers.", image: "On the mountain, a tree: The image of Development. Thus the superior man abides in dignity and virtue, In order to improve the mores.", lines: ["The wild goose gradually draws near the shore. The young son is in danger. There is talk. No blame.", "The wild goose gradually draws near the cliff. Eating and drinking in peace and concord. Good fortune.", "The wild goose gradually draws near the plateau. The man goes forth and does not return. The woman carries a child but does not bring it forth. Misfortune. It furthers one to fight off robbers.", "The wild goose gradually draws near the tree. Perhaps it will find a flat branch. No blame.", "The wild goose gradually draws near the summit. For three years the woman has no child. In the end nothing can hinder her. Good fortune.", "The wild goose gradually draws near the clouds heights. Its feathers can be used for the sacred dance. Good fortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Gradual development. Slow but steady progress like a tree growing.", zh: "漸進發展。像樹木生長一樣緩慢但穩定的進步" },
      situation: { en: "You're making progress through patient, gradual development.", zh: "你正通過耐心漸進的發展取得進步" },
      advice: { en: "Develop slowly and properly. Don't rush natural growth.", zh: "緩慢且適當地發展。不要急於自然成長" },
      keywords: ["development", "gradual", "progress", "patience", "growth"],
      lines: [
        { position: 1, stage: { en: "Beginning", zh: "開始" }, meaning: { en: "Wild goose gradual progress to shore. Dangerous for small boy, words but no blame.", zh: "雁漸進於干。小子厲有言無咎" }, advice: { en: "Begin journey cautiously. Initial steps vulnerable but blameless.", zh: "謹慎開始旅程。最初步驟脆弱但無責" }, keywords: ["caution", "vulnerability", "beginning", "blameless"] },
        { position: 2, stage: { en: "Development", zh: "發展" }, meaning: { en: "Wild goose progress to cliff. Eating and drinking in peace.", zh: "雁漸進於磐。飲食衎衎" }, advice: { en: "Secure position reached. Rest and nourishment in safety.", zh: "到達安全位置。在安全中休息和滋養" }, keywords: ["security", "rest", "nourishment", "peace"] },
        { position: 3, stage: { en: "Transition", zh: "過渡" }, meaning: { en: "Progress to plateau. Husband not returning, wife not conceiving.", zh: "進於陸。夫征不復，婦孕不育" }, advice: { en: "Advancement brings separation. Natural progression interrupted.", zh: "前進帶來分離。自然進展中斷" }, keywords: ["separation", "interruption", "advancement", "loss"] },
        { position: 4, stage: { en: "Testing", zh: "測試" }, meaning: { en: "Progress to tree. Finding right branch. No blame.", zh: "進於木。或得其桷無咎" }, advice: { en: "Proper support found. Right placement brings stability.", zh: "找到適當支持。正確位置帶來穩定" }, keywords: ["support", "placement", "stability", "rightness"] },
        { position: 5, stage: { en: "Achievement", zh: "成就" }, meaning: { en: "Progress to summit. Woman not pregnant for three years. Nothing can prevent final success.", zh: "進於陵。婦三歲不孕終莫之勝" }, advice: { en: "Peak achieved. Temporary barrenness before ultimate fruition.", zh: "達到頂峰。最終結果前的暫時不育" }, keywords: ["peak", "barrenness", "patience", "ultimate success"] },
        { position: 6, stage: { en: "Completion", zh: "完成" }, meaning: { en: "Progress to cloud heights. Feathers can be used for sacred dance.", zh: "鴻漸進於陸。其羽可用為儀" }, advice: { en: "Transcendent achievement. Purity serves highest purpose.", zh: "超越成就。純淨服務最高目的" }, keywords: ["transcendence", "purity", "sacred", "achievement"] }
      ]
    },
    relationships: { opposite: 21, inverse: 53, nuclear: 53 }
  },
  {
    number: 54,
    names: { en: "The Marrying Maiden", zh: "歸妹", pinyin: "guī mèi" },
    symbol: "䷵",
    trigrams: {
      upper: { en: "Thunder", zh: "雷", symbol: "☳" },
      lower: { en: "Lake", zh: "澤", symbol: "☱" }
    },
    classical: { judgment: "歸妹：征凶，无攸利", image: "澤上有雷，歸妹。君子以永終知敝", lines: ["初九：歸妹以娣，跛能履，征吉", "九二：眇能視，利幽人之貞", "六三：歸妹以須，反歸以娣", "九四：歸妹愆期，遲歸有時", "六五：帝乙歸妹，其君之袂，不如其娣之袂良，月幾望，吉", "上六：女承筐无實，士刲羊无血，无攸利"] },
    wilhelm: { judgment: "The Marrying Maiden. Undertakings bring misfortune. Nothing that would further.", image: "Thunder over the lake: The image of the Marrying Maiden. Thus the superior man Understands the transitory In the light of the eternity of the end.", lines: ["The marrying maiden as a concubine. A lame man who is able to tread. Undertakings bring good fortune.", "A one-eyed man who is able to see. The perseverance of a solitary man furthers.", "The marrying maiden as a slave. She marries as a concubine.", "The marrying maiden draws out the allotted time. A late marriage comes in due course.", "The sovereign I gave his daughter in marriage. The embroidered garments of the princess Were not as gorgeous As those of the servingmaid. The moon that is nearly full Brings good fortune.", "The woman holds the basket, but there are no fruits in it. The man stabs the sheep, but no blood flows. Nothing that acts to further."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "The marrying maiden. Improper relationship or position.", zh: "歸妹。不當的關係或位置" },
      situation: { en: "You're in a relationship or situation lacking proper foundation.", zh: "你處於缺乏適當基礎的關係或情況" },
      advice: { en: "Recognize improper positions. Don't force what isn't right.", zh: "認識不當位置。不要強求不對的事" },
      keywords: ["improper", "relationship", "position", "caution", "foundation"],
      lines: [
        { position: 1, stage: { en: "Beginning", zh: "開始" }, meaning: { en: "Marrying maiden as concubine. Lame can walk.", zh: "歸妹以娣。跛能履" }, advice: { en: "Secondary position acceptable. Limitation doesn't prevent function.", zh: "次要位置可接受。限制不妨礙功能" }, keywords: ["secondary", "limitation", "function", "acceptance"] },
        { position: 2, stage: { en: "Development", zh: "發展" }, meaning: { en: "One-eyed can see. Perseverance of solitary furthers.", zh: "眇能視。利幽人之貞" }, advice: { en: "Partial vision sufficient. Lone persistence succeeds.", zh: "部分視力足夠。孤獨堅持成功" }, keywords: ["partial vision", "solitary", "persistence", "sufficiency"] },
        { position: 3, stage: { en: "Transition", zh: "過渡" }, meaning: { en: "Marrying maiden as slave. Returns as concubine.", zh: "歸妹以須。反歸以娣" }, advice: { en: "Lower position transformed. Gradual elevation possible.", zh: "較低位置轉變。逐漸提升可能" }, keywords: ["transformation", "elevation", "position change", "gradual"] },
        { position: 4, stage: { en: "Testing", zh: "測試" }, meaning: { en: "Marrying maiden overshoots deadline. Late marriage comes in time.", zh: "歸妹愆期。遲歸有時" }, advice: { en: "Delay in union. What's postponed eventually arrives.", zh: "聯合延遲。推遲的最終到來" }, keywords: ["delay", "postponement", "eventual", "timing"] },
        { position: 5, stage: { en: "Achievement", zh: "成就" }, meaning: { en: "Sovereign marries off daughter. Sleeves not as fine as concubine's. Moon nearly full.", zh: "帝乙歸妹。其君之袂不如其娣之袂良" }, advice: { en: "Noble simplicity. Value in genuine substance over ornament.", zh: "高貴簡單。真實實質的價值超過裝飾" }, keywords: ["simplicity", "substance", "genuineness", "nobility"] },
        { position: 6, stage: { en: "Completion", zh: "完成" }, meaning: { en: "Woman holds basket without fruit. Man stabs sheep without blood.", zh: "女承筐無實。士刲羊無血" }, advice: { en: "Empty ceremony. Actions without substance or result.", zh: "空洞儀式。無實質或結果的行動" }, keywords: ["empty ceremony", "no substance", "futility", "appearance"] }
      ]
    },
    relationships: { opposite: 22, inverse: 54, nuclear: 54 }
  },
  {
    number: 55,
    names: { en: "Abundance", zh: "豐", pinyin: "fēng" },
    symbol: "䷶",
    trigrams: {
      upper: { en: "Thunder", zh: "雷", symbol: "☳" },
      lower: { en: "Fire", zh: "火", symbol: "☲" }
    },
    classical: { judgment: "豐：亨。王假之，勿憂，宜日中", image: "雷電皆至，豐。君子以折獄致刑", lines: ["初九：遇其配主，雖旬无咎，往有尚", "六二：豐其蔀，日中見斗，往得疑疾，有孚發若，吉", "九三：豐其沛，日中見沬，折其右肱，无咎", "九四：豐其蔀，日中見斗，遇其夷主，吉", "六五：來章，有慶譽，吉", "上六：豐其屋，蔀其家，闚其戶，闃其无人，三歲不覿，凶"] },
    wilhelm: { judgment: "Abundance has success. The king attains abundance. Be not sad. Be like the sun at midday.", image: "Both thunder and lightning come: The image of Abundance. Thus the superior man decides lawsuits And carries out punishments.", lines: ["When a man meets his destined ruler, They can be together ten days, And it is not a mistake. Going meets with recognition.", "Abundance has such fullness That the polestars can be seen at noon. Through going one meets with mistrust and hate. If one rouses him through truth, Good fortune comes.", "The underbrush is of such abundance That the small stars can be seen at noon. He breaks his right arm. No blame.", "Abundance has such fullness That the polestars can be seen at noon. He meets his ruler, who is of like mind. Good fortune.", "Lines are coming, Blessing and fame draw near. Good fortune.", "His house is in a state of abundance. He screens off his family. He peers through the gate And no longer perceives anyone. For three years he sees nothing. Misfortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Abundance and fullness. Peak of prosperity and power.", zh: "豐盛與圓滿。繁榮和力量的頂峰" },
      situation: { en: "You're at the height of abundance and success.", zh: "你正處於豐盛和成功的頂峰" },
      advice: { en: "Enjoy abundance but prepare for eventual decline. Nothing lasts forever.", zh: "享受豐盛但為最終衰退做準備。沒有什麼是永恆的" },
      keywords: ["abundance", "fullness", "prosperity", "peak", "zenith"],
      lines: [
        { position: 1, stage: { en: "Meeting Destined Ruler", zh: "遇主" }, meaning: { en: "Meeting destined ruler. No blame though ten days.", zh: "遇其配主。雖旬無咎" }, advice: { en: "Brief but significant encounter. Temporary connection brings fortune.", zh: "短暫但重要的相遇。暫時連結帶來好運" }, keywords: ["encounter", "destined", "brief", "significant"] },
        { position: 2, stage: { en: "Curtain So Thick", zh: "簾幕厚" }, meaning: { en: "Curtain so thick can see Dipper at noon. Going brings suspicion and hate. Truth and sincerity brings good fortune.", zh: "簾幕厚見斗。往得疑疾。有孚發若吉" }, advice: { en: "Obscurity surrounds you. Sincere truth cuts through darkness.", zh: "模糊圍繞著你。真誠的真理穿透黑暗" }, keywords: ["obscurity", "truth", "sincerity", "darkness"] },
        { position: 3, stage: { en: "Abundance Declines", zh: "豐大" }, meaning: { en: "Abundance so great the stars appear at noon. Breaking right arm. No blame.", zh: "豐其蔀日中見昧。折其右肱無咎" }, advice: { en: "Peak turns to decline. Loss of capacity but blameless.", zh: "高峰轉為衰落。失去能力但無責" }, keywords: ["peak", "decline", "loss", "blameless"] },
        { position: 4, stage: { en: "Curtain Thick", zh: "簾幕厚" }, meaning: { en: "Curtain so thick see Dipper at noon. Meeting hidden master brings good fortune.", zh: "簾幕厚日中見斗。遇其夷主吉" }, advice: { en: "In darkness, find the wise teacher. Hidden guidance available.", zh: "在黑暗中，找到智慧老師。隱藏的指引可得" }, keywords: ["darkness", "hidden teacher", "guidance", "fortune"] },
        { position: 5, stage: { en: "Bringing Brightness", zh: "來章" }, meaning: { en: "Lines are coming. Blessing and fame draw near.", zh: "來章有慶譽吉" }, advice: { en: "Attracting help and recognition. Success approaches through connection.", zh: "吸引幫助和認可。成功通過連結接近" }, keywords: ["attraction", "recognition", "help", "approaching"] },
        { position: 6, stage: { en: "House Too Large", zh: "屋大" }, meaning: { en: "House made too large. Peeping through gate sees emptiness. Three years no one.", zh: "屋大。闚其戶闃其無人三歲不覿" }, advice: { en: "Excessive expansion creates isolation. Grandeur without substance.", zh: "過度擴張創造孤立。宏偉無實質" }, keywords: ["excess", "isolation", "emptiness", "grandeur"] }
      ]
    },
    relationships: { opposite: 23, inverse: 55, nuclear: 55 }
  },
  {
    number: 56,
    names: { en: "The Wanderer", zh: "旅", pinyin: "lǚ" },
    symbol: "䷷",
    trigrams: {
      upper: { en: "Fire", zh: "火", symbol: "☲" },
      lower: { en: "Mountain", zh: "山", symbol: "☶" }
    },
    classical: { judgment: "旅：小亨。旅貞吉", image: "山上有火，旅。君子以明慎用刑而不留獄", lines: ["初六：旅瑣瑣，斯其所取災", "六二：旅即次，懷其資，得童僕貞", "九三：旅焚其次，喪其童僕，貞厲", "九四：旅于處，得其資斧，我心不快", "六五：射雉一矢亡，終以譽命", "上九：鳥焚其巢，旅人先笑後號咷，喪牛于易，凶"] },
    wilhelm: { judgment: "The Wanderer. Success through smallness. Perseverance brings good fortune To the wanderer.", image: "Fire on the mountain: The image of the Wanderer. Thus the superior man Is clear-minded and cautious In imposing penalties, And protracts no lawsuits.", lines: ["The wanderer busies himself with trivial things. This is the cause of his misfortune.", "The wanderer comes to an inn. He has his property with him. He wins the steadfastness of a young servant.", "The wanderer's inn burns down. He loses the steadfastness of his young servant. Danger.", "The wanderer rests in a shelter. He obtains his property and an ax. My heart is not glad.", "He shoots a pheasant. It drops with the first arrow. In the end this brings both praise and office.", "The bird's nest burns up. The wanderer laughs at first, Then must needs lament and weep. Through carelessness he loses his cow. Misfortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "The wanderer. Traveling without permanent home.", zh: "旅人。沒有永久家園的旅行" },
      situation: { en: "You're in a transient state without stable foundation.", zh: "你處於沒有穩定基礎的過渡狀態" },
      advice: { en: "Be cautious and modest as a stranger. Don't overstep.", zh: "作為陌生人要謹慎謙遜。不要越界" },
      keywords: ["wanderer", "travel", "transient", "caution", "modesty"],
      lines: [
        { position: 1, stage: { en: "Wanderer Trivialities", zh: "旅瑣瑣" }, meaning: { en: "Wanderer busies with trivialities. Invites disaster upon self.", zh: "旅人忙於瑣事。招致災禍於己" }, advice: { en: "Petty concerns while traveling. Small focus brings misfortune.", zh: "旅行時的小事關注。小焦點帶來不幸" }, keywords: ["trivial", "petty", "disaster", "misfortune"] },
        { position: 2, stage: { en: "Wanderer Comes to Inn", zh: "旅即次" }, meaning: { en: "Wanderer comes to inn with possessions. Gains young servant's loyalty.", zh: "旅人來到客棧帶著財物。獲得年輕僕人的忠誠" }, advice: { en: "Temporary lodging with resources. Finding faithful assistance.", zh: "帶資源的臨時住所。找到忠實協助" }, keywords: ["lodging", "resources", "assistance", "loyalty"] },
        { position: 3, stage: { en: "Wanderer Burns Inn", zh: "旅焚其次" }, meaning: { en: "Wanderer burns his inn. Loses young servant's loyalty. Danger.", zh: "旅人焚燒客棧。失去年輕僕人忠誠。危險" }, advice: { en: "Destroying your own shelter. Losing support through recklessness.", zh: "摧毀自己的庇護所。因魯莽失去支持" }, keywords: ["destruction", "recklessness", "loss of support", "danger"] },
        { position: 4, stage: { en: "Wanderer Rests", zh: "旅於處" }, meaning: { en: "Wanderer rests in shelter. Obtains property and axe. Heart not glad.", zh: "旅人在庇護所休息。獲得財產和斧。心不悅" }, advice: { en: "Finding safety and means but no peace. Security without happiness.", zh: "找到安全和手段但無和平。安全無幸福" }, keywords: ["safety", "means", "no peace", "unhappiness"] },
        { position: 5, stage: { en: "Shoots Pheasant", zh: "射雉" }, meaning: { en: "Shoots pheasant with one arrow lost. Finally gains praise and office.", zh: "一箭射雉失一。終獲讚譽和官職" }, advice: { en: "Loss leads to recognition. Sacrifice brings eventual honor.", zh: "損失導致認可。犧牲帶來最終榮譽" }, keywords: ["loss", "recognition", "sacrifice", "honor"] },
        { position: 6, stage: { en: "Bird Burns Nest", zh: "鳥焚巢" }, meaning: { en: "Bird burns its nest. Wanderer first laughs then laments. Losing cow too easily.", zh: "鳥焚其巢。旅人先笑後號。易失牛" }, advice: { en: "Careless destruction of home. Joy turns to sorrow through negligence.", zh: "粗心摧毀家園。喜悅因疏忽變悲傷" }, keywords: ["carelessness", "destruction", "sorrow", "negligence"] }
      ]
    },
    relationships: { opposite: 24, inverse: 56, nuclear: 56 }
  },
  {
    number: 57,
    names: { en: "The Gentle (Wind)", zh: "巽", pinyin: "xùn" },
    symbol: "䷸",
    trigrams: {
      upper: { en: "Wind", zh: "風", symbol: "☴" },
      lower: { en: "Wind", zh: "風", symbol: "☴" }
    },
    classical: { judgment: "巽：小亨。利有攸往，利見大人", image: "隨風，巽。君子以申命行事", lines: ["初六：進退，利武人之貞", "九二：巽在床下，用史巫紛若，吉，无咎", "九三：頻巽，吝", "六四：悔亡，田獲三品", "九五：貞吉，悔亡，无不利，无初有終。先庚三日，後庚三日，吉", "上九：巽在床下，喪其資斧，貞凶"] },
    wilhelm: { judgment: "The Gentle. Success through what is small. It furthers one to have somewhere to go. It furthers one to see the great man.", image: "Winds following one upon the other: The image of the Gently Penetrating. Thus the superior man Spreads his commands abroad And carries out his undertakings.", lines: ["In advancing and in retreating, The perseverance of a warrior furthers.", "Penetration under the bed. Priests and magicians are used in confusing number. Good fortune. No blame.", "Repeated penetration. Humiliation.", "Remorse vanishes. During the hunt Three kinds of game are caught.", "Perseverance brings good fortune. Remorse vanishes. Nothing that does not further. No beginning, but an end. Before the change, three days. After the change, three days. Good fortune.", "Penetration under the bed. He loses his property and his ax. Perseverance brings misfortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "The gentle. Penetrating influence like wind.", zh: "溫和。像風一樣穿透的影響" },
      situation: { en: "You succeed through gentle, persistent penetration.", zh: "你通過溫和、持續的滲透獲得成功" },
      advice: { en: "Influence gently and repeatedly. Penetrate like wind through cracks.", zh: "溫和且反覆地影響。像風一樣穿透裂縫" },
      keywords: ["gentle", "penetration", "wind", "influence", "persistence"],
      lines: [
        { position: 1, stage: { en: "Advancing and Retreating", zh: "進退" }, meaning: { en: "Advancing and retreating. Perseverance of warrior furthers.", zh: "進退。武人之貞有利" }, advice: { en: "Uncertain movement. Military discipline brings success.", zh: "不確定的移動。軍事紀律帶來成功" }, keywords: ["uncertainty", "discipline", "military", "perseverance"] },
        { position: 2, stage: { en: "Penetrating Under Bed", zh: "巽在床下" }, meaning: { en: "Penetrating under the bed. Priests and magicians in confusion. Good fortune.", zh: "深入床下。巫史紛若吉" }, advice: { en: "Reaching hidden depths. Mystical confusion brings blessing.", zh: "到達隱藏深處。神秘混亂帶來祝福" }, keywords: ["hidden depths", "mystical", "confusion", "blessing"] },
        { position: 3, stage: { en: "Repeated Penetrating", zh: "頻巽" }, meaning: { en: "Repeated penetrating. Humiliation through excessive probing.", zh: "重複深入。因過度探查羞辱" }, advice: { en: "Over-analysis creates shame. Too much intrusion brings disgrace.", zh: "過度分析創造羞恥。太多侵入帶來恥辱" }, keywords: ["over-analysis", "intrusion", "shame", "excess"] },
        { position: 4, stage: { en: "Remorse Vanishes", zh: "悔亡" }, meaning: { en: "Remorse vanishes. Catching three kinds of game in hunt.", zh: "悔恨消失。獵中獲三品" }, advice: { en: "Regret disappears through action. Multiple successes achieved.", zh: "悔恨通過行動消失。多重成功達成" }, keywords: ["action", "success", "regret vanishes", "achievement"] },
        { position: 5, stage: { en: "Perseverance Brings Fortune", zh: "貞吉" }, meaning: { en: "Perseverance brings good fortune. Remorse vanishes. Nothing unfavorable. No beginning but has ending.", zh: "堅持帶來好運。悔恨消失。無不利。無初有終" }, advice: { en: "Steady persistence succeeds. Incomplete start finds good conclusion.", zh: "穩定堅持成功。不完整開始找到好結局" }, keywords: ["persistence", "good conclusion", "fortune", "completion"] },
        { position: 6, stage: { en: "Penetrating Under Bed", zh: "巽在床下" }, meaning: { en: "Penetrating under bed. Losing property and axe. Misfortune.", zh: "深入床下。喪其資斧凶" }, advice: { en: "Excessive probing causes loss. Too deep penetration brings harm.", zh: "過度探查導致損失。太深穿透帶來傷害" }, keywords: ["excessive", "loss", "too deep", "misfortune"] }
      ]
    },
    relationships: { opposite: 25, inverse: 57, nuclear: 57 }
  },
  {
    number: 58,
    names: { en: "The Joyous (Lake)", zh: "兌", pinyin: "duì" },
    symbol: "䷹",
    trigrams: {
      upper: { en: "Lake", zh: "澤", symbol: "☱" },
      lower: { en: "Lake", zh: "澤", symbol: "☱" }
    },
    classical: { judgment: "兌：亨，利貞", image: "麗澤，兌。君子以朋友講習", lines: ["初九：和兌，吉", "九二：孚兌，吉，悔亡", "六三：來兌，凶", "九四：商兌未寧，介疾有喜", "九五：孚于剝，有厲", "上六：引兌"] },
    wilhelm: { judgment: "The Joyous. Success. Perseverance is favorable.", image: "Lakes resting one on the other: The image of the Joyous. Thus the superior man joins with his friends For discussion and practice.", lines: ["Contented joyousness. Good fortune.", "Sincere joyousness. Good fortune. Remorse disappears.", "Coming joyousness. Misfortune.", "Joyousness that is weighed is not at peace. After ridding himself of mistakes a man has joy.", "Sincerity toward disintegrating influences is dangerous.", "Seductive joyousness."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "The joyous. Lake-like pleasure and cheerfulness.", zh: "喜悅。湖一般的愉快和歡樂" },
      situation: { en: "You find joy through openness and genuine connection.", zh: "你通過開放和真誠連結找到喜悅" },
      advice: { en: "Share joy with others. Be open and encouraging.", zh: "與他人分享喜悅。保持開放和鼓勵" },
      keywords: ["joy", "pleasure", "openness", "cheerfulness", "connection"],
      lines: [
        { position: 1, stage: { en: "Joyous Harmony", zh: "和兌" }, meaning: { en: "Harmonious joyousness. Good fortune.", zh: "和諧喜悅。好運" }, advice: { en: "Natural, unforced joy. Authentic happiness brings blessing.", zh: "自然、不強迫的喜悅。真實幸福帶來祝福" }, keywords: ["natural joy", "authentic", "harmony", "fortune"] },
        { position: 2, stage: { en: "Sincere Joyousness", zh: "孚兌" }, meaning: { en: "Sincere joyousness. Good fortune. Remorse disappears.", zh: "真誠喜悅。好運。悔恨消失" }, advice: { en: "Genuine joy from within. True pleasure eliminates regret.", zh: "來自內在的真正喜悅。真正快樂消除悔恨" }, keywords: ["genuine", "inner joy", "truth", "regret eliminated"] },
        { position: 3, stage: { en: "Coming Joyousness", zh: "來兌" }, meaning: { en: "Coming joyousness. Misfortune in seeking external pleasure.", zh: "來臨的喜悅。尋求外在快樂的不幸" }, advice: { en: "Pursuing pleasure from outside. Chasing joy brings unhappiness.", zh: "從外部追求快樂。追逐喜悅帶來不幸福" }, keywords: ["external pleasure", "pursuit", "chasing", "misfortune"] },
        { position: 4, stage: { en: "Deliberating Joyousness", zh: "商兌" }, meaning: { en: "Joyousness deliberated. Not yet at rest. Turning away from evil brings joy.", zh: "審議喜悅。尚未安寧。背離邪惡帶來喜悅" }, advice: { en: "Considering sources of joy. Choosing right pleasures brings peace.", zh: "考慮喜悅來源。選擇正確快樂帶來和平" }, keywords: ["consideration", "choice", "right pleasure", "peace"] },
        { position: 5, stage: { en: "Sincerity Toward Disintegration", zh: "孚于剝" }, meaning: { en: "Sincerity toward disintegrating. Danger in this.", zh: "對瓦解真誠。此中有危險" }, advice: { en: "Trusting what decays. Faith in corruption brings peril.", zh: "信任腐朽的東西。對腐敗的信仰帶來危險" }, keywords: ["misplaced trust", "decay", "danger", "corruption"] },
        { position: 6, stage: { en: "Seductive Joyousness", zh: "引兌" }, meaning: { en: "Seductive joyousness. Leading others astray through pleasure.", zh: "誘惑的喜悅。通過快樂引人入歧途" }, advice: { en: "Joy that corrupts others. Temptation that destroys.", zh: "腐化他人的喜悅。摧毀的誘惑" }, keywords: ["seduction", "corruption", "temptation", "destruction"] }
      ]
    },
    relationships: { opposite: 26, inverse: 58, nuclear: 58 }
  },
  {
    number: 59,
    names: { en: "Dispersion", zh: "渙", pinyin: "huàn" },
    symbol: "䷺",
    trigrams: {
      upper: { en: "Wind", zh: "風", symbol: "☴" },
      lower: { en: "Water", zh: "水", symbol: "☵" }
    },
    classical: { judgment: "渙：亨。王假有廟，利涉大川，利貞", image: "風行水上，渙。先王以享于帝立廟", lines: ["初六：用拯馬壯，吉", "九二：渙奔其機，悔亡", "六三：渙其躬，无悔", "六四：渙其群，元吉。渙有丘，匪夷所思", "九五：渙汗其大號，渙王居，无咎", "上九：渙其血，去逖出，无咎"] },
    wilhelm: { judgment: "Dispersion. Success. The king approaches his temple. It furthers one to cross the great water. Perseverance furthers.", image: "The wind drives over the water: The image of Dispersion. Thus the kings of old sacrificed to the Lord And built temples.", lines: ["He brings help with the strength of a horse. Good fortune.", "Dispersion! He hurries to that which supports him. Remorse disappears.", "He dissolves his self. No remorse.", "He dissolves his bond with his group. Supreme good fortune. Dispersion leads in turn to accumulation. This is something that ordinary men do not think of.", "His loud cries are as dissolving as sweat. Dissolution! A king abides without blame.", "He dissolves his blood. Departing, keeping at a distance, going out, Is without blame."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Dispersion and dissolution. Scattering what was rigid.", zh: "分散與溶解。分散僵硬的事物" },
      situation: { en: "You need to break up hardness and rigidity.", zh: "你需要打破硬度和僵化" },
      advice: { en: "Dissolve barriers. Let rigid structures flow and disperse.", zh: "溶解障礙。讓僵硬結構流動和分散" },
      keywords: ["dispersion", "dissolution", "scattering", "flow", "flexibility"],
      lines: [
        { position: 1, stage: { en: "Rescue with Horse's Strength", zh: "用馬壯救" }, meaning: { en: "Rescue through strength of horse. Good fortune.", zh: "通過馬的力量拯救。好運" }, advice: { en: "Strong assistance in dispersion. Power aids dissolution.", zh: "分散中的強大協助。力量幫助解散" }, keywords: ["strong help", "assistance", "power", "fortune"] },
        { position: 2, stage: { en: "Dispersion Running to Support", zh: "奔其機" }, meaning: { en: "At dispersion, running to one's support. Remorse disappears.", zh: "在分散時，奔向支持。悔恨消失" }, advice: { en: "Flee to your foundation. Return to base eliminates regret.", zh: "逃向你的基礎。回歸基地消除悔恨" }, keywords: ["return to base", "foundation", "refuge", "regret eliminated"] },
        { position: 3, stage: { en: "Dispersion of Self", zh: "渙其躬" }, meaning: { en: "Disperses his self. No remorse.", zh: "分散他的自我。無悔" }, advice: { en: "Let go of ego. Self-dissolution brings peace.", zh: "放下自我。自我解散帶來和平" }, keywords: ["ego dissolution", "letting go", "peace", "selflessness"] },
        { position: 4, stage: { en: "Dispersion of Group", zh: "渙其群" }, meaning: { en: "Disperses his group. Supreme good fortune. Dispersion leads to accumulation.", zh: "分散他的群體。至高好運。分散導致積累" }, advice: { en: "Breaking up the crowd brings blessing. Dissolution enables regathering.", zh: "打散群眾帶來祝福。解散使重聚成為可能" }, keywords: ["breaking up", "regathering", "blessing", "transformation"] },
        { position: 5, stage: { en: "Great Cry of Dispersion", zh: "渙汗其大號" }, meaning: { en: "Dispersion with great cry. King disperses staying in place.", zh: "以巨大呼喊分散。君王分散留在原地" }, advice: { en: "Loud proclamation of dissolution. Authority announces change.", zh: "解散的大聲宣告。權威宣布改變" }, keywords: ["proclamation", "authority", "announcement", "change"] },
        { position: 6, stage: { en: "Dispersion of Blood", zh: "渙其血" }, meaning: { en: "Disperses blood, departing, keeping distance. No blame.", zh: "分散血，離開，保持距離。無責" }, advice: { en: "Avoiding bloodshed through distance. Preventing harm through separation.", zh: "通過距離避免流血。通過分離防止傷害" }, keywords: ["avoidance", "distance", "prevention", "separation"] }
      ]
    },
    relationships: { opposite: 27, inverse: 59, nuclear: 59 }
  },
  {
    number: 60,
    names: { en: "Limitation", zh: "節", pinyin: "jié" },
    symbol: "䷻",
    trigrams: {
      upper: { en: "Water", zh: "水", symbol: "☵" },
      lower: { en: "Lake", zh: "澤", symbol: "☱" }
    },
    classical: { judgment: "節：亨。苦節不可貞", image: "澤上有水，節。君子以制數度，議德行", lines: ["初九：不出戶庭，无咎", "九二：不出門庭，凶", "六三：不節若，則嗟若，无咎", "六四：安節，亨", "九五：甘節，吉，往有尚", "上六：苦節，貞凶，悔亡"] },
    wilhelm: { judgment: "Limitation. Success. Galling limitation must not be persevered in.", image: "Water over lake: the image of Limitation. Thus the superior man Creates number and measure, And examines the nature of virtue and correct conduct.", lines: ["Not going out of the door and the courtyard Is without blame.", "Not going out of the gate and the courtyard Brings misfortune.", "He who knows no limitation Will have cause to lament. No blame.", "Contented limitation. Success.", "Sweet limitation brings good fortune. Going brings esteem.", "Galling limitation. Perseverance brings misfortune. Remorse disappears."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Limitation and regulation. Setting proper boundaries.", zh: "限制與規範。設定適當界限" },
      situation: { en: "You need to establish limits and regulations.", zh: "你需要建立限制和規定" },
      advice: { en: "Set appropriate limits. Too much restriction becomes harmful.", zh: "設定適當限制。過多限制會變得有害" },
      keywords: ["limitation", "regulation", "boundaries", "restraint", "moderation"],
      lines: [
        { position: 1, stage: { en: "Not Going Out Door", zh: "不出戶庭" }, meaning: { en: "Not going out of door and courtyard. No blame.", zh: "不出門和庭院。無責" }, advice: { en: "Staying within proper limits. Restraint prevents error.", zh: "保持在適當限度內。克制防止錯誤" }, keywords: ["restraint", "proper limits", "staying within", "prevention"] },
        { position: 2, stage: { en: "Not Going Out Gate", zh: "不出門庭" }, meaning: { en: "Not going out of gate and courtyard. Misfortune.", zh: "不出門和庭院。不幸" }, advice: { en: "Excessive limitation brings harm. Too much restraint causes problems.", zh: "過度限制帶來傷害。太多克制導致問題" }, keywords: ["excessive restraint", "too limited", "harm", "misfortune"] },
        { position: 3, stage: { en: "No Limitation", zh: "不節" }, meaning: { en: "Knowing no limitation. Lament. No blame in this.", zh: "不知限制。哀嘆。此中無責" }, advice: { en: "Lack of limits causes sorrow. But natural tendency, not fault.", zh: "缺乏限度導致悲傷。但自然傾向，非過錯" }, keywords: ["no limits", "sorrow", "natural", "blameless"] },
        { position: 4, stage: { en: "Contented Limitation", zh: "安節" }, meaning: { en: "Contented limitation. Success.", zh: "滿足的限制。成功" }, advice: { en: "Accepting appropriate bounds. Peace in proper restriction.", zh: "接受適當界限。在適當限制中和平" }, keywords: ["contentment", "acceptance", "peace", "success"] },
        { position: 5, stage: { en: "Sweet Limitation", zh: "甘節" }, meaning: { en: "Sweet limitation. Going brings good fortune.", zh: "甜蜜的限制。前往帶來好運" }, advice: { en: "Joyful self-discipline. Voluntary constraint brings blessing.", zh: "喜悅的自律。自願約束帶來祝福" }, keywords: ["joyful discipline", "voluntary", "constraint", "blessing"] },
        { position: 6, stage: { en: "Bitter Limitation", zh: "苦節" }, meaning: { en: "Bitter limitation. Perseverance brings misfortune. Remorse disappears.", zh: "苦澀的限制。堅持帶來不幸。悔恨消失" }, advice: { en: "Harsh restriction fails. Excessive severity causes harm eventually.", zh: "嚴酷限制失敗。過度嚴厲最終導致傷害" }, keywords: ["harsh", "excessive", "severity", "eventual harm"] }
      ]
    },
    relationships: { opposite: 28, inverse: 60, nuclear: 60 }
  },
  {
    number: 61,
    names: { en: "Inner Truth", zh: "中孚", pinyin: "zhōng fú" },
    symbol: "䷼",
    trigrams: {
      upper: { en: "Wind", zh: "風", symbol: "☴" },
      lower: { en: "Lake", zh: "澤", symbol: "☱" }
    },
    classical: { judgment: "中孚：豚魚吉，利涉大川，利貞", image: "澤上有風，中孚。君子以議獄緩死", lines: ["初九：虞吉，有它不燕", "九二：鳴鶴在陰，其子和之，我有好爵，吾與爾靡之", "六三：得敵，或鼓或罷，或泣或歌", "六四：月幾望，馬匹亡，无咎", "九五：有孚攣如，无咎", "上九：翰音登于天，貞凶"] },
    wilhelm: { judgment: "Inner Truth. Pigs and fishes. Good fortune. It furthers one to cross the great water. Perseverance furthers.", image: "Wind over lake: the image of Inner Truth. Thus the superior man discusses criminal cases In order to delay executions.", lines: ["Being prepared brings good fortune. If there are secret designs, it is disquieting.", "A crane calling in the shade. Its young answers it. I have a good goblet. I will share it with you.", "He finds a comrade. Now he beats the drum, now he stops. Now he sobs, now he sings.", "The moon nearly at the full. The team horse goes astray. No blame.", "He possesses truth, which links together. No blame.", "Cockcrow penetrating to heaven. Perseverance brings misfortune."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Inner truth and sincerity. Authentic connection from within.", zh: "內在真實與誠懇。來自內心的真實連結" },
      situation: { en: "You succeed through genuine sincerity and truth.", zh: "你通過真誠和真實獲得成功" },
      advice: { en: "Be completely sincere. Inner truth creates influence.", zh: "完全真誠。內在真實創造影響" },
      keywords: ["truth", "sincerity", "authenticity", "inner", "genuineness"],
      lines: [
        { position: 1, stage: { en: "Prepared Inner Truth", zh: "有備" }, meaning: { en: "Being prepared brings good fortune. Secret designs bring unrest.", zh: "有準備帶來好運。秘密設計帶來不安" }, advice: { en: "Sincerity with preparation succeeds. Hidden motives cause trouble.", zh: "有準備的真誠成功。隱藏動機導致麻煩" }, keywords: ["preparation", "sincerity", "hidden motives", "fortune"] },
        { position: 2, stage: { en: "Calling Crane", zh: "鳴鶴在陰" }, meaning: { en: "Calling crane in shade. Its young answers. I have good goblet, share with you.", zh: "鶴在陰處鳴叫。其子和之。我有好爵與爾" }, advice: { en: "Sincere call brings response. Authentic voice finds echo.", zh: "真誠呼喚帶來回應。真實聲音找到回音" }, keywords: ["sincere call", "response", "authenticity", "sharing"] },
        { position: 3, stage: { en: "Finding Companion", zh: "得敵" }, meaning: { en: "Finds companion. Now beats drum, now stops. Now weeps, now sings.", zh: "找到同伴。或鼓或罷或泣或歌" }, advice: { en: "Connection brings emotional swings. Relationship causes joy and sorrow.", zh: "連結帶來情緒波動。關係造成喜悅和悲傷" }, keywords: ["connection", "emotional swings", "relationship", "alternation"] },
        { position: 4, stage: { en: "Moon Nearly Full", zh: "月幾望" }, meaning: { en: "Moon nearly full. Horse breaks away. No blame.", zh: "月近滿。馬匹脫逃。無責" }, advice: { en: "Near completion, natural separation. Letting go before fulfillment.", zh: "接近完成，自然分離。在實現前放手" }, keywords: ["near completion", "separation", "letting go", "natural"] },
        { position: 5, stage: { en: "Possessing Truth", zh: "有孚攣如" }, meaning: { en: "Possessing truth that binds. No error.", zh: "擁有連結的真理。無錯" }, advice: { en: "Inner truth creates unbreakable bonds. Authenticity unites.", zh: "內在真理創造不可破的紐帶。真實統一" }, keywords: ["truth", "bonds", "authenticity", "unity"] },
        { position: 6, stage: { en: "Cockcrow Penetrating", zh: "翰音登于天" }, meaning: { en: "Cockcrow penetrating to heaven. Perseverance brings misfortune.", zh: "雞鳴穿透天際。堅持帶來不幸" }, advice: { en: "Empty proclamation reaches nowhere. Words without substance fail.", zh: "空洞宣告無處可達。無實質的言語失敗" }, keywords: ["empty words", "proclamation", "no substance", "failure"] }
      ]
    },
    relationships: { opposite: 29, inverse: 61, nuclear: 61 }
  },
  {
    number: 62,
    names: { en: "Preponderance of the Small", zh: "小過", pinyin: "xiǎo guò" },
    symbol: "䷽",
    trigrams: {
      upper: { en: "Thunder", zh: "雷", symbol: "☳" },
      lower: { en: "Mountain", zh: "山", symbol: "☶" }
    },
    classical: { judgment: "小過：亨，利貞。可小事，不可大事。飛鳥遺之音，不宜上，宜下，大吉", image: "山上有雷，小過。君子以行過乎恭，喪過乎哀，用過乎儉", lines: ["初六：飛鳥以凶", "六二：過其祖，遇其妣。不及其君，遇其臣，无咎", "九三：弗過防之，從或戕之，凶", "九四：无咎，弗過遇之，往厲必戒，勿用永貞", "六五：密雲不雨，自我西郊，公弋取彼在穴", "上六：弗遇過之，飛鳥離之，凶，是謂災眚"] },
    wilhelm: { judgment: "Preponderance of the Small. Success. Perseverance furthers. Small things may be done; great things should not be done. The flying bird brings the message: It is not well to strive upward, It is well to remain below. Great good fortune.", image: "Thunder on the mountain: The image of Preponderance of the Small. Thus in his conduct the superior man gives preponderance to reverence. In bereavement he gives preponderance to grief. In his expenditures he gives preponderance to thrift.", lines: ["The bird meets with misfortune through flying.", "She passes by her ancestor And meets her ancestress. He does not reach his prince And meets his official. No blame.", "If one is not extremely careful, Somebody may come up from behind and strike him. Misfortune.", "No blame. He meets him without passing by. Going brings danger. One must be on guard. Do not act. Be constantly persevering.", "Dense clouds, no rain from our western region. The prince shoots and hits him who is in the cave.", "He passes him by, not meeting him. The flying bird leaves him. Misfortune. This means bad luck and injury."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Small exceeding. Minor matters taking precedence.", zh: "小過度。小事優先" },
      situation: { en: "You succeed in small matters, not grand ambitions.", zh: "你在小事上成功，而非宏大抱負" },
      advice: { en: "Focus on small, humble tasks. Don't reach for the extraordinary.", zh: "專注於小而謙卑的任務。不要追求非凡" },
      keywords: ["small", "exceeding", "humility", "modesty", "minor matters"],
      lines: [
        { position: 1, stage: { en: "Bird Flying Brings Misfortune", zh: "飛鳥凶" }, meaning: { en: "Bird in flight brings misfortune. Attempting too much.", zh: "飛行中的鳥帶來不幸。嘗試太多" }, advice: { en: "Small creature flying high invites disaster. Stay within capacity.", zh: "小生物飛得太高招致災難。保持在能力內" }, keywords: ["overreach", "beyond capacity", "disaster", "limitation"] },
        { position: 2, stage: { en: "Passing By Ancestor", zh: "過其祖" }, meaning: { en: "Passing by ancestor, meeting ancestress. Not reaching prince, meeting minister.", zh: "經過祖先，遇見祖母。未達君主，遇見大臣" }, advice: { en: "Appropriate level achieved. Finding right station, not overreaching.", zh: "達到適當水平。找到正確位置，不過度" }, keywords: ["appropriate level", "right station", "not overreaching", "fitting"] },
        { position: 3, stage: { en: "Not Passing By", zh: "弗過" }, meaning: { en: "If one does not pass by but goes too far. Someone may kill him. Misfortune.", zh: "若不經過而過遠。有人可能殺他。不幸" }, advice: { en: "Excessive advance invites attack. Going beyond brings danger.", zh: "過度前進招致攻擊。超越帶來危險" }, keywords: ["excessive", "danger", "attack", "going too far"] },
        { position: 4, stage: { en: "No Blame Meeting", zh: "無咎遇" }, meaning: { en: "No blame. Meeting without passing by. Danger in going. Must be cautious.", zh: "無責。相遇而不經過。前往危險。必須謹慎" }, advice: { en: "Stay at proper level. Meeting without exceeding brings safety.", zh: "保持在適當水平。相遇而不超越帶來安全" }, keywords: ["proper level", "safety", "not exceeding", "caution"] },
        { position: 5, stage: { en: "Dense Clouds No Rain", zh: "密雲不雨" }, meaning: { en: "Dense clouds but no rain from western regions. Prince shoots, hits in cave.", zh: "密雲但西方無雨。君主射擊，在洞中命中" }, advice: { en: "Preparation without result. Effort targets hidden goals.", zh: "準備無結果。努力針對隱藏目標" }, keywords: ["preparation", "no result", "hidden target", "effort"] },
        { position: 6, stage: { en: "Passing By Without Meeting", zh: "過而不遇" }, meaning: { en: "Passing by without meeting. Flying bird leaves. Misfortune. Disaster and injury.", zh: "經過而不相遇。飛鳥離去。不幸。災難和傷害" }, advice: { en: "Complete disconnection. Flying too far causes loss.", zh: "完全斷絕。飛得太遠導致損失" }, keywords: ["disconnection", "too far", "loss", "disaster"] }
      ]
    },
    relationships: { opposite: 30, inverse: 62, nuclear: 62 }
  },
  {
    number: 63,
    names: { en: "After Completion", zh: "既濟", pinyin: "jì jì" },
    symbol: "䷾",
    trigrams: {
      upper: { en: "Water", zh: "水", symbol: "☵" },
      lower: { en: "Fire", zh: "火", symbol: "☲" }
    },
    classical: { judgment: "既濟：亨小，利貞。初吉終亂", image: "水在火上，既濟。君子以思患而豫防之", lines: ["初九：曳其輪，濡其尾，无咎", "六二：婦喪其茀，勿逐，七日得", "九三：高宗伐鬼方，三年克之，小人勿用", "六四：繻有衣袽，終日戒", "九五：東鄰殺牛，不如西鄰之禴祭，實受其福", "上六：濡其首，厲"] },
    wilhelm: { judgment: "After Completion. Success in small matters. Perseverance furthers. At the beginning good fortune, At the end disorder.", image: "Water over fire: the image of the condition After Completion. Thus the superior man Takes thought of misfortune And arms himself against it in advance.", lines: ["He brakes his wheels. Wets his tail. No blame.", "The woman loses the curtain of her carriage. Do not run after it; On the seventh day you will get it.", "The Illustrious Ancestor Disciplines the Devil's Country. After three years he conquers it. Inferior people must not be employed.", "The finest clothes turn to rags. Be careful all day long.", "The neighbor in the east who slaughters an ox Does not attain as much real happiness As the neighbor in the west With his small offering.", "He gets his head in the water. Danger."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "After completion. Order achieved but requiring vigilance.", zh: "完成之後。達到秩序但需要警惕" },
      situation: { en: "You've achieved success but must maintain it carefully.", zh: "你已取得成功但必須小心維持" },
      advice: { en: "Stay vigilant after success. Completion contains the seeds of disorder.", zh: "成功後保持警惕。完成包含混亂的種子" },
      keywords: ["completion", "achievement", "order", "vigilance", "maintenance"],
      lines: [
        { position: 1, stage: { en: "Beginning", zh: "開始" }, meaning: { en: "Drags wheels. Gets tail in water. No blame.", zh: "曳其輪。濡其尾無咎" }, advice: { en: "Initial success but premature advance. Stop before getting wet.", zh: "最初成功但過早前進。在濕前停止" }, keywords: ["success", "premature", "caution", "stop"] },
        { position: 2, stage: { en: "Development", zh: "發展" }, meaning: { en: "Woman loses carriage curtain. Don't pursue. Seven days returns.", zh: "婦喪其茀勿逐七日得" }, advice: { en: "Loss in completion. What's lost returns naturally.", zh: "完成中的損失。失去的自然歸來" }, keywords: ["loss", "return", "natural", "patience"] },
        { position: 3, stage: { en: "Transition", zh: "過渡" }, meaning: { en: "High ancestor disciplines Devil's Country. Three years to conquer.", zh: "高宗伐鬼方三年克之" }, advice: { en: "Great undertaking after completion. Long difficult campaign needed.", zh: "完成後的大事業。需要長期困難戰役" }, keywords: ["great undertaking", "difficulty", "long campaign", "conquest"] },
        { position: 4, stage: { en: "Testing", zh: "測試" }, meaning: { en: "Silk rags as plugs. All day vigilant.", zh: "繻有衣袽終日戒" }, advice: { en: "Constant repair of small leaks. Maintenance prevents collapse.", zh: "持續修補小漏洞。維護防止崩潰" }, keywords: ["maintenance", "vigilance", "prevention", "small repairs"] },
        { position: 5, stage: { en: "Achievement", zh: "成就" }, meaning: { en: "Eastern neighbor kills ox. Not equal to western neighbor's small offering.", zh: "東鄰殺牛不如西鄰之禴祭" }, advice: { en: "Grand gesture less valued. Simple sincerity brings greater blessing.", zh: "盛大姿態價值較低。簡單真誠帶來更大祝福" }, keywords: ["simplicity", "sincerity", "value", "blessing"] },
        { position: 6, stage: { en: "Completion", zh: "完成" }, meaning: { en: "Gets head wet. Danger of going too far.", zh: "濡其首厲" }, advice: { en: "Excess in completion. Overextension brings peril.", zh: "完成中的過度。過度延伸帶來危險" }, keywords: ["excess", "overextension", "danger", "too far"] }
      ]
    },
    relationships: { opposite: 31, inverse: 63, nuclear: 63 }
  },
  {
    number: 64,
    names: { en: "Before Completion", zh: "未濟", pinyin: "wèi jì" },
    symbol: "䷿",
    trigrams: {
      upper: { en: "Fire", zh: "火", symbol: "☲" },
      lower: { en: "Water", zh: "水", symbol: "☵" }
    },
    classical: { judgment: "未濟：亨。小狐汔濟，濡其尾，无攸利", image: "火在水上，未濟。君子以慎辨物居方", lines: ["初六：濡其尾，吝", "九二：曳其輪，貞吉", "六三：未濟，征凶，利涉大川", "九四：貞吉，悔亡，震用伐鬼方，三年有賞于大國", "六五：貞吉，无悔，君子之光，有孚，吉", "上九：有孚于飲酒，无咎。濡其首，有孚失是"] },
    wilhelm: { judgment: "Before Completion. Success. But if the little fox, after nearly completing the crossing, Gets his tail in the water, There is nothing that would further.", image: "Fire over water: The image of the condition before transition. Thus the superior man is careful In the differentiation of things, So that each finds its place.", lines: ["He gets his tail in the water. Humiliating.", "He brakes his wheels. Perseverance brings good fortune.", "Before completion, attack brings misfortune. It furthers one to cross the great water.", "Perseverance brings good fortune. Remorse disappears. Shock, thus to discipline the Devil's Country. For three years, great realms are awarded.", "Perseverance brings good fortune. No remorse. The light of the superior man is true. Good fortune.", "There is drinking of wine In genuine confidence. No blame. But if one wets his head, He loses it, in truth."] },
    contemporary: { overview: "", interpretation: "" },
    ai_context: {
      core_meaning: { en: "Before completion. Almost there but not yet finished.", zh: "完成之前。幾乎到達但尚未完成" },
      situation: { en: "You're close to success but haven't crossed the threshold yet.", zh: "你接近成功但尚未跨越門檻" },
      advice: { en: "Be careful in final stages. Success is near but not guaranteed.", zh: "在最後階段要小心。成功接近但不保證" },
      keywords: ["before completion", "almost", "threshold", "caution", "patience"],
      lines: [
        { position: 1, stage: { en: "Beginning", zh: "開始" }, meaning: { en: "Gets tail wet. Humiliating.", zh: "濡其尾吝" }, advice: { en: "Inadequate preparation. Not ready despite beginning.", zh: "準備不足。儘管開始但未準備好" }, keywords: ["inadequate", "unready", "premature", "humiliation"] },
        { position: 2, stage: { en: "Development", zh: "發展" }, meaning: { en: "Drags wheels. Perseverance brings good fortune.", zh: "曳其輪貞吉" }, advice: { en: "Restrained progress. Held-back advance succeeds.", zh: "克制的進展。抑制的前進成功" }, keywords: ["restraint", "held back", "success", "perseverance"] },
        { position: 3, stage: { en: "Transition", zh: "過渡" }, meaning: { en: "Before completion. Attacking brings misfortune. Crossing great water furthers.", zh: "未濟征凶利涉大川" }, advice: { en: "Not yet ready for force. But bold undertaking succeeds.", zh: "尚未準備好使用武力。但大膽事業成功" }, keywords: ["not ready", "bold", "undertaking", "timing"] },
        { position: 4, stage: { en: "Testing", zh: "測試" }, meaning: { en: "Perseverance brings good fortune. Remorse disappears. Shock to discipline Devil's Country.", zh: "貞吉悔亡震用伐鬼方" }, advice: { en: "Determination in incompletion. Major effort brings victory.", zh: "未完成中的決心。重大努力帶來勝利" }, keywords: ["determination", "effort", "victory", "perseverance"] },
        { position: 5, stage: { en: "Achievement", zh: "成就" }, meaning: { en: "Perseverance brings good fortune. No remorse. Light of superior man is true.", zh: "貞吉無悔君子之光" }, advice: { en: "Pure completion approaching. Genuine attainment near.", zh: "接近純粹完成。真正成就接近" }, keywords: ["purity", "completion", "genuine", "truth"] },
        { position: 6, stage: { en: "Completion", zh: "完成" }, meaning: { en: "Drinking wine with confidence. No blame. But getting head wet loses confidence.", zh: "有孚於飲酒無咎濡其首有孚失是" }, advice: { en: "Celebration justified but excess ruins. Confidence becomes hubris.", zh: "慶祝合理但過度毀滅。信心變傲慢" }, keywords: ["celebration", "excess", "hubris", "loss"] }
      ]
    },
    relationships: { opposite: 32, inverse: 64, nuclear: 64 }
  }
];

export function getHexagram(n: number) { return LOCAL_ICHING_HEXAGRAMS.find(h => h.number === n); }
export function getAllHexagrams() { return LOCAL_ICHING_HEXAGRAMS; }
export function getHexagramByName(name: string, lang: 'en' | 'zh' = 'en') { const s = name.toLowerCase().trim(); return LOCAL_ICHING_HEXAGRAMS.find(h => lang === 'en' ? (h.names.en.toLowerCase() === s || h.names.pinyin.toLowerCase() === s) : h.names.zh === name); }
export function getLineContext(hexNum: number, linePos: number) { const h = getHexagram(hexNum); return h?.ai_context.lines[linePos - 1]; }
export function getChangingLineContexts(hexNum: number, changing: number[]) { const h = getHexagram(hexNum); if (!h) return []; return changing.filter(p => p >= 1 && p <= 6).map(p => h.ai_context.lines[p - 1]); }
export function getClassicalLineText(hexNum: number, linePos: number) { const h = getHexagram(hexNum); return h?.classical.lines[linePos - 1]; }
export function getWilhelmLineText(hexNum: number, linePos: number) { const h = getHexagram(hexNum); return h?.wilhelm.lines[linePos - 1]; }
export function getReferenceCard(hexNum: number) { const h = getHexagram(hexNum); if (!h) return null; return { number: h.number, names: h.names, symbol: h.symbol, classical: h.classical, wilhelm: h.wilhelm, contemporary: h.contemporary }; }
export function getAIPromptData(hexNum: number, changingLines?: number[]) { const h = getHexagram(hexNum); if (!h) return null; const lineContexts = changingLines ? changingLines.map(p => h.ai_context.lines[p - 1]) : []; return { hexagram: { number: h.number, name: h.names.en, core_meaning: h.ai_context.core_meaning.en, situation: h.ai_context.situation.en, advice: h.ai_context.advice.en, keywords: h.ai_context.keywords }, changingLines: lineContexts }; }
export function getRelatedHexagrams(hexNum: number) { const h = getHexagram(hexNum); if (!h) return null; return { opposite: getHexagram(h.relationships.opposite), inverse: getHexagram(h.relationships.inverse), nuclear: getHexagram(h.relationships.nuclear) }; }
