import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
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

     useEffect(() => {
          loadWorkouts();
     }, []);

     const loadWorkouts = async () => {
          try {
               const storedWorkouts = await AsyncStorage.getItem("workouts");
               if (storedWorkouts) {
                    setWorkouts(JSON.parse(storedWorkouts));
               }
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
               setWorkoutToEdit(null);
          } else {
               const workoutWithId = { ...newWorkout, id: uuidv4() };
               const updatedWorkouts = [workoutWithId, ...workouts]; // 배열의 시작에 추가
               saveWorkouts(updatedWorkouts);
          }
          setIsAddModalVisible(false);
     };

     const handleDeleteWorkout = (id: string) => {
          const updatedWorkouts = workouts.filter((w) => w.id !== id);
          saveWorkouts(updatedWorkouts);
     };

     const handleEditWorkout = (workout: Workout) => {
          setWorkoutToEdit(workout);
          setIsAddModalVisible(true);
     };

     const handleHistoryUpdate = () => {
          // 통계 데이터 갱신을 위해 필요 시 로직 추가
     };

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
                    {workouts.length === 0 ? (
                         <View
                              style={{
                                   display: "flex",
                                   justifyContent: "center",
                                   alignItems: "center",
                                   marginTop: 40,
                              }}
                         >
                              <Text style={styles.emptyText}> + 버튼을 눌러 </Text>
                              <Text style={styles.emptyText}> 운동 루틴을 추가해보세요!</Text>
                         </View>
                    ) : (
                         workouts.map((workout) => (
                              <WorkoutCard
                                   key={workout.id}
                                   workout={workout}
                                   onDelete={handleDeleteWorkout}
                                   onEdit={handleEditWorkout}
                                   onHistoryUpdate={handleHistoryUpdate}
                              />
                         ))
                    )}
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
          </View>
     );
}

const styles = StyleSheet.create({
     container: {
          flex: 1,
          backgroundColor: "#1C1C1C",
          paddingTop: 10,
     },
     header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingBottom: 16,
     },
     title: {
          fontSize: 28,
          fontWeight: "bold",
          color: "#fcfcfc",
     },
     headerActions: {
          flexDirection: "row",
     },
     historyButton: {
          padding: 8,
          marginRight: 8,
     },
     statsButton: {
          padding: 8,
          marginRight: 8,
     },
     addButton: {
          padding: 8,
     },
     scrollContainer: {
          paddingHorizontal: 20,
          paddingBottom: 20,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
     },
     emptyText: {
          fontSize: 18,
          color: "#BBBBBB",
          textAlign: "center",
     },
});
