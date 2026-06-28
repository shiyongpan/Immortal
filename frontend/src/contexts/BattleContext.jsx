import { createContext, useContext, useState } from "react";

export const BattleContext = createContext(null);

/**
 * battleStats: null（非戰鬥中）
 *           | { hp, maxHp, mp, maxMp }（動作戰進行中）
 */
export function BattleProvider({ children }) {
  const [battleStats, setBattleStats] = useState(null);
  return (
    <BattleContext.Provider value={{ battleStats, setBattleStats }}>
      {children}
    </BattleContext.Provider>
  );
}

export const useBattle = () => useContext(BattleContext);
