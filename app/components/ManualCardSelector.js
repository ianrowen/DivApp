import { RWS_CARD_DATA, SPREAD_POSITIONS } from '../data/cardData';

export default function ManualCardSelector({ spreadType, selectedCards, onCardSelect }) {
  const cardPositions = SPREAD_POSITIONS[spreadType].positions || [];

  const getAvailableCards = (index) => {
    const selectedTitles = selectedCards.filter(c => c.title).map(c => c.title);
    const currentSelectionTitle = selectedCards[index]?.title;

    return RWS_CARD_DATA.filter(card =>
      !selectedTitles.includes(card.title) || card.title === currentSelectionTitle
    );
  };

  return (
    <div className="mt-4 p-4 bg-yellow-100 rounded-lg border border-yellow-400">
      <h3 className="text-lg font-semibold text-center mb-4 text-yellow-800">
        Manual Selection for {SPREAD_POSITIONS[spreadType].label.toUpperCase()}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {cardPositions.map((position, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{position}</label>
            <select
              value={selectedCards[index]?.title || ''}
              onChange={(e) => onCardSelect(index, e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="" disabled>Select a card...</option>
              {getAvailableCards(index).map(card => (
                <option key={card.code} value={card.title}>
                  {card.title} ({card.arcana})
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
