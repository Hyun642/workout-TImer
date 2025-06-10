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
     isLastRepetition?: boolean;
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
     isLastRepetition = false,
}: TimerProps) {
     const [timeLeft, setTimeLeft] = useState(duration);
     const [preStartTimeLeft, setPreStartTimeLeft] = useState(preStartTime);
     const [prepTimeLeft, setPrepTimeLeft] = useState(prepTime);
     const [cycleRestTimeLeft, setCycleRestTimeLeft] = useState(cycleRestTime);
     const [isPreStarting, setIsPreStarting] = useState(true);
     const [isResting, setIsResting] = useState(false);
     const [shouldComplete, setShouldComplete] = useState(false);
     const [shouldCycleRestComplete, setShouldCycleRestComplete] = useState(false);
     const [restEndSound, setRestEndSound] = useState<Audio.Sound | null>(null);
     const [setEndSound, setSetEndSound] = useState<Audio.Sound | null>(null);
     const [workoutEndSound, setWorkoutEndSound] = useState<Audio.Sound | null>(null);
     const [countSound, setCountSound] = useState<Audio.Sound | null>(null);
     const [endingSound, setEndingSound] = useState<Audio.Sound | null>(null);

     // 사운드 로드
     useEffect(() => {
          const loadSounds = async () => {
               try {
                    const { sound: restSound } = await Audio.Sound.createAsync(require("../assets/start.mp3"), {
                         shouldPlay: false,
                    });
                    setRestEndSound(restSound);
                    const { sound: setSound } = await Audio.Sound.createAsync(require("../assets/great.mp3"), {
                         shouldPlay: false,
                    });
                    setSetEndSound(setSound);
                    const { sound: workoutSound } = await Audio.Sound.createAsync(require("../assets/complete.mp3"), {
                         shouldPlay: false,
                    });
                    setWorkoutEndSound(workoutSound);
                    const { sound: countS } = await Audio.Sound.createAsync(require("../assets/count.mp3"), {
                         shouldPlay: false,
                    });
                    setCountSound(countS);
                    const { sound: endingS } = await Audio.Sound.createAsync(require("../assets/ending.mp3"), {
                         shouldPlay: false,
                    });
                    setEndingSound(endingS);

                    logger.log("Timer sounds loaded successfully");
               } catch (error) {
                    logger.error("Failed to load timer sounds:", error);
               }
          };
          loadSounds();

          return () => {
               if (restEndSound) restEndSound.unloadAsync();
               if (setEndSound) setEndSound.unloadAsync();
               if (workoutEndSound) workoutEndSound.unloadAsync();
               if (countSound) countSound.unloadAsync();
               if (endingSound) endingSound.unloadAsync();
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
               setShouldCycleRestComplete(false);
               logger.log("Timer reset: All states initialized");
          }
     }, [isActive, duration, preStartTime, prepTime, cycleRestTime]);

     // isResting, isCycleResting 상태 변경 시 초기화
     useEffect(() => {
          if (isResting) setPrepTimeLeft(prepTime);
     }, [isResting, prepTime]);

     useEffect(() => {
          if (isCycleResting) {
               setCycleRestTimeLeft(cycleRestTime);
               setShouldCycleRestComplete(false);
          }
     }, [isCycleResting, cycleRestTime]);

     // Pre-start 타이머: 3초 전에 count.mp3 재생
     useEffect(() => {
          let interval: NodeJS.Timeout | null = null;
          if (isActive && !isPaused && isPreStarting && preStartTimeLeft > 0) {
               interval = setInterval(() => {
                    setPreStartTimeLeft((prev) => {
                         if (prev === 4 && countSound) {
                              countSound.replayAsync().then(() => logger.log("Pre-start count sound played (T-3s)"));
                         }
                         const next = prev - 1;
                         if (next <= 0) {
                              setIsPreStarting(false);
                              logger.log("Pre-start timer completed");
                              return 0;
                         }
                         return next;
                    });
               }, 1000);
          }
          return () => {
               if (interval) clearInterval(interval);
          };
     }, [isActive, isPaused, isPreStarting, preStartTimeLeft, countSound]);

     // Cycle rest 타이머: 3초 전부터 3회 ending.mp3 재생
     useEffect(() => {
          let interval: NodeJS.Timeout | null = null;
          if (isActive && !isPaused && isCycleResting && cycleRestTimeLeft > 0) {
               interval = setInterval(() => {
                    setCycleRestTimeLeft((prev) => {
                         if ((prev === 4 || prev === 3 || prev === 2) && endingSound) {
                              endingSound
                                   .replayAsync()
                                   .then(() => logger.log(`Cycle rest ending sound at T-${prev - 1}`));
                         }
                         const next = prev - 1;
                         if (next <= 0) {
                              setShouldCycleRestComplete(true);
                              return 0;
                         }
                         return next;
                    });
               }, 1000);
          }
          return () => {
               if (interval) clearInterval(interval);
          };
     }, [isActive, isPaused, isCycleResting, cycleRestTimeLeft, endingSound]);

     // Cycle rest 완료 처리
     useEffect(() => {
          if (shouldCycleRestComplete) {
               if (restEndSound) {
                    restEndSound.replayAsync().then(() => logger.log("Cycle rest end sound (start.mp3) played"));
               }
               onCycleRestComplete();
               setShouldCycleRestComplete(false);
          }
     }, [shouldCycleRestComplete, onCycleRestComplete, restEndSound]);

     // Rest 타이머 (1회당 휴식): 3초 전부터 3회 ending.mp3 재생
     useEffect(() => {
          let interval: NodeJS.Timeout | null = null;
          if (isActive && !isPaused && isResting && prepTimeLeft > 0) {
               interval = setInterval(() => {
                    setPrepTimeLeft((prev) => {
                         if ((prev === 4 || prev === 3 || prev === 2) && endingSound) {
                              endingSound.replayAsync().then(() => logger.log(`Rest ending sound at T-${prev - 1}`));
                         }
                         const next = prev - 1;
                         if (next <= 0) {
                              setIsResting(false);
                              if (restEndSound) {
                                   restEndSound
                                        .replayAsync()
                                        .then(() => logger.log("Rest end sound (start.mp3) played"));
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
     }, [isActive, isPaused, isResting, prepTimeLeft, restEndSound, endingSound]);

     // Main 타이머: 3초 전부터 3회 ending.mp3 재생
     useEffect(() => {
          let interval: NodeJS.Timeout | null = null;
          if (isActive && !isPaused && !isPreStarting && !isCycleResting && !isResting && timeLeft > 0) {
               interval = setInterval(() => {
                    setTimeLeft((prev) => {
                         if ((prev === 4 || prev === 3 || prev === 2) && endingSound) {
                              endingSound
                                   .replayAsync()
                                   .then(() => logger.log(`Main timer ending sound at T-${prev - 1}`));
                         }
                         const next = prev - 1;
                         if (next <= 0) {
                              setShouldComplete(true);
                              return duration;
                         }
                         return next;
                    });
               }, 1000);
          }
          return () => {
               if (interval) clearInterval(interval);
          };
     }, [isActive, isPaused, isPreStarting, isCycleResting, isResting, timeLeft, endingSound]);

     // onComplete 처리
     useEffect(() => {
          if (shouldComplete) {
               onComplete();
               setShouldComplete(false);
               if (prepTime > 0 && !isLastRepetition) {
                    setIsResting(true);
                    if (setEndSound) {
                         setEndSound.replayAsync().then(() => logger.log("Set end sound (great.mp3) played"));
                    }
               } else if (isLastRepetition) {
                    if (workoutEndSound) {
                         workoutEndSound
                              .replayAsync()
                              .then(() => logger.log("Workout end sound (complete.mp3) played"));
                    }
               }
          }
     }, [shouldComplete, onComplete, prepTime, setEndSound, workoutEndSound, isLastRepetition]);

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
          color: "#ffffff",
          fontWeight: "bold",
          marginBottom: 8,
     },
     labelPreStart: {
          fontSize: 18,
          color: "#FFD700",
          fontWeight: "bold",
          marginBottom: 8,
     },
     labelRest: {
          fontSize: 18,
          color: "#00FF00",
          fontWeight: "bold",
          marginBottom: 8,
     },
     labelCycleRest: {
          fontSize: 18,
          color: "#FF69B4",
          fontWeight: "bold",
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
