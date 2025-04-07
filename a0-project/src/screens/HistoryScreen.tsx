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
          // 날짜별로 그룹화 (YYYY-MM-DD 형식으로 그룹화)
          const grouped = history.reduce((acc, record) => {
               const date = new Date(record.startTime).toISOString().split("T")[0]; // YYYY-MM-DD 형식
               if (!acc[date]) {
                    acc[date] = [];
               }
               acc[date].push(record);
               return acc;
          }, {} as { [key: string]: WorkoutHistory[] });

          // 날짜를 최신순으로 정렬
          const sortedGrouped = Object.keys(grouped)
               .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // 최신 날짜가 맨 위로
               .map((date) => ({
                    date: new Date(date).toLocaleDateString("ko-KR", {
                         year: "numeric",
                         month: "long",
                         day: "numeric",
                    }), // 표시용 날짜 형식
                    records: grouped[date].sort(
                         (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                    ), // 각 날짜 내 기록도 최신순으로 정렬
               }));

          setGroupedHistory(sortedGrouped);

          // 초기 확장 상태 설정
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
