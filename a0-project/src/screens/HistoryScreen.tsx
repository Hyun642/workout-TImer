import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WorkoutHistory } from "../types/history";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger";

interface HistoryItemProps {
     item: WorkoutHistory;
     onDelete: (id: string) => void;
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
               <Pressable onPress={() => onDelete(item.id)} style={styles.deleteButton}>
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

const formatDate = (dateString: string) => {
     const date = new Date(dateString);
     return date.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
     });
};

export default function HistoryScreen() {
     const [history, setHistory] = useState<WorkoutHistory[]>([]);
     const [groupedHistory, setGroupedHistory] = useState<{ [key: string]: WorkoutHistory[] }>({});
     const [expandedDates, setExpandedDates] = useState<string[]>([]);
     const [isDeleteItemModalVisible, setIsDeleteItemModalVisible] = useState(false);
     const [isDeleteAllModalVisible, setIsDeleteAllModalVisible] = useState(false);
     const [itemToDelete, setItemToDelete] = useState<string | null>(null);
     const [deleteItemModalScale] = useState(new Animated.Value(0));
     const [deleteAllModalScale] = useState(new Animated.Value(0));
     const navigation = useNavigation();

     useEffect(() => {
          loadHistory();
     }, []);

     useEffect(() => {
          if (isDeleteItemModalVisible) {
               Animated.spring(deleteItemModalScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
               }).start();
          } else {
               Animated.timing(deleteItemModalScale, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
               }).start();
          }
     }, [isDeleteItemModalVisible]);

     useEffect(() => {
          if (isDeleteAllModalVisible) {
               Animated.spring(deleteAllModalScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
               }).start();
          } else {
               Animated.timing(deleteAllModalScale, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
               }).start();
          }
     }, [isDeleteAllModalVisible]);

     const loadHistory = async () => {
          try {
               const historyData = await AsyncStorage.getItem("workoutHistory");
               if (historyData) {
                    let parsedHistory = JSON.parse(historyData);
                    const ids = parsedHistory.map((item: WorkoutHistory) => item.id);
                    const uniqueIds = new Set(ids);
                    if (ids.length !== uniqueIds.size) {
                         logger.warn("중복된 ID가 존재합니다. UUID로 고유한 ID를 생성합니다:", ids);
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
                    groupHistoryByDate(sortedHistory);
               }
          } catch (error) {
               logger.error("Error loading history:", error);
          }
     };

     const groupHistoryByDate = (history: WorkoutHistory[]) => {
          const grouped = history.reduce((acc, item) => {
               const date = formatDate(item.startTime);
               if (!acc[date]) {
                    acc[date] = [];
               }
               acc[date].push(item);
               return acc;
          }, {} as { [key: string]: WorkoutHistory[] });
          setGroupedHistory(grouped);
          setExpandedDates(Object.keys(grouped));
     };

     const toggleDate = (date: string) => {
          setExpandedDates((prev) => (prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]));
     };

     const deleteHistoryItem = async (id: string) => {
          try {
               const historyData = await AsyncStorage.getItem("workoutHistory");
               if (historyData) {
                    const parsedHistory: WorkoutHistory[] = JSON.parse(historyData);
                    const updatedHistory = parsedHistory.filter((item) => item.id !== id);
                    await AsyncStorage.setItem("workoutHistory", JSON.stringify(updatedHistory));
                    setHistory(updatedHistory);
                    groupHistoryByDate(updatedHistory);
                    setIsDeleteItemModalVisible(false);
               }
          } catch (error) {
               logger.error("Error deleting history item:", error);
          }
     };

     const deleteAllHistory = async () => {
          try {
               await AsyncStorage.removeItem("workoutHistory");
               setHistory([]);
               setGroupedHistory({});
               setIsDeleteAllModalVisible(false);
          } catch (error) {
               logger.error("Error deleting all history:", error);
          }
     };

     const handleDelete = (id: string) => {
          setItemToDelete(id);
          setIsDeleteItemModalVisible(true);
     };

     const handleDeleteAll = () => {
          if (history.length === 0) {
               return;
          }
          setIsDeleteAllModalVisible(true);
     };

     const handleDeleteItemConfirm = () => {
          if (itemToDelete) {
               deleteHistoryItem(itemToDelete);
               setItemToDelete(null);
          }
     };

     const handleDeleteItemCancel = () => {
          setIsDeleteItemModalVisible(false);
          setItemToDelete(null);
     };

     const handleDeleteAllConfirm = () => {
          deleteAllHistory();
     };

     const handleDeleteAllCancel = () => {
          setIsDeleteAllModalVisible(false);
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
               <ScrollView contentContainerStyle={styles.listContent}>
                    {Object.entries(groupedHistory).map(([date, items]) => (
                         <View key={date} style={styles.dateGroup}>
                              <Pressable onPress={() => toggleDate(date)} style={styles.dateHeader}>
                                   <Text style={styles.dateText}>{date}</Text>
                                   <MaterialIcons
                                        name={expandedDates.includes(date) ? "expand-less" : "expand-more"}
                                        size={24}
                                        color="#FFFFFF"
                                   />
                              </Pressable>
                              {expandedDates.includes(date) && (
                                   <View style={styles.itemsContainer}>
                                        {items.map((item) => (
                                             <HistoryItem key={item.id} item={item} onDelete={handleDelete} />
                                        ))}
                                   </View>
                              )}
                         </View>
                    ))}
                    {history.length === 0 && (
                         <View style={styles.emptyContainer}>
                              <Text style={styles.emptyText}>아직 운동 기록이 없습니다</Text>
                         </View>
                    )}
               </ScrollView>

               <Modal visible={isDeleteItemModalVisible} transparent={true} animationType="none">
                    <View style={styles.modalOverlay}>
                         <Animated.View style={[styles.deleteModal, { transform: [{ scale: deleteItemModalScale }] }]}>
                              <Text style={styles.modalTitle}>기록 삭제</Text>
                              <Text style={styles.modalMessage}>
                                   '{history.find((h) => h.id === itemToDelete)?.workoutName || "이 기록"}' 기록을
                                   삭제하시겠습니까?
                              </Text>
                              <View style={styles.modalButtons}>
                                   <Pressable style={styles.cancelButton} onPress={handleDeleteItemCancel}>
                                        <Text style={styles.buttonText}>취소</Text>
                                   </Pressable>
                                   <Pressable style={styles.confirmButton} onPress={handleDeleteItemConfirm}>
                                        <Text style={styles.buttonText}>확인</Text>
                                   </Pressable>
                              </View>
                         </Animated.View>
                    </View>
               </Modal>

               <Modal visible={isDeleteAllModalVisible} transparent={true} animationType="none">
                    <View style={styles.modalOverlay}>
                         <Animated.View style={[styles.deleteModal, { transform: [{ scale: deleteAllModalScale }] }]}>
                              <Text style={styles.modalTitle}>전체 기록 삭제</Text>
                              <Text style={styles.modalMessage}>
                                   모든 운동 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                              </Text>
                              <View style={styles.modalButtons}>
                                   <Pressable style={styles.cancelButton} onPress={handleDeleteAllCancel}>
                                        <Text style={styles.buttonText}>취소</Text>
                                   </Pressable>
                                   <Pressable style={styles.confirmButton} onPress={handleDeleteAllConfirm}>
                                        <Text style={styles.buttonText}>확인</Text>
                                   </Pressable>
                              </View>
                         </Animated.View>
                    </View>
               </Modal>
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
     dateGroup: {
          marginBottom: 16,
     },
     dateHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 16,
          backgroundColor: "#1E1E1E",
          borderRadius: 12,
     },
     dateText: {
          fontSize: 18,
          fontWeight: "bold",
          color: "#FFFFFF",
     },
     itemsContainer: {
          paddingTop: 8,
     },
     historyCard: {
          flexDirection: "row",
          backgroundColor: "#2C2C2C",
          borderRadius: 12,
          padding: 16,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: "#333",
          alignItems: "center",
     },
     cardContent: {
          flex: 1,
     },
     workoutName: {
          fontSize: 16,
          fontWeight: "bold",
          color: "#FFFFFF",
          marginBottom: 4,
     },
     historyDetails: {
          fontSize: 14,
          color: "#BBBBBB",
          marginBottom: 2,
     },
     repetitions: {
          fontSize: 14,
          color: "#BBBBBB",
          marginBottom: 4,
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
