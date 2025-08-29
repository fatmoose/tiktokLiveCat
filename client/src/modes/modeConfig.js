// Configuration for all available game modes
export const modeConfig = {
  'boss-battle': {
    id: 'boss-battle',
    title: 'Boss Battle',
    description: 'Defeat the boss with likes and gifts from your TikTok Live stream!',
    image: '/src/assets/boss.gif',
    available: true,
    component: () => import('./bossBattle/BossBattleMode.jsx')
  },
  'dance-party': {
    id: 'dance-party',
    title: 'Dance Party',
    description: 'Coming Soon - Make your character dance with viewer interactions!',
    image: '/src/assets/toothless.gif',
    available: false,
    component: null
  },
  'pet-simulator': {
    id: 'pet-simulator',
    title: 'Pet Simulator',
    description: 'Coming Soon - Take care of your virtual pet with viewer gifts!',
    image: '/src/assets/toothless.gif',
    available: false,
    component: null
  },
  'racing-game': {
    id: 'racing-game',
    title: '🏁 Emoji Race',
    description: 'Join the race with gifts or comments and compete for glory!',
    image: '/src/assets/toothless.gif',
    available: true,
    component: () => import('./raceGame/RaceGameMode.jsx')
  },
  'spin-the-wheel': {
    id: 'spin-the-wheel',
    title: '🎡 Spin the Wheel',
    description: 'Get entries with likes & gifts for a chance to win!',
    image: '/src/assets/wheel.svg',
    available: true,
    component: () => import('./spinTheWheel/SpinTheWheelMode.jsx')
  }
};

export const getModeById = (id) => modeConfig[id];

export const getAvailableModes = () => 
  Object.values(modeConfig).filter(mode => mode.available);

export const getAllModes = () => Object.values(modeConfig);
