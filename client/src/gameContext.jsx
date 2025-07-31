import { createContext, useContext, useEffect, useState } from "react";

const GameCtx = createContext(null);
export const useGame = () => useContext(GameCtx);

export default function GameProvider({ children, socket }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleStateUpdate = (newState) => {
      console.log('Game state update received:', newState);
      setState(newState);
    };

    const handleGiftFx = ({ user, coins }) => {
      console.log(`${user} sent ${coins}c`);
    };

    socket.on("state:update", handleStateUpdate);
    socket.on("fx:gift", handleGiftFx);

    return () => {
      socket.off("state:update", handleStateUpdate);
      socket.off("fx:gift", handleGiftFx);
    };
  }, [socket]);

  return <GameCtx.Provider value={{ state, socket }}>{children}</GameCtx.Provider>;
} 