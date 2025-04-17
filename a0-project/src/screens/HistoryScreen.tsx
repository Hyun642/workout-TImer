import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WorkoutHistory } from "../types/history";
import logger from "../utils/logger";
import { MaterialIcons } from "@expo/vector-icons";

export default function HistoryScreen() {
     const [history, setHistory] = useState<WorkoutHistory[]>([]);
     const [groupedHistory, setGroupedHistory] = useState<{ date: string; records: WorkoutHistory[] }[]>([]);
     const [expandedDates, setExpandedDates] = useState<{ [key: string]: boolean }>({});

     useEffect(() => {
          loadHistory();
     }, []);

     const loadHistory = async () => {
          try {
               const historyData = await AsyncStorage.getItem("workoutHistory");
               if (historyData) {
                    const parsedHistory: WorkoutHistory[] = JSON.parse(historyData);
                    setHistory(parsedHistory);
                    groupHistoryByDate(parsedHistory);
               }
          } catch (error) {
               logger.error("Error loading workout history:", error);
          }
     };

     const groupHistoryByDate = (history: WorkoutHistory[]) => {
          const grouped = history.reduce((acc, record) => {
               const date = new Date(record.startTime).toISOString().split("T")[0];
               if (!acc[date]) {
                    acc[date] = [];
               }
               acc[date].push(record);
               return acc;
          }, {} as { [key: string]: WorkoutHistory[] });

          const sortedGrouped = Object.keys(grouped)
               .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
               .map((date) => ({
                    date: new Date(date).toLocaleDateString("ko-KR", {
                         year: "numeric",
                         month: "long",
                         day: "numeric",
                    }),
                    records: grouped[date].sort(
                         (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                    ),
               }));

          setGroupedHistory(sortedGrouped);

          const initialExpandedState = sortedGrouped.reduce((acc, group) => {
               acc[group.date] = false;
               return acc;
          }, {} as { [key: string]: boolean });
          setExpandedDates(initialExpandedState);
     };

     const toggleDate = (date: string) => {
          setExpandedDates((prev) => ({
               ...prev,
               [date]: !prev[date],
          }));
     };

     // 기록별 삭제 기능
     const deleteRecord = async (recordId: string) => {
          Alert.alert("기록 삭제", "이 운동 기록을 삭제하시겠습니까?", [
               { text: "취소", style: "cancel" },
               {
                    text: "삭제",
                    style: "destructive",
                    onPress: async () => {
                         try {
                              const updatedHistory = history.filter((record) => record.id !== recordId);
                              await AsyncStorage.setItem("workoutHistory", JSON.stringify(updatedHistory));
                              setHistory(updatedHistory);
                              groupHistoryByDate(updatedHistory);
                         } catch (error) {
                              logger.error("Error deleting workout record:", error);
                         }
                    },
               },
          ]);
     };

     // 기록 전체 삭제 기능
     const deleteAllRecords = async () => {
          Alert.alert("전체 기록 삭제", "모든 운동 기록을 삭제하시겠습니까?", [
               { text: "취소", style: "cancel" },
               {
                    text: "삭제",
                    style: "destructive",
                    onPress: async () => {
                         try {
                              await AsyncStorage.removeItem("workoutHistory");
                              setHistory([]);
                              setGroupedHistory([]);
                              setExpandedDates({});
                         } catch (error) {
                              logger.error("Error deleting all workout records:", error);
                         }
                    },
               },
          ]);
     };

     return (
          <View style={styles.container}>
               {/* 전체 삭제 버튼 */}
               <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>운동 기록</Text>
                    {groupedHistory.length > 0 && (
                         <Pressable onPress={deleteAllRecords} style={styles.deleteAllButton}>
                              <MaterialIcons name="delete-forever" size={24} color="#FF5555" />
                              <Text style={styles.deleteAllText}>전체 삭제</Text>
                         </Pressable>
                    )}
               </View>

               <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {groupedHistory.length === 0 ? (
                         <Text style={styles.emptyText}>운동 기록이 없습니다.</Text>
                    ) : (
                         groupedHistory.map((group, index) => (
                              <View key={index} style={styles.dateSection}>
                                   <Pressable style={styles.dateHeaderContainer} onPress={() => toggleDate(group.date)}>
                                        <Text style={styles.dateHeader}>{group.date}</Text>
                                        <MaterialIcons
                                             name={expandedDates[group.date] ? "expand-less" : "expand-more"}
                                             size={24}
                                             color="#FFFFFF"
                                        />
                                   </Pressable>
                                   {expandedDates[group.date] && (
                                        <View style={styles.recordsContainer}>
                                             {group.records.map((record) => (
                                                  <View key={record.id} style={styles.historyItem}>
                                                       <View style={styles.historyContent}>
                                                            <View style={styles.historyText}>
                                                                 <Text style={styles.workoutName}>
                                                                      {record.workoutName}
                                                                 </Text>
                                                                 <Text style={styles.detailText}>
                                                                      시작:{" "}
                                                                      {new Date(record.startTime).toLocaleTimeString(
                                                                           "ko-KR"
                                                                      )}
                                                                 </Text>
                                                                 <Text style={styles.detailText}>
                                                                      종료:{" "}
                                                                      {new Date(record.endTime).toLocaleTimeString(
                                                                           "ko-KR"
                                                                      )}
                                                                 </Text>
                                                                 <Text style={styles.detailText}>
                                                                      누적 횟수: {record.totalRepetitions} 회
                                                                 </Text>
                                                                 <Text style={styles.detailText}>
                                                                      완료 여부: {record.completed ? "완료" : "미완료"}
                                                                 </Text>
                                                            </View>
                                                            <Pressable
                                                                 onPress={() => deleteRecord(record.id)}
                                                                 style={styles.deleteButton}
                                                            >
                                                                 <MaterialIcons
                                                                      name="delete"
                                                                      size={24}
                                                                      color="#FF5555"
                                                                 />
                                                            </Pressable>
                                                       </View>
                                                  </View>
                                             ))}
                                        </View>
                                   )}
                              </View>
                         ))
                    )}
               </ScrollView>
          </View>
     );
}

const styles = StyleSheet.create({
     container: {
          flex: 1,
          backgroundColor: "#1C1C1C",
          paddingTop: 20,
     },
     headerContainer: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingBottom: 10,
     },
     headerTitle: {
          fontSize: 20,
          fontWeight: "bold",
          color: "#FFFFFF",
     },
     deleteAllButton: {
          flexDirection: "row",
          alignItems: "center",
     },
     deleteAllText: {
          fontSize: 16,
          color: "#FF5555",
          marginLeft: 4,
     },
     scrollContainer: {
          paddingHorizontal: 20,
          paddingBottom: 20,
     },
     dateSection: {
          marginBottom: 20,
     },
     dateHeaderContainer: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 8,
     },
     dateHeader: {
          fontSize: 18,
          fontWeight: "bold",
          color: "#FFFFFF",
     },
     recordsContainer: {
          marginTop: 8,
     },
     historyItem: {
          backgroundColor: "#2C2C2C",
          borderRadius: 8,
          padding: 12,
          marginBottom: 8,
     },
     historyContent: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
     },
     historyText: {
          flex: 1,
     },
     workoutName: {
          fontSize: 16,
          fontWeight: "600",
          color: "#FFFFFF",
          marginBottom: 4,
     },
     detailText: {
          fontSize: 14,
          color: "#BBBBBB",
          marginBottom: 2,
     },
     deleteButton: {
          padding: 8,
     },
     emptyText: {
          fontSize: 18,
          color: "#BBBBBB",
          textAlign: "center",
          marginTop: 40,
     },
});
