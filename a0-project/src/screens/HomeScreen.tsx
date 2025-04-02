import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, StyleSheet, FlatList, Text, Pressable, Modal, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkoutCard from "../components/WorkoutCard";
import AddWorkoutButton from "../components/AddWorkoutButton";
import AddWorkoutModal from "../components/AddWorkoutModal";
import { Workout } from "../types/workout";
import { WorkoutHistory } from "../types/history";
import { StackNavigationProp } from "@react-navigation/stack";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger";

type RootStackParamList = {
     Home: undefined;
     History: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

interface Props {
     navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
     const [workouts, setWorkouts] = useState<Workout[]>([]);
     const [isModalVisible, setIsModalVisible] = useState(false);
     const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
     const [isStatsModalVisible, setIsStatsModalVisible] = useState(false);
     const [modalScale] = useState(new Animated.Value(0));
     const [historyStats, setHistoryStats] = useState<{
          pushup: { totalReps: number; totalTime: number };
          squat: { totalReps: number; totalTime: number };
          situp: { totalReps: number; totalTime: number };
          pullup: { totalReps: number; totalTime: number };
          others: { totalReps: number; totalTime: number };
     }>({
          pushup: { totalReps: 0, totalTime: 0 },
          squat: { totalReps: 0, totalTime: 0 },
          situp: { totalReps: 0, totalTime: 0 },
          pullup: { totalReps: 0, totalTime: 0 },
          others: { totalReps: 0, totalTime: 0 },
     });

     useEffect(() => {
          loadWorkouts();
          loadHistoryStats();
     }, []);

     useEffect(() => {
          if (isStatsModalVisible) {
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
     }, [isStatsModalVisible]);

     const loadWorkouts = async () => {
          try {
               const savedWorkouts = await AsyncStorage.getItem("workouts");
               if (savedWorkouts) {
                    setWorkouts(JSON.parse(savedWorkouts));
               }
          } catch (error) {
               logger.error("Error loading workouts:", error);
          }
     };

     const loadHistoryStats = async () => {
          try {
               const savedHistory = await AsyncStorage.getItem("workoutHistory");
               if (savedHistory) {
                    const history: WorkoutHistory[] = JSON.parse(savedHistory);
                    const stats = {
                         pushup: { totalReps: 0, totalTime: 0 },
                         squat: { totalReps: 0, totalTime: 0 },
                         situp: { totalReps: 0, totalTime: 0 },
                         pullup: { totalReps: 0, totalTime: 0 },
                         others: { totalReps: 0, totalTime: 0 },
                    };

                    history.forEach((entry) => {
                         const workoutName = entry.workoutName;
                         const reps = entry.totalRepetitions || 0;
                         const startTime = new Date(entry.startTime).getTime();
                         const endTime = new Date(entry.endTime).getTime();
                         const timeDiff = Math.floor((endTime - startTime) / 1000);

                         if (workoutName === "푸쉬업") {
                              stats.pushup.totalReps += reps;
                              stats.pushup.totalTime += timeDiff;
                         } else if (workoutName === "스쿼트") {
                              stats.squat.totalReps += reps;
                              stats.squat.totalTime += timeDiff;
                         } else if (workoutName === "윗몸일으키기") {
                              stats.situp.totalReps += reps;
                              stats.situp.totalTime += timeDiff;
                         } else if (workoutName === "풀업") {
                              stats.pullup.totalReps += reps;
                              stats.pullup.totalTime += timeDiff;
                         } else {
                              stats.others.totalReps += reps;
                              stats.others.totalTime += timeDiff;
                         }
                    });

                    setHistoryStats(stats);
               }
          } catch (error) {
               logger.error("Error loading workout history stats:", error);
          }
     };

     const resetStats = async () => {
          try {
               await AsyncStorage.removeItem("workoutHistory");
               setHistoryStats({
                    pushup: { totalReps: 0, totalTime: 0 },
                    squat: { totalReps: 0, totalTime: 0 },
                    situp: { totalReps: 0, totalTime: 0 },
                    pullup: { totalReps: 0, totalTime: 0 },
                    others: { totalReps: 0, totalTime: 0 },
               });
               setIsStatsModalVisible(false);
               logger.log("Workout history stats reset");
          } catch (error) {
               logger.error("Error resetting workout history stats:", error);
          }
     };

     const saveWorkouts = async (newWorkouts: Workout[]) => {
          try {
               await AsyncStorage.setItem("workouts", JSON.stringify(newWorkouts));
          } catch (error) {
               logger.error("Error saving workouts:", error);
          }
     };

     const handleAddWorkout = async (workout: Workout) => {
          const newWorkout = { ...workout, id: uuidv4() };
          const newWorkouts = [newWorkout, ...workouts];
          setWorkouts(newWorkouts);
          await saveWorkouts(newWorkouts);
          setIsModalVisible(false);
     };

     const handleDeleteWorkout = (id: string) => {
          const newWorkouts = workouts.filter((workout) => workout.id !== id);
          setWorkouts(newWorkouts);
          saveWorkouts(newWorkouts);
     };

     const handleEditWorkout = (updatedWorkout: Workout) => {
          const newWorkouts = workouts.map((workout) => (workout.id === updatedWorkout.id ? updatedWorkout : workout));
          setWorkouts(newWorkouts);
          saveWorkouts(newWorkouts);
          setIsModalVisible(false);
          setEditingWorkout(null);
     };

     const openEditModal = (workout: Workout) => {
          setEditingWorkout(workout);
          setIsModalVisible(true);
     };

     const closeModal = () => {
          setIsModalVisible(false);
          setEditingWorkout(null);
     };

     const goToHistory = () => {
          navigation.navigate("History");
     };

     const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins}분 ${secs}초`;
     };

     return (
          <SafeAreaView style={styles.container}>
               <View style={styles.header}>
                    <View style={styles.headerContent}>
                         <Text style={styles.headerTitle}>운동 루틴</Text>
                         <View style={styles.headerButtons}>
                              <Pressable onPress={() => setIsStatsModalVisible(true)} style={styles.statsButton}>
                                   <Text style={styles.statsButtonText}>통계</Text>
                              </Pressable>
                              <Pressable onPress={goToHistory} style={styles.historyButton}>
                                   <Text style={styles.historyButtonText}>기록</Text>
                              </Pressable>
                         </View>
                    </View>
                    <Text style={styles.headerSubtitle}>오늘도 열심히 운동해봐요! 💪</Text>
               </View>

               {workouts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                         <Text style={styles.emptyText}>운동 루틴을 추가해보세요!</Text>
                         <Text style={styles.emptySubtext}>아래 + 버튼을 눌러 시작하세요</Text>
                    </View>
               ) : (
                    <FlatList
                         data={workouts}
                         renderItem={({ item }) => (
                              <WorkoutCard
                                   workout={item}
                                   onDelete={handleDeleteWorkout}
                                   onEdit={openEditModal}
                                   onHistoryUpdate={loadHistoryStats}
                              />
                         )}
                         keyExtractor={(item) => item.id}
                         contentContainerStyle={styles.listContent}
                    />
               )}

               <AddWorkoutButton onPress={() => setIsModalVisible(true)} />
               <AddWorkoutModal
                    visible={isModalVisible}
                    onClose={closeModal}
                    onAdd={editingWorkout ? handleEditWorkout : handleAddWorkout}
                    workoutToEdit={editingWorkout}
               />
               <Modal visible={isStatsModalVisible} transparent={true} animationType="none">
                    <View style={styles.modalOverlay}>
                         <Animated.View style={[styles.statsModal, { transform: [{ scale: modalScale }] }]}>
                              <Text style={styles.modalTitle}>운동 통계</Text>
                              <View style={styles.statsContainer}>
                                   <Text style={styles.statsText}>
                                        푸쉬업: {historyStats.pushup.totalReps}회,{" "}
                                        {formatTime(historyStats.pushup.totalTime)}
                                   </Text>
                                   <Text style={styles.statsText}>
                                        스쿼트: {historyStats.squat.totalReps}회,{" "}
                                        {formatTime(historyStats.squat.totalTime)}
                                   </Text>
                                   <Text style={styles.statsText}>
                                        윗몸: {historyStats.situp.totalReps}회,{" "}
                                        {formatTime(historyStats.situp.totalTime)}
                                   </Text>
                                   <Text style={styles.statsText}>
                                        풀업: {historyStats.pullup.totalReps}회,{" "}
                                        {formatTime(historyStats.pullup.totalTime)}
                                   </Text>
                                   <Text style={styles.statsText}>
                                        그 외: {historyStats.others.totalReps}회,{" "}
                                        {formatTime(historyStats.others.totalTime)}
                                   </Text>
                              </View>
                              <View style={styles.modalButtons}>
                                   <Pressable style={styles.resetButton} onPress={resetStats}>
                                        <Text style={styles.buttonText}>초기화</Text>
                                   </Pressable>
                                   <Pressable style={styles.closeButton} onPress={() => setIsStatsModalVisible(false)}>
                                        <Text style={styles.buttonText}>닫기</Text>
                                   </Pressable>
                              </View>
                         </Animated.View>
                    </View>
               </Modal>
          </SafeAreaView>
     );
}

const styles = StyleSheet.create({
     header: {
          padding: 12,
          paddingTop: 16,
     },
     headerContent: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
     },
     headerButtons: {
          flexDirection: "row",
     },
     headerTitle: {
          fontSize: 24,
          fontWeight: "bold",
          color: "#FFFFFF",
          marginBottom: 4,
     },
     statsButton: {
          padding: 15,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: 20,
          marginRight: 8,
     },
     statsButtonText: {
          color: "#FFFFFF",
          fontSize: 16,
          fontWeight: "600",
     },
     historyButton: {
          padding: 15,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: 20,
     },
     historyButtonText: {
          color: "#FFFFFF",
          fontSize: 16,
          fontWeight: "600",
     },
     headerSubtitle: {
          fontSize: 16,
          color: "#BBBBBB",
          marginBottom: 16,
     },
     statsContainer: {
          marginTop: 8,
          marginBottom: 16,
     },
     statsText: {
          fontSize: 14,
          color: "#BBBBBB",
          marginBottom: 4,
     },
     container: {
          flex: 1,
          backgroundColor: "#121212",
     },
     listContent: {
          padding: 16,
          paddingBottom: 100,
     },
     emptyContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 100,
     },
     emptyText: {
          fontSize: 20,
          color: "#FFFFFF",
          marginBottom: 8,
     },
     emptySubtext: {
          fontSize: 16,
          color: "#666666",
     },
     modalOverlay: {
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          justifyContent: "center",
          alignItems: "center",
     },
     statsModal: {
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
     modalButtons: {
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
     },
     resetButton: {
          flex: 1,
          backgroundColor: "#FF4444",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
          marginRight: 8,
     },
     closeButton: {
          flex: 1,
          backgroundColor: "#555",
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
