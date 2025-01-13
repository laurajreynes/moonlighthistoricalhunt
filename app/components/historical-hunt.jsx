'use client'
import React, { useState, useEffect } from 'react';
import { Map, Navigation2, Compass, CheckCircle, Circle, Thermometer, Moon, Info } from 'lucide-react';

const playSound = (type) => {
  const sounds = {
    found: new Audio('/sounds/success.mp3'),
    closer: new Audio('/sounds/warmer.mp3'),
    farther: new Audio('/sounds/colder.mp3'),
    hint: new Audio('/sounds/hint.mp3'),
    complete: new Audio('/sounds/complete.mp3')
  };
  
  if (sounds[type]) {
    sounds[type].play().catch(e => console.log('Sound prevented'));
  }
};

const saveProgress = (state) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('huntProgress', JSON.stringify({
      currentLocation: state.currentLocation,
      foundLocations: state.foundLocations
    }));
  }
};

const loadProgress = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('huntProgress');
    return saved ? JSON.parse(saved) : null;
  }
  return null;
};

const formatDistance = (feet) => {
  if (feet >= 5280) {
    const miles = (feet / 5280).toFixed(1);
    return `${miles} miles`;
  } else {
    return `${feet} ft`;
  }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return Math.round(d * 3280.84); // Convert to feet
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

const getTemperature = (distance) => {
  if (distance <= 70) return { color: 'text-emerald-500', message: "You're here!", icon: '🎯' };
  if (distance <= 250) return { color: 'text-orange-500', message: "Very hot!", icon: '🔥' };
  if (distance <= 450) return { color: 'text-orange-400', message: "Getting warmer!", icon: '☀️' };
  if (distance <= 500) return { color: 'text-yellow-500', message: "Lukewarm", icon: '😊' };
  if (distance <= 600) return { color: 'text-blue-400', message: "Cold", icon: '❄️' };
  return { color: 'text-blue-500', message: "Very cold", icon: '🥶' };
};

const locations = [
  {
    hint: "Start where the railroad changed it all. By the old depot, standing tall. Chugging trains gave birth to a place so fine, A mountain gem formed by the railroad line. Near the caboose, a marker stands to see, —One mile in each direction shaped our history.",
    location: { lat: 35.61567, lng: -82.32018 },
    fact: "In 1912, a devastating fire destroyed much of downtown Black Mountain, including the original train depot. When Southern Railway brought Asheville's firefighters by rail to help, it sparked a legacy of community resilience that shaped the town we see today.",
    historicalHint: "This spot marked the mile point where trains would slow down entering town - a crucial railway junction that helped establish Black Mountain as a thriving mountain community."
  },
  {
    hint: "Step into yesteryear where mercantile thrived, a place where old-timey goods keep history alive. A wooden screen door squeaks out a welcome so clear, inside, some tools or a hidden souvenir calls out for you, dear.",
    location: { lat: 35.61784303323257, lng: -82.32062720507768 },
    fact: "Opened in the 1920s, Town Hardware & General Store has been a mainstay of downtown Black Mountain for nearly a century. Locals and visitors alike love its creaky wooden floors, old-fashioned screen door, and shelves packed with everything from quirky toys and candy to genuine hardware supplies.",
    historicalHint: "This store has been the town's go-to shopping spot since the Roaring Twenties, when general stores were the heart of small-town commerce."
  },
  {
    hint: "From glamour shots to double shots, this building's changed its tune. First came Gragg with camera in hand, then hairstyles rose in bloom. Its river rock walls stand steadfast still, now beans are brewing galore— uncover a relic of old days before!",
    location: { lat: 35.61641014886177, lng: -82.3211580707765 },
    fact: "Originally built by Gragg, a photographer, this building briefly functioned as a funeral home with a drive-by viewing window in what is now the alley. Later it became a beauty salon, and eventually the Dripolator!",
    historicalHint: "In the early days of photography, local photographers like Gragg were essential chroniclers of town life and special occasions."
  },
  {
    hint: "Next, visit a lake that's surrounded by trees, a beautiful spot where you can feel the breeze. Seek a lake named for a native warrior's tool, Where Seven Sisters' peaks make views so cool.",
    location: { lat: 35.61973412179167, lng: -82.3277531065954 },
    fact: "Lake Tomahawk is entirely man-made, created in the mid-1900s as a community-driven project. The lake's name references its rough 'tomahawk' shape, and it sits just below the Seven Sisters mountain range.",
    historicalHint: "This lake was built by the community in the mid-1900s, transforming what was once marshy lowland into a beloved gathering place."
  },
  {
    hint: "Up the road stands a grand stone gate, guiding visitors into a world first shaped by faith. Pass under the arches—history abounds, a peaceful retreat where nature surrounds.",
    location: { lat: 35.63845659679587, lng: -82.31204666200995 },
    fact: "The iconic stone arches at Montreat welcome over 30,000 annual visitors to this historic retreat. In the early 1900s, visitors paid a small toll at this gate—hence its original nickname, the 'Toll Gate.' Today, Montreat hosts dozens of religious conferences, youth gatherings, and educational programs throughout the year.",
    historicalHint: "The stone gate marked the boundary between the public world and this private mountain retreat, where early visitors paid a toll to enter."
  },
  {
    hint: "Pass through the gate, where the mountains rise, soft ripples shimmer beneath sunny skies where a quiet lake honors one woman's name reflecting calm in the mountain air's domain",
    location: { lat: 35.6471560859223, lng: -82.29908662083768 },
    fact: "Lake Susan sits at the center of Montreat's peaceful retreat grounds, and local tradition holds that it was named for Susan, a family member of one of Montreat's early developers.",
    historicalHint: "This serene spot has been the heart of Montreat since its early days, when it was created as part of the original retreat center design."
  },
  {
    hint: "Pass back through the gate with open eyes, To the arts center under mountain skies. Seek the mural with paints and clay, A vibrant story on display.",
    location: { lat: 35.61619222494764, lng: -82.32149409841998 },
    fact: "The 'Community' mural, painted in 2019 by Scott Allred and Jeremy Russell, beautifully captures Black Mountain's vibrant history. Depicting scenes of painting, pottery, and daily life, this artwork honors the town's rich cultural heritage.",
    historicalHint: "The Arts Center building itself was once the town hall, a hub of civic life before becoming a creative center."
  },
  {
    hint: "To complete your hunt with a tasty dine, Visit a spot with history's sign. Flat Creek's flood once swept the land, But this 1907 home still stands.",
    location: { lat: 35.6146687732417, lng: -82.32029863850495 },
    fact: "On July 16, 1916, Flat Creek flooded much of Black Mountain after more than 22 inches of rain fell in just 24 hours. Mayor George Washington Stepp's two-story Queen Anne-style home, built in 1907, remarkably escaped destruction.",
    historicalHint: "This Queen Anne-style home belonged to Mayor Stepp, who led the town through the devastating flood of 1916."
  }
];
const HistoricalHunt = () => {
    const [distance, setDistance] = useState(328); // Starting at roughly 100m in feet
    const [currentLocation, setCurrentLocation] = useState(0);
    const [foundLocations, setFoundLocations] = useState([]);
    const [lastDistance, setLastDistance] = useState(328);
    const [showHint, setShowHint] = useState(false);
    const [userPosition, setUserPosition] = useState(null);
    const [gpsError, setGpsError] = useState(null);
  
    // Load saved progress on initial mount
    useEffect(() => {
      const saved = loadProgress();
      if (saved) {
        setCurrentLocation(saved.currentLocation);
        setFoundLocations(saved.foundLocations);
      }
    }, []);
  
    // Save progress whenever state changes
    useEffect(() => {
      saveProgress({
        currentLocation,
        foundLocations
      });
    }, [currentLocation, foundLocations]);
  
    // GPS tracking
    useEffect(() => {
      if (!navigator.geolocation) {
        setGpsError('Geolocation is not supported by your browser');
        return;
      }
  
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserPosition(newPosition);
          
          // Calculate new distance
          const target = locations[currentLocation].location;
          const newDistance = calculateDistance(
            newPosition.lat, newPosition.lng,
            target.lat, target.lng
          );
          
          // Only update sounds and distance if there's been significant movement (5 feet)
          if (Math.abs(newDistance - distance) > 5) {
            setLastDistance(distance);
            setDistance(newDistance);
  
            // Play appropriate sound based on movement
            if (newDistance <= 66 && !foundLocations.includes(currentLocation)) {
              playSound('found');
            } else if (newDistance < distance) {
              playSound('closer');
            } else if (newDistance > distance) {
              playSound('farther');
            }
          }
        },
        (error) => {
          setGpsError('Please enable location access to play the game');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
  
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }, [currentLocation, distance]);
  
    const toggleHint = () => {
      if (!showHint) {
        playSound('hint');
      }
      setShowHint(!showHint);
    };
  
    const moveToNextLocation = () => {
      if (currentLocation < locations.length - 1) {
        setFoundLocations([...foundLocations, currentLocation]);
        setCurrentLocation(currentLocation + 1);
        setDistance(328); // Reset to roughly 100m in feet
        setLastDistance(328);
        setShowHint(false);
      } else {
        setFoundLocations([...foundLocations, currentLocation]);
      }
    };
  
    const getDirectionFeedback = () => {
      if (distance === lastDistance) return null;
      return distance < lastDistance ? 
        <span className="text-emerald-600 font-medium animate-bounce">Getting warmer! 🔥</span> : 
        <span className="text-blue-600 font-medium animate-bounce">Getting colder! ❄️</span>;
    };
  
    const currentClue = locations[currentLocation];
    const isLocationFound = distance <= 150; // 150 feet (about 45 meters)
    const temperature = getTemperature(distance);
  
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white p-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="relative w-full h-32">
            <svg className="w-full h-full" viewBox="0 0 800 120" fill="none">
              <path d="M0 90 L100 40 L200 70 L300 10 L400 60 L500 40 L600 50 L700 35 L800 70 L800 120 L0 120 Z" 
                    fill="#333333" opacity="0.07"/>
              <path d="M-50 100 L50 50 L150 80 L250 20 L350 70 L450 45 L550 60 L650 35 L750 80 L850 60 L850 120 L-50 120 Z" 
                    fill="#333333" opacity="0.05"/>
              <circle cx="680" cy="5" r="15" className="fill-current text-gray-400" opacity="0.4"/>
            </svg>
          </div>
  
          <div className="px-4 pb-4">
            <h1 className="text-3xl font-bold text-center mb-2">Moonlight's Black Mountain Historical Hunt</h1>
            
            {gpsError ? (
              <div className="bg-red-50 p-4 rounded-xl text-red-700 mb-4 text-center">
                <p className="font-medium mb-2">⚠️ {gpsError}</p>
                <p className="text-sm">This game uses GPS to guide you to historical locations.</p>
              </div>
            ) : (
              <p className="text-gray-600 text-center mb-0">
                Welcome! Embark on a journey through Black Mountain's rich history,
                discovering hidden stories and local treasures.
              </p>
            )}
  
            <div className="flex gap-3 justify-center pt-2 pb-8">
              {locations.map((_, index) => (
                <div key={index} className="relative transition-all duration-300 hover:scale-110">
                  {foundLocations.includes(index) ? (
                    <CheckCircle className="w-6 h-6 text-emerald-500 drop-shadow-md" />
                  ) : index === currentLocation && isLocationFound ? (
                    <div className="animate-pulse">
                      <CheckCircle className="w-6 h-6 text-emerald-500 drop-shadow-md" />
                    </div>
                  ) : index === currentLocation ? (
                    <div className="relative">
                      <Circle className="w-6 h-6 text-blue-500 drop-shadow-md" />
                      <div className="absolute inset-0 w-2 h-2 bg-blue-400 rounded-full animate-ping m-auto" />
                    </div>
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300 drop-shadow-sm" />
                  )}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
  
            <div className="bg-blue-50 p-6 rounded-xl shadow-inner relative">
              <p className="whitespace-pre-line text-gray-700 leading-relaxed text-lg">
                {currentClue.hint}
              </p>
              <button
                onClick={toggleHint}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Toggle hint"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
            
            {showHint && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-blue-700 text-sm animate-fadeIn">
                💡 {currentClue.historicalHint}
              </div>
            )}
  
            <div className="mt-6 bg-gray-50 p-4 rounded-xl shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation2 className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">{formatDistance(distance)} away</span>
                </div>
                <div className="flex items-center gap-2">
                  <Thermometer className={`h-5 w-5 ${temperature.color}`} />
                  <span className={`${temperature.color} font-medium`}>
                    {temperature.message} {temperature.icon}
                  </span>
                </div>
              </div>
              {getDirectionFeedback() && (
                <div className="text-center mt-3 animate-fadeIn">
                  {getDirectionFeedback()}
                </div>
              )}
            </div>
  
            {isLocationFound && (
              <div className="mt-6 bg-emerald-50 p-6 rounded-xl border border-emerald-100 shadow-inner">
                <h3 className="text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Location Found! 🎉
                </h3>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  {currentClue.fact}
                </p>
                {currentLocation < locations.length - 1 && (
                  <button
                    onClick={moveToNextLocation}
                    className="mt-4 w-full bg-emerald-600 text-white px-6 py-3 rounded-lg transform transition-all duration-200
                             hover:scale-105 hover:bg-emerald-700 hover:shadow-md active:scale-95"
                  >
                    Continue to Next Location
                  </button>
                )}
                {currentLocation === locations.length - 1 && isLocationFound && (
                  <div className="mt-4 text-center p-4 bg-emerald-100 rounded-lg">
                    <h4 className="text-emerald-800 font-semibold mb-2">
                      Congratulations! 🎉
                    </h4>
                    <p className="text-emerald-700">
                      You've completed Moonlight's Black Mountain Historical Hunt!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  export default HistoricalHunt;