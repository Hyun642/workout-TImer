import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
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
               const date = new Date(record.startTime).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
               });
               if (!acc[date]) {
                    acc[date] = [];
               }
               acc[date].push(record);
               return acc;
          }, {} as { [key: string]: WorkoutHistory[] });

          const sortedGrouped = Object.keys(grouped)
               .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
               .map((date) => ({
                    date,
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

     return (
          <View style={styles.container}>
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
                                                       <Text style={styles.workoutName}>{record.workoutName}</Text>
                                                       <Text style={styles.detailText}>
                                                            시작:{" "}
                                                            {new Date(record.startTime).toLocaleTimeString("ko-KR")}
                                                       </Text>
                                                       <Text style={styles.detailText}>
                                                            종료: {new Date(record.endTime).toLocaleTimeString("ko-KR")}
                                                       </Text>
                                                       <Text style={styles.detailText}>
                                                            누적 횟수: {record.totalRepetitions} 회
                                                       </Text>
                                                       <Text style={styles.detailText}>
                                                            완료 여부: {record.completed ? "완료" : "미완료"}
                                                       </Text>
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
     emptyText: {
          fontSize: 18,
          color: "#BBBBBB",
          textAlign: "center",
          marginTop: 40,
     },
});
