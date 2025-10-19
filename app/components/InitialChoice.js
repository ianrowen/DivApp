import { SPREAD_POSITIONS } from '../data/cardData';
import HistoryView from './HistoryView';

export default function InitialChoice({
  spreadType,
  setSpreadType,
  onStartReading,
  isAuthReady,
  isAuthenticated,
  onSelectReading,
  onGenerateInterpretation,
  userId,
  readingStyle,
  setReadingStyle,
  audioEnabled,
  setAudioEnabled,
  setQuerentQuestion,
  db,
  appId
}) {
  return (
    <div className="w-full max-w-xl mx-auto p-8 bg-white rounded-xl shadow-2xl text-center">
      <h1 className="text-4xl font-serif font-bold text-indigo-800 mb-4">Welcome to the Tarot</h1>
      <p className="text-lg text-gray-600 mb-6">Choose your spread and drawing method to begin your reading.</p>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
        <label htmlFor="querent-question" className="block text-md font-semibold text-gray-700 mb-2">
          Your Focus / Question (Optional):
        </label>
        <textarea
          id="querent-question"
          placeholder="What is the central focus of this reading?"
          onChange={(e) => setQuerentQuestion(e.target.value)}
          className="w-full p-2 h-16 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
          rows="2"
        />
      </div>

      <div className="mb-6">
        <label className="block text-xl font-semibold text-gray-700 mb-2">1. Select Your Spread:</label>
        <div className="flex flex-wrap justify-center gap-3">
          {Object.keys(SPREAD_POSITIONS).map(key => (
            <button
              key={key}
              onClick={() => setSpreadType(key)}
              className={`px-4 py-2 rounded-full font-semibold transition duration-150 ${
                spreadType === key ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {SPREAD_POSITIONS[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <label className="block text-xl font-semibold text-gray-700 mb-4">2. Select Drawing Method:</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onStartReading('auto')}
            className="py-3 bg-green-500 text-white text-lg rounded-lg shadow-md hover:bg-green-600 transition duration-150 font-bold"
            disabled={!isAuthReady}
          >
            🔮 Automatic Draw
            <p className="text-sm font-normal opacity-90 mt-1">Let the cosmos choose your cards.</p>
          </button>
          <button
            onClick={() => onStartReading('manual')}
            className="py-3 bg-yellow-500 text-white text-lg rounded-lg shadow-md hover:bg-yellow-600 transition duration-150 font-bold"
            disabled={!isAuthReady}
          >
            🖐️ Manual Draw
            <p className="text-sm font-normal opacity-90 mt-1">Select your own cards from the deck.</p>
          </button>
        </div>
      </div>
      {!isAuthReady && <p className="mt-4 text-sm text-red-500">Initializing Firebase services...</p>}

      <div className="mt-8 border-t pt-6">
        <HistoryView
          userId={userId}
          isAuthenticated={isAuthenticated}
          onSelectReading={onSelectReading}
          onGenerateInterpretation={onGenerateInterpretation}
          db={db}
          appId={appId}
        />
      </div>
    </div>
  );
}
