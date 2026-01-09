// src/services/themeInterpretationService.ts
/**
 * Service for generating and managing AI-powered theme interpretations
 * Auto-regenerates interpretations every 8 days
 */

import { supabase } from '../core/api/supabase';
import { AIProvider } from '../core/api/aiProvider';
import { SupportedLocale } from '../i18n';
import { LOCAL_RWS_CARDS } from '../systems/tarot/data/localCardData';
import { PromptBuilder } from '../core/ai/prompts/promptBuilder';

export interface ThemeInterpretation {
  id: string;
  theme_type: 'recurring_theme' | 'anomaly' | 'trend';
  theme_key: string;
  cards?: string[];
  interpretation_en: string;
  interpretation_zh?: string;
  interpretation_ja?: string;
  summary_en?: string; // 50-word summary
  summary_zh?: string;
  summary_ja?: string;
  theme_names?: string; // 1-3 word theme summary
  generated_at: string;
  expires_at: string;
  metadata?: Record<string, any>;
}

const REGENERATION_INTERVAL_DAYS = 8;

/**
 * Get theme interpretation, generating if needed or expired
 */
export async function getThemeInterpretation(
  userId: string,
  themeType: 'recurring_theme' | 'anomaly' | 'trend',
  themeKey: string,
  cards: string[],
  locale: SupportedLocale,
  metadata?: Record<string, any>,
  forceRegenerate?: boolean // Add flag to force regeneration
): Promise<{ summary: string; interpretation: string; themeNames?: string } | null> {
  try {
    // If force regenerate, skip cache check
    if (forceRegenerate) {
      const interpretation = await generateThemeInterpretation(
        userId,
        themeType,
        themeKey,
        cards,
        locale,
        metadata
      );
      if (interpretation) {
        const fullInterpretation = locale === 'zh-TW' && interpretation.interpretation_zh
          ? interpretation.interpretation_zh
          : interpretation.interpretation_en;
        
        return {
          summary: '', // No longer used
          interpretation: fullInterpretation,
          themeNames: interpretation.theme_names || undefined,
        };
      }
      return null;
    }
    
    // Check if interpretation exists and is still valid
    const { data: existing, error: fetchError } = await supabase
      .from('theme_interpretations')
      .select('*')
      .eq('user_id', userId)
      .eq('theme_key', themeKey)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows gracefully

    // If table doesn't exist or other error, skip caching and generate directly
    if (fetchError) {
      // Generate interpretation without caching if table doesn't exist
      const interpretation = await generateThemeInterpretation(
        userId,
        themeType,
        themeKey,
        cards,
        locale,
        metadata
      );
      if (interpretation) {
        const fullInterpretation = interpretation.interpretation_en;
        return {
          summary: '', // No longer used
          interpretation: fullInterpretation,
          themeNames: interpretation.theme_names || undefined,
        };
      }
      return null;
    }

    const now = new Date();
    const existingData = existing as any;
    const expiresAt = existingData?.expires_at ? new Date(existingData.expires_at) : null;
    const needsRegeneration = !existing || !expiresAt || expiresAt <= now;
    
    // Also regenerate if theme_names is missing (for existing records that were created before keywords were added)
    const needsRegenerationDueToMissingKeywords = existingData && !existingData.theme_names;
    
    // Also regenerate if structural stats are missing (for existing records created before structural analysis)
    const needsRegenerationDueToMissingStructuralStats = existingData && metadata?.structuralStatsOverTime && !existingData.metadata?.structuralStatsOverTime;

    if (needsRegeneration || needsRegenerationDueToMissingKeywords || needsRegenerationDueToMissingStructuralStats) {
      // Generate new interpretation
      const interpretation = await generateThemeInterpretation(
        userId,
        themeType,
        themeKey,
        cards,
        locale,
        metadata
      );

      if (interpretation) {
        const fullInterpretation = locale === 'zh-TW' && interpretation.interpretation_zh
          ? interpretation.interpretation_zh
          : interpretation.interpretation_en;
        
        return {
          summary: '', // No longer used
          interpretation: fullInterpretation,
          themeNames: interpretation.theme_names || undefined,
        };
      }
      return null;
    }

    // Return existing interpretation
    const fullInterpretation = locale === 'zh-TW' && existingData?.interpretation_zh
      ? existingData.interpretation_zh
      : existingData?.interpretation_en || '';
    
    const themeNames = existingData?.theme_names || undefined;
    
    return {
      summary: '', // No longer used
      interpretation: fullInterpretation,
      themeNames: themeNames,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate AI interpretation for a theme
 */
async function generateThemeInterpretation(
  userId: string,
  themeType: 'recurring_theme' | 'anomaly' | 'trend',
  themeKey: string,
  cards: string[],
  locale: SupportedLocale,
  metadata?: Record<string, any>
): Promise<ThemeInterpretation | null> {
  try {
    // Build prompt based on theme type
    const cardNames = cards.map(cardName => {
      const card = LOCAL_RWS_CARDS.find(c => c.title.en === cardName);
      return card ? (locale === 'zh-TW' ? card.title.zh : card.title.en) : cardName;
    }).join(', ');

    let prompt = '';
    let systemPrompt = '';

    if (themeType === 'recurring_theme') {
      if (cards.length === 1) {
        // Single recurring card
        systemPrompt = locale === 'zh-TW'
          ? '你是一位經驗豐富的塔羅解讀者，專門分析重複出現的卡牌模式。'
          : 'You are an experienced tarot reader specializing in analyzing recurring card patterns.';
        
        prompt = locale === 'zh-TW'
          ? `這張卡牌「${cardNames}」在用戶的多次解讀中重複出現。請提供一個深入、有意義的解釋，說明這張卡牌的重複出現對用戶的旅程意味著什麼。解釋應該：\n\n1. 解釋這張卡牌的核心能量和訊息\n2. 說明為什麼它會重複出現（可能是未解決的主題、持續的挑戰，或需要關注的成長領域）\n3. 提供實用的指導，說明用戶如何與這股能量合作\n4. 考慮時間的演變（這張卡牌如何可能反映用戶的成長或持續的課題）\n\n請寫150-200字的深入解釋。`
          : `The card "${cardNames}" has been appearing repeatedly across the user's readings. Provide a deep, meaningful interpretation of what this recurring appearance means for the user's journey. The interpretation should:\n\n1. Explain the core energy and message of this card\n2. Explain why it might be recurring (unresolved themes, ongoing challenges, or growth areas needing attention)\n3. Provide practical guidance on how the user can work with this energy\n4. Consider temporal evolution (how this card might reflect the user's growth or persistent lessons)\n\nWrite 150-200 words of deep insight.`;
      } else {
        // Multiple recurring cards - load full history for analysis
        systemPrompt = locale === 'zh-TW'
          ? '你是一位經驗豐富的塔羅解讀者，專門分析多張重複出現的卡牌之間的主題網絡，並根據統計結構趨勢建構敘事弧線。'
          : 'You are an expert tarot reader specializing in analyzing thematic networks between multiple recurring cards and constructing narrative arcs based on statistical structural trends over time.';
        
        // Load full reading history for comprehensive analysis
        const fullHistory = await PromptBuilder.loadRecentReadingHistory(
          userId,
          locale,
          1000, // Load all readings for full context
          true, // Include conversations
          false, // Don't exclude daily cards
          'apex', // Use apex tier to get full history
          false
        );
        
        // Analyze card distribution over time
        const cardTimeline = metadata?.cardTimeline as Record<string, string[]> | undefined;
        let temporalAnalysis = '';
        if (cardTimeline && Object.keys(cardTimeline).length > 0) {
          // Build temporal distribution text
          const timelineEntries = Object.entries(cardTimeline)
            .map(([cardName, timestamps]) => {
              const card = LOCAL_RWS_CARDS.find(c => c.title.en === cardName);
              const displayName = card ? (locale === 'zh-TW' ? card.title.zh : card.title.en) : cardName;
              return `${displayName}: appeared ${timestamps.length} times (${timestamps.length > 0 ? `first: ${new Date(timestamps[0]).toLocaleDateString()}, last: ${new Date(timestamps[timestamps.length - 1]).toLocaleDateString()}` : 'no dates'})`;
            })
            .join('\n');
          
          temporalAnalysis = locale === 'zh-TW'
            ? `\n\n卡牌出現時間分布：\n${timelineEntries}\n\n請特別注意這些卡牌在時間上的分布模式、出現順序、以及它們之間的時序關係。`
            : `\n\nCard occurrence timeline:\n${timelineEntries}\n\nPay special attention to the temporal distribution patterns, order of appearance, and chronological relationships between these cards.`;
        }
        
        // Build structural statistics analysis
        const structuralStats = metadata?.structuralStatsOverTime as {
          early?: { major: number; minor: number; court: number; wands: number; cups: number; swords: number; pentacles: number };
          middle?: { major: number; minor: number; court: number; wands: number; cups: number; swords: number; pentacles: number };
          late?: { major: number; minor: number; court: number; wands: number; cups: number; swords: number; pentacles: number };
          overall?: { major: number; minor: number; court: number; wands: number; cups: number; swords: number; pentacles: number };
        } | undefined;
        
        let structuralAnalysis = '';
        
        if (structuralStats && structuralStats.early && structuralStats.middle && structuralStats.late) {
          // Calculate key shifts
          const majorShift = structuralStats.late.major - structuralStats.early.major;
          const minorShift = structuralStats.late.minor - structuralStats.early.minor;
          const courtShift = structuralStats.late.court - structuralStats.early.court;
          const cupsShift = structuralStats.late.cups - structuralStats.early.cups;
          const wandsShift = structuralStats.late.wands - structuralStats.early.wands;
          const swordsShift = structuralStats.late.swords - structuralStats.early.swords;
          const pentaclesShift = structuralStats.late.pentacles - structuralStats.early.pentacles;
          
          // Convert to qualitative descriptions
          const describeShift = (value: number, type: string) => {
            const absValue = Math.abs(value);
            if (absValue < 5) return null; // Ignore minor shifts
            const direction = value > 0 ? 'increased' : 'decreased';
            const magnitude = absValue > 15 ? 'significantly' : absValue > 10 ? 'substantially' : 'noticeably';
            return `${magnitude} ${direction}`;
          };
          
          const majorDesc = describeShift(majorShift, 'major');
          const minorDesc = describeShift(minorShift, 'minor');
          const courtDesc = describeShift(courtShift, 'court');
          const cupsDesc = describeShift(cupsShift, 'cups');
          const wandsDesc = describeShift(wandsShift, 'wands');
          
          // Determine dominant patterns
          const earlyDominant = structuralStats.early.major > 35 ? 'Major Arcana' : 
                                structuralStats.early.cups > 25 ? 'Cups (Emotions)' :
                                structuralStats.early.wands > 25 ? 'Wands (Creativity)' :
                                structuralStats.early.minor > 55 ? 'Minor Arcana' : 'balanced';
          
          const lateDominant = structuralStats.late.major > 35 ? 'Major Arcana' :
                               structuralStats.late.cups > 25 ? 'Cups (Emotions)' :
                               structuralStats.late.wands > 25 ? 'Wands (Creativity)' :
                               structuralStats.late.minor > 55 ? 'Minor Arcana' : 'balanced';
          
          structuralAnalysis = locale === 'zh-TW'
            ? `\n\n**統計結構趨勢分析（早期/中期/晚期）：**\n\n**結構性演變模式：**\n${majorDesc ? `- 大阿爾克那：${majorDesc === 'significantly decreased' ? '顯著下降' : majorDesc === 'substantially decreased' ? '大幅下降' : '明顯下降'}（從早期的高比例轉向後期的較低比例，顯示從重大轉變主題轉向日常事務）` : ''}\n${minorDesc ? `- 小阿爾克那：${minorDesc === 'significantly increased' ? '顯著上升' : minorDesc === 'substantially increased' ? '大幅上升' : '明顯上升'}（實務層面的關注增加）` : ''}\n${courtDesc ? `- 宮廷牌：${courtDesc === 'significantly increased' ? '顯著上升' : courtDesc === 'substantially increased' ? '大幅上升' : '明顯上升'}（人物和關係動態的關注增加）` : ''}\n${cupsDesc ? `- 聖杯（情感）：${cupsDesc === 'significantly increased' ? '顯著上升' : cupsDesc === 'substantially increased' ? '大幅上升' : '明顯上升'}，特別是在中期達到高峰（情感主題的強烈湧現）` : ''}\n\n**敘事弧線：**\n早期階段以${earlyDominant === 'Major Arcana' ? '重大轉變和深層主題' : earlyDominant === 'Cups (Emotions)' ? '情感探索' : earlyDominant === 'Wands (Creativity)' ? '創造力' : '平衡'}為主導，逐漸演變為後期以${lateDominant === 'Major Arcana' ? '重大轉變' : lateDominant === 'Cups (Emotions)' ? '情感整合' : lateDominant === 'Wands (Creativity)' ? '創造性行動' : '實務整合'}為焦點。\n\n**你必須在解釋中：**\n1. 明確描述這個結構性演變如何反映用戶的成長軌跡\n2. 將重複卡牌與這些結構性變化結合，說明它們如何反映這個演變過程\n3. 建構一個清晰的敘事弧線，從早期狀態到當前狀態\n4. 使用定性語言描述趨勢（如「從重大轉變轉向實務整合」），而非具體數字`
            : `\n\n**STATISTICAL STRUCTURAL TRENDS OVER TIME (Early/Middle/Late Periods):**\n\n**STRUCTURAL EVOLUTION PATTERNS:**\n${majorDesc ? `- Major Arcana: ${majorDesc} (shifted from high proportion in early period to lower proportion in late period, indicating transition from major transformation themes toward daily practical matters)` : ''}\n${minorDesc ? `- Minor Arcana: ${minorDesc} (increased focus on practical, day-to-day concerns)` : ''}\n${courtDesc ? `- Court Cards: ${courtDesc} (increased attention to people, relationships, and interpersonal dynamics)` : ''}\n${cupsDesc ? `- Cups Suit (Emotions): ${cupsDesc}, peaking notably in the middle period (strong emotional themes emerging)` : ''}\n${wandsDesc ? `- Wands Suit (Creativity): ${wandsDesc} (creative energy shifts)` : ''}\n\n**NARRATIVE ARC:**\nThe early period was dominated by ${earlyDominant === 'Major Arcana' ? 'major transformations and deep themes' : earlyDominant === 'Cups (Emotions)' ? 'emotional exploration' : earlyDominant === 'Wands (Creativity)' ? 'creative impulses' : 'balanced energies'}, gradually evolving toward the late period's focus on ${lateDominant === 'Major Arcana' ? 'major life shifts' : lateDominant === 'Cups (Emotions)' ? 'emotional integration' : lateDominant === 'Wands (Creativity)' ? 'creative action' : 'practical integration'}.\n\n**YOU MUST IN YOUR INTERPRETATION:**\n1. Explicitly describe how this structural evolution reflects the user's growth trajectory\n2. Integrate the recurring cards with these structural changes, explaining how they reflect this evolution\n3. Construct a clear narrative arc from early state to current state\n4. Use qualitative language to describe trends (e.g., "shifted from major transformations toward practical integration") rather than specific percentages\n5. Make the structural analysis central to your interpretation - it should be the foundation, not an afterthought`;
        }
        
        // Put structural analysis FIRST and make it very prominent
        const finalPrompt = locale === 'zh-TW'
          ? `${structuralAnalysis ? `\n\n${structuralAnalysis}\n\n` : ''}${fullHistory ? `以下是用戶的完整閱讀歷史：\n\n${fullHistory}\n\n` : ''}分析以下重複出現的卡牌：${cardNames}。${temporalAnalysis}\n\n**重要：請嚴格按照以下格式回應，不要偏離格式。**\n\n首先，提供關鍵詞（必須在第一行，格式如下）：\n- 如果卡牌顯示出對立或對比模式，使用「x vs y」格式（例如：「內在 vs 外在」或「幻覺 vs 真相」）\n- 如果卡牌顯示出協同或漸進模式，使用三個關鍵詞「x, y, z」格式（例如：「轉變, 成長, 關係」或「創造力, 探索, 突破」）\n\n然後，提供解釋（必須在第二行開始，標記為「解釋：」）：\n- 寫3-4段簡潔的段落（總共約150-180字，不超過200字）\n- 僅在最關鍵的結構性轉折點使用**粗體**（例如：僅在描述最重要的結構性變化時使用，如「**大阿爾克那顯著下降**」或「**聖杯主題在中期達到高峰**」），避免過度使用\n- 卡牌名稱使用一般文字即可，無需斜體（例如：惡魔、聖杯七），僅在首次提及或需要特別強調時才使用*斜體*\n- 必須基於統計結構趨勢建構清晰的敘事弧線\n- 說明早期→中期→晚期的結構性變化如何反映用戶的成長軌跡\n- 將重複卡牌與結構性趨勢結合，揭示深層模式\n- 提供具體、可操作的洞察，而非泛泛而談\n- 最後一段必須以**教訓：**開頭，提供清晰的要點\n\n**回應格式（必須嚴格遵循）：**\n關鍵詞： [根據時間模式和結構趨勢選擇「x vs y」或「x, y, z」格式，僅提供關鍵詞，不要額外文字]\n解釋： [3-4段簡潔段落，謹慎使用**粗體**（僅用於最重要的結構性轉折），卡牌名稱使用一般文字，最後一段以**教訓：**開頭]`
          : `${structuralAnalysis ? `\n\n${structuralAnalysis}\n\n` : ''}${fullHistory ? `Here is the user's full reading history:\n\n${fullHistory}\n\n` : ''}Analyze the following recurring cards: ${cardNames}.${temporalAnalysis}\n\n**CRITICAL: You MUST respond in EXACTLY this format. Start your response with "Keywords:" on the first line, then "Interpretation:" on the second line.**\n\n**Step 1: Keywords (REQUIRED - first line only)**\nProvide keywords in ONE of these formats:\n- Opposition pattern: "x vs y" (e.g., "Illusion vs Truth" or "Struggle vs Liberation")\n- Synergistic pattern: "x, y, z" (e.g., "Transformation, Growth, Relationships" or "Clarity, Freedom, Joy")\n\n**Step 2: Interpretation (REQUIRED - second line onwards)**\n\n**MANDATORY STRUCTURE - Write exactly 3-4 concise paragraphs:**\n\n**Paragraph 1 (REQUIRED - 3-4 sentences):** Start with the STRUCTURAL EVOLUTION. Use **bold** for key structural shifts (e.g., **Major Arcana significantly decreased**, **Cups suit peaked in middle period**). Describe the narrative arc from early (what dominated) to late (what dominates now) in 3-4 concise sentences.\n\n**Paragraph 2 (REQUIRED - 4-5 sentences):** Integrate the recurring cards (Seven of Cups, Five of Pentacles, The Sun, The Devil, Ace of Swords) into the structural narrative. Use *italic* for card names (e.g., *The Devil*, *Seven of Cups*). Explain how these cards reflect the structural shifts.\n\n**Paragraph 3 (OPTIONAL - 3-4 sentences):** Add deeper insight connecting cards to structural evolution if needed.\n\n**Paragraph 4 (REQUIRED - 2-3 sentences):** Conclude with concise, actionable guidance. Start this paragraph with **LESSONS:** (bold) to create a clear takeaway message for the querent.\n\n**FORMATTING RULES:**\n- Use **bold** for structural shifts and key concepts (e.g., **significantly decreased**, **peaked in middle period**)\n- Use *italic* for card names (e.g., *The Devil*, *Ace of Swords*)\n- Keep paragraphs concise: 3-5 sentences each, maximum 4 paragraphs total\n- Total length: approximately 150-180 words (not 200+)\n- Your FIRST sentence MUST reference structural evolution\n- Use qualitative language only (never percentages)\n\n**EXAMPLE RESPONSE FORMAT:**\nKeywords: Illusion vs Truth\nInterpretation: **Your readings show a significant shift** from major transformations toward practical integration. The **Major Arcana proportion decreased substantially**, while **emotional themes (Cups) peaked in the middle period** before stabilizing. This reflects a journey from deep internal work to grounded action.\n\nThe recurring *The Devil* and *Ace of Swords* in your early readings embody this initial transformation phase, while *Seven of Cups* captures the emotional peak of the middle period.\n\n**LESSONS:** Your current focus is on practical integration and creative action. Leverage this clarity to build tangible systems and foster collaborative relationships.\n\n**YOUR RESPONSE (copy this format exactly):**\nKeywords: [your keywords here]\nInterpretation: [3-4 concise paragraphs with bold/italic formatting - START with structural evolution!]`;
        
        prompt = finalPrompt;
      }
    } else if (themeType === 'anomaly') {
      systemPrompt = locale === 'zh-TW'
        ? '你是一位經驗豐富的塔羅解讀者，專門分析統計異常和模式偏差。'
        : 'You are an experienced tarot reader specializing in analyzing statistical anomalies and pattern deviations.';
      
      const anomalyType = metadata?.title || themeKey;
      prompt = locale === 'zh-TW'
        ? `用戶的占卜顯示出統計異常：${anomalyType}。${metadata?.description || ''}\n\n請提供一個深入、有意義的解釋，說明這個異常對用戶的旅程意味著什麼。解釋應該：\n\n1. 解釋這個異常的意義和重要性\n2. 說明為什麼會出現這種模式（可能的內在或外在因素）\n3. 提供實用的指導，說明用戶如何理解並與這個模式合作\n4. 考慮這個異常可能揭示的成長機會或需要注意的領域\n\n請寫150-200字的深入解釋。`
        : `The user's readings show a statistical anomaly: ${anomalyType}. ${metadata?.description || ''}\n\nProvide a deep, meaningful interpretation of what this anomaly means for the user's journey. The interpretation should:\n\n1. Explain the significance and importance of this anomaly\n2. Explain why this pattern might be occurring (possible internal or external factors)\n3. Provide practical guidance on how the user can understand and work with this pattern\n4. Consider growth opportunities or areas of attention this anomaly might reveal\n\nWrite 150-200 words of deep insight.`;
    } else {
      // trend - check if it's "Multiple Recurring Themes" which needs structural analysis
      const isMultipleRecurringThemes = themeKey === 'Multiple Recurring Themes' || themeKey === '多重重複主題';
      
      if (isMultipleRecurringThemes && cards.length > 1) {
        // Use the same structural analysis approach as recurring_theme
        systemPrompt = locale === 'zh-TW'
          ? '你是一位經驗豐富的塔羅解讀者，專門分析多張重複出現的卡牌之間的主題網絡，並根據統計結構趨勢建構敘事弧線。'
          : 'You are an expert tarot reader specializing in analyzing thematic networks between multiple recurring cards and constructing narrative arcs based on statistical structural trends over time.';
        
        // Load full reading history
        const fullHistory = await PromptBuilder.loadRecentReadingHistory(
          userId,
          locale,
          1000,
          true,
          false,
          'apex',
          false
        );
        
        // Build structural statistics analysis (same as recurring_theme)
        const structuralStats = metadata?.structuralStatsOverTime as {
          early?: { major: number; minor: number; court: number; wands: number; cups: number; swords: number; pentacles: number };
          middle?: { major: number; minor: number; court: number; wands: number; cups: number; swords: number; pentacles: number };
          late?: { major: number; minor: number; court: number; wands: number; cups: number; swords: number; pentacles: number };
          overall?: { major: number; minor: number; court: number; wands: number; cups: number; swords: number; pentacles: number };
        } | undefined;
        
        // Analyze card distribution over time
        const cardTimeline = metadata?.cardTimeline as Record<string, string[]> | undefined;
        let temporalAnalysis = '';
        if (cardTimeline && Object.keys(cardTimeline).length > 0) {
          const timelineEntries = Object.entries(cardTimeline)
            .map(([cardName, timestamps]) => {
              const card = LOCAL_RWS_CARDS.find(c => c.title.en === cardName);
              const displayName = card ? (locale === 'zh-TW' ? card.title.zh : card.title.en) : cardName;
              return `${displayName}: appeared ${timestamps.length} times (${timestamps.length > 0 ? `first: ${new Date(timestamps[0]).toLocaleDateString()}, last: ${new Date(timestamps[timestamps.length - 1]).toLocaleDateString()}` : 'no dates'})`;
            })
            .join('\n');
          
          temporalAnalysis = locale === 'zh-TW'
            ? `\n\n卡牌出現時間分布：\n${timelineEntries}\n\n請特別注意這些卡牌在時間上的分布模式、出現順序、以及它們之間的時序關係。`
            : `\n\nCard occurrence timeline:\n${timelineEntries}\n\nPay special attention to the temporal distribution patterns, order of appearance, and chronological relationships between these cards.`;
        }
        
        // Build structural analysis (same logic as recurring_theme)
        let structuralAnalysis = '';
        
        if (structuralStats && structuralStats.early && structuralStats.middle && structuralStats.late) {
          const majorShift = structuralStats.late.major - structuralStats.early.major;
          const minorShift = structuralStats.late.minor - structuralStats.early.minor;
          const courtShift = structuralStats.late.court - structuralStats.early.court;
          const cupsShift = structuralStats.late.cups - structuralStats.early.cups;
          const wandsShift = structuralStats.late.wands - structuralStats.early.wands;
          
          const describeShift = (value: number) => {
            const absValue = Math.abs(value);
            if (absValue < 5) return null;
            const direction = value > 0 ? 'increased' : 'decreased';
            const magnitude = absValue > 15 ? 'significantly' : absValue > 10 ? 'substantially' : 'noticeably';
            return `${magnitude} ${direction}`;
          };
          
          const majorDesc = describeShift(majorShift);
          const minorDesc = describeShift(minorShift);
          const courtDesc = describeShift(courtShift);
          const cupsDesc = describeShift(cupsShift);
          const wandsDesc = describeShift(wandsShift);
          
          const earlyDominant = structuralStats.early.major > 35 ? 'Major Arcana' : 
                                structuralStats.early.cups > 25 ? 'Cups (Emotions)' :
                                structuralStats.early.wands > 25 ? 'Wands (Creativity)' :
                                structuralStats.early.minor > 55 ? 'Minor Arcana' : 'balanced';
          
          const lateDominant = structuralStats.late.major > 35 ? 'Major Arcana' :
                               structuralStats.late.cups > 25 ? 'Cups (Emotions)' :
                               structuralStats.late.wands > 25 ? 'Wands (Creativity)' :
                               structuralStats.late.minor > 55 ? 'Minor Arcana' : 'balanced';
          
          structuralAnalysis = locale === 'zh-TW'
            ? `\n\n**統計結構趨勢分析（早期/中期/晚期）：**\n\n**結構性演變模式：**\n${majorDesc ? `- 大阿爾克那：${majorDesc === 'significantly decreased' ? '顯著下降' : majorDesc === 'substantially decreased' ? '大幅下降' : '明顯下降'}（從早期的高比例轉向後期的較低比例，顯示從重大轉變主題轉向日常事務）` : ''}\n${minorDesc ? `- 小阿爾克那：${minorDesc === 'significantly increased' ? '顯著上升' : minorDesc === 'substantially increased' ? '大幅上升' : '明顯上升'}（實務層面的關注增加）` : ''}\n${courtDesc ? `- 宮廷牌：${courtDesc === 'significantly increased' ? '顯著上升' : courtDesc === 'substantially increased' ? '大幅上升' : '明顯上升'}（人物和關係動態的關注增加）` : ''}\n${cupsDesc ? `- 聖杯（情感）：${cupsDesc === 'significantly increased' ? '顯著上升' : cupsDesc === 'substantially increased' ? '大幅上升' : '明顯上升'}，特別是在中期達到高峰（情感主題的強烈湧現）` : ''}\n\n**敘事弧線：**\n早期階段以${earlyDominant === 'Major Arcana' ? '重大轉變和深層主題' : earlyDominant === 'Cups (Emotions)' ? '情感探索' : earlyDominant === 'Wands (Creativity)' ? '創造力' : '平衡'}為主導，逐漸演變為後期以${lateDominant === 'Major Arcana' ? '重大轉變' : lateDominant === 'Cups (Emotions)' ? '情感整合' : lateDominant === 'Wands (Creativity)' ? '創造性行動' : '實務整合'}為焦點。\n\n**你必須在解釋中：**\n1. 明確描述這個結構性演變如何反映用戶的成長軌跡\n2. 將重複卡牌與這些結構性變化結合，說明它們如何反映這個演變過程\n3. 建構一個清晰的敘事弧線，從早期狀態到當前狀態\n4. 使用定性語言描述趨勢（如「從重大轉變轉向實務整合」），而非具體數字`
            : `\n\n**STATISTICAL STRUCTURAL TRENDS OVER TIME (Early/Middle/Late Periods):**\n\n**STRUCTURAL EVOLUTION PATTERNS:**\n${majorDesc ? `- Major Arcana: ${majorDesc} (shifted from high proportion in early period to lower proportion in late period, indicating transition from major transformation themes toward daily practical matters)` : ''}\n${minorDesc ? `- Minor Arcana: ${minorDesc} (increased focus on practical, day-to-day concerns)` : ''}\n${courtDesc ? `- Court Cards: ${courtDesc} (increased attention to people, relationships, and interpersonal dynamics)` : ''}\n${cupsDesc ? `- Cups Suit (Emotions): ${cupsDesc}, peaking notably in the middle period (strong emotional themes emerging)` : ''}\n${wandsDesc ? `- Wands Suit (Creativity): ${wandsDesc} (creative energy shifts)` : ''}\n\n**NARRATIVE ARC:**\nThe early period was dominated by ${earlyDominant === 'Major Arcana' ? 'major transformations and deep themes' : earlyDominant === 'Cups (Emotions)' ? 'emotional exploration' : earlyDominant === 'Wands (Creativity)' ? 'creative impulses' : 'balanced energies'}, gradually evolving toward the late period's focus on ${lateDominant === 'Major Arcana' ? 'major life shifts' : lateDominant === 'Cups (Emotions)' ? 'emotional integration' : lateDominant === 'Wands (Creativity)' ? 'creative action' : 'practical integration'}.\n\n**YOU MUST IN YOUR INTERPRETATION:**\n1. Explicitly describe how this structural evolution reflects the user's growth trajectory\n2. Integrate the recurring cards with these structural changes, explaining how they reflect this evolution\n3. Construct a clear narrative arc from early state to current state\n4. Use qualitative language to describe trends (e.g., "shifted from major transformations toward practical integration") rather than specific percentages\n5. Make the structural analysis central to your interpretation - it should be the foundation, not an afterthought`;
        }
        
        // Build prompt with structural analysis
        const trendPrompt = `${structuralAnalysis ? `\n\n${structuralAnalysis}\n\n` : ''}${fullHistory ? `Here is the user's full reading history:\n\n${fullHistory}\n\n` : ''}Analyze the following recurring cards: ${cardNames}.${temporalAnalysis}\n\n**CRITICAL: You MUST respond in EXACTLY this format. Start your response with "Keywords:" on the first line, then "Interpretation:" on the second line.**\n\n**Step 1: Keywords (REQUIRED - first line only)**\nProvide keywords in ONE of these formats:\n- Opposition pattern: "x vs y" (e.g., "Illusion vs Truth" or "Struggle vs Liberation")\n- Synergistic pattern: "x, y, z" (e.g., "Transformation, Growth, Relationships" or "Clarity, Freedom, Joy")\n\n**Step 2: Interpretation (REQUIRED - second line onwards)**\n\n**MANDATORY STRUCTURE - Write exactly 3-4 concise paragraphs:**\n\n**Paragraph 1 (REQUIRED - 3-4 sentences):** Start with the STRUCTURAL EVOLUTION. Use **bold** for key structural shifts (e.g., **Major Arcana significantly decreased**, **Cups suit peaked in middle period**). Describe the narrative arc from early (what dominated) to late (what dominates now) in 3-4 concise sentences.\n\n**Paragraph 2 (REQUIRED - 4-5 sentences):** Integrate the recurring cards (${cards.join(', ')}) into the structural narrative. Use *italic* for card names (e.g., *The Devil*, *Seven of Cups*). Explain how these cards reflect the structural shifts.\n\n**Paragraph 3 (OPTIONAL - 3-4 sentences):** Add deeper insight connecting cards to structural evolution if needed.\n\n**Paragraph 4 (REQUIRED - 2-3 sentences):** Conclude with concise, actionable guidance. Start this paragraph with **LESSONS:** (bold) to create a clear takeaway message for the querent.\n\n**FORMATTING RULES:**\n- Use **bold** for structural shifts and key concepts (e.g., **significantly decreased**, **peaked in middle period**)\n- Use *italic* for card names (e.g., *The Devil*, *Ace of Swords*)\n- Keep paragraphs concise: 3-5 sentences each, maximum 4 paragraphs total\n- Total length: approximately 150-180 words (not 200+)\n- Your FIRST sentence MUST reference structural evolution\n- Use qualitative language only (never percentages)\n\n**EXAMPLE RESPONSE FORMAT:**\nKeywords: Illusion vs Truth\nInterpretation: **Your readings show a significant shift** from major transformations toward practical integration. The **Major Arcana proportion decreased substantially**, while **emotional themes (Cups) peaked in the middle period** before stabilizing. This reflects a journey from deep internal work to grounded action.\n\nThe recurring *The Devil* and *Ace of Swords* in your early readings embody this initial transformation phase, while *Seven of Cups* captures the emotional peak of the middle period.\n\n**LESSONS:** Your current focus is on practical integration and creative action. Leverage this clarity to build tangible systems and foster collaborative relationships.\n\n**YOUR RESPONSE (copy this format exactly):**\nKeywords: [your keywords here]\nInterpretation: [3-4 concise paragraphs with bold/italic formatting - START with structural evolution!]`;
        
        prompt = trendPrompt;
      } else {
        // Regular trend (not multiple recurring themes)
        systemPrompt = locale === 'zh-TW'
          ? '你是一位經驗豐富的塔羅解讀者，專門分析占卜中的趨勢和模式。'
          : 'You are an experienced tarot reader specializing in analyzing trends and patterns in readings.';
        
        const trendType = metadata?.title || themeKey;
        prompt = locale === 'zh-TW'
          ? `用戶的占卜顯示出一個趨勢：${trendType}。${metadata?.description || ''}\n\n請提供一個深入、有意義的解釋，說明這個趨勢對用戶的旅程意味著什麼。解釋應該：\n\n1. 解釋這個趨勢的意義和重要性\n2. 說明這個模式如何反映用戶當前的能量和焦點\n3. 提供實用的指導，說明用戶如何與這個趨勢合作\n4. 考慮這個趨勢可能揭示的成長方向或需要注意的領域\n\n請寫150-200字的深入解釋。`
          : `The user's readings show a trend: ${trendType}. ${metadata?.description || ''}\n\nProvide a deep, meaningful interpretation of what this trend means for the user's journey. The interpretation should:\n\n1. Explain the significance and importance of this trend\n2. Explain how this pattern reflects the user's current energy and focus\n3. Provide practical guidance on how the user can work with this trend\n4. Consider growth directions or areas of attention this trend might reveal\n\nWrite 150-200 words of deep insight.`;
      }
    }

    // Generate interpretation in English first
    const resultEn = await AIProvider.generate({
      prompt,
      systemPrompt,
      maxTokens: 600, // Reduced for concise 3-4 paragraph responses (150-180 words)
      temperature: 0.7,
      language: 'en',
    });

    const fullTextEn = resultEn.text.trim();
    
    // Parse the response to extract keywords and interpretation
    const parseThemeResponse = (text: string): { keywords: string; interpretation: string } => {
      // Try multiple patterns to extract keywords
      // Pattern 1: "Keywords: x, y, z" or "Keywords: x vs y" (most common)
      let keywordsMatch = text.match(/(?:Keywords|關鍵詞)[:：]\s*([^\n]+?)(?:\n|$)/i);
      
      // Pattern 2: If no colon, try "Keywords x, y, z" or "Keywords x vs y"
      if (!keywordsMatch) {
        keywordsMatch = text.match(/(?:Keywords|關鍵詞)\s+([^\n]+?)(?:\n|$)/i);
      }
      
      // Pattern 3: Look for the first line that contains keywords format
      if (!keywordsMatch) {
        const lines = text.split('\n');
        for (const line of lines.slice(0, 3)) { // Check first 3 lines only
          const trimmed = line.trim();
          // Match "x vs y" or "x, y, z" patterns
          const vsMatch = trimmed.match(/^([A-Za-z][A-Za-z\s]{0,30}?)\s+vs\s+([A-Za-z][A-Za-z\s]{0,30}?)$/i);
          const commaMatch = trimmed.match(/^([A-Za-z][A-Za-z\s]{0,15}(?:,\s*[A-Za-z][A-Za-z\s]{0,15}){1,2})$/);
          if (vsMatch && vsMatch[1] && vsMatch[2]) {
            keywordsMatch = [null, `${vsMatch[1].trim()} vs ${vsMatch[2].trim()}`];
            break;
          } else if (commaMatch && commaMatch[1]) {
            keywordsMatch = [null, commaMatch[1].trim()];
            break;
          }
        }
      }
      
      // Pattern 4: Look for "x vs y" or "x, y, z" patterns anywhere in first few lines (more flexible)
      if (!keywordsMatch) {
        const firstLines = text.split('\n').slice(0, 5).join(' ');
        const vsPattern = firstLines.match(/([A-Z][a-z]+(?:\s+[a-z]+){0,2})\s+vs\s+([A-Z][a-z]+(?:\s+[a-z]+){0,2})/i);
        const commaPattern = firstLines.match(/([A-Z][a-z]+(?:\s+[a-z]+){0,2}(?:,\s*[A-Z][a-z]+(?:\s+[a-z]+){0,2}){2})/);
        if (vsPattern && vsPattern[1] && vsPattern[2]) {
          keywordsMatch = [null, `${vsPattern[1].trim()} vs ${vsPattern[2].trim()}`];
        } else if (commaPattern && commaPattern[1]) {
          keywordsMatch = [null, commaPattern[1].trim()];
        }
      }
      
      // Extract interpretation - look for "Interpretation:" label or everything after keywords
      let interpretationMatch = text.match(/(?:Interpretation|解釋)[:：]\s*(.+?)$/is);
      
      // If no interpretation label, take everything after the keywords line
      if (!interpretationMatch && keywordsMatch) {
        const keywordsEnd = text.indexOf(keywordsMatch[0] || '');
        if (keywordsEnd >= 0) {
          const afterKeywords = text.substring(keywordsEnd + (keywordsMatch[0]?.length || 0));
          interpretationMatch = [null, afterKeywords.trim()];
        }
      }
      
      // If still no interpretation, use the whole text (minus keywords line)
      if (!interpretationMatch) {
        if (keywordsMatch && keywordsMatch[0]) {
          interpretationMatch = [null, text.replace(keywordsMatch[0], '').trim()];
        } else {
          interpretationMatch = [null, text.trim()];
        }
      }
      
      let keywords = keywordsMatch?.[1]?.trim() || '';
      let interpretation = interpretationMatch?.[1]?.trim() || text.trim();
      
      // If keywords weren't found, try to extract keywords from interpretation text
      if (!keywords && interpretation.length > 50) {
        // Common tarot theme words to look for
        const themeWords = [
          'illusion', 'truth', 'clarity', 'confusion', 'liberation', 'attachment', 'freedom', 'bondage',
          'struggle', 'breakthrough', 'transformation', 'growth', 'joy', 'sorrow', 'light', 'shadow',
          'inner', 'outer', 'self', 'other', 'choice', 'fate', 'power', 'weakness', 'strength', 'vulnerability',
          'hope', 'despair', 'love', 'fear', 'courage', 'doubt', 'wisdom', 'ignorance', 'peace', 'chaos',
          'balance', 'imbalance', 'harmony', 'conflict', 'unity', 'division', 'wholeness', 'fragmentation'
        ];
        
        // Look for oppositional patterns first: "X vs Y", "X versus Y", "between X and Y"
        const vsPatterns = [
          interpretation.match(/([A-Z][a-z]+(?:\s+[a-z]+)*)\s+vs\s+([A-Z][a-z]+(?:\s+[a-z]+)*)/i),
          interpretation.match(/([A-Z][a-z]+(?:\s+[a-z]+)*)\s+versus\s+([A-Z][a-z]+(?:\s+[a-z]+)*)/i),
          interpretation.match(/between\s+([a-z]+(?:\s+[a-z]+)*)\s+and\s+([a-z]+(?:\s+[a-z]+)*)/i),
          interpretation.match(/([A-Z][a-z]+)\s+and\s+([A-Z][a-z]+)/g), // Simple "X and Y" pattern
        ];
        
        for (const vsMatch of vsPatterns) {
          if (vsMatch && vsMatch[1] && vsMatch[2]) {
            const word1 = vsMatch[1].trim();
            const word2 = vsMatch[2].trim();
            // Validate these are actual theme words (not too long, not common words)
            if (word1.length < 20 && word2.length < 20 && 
                word1.length > 2 && word2.length > 2 &&
                !['the', 'and', 'but', 'for', 'with', 'from', 'into', 'this', 'that'].includes(word1.toLowerCase()) &&
                !['the', 'and', 'but', 'for', 'with', 'from', 'into', 'this', 'that'].includes(word2.toLowerCase())) {
              keywords = `${word1} vs ${word2}`;
              break;
            }
          }
        }
        
        // If no opposition found, extract 3 key theme words from the text
        if (!keywords) {
          const lowerText = interpretation.toLowerCase();
          const foundThemes: string[] = [];
          
          // Find theme words mentioned in the text
          for (const theme of themeWords) {
            if (lowerText.includes(theme) && !foundThemes.includes(theme)) {
              foundThemes.push(theme);
              if (foundThemes.length >= 3) break;
            }
          }
          
          // If we found themes, capitalize and format them
          if (foundThemes.length >= 2) {
            keywords = foundThemes
              .slice(0, 3)
              .map(t => t.charAt(0).toUpperCase() + t.slice(1))
              .join(', ');
          } else if (foundThemes.length === 1) {
            // If only one theme found, look for related concepts
            // Extract capitalized words that might be themes
            const capitalizedWords = interpretation.match(/\b([A-Z][a-z]+)\b/g) || [];
            const uniqueCaps = [...new Set(capitalizedWords)]
              .filter(w => w.length > 3 && w.length < 15)
              .filter(w => !['The', 'This', 'Your', 'You', 'That', 'These', 'Those'].includes(w))
              .slice(0, 2);
            
            if (uniqueCaps.length >= 1) {
              keywords = [foundThemes[0].charAt(0).toUpperCase() + foundThemes[0].slice(1), ...uniqueCaps].join(', ');
            }
          }
        }
      }
      
      // Validate keywords - if they're too long (likely wrong extraction), clear them
      if (keywords && keywords.length > 100) {
        keywords = '';
      }
      
      // Final fallback: if still no keywords and we have card names, generate simple keywords from cards
      if (!keywords && cards && cards.length > 0) {
        // Extract key concepts from card names (e.g., "Seven of Cups" -> "Choices", "The Sun" -> "Joy")
        const cardKeywords: string[] = [];
        const cardNameMap: Record<string, string> = {
          'Seven of Cups': 'Choices',
          'Five of Pentacles': 'Struggle',
          'The Sun': 'Joy',
          'The Devil': 'Attachment',
          'Ace of Swords': 'Clarity',
        };
        
        for (const card of cards.slice(0, 3)) {
          if (cardNameMap[card]) {
            cardKeywords.push(cardNameMap[card]);
          }
        }
        
        if (cardKeywords.length >= 2) {
          keywords = cardKeywords.join(', ');
        } else if (cardKeywords.length === 1 && cards.length >= 2) {
          // Try to find an opposite or complementary theme
          const secondCard = cards[1];
          if (secondCard.includes('Devil')) {
            keywords = `${cardKeywords[0]} vs Attachment`;
          } else if (secondCard.includes('Sun')) {
            keywords = `${cardKeywords[0]}, Joy`;
          } else {
            keywords = cardKeywords[0];
          }
        }
      }
      
      return {
        keywords: keywords,
        interpretation: interpretation,
      };
    };
    
    const parsedEn = parseThemeResponse(fullTextEn);
    const interpretationEn = parsedEn.interpretation || fullTextEn;
    let themeNamesEn = parsedEn.keywords || '';
    
    // Clean up theme names - remove any extra formatting
    if (themeNamesEn) {
      // Remove brackets if present: [x, y, z] -> x, y, z
      themeNamesEn = themeNamesEn.replace(/^\[|\]$/g, '').trim();
      // Remove quotes if present: "x, y, z" -> x, y, z
      themeNamesEn = themeNamesEn.replace(/^["']|["']$/g, '').trim();
    }

    // Generate Chinese interpretation if locale is Chinese
    let interpretationZh: string | undefined;
    let themeNamesZh: string | undefined;
    if (locale === 'zh-TW') {
      const resultZh = await AIProvider.generate({
        prompt,
        systemPrompt,
        maxTokens: 400,
        temperature: 0.7,
        language: 'zh-TW',
      });
      const parsedZh = parseThemeResponse(resultZh.text.trim());
      interpretationZh = parsedZh.interpretation || resultZh.text.trim();
      themeNamesZh = parsedZh.keywords || '';
      
      // Clean up theme names - remove any extra formatting
      if (themeNamesZh) {
        // Remove brackets if present: [x, y, z] -> x, y, z
        themeNamesZh = themeNamesZh.replace(/^\[|\]$/g, '').trim();
        // Remove quotes if present: "x, y, z" -> x, y, z
        themeNamesZh = themeNamesZh.replace(/^["']|["']$/g, '').trim();
      }
    }

    // Japanese not supported in current locale system
    let interpretationJa: string | undefined;
    let themeNamesJa: string | undefined;

    // Calculate expiration date (8 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REGENERATION_INTERVAL_DAYS);

    // Save to database
    // First try to update existing record, then insert if not found
    const { data: existing, error: fetchError } = await supabase
      .from('theme_interpretations')
      .select('id')
      .eq('user_id', userId)
      .eq('theme_key', themeKey)
      .maybeSingle(); // Use maybeSingle() to handle no rows gracefully
    
    // If table doesn't exist, skip saving and just return the interpretation
    if (fetchError && fetchError.code === '42P01') { // Table doesn't exist
      // Return interpretation object without saving
      return {
        id: 'temp',
        theme_type: themeType,
        theme_key: themeKey,
        cards: cards.length > 0 ? cards : undefined,
        interpretation_en: interpretationEn,
        interpretation_zh: interpretationZh,
        interpretation_ja: interpretationJa,
        summary_en: undefined,
        summary_zh: undefined,
        summary_ja: undefined,
        theme_names: (locale === 'zh-TW' && themeNamesZh) ? themeNamesZh : themeNamesEn,
        generated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        metadata: metadata || {},
      } as ThemeInterpretation;
    }

    const interpretationData = {
      user_id: userId,
      theme_type: themeType,
      theme_key: themeKey,
      cards: cards.length > 0 ? cards : null,
      interpretation_en: interpretationEn,
      interpretation_zh: interpretationZh || null,
      interpretation_ja: interpretationJa || null,
      summary_en: undefined,
      summary_zh: undefined,
      summary_ja: undefined,
      theme_names: (locale === 'zh-TW' && themeNamesZh) ? themeNamesZh : (themeNamesEn || null),
      expires_at: expiresAt.toISOString(),
      metadata: metadata || {},
    };

    let data, error;
    
    if (existing && (existing as any).id) {
      // Update existing record
      const result = await (supabase
        .from('theme_interpretations') as any)
        .update(interpretationData)
        .eq('id', (existing as any).id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new record
      const result = await (supabase
        .from('theme_interpretations') as any)
        .insert(interpretationData)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      return null;
    }

    if (!data) return null;
    
    return {
      id: (data as any).id || 'temp',
      theme_type: themeType,
      theme_key: themeKey,
      cards: cards.length > 0 ? cards : undefined,
      interpretation_en: interpretationEn,
      interpretation_zh: interpretationZh,
      interpretation_ja: interpretationJa,
      summary_en: undefined,
      summary_zh: undefined,
      summary_ja: undefined,
      theme_names: (locale === 'zh-TW' && themeNamesZh) ? themeNamesZh : themeNamesEn,
      generated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      metadata: metadata || {},
    } as ThemeInterpretation;
  } catch (error) {
    return null;
  }
}

/**
 * Batch generate interpretations for multiple themes
 */
export async function generateThemeInterpretations(
  userId: string,
  themes: Array<{
    type: 'recurring_theme' | 'anomaly' | 'trend';
    key: string;
    cards?: string[];
    metadata?: Record<string, any>;
  }>,
  locale: SupportedLocale,
  forceRegenerate?: boolean // Add flag to force regeneration
): Promise<Map<string, { summary: string; interpretation: string; themeNames?: string }>> {
  const interpretations = new Map<string, { summary: string; interpretation: string; themeNames?: string }>();

  // Generate interpretations in parallel (limit to 3 at a time to avoid rate limits)
  const batchSize = 3;
  for (let i = 0; i < themes.length; i += batchSize) {
    const batch = themes.slice(i, i + batchSize);
    const promises = batch.map(async (theme) => {
      const interpretation = await getThemeInterpretation(
        userId,
        theme.type,
        theme.key,
        theme.cards || [],
        locale,
        theme.metadata,
        forceRegenerate
      );
      if (interpretation) {
        interpretations.set(theme.key, interpretation);
      }
    });
    await Promise.all(promises);
  }

  return interpretations;
}
