import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  deleteDoc,
  writeBatch,
  getDocs,
  doc
} from 'firebase/firestore';

export default function HistoryView({ userId, isAuthenticated, onSelectReading, onGenerateInterpretation, db, appId }) {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const deleteReading = async (id, spreadName) => {
    if (!db || !userId) {
      console.warn("Delete failed. Auth or DB unavailable.");
      return;
    }
    if (!confirm(`Are you sure you want to delete the reading: ${spreadName}?`)) {
      return;
    }
    try {
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/readings`, id);
      await deleteDoc(docRef);
      console.log("Reading successfully deleted:", id);
    } catch (error) {
      console.error("Error deleting reading:", error);
    }
  };

  const clearAllHistory = async () => {
    if (!db || !userId) {
      console.warn("Clear failed. Auth or DB unavailable.");
      return;
    }
    if (!confirm("Are you sure you want to delete ALL of your saved reading history? This action cannot be undone.")) {
      return;
    }

    try {
      const readingsCollection = collection(db, `artifacts/${appId}/users/${userId}/readings`);
      const q = query(readingsCollection);
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Successfully deleted ${snapshot.size} history documents.`);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  useEffect(() => {
    if (db && userId && isAuthenticated) {
      setHistoryLoading(true);

      const readingsCollection = collection(db, `artifacts/${appId}/users/${userId}/readings`);
      const q = query(readingsCollection, orderBy('timestamp', 'desc'), limit(50));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedHistory = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          interpretation: doc.data().interpretation || "This reading was saved under the card-only format. Click 'Generate Interpretation' to get the narrative text.",
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        setHistory(loadedHistory);
        setHistoryLoading(false);
      }, (error) => {
        console.error("Firestore Error:", error);
        setHistoryLoading(false);
      });

      return () => unsubscribe();
    } else if (!isAuthenticated) {
      setHistoryLoading(false);
      setHistory([]);
    }
  }, [userId, isAuthenticated, db, appId]);

  if (!isAuthenticated) {
    return <div className="text-center text-red-500 p-4">History inactive. Firebase Auth is required.</div>;
  }

  const historyCount = history.length;
  const historyLabel = historyCount === 1 ? '1 Reading' : `${historyCount} Readings`;

  const toggleHistory = () => setIsExpanded(!isExpanded);

  return (
    <div className="mt-8 w-full">
      <div className="flex justify-between items-center mb-2 p-2 bg-gray-200 rounded-lg cursor-pointer hover:bg-gray-300 transition duration-150" onClick={toggleHistory}>
        <h2 className="text-lg font-semibold text-gray-800">
          {isExpanded ? '▼ Hide History' : `▶ Show History (${historyLabel})`}
        </h2>
        {history.length > 0 && isExpanded && (
          <button onClick={(e) => { e.stopPropagation(); clearAllHistory(); }} className="text-red-600 hover:text-red-800 text-sm font-semibold p-1">
            Clear All
          </button>
        )}
      </div>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
        {historyLoading && <div className="text-center text-gray-500 p-4">Fetching previous readings...</div>}

        {history.length === 0 && !historyLoading && (
          <div className="text-center text-gray-500 p-4">No readings saved yet.</div>
        )}

        <div className="space-y-3 max-h-96 overflow-y-auto p-4 bg-white border border-gray-200 rounded-lg">
          {history.map((item) => (
            <div key={item.id} className="flex justify-between items-start p-3 bg-white rounded-lg shadow-md hover:bg-gray-50 transition duration-150">
              <div className="cursor-pointer flex-grow" onClick={() => onSelectReading(item)}>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-indigo-600">{item.spreadName}</span>
                  <span className="text-gray-500">{item.timestamp.toLocaleTimeString()} {item.timestamp.toLocaleDateString()}</span>
                </div>
                {item.question && <p className="text-sm font-medium mt-1 text-gray-900 truncate">Q: {item.question}</p>}
                {item.reflection && <p className="text-sm font-medium text-gray-600 truncate">R: {item.reflection}</p>}
                <p className="text-gray-700 text-sm italic mt-1 truncate">
                  {item.cards.map(c => `${c.title} ${c.orientation.substring(0, 3)}`).join(' | ')}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center space-x-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateInterpretation(item);
                  }}
                  className="text-blue-500 hover:text-blue-700 text-xs py-1 px-2 rounded-full bg-blue-50 font-semibold"
                  title="Generate new interpretation for this spread"
                >
                  Interpret
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteReading(item.id, item.spreadName);
                  }}
                  className="text-red-400 hover:text-red-600 transition duration-150 p-1 rounded-full bg-red-50"
                  title="Delete this reading"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
