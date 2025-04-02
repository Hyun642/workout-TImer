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
     cycleRestTime: number;
     isCycleResting: boolean;
     onCycleRestComplete: () => void;
     workoutName: string;
}

export default function Timer({
     duration,
     isActive,
     isPaused = false,
     onComplete,
     prepTime,
     preStartTime,
     cycleRestTime,
     isCycleResting,
     onCycleRestComplete,
     workoutName,
}: TimerProps) {
     const [timeLeft, setTimeLeft] = useState(duration);
     const [preStartTimeLeft, setPreStartTimeLeft] = useState(preStartTime);
     const [prepTimeLeft, setPrepTimeLeft] = useState(prepTime);
     const [cycleRestTimeLeft, setCycleRestTimeLeft] = useState(cycleRestTime);
     const [isPreStarting, setIsPreStarting] = useState(true);
     const [isResting, setIsResting] = useState(false);
     const [shouldComplete, setShouldComplete] = useState(false);
     const [restEndSound, setRestEndSound] = useState<Audio.Sound | null>(null);
     const [setEndSound, setSetEndSound] = useState<Audio.Sound | null>(null);

     // 사운드 로드
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

     // 타이머 초기화
     useEffect(() => {
          if (!isActive) {
               setTimeLeft(duration);
               setPreStartTimeLeft(preStartTime);
               setPrepTimeLeft(prepTime);
               setCycleRestTimeLeft(cycleRestTime);
               setIsPreStarting(true);
               setIsResting(false);
               setShouldComplete(false);
          }
     }, [isActive, duration, preStartTime, prepTime, cycleRestTime]);

     // isResting이 true일 때 prepTimeLeft 초기화
     useEffect(() => {
          if (isResting) {
               setPrepTimeLeft(prepTime);
               logger.log(`Rest started with prepTimeLeft initialized to ${prepTime}`);
          }
     }, [isResting, prepTime]);

     // Pre-start 타이머
     useEffect(() => {
          let interval: NodeJS.Timeout | null = null;
          if (isActive && !isPaused && isPreStarting && preStartTimeLeft > 0) {
               interval = setInterval(() => {
                    setPreStartTimeLeft((prev) => {
                         if (prev <= 1) {
                              setIsPreStarting(false);
                              if (restEndSound) {
                                   restEndSound.replayAsync().then(() => logger.log("Pre-start rest end sound played"));
                              }
                              return 0;
                         }
                         return prev - 1;
                    });
               }, 1000);
          }
          return () => {
               if (interval) clearInterval(interval);
          };
     }, [isActive, isPaused, isPreStarting, preStartTimeLeft, restEndSound]);

     // Cycle rest 타이머
     useEffect(() => {
          let interval: NodeJS.Timeout | null = null;
          if (isActive && !isPaused && isCycleResting && cycleRestTimeLeft > 0) {
               interval = setInterval(() => {
                    setCycleRestTimeLeft((prev) => {
                         const next = prev - 1;
                         if (next <= 0) {
                              if (restEndSound) {
                                   restEndSound.replayAsync().then(() => logger.log("Cycle rest end sound played"));
                              }
                              onCycleRestComplete();
                              return 0;
                         }
                         return next;
                    });
               }, 1000);
          }
          return () => {
               if (interval) clearInterval(interval);
          };
     }, [isActive, isPaused, isCycleResting, cycleRestTimeLeft, onCycleRestComplete, restEndSound]);

     // Rest 타이머
     useEffect(() => {
          let interval: NodeJS.Timeout | null = null;
          if (isActive && !isPaused && isResting && prepTimeLeft > 0) {
               interval = setInterval(() => {
                    setPrepTimeLeft((prev) => {
                         const next = prev - 1;
                         if (next <= 0) {
                              setIsResting(false);
                              if (restEndSound) {
                                   restEndSound.replayAsync().then(() => logger.log("Rest end sound played"));
                              }
                              return 0;
                         }
                         return next;
                    });
               }, 1000);
          }
          return () => {
               if (interval) clearInterval(interval);
          };
     }, [isActive, isPaused, isResting, prepTimeLeft, restEndSound]);

     // Main 타이머
     useEffect(() => {
          let interval: NodeJS.Timeout | null = null;
          if (isActive && !isPaused && !isPreStarting && !isCycleResting && !isResting && timeLeft > 0) {
               interval = setInterval(() => {
                    setTimeLeft((prev) => {
                         const next = prev - 1;
                         if (next <= 0) {
                              setShouldComplete(true);
                              return 0;
                         }
                         return next;
                    });
               }, 1000);
          }
          return () => {
               if (interval) clearInterval(interval);
          };
     }, [isActive, isPaused, isPreStarting, isCycleResting, isResting, timeLeft]);

     // onComplete 처리
     useEffect(() => {
          if (shouldComplete) {
               onComplete();
               setShouldComplete(false);
               setTimeLeft(duration);
               if (prepTime > 0) {
                    setIsResting(true);
                    logger.log("Exercise completed, entering rest period");
               }
               if (setEndSound) {
                    setEndSound.replayAsync().then(() => logger.log("Set end sound played"));
               }
          }
     }, [shouldComplete, onComplete, prepTime, duration, setEndSound]);

     const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
     };

     const getLabelStyle = () => {
          if (isPreStarting) return styles.labelPreStart;
          if (isResting) return styles.labelRest;
          if (isCycleResting) return styles.labelCycleRest;
          return styles.label;
     };

     const getTimeStyle = () => {
          if (isPreStarting) return styles.timePreStart;
          if (isResting) return styles.timeRest;
          if (isCycleResting) return styles.timeCycleRest;
          return styles.time;
     };

     return (
          <View style={styles.container}>
               <Text style={getLabelStyle()}>
                    {isPreStarting ? "시작 준비" : isResting ? "휴식" : isCycleResting ? "세트 간 휴식" : "운동"}
               </Text>
               <Text style={getTimeStyle()}>
                    {isPreStarting
                         ? formatTime(preStartTimeLeft)
                         : isResting
                         ? formatTime(prepTimeLeft)
                         : isCycleResting
                         ? formatTime(cycleRestTimeLeft)
                         : formatTime(timeLeft)}
               </Text>
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
     labelPreStart: {
          fontSize: 18,
          color: "#FFD700",
          marginBottom: 8,
     },
     labelRest: {
          fontSize: 18,
          color: "#00FF00",
          marginBottom: 8,
     },
     labelCycleRest: {
          fontSize: 18,
          color: "#FF69B4",
          marginBottom: 8,
     },
     time: {
          fontSize: 48,
          fontWeight: "bold",
          color: "#FFFFFF",
     },
     timePreStart: {
          fontSize: 48,
          fontWeight: "bold",
          color: "#FFD700",
     },
     timeRest: {
          fontSize: 48,
          fontWeight: "bold",
          color: "#00FF00",
     },
     timeCycleRest: {
          fontSize: 48,
          fontWeight: "bold",
          color: "#FF69B4",
     },
});
