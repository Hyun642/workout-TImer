// src/contexts/SettingsContext.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import logger from "../utils/logger";

const SOUND_EFFECTS_VOLUME_KEY = "soundEffectsVolume";

interface SettingsContextType {
     soundEffectsVolume: number;
     setSoundEffectsVolume: (volume: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
     const [soundEffectsVolume, setSoundEffectsVolumeState] = useState(1.0); // 기본값 100%

     useEffect(() => {
          // 앱 시작 시 AsyncStorage에서 볼륨 값 불러오기
          const loadVolume = async () => {
               try {
                    const storedVolume = await AsyncStorage.getItem(SOUND_EFFECTS_VOLUME_KEY);
                    if (storedVolume !== null) {
                         setSoundEffectsVolumeState(JSON.parse(storedVolume));
                    }
               } catch (error) {
                    logger.error("Failed to load sound effects volume.", error);
               }
          };
          loadVolume();
     }, []);

     const setSoundEffectsVolume = async (volume: number) => {
          setSoundEffectsVolumeState(volume);
          try {
               // 볼륨 변경 시 AsyncStorage에 저장
               await AsyncStorage.setItem(SOUND_EFFECTS_VOLUME_KEY, JSON.stringify(volume));
          } catch (error) {
               logger.error("Failed to save sound effects volume.", error);
          }
     };

     return (
          <SettingsContext.Provider value={{ soundEffectsVolume, setSoundEffectsVolume }}>
               {children}
          </SettingsContext.Provider>
     );
};

export const useSettings = () => {
     const context = useContext(SettingsContext);
     if (context === undefined) {
          throw new Error("useSettings must be used within a SettingsProvider");
     }
     return context;
};
