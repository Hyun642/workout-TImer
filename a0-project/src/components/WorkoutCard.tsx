import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Switch, Modal, Animated, ScrollView, Dimensions } from "react-native";
import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { Workout } from "../types/workout";
import { WorkoutHistory } from "../types/history";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import { Audio } from "expo-av";
import logger from "../utils/logger";
import * as Notifications from "expo-notifications";
import { useSettings } from "../contexts/SettingsContext";

interface WorkoutCardProps {
     workout: Workout;
     onDeleteRequest: () => void;
     onEdit: () => void;
     onHistoryUpdate: () => void;
     onResetRequest: (resetFunc: () => void) => void;
}

const saveWorkoutHistory = async (historyItem: WorkoutHistory, onHistoryUpdate: () => void) => {
     try {
          const existingHistory = await AsyncStorage.getItem("workoutHistory");
          const historyArray: WorkoutHistory[] = existingHistory ? JSON.parse(existingHistory) : [];
          historyArray.push(historyItem);
          await AsyncStorage.setItem("workoutHistory", JSON.stringify(historyArray));
          onHistoryUpdate();
     } catch (error) {
          logger.error("Error saving workout history:", error);
     }
};

type MusicTrackKey = "music1" | "music2" | "music3";
type TimerMode = "preStart" | "workout" | "prep" | "cycleRest";

export default function WorkoutCard({
     workout,
     onDeleteRequest,
     onEdit,
     onHistoryUpdate,
     onResetRequest,
}: WorkoutCardProps) {
     const [isTimerActive, setIsTimerActive] = useState(false);
     const [isPaused, setIsPaused] = useState(false);
     const [isCompleted, setIsCompleted] = useState(false);

     const [repeatCount, setRepeatCount] = useState(0);
     const [setCount, setSetCount] = useState(1);

     const [timerMode, setTimerMode] = useState<TimerMode>("preStart");
     const [displayTime, setDisplayTime] = useState(workout.preStartTime);

     const soundsRef = useRef<{ [key: string]: Audio.Sound | null }>({});
     const intervalRef = useRef<NodeJS.Timeout | null>(null);
     const [startTime, setStartTime] = useState<Date | null>(null);
     const [totalTime, setTotalTime] = useState<number>(0);

     const { soundEffectsVolume } = useSettings();

     const [backgroundMusic, setBackgroundMusic] = useState<Audio.Sound | null>(null);
     const [isMusicEnabled, setIsMusicEnabled] = useState(false);
     const [isMusicLoading, setIsMusicLoading] = useState(false);
     const [selectedTrack, setSelectedTrack] = useState<MusicTrackKey>("music1");

     const [isMusicInfoModalVisible, setIsMusicInfoModalVisible] = useState(false);
     const [modalScale] = useState(new Animated.Value(0));
     const [volume, setVolume] = useState(0.2);
     const [notificationId, setNotificationId] = useState<string | null>(null);

     const musicTracks = {
          music1: require("../assets/music1.mp3"),
          music2: require("../assets/music2.mp3"),
          music3: require("../assets/music3.mp3"),
     };

     const musicInfo = {
          music1: {
               provider: "셀바이뮤직",
               title: "hiro-in by SellBuyMusic",
               url: "https://sellbuymusic.com/md/mdltntt-ifczzbz",
          },
          music2: {
               provider: "셀바이뮤직",
               title: "기타와 비트 by SellBuyMusic",
               url: "https://sellbuymusic.com/md/mapzhkc-ufczzbz",
          },
          music3: {
               provider: "셀바이뮤직",
               title: "자신감 by SellBuyMusic",
               url: "https://sellbuymusic.com/md/mlqtnhf-vfczzbz",
          },
     };

     useEffect(() => {
          let soundObject: Audio.Sound | null = null;

          const loadMusic = async () => {
               if (isMusicEnabled) {
                    setIsMusicLoading(true);
                    try {
                         const { sound } = await Audio.Sound.createAsync(
                              musicTracks[selectedTrack],
                              { isLooping: true, volume: volume, shouldPlay: false }
                         );
                         soundObject = sound;
                         setBackgroundMusic(sound);
                    } catch (error) {
                         logger.error("Failed to load background music", error);
                         setIsMusicEnabled(false);
                    } finally {
                         setIsMusicLoading(false);
                    }
               }
          };

          if (isMusicEnabled) {
               loadMusic();
          } else {
               setBackgroundMusic(null);
          }

          return () => {
               if (soundObject) {
                    soundObject.unloadAsync();
               }
          };
     }, [isMusicEnabled, selectedTrack]);

     useEffect(() => {
          const controlPlayback = async () => {
               if (backgroundMusic) {
                    if (isTimerActive && !isPaused) {
                         try {
                              const status = await backgroundMusic.getStatusAsync();
                              if (status.isLoaded && !status.isPlaying) {
                                   await backgroundMusic.playAsync();
                              }
                         } catch (error) {
                              logger.error("Error playing music", error);
                         }
                    } else {
                         try {
                              const status = await backgroundMusic.getStatusAsync();
                              if (status.isLoaded && status.isPlaying) {
                                   await backgroundMusic.pauseAsync();
                              }
                         } catch (error) {
                              logger.error("Error pausing music", error);
                         }
                    }
               }
          };
          controlPlayback();
     }, [isTimerActive, isPaused, backgroundMusic]);

     useEffect(() => {
          if (backgroundMusic) {
               backgroundMusic.setVolumeAsync(volume);
          }
     }, [volume, backgroundMusic]);

     useEffect(() => {
          const initialize = async () => {
               await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: 2,
                    interruptionModeIOS: 2,
               });
               const { sound: restS } = await Audio.Sound.createAsync(require("../assets/start.mp3"));
               const { sound: setS } = await Audio.Sound.createAsync(require("../assets/great.mp3"));
               const { sound: workoutS } = await Audio.Sound.createAsync(require("../assets/complete.mp3"));
               const { sound: countS } = await Audio.Sound.createAsync(require("../assets/count.mp3"));
               const { sound: endingS } = await Audio.Sound.createAsync(require("../assets/ending.mp3"));
               soundsRef.current = {
                    restEndSound: restS,
                    setEndSound: setS,
                    workoutEndSound: workoutS,
                    countSound: countS,
                    endingSound: endingS,
               };
          };
          initialize();
          return () => {
               if (intervalRef.current) clearInterval(intervalRef.current);
               Object.values(soundsRef.current).forEach((sound) => sound?.unloadAsync());
               backgroundMusic?.unloadAsync();
               dismissNotification();
          };
     }, []);

     useEffect(() => {
          Object.values(soundsRef.current).forEach((sound) => {
               if (sound) sound.setVolumeAsync(soundEffectsVolume);
          });
     }, [soundEffectsVolume, soundsRef.current]);

     const getDurationForMode = (mode: TimerMode): number => {
          switch (mode) {
               case "preStart":
                    return workout.preStartTime;
               case "workout":
                    return workout.duration;
               case "prep":
                    return workout.prepTime;
               case "cycleRest":
                    return workout.cycleRestTime;
               default:
                    return 0;
          }
     };

     useEffect(() => {
          if (intervalRef.current) clearInterval(intervalRef.current);

          if (isTimerActive && !isPaused) {
               intervalRef.current = setInterval(() => {
                    setDisplayTime((prevTime) => prevTime - 1);
               }, 1000);
          }
          return () => {
               if (intervalRef.current) clearInterval(intervalRef.current);
          };
     }, [isTimerActive, isPaused]);

     useEffect(() => {
          if (isTimerActive) {
               if (displayTime <= 3 && displayTime > 0) {
                    if (timerMode !== "preStart") {
                         if (displayTime <= 3) soundsRef.current.endingSound?.replayAsync();
                    } else if (displayTime === 3) {
                         soundsRef.current.countSound?.replayAsync();
                    }
               } else if (displayTime <= 0) {
                    playCompletionSoundAndSwitchState();
               }
          }
     }, [displayTime, isTimerActive]);

     const playCompletionSoundAndSwitchState = () => {
          if (timerMode === "workout") {
               const isLastRep = workout.repeatCount > 0 && repeatCount + 1 >= workout.repeatCount;
               const isLastSet = workout.cycleCount > 0 && setCount >= workout.cycleCount;
               if (isLastRep && isLastSet) {
                    soundsRef.current.workoutEndSound?.replayAsync();
               } else {
                    soundsRef.current.setEndSound?.replayAsync();
               }
          } else if (timerMode === "prep" || timerMode === "cycleRest") {
               soundsRef.current.restEndSound?.replayAsync();
          }
          handleTimerCompletion();
     };

     const handleTimerCompletion = () => {
          let nextMode: TimerMode = "workout";
          if (timerMode === "preStart") {
               nextMode = "workout";
          } else if (timerMode === "workout") {
               const newReps = repeatCount + 1;
               const isLastRep = workout.repeatCount > 0 && newReps >= workout.repeatCount;
               const isLastSet = workout.cycleCount > 0 && setCount >= workout.cycleCount;
               if (isLastRep && isLastSet) {
                    celebrateCompletion(newReps);
                    return;
               }
               setRepeatCount(newReps);
               if (isLastRep) {
                    if (workout.cycleRestTime > 0) {
                         nextMode = "cycleRest";
                    } else {
                         setSetCount((prev) => prev + 1);
                         setRepeatCount(0);
                         soundsRef.current.restEndSound?.replayAsync();
                         nextMode = "workout";
                    }
               } else {
                    if (workout.prepTime > 0) {
                         nextMode = "prep";
                    } else {
                         nextMode = "workout";
                    }
               }
          } else if (timerMode === "prep" || timerMode === "cycleRest") {
               if (timerMode === "cycleRest") {
                    setSetCount((prev) => prev + 1);
                    setRepeatCount(0);
               }
               nextMode = "workout";
          }
          setTimerMode(nextMode);
          setDisplayTime(getDurationForMode(nextMode));
     };

     const handlePress = () => {
          if (!isTimerActive && !isCompleted) {
               setStartTime(new Date());
               setIsTimerActive(true);
               setIsPaused(false);
          } else if (isCompleted) handleReset();
          else if (isTimerActive) setIsPaused((prev) => !prev);
     };

     const handleReset = () => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsTimerActive(false);
          if (startTime) {
               const totalReps = (setCount - 1) * workout.repeatCount + repeatCount;
               saveWorkoutHistory(
                    {
                         id: uuidv4(),
                         workoutId: workout.id,
                         workoutName: workout.name,
                         startTime: startTime.toISOString(),
                         endTime: new Date().toISOString(),
                         totalRepetitions: totalReps,
                         completed: false,
                    },
                    onHistoryUpdate
               );
          }
          setRepeatCount(0);
          setSetCount(1);
          setIsPaused(false);
          setIsCompleted(false);
          setStartTime(null);
          setTotalTime(0);
          setTimerMode("preStart");
          setDisplayTime(workout.preStartTime);
     };

     const celebrateCompletion = (finalRepeatCount: number) => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsTimerActive(false);
          setIsCompleted(true);
          if (startTime) {
               const endTime = new Date();
               const totalReps =
                    (workout.cycleCount > 0
                         ? (workout.cycleCount - 1) * workout.repeatCount
                         : (setCount - 1) * workout.repeatCount) + finalRepeatCount;
               setTotalTime(Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
               saveWorkoutHistory(
                    {
                         id: uuidv4(),
                         workoutId: workout.id,
                         workoutName: workout.name,
                         startTime: startTime.toISOString(),
                         endTime: endTime.toISOString(),
                         totalRepetitions: totalReps,
                         completed: true,
                    },
                    onHistoryUpdate
               );
          }
     };

     const formatTime = (seconds: number) => {
          const safeSeconds = Math.max(0, seconds);
          const mins = Math.floor(safeSeconds / 60);
          const secs = safeSeconds % 60;
          return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
     };

     const getDynamicStyles = () => {
          switch (timerMode) {
               case "preStart":
                    return {
                         label: timerStyles.labelPreStart,
                         time: timerStyles.timePreStart,
                         color: timerStyles.timePreStart.color,
                    };
               case "prep":
                    return {
                         label: timerStyles.labelRest,
                         time: timerStyles.timeRest,
                         color: timerStyles.timeRest.color,
                    };
               case "cycleRest":
                    return {
                         label: timerStyles.labelCycleRest,
                         time: timerStyles.timeCycleRest,
                         color: timerStyles.timeCycleRest.color,
                    };
               default:
                    return { label: timerStyles.label, time: timerStyles.time, color: timerStyles.time.color };
          }
     };

     const getLabelText = () => {
          switch (timerMode) {
               case "preStart":
                    return "시작 준비";
               case "prep":
                    return "휴식";
               case "cycleRest":
                    return "세트 간 휴식";
               default:
                    return "운동";
          }
     };

     const dismissNotification = async () => {
          if (notificationId) {
               await Notifications.dismissNotificationAsync(notificationId);
               setNotificationId(null);
          }
     };

     useEffect(() => {
          if (isMusicInfoModalVisible)
               Animated.spring(modalScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
          else Animated.timing(modalScale, { toValue: 0, duration: 200, useNativeDriver: true }).start();
     }, [isMusicInfoModalVisible]);

     return (
          <>
               <View
                    style={[
                         styles.card,
                         {
                              backgroundColor: isCompleted
                                   ? "rgba(33, 150, 243, 0.9)"
                                   : isPaused
                                   ? "#e65045"
                                   : workout.backgroundColor,
                              shadowColor: isTimerActive && !isPaused ? "#00FF00" : "#000",
                              shadowOpacity: isTimerActive && !isPaused ? 0.8 : 0.3,
                         },
                    ]}
               >
                    <Pressable onPress={handlePress} style={styles.pressableArea}>
                         <View style={styles.header}>
                              <Text style={styles.title}>{workout.name}</Text>
                              <View style={styles.actions}>
                                   {isTimerActive && !isPaused ? (
                                        <MaterialIcons
                                             name="pause"
                                             size={24}
                                             color="#ffffff"
                                             style={styles.statusIcon}
                                        />
                                   ) : isTimerActive && isPaused ? (
                                        <MaterialIcons
                                             name="play-arrow"
                                             size={24}
                                             color="#ffffff"
                                             style={styles.statusIcon}
                                        />
                                   ) : null}
                                   <Pressable onPress={onEdit} style={styles.actionButton}>
                                        <MaterialCommunityIcons name="pencil" size={24} color="#ffffff" />
                                   </Pressable>
                                   <Pressable onPress={onDeleteRequest} style={styles.actionButton}>
                                        <MaterialCommunityIcons name="delete" size={24} color="#ffffff" />
                                   </Pressable>
                              </View>
                         </View>

                         <View style={timerStyles.container}>
                              <Text style={getDynamicStyles().label}>{getLabelText()}</Text>
                              <Text style={getDynamicStyles().time}>{formatTime(displayTime)}</Text>
                              <Progress.Bar
                                   style={timerStyles.progressBar}
                                   progress={
                                        getDurationForMode(timerMode) > 0
                                             ? (getDurationForMode(timerMode) - displayTime) /
                                               getDurationForMode(timerMode)
                                             : 0
                                   }
                                   width={Dimensions.get("window").width * 0.7}
                                   height={8}
                                   color={getDynamicStyles().color}
                                   unfilledColor="rgba(255, 255, 255, 0.2)"
                                   borderWidth={0}
                                   borderRadius={5}
                                   animated={true}
                              />
                         </View>

                         <View style={styles.footer}>
                              <View>
                                   <Text style={styles.repeatText}>
                                        횟수: {repeatCount}/{workout.repeatCount === 0 ? "∞" : workout.repeatCount}
                                   </Text>
                                   <Text style={styles.setText}>
                                        세트: {setCount}/{workout.cycleCount === 0 ? "∞" : workout.cycleCount}
                                   </Text>
                              </View>
                              <Pressable onPress={() => onResetRequest(handleReset)} style={styles.resetButton}>
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
                                   onValueChange={setIsMusicEnabled}
                                   trackColor={{ false: "#767577", true: "#81b0ff" }}
                                   thumbColor={isMusicEnabled ? "#f5dd4b" : "#f4f3f4"}
                              />
                         </View>
                         {isMusicEnabled && (
                              <>
                                   <View style={styles.musicPickerContainer}>
                                        <Picker
                                             selectedValue={selectedTrack}
                                             onValueChange={(itemValue: MusicTrackKey) => setSelectedTrack(itemValue)}
                                             style={styles.musicPicker}
                                             enabled={isMusicEnabled}
                                        >
                                             <Picker.Item label="Music 1" value="music1" />
                                             <Picker.Item label="Music 2" value="music2" />
                                             <Picker.Item label="Music 3" value="music3" />
                                        </Picker>
                                        <Pressable
                                             style={styles.infoButton}
                                             onPress={() => setIsMusicInfoModalVisible(true)}
                                        >
                                             <MaterialIcons name="info-outline" size={22} color="lightgray" />
                                        </Pressable>
                                   </View>
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

               <Modal visible={isMusicInfoModalVisible} transparent={true} animationType="none">
                    <View style={styles.modalOverlay}>
                         <Animated.View style={[styles.modal, { transform: [{ scale: modalScale }] }]}>
                              <Text style={styles.modalTitle}>음악 출처</Text>
                              <ScrollView style={styles.musicInfoContent}>
                                   {Object.entries(musicInfo).map(([track, info]) => (
                                        <View key={track} style={styles.musicInfoItem}>
                                             <Text style={styles.musicInfoTitle}>{track}:</Text>
                                             <Text style={styles.musicInfoText}>
                                                  ✔ Music provided by {info.provider}
                                             </Text>
                                             <Text style={styles.musicInfoText}>🎵 Title: {info.title}</Text>
                                             <Text style={styles.musicInfoText}>{info.url}</Text>
                                        </View>
                                   ))}
                              </ScrollView>
                              <Pressable style={styles.closeButton} onPress={() => setIsMusicInfoModalVisible(false)}>
                                   <Text style={styles.buttonText}>닫기</Text>
                              </Pressable>
                         </Animated.View>
                    </View>
               </Modal>
          </>
     );
}

const styles = StyleSheet.create({
     card: {
          borderRadius: 30,
          padding: 20,
          marginBottom: 16,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
          elevation: 5,
          width: "100%",
     },
     pressableArea: { flex: 1 },
     header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
     title: { fontSize: 22, fontWeight: "bold", color: "#FFFFFF" },
     actions: { flexDirection: "row", alignItems: "center" },
     actionButton: { marginLeft: 16, padding: 8 },
     statusIcon: { marginLeft: 16 },
     footer: { marginTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
     repeatText: { fontSize: 18, color: "#ffffff", fontWeight: "500" },
     setText: { fontSize: 18, color: "#ffffff", fontWeight: "500", marginTop: 4 },
     resetButton: { padding: 8, backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: 20 },
     completedMessage: { justifyContent: "center", alignItems: "center", marginTop: 20 },
     completedText: { fontSize: 36, fontWeight: "bold", color: "#FFFFFF", marginBottom: 16 },
     totalTimeText: { fontSize: 16, color: "#FFFFFF" },
     musicControl: {
          marginTop: 16,
          padding: 10,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: 8,
          width: "100%",
     },
     switchContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
     musicLabel: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
     musicPickerContainer: { flexDirection: "row", alignItems: "center", marginTop: 8 },
     musicPicker: { flex: 1, color: "#FFFFFF", borderRadius: 8, padding: 4 },
     infoButton: { padding: 8, marginLeft: 8 },
     volumeLabel: { fontSize: 16, color: "#FFFFFF", marginTop: 8 },
     volumeSlider: { width: "100%", height: 40 },
     modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "center", alignItems: "center" },
     modal: {
          backgroundColor: "#2C2C2C",
          borderRadius: 16,
          padding: 20,
          width: "80%",
          maxWidth: 350,
          alignItems: "center",
     },
     modalTitle: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF", marginBottom: 12, textAlign: "center" },
     modalMessage: { fontSize: 16, color: "#BBBBBB", textAlign: "center", marginBottom: 20 },
     musicInfoContent: { marginBottom: 20 },
     musicInfoItem: { marginBottom: 16 },
     musicInfoTitle: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", marginBottom: 4 },
     musicInfoText: { fontSize: 14, color: "#BBBBBB", marginBottom: 2 },
     modalButtons: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
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
     closeButton: { backgroundColor: "#555", padding: 12, borderRadius: 8, alignItems: "center" },
     buttonText: { fontSize: 16, color: "#FFFFFF", fontWeight: "600" },
});

const timerStyles = StyleSheet.create({
     container: { alignItems: "center" },
     label: { fontSize: 18, color: "#ffffff", fontWeight: "bold", marginBottom: 8 },
     labelPreStart: { fontSize: 18, color: "#FFD700", fontWeight: "bold", marginBottom: 8 },
     labelRest: { fontSize: 18, color: "#00FF00", fontWeight: "bold", marginBottom: 8 },
     labelCycleRest: { fontSize: 18, color: "#FF69B4", fontWeight: "bold", marginBottom: 8 },
     time: { fontSize: 48, fontWeight: "bold", color: "#FFFFFF" },
     timePreStart: { fontSize: 48, fontWeight: "bold", color: "#FFD700" },
     timeRest: { fontSize: 48, fontWeight: "bold", color: "#00FF00" },
     timeCycleRest: { fontSize: 48, fontWeight: "bold", color: "#FF69B4" },
     progressBar: { marginTop: 20 },
});
