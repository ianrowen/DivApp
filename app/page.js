'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  writeBatch, 
  getDocs, 
  serverTimestamp,
  doc
} from 'firebase/firestore';
import { RWS_CARD_DATA, SPREAD_POSITIONS, CORRESPONDENCE_ICONS } from './data/cardData';
import SingleCard from './components/SingleCard';
import ManualCardSelector from './components/ManualCardSelector';
import HistoryView from './components/HistoryView';
import InitialChoice from './components/InitialChoice';

// Image path configuration
const ASSET_PATH = "/RWS_App_Assets/";
// Alternative: Use GitHub raw URLs if images aren't downloaded
// const ASSET_PATH = "https://raw.githubusercontent.com/ianrowen/DivApp/main/RWS_App_Assets/";

const CARD_BACK_URL = "https://placehold.co/250x450/1e293b/cbd5e1?text=RWS+Tarot+Back";

let globalAudioPlayer = null;

// Audio utility functions
const base64ToArrayBuffer = (base64) => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

const writeWavHeader = (samples, sampleRate) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset, samples[i], true);
    offset += 2;
  }

  return buffer;
};

const pcmToWav = (pcm16, sampleRate) => {
  const wavBuffer = writeWavHeader(pcm16, sampleRate);
  return new Blob([wavBuffer], { type: 'audio/wav' });
};

export default function TarotApp() {
  const [mounted, setMounted] = useState(false);
  const [drawMethod, setDrawMethod] = useState(null);
  const [spreadType, setSpreadType] = useState('three-card');
  const [drawnCards, setDrawnCards] = useState([]);
  const [readingText, setReadingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCardTitle, setSelectedCardTitle] = useState(null);
  const [deepDiveText, setDeepDiveText] = useState("");
  const [audioLoading, setAudioLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);
  const [readingStyle, setReadingStyle] = useState('traditional');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [querentQuestion, setQuerentQuestion] = useState("");
  const [userReflection, setUserReflection] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [db, setDb] = useState(null);
  const [appId, setAppId] = useState(null);

  // Fix hydration by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const cardPositions = SPREAD_POSITIONS[spreadType].positions || [];
  const isDrawReady = drawnCards.length === cardPositions.length && drawnCards.length > 0;

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL;

  const stopAudio = () => {
    if (globalAudioPlayer) {
      globalAudioPlayer.pause();
      globalAudioPlayer.currentTime = 0;
      globalAudioPlayer = null;
      setAudioLoading(false);
    }
  };

  // Firebase initialization
  useEffect(() => {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "") {
      try {
        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const auth = getAuth(app);
        
        setDb(firestoreDb);
        setAppId(firebaseConfig.projectId);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setUserId(user.uid);
            setIsAuthenticated(true);
          } else {
            signInAnonymously(auth)
              .then(userCredential => {
                setUserId(userCredential.user.uid);
                setIsAuthenticated(true);
              })
              .catch(e => {
                console.warn("Firebase Auth error:", e);
                setIsAuthenticated(false);
              });
          }
          setIsAuthReady(true);
        });

        return () => unsubscribe();
      } catch (e) {
        console.error("Firebase initialization error:", e);
        setIsAuthReady(true);
      }
    } else {
      setIsAuthReady(true);
    }
  }, []);

  const retryFetch = async (url, options, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          throw new Error("Failed to connect after multiple attempts.");
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  };

  const saveReadingToHistory = async (cards, spreadName) => {
    if (!db || !userId || !isAuthenticated) {
      console.warn("History saving inactive.");
      return;
    }

    try {
      const readingData = {
        userId: userId,
        spreadName: spreadName,
        cards: cards.map(c => ({
          title: c.title,
          orientation: c.orientation,
          position: c.position,
          filename: c.filename
        })),
        interpretation: "",
        timestamp: serverTimestamp(),
      };

      if (querentQuestion.trim()) {
        readingData.question = querentQuestion.trim();
      }
      if (userReflection.trim()) {
        readingData.reflection = userReflection.trim();
      }

      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/readings`), readingData);
      setSaveMessage("Reading Saved!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Save Failed!");
      console.error("Error saving:", error);
    }
  };

  const getSystemPrompt = (style, cards) => {
    const numCards = cards.length;

    if (style === 'esoteric') {
      if (numCards === 1) {
        return "You are a scholarly and esoteric Tarot reader focusing on astrological and elemental forces. Your response must be a single paragraph of exactly four sentences. Focus primarily on the card's planetary and elemental influence on the querent's situation, providing a deep, abstract insight.";
      } else if (numCards === 2) {
        return "You are a scholarly and esoteric Tarot reader focusing on astrological and elemental forces interpreting a two-card spread. Your response must be a single paragraph of exactly four sentences that analyzes the elemental dynamic and planetary flow between the primary issue and guiding force.";
      } else if (numCards === 3) {
        return "You are a scholarly and esoteric Tarot reader focusing on astrological and elemental forces interpreting a three-card spread. Your response must be a single paragraph of exactly five sentences that analyzes the elemental dynamic and planetary flow across the Past, Present, and Future.";
      } else if (numCards === 10) {
        return "You are a scholarly and esoteric Tarot reader interpreting the Celtic Cross. Your response must be a deep analysis of 8-10 sentences, focusing on the elemental balance/imbalance in the spread, and how planetary influences guide the final outcome.";
      }
    } else if (style === 'jungian') {
      if (numCards === 1) {
        return "You are a Jungian analyst who provides sharp, non-vague psychological interpretations. Your response must be a single paragraph of exactly four sentences. Analyze the card's symbolism through the lens of a single core archetype (Ego, Shadow, Persona, or Self) and provide specific advice on the psychological task required for individuation. Do not use generic self-help language.";
      } else if (numCards === 2) {
        return "You are a Jungian analyst who provides sharp, non-vague psychological interpretations. Your response must be a single paragraph of exactly four sentences. Analyze the two cards as interacting archetypes (e.g., Shadow vs. Persona) and precisely define the psychological conflict or integration task required for the querent's growth.";
      } else if (numCards === 3) {
        return "You are a Jungian analyst interpreting a three-card spread. Your response must be a single paragraph of exactly five sentences. Trace the psychological journey of the querent from past unconscious conditioning to future individuation, focusing on the specific archetypal challenge (Present card). The language must be sharp and specific to Jungian concepts.";
      } else if (numCards === 10) {
        return "You are a Jungian analyst interpreting the ten cards of the Celtic Cross spread. Your interpretation must be a narrative of approximately 8-10 sentences. Analyze the spread as a map of the collective unconscious, identifying the core archetypes (Shadow/Ego/Persona) driving the querent's current conflict and defining the path toward psychological integration.";
      }
    }

    if (numCards === 1) {
      return "You are a wise, compassionate Tarot reader who tells a concise story. Your response must be a single paragraph of exactly four sentences. Interpret the card's meaning by crafting a short narrative that highlights the card's advice and direct significance for the user's situation. Focus on storytelling and personal action, minimizing mention of astrology.";
    } else if (numCards === 2) {
      return "You are a wise, compassionate Tarot reader who tells a concise story. Your response must be a single paragraph of exactly four sentences. Create a short narrative that flows between the Primary Issue and the Guiding Force, offering direct, actionable advice.";
    } else if (numCards === 3) {
      return "You are a wise, compassionate Tarot reader who tells a concise story. Your response must be a single paragraph of exactly five sentences. Connect the Past, Present, and Future cards into a compelling, clear narrative arc, emphasizing the story of growth and decision-making.";
    } else if (numCards === 10) {
      return "You are a highly detailed and profound Tarot master interpreting the ten cards of the Celtic Cross spread. Your interpretation must be a narrative story of approximately 8-10 sentences. Focus on the querent's life story as represented by the spread, emphasizing the journey, conflict, and the final narrative conclusion. Minimize mention of elemental or astrological details.";
    }
  };

  const getGeminiReading = useCallback(async (cards) => {
    if (cards.length === 0 || !GEMINI_API_KEY) return;

    setIsLoading(true);
    setReadingText("");
    setPlaybackError(null);
    stopAudio();

    const model = 'gemini-2.5-flash';
    const proxyUrlWithModel = `${PROXY_URL}?model=${model}`;
    const spreadName = SPREAD_POSITIONS[spreadType].label;

    const richCards = cards.map(card => {
      const fullData = RWS_CARD_DATA.find(masterCard => masterCard.title === card.title) || card;
      return `[${card.position}]: ${card.title} in the ${card.orientation} position. Astro: ${fullData.astro}, Element: ${fullData.element}. Keywords: ${fullData.keywords.join(', ')}.`;
    }).join('\n');

    const systemPrompt = getSystemPrompt(readingStyle, cards);

    let userQuery = `Spread: ${spreadName}. Cards:\n${richCards}`;

    if (querentQuestion.trim()) {
      userQuery = `Querent Question: "${querentQuestion.trim()}"\n\n${userQuery}`;
    }

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };

    try {
      const result = await retryFetch(proxyUrlWithModel, options);
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || result.error?.message || "Interpretation failed.";
      setReadingText(text);

      if (audioEnabled) {
        getGeminiAudio(text);
      }
    } catch (error) {
      setReadingText(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [spreadType, GEMINI_API_KEY, readingStyle, audioEnabled, querentQuestion, PROXY_URL]);

  const getGeminiDeepDive = useCallback(async (card) => {
    if (!GEMINI_API_KEY) {
      setDeepDiveText("API Key Missing.");
      setShowDeepDive(true);
      return;
    }

    setDeepDiveText("Generating analysis...");
    setSelectedCardTitle(card.title);
    setShowDeepDive(true);

    const model = 'gemini-2.5-flash';
    const proxyUrlWithModel = `${PROXY_URL}?model=${model}`;

    const systemPrompt = "You are a scholarly Tarot historian and symbolism expert. Provide a concise three-sentence analysis of the given card's symbolism and esoteric meaning, focusing on its astrological and elemental forces.";

    const fullData = RWS_CARD_DATA.find(c => c.title === card.title) || card;

    const userQuery = `Analyze the symbolism of: ${card.title} in the ${card.orientation} position. Arcana: ${fullData.arcana}. Suit: ${fullData.suit || 'Trump'}. Astrological/Elemental: ${fullData.astro} (${fullData.element}). Keywords: ${fullData.keywords.join(', ')}.`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };

    try {
      const result = await retryFetch(proxyUrlWithModel, options);
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis failed.";
      setDeepDiveText(text);
    } catch (error) {
      setDeepDiveText(`Analysis failed: ${error.message}`);
    }
  }, [GEMINI_API_KEY, PROXY_URL]);

  const getGeminiAudio = useCallback(async (text) => {
    if (!text || !GEMINI_API_KEY) {
      setPlaybackError("Audio failed: No text or API key.");
      return;
    }

    stopAudio();
    setAudioLoading(true);
    setPlaybackError(null);

    const model = 'gemini-2.5-flash-preview-tts';
    const proxyUrlWithModel = `${PROXY_URL}?model=${model}`;

    const payload = {
      contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Puck" }
          }
        }
      },
      model: "gemini-2.5-flash-preview-tts"
    };

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };

    try {
      const result = await retryFetch(proxyUrlWithModel, options);
      const part = result.candidates?.[0]?.content?.parts?.[0];
      const audioData = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType;

      if (audioData && mimeType && mimeType.startsWith("audio/L16")) {
        const rateMatch = mimeType.match(/rate=(\d+)/);
        const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 16000;

        const pcmData = base64ToArrayBuffer(audioData);
        const pcm16 = new Int16Array(pcmData);
        const wavBlob = pcmToWav(pcm16, sampleRate);
        const audioUrl = URL.createObjectURL(wavBlob);

        const audio = new Audio(audioUrl);
        audio.onended = () => globalAudioPlayer = null;
        audio.play();
        globalAudioPlayer = audio;
      } else {
        throw new Error("TTS response was empty or incorrect format.");
      }
    } catch (error) {
      setPlaybackError(`Audio generation failed: ${error.message}`);
    } finally {
      setAudioLoading(false);
    }
  }, [GEMINI_API_KEY, PROXY_URL]);

  const getRandomCards = (numCards) => {
    let deck = [...RWS_CARD_DATA];
    let newCards = [];
    for (let i = 0; i < numCards; i++) {
      if (deck.length === 0) break;
      const randomIndex = Math.floor(Math.random() * deck.length);
      const card = deck.splice(randomIndex, 1)[0];
      card.orientation = Math.random() > 0.5 ? 'Upright' : 'Reversed';
      newCards.push(card);
    }
    return newCards;
  };

  const handleStartReading = (method) => {
    setDrawMethod(method);
    setReadingText("");
    setPlaybackError(null);
    stopAudio();
    setDrawnCards([]);
    setUserReflection("");

    const positions = SPREAD_POSITIONS[spreadType].positions;
    const numCards = positions.length;

    if (method === 'auto') {
      const newCards = getRandomCards(numCards);
      const positionedCards = newCards.map((card, i) => ({
        ...card,
        position: positions[i]
      }));

      setDrawnCards(positionedCards);
      getGeminiReading(positionedCards);
    } else {
      const cardBackData = {
        title: null,
        orientation: 'Upright',
        keywords: [],
        astro: 'N/A',
        element: 'N/A',
        filename: CARD_BACK_URL
      };
      const initialManualCards = positions.map(position => ({
        ...cardBackData,
        position: position,
      }));
      setDrawnCards(initialManualCards);
    }
  };

  const handleManualSelect = (index, title) => {
    const cardData = RWS_CARD_DATA.find(c => c.title === title);
    if (!cardData) return;

    const newCards = drawnCards.map((card, i) => {
      if (i === index) {
        return {
          ...cardData,
          orientation: Math.random() > 0.5 ? 'Upright' : 'Reversed',
          position: cardPositions[i]
        };
      }
      return card;
    });
    setDrawnCards(newCards);
  };

  const handleManualConfirm = () => {
    const ready = drawnCards.every(c => c.title !== null);
    if (ready) {
      getGeminiReading(drawnCards);
    } else {
      setReadingText("Please select a card for every position.");
    }
  };

  const handleSelectHistoryReading = (reading) => {
    const detailedCards = reading.cards.map(historyCard => {
      const fullData = RWS_CARD_DATA.find(masterCard => masterCard.title === historyCard.title);
      if (fullData) {
        return {
          ...fullData,
          orientation: historyCard.orientation,
          position: historyCard.position,
          filename: fullData.filename
        };
      }
      return historyCard;
    });

    setDrawnCards(detailedCards);
    setReadingText(reading.interpretation);
    setQuerentQuestion(reading.question || "");
    setUserReflection(reading.reflection || "");

    const numCards = reading.cards.length;
    const spreadKey = Object.keys(SPREAD_POSITIONS).find(key => SPREAD_POSITIONS[key].positions.length === numCards);
    setSpreadType(spreadKey || 'three-card');
    setDrawMethod('auto');
  };

  const handleSelectHistoryAndRerun = (historyItem) => {
    setQuerentQuestion(historyItem.question || "");
    setUserReflection(historyItem.reflection || "");

    const detailedCards = historyItem.cards.map(historyCard => {
      const fullData = RWS_CARD_DATA.find(masterCard => masterCard.title === historyCard.title);
      if (fullData) {
        return {
          ...fullData,
          orientation: historyCard.orientation,
          position: historyCard.position,
          filename: fullData.filename
        };
      }
      return historyCard;
    });

    const numCards = historyItem.cards.length;
    const spreadKey = Object.keys(SPREAD_POSITIONS).find(key => SPREAD_POSITIONS[key].positions.length === numCards);
    setSpreadType(spreadKey || 'three-card');
    setDrawMethod('auto');

    setDrawnCards(detailedCards);
    getGeminiReading(detailedCards);
  };

  const renderCardSpread = () => {
    if (spreadType === 'celtic-cross') {
      const CardSlot = ({ index, style = {} }) => {
        const card = drawnCards[index];
        if (!card) return null;
        return (
          <div key={index} style={style}>
            <SingleCard 
              card={card} 
              position={card.position} 
              onDeepDive={getGeminiDeepDive}
              assetPath={ASSET_PATH}
              cardBackUrl={CARD_BACK_URL}
            />
          </div>
        );
      };

      return (
        <div className="flex justify-center mt-6">
          <div className="grid grid-cols-5 grid-rows-3 gap-x-6 gap-y-4 max-w-7xl mx-auto items-center justify-center">
            <div className="col-start-4 row-start-1"><CardSlot index={7} /></div>
            <div className="col-start-4 row-start-2"><CardSlot index={6} /></div>
            <div className="col-start-5 row-start-2"><CardSlot index={8} /></div>
            <div className="col-start-4 row-start-3"><CardSlot index={9} /></div>

            <div className="col-start-2 row-span-3 flex flex-col items-center justify-center space-y-2">
              <CardSlot index={2} />
              <div className="relative">
                <CardSlot index={0} />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ width: '100%', height: '100%', maxWidth: '160px' }}>
                  <div className="h-full w-full transform rotate-90 scale-90 origin-center">
                    <CardSlot index={1} />
                  </div>
                </div>
              </div>
              <CardSlot index={4} />
            </div>

            <div className="col-start-1 row-span-3 flex flex-col items-center justify-center space-y-2">
              <CardSlot index={3} />
              <CardSlot index={5} />
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className={`grid grid-cols-1 sm:grid-cols-${drawnCards.length} gap-4 mt-6 max-w-4xl mx-auto`}>
          {drawnCards.map((card, index) => (
            <SingleCard 
              key={index} 
              card={card} 
              position={card.position} 
              onDeepDive={getGeminiDeepDive}
              assetPath={ASSET_PATH}
              cardBackUrl={CARD_BACK_URL}
            />
          ))}
        </div>
      );
    }
  };

  const cardsReady = drawnCards.every(c => c.title !== null);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 bg-white rounded-xl shadow-2xl">
        <h1 className="text-4xl font-serif font-bold text-center text-indigo-800 mb-6">
          Loading...
        </h1>
      </div>
    );
  }

  if (!drawMethod) {
    return (
      <InitialChoice
        spreadType={spreadType}
        setSpreadType={setSpreadType}
        onStartReading={handleStartReading}
        isAuthReady={isAuthReady}
        isAuthenticated={isAuthenticated}
        onSelectReading={handleSelectHistoryReading}
        onGenerateInterpretation={handleSelectHistoryAndRerun}
        userId={userId}
        readingStyle={readingStyle}
        setReadingStyle={setReadingStyle}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        setQuerentQuestion={setQuerentQuestion}
        db={db}
        appId={appId}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 bg-white rounded-xl shadow-2xl">
      <h1 className="text-4xl font-serif font-bold text-center text-indigo-800 mb-6 border-b pb-2">
        Experimental RWS Tarot Reader
      </h1>

      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setDrawMethod(null)}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition duration-150 font-semibold"
        >
          ← Change Spread
        </button>
        {drawMethod === 'auto' && (
          <button
            onClick={() => handleStartReading('auto')}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-150 font-bold disabled:opacity-50"
          >
            {isLoading ? "Drawing..." : `Draw New ${SPREAD_POSITIONS[spreadType].positions.length} Cards`}
          </button>
        )}
        {drawMethod === 'manual' && (
          <button
            onClick={handleManualConfirm}
            disabled={!cardsReady || isLoading}
            className="px-4 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition duration-150 font-bold disabled:opacity-50"
          >
            {isLoading ? "Consulting..." : "Confirm Cards & Get Reading"}
          </button>
        )}
      </div>

      {querentQuestion.trim() && drawMethod !== null && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
          <label className="block text-md font-semibold text-gray-700 mb-2">
            Querent&apos;s Question:
          </label>
          <p className="text-gray-700 italic">{querentQuestion}</p>
        </div>
      )}

      {drawMethod === 'manual' && (
        <ManualCardSelector
          spreadType={spreadType}
          selectedCards={drawnCards}
          onCardSelect={handleManualSelect}
        />
      )}

      {drawnCards.length > 0 && renderCardSpread()}

      <div className="mt-8 p-6 bg-indigo-50 rounded-xl shadow-inner">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif font-bold text-indigo-800">
            Interpretation ({drawnCards.length} Cards)
          </h2>
          <div className="flex items-center space-x-2">
            {globalAudioPlayer && (
              <button
                onClick={stopAudio}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded-full hover:bg-red-600 transition duration-150"
              >
                🛑 Stop Audio
              </button>
            )}
            <button
              onClick={() => getGeminiAudio(readingText)}
              disabled={isLoading || audioLoading || !readingText}
              className="px-3 py-1 bg-purple-500 text-white text-sm rounded-full hover:bg-purple-600 transition duration-150 disabled:opacity-50"
            >
              {audioLoading ? "Generating Audio..." : "🔊 Speak"}
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-center space-x-4 gap-2 border-b pb-4">
          <label className="text-gray-700 font-semibold text-sm">Select Style:</label>
          {['traditional', 'esoteric', 'jungian'].map(style => (
            <label key={style} className="flex items-center space-x-1 cursor-pointer">
              <input
                type="radio"
                name="readingStyle"
                value={style}
                checked={readingStyle === style}
                onChange={() => setReadingStyle(style)}
                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="text-gray-700 text-sm capitalize">{style}</span>
            </label>
          ))}
          {drawnCards.length > 0 && !readingText.includes("Interpretation failed") && !isLoading && (
            <button
              onClick={() => getGeminiReading(drawnCards)}
              className="text-blue-500 hover:text-blue-700 text-sm font-semibold ml-auto"
            >
              Re-Interpret
            </button>
          )}
        </div>

        {playbackError && (
          <p className="text-red-500 text-sm mb-2">{playbackError}</p>
        )}

        {drawnCards.length > 0 && readingText.includes("This reading was saved") && (
          <div className="flex justify-center mt-2 mb-4">
            <button
              onClick={() => getGeminiReading(drawnCards)}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-150 disabled:opacity-50 font-semibold"
            >
              {isLoading ? "Generating..." : "Generate Interpretation"}
            </button>
          </div>
        )}

        {isLoading ? (
          <p className="text-gray-600 italic">Consulting the cosmos, please wait...</p>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">
            {readingText || "Click 'Draw New Cards' to begin or select your cards manually."}
          </p>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
        <label htmlFor="user-reflection" className="block text-md font-semibold text-gray-700 mb-2">
          Personal Reflection (Optional):
        </label>
        <textarea
          id="user-reflection"
          placeholder="What are your thoughts on this reading? What action will you take?"
          value={userReflection}
          onChange={(e) => setUserReflection(e.target.value)}
          className="w-full p-2 h-20 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
          rows="4"
        />
        <div className="flex justify-end mt-3">
          {saveMessage && (
            <p className={`mr-4 text-sm font-semibold ${saveMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
              {saveMessage}
            </p>
          )}
          <button
            onClick={() => saveReadingToHistory(drawnCards, SPREAD_POSITIONS[spreadType].label)}
            disabled={drawnCards.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150 disabled:opacity-50 font-semibold text-sm"
          >
            Save Reading to History
          </button>
        </div>
      </div>

      {showDeepDive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDeepDive(false)}>
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-serif font-bold mb-3 text-indigo-800">
              Scholarly Deep Dive: {selectedCardTitle}
            </h3>
            <div className="max-h-96 overflow-y-auto p-3 bg-gray-50 rounded">
              <p className="whitespace-pre-wrap text-gray-700">{deepDiveText}</p>
            </div>
            <button
              onClick={() => setShowDeepDive(false)}
              className="mt-4 w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-150"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <HistoryView
        userId={userId}
        isAuthenticated={isAuthenticated}
        onSelectReading={handleSelectHistoryReading}
        onGenerateInterpretation={handleSelectHistoryAndRerun}
        db={db}
        appId={appId}
      />
    </div>
  );
}