import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WorkoutHistory } from "../types/history";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { v4 as uuidv4 } from "uuid";

interface HistoryItemProps {
     item: WorkoutHistory;
     index: number;
     onDelete: (id: string, workoutName: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onDelete }) => {
     return (
          <View style={styles.historyCard}>
               <View style={styles.cardContent}>
                    <Text style={styles.workoutName}>{item.workoutName}</Text>
                    <Text style={styles.historyDetails}>시작: {formatDateTime(item.startTime)}</Text>
                    <Text style={styles.historyDetails}>종료: {formatDateTime(item.endTime)}</Text>
                    <Text style={styles.repetitions}>반복 횟수: {item.totalRepetitions}</Text>
                    <View style={[styles.status, { backgroundColor: item.completed ? "#4CAF50" : "#FF5252" }]}>
                         <Text style={styles.statusText}>{item.completed ? "완료" : "중단"}</Text>
                    </View>
               </View>
               <Pressable onPress={() => onDelete(item.id, item.workoutName)} style={styles.deleteButton}>
                    <MaterialIcons name="delete" size={24} color="#FF5252" />
               </Pressable>
          </View>
     );
};

const formatDateTime = (dateString: string) => {
     const date = new Date(dateString);
     return `${date.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
     })} ${date.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
     })}`;
};

export default function HistoryScreen() {
     const [history, setHistory] = useState<WorkoutHistory[]>([]);
     const navigation = useNavigation();

     useEffect(() => {
          loadHistory();
     }, []);

     const loadHistory = async () => {
          try {
               const historyData = await AsyncStorage.getItem("workoutHistory");
               if (historyData) {
                    let parsedHistory = JSON.parse(historyData);
                    const ids = parsedHistory.map((item: WorkoutHistory) => item.id);
                    const uniqueIds = new Set(ids);
                    if (ids.length !== uniqueIds.size) {
                         console.warn("중복된 ID가 존재합니다. UUID로 고유한 ID를 생성합니다:", ids);
                         parsedHistory = parsedHistory.map((item: WorkoutHistory) => ({
                              ...item,
                              id: ids.indexOf(item.id) === ids.lastIndexOf(item.id) ? item.id : uuidv4(),
                         }));
                         await AsyncStorage.setItem("workoutHistory", JSON.stringify(parsedHistory));
                    }
                    const sortedHistory = parsedHistory.sort(
                         (a: WorkoutHistory, b: WorkoutHistory) =>
                              new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                    );
                    setHistory(sortedHistory);
               }
          } catch (error) {
               console.error("Error loading history:", error);
               Alert.alert("오류", "운동 기록을 불러오는 중 오류가 발생했습니다.");
          }
     };

     const deleteHistoryItem = async (id: string) => {
          try {
               const historyData = await AsyncStorage.getItem("workoutHistory");
               if (historyData) {
                    const parsedHistory: WorkoutHistory[] = JSON.parse(historyData);
                    const updatedHistory = parsedHistory.filter((item) => item.id !== id);
                    await AsyncStorage.setItem("workoutHistory", JSON.stringify(updatedHistory));
                    setHistory(updatedHistory);
               } else {
                    console.warn("workoutHistory 데이터가 존재하지 않습니다.");
                    Alert.alert("알림", "삭제할 운동 기록이 없습니다.");
               }
          } catch (error) {
               console.error("Error deleting history item:", error);
               Alert.alert("오류", "기록 삭제 중 오류가 발생했습니다. 다시 시도해 주세요.");
          }
     };

     const deleteAllHistory = async () => {
          try {
               const historyData = await AsyncStorage.getItem("workoutHistory");
               if (historyData) {
                    await AsyncStorage.removeItem("workoutHistory");
                    setHistory([]);
               } else {
                    console.warn("workoutHistory 데이터가 존재하지 않습니다.");
                    Alert.alert("알림", "삭제할 운동 기록이 없습니다.");
               }
          } catch (error) {
               console.error("Error deleting all history:", error);
               Alert.alert("오류", "전체 기록 삭제 중 오류가 발생했습니다. 다시 시도해 주세요.");
          }
     };

     const handleDelete = (id: string, workoutName: string) => {
          Alert.alert(
               "기록 삭제",
               `"${workoutName}" 기록을 삭제하시겠습니까?`,
               [
                    { text: "취소", style: "cancel" },
                    {
                         text: "삭제",
                         style: "destructive",
                         onPress: () => {
                              deleteHistoryItem(id);
                         },
                    },
               ],
               { cancelable: true }
          );
     };

     const handleDeleteAll = () => {
          if (history.length === 0) {
               Alert.alert("알림", "삭제할 기록이 없습니다.");
               return;
          }
          Alert.alert(
               "전체 기록 삭제",
               "모든 운동 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
               [
                    { text: "취소", style: "cancel" },
                    {
                         text: "삭제",
                         style: "destructive",
                         onPress: () => {
                              deleteAllHistory();
                         },
                    },
               ],
               { cancelable: true }
          );
     };

     return (
          <SafeAreaView style={styles.container}>
               <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                         <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                    </Pressable>
                    <Text style={styles.headerTitle}>운동 기록</Text>
                    <Pressable
                         onPress={handleDeleteAll}
                         style={[styles.deleteAllButton, history.length === 0 && styles.disabledButton]}
                         disabled={history.length === 0}
                    >
                         <MaterialIcons
                              name="delete-sweep"
                              size={24}
                              color={history.length === 0 ? "#666" : "#FF5252"}
                         />
                         <Text style={[styles.deleteAllText, history.length === 0 && styles.disabledText]}>
                              전체 삭제
                         </Text>
                    </Pressable>
               </View>
               <FlatList
                    data={history}
                    renderItem={({ item, index }) => <HistoryItem item={item} index={index} onDelete={handleDelete} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                         <View style={styles.emptyContainer}>
                              <Text style={styles.emptyText}>아직 운동 기록이 없습니다</Text>
                         </View>
                    }
               />
          </SafeAreaView>
     );
}

const styles = StyleSheet.create({
     container: {
          flex: 1,
          backgroundColor: "#121212",
     },
     header: {
          padding: 16,
          paddingTop: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
     },
     backButton: {
          padding: 8,
          marginRight: 8,
     },
     deleteAllButton: {
          flexDirection: "row",
          alignItems: "center",
          padding: 8,
          marginLeft: 8,
     },
     deleteAllText: {
          color: "#FF5252",
          fontSize: 16,
          fontWeight: "600",
          marginLeft: 4,
     },
     disabledButton: {
          opacity: 0.5,
     },
     disabledText: {
          color: "#666",
     },
     headerTitle: {
          fontSize: 32,
          fontWeight: "bold",
          color: "#FFFFFF",
          marginBottom: 8,
     },
     historyCard: {
          flexDirection: "row",
          backgroundColor: "#1E1E1E",
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#333",
          alignItems: "center",
     },
     cardContent: {
          flex: 1,
     },
     workoutName: {
          fontSize: 18,
          fontWeight: "bold",
          color: "#FFFFFF",
          marginBottom: 8,
     },
     historyDetails: {
          fontSize: 14,
          color: "#BBBBBB",
          marginBottom: 4,
     },
     repetitions: {
          fontSize: 14,
          color: "#BBBBBB",
          marginBottom: 8,
     },
     status: {
          alignSelf: "flex-start",
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 12,
     },
     statusText: {
          color: "#FFFFFF",
          fontSize: 12,
          fontWeight: "bold",
     },
     deleteButton: {
          padding: 8,
          marginLeft: 8,
     },
     listContent: {
          padding: 16,
          paddingBottom: 80,
     },
     emptyContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 100,
     },
     emptyText: {
          color: "#666666",
          fontSize: 16,
     },
});
