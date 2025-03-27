import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, StyleSheet, FlatList, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkoutCard from "../components/WorkoutCard";
import AddWorkoutButton from "../components/AddWorkoutButton";
import AddWorkoutModal from "../components/AddWorkoutModal";
import { Workout } from "../types/workout";
import { StackNavigationProp } from "@react-navigation/stack";

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

     useEffect(() => {
          loadWorkouts();
     }, []);

     const loadWorkouts = async () => {
          try {
               const savedWorkouts = await AsyncStorage.getItem("workouts");
               if (savedWorkouts) {
                    setWorkouts(JSON.parse(savedWorkouts));
               }
          } catch (error) {
               console.error("Error loading workouts:", error);
          }
     };

     const saveWorkouts = async (newWorkouts: Workout[]) => {
          try {
               await AsyncStorage.setItem("workouts", JSON.stringify(newWorkouts));
          } catch (error) {
               console.error("Error saving workouts:", error);
          }
     };

     const handleAddWorkout = async (workout: Workout) => {
          const newWorkouts = [...workouts, { ...workout, id: Date.now().toString() }];
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

     return (
          <SafeAreaView style={styles.container}>
               <View style={styles.header}>
                    <View style={styles.headerContent}>
                         <Text style={styles.headerTitle}>운동 루틴</Text>
                         <Pressable onPress={goToHistory} style={styles.historyButton}>
                              <Text style={styles.historyButtonText}>History</Text>
                         </Pressable>
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
                              <WorkoutCard workout={item} onDelete={handleDeleteWorkout} onEdit={openEditModal} />
                         )}
                         keyExtractor={(item) => item.id}
                         contentContainerStyle={styles.listContent}
                    />
               )}

               <AddWorkoutButton onPress={() => setIsModalVisible(true)} />
               <AddWorkoutModal
                    visible={isModalVisible}
                    onClose={closeModal}
                    onSubmit={editingWorkout ? handleEditWorkout : handleAddWorkout}
                    initialWorkout={editingWorkout}
               />
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
     headerTitle: {
          fontSize: 24,
          fontWeight: "bold",
          color: "#FFFFFF",
          marginBottom: 4,
     },
     historyButton: {
          padding: 8,
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
});
