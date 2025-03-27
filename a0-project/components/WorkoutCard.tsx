import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Switch } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import Timer from "./Timer";
import { Workout } from "../types/workout";
import { WorkoutHistory } from "../types/history";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import { Audio } from "expo-av";

interface WorkoutCardProps {
     workout: Workout;
     onDelete: (id: string) => void;
     onEdit: (workout: Workout) => void;
}

const saveWorkoutHistory = async (historyItem: WorkoutHistory) => {
     try {
          const existingHistory = await AsyncStorage.getItem("workoutHistory");
          const historyArray: WorkoutHistory[] = existingHistory ? JSON.parse(existingHistory) : [];
          historyArray.push(historyItem);
          await AsyncStorage.setItem("workoutHistory", JSON.stringify(historyArray));
     } catch (error) {
          console.error("Error saving workout history:", error);
     }
};

export default function WorkoutCard({ workout, onDelete, onEdit }: WorkoutCardProps) {
     const [isTimerActive, setIsTimerActive] = useState(false);
     const [repeatCount, setRepeatCount] = useState(0);
     const [isPaused, setIsPaused] = useState(false);
     const [isCompleted, setIsCompleted] = useState(false);
     const [startTime, setStartTime] = useState<Date | null>(null);
     const [totalTime, setTotalTime] = useState<number>(0);
     const [workoutEndSound, setWorkoutEndSound] = useState<Audio.Sound | null>(null);
     const [backgroundMusic, setBackgroundMusic] = useState<Audio.Sound | null>(null);
     const [isMusicEnabled, setIsMusicEnabled] = useState(false);
     const [selectedTrack, setSelectedTrack] = useState("music1");

     const musicTracks = {
          music1: require("../assets/music1.mp3"),
          music2: require("../assets/music2.mp3"),
          music3: require("../assets/music3.mp3"),
     };

     useEffect(() => {
          const initializeSounds = async () => {
               try {
                    await Audio.setAudioModeAsync({
                         allowsRecordingIOS: false,
                         playsInSilentModeIOS: true,
                         staysActiveInBackground: false,
                         shouldDuckAndroid: false,
                    });

                    const { sound: endSound } = await Audio.Sound.createAsync(require("../assets/workout_end.mp3"), {
                         shouldPlay: false,
                    });
                    await endSound.setVolumeAsync(1.0);
                    setWorkoutEndSound(endSound);
                    console.log("Workout end sound loaded successfully with volume 1.0");
               } catch (error) {
                    console.error("Failed to load workout end sound:", error);
               }
          };
          initializeSounds();

          return () => {
               if (workoutEndSound) workoutEndSound.unloadAsync();
               if (backgroundMusic) backgroundMusic.unloadAsync();
          };
     }, []);

     useEffect(() => {
          const loadBackgroundMusic = async () => {
               if (backgroundMusic) {
                    await backgroundMusic.unloadAsync();
                    console.log(`Unloaded previous ${selectedTrack}`);
               }
               try {
                    const { sound } = await Audio.Sound.createAsync(musicTracks[selectedTrack], {
                         shouldPlay: false,
                    });
                    await sound.setVolumeAsync(0.7);
                    setBackgroundMusic(sound);
                    console.log(`Background music ${selectedTrack} loaded successfully with volume 0.7`);
               } catch (error) {
                    console.error(`Failed to load background music ${selectedTrack}:`, error);
               }
          };
          loadBackgroundMusic();
     }, [selectedTrack]);

     useEffect(() => {
          const controlMusic = async () => {
               if (!backgroundMusic) {
                    console.warn(`Background music ${selectedTrack} not initialized yet`);
                    return;
               }
               console.log(
                    `ControlMusic: isMusicEnabled=${isMusicEnabled}, isTimerActive=${isTimerActive}, isPaused=${isPaused}`
               );
               try {
                    if (isMusicEnabled && isTimerActive && !isPaused) {
                         await backgroundMusic.setIsLoopingAsync(true);
                         await backgroundMusic.playAsync();
                         console.log(`Playing ${selectedTrack}`);
                    } else if (backgroundMusic) {
                         await backgroundMusic.pauseAsync();
                         console.log(`Paused ${selectedTrack}`);
                    }
               } catch (error) {
                    console.error(`Error controlling background music ${selectedTrack}:`, error);
               }
          };
          controlMusic();
     }, [isTimerActive, isPaused, isMusicEnabled, backgroundMusic]);

     const playWorkoutEndSound = async () => {
          try {
               if (workoutEndSound) {
                    await workoutEndSound.setVolumeAsync(1.0);
                    await workoutEndSound.replayAsync();
                    console.log("Workout end sound played with volume 1.0");
               }
          } catch (error) {
               console.error("Error playing workout end sound:", error);
          }
     };

     const handlePress = () => {
          if (!isTimerActive && !isCompleted) {
               setStartTime(new Date());
               setIsTimerActive(true);
               setIsPaused(false);
               console.log("Timer started");
          } else if (isCompleted) {
               handleReset();
          } else if (isTimerActive) {
               setIsPaused(!isPaused);
          }
     };

     const handleReset = () => {
          if (startTime && (isTimerActive || isPaused)) {
               const historyItem: WorkoutHistory = {
                    id: uuidv4(),
                    workoutId: workout.id,
                    workoutName: workout.name,
                    startTime: startTime.toISOString(),
                    endTime: new Date().toISOString(),
                    totalRepetitions: repeatCount,
                    completed: false,
               };
               saveWorkoutHistory(historyItem);
          }

          setIsTimerActive(false);
          setRepeatCount(0);
          setIsPaused(false);
          setIsCompleted(false);
          setStartTime(null);
          setTotalTime(0);
          console.log("Timer reset");
     };

     const celebrateCompletion = () => {
          setIsCompleted(true);
          if (startTime) {
               const endTime = new Date();
               const timeDiff = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
               setTotalTime(timeDiff);

               const historyItem: WorkoutHistory = {
                    id: uuidv4(),
                    workoutId: workout.id,
                    workoutName: workout.name,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    totalRepetitions: repeatCount,
                    completed: true,
               };
               saveWorkoutHistory(historyItem);
               playWorkoutEndSound();
          }
     };

     const handleComplete = () => {
          setRepeatCount((prev) => {
               const newCount = prev + 1;
               if (workout.repeatCount !== 0 && newCount >= workout.repeatCount) {
                    setIsTimerActive(false);
                    setIsPaused(false);
                    celebrateCompletion();
                    return newCount;
               }
               if (workout.repeatCount === 0 || newCount < workout.repeatCount) {
                    setIsTimerActive(true);
                    setIsPaused(false);
               }
               return newCount;
          });
     };

     return (
          <View style={styles.card}>
               <Pressable onPress={handlePress} style={styles.pressableArea}>
                    <View style={styles.header}>
                         <Text style={styles.title}>{workout.name}</Text>
                         <View style={styles.actions}>
                              <Pressable
                                   onPress={() => {
                                        console.log("Editing workout:", workout);
                                        onEdit(workout);
                                   }}
                                   style={styles.actionButton}
                              >
                                   <MaterialCommunityIcons name="pencil" size={24} color="#666" />
                              </Pressable>
                              <Pressable
                                   onPress={() => {
                                        Alert.alert("루틴 삭제", `해당 루틴을 삭제합니다. "${workout.name}"?`, [
                                             { text: "취소", style: "cancel" },
                                             {
                                                  text: "확인",
                                                  onPress: () => onDelete(workout.id),
                                                  style: "destructive",
                                             },
                                        ]);
                                   }}
                                   style={styles.actionButton}
                              >
                                   <MaterialCommunityIcons name="delete" size={24} color="#666" />
                              </Pressable>
                         </View>
                    </View>
                    <Timer
                         duration={workout.duration}
                         isActive={isTimerActive}
                         isPaused={isPaused}
                         onComplete={handleComplete}
                         prepTime={workout.prepTime}
                         preStartTime={workout.preStartTime}
                    />
                    <View style={styles.footer}>
                         <Text style={styles.repeatText}>
                              반복: {repeatCount}/{workout.repeatCount === 0 ? "∞" : workout.repeatCount}
                         </Text>
                         <Pressable onPress={handleReset} style={styles.resetButton}>
                              <MaterialIcons name="replay" size={24} color="#FFFFFF" />
                         </Pressable>
                    </View>

                    {isPaused && isTimerActive && (
                         <View style={styles.pauseOverlay}>
                              <Text style={styles.pauseText}></Text>
                         </View>
                    )}

                    {isCompleted && (
                         <View style={styles.completedOverlay}>
                              <Text style={styles.completedText}>대단해요!</Text>
                              <MaterialIcons name="celebration" size={40} color="#FFD700" />
                              <Text style={styles.totalTimeText}>
                                   총 소요시간: {Math.floor(totalTime / 60)}분 {totalTime % 60}초
                              </Text>
                         </View>
                    )}
               </Pressable>

               {/* 음악 제어 UI */}
               <View style={styles.musicControl}>
                    <View style={styles.switchContainer}>
                         <Text style={styles.musicLabel}>배경 음악</Text>
                         <Switch
                              value={isMusicEnabled}
                              onValueChange={(value) => setIsMusicEnabled(value)}
                              trackColor={{ false: "#767577", true: "#81b0ff" }}
                              thumbColor={isMusicEnabled ? "#f5dd4b" : "#f4f3f4"}
                         />
                    </View>
                    <Picker
                         selectedValue={selectedTrack}
                         onValueChange={(itemValue: any) => setSelectedTrack(itemValue)}
                         style={styles.picker}
                         enabled={isMusicEnabled}
                    >
                         <Picker.Item label="Music 1" value="music1" />
                         <Picker.Item label="Music 2" value="music2" />
                         <Picker.Item label="Music 3" value="music3" />
                    </Picker>
               </View>
          </View>
     );
}

const styles = StyleSheet.create({
     card: {
          backgroundColor: "#2196F3",
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
          width: "100%",
     },
     pressableArea: {
          flex: 1,
     },
     header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
     },
     title: {
          fontSize: 22,
          fontWeight: "bold",
          color: "#FFFFFF",
     },
     actions: {
          flexDirection: "row",
     },
     actionButton: {
          marginLeft: 16,
          padding: 8,
     },
     footer: {
          marginTop: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
     },
     repeatText: {
          fontSize: 16,
          color: "#BBBBBB",
          fontWeight: "500",
     },
     resetButton: {
          padding: 8,
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderRadius: 20,
     },
     pauseOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(150, 230, 170, 0.1)",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 16,
     },
     pauseText: {
          fontSize: 32,
          fontWeight: "bold",
          color: "#FFFFFF",
     },
     completedOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(33, 150, 243, 0.9)",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 16,
     },
     completedText: {
          fontSize: 36,
          fontWeight: "bold",
          color: "#FFFFFF",
          marginBottom: 16,
     },
     totalTimeText: {
          fontSize: 16,
          color: "#FFFFFF",
     },
     musicControl: {
          marginTop: 16,
          padding: 10,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: 8,
          width: "100%",
     },
     switchContainer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
     },
     musicLabel: {
          fontSize: 16,
          color: "#FFFFFF",
     },
     picker: {
          width: "100%",
          color: "#FFFFFF",
          marginTop: 8,
     },
});
