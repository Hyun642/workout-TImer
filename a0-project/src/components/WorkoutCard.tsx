import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Switch, Modal, Animated } from "react-native";
import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import Timer from "./Timer";
import { Workout } from "../types/workout";
import { WorkoutHistory } from "../types/history";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import { Audio } from "expo-av";
import logger from "../utils/logger";

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
          logger.error("Error saving workout history:", error);
     }
};

type MusicTrackKey = "music1" | "music2" | "music3";
type MusicTracks = Record<MusicTrackKey, number>;

export default function WorkoutCard({ workout, onDelete, onEdit }: WorkoutCardProps) {
     const [isTimerActive, setIsTimerActive] = useState(false);
     const [repeatCount, setRepeatCount] = useState(0);
     const [setCount, setSetCount] = useState(1);
     const [isPaused, setIsPaused] = useState(false);
     const [isCompleted, setIsCompleted] = useState(false);
     const [isCycleResting, setIsCycleResting] = useState(false);
     const [startTime, setStartTime] = useState<Date | null>(null);
     const [totalTime, setTotalTime] = useState<number>(0);
     const [workoutEndSound, setWorkoutEndSound] = useState<Audio.Sound | null>(null);
     const [backgroundMusic, setBackgroundMusic] = useState<Audio.Sound | null>(null);
     const [isMusicEnabled, setIsMusicEnabled] = useState(false);
     const [isMusicLoading, setIsMusicLoading] = useState(false);
     const [selectedTrack, setSelectedTrack] = useState<MusicTrackKey>("music1");
     const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
     const [isResetModalVisible, setIsResetModalVisible] = useState(false);
     const [modalScale] = useState(new Animated.Value(0));
     const [volume, setVolume] = useState(0.2);

     const musicTracks: MusicTracks = {
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
                    logger.log("Workout end sound loaded successfully with volume 1.0");
               } catch (error) {
                    logger.error("Failed to load workout end sound:", error);
               }
          };
          initializeSounds();

          return () => {
               if (workoutEndSound) {
                    workoutEndSound.unloadAsync().then(() => {
                         setWorkoutEndSound(null);
                         logger.log("Workout end sound unloaded");
                    });
               }
               if (backgroundMusic) {
                    backgroundMusic.unloadAsync().then(() => {
                         setBackgroundMusic(null);
                         logger.log("Background music unloaded");
                    });
               }
          };
     }, []);

     useEffect(() => {
          const loadBackgroundMusic = async () => {
               setIsMusicLoading(true);
               if (backgroundMusic) {
                    await backgroundMusic.unloadAsync();
                    logger.log(`Unloaded previous ${selectedTrack}`);
               }
               try {
                    const { sound } = await Audio.Sound.createAsync(musicTracks[selectedTrack], {
                         shouldPlay: false,
                    });
                    await sound.setVolumeAsync(volume);
                    setBackgroundMusic(sound);
                    logger.log(`Background music ${selectedTrack} loaded successfully with volume ${volume}`);
               } catch (error) {
                    logger.error(`Failed to load background music ${selectedTrack}:`, error);
               } finally {
                    setIsMusicLoading(false);
               }
          };
          loadBackgroundMusic();
     }, [selectedTrack]);

     useEffect(() => {
          const controlMusic = async () => {
               if (isMusicLoading || !backgroundMusic) {
                    logger.warn(`Background music ${selectedTrack} not ready yet. Loading: ${isMusicLoading}`);
                    return;
               }
               try {
                    if (isMusicEnabled && isTimerActive && !isPaused) {
                         await backgroundMusic.setIsLoopingAsync(true);
                         await backgroundMusic.playAsync();
                         logger.log(`Playing ${selectedTrack}`);
                    } else {
                         await backgroundMusic.pauseAsync();
                         logger.log(`Paused ${selectedTrack}`);
                    }
               } catch (error) {
                    logger.error(`Error controlling background music ${selectedTrack}:`, error);
               }
          };
          controlMusic();
     }, [isTimerActive, isPaused, isMusicEnabled, backgroundMusic, isMusicLoading]);

     useEffect(() => {
          const updateVolume = async () => {
               if (backgroundMusic) {
                    await backgroundMusic.setVolumeAsync(volume);
                    logger.log(`Volume set to ${volume}`);
               }
          };
          updateVolume();
     }, [volume, backgroundMusic]);

     useEffect(() => {
          if (isDeleteModalVisible || isResetModalVisible) {
               Animated.spring(modalScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
               }).start();
          } else {
               Animated.timing(modalScale, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
               }).start();
          }
     }, [isDeleteModalVisible, isResetModalVisible]);

     const playWorkoutEndSound = async () => {
          try {
               if (!workoutEndSound) {
                    logger.warn("Workout end sound not initialized");
                    return;
               }
               await workoutEndSound.setVolumeAsync(1.0);
               await workoutEndSound.replayAsync();
               logger.log("Workout end sound played with volume 1.0");
          } catch (error) {
               logger.error("Error playing workout end sound:", error);
          }
     };

     const handlePress = () => {
          if (!isTimerActive && !isCompleted) {
               setStartTime(new Date());
               setIsTimerActive(true);
               setIsPaused(false);
               logger.log("Timer started");
          } else if (isCompleted) {
               handleReset();
          } else if (isTimerActive) {
               setIsPaused(!isPaused);
          }
     };

     const handleResetPress = () => {
          setIsResetModalVisible(true);
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
          setSetCount(1);
          setIsPaused(false);
          setIsCompleted(false);
          setIsCycleResting(false);
          setStartTime(null);
          setTotalTime(0);
          logger.log("Timer reset");
     };

     const handleComplete = () => {
          setRepeatCount((prev) => {
               const newCount = prev + 1;
               if (workout.repeatCount !== 0 && newCount >= workout.repeatCount) {
                    setSetCount((prevSet) => {
                         const newSetCount = prevSet + 1;
                         if (workout.cycleCount !== 0 && newSetCount > workout.cycleCount) {
                              setIsTimerActive(false);
                              setIsPaused(false);
                              setIsCycleResting(false);
                              celebrateCompletion(newCount);
                              return prevSet;
                         }
                         setIsCycleResting(true);
                         return newSetCount;
                    });
                    return 0;
               }
               if (workout.repeatCount === 0 || newCount < workout.repeatCount) {
                    setIsTimerActive(true);
                    setIsPaused(false);
               }
               return newCount;
          });
     };

     const celebrateCompletion = (finalRepeatCount: number) => {
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
                    totalRepetitions: finalRepeatCount,
                    completed: true,
               };
               saveWorkoutHistory(historyItem);
               playWorkoutEndSound();
          }
     };

     const handleCycleRestComplete = () => {
          setIsCycleResting(false);
          setIsTimerActive(true);
          setIsPaused(false);
     };

     const handleDeleteConfirm = async () => {
          if (backgroundMusic) {
               await backgroundMusic.stopAsync();
               await backgroundMusic.unloadAsync();
               logger.log("Background music stopped and unloaded on delete");
          }
          onDelete(workout.id);
          setIsDeleteModalVisible(false);
     };

     const handleDeleteCancel = () => {
          setIsDeleteModalVisible(false);
     };

     return (
          <>
               <View
                    style={[
                         styles.card,
                         {
                              backgroundColor: isCompleted
                                   ? "rgba(33, 150, 243, 0.9)"
                                   : isPaused
                                   ? "#FA4E4C"
                                   : workout.backgroundColor,
                         },
                    ]}
               >
                    <Pressable onPress={handlePress} style={styles.pressableArea}>
                         <View style={styles.header}>
                              <Text style={styles.title}>{workout.name}</Text>
                              <View style={styles.actions}>
                                   <Pressable
                                        onPress={() => {
                                             logger.log("Editing workout:", workout);
                                             onEdit(workout);
                                        }}
                                        style={styles.actionButton}
                                   >
                                        <MaterialCommunityIcons name="pencil" size={24} color="lightgray" />
                                   </Pressable>
                                   <Pressable onPress={() => setIsDeleteModalVisible(true)} style={styles.actionButton}>
                                        <MaterialCommunityIcons name="delete" size={24} color="lightgray" />
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
                              cycleRestTime={workout.cycleRestTime}
                              isCycleResting={isCycleResting}
                              onCycleRestComplete={handleCycleRestComplete}
                              workoutName={workout.name}
                         />
                         <View style={styles.footer}>
                              <View>
                                   <Text style={styles.repeatText}>
                                        횟수: {repeatCount}/{workout.repeatCount === 0 ? "∞" : workout.repeatCount}
                                   </Text>
                                   <Text style={styles.setText}>
                                        세트: {setCount}/{workout.cycleCount === 0 ? "∞" : workout.cycleCount}
                                   </Text>
                              </View>
                              <Pressable onPress={handleResetPress} style={styles.resetButton}>
                                   <MaterialIcons name="replay" size={24} color="#FFFFFF" />
                              </Pressable>
                         </View>

                         {isCompleted && (
                              <View style={styles.completedMessage}>
                                   <Text style={styles.completedText}>대단해요!</Text>
                                   <MaterialIcons name="celebration" size={40} color="#FFD700" />
                                   <Text style={styles.totalTimeText}>
                                        총 소요시간: {Math.floor(totalTime / 60)}분 {totalTime % 60}초
                                   </Text>
                              </View>
                         )}
                    </Pressable>

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
                         {isMusicEnabled && (
                              <>
                                   <Picker
                                        selectedValue={selectedTrack}
                                        onValueChange={(itemValue: MusicTrackKey) => setSelectedTrack(itemValue)}
                                        style={styles.picker}
                                        enabled={isMusicEnabled}
                                   >
                                        <Picker.Item label="Music 1" value="music1" />
                                        <Picker.Item label="Music 2" value="music2" />
                                        <Picker.Item label="Music 3" value="music3" />
                                   </Picker>
                                   <Text style={styles.volumeLabel}>볼륨: {Math.round(volume * 100)}%</Text>
                                   <Slider
                                        style={styles.volumeSlider}
                                        minimumValue={0}
                                        maximumValue={100}
                                        step={5}
                                        value={volume * 100}
                                        onValueChange={(value) => setVolume(value / 100)}
                                   />
                              </>
                         )}
                    </View>
               </View>

               <Modal visible={isDeleteModalVisible} transparent={true} animationType="none">
                    <View style={styles.modalOverlay}>
                         <Animated.View style={[styles.deleteModal, { transform: [{ scale: modalScale }] }]}>
                              <Text style={styles.modalTitle}>운동 삭제</Text>
                              <Text style={styles.modalMessage}>'{workout.name}' 운동을 삭제하시겠습니까?</Text>
                              <View style={styles.modalButtons}>
                                   <Pressable style={styles.cancelButton} onPress={handleDeleteCancel}>
                                        <Text style={styles.buttonText}>취소</Text>
                                   </Pressable>
                                   <Pressable style={styles.confirmButton} onPress={handleDeleteConfirm}>
                                        <Text style={styles.buttonText}>확인</Text>
                                   </Pressable>
                              </View>
                         </Animated.View>
                    </View>
               </Modal>

               <Modal visible={isResetModalVisible} transparent={true} animationType="none">
                    <View style={styles.modalOverlay}>
                         <Animated.View style={[styles.resetModal, { transform: [{ scale: modalScale }] }]}>
                              <Text style={styles.modalTitle}>처음으로</Text>
                              <Text style={styles.modalMessage}>진행 상황이 초기화됩니다.</Text>
                              <View style={styles.modalButtons}>
                                   <Pressable style={styles.cancelButton} onPress={() => setIsResetModalVisible(false)}>
                                        <Text style={styles.buttonText}>취소</Text>
                                   </Pressable>
                                   <Pressable
                                        style={styles.confirmButton}
                                        onPress={() => {
                                             setIsResetModalVisible(false);
                                             handleReset();
                                        }}
                                   >
                                        <Text style={styles.buttonText}>확인</Text>
                                   </Pressable>
                              </View>
                         </Animated.View>
                    </View>
               </Modal>
          </>
     );
}

const styles = StyleSheet.create({
     card: {
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
     setText: {
          fontSize: 16,
          color: "#BBBBBB",
          fontWeight: "500",
          marginTop: 4,
     },
     resetButton: {
          padding: 8,
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderRadius: 20,
     },
     completedMessage: {
          justifyContent: "center",
          alignItems: "center",
          marginTop: 20,
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
     volumeLabel: {
          fontSize: 16,
          color: "#FFFFFF",
          marginTop: 8,
     },
     volumeSlider: {
          width: "100%",
          height: 40,
     },
     modalOverlay: {
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          justifyContent: "center",
          alignItems: "center",
     },
     deleteModal: {
          backgroundColor: "#2C2C2C",
          borderRadius: 16,
          padding: 20,
          width: "80%",
          maxWidth: 350,
          alignItems: "center",
     },
     resetModal: {
          backgroundColor: "#2C2C2C",
          borderRadius: 16,
          padding: 20,
          width: "80%",
          maxWidth: 350,
          alignItems: "center",
     },
     modalTitle: {
          fontSize: 20,
          fontWeight: "bold",
          color: "#FFFFFF",
          marginBottom: 12,
     },
     modalMessage: {
          fontSize: 16,
          color: "#BBBBBB",
          textAlign: "center",
          marginBottom: 20,
     },
     modalButtons: {
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
     },
     cancelButton: {
          flex: 1,
          backgroundColor: "#555",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
          marginRight: 8,
     },
     confirmButton: {
          flex: 1,
          backgroundColor: "#FF4444",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
          marginLeft: 8,
     },
     buttonText: {
          fontSize: 16,
          color: "#FFFFFF",
          fontWeight: "600",
     },
});
