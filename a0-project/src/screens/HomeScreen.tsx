import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { Workout } from "../types/workout";
import WorkoutCard from "../components/WorkoutCard";
import AddWorkoutModal from "../components/AddWorkoutModal";
import StatisticsModal from "../components/StatisticsModal";
import logger from "../utils/logger";
import { v4 as uuidv4 } from "uuid";
import { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
     Home: undefined;
     History: undefined;
     Settings: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

interface HomeScreenProps {
     navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
     const [workouts, setWorkouts] = useState<Workout[]>([]);
     const [isAddModalVisible, setIsAddModalVisible] = useState(false);
     const [isStatsModalVisible, setIsStatsModalVisible] = useState(false);
     const [workoutToEdit, setWorkoutToEdit] = useState<Workout | null>(null);

     const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
     const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);

     const [isResetModalVisible, setIsResetModalVisible] = useState(false);
     const workoutToResetRef = useRef<(() => void) | null>(null);

     const [deleteModalScale] = useState(new Animated.Value(0));
     const [resetModalScale] = useState(new Animated.Value(0));

     useEffect(() => {
          loadWorkouts();
     }, []);

     useEffect(() => {
          if (isDeleteModalVisible) {
               Animated.spring(deleteModalScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
               }).start();
          } else {
               Animated.timing(deleteModalScale, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          }
     }, [isDeleteModalVisible]);

     useEffect(() => {
          if (isResetModalVisible) {
               Animated.spring(resetModalScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
               }).start();
          } else {
               Animated.timing(resetModalScale, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          }
     }, [isResetModalVisible]);

     const loadWorkouts = async () => {
          try {
               const storedWorkouts = await AsyncStorage.getItem("workouts");
               if (storedWorkouts) setWorkouts(JSON.parse(storedWorkouts));
          } catch (error) {
               logger.error("Error loading workouts:", error);
          }
     };

     const saveWorkouts = async (updatedWorkouts: Workout[]) => {
          try {
               await AsyncStorage.setItem("workouts", JSON.stringify(updatedWorkouts));
               setWorkouts(updatedWorkouts);
          } catch (error) {
               logger.error("Error saving workouts:", error);
          }
     };

     const handleAddWorkout = (newWorkout: Workout) => {
          if (workoutToEdit) {
               const updatedWorkouts = workouts.map((w) => (w.id === newWorkout.id ? newWorkout : w));
               saveWorkouts(updatedWorkouts);
          } else {
               const workoutWithId = { ...newWorkout, id: uuidv4() };
               saveWorkouts([workoutWithId, ...workouts]);
          }
          setIsAddModalVisible(false);
          setWorkoutToEdit(null);
     };

     const handleDeleteRequest = (workout: Workout) => {
          setWorkoutToDelete(workout);
          setIsDeleteModalVisible(true);
     };

     const handleDeleteConfirm = () => {
          if (workoutToDelete) {
               const updatedWorkouts = workouts.filter((w) => w.id !== workoutToDelete.id);
               saveWorkouts(updatedWorkouts);
          }
          setIsDeleteModalVisible(false);
          setWorkoutToDelete(null);
     };

     const handleResetRequest = (resetFunction: () => void) => {
          workoutToResetRef.current = resetFunction;
          setIsResetModalVisible(true);
     };

     const handleResetConfirm = () => {
          if (workoutToResetRef.current) {
               workoutToResetRef.current();
          }
          setIsResetModalVisible(false);
          workoutToResetRef.current = null;
     };

     const handleEditWorkout = (workout: Workout) => {
          setWorkoutToEdit(workout);
          setIsAddModalVisible(true);
     };

     const handleHistoryUpdate = () => {};

     return (
          <View style={styles.container}>
               <View style={styles.header}>
                    <Text style={styles.title}>운동 루틴 🔥</Text>
                    <View style={styles.headerActions}>
                         <Pressable style={styles.historyButton} onPress={() => navigation.navigate("History")}>
                              <MaterialIcons name="history" size={28} color="lightgray" />
                         </Pressable>
                         <Pressable style={styles.statsButton} onPress={() => setIsStatsModalVisible(true)}>
                              <MaterialIcons name="bar-chart" size={28} color="lightgray" />
                         </Pressable>
                         <Pressable
                              style={styles.addButton}
                              onPress={() => {
                                   setWorkoutToEdit(null);
                                   setIsAddModalVisible(true);
                              }}
                         >
                              <MaterialIcons name="add" size={28} color="lightgray" />
                         </Pressable>
                    </View>
               </View>
               <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {workouts.map((workout) => (
                         <WorkoutCard
                              key={workout.id}
                              workout={workout}
                              onDeleteRequest={() => handleDeleteRequest(workout)}
                              onEdit={() => handleEditWorkout(workout)}
                              onHistoryUpdate={handleHistoryUpdate}
                              onResetRequest={(resetFunc) => handleResetRequest(resetFunc)}
                         />
                    ))}
                    <View style={styles.emptyContainer}>
                         <Pressable
                              style={styles.largeAddButton}
                              onPress={() => {
                                   setWorkoutToEdit(null);
                                   setIsAddModalVisible(true);
                              }}
                         >
                              <MaterialIcons name="add" size={48} color="lightgray" />
                         </Pressable>
                         <Text style={styles.emptyText}> 상단 '+' 버튼을 눌러</Text>
                         <Text style={styles.emptyText}> 운동 루틴을 추가해보세요!</Text>
                    </View>
               </ScrollView>

               <AddWorkoutModal
                    visible={isAddModalVisible}
                    onClose={() => {
                         setIsAddModalVisible(false);
                         setWorkoutToEdit(null);
                    }}
                    onAdd={handleAddWorkout}
                    workoutToEdit={workoutToEdit}
               />

               <StatisticsModal visible={isStatsModalVisible} onClose={() => setIsStatsModalVisible(false)} />

               <Modal visible={isDeleteModalVisible} transparent={true} animationType="none">
                    <View style={modalStyles.modalOverlay}>
                         <Animated.View style={[modalStyles.modal, { transform: [{ scale: deleteModalScale }] }]}>
                              <Text style={modalStyles.modalTitle}>운동 삭제</Text>
                              <Text style={modalStyles.modalMessage}>
                                   '{workoutToDelete?.name}' 운동을 삭제하시겠습니까?
                              </Text>
                              <View style={modalStyles.modalButtons}>
                                   <Pressable
                                        style={modalStyles.cancelButton}
                                        onPress={() => setIsDeleteModalVisible(false)}
                                   >
                                        <Text style={modalStyles.buttonText}>취소</Text>
                                   </Pressable>
                                   <Pressable style={modalStyles.confirmButton} onPress={handleDeleteConfirm}>
                                        <Text style={modalStyles.buttonText}>확인</Text>
                                   </Pressable>
                              </View>
                         </Animated.View>
                    </View>
               </Modal>

               <Modal visible={isResetModalVisible} transparent={true} animationType="none">
                    <View style={modalStyles.modalOverlay}>
                         <Animated.View style={[modalStyles.modal, { transform: [{ scale: resetModalScale }] }]}>
                              <Text style={modalStyles.modalTitle}>처음으로</Text>
                              <Text style={modalStyles.modalMessage}>진행 상황이 초기화됩니다.</Text>
                              <View style={modalStyles.modalButtons}>
                                   <Pressable
                                        style={modalStyles.cancelButton}
                                        onPress={() => setIsResetModalVisible(false)}
                                   >
                                        <Text style={modalStyles.buttonText}>취소</Text>
                                   </Pressable>
                                   <Pressable style={modalStyles.confirmButton} onPress={handleResetConfirm}>
                                        <Text style={modalStyles.buttonText}>확인</Text>
                                   </Pressable>
                              </View>
                         </Animated.View>
                    </View>
               </Modal>
          </View>
     );
}

const styles = StyleSheet.create({
     container: { flex: 1, backgroundColor: "#1C1C1C", paddingTop: 10 },
     header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingBottom: 16,
     },
     title: { fontSize: 28, fontWeight: "bold", color: "#fcfcfc" },
     headerActions: { flexDirection: "row" },
     historyButton: { padding: 8, marginRight: 8 },
     statsButton: { padding: 8, marginRight: 8 },
     addButton: { padding: 8 },
     scrollContainer: {
          paddingHorizontal: 20,
          paddingBottom: 20,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
     },
     emptyContainer: { display: "flex", justifyContent: "center", alignItems: "center", marginTop: 40 },
     largeAddButton: {
          width: 110,
          height: 65,
          backgroundColor: "#1c1c1c",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 5,
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
     },
     emptyText: { fontSize: 18, color: "#ffffff", textAlign: "center" },
});

const modalStyles = StyleSheet.create({
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
     buttonText: { fontSize: 16, color: "#FFFFFF", fontWeight: "600" },
});
