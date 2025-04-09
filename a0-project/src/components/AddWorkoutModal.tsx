import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Modal, Animated } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Workout } from "../types/workout";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger";

interface AddWorkoutModalProps {
     visible: boolean;
     onClose: () => void;
     onAdd: (workout: Workout) => void;
     workoutToEdit?: Workout | null;
}

export default function AddWorkoutModal({ visible, onClose, onAdd, workoutToEdit }: AddWorkoutModalProps) {
     const [selectedCategory, setSelectedCategory] = useState<string>("푸쉬업");
     const [name, setName] = useState<string>("");
     const [duration, setDuration] = useState<string>("5");
     const [repeatCount, setRepeatCount] = useState<string>("12");
     const [cycleCount, setCycleCount] = useState<string>("4");
     const [prepTime, setPrepTime] = useState<string>("2");
     const [preStartTime, setPreStartTime] = useState<string>("5");
     const [cycleRestTime, setCycleRestTime] = useState<string>("60");
     const [backgroundColor, setBackgroundColor] = useState<string>("#4CAF50");
     const [modalScale] = useState(new Animated.Value(0));

     useEffect(() => {
          if (visible) {
               if (workoutToEdit) {
                    setSelectedCategory(workoutToEdit.name as string);
                    setName(workoutToEdit.name);
                    setDuration(workoutToEdit.duration.toString());
                    setRepeatCount(workoutToEdit.repeatCount.toString());
                    setCycleCount(workoutToEdit.cycleCount.toString());
                    setPrepTime(workoutToEdit.prepTime.toString());
                    setPreStartTime(workoutToEdit.preStartTime.toString());
                    setCycleRestTime(workoutToEdit.cycleRestTime.toString());
                    setBackgroundColor(workoutToEdit.backgroundColor);
               } else {
                    setSelectedCategory("푸쉬업");
                    setName("푸쉬업");
                    setDuration("4");
                    setRepeatCount("12");
                    setCycleCount("3");
                    setPrepTime("2");
                    setPreStartTime("5");
                    setCycleRestTime("60");
                    setBackgroundColor("#4CAF50");
               }
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
     }, [visible, workoutToEdit]);

     useEffect(() => {
          if (selectedCategory !== "그 외") {
               setName(selectedCategory);
          }
     }, [selectedCategory]);

     const handleAdd = () => {
          const newWorkout: Workout = {
               id: workoutToEdit ? workoutToEdit.id : uuidv4(),
               name: name || "새 루틴",
               duration: parseInt(duration) || 30,
               repeatCount: parseInt(repeatCount) || 0,
               cycleCount: parseInt(cycleCount) || 0,
               prepTime: parseInt(prepTime) || 0,
               preStartTime: parseInt(preStartTime) || 5,
               cycleRestTime: parseInt(cycleRestTime) || 0,
               backgroundColor,
          };
          onAdd(newWorkout);
          onClose();
     };

     return (
          <Modal visible={visible} transparent={true} animationType="none">
               <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.modalContainer, { transform: [{ scale: modalScale }] }]}>
                         <Text style={styles.modalTitle}>{workoutToEdit ? "운동 수정" : "운동 추가"}</Text>
                         <View style={styles.inputContainer}>
                              <Text style={styles.label}>운동 종류</Text>
                              <Picker
                                   selectedValue={selectedCategory}
                                   onValueChange={(itemValue: string) => setSelectedCategory(itemValue)}
                                   style={styles.picker}
                              >
                                   <Picker.Item label="푸쉬업" value="푸쉬업" />
                                   <Picker.Item label="스쿼트" value="스쿼트" />
                                   <Picker.Item label="풀업" value="풀업" />
                                   <Picker.Item label="윗몸일으키기" value="윗몸일으키기" />
                                   <Picker.Item label="플랭크" value="플랭크" />
                                   <Picker.Item label="인터벌" value="인터벌" />
                                   <Picker.Item label="타바타" value="타바타" />
                                   <Picker.Item label="스트레칭" value="스트레칭" />
                                   <Picker.Item label="공부" value="공부" />
                                   <Picker.Item label="그 외" value="그 외" />
                              </Picker>
                         </View>

                         {selectedCategory === "그 외" && (
                              <View style={styles.inputContainer}>
                                   <Text style={styles.label}>운동 이름</Text>
                                   <TextInput
                                        style={styles.input}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="운동 이름을 입력하세요"
                                        placeholderTextColor="#888"
                                        maxLength={13}
                                   />
                              </View>
                         )}

                         <View style={styles.inputContainer}>
                              <Text style={styles.label}>{name || "새 루틴"}</Text>
                              <View style={styles.inputWrapper}>
                                   <Text style={styles.unit}>회 당 </Text>
                                   <TextInput
                                        style={styles.input}
                                        value={duration}
                                        onChangeText={setDuration}
                                        keyboardType="numeric"
                                        placeholder="30"
                                        placeholderTextColor="#888"
                                   />
                                   <Text style={styles.unit}> 초</Text>
                              </View>
                         </View>

                         <View style={styles.inputContainer}>
                              <Text style={styles.label}>횟수</Text>
                              <View style={styles.inputWrapper}>
                                   <Text style={styles.unit}>한 세트 </Text>
                                   <TextInput
                                        style={styles.input}
                                        value={repeatCount}
                                        onChangeText={setRepeatCount}
                                        keyboardType="numeric"
                                        placeholder="12"
                                        placeholderTextColor="#888"
                                   />
                                   <Text style={styles.unit}> 회</Text>
                              </View>
                         </View>

                         <View style={styles.inputContainer}>
                              <Text style={styles.label}>세트</Text>
                              <View style={styles.inputWrapper}>
                                   <Text style={styles.unit}>총 </Text>
                                   <TextInput
                                        style={styles.input}
                                        value={cycleCount}
                                        onChangeText={setCycleCount}
                                        keyboardType="numeric"
                                        placeholder="1"
                                        placeholderTextColor="#888"
                                   />
                                   <Text style={styles.unit}> 세트</Text>
                              </View>
                         </View>

                         <View style={styles.inputContainer}>
                              <Text style={styles.label}>1회 당 휴식 시간</Text>
                              <View style={styles.inputWrapper}>
                                   <Text style={styles.unit}>회 당 </Text>
                                   <TextInput
                                        style={styles.input}
                                        value={prepTime}
                                        onChangeText={setPrepTime}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor="#888"
                                   />
                                   <Text style={styles.unit}> 초</Text>
                              </View>
                         </View>

                         <View style={styles.inputContainer}>
                              <Text style={styles.label}>시작 전 준비 시간</Text>
                              <View style={styles.inputWrapper}>
                                   <Text style={styles.unit}>시작 전 </Text>
                                   <TextInput
                                        style={styles.input}
                                        value={preStartTime}
                                        onChangeText={setPreStartTime}
                                        keyboardType="numeric"
                                        placeholder="5"
                                        placeholderTextColor="#888"
                                   />
                                   <Text style={styles.unit}> 초</Text>
                              </View>
                         </View>

                         <View style={styles.inputContainer}>
                              <Text style={styles.label}>세트 간 휴식 시간</Text>
                              <View style={styles.inputWrapper}>
                                   <Text style={styles.unit}>세트 간 </Text>
                                   <TextInput
                                        style={styles.input}
                                        value={cycleRestTime}
                                        onChangeText={setCycleRestTime}
                                        keyboardType="numeric"
                                        placeholder="60"
                                        placeholderTextColor="#888"
                                   />
                                   <Text style={styles.unit}> 초</Text>
                              </View>
                         </View>

                         <View style={styles.inputContainer}>
                              <Text style={styles.label}>배경 색상</Text>
                              <View style={styles.colorPicker}>
                                   <Pressable
                                        style={[
                                             styles.colorButton,
                                             { backgroundColor: "#4CAF50" },
                                             backgroundColor === "#4CAF50" && styles.selectedColor,
                                        ]}
                                        onPress={() => setBackgroundColor("#4CAF50")}
                                   />
                                   <Pressable
                                        style={[
                                             styles.colorButton,
                                             { backgroundColor: "#ad71f8" },
                                             backgroundColor === "#ad71f8" && styles.selectedColor,
                                        ]}
                                        onPress={() => setBackgroundColor("#ad71f8")}
                                   />
                                   <Pressable
                                        style={[
                                             styles.colorButton,
                                             { backgroundColor: "#0049f0" },
                                             backgroundColor === "#0049f0" && styles.selectedColor,
                                        ]}
                                        onPress={() => setBackgroundColor("#0049f0")}
                                   />
                              </View>
                         </View>

                         <View style={styles.buttonContainer}>
                              <Pressable style={styles.cancelButton} onPress={onClose}>
                                   <Text style={styles.buttonText}>취소</Text>
                              </Pressable>
                              <Pressable style={styles.addButton} onPress={handleAdd}>
                                   <Text style={styles.buttonText}>{workoutToEdit ? "수정" : "추가"}</Text>
                              </Pressable>
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
     },
     modalTitle: {
          fontSize: 20,
          fontWeight: "bold",
          color: "#FFFFFF",
          marginBottom: 20,
          textAlign: "center",
     },
     inputContainer: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
     },
     label: {
          fontSize: 16,
          color: "#FFFFFF",
          flex: 1,
     },
     inputWrapper: {
          flexDirection: "row",
          alignItems: "center",
     },
     input: {
          backgroundColor: "#3C3C3C",
          color: "#FFFFFF",
          borderRadius: 8,
          padding: 8,
          width: 80,
          textAlign: "center",
     },
     picker: {
          flex: 1,
          color: "#FFFFFF",
          backgroundColor: "#3C3C3C",
          borderRadius: 8,
     },
     unit: {
          fontSize: 16,
          color: "#BBBBBB",
          marginHorizontal: 4,
     },
     colorPicker: {
          flexDirection: "row",
          justifyContent: "flex-end",
          width: 120,
     },
     colorButton: {
          width: 30,
          height: 30,
          borderRadius: 15,
          marginHorizontal: 5,
     },
     selectedColor: {
          borderWidth: 2,
          borderColor: "#FFFFFF",
     },
     buttonContainer: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 20,
     },
     cancelButton: {
          flex: 1,
          backgroundColor: "#555",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
          marginRight: 8,
     },
     addButton: {
          flex: 1,
          backgroundColor: "#4CAF50",
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
