import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Audio } from "expo-av";

interface TimerProps {
     duration: number;
     isActive: boolean;
     onComplete: () => void;
     prepTime: number;
     preStartTime: number;
}

export default function Timer({ duration, isActive, onComplete, prepTime, preStartTime }: TimerProps) {
     const [timeLeft, setTimeLeft] = useState(duration);
     const [isPreparing, setIsPreparing] = useState(true);
     const [prepTimeLeft, setPrepTimeLeft] = useState(preStartTime);
     const [shouldComplete, setShouldComplete] = useState(false);
     const [setEndSound, setSetEndSound] = useState<Audio.Sound | null>(null);
     const [restEndSound, setRestEndSound] = useState<Audio.Sound | null>(null);

     useEffect(() => {
          const loadSounds = async () => {
               try {
                    await Audio.setAudioModeAsync({
                         allowsRecordingIOS: false,
                         playsInSilentModeIOS: true,
                         staysActiveInBackground: false,
                         shouldDuckAndroid: false,
                    });

                    const { sound: setEnd } = await Audio.Sound.createAsync(require("../assets/set_end.mp3"), {
                         shouldPlay: false,
                    });
                    const { sound: restEnd } = await Audio.Sound.createAsync(require("../assets/rest_end.mp3"), {
                         shouldPlay: false,
                    });
                    setSetEndSound(setEnd);
                    setRestEndSound(restEnd);
                    console.log("Timer sounds loaded: set_end and rest_end");
               } catch (error) {
                    console.error("Error loading Timer sounds:", error);
               }
          };
          loadSounds();

          return () => {
               if (setEndSound) {
                    setEndSound.unloadAsync().catch((error) => console.error("Error unloading setEndSound:", error));
               }
               if (restEndSound) {
                    restEndSound.unloadAsync().catch((error) => console.error("Error unloading restEndSound:", error));
               }
          };
     }, []);

     useEffect(() => {
          if (!isActive) {
               setTimeLeft(duration);
               setPrepTimeLeft(preStartTime);
               setIsPreparing(true);
               setShouldComplete(false);
               return;
          }

          let interval: NodeJS.Timeout;

          if (isPreparing && prepTimeLeft > 0) {
               interval = setInterval(() => {
                    setPrepTimeLeft((prev) => {
                         if (prev <= 1) {
                              setIsPreparing(false);
                              if (restEndSound) {
                                   restEndSound.replayAsync().then(() => console.log("Rest end sound played"));
                              }
                              return preStartTime;
                         }
                         return prev - 1;
                    });
               }, 1000);
          } else if (!isPreparing && timeLeft > 0) {
               interval = setInterval(() => {
                    setTimeLeft((prev) => {
                         if (prev <= 1) {
                              setShouldComplete(true);
                              return duration;
                         }
                         return prev - 1;
                    });
               }, 1000);
          }

          return () => {
               if (interval) clearInterval(interval);
          };
     }, [isActive, isPreparing, timeLeft, prepTimeLeft, duration, preStartTime, restEndSound]);

     useEffect(() => {
          if (shouldComplete) {
               onComplete();
               setShouldComplete(false);
               setIsPreparing(true);
               setPrepTimeLeft(prepTime);
               if (setEndSound) {
                    setEndSound.replayAsync().then(() => console.log("Set end sound played"));
               }
          }
     }, [shouldComplete, onComplete, prepTime, setEndSound]);

     const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins}:${secs.toString().padStart(2, "0")}`;
     };

     return (
          <View style={styles.container}>
               <View style={styles.timerContainer}>
                    {isPreparing ? (
                         <View style={styles.prepTimeContainer}>
                              <Text style={styles.prepLabel}>시작 전 대기</Text>
                              <Text style={[styles.timeText, { color: "#FFA500" }]}>{formatTime(prepTimeLeft)}</Text>
                         </View>
                    ) : (
                         <View style={styles.workoutTimeContainer}>
                              <Text style={styles.workoutLabel}>운동</Text>
                              <Text style={[styles.timeText, { color: "#4CAF50" }]}>{formatTime(timeLeft)}</Text>
                         </View>
                    )}
               </View>
          </View>
     );
}

const styles = StyleSheet.create({
     timerContainer: {
          alignItems: "center",
          padding: 20,
          backgroundColor: "#252525",
          borderRadius: 12,
          marginVertical: 12,
          borderWidth: 1,
          borderColor: "#333",
     },
     prepTimeContainer: {
          alignItems: "center",
          width: "100%",
     },
     workoutTimeContainer: {
          alignItems: "center",
          width: "100%",
     },
     prepLabel: {
          fontSize: 16,
          color: "#FFA500",
          fontWeight: "700",
          marginBottom: 8,
          letterSpacing: 1,
     },
     workoutLabel: {
          fontSize: 16,
          color: "#4CAF50",
          fontWeight: "700",
          marginBottom: 8,
          letterSpacing: 1,
     },
     container: {
          alignItems: "center",
          width: "100%",
     },
     timeText: {
          fontSize: 40,
          fontWeight: "bold",
          color: "#FFFFFF",
          marginVertical: 8,
          fontVariant: ["tabular-nums"],
     },
});
