import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import logger from "../utils/logger";

interface TimerProps {
     duration: number;
     isActive: boolean;
     isPaused?: boolean;
     onComplete: () => void;
     prepTime: number;
     preStartTime: number;
     onProgress?: (progress: number) => void;
}

export default function Timer({
     duration,
     isActive,
     isPaused = false,
     onComplete,
     prepTime,
     preStartTime,
     onProgress,
}: TimerProps) {
     const [timeLeft, setTimeLeft] = useState(duration);
     const [prepTimeLeft, setPrepTimeLeft] = useState(preStartTime);
     const [isPreparing, setIsPreparing] = useState(true);
     const [shouldComplete, setShouldComplete] = useState(false);
     const [restEndSound, setRestEndSound] = useState<Audio.Sound | null>(null);
     const [setEndSound, setSetEndSound] = useState<Audio.Sound | null>(null);

     useEffect(() => {
          const loadSounds = async () => {
               try {
                    const { sound: restSound } = await Audio.Sound.createAsync(require("../assets/rest_end.mp3"), {
                         shouldPlay: false,
                    });
                    setRestEndSound(restSound);
                    const { sound: setSound } = await Audio.Sound.createAsync(require("../assets/set_end.mp3"), {
                         shouldPlay: false,
                    });
                    setSetEndSound(setSound);
                    logger.log("Timer sounds loaded successfully");
               } catch (error) {
                    logger.error("Failed to load timer sounds:", error);
               }
          };
          loadSounds();

          return () => {
               if (restEndSound) restEndSound.unloadAsync();
               if (setEndSound) setEndSound.unloadAsync();
          };
     }, []);

     useEffect(() => {
          if (!isActive) {
               setTimeLeft(duration);
               setPrepTimeLeft(preStartTime);
               setIsPreparing(true);
               setShouldComplete(false);
               if (onProgress) onProgress(0); // Reset progress when inactive
               return;
          }

          let interval: NodeJS.Timeout | null = null;

          if (!isPaused) {
               if (isPreparing && prepTimeLeft > 0) {
                    interval = setInterval(() => {
                         setPrepTimeLeft((prev) => {
                              if (prev <= 1) {
                                   setIsPreparing(false);
                                   if (restEndSound) {
                                        restEndSound.replayAsync().then(() => logger.log("Rest end sound played"));
                                   }
                                   if (onProgress) onProgress(1); // End of prep phase
                                   return preStartTime;
                              }
                              const newPrepTimeLeft = prev - 1;
                              if (onProgress && preStartTime > 0) {
                                   const progress = (preStartTime - newPrepTimeLeft) / preStartTime;
                                   onProgress(progress);
                              }
                              return newPrepTimeLeft;
                         });
                    }, 1000);
               } else if (!isPreparing && timeLeft > 0) {
                    interval = setInterval(() => {
                         setTimeLeft((prev) => {
                              if (prev <= 1) {
                                   setShouldComplete(true);
                                   if (onProgress) onProgress(1); // End of workout phase
                                   return duration;
                              }
                              const newTimeLeft = prev - 1;
                              if (onProgress && duration > 0) {
                                   const progress = (duration - newTimeLeft) / duration;
                                   onProgress(progress);
                              }
                              return newTimeLeft;
                         });
                    }, 1000);
               }
          }

          return () => {
               if (interval) clearInterval(interval);
          };
     }, [isActive, isPaused, isPreparing, timeLeft, prepTimeLeft, duration, preStartTime, restEndSound, onProgress]);

     useEffect(() => {
          if (shouldComplete) {
               onComplete();
               setShouldComplete(false);
               setIsPreparing(true);
               setPrepTimeLeft(prepTime);
               if (setEndSound) {
                    setEndSound.replayAsync().then(() => logger.log("Set end sound played"));
               }
               if (onProgress) onProgress(0); // Reset progress for new cycle
          }
     }, [shouldComplete, onComplete, prepTime, setEndSound, onProgress]);

     const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
     };

     return (
          <View style={styles.container}>
               <Text style={styles.label}>{isPreparing ? "준비" : "운동"}</Text>
               <Text style={styles.time}>{isPreparing ? formatTime(prepTimeLeft) : formatTime(timeLeft)}</Text>
          </View>
     );
}

const styles = StyleSheet.create({
     container: {
          alignItems: "center",
     },
     label: {
          fontSize: 18,
          color: "#BBBBBB",
          marginBottom: 8,
     },
     time: {
          fontSize: 48,
          fontWeight: "bold",
          color: "#FFFFFF",
     },
});
