import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, Animated, ScrollView, Dimensions, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WorkoutHistory } from "../types/history";
import logger from "../utils/logger";
import { LineChart } from "react-native-chart-kit";

interface StatisticsModalProps {
     visible: boolean;
     onClose: () => void;
}

export default function StatisticsModal({ visible, onClose }: StatisticsModalProps) {
     const [modalScale] = useState(new Animated.Value(0));
     const [totalWorkouts, setTotalWorkouts] = useState(0);
     const [totalRepetitions, setTotalRepetitions] = useState(0);
     const [totalTime, setTotalTime] = useState(0);
     const [history, setHistory] = useState<WorkoutHistory[]>([]);
     const [dailyWorkoutData, setDailyWorkoutData] = useState<{ labels: string[]; data: number[] }>({
          labels: [],
          data: [],
     });

     useEffect(() => {
          if (visible) {
               Animated.spring(modalScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
               }).start();
               loadHistory();
          } else {
               Animated.timing(modalScale, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
               }).start();
          }
     }, [visible]);

     const loadHistory = async () => {
          try {
               const historyData = await AsyncStorage.getItem("workoutHistory");
               if (historyData) {
                    const parsedHistory: WorkoutHistory[] = JSON.parse(historyData);
                    setHistory(parsedHistory);

                    const completedWorkouts = parsedHistory.filter((item) => item.completed).length;
                    const totalReps = parsedHistory.reduce((sum, item) => sum + item.totalRepetitions, 0);
                    const totalSeconds = parsedHistory.reduce((sum, item) => {
                         const start = new Date(item.startTime).getTime();
                         const end = new Date(item.endTime).getTime();
                         return sum + (end - start) / 1000;
                    }, 0);

                    setTotalWorkouts(completedWorkouts);
                    setTotalRepetitions(totalReps);
                    setTotalTime(totalSeconds);

                    prepareDailyWorkoutData(parsedHistory);
               }
          } catch (error) {
               logger.error("Error loading workout history:", error);
          }
     };

     const prepareDailyWorkoutData = (history: WorkoutHistory[]) => {
          const today = new Date();
          const pastDays = 7;
          const dates: string[] = [];
          const workoutCounts: number[] = [];

          for (let i = pastDays - 1; i >= 0; i--) {
               const date = new Date(today);
               date.setDate(today.getDate() - i);
               const dateString = date.toISOString().split("T")[0];
               dates.push(date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }));
               workoutCounts.push(0);
          }

          history.forEach((item) => {
               if (!item.completed) return;
               const workoutDate = new Date(item.startTime).toISOString().split("T")[0];
               const dateIndex = dates.findIndex((_, idx) => {
                    const date = new Date(today);
                    date.setDate(today.getDate() - (pastDays - 1 - idx));
                    return date.toISOString().split("T")[0] === workoutDate;
               });

               if (dateIndex !== -1) {
                    workoutCounts[dateIndex] += 1;
               }
          });

          setDailyWorkoutData({
               labels: dates,
               data: workoutCounts,
          });
     };

     return (
          <Modal visible={visible} transparent={true} animationType="none">
               <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.modalContainer, { transform: [{ scale: modalScale }] }]}>
                         <Text style={styles.modalTitle}>운동 통계</Text>
                         <ScrollView>
                              <View style={styles.statContainer}>
                                   <Text style={styles.statLabel}>완료한 운동 횟수</Text>
                                   <Text style={styles.statValue}>{totalWorkouts} 회</Text>
                              </View>
                              <View style={styles.statContainer}>
                                   <Text style={styles.statLabel}>총 누적 횟수</Text>
                                   <Text style={styles.statValue}>{totalRepetitions} 회</Text>
                              </View>
                              <View style={styles.statContainer}>
                                   <Text style={styles.statLabel}>총 운동 시간</Text>
                                   <Text style={styles.statValue}>
                                        {Math.floor(totalTime / 3600)}시간 {Math.floor((totalTime % 3600) / 60)}분{" "}
                                        {Math.floor(totalTime % 60)}초
                                   </Text>
                              </View>

                              <View style={styles.statContainer}>
                                   <Text style={styles.statLabel}>날짜별 운동 횟수 (최근 7일)</Text>
                                   {dailyWorkoutData.labels.length > 0 ? (
                                        <LineChart
                                             data={{
                                                  labels: dailyWorkoutData.labels,
                                                  datasets: [
                                                       {
                                                            data: dailyWorkoutData.data,
                                                       },
                                                  ],
                                             }}
                                             width={Dimensions.get("window").width * 0.8}
                                             height={220}
                                             yAxisLabel=""
                                             yAxisSuffix="회"
                                             chartConfig={{
                                                  backgroundColor: "#2C2C2C",
                                                  backgroundGradientFrom: "#2C2C2C",
                                                  backgroundGradientTo: "#2C2C2C",
                                                  decimalPlaces: 0,
                                                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                                                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                                  style: {
                                                       borderRadius: 16,
                                                  },
                                                  propsForDots: {
                                                       r: "6",
                                                       strokeWidth: "2",
                                                       stroke: "#FFFFFF",
                                                  },
                                             }}
                                             bezier
                                             style={{
                                                  marginVertical: 8,
                                                  borderRadius: 16,
                                             }}
                                        />
                                   ) : (
                                        <Text style={styles.noDataText}>데이터가 없습니다.</Text>
                                   )}
                              </View>
                         </ScrollView>
                         <View style={styles.buttonContainer}>
                              <View style={{ flex: 1 }} />
                              <View style={{ flex: 1 }}>
                                   <Pressable style={styles.closeButton} onPress={onClose}>
                                        <Text style={styles.buttonText}>닫기</Text>
                                   </Pressable>
                              </View>
                         </View>
                    </Animated.View>
               </View>
          </Modal>
     );
}

const styles = StyleSheet.create({
     modalOverlay: {
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          justifyContent: "center",
          alignItems: "center",
     },
     modalContainer: {
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
          marginBottom: 20,
          textAlign: "center",
     },
     statContainer: {
          marginBottom: 20,
     },
     statLabel: {
          fontSize: 16,
          color: "#BBBBBB",
          marginBottom: 8,
     },
     statValue: {
          fontSize: 18,
          color: "#FFFFFF",
          fontWeight: "600",
     },
     noDataText: {
          fontSize: 16,
          color: "#BBBBBB",
          textAlign: "center",
          marginTop: 10,
     },
     buttonContainer: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 20,
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
