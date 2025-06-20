// src/components/WorkoutCard.tsx

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Switch, Modal, Animated, ScrollView } from "react-native";
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
import * as Notifications from "expo-notifications";

// ... (saveWorkoutHistory 함수는 기존과 동일)
interface WorkoutCardProps {
     workout: Workout;
     onDelete: (id: string) => void;
     onEdit: (workout: Workout) => void;
     onHistoryUpdate: () => void;
}

const saveWorkoutHistory = async (historyItem: WorkoutHistory, onHistoryUpdate: () => void) => {
     try {
          const existingHistory = await AsyncStorage.getItem("workoutHistory");
          const historyArray: WorkoutHistory[] = existingHistory ? JSON.parse(existingHistory) : [];
          historyArray.push(historyItem);
          await AsyncStorage.setItem("workoutHistory", JSON.stringify(historyArray));
          onHistoryUpdate();
          logger.log("Workout history saved and stats updated");
     } catch (error) {
          logger.error("Error saving workout history:", error);
     }
};

type MusicTrackKey = "music1" | "music2" | "music3";
type MusicTracks = Record<MusicTrackKey, number>;

export default function WorkoutCard({ workout, onDelete, onEdit, onHistoryUpdate }: WorkoutCardProps) {
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
     const [isMusicInfoModalVisible, setIsMusicInfoModalVisible] = useState(false);
     const [modalScale] = useState(new Animated.Value(0));
     const [volume, setVolume] = useState(0.2);
     const [notificationId, setNotificationId] = useState<string | null>(null); // [추가] 알림 ID 상태

     const musicTracks: MusicTracks = {
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
          "운동 종료": {
               provider: "셀바이뮤직",
               title: "Di-Ding 4",
               url: "https://sellbuymusic.com/md/sjrnctt-ofczzbz",
          },
          "휴식 종료": {
               provider: "셀바이뮤직",
               title: "Di-Ding 4",
               url: "https://sellbuymusic.com/md/seyqcbb-dfczzbz",
          },
          "세트 종료": {
               provider: "셀바이뮤직",
               title: "Error 2",
               url: "https://sellbuymusic.com/md/suunfxz-yfczzbz",
          },
     };

     useEffect(() => {
          const initializeSounds = async () => {
               try {
                    await Audio.setAudioModeAsync({
                         allowsRecordingIOS: false,
                         playsInSilentModeIOS: true,
                         staysActiveInBackground: true, // [중요] 백그라운드 오디오
                         shouldDuckAndroid: true,
                         interruptionModeAndroid: 1, // DO_NOT_MIX
                         interruptionModeIOS: 1, // DO_NOT_MIX
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

          // ... (기존 반환 로직)
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
               // [추가] 컴포넌트 unmount 시 알림 제거
               dismissNotification();
          };
     }, []);

     // ... (music 관련 useEffect 들은 기존과 동일)
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
          const updateVolume = async () => {
               if (backgroundMusic) {
                    await backgroundMusic.setVolumeAsync(volume);
                    logger.log(`Volume set to ${volume}`);
               }
          };
          updateVolume();
     }, [volume, backgroundMusic]);

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

          if (backgroundMusic && !isMusicLoading) {
               controlMusic();
          }
     }, [isTimerActive, isPaused, isMusicEnabled, backgroundMusic, isMusicLoading]);

     useEffect(() => {
          if (isDeleteModalVisible || isResetModalVisible || isMusicInfoModalVisible) {
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
     }, [isDeleteModalVisible, isResetModalVisible, isMusicInfoModalVisible]);

     // [추가] 알림 액션 처리
     useEffect(() => {
          const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
               const { actionIdentifier, notification } = response;

               // 이 카드의 알림이 아니면 무시
               if (notification.request.content.data.workoutId !== workout.id) {
                    return;
               }

               logger.log(`Notification action received: ${actionIdentifier}`);
               switch (actionIdentifier) {
                    case "pause-action":
                         setIsPaused(true);
                         break;
                    case "resume-action":
                         setIsPaused(false);
                         break;
                    case "stop-action":
                         handleReset();
                         break;
               }
          });

          return () => {
               subscription.remove();
          };
     }, [workout.id]); // workout.id가 변경될 일은 없지만, 의존성을 명확히 함

     // [추가] 운동 상태에 따라 알림을 관리(생성/업데이트/제거)
     useEffect(() => {
          const manageWorkoutNotification = async () => {
               if (isTimerActive) {
                    // 기존 알림이 있다면 제거 (업데이트를 위해)
                    if (notificationId) {
                         await Notifications.dismissNotificationAsync(notificationId);
                    }

                    const title = `운동 중: ${workout.name}`;
                    const body = `세트 ${setCount}/${
                         workout.cycleCount === 0 ? "∞" : workout.cycleCount
                    } | 횟수 ${repeatCount}/${workout.repeatCount === 0 ? "∞" : workout.repeatCount}`;

                    // 상태에 따라 다른 카테고리(버튼 조합) 사용
                    const categoryIdentifier = isPaused ? "workout-paused" : "workout-running";

                    const newNotificationId = await Notifications.scheduleNotificationAsync({
                         content: {
                              title: title,
                              body: body,
                              sticky: true, // 사용자가 지우지 못하게 함 (Android)
                              data: { workoutId: workout.id }, // 어떤 운동에 대한 알림인지 식별
                              categoryIdentifier: categoryIdentifier, // 상태에 맞는 버튼 표시
                              color: workout.backgroundColor,
                         },
                         trigger: null, // 즉시 표시
                    });
                    setNotificationId(newNotificationId);
               } else {
                    // 타이머가 비활성화되면 알림 제거
                    dismissNotification();
               }
          };

          manageWorkoutNotification();
     }, [isTimerActive, isPaused, workout, repeatCount, setCount]);

     // [추가] 알림 제거 헬퍼 함수
     const dismissNotification = async () => {
          if (notificationId) {
               await Notifications.dismissNotificationAsync(notificationId);
               setNotificationId(null);
               logger.log("Notification dismissed.");
          }
     };

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
               logger.log(`Timer ${isPaused ? "resumed" : "paused"}`);
          }
     };

     const handleResetPress = () => {
          setIsResetModalVisible(true);
     };

     const handleReset = () => {
          dismissNotification(); // [수정] 리셋 시 알림 제거
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
               saveWorkoutHistory(historyItem, onHistoryUpdate);
          }

          setIsTimerActive(false);
          setRepeatCount(0);
          setSetCount(1);
          setIsPaused(false);
          setIsCompleted(false);
          setIsCycleResting(false);
          setStartTime(null);
          setTotalTime(0);
          logger.log("Timer reset: All states cleared");
     };

     const celebrateCompletion = (finalRepeatCount: number) => {
          dismissNotification(); // [수정] 완료 시 알림 제거
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
               saveWorkoutHistory(historyItem, onHistoryUpdate);
               playWorkoutEndSound();
               logger.log("Workout completed, history saved");
          }
     };

     const handleComplete = () => {
          // 이 로직은 `WorkoutCard.tsx`의 기존 `handleComplete`와 완전히 동일합니다.
          // 유일한 차이점은 이제 이 함수의 결과로 상태가 변경되면,
          // 알림을 관리하는 `useEffect`가 자동으로 트리거되어 알림 내용이 업데이트된다는 점입니다.
          setRepeatCount((prev) => {
               const newCount = prev + 1;
               // 운동 횟수가 0이 아니면서, 현재 횟수가 목표 횟수와 같거나 크면
               const isLastRepOfSet = workout.repeatCount !== 0 && newCount >= workout.repeatCount;

               logger.log(`handleComplete called: repeatCount=${newCount}, isLastRepOfSet=${isLastRepOfSet}`);

               if (isLastRepOfSet) {
                    setSetCount((prevSet) => {
                         const newSetCount = prevSet + 1;
                         // 사이클 횟수가 0이 아니면서, 현재 세트가 목표 세트보다 크면 운동 종료
                         const isLastSet = workout.cycleCount !== 0 && newSetCount > workout.cycleCount;

                         logger.log(`Set completed: setCount=${newSetCount}, isLastSet=${isLastSet}`);

                         if (isLastSet) {
                              setIsTimerActive(false);
                              setIsPaused(false);
                              setIsCycleResting(false);
                              celebrateCompletion(newCount);
                              logger.log("Workout completed, all sets finished");
                              return prevSet;
                         }

                         // 세트 간 휴식 시간이 있으면 휴식 시작
                         if (workout.cycleRestTime > 0) {
                              setIsCycleResting(true);
                              logger.log(
                                   `Entering cycle rest for set ${newSetCount}, cycleRestTime=${workout.cycleRestTime}`
                              );
                         } else {
                              // 세트 간 휴식이 없으면 바로 다음 세트 시작
                              logger.log("Cycle rest time is 0, skipping cycle rest");
                              setIsTimerActive(true);
                              setIsPaused(false);
                         }

                         return newSetCount;
                    });
                    // 횟수는 0으로 리셋 (다음 세트를 위해)
                    return 0;
               }

               // 마지막 횟수가 아니라면 타이머 계속 활성화
               if (workout.repeatCount === 0 || newCount < workout.repeatCount) {
                    setIsTimerActive(true);
                    setIsPaused(false);
                    logger.log("Continuing to next repetition");
               }

               return newCount;
          });
     };

     const handleCycleRestComplete = () => {
          setIsCycleResting(false);
          setIsTimerActive(true);
          setIsPaused(false);
          logger.log("Cycle rest completed, resuming timer for next set");
     };

     const handleDeleteConfirm = async () => {
          dismissNotification(); // [수정] 삭제 시 알림 제거
          if (backgroundMusic) {
               await backgroundMusic.stopAsync();
               await backgroundMusic.unloadAsync();
               logger.log("Background music stopped and unloaded on delete");
          }
          onDelete(workout.id);
          setIsDeleteModalVisible(false);
     };

     // ... (나머지 코드, JSX 렌더링 부분 등은 기존과 동일합니다)
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
                                   <Pressable
                                        onPress={() => {
                                             logger.log("Editing workout:", workout);
                                             onEdit(workout);
                                        }}
                                        style={styles.actionButton}
                                   >
                                        <MaterialCommunityIcons name="pencil" size={24} color="#ffffff" />
                                   </Pressable>
                                   <Pressable onPress={() => setIsDeleteModalVisible(true)} style={styles.actionButton}>
                                        <MaterialCommunityIcons name="delete" size={24} color="#ffffff" />
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
                              isLastRepetition={workout.repeatCount !== 0 && repeatCount === workout.repeatCount - 1} // 마지막 횟수 여부
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

               <Modal visible={isMusicInfoModalVisible} transparent={true} animationType="none">
                    <View style={styles.modalOverlay}>
                         <Animated.View style={[styles.musicInfoModal, { transform: [{ scale: modalScale }] }]}>
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
          alignItems: "center",
     },
     actionButton: {
          marginLeft: 16,
          padding: 8,
     },
     statusIcon: {
          marginLeft: 16,
     },
     footer: {
          marginTop: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
     },
     repeatText: {
          fontSize: 18,
          color: "#ffffff",
          fontWeight: "500",
     },
     setText: {
          fontSize: 18,
          color: "#ffffff",
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
          fontWeight: "600",
          color: "#FFFFFF",
     },
     musicPickerContainer: {
          flexDirection: "row",
          alignItems: "center",
          marginTop: 8,
     },
     musicPicker: {
          flex: 1,
          color: "#FFFFFF",
          borderRadius: 8,
          padding: 4,
     },
     infoButton: {
          padding: 8,
          marginLeft: 8,
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
     musicInfoModal: {
          backgroundColor: "#2C2C2C",
          borderRadius: 16,
          padding: 20,
          width: "90%",
          maxWidth: 400,
          maxHeight: "80%",
     },
     modalTitle: {
          fontSize: 20,
          fontWeight: "bold",
          color: "#FFFFFF",
          marginBottom: 12,
          textAlign: "center",
     },
     modalMessage: {
          fontSize: 16,
          color: "#BBBBBB",
          textAlign: "center",
          marginBottom: 20,
     },
     musicInfoContent: {
          marginBottom: 20,
     },
     musicInfoItem: {
          marginBottom: 16,
     },
     musicInfoTitle: {
          fontSize: 16,
          fontWeight: "600",
          color: "#FFFFFF",
          marginBottom: 4,
     },
     musicInfoText: {
          fontSize: 14,
          color: "#BBBBBB",
          marginBottom: 2,
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
     closeButton: {
          backgroundColor: "#555",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
     },
     buttonText: {
          fontSize: 16,
          color: "#FFFFFF",
          fontWeight: "600",
     },
});
