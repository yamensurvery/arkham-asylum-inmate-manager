import React, {useState, useEffect} from "react";

function ArkhamAsylum(){
  const [idNumber, setIdNumber] = useState("");
  const [sprite, setSprite] = useState(null);
  const [error, setError] = useState("");
  const [inmates, setInmates] = useState([]);
  const [selectedInmate, setSelectedInmate] = useState(null);
  
  // Minigame state
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(150); // 2.5 minutes in seconds
  const [gameResult, setGameResult] = useState("");

  // Load Inmates on mount (no dependencies)
  useEffect(() => {
    const loadInmates = async () => {
      const inmateList = await buildInmateList();
      const inmatesWithStatus = inmateList.map(inmate => ({
        ...inmate,
        status: 'captured'
      }));
      setInmates(inmatesWithStatus);
    };
    loadInmates();
  }, []);

  //Timer runs when game is active or when timeleft changes
  useEffect(() => {
    let timer;
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameActive) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [gameActive, timeLeft]);

  // When game is active, after 3 seconds, function for escapees is called
  useEffect(() => {
    if (gameActive) {
      const initialEscapeTimer = setTimeout(() => {
        triggerRandomEscapes();
      }, 3000);
      
      const recurringEscapeTimer = setInterval(() => {
        triggerRandomEscapes();
      }, Math.random() * 5000 + 5000);
      
      return () => {
        clearTimeout(initialEscapeTimer);
        clearInterval(recurringEscapeTimer);
      };
    }
  }, [gameActive]);

  // Sets inmates statuses to "captured" and resets timer
  function startGame() {
    setInmates(prev => prev.map(inmate => ({
      ...inmate,
      status: 'captured'
    })));
    setGameActive(true);
    setTimeLeft(150);
    setGameResult("");
    setError("Game started! Inmates will escape throughout the alert...");
    
    setTimeout(() => {
      if (error === "Game started! Inmates will escape throughout the alert...") {
        setError("");
      }
    }, 5000);
  }

  // Pick 1-4 random inmates and "lets them go". Logs the escapees 
  function triggerRandomEscapes(){
    setInmates(prev => {
      const updatedInmates = [...prev];
      const availableInmates = updatedInmates.filter(inmate => inmate.status === 'captured');
      
      if (availableInmates.length === 0) return prev;
      
      const numberOfEscapes = Math.floor(Math.random() * 4) + 1; // 1 to 4
      const escapeCount = Math.min(numberOfEscapes, availableInmates.length);
      const shuffled = availableInmates.sort(() => 0.5 - Math.random());
      const escapees = shuffled.slice(0, escapeCount);
      
      escapees.forEach(escapee => {
        const index = updatedInmates.findIndex(inmate => inmate.id === escapee.id);
        updatedInmates[index].status = 'escaped';
      });
      
      console.log(`${escapees.length} inmates have escaped:`, escapees.map(e => e.name));
      return updatedInmates;
    });
  }

  // Stops game and counts escapees left
  function endGame() {
    setGameActive(false);
    const escapedCount = inmates.filter(inmate => inmate.status === 'escaped').length;
    if (escapedCount === 0) {
      setGameResult("🎉 You caught all the criminals! 🎉");
    } else {
      setGameResult("You didn't capture all the inmates!");
    }
  }

  // Must have 'bad' alignment and must be based in Gotham or Arkham
  // Some villains like Riddler have nothing as base so I included '-' (what it says if nothing in base)
  // Bane is based in Santa Prisca
  function filterArkhamInmatesFlexible(searchResults) {
    if (!searchResults || !searchResults.results) {
      return [];
    }
    
    return searchResults.results.filter(character => {
      const isBadAlignment = character.biography && character.biography.alignment === "bad";
      const hasRelevantBase = character.work && character.work.base && (
        character.work.base.toLowerCase().includes("arkham") ||
        character.work.base.toLowerCase().includes("gotham") ||
        character.work.base.toLowerCase().includes("-") ||
        character.work.base.toLowerCase().includes("santa prisca")
      );
      
      return isBadAlignment && hasRelevantBase;
    });
  }

  // Fetches character data from backend
  // Filters using previous "filterArkhamInmatesFlexible" function
  async function buildInmateList() {
    const villainNames = [
      "joker", "riddler", "two-face", "scarecrow", "poison ivy",
      "mr freeze", "penguin", "harley quinn", "clayface", "killer croc",
      "bane", "mister zsasz"
    ];
    
    const allInmates = [];
    
    for(const villainName of villainNames){
      try{
        const response = await fetch(`http://localhost:3001/api/search/${villainName}`);
        const data = await response.json();
        if (data.results) {
          const arkhamInmates = filterArkhamInmatesFlexible(data);
          arkhamInmates.forEach(inmate => {
            if (!allInmates.find(existing => existing.id === inmate.id)) {
              allInmates.push(inmate);
            }
          });
        }
      } catch(error){
        console.error(`Error searching for ${villainName}:`, error);
      }
    }
    
    return allInmates.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Runs when inmate is selected from dropdown
  // Sets sprite for inmate
  function handleInmateSelection(event) {
    const selectedInmateId = event.target.value;
    
    if (!selectedInmateId) {
      setSprite(null);
      setSelectedInmate(null);
      setError("");
      return;
    }
    
    const selectedInmate = inmates.find(inmate => inmate.id === selectedInmateId);
    
    if (selectedInmate) {
      setSelectedInmate(selectedInmate);
      setSprite(selectedInmate.image.url);
      setError("");
      setIdNumber(selectedInmate.name);
      
      if (gameActive && selectedInmate.status === 'escaped') {
        captureInmate(selectedInmateId);
      }
    } else {
      setError("Inmate not found");
      setSprite(null);
    }
  }

  // Changes inmate status to "captured"
  function captureInmate(inmateId) {
    setInmates(prev => prev.map(inmate => 
      inmate.id === inmateId ? { ...inmate, status: 'captured' } : inmate
    ));
  }

  const escapedCount = inmates.filter(inmate => inmate.status === 'escaped').length;

  // Formats time to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return(
    <div className="container">
      <h1>Arkham Asylum Inmates Manager</h1>
      
      <div className="game-controls">
        <div className="game-info">
          {!gameActive ? (
            <button onClick={startGame} className="start-button">
              Start Security Alert
            </button>
          ) : (
            <>
              <div className={`timer-display ${timeLeft <= 30 ? 'warning' : ''}`}>
                ⏰ Time Left: {formatTime(timeLeft)}
              </div>
              <div className={`escapee-counter ${escapedCount > 0 ? 'danger' : 'safe'}`}>
                🚨 Escapees: {escapedCount}
              </div>
            </>
          )}
        </div>
        
        {gameResult && (
          <div className={`game-result ${gameResult.includes('caught') ? 'win' : 'lose'}`}>
            {gameResult}
          </div>
        )}
      </div>

      <div>
        <select 
          id="dropdown" 
          value={selectedInmate?.id || ""} 
          onChange={handleInmateSelection}
        >
          <option value="">Select an inmate...</option>
          {inmates.map(inmate => (
            <option 
              key={inmate.id} 
              value={inmate.id} 
              className={inmate.status === 'escaped' ? 'escaped' : ''}
            >
              {inmate.name} {inmate.status === 'escaped' ? '🔓 ESCAPED' : '🔒'}
            </option>
          ))}
        </select>
        
        {gameActive && selectedInmate?.status === 'escaped' && (
          <div className="escape-warning">
            ⚠️ This inmate has ESCAPED! Selecting them will capture them.
          </div>
        )}
      </div>

      <div className="results">
        <div className="results-container">
          <div className="character-metadata">
            {sprite && (
              <img 
                src={`https://corsproxy.io/?${encodeURIComponent(sprite)}`}
                alt="Character" 
                id="image"
                onLoad={() => console.log('Image loaded successfully')}
                onError={(e) => console.log('Image failed to load:', e)}
              />
            )}
            
            {selectedInmate && (
              <div className="character-stats">
                <h2>{selectedInmate.name}</h2>
                
                <div className="shAPI-data">
                  <h3>Basic Information</h3>
                  <p><strong>Full Name: </strong> {selectedInmate.biography?.['full-name'] || 'Unknown'}</p>
                  <p><strong>Base:</strong> {selectedInmate.work?.base === "-" ? "Gotham City" : (selectedInmate.work?.base || "Unknown")}</p>
                </div>
                
                {selectedInmate.powerstats && (
                  <div className="shAPI-stats">
                    <h3>Power Statistics</h3>
                    <div className="stats-display">
                      <div style={{color: "hsl(51, 100%, 50%)"}}>Intelligence: {selectedInmate.powerstats.intelligence || 'N/A'}</div>
                      <div style={{color: "hsl(51, 100%, 50%)"}}>Strength: {selectedInmate.powerstats.strength || 'N/A'}</div>
                      <div style={{color: "hsl(51, 100%, 50%)"}}>Speed: {selectedInmate.powerstats.speed || 'N/A'}</div>
                      <div style={{color: "hsl(51, 100%, 50%)"}}>Durability: {selectedInmate.powerstats.durability || 'N/A'}</div>
                      <div style={{color: "hsl(51, 100%, 50%)"}}>Power: {selectedInmate.powerstats.power || 'N/A'}</div>
                      <div style={{color: "hsl(51, 100%, 50%)"}}>Combat: {selectedInmate.powerstats.combat || 'N/A'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArkhamAsylum;