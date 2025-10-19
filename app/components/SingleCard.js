import { RWS_CARD_DATA, getIcon } from '../data/cardData';

export default function SingleCard({ card, position, onDeepDive, assetPath, cardBackUrl }) {
  const keywords = card.keywords || RWS_CARD_DATA.find(c => c.title === card.title)?.keywords || [];
  const astro = card.astro || RWS_CARD_DATA.find(c => c.title === card.title)?.astro || "N/A";
  const element = card.element || RWS_CARD_DATA.find(c => c.title === card.title)?.element || "N/A";
  const suit = card.suit || RWS_CARD_DATA.find(c => c.title === card.title)?.suit || "Trump";
  const arcana = card.arcana || RWS_CARD_DATA.find(c => c.title === card.title)?.arcana || "Major";

  const isReversed = card.orientation === 'Reversed';
  const cardStyle = {
    transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.5s',
  };

  const cardFilePath = assetPath + card.filename;

  const astroIconKey = astro.split(' ')[0];
  const isCompoundAstro = astro.includes(' in ');

  let astroDisplayContent;

  if (astro === "N/A" || astro === "Beginnings") {
    astroDisplayContent = <span>{astro}</span>;
  } else if (arcana === 'Minor' || isCompoundAstro) {
    astroDisplayContent = <span>{getIcon(astroIconKey)} {astro}</span>;
  } else {
    astroDisplayContent = <span>{getIcon(astroIconKey)} {astro}</span>;
  }

  return (
    <div className="card-component w-full max-w-[160px] sm:max-w-xs mx-auto p-2 bg-white rounded-lg shadow-xl hover:shadow-2xl transition-transform duration-500 hover:scale-105">
      <h3 className="font-serif text-center text-lg font-bold mb-2 text-gray-800">{position}</h3>
      <div className="relative overflow-hidden rounded-md border-4 border-gray-200">
        <img
          src={cardFilePath}
          alt={card.title}
          style={cardStyle}
          className="w-full h-auto"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = cardBackUrl;
            console.error(`Image load failed for: ${cardFilePath}`);
          }}
        />
      </div>
      <div className="mt-2 text-center">
        <h4 className="text-xl font-bold font-serif text-indigo-700">{card.title}</h4>
        <div className={`text-sm font-semibold mt-1 p-1 rounded-full ${isReversed ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
          {card.orientation}
        </div>
        <div className="text-xs text-gray-600 mt-1 space-y-1">
          <p><strong>Type:</strong> {arcana} {arcana === 'Minor' ? `(${suit})` : ''}</p>
          <p><strong>Keywords:</strong> {keywords.join(', ')}</p>
          <hr className="my-1 border-gray-300" />
          <div className="flex justify-between text-xs text-gray-700">
            <span>{getIcon(element)} {element}</span>
            <span className="ml-2">{astroDisplayContent}</span>
          </div>
        </div>
        <button
          onClick={() => onDeepDive(card)}
          className="mt-3 w-full bg-blue-500 text-white text-xs py-1 rounded hover:bg-blue-600 transition duration-150"
        >
          ✨ Deep Dive
        </button>
      </div>
    </div>
  );
}
