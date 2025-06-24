import React, { useState, useEffect } from "react";
import {
     View,
     Text,
     TextInput,
     StyleSheet,
     Pressable,
     Modal,
     Animated,
     ScrollView,
     KeyboardAvoidingView,
     Platform,
} from "react-native";
import { Workout } from "../types/workout";
import NumberInputStepper from "./NumberInputStepper";
import { v4 as uuidv4 } from "uuid";

interface AddWorkoutModalProps {
     visible: boolean;
     onClose: () => void;
     onAdd: (workout: Workout) => void;
     workoutToEdit?: Workout | null;
}

export default function AddWorkoutModal({ visible, onClose, onAdd, workoutToEdit }: AddWorkoutModalProps) {
     const [name, setName] = useState<string>("");
     const [duration, setDuration] = useState<number>(5);
     const [repeatCount, setRepeatCount] = useState<number>(12);
     const [cycleCount, setCycleCount] = useState<number>(4);
     const [prepTime, setPrepTime] = useState<number>(2);
     const [preStartTime, setPreStartTime] = useState<number>(5);
     const [cycleRestTime, setCycleRestTime] = useState<number>(60);
     const [backgroundColor, setBackgroundColor] = useState<string>("#4CAF50");
     const [modalScale] = useState(new Animated.Value(0));

     // [핵심 수정 1] 모달 애니메이션은 'visible' 상태에만 반응하도록 분리
     useEffect(() => {
          if (visible) {
               Animated.spring(modalScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
          } else {
               Animated.timing(modalScale, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          }
     }, [visible]);

     // [핵심 수정 2] 데이터 설정은 'workoutToEdit' 상태에만 반응하도록 분리
     useEffect(() => {
          if (workoutToEdit) {
               // 수정 모드: 기존 데이터로 폼 채우기
               setName(workoutToEdit.name);
               setDuration(workoutToEdit.duration);
               setRepeatCount(workoutToEdit.repeatCount);
               setCycleCount(workoutToEdit.cycleCount);
               setPrepTime(workoutToEdit.prepTime);
               setPreStartTime(workoutToEdit.preStartTime);
               setCycleRestTime(workoutToEdit.cycleRestTime);
               setBackgroundColor(workoutToEdit.backgroundColor);
          } else {
               // 추가 모드: 기본값으로 폼 리셋
               setName("새 운동"); // 기본 이름 제공
               setDuration(30);
               setRepeatCount(12);
               setCycleCount(4);
               setPrepTime(10);
               setPreStartTime(5);
               setCycleRestTime(60);
               setBackgroundColor("#4CAF50");
          }
     }, [workoutToEdit]);

     const handleAdd = () => {
          const newWorkout: Workout = {
               id: workoutToEdit ? workoutToEdit.id : uuidv4(),
               name: name || "새 루틴",
               duration,
               repeatCount,
               cycleCount,
               prepTime,
               preStartTime,
               cycleRestTime,
               backgroundColor,
          };
          onAdd(newWorkout);
          onClose();
     };

     return (
          <Modal visible={visible} transparent={true} animationType="none">
               <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
               >
                    <Animated.View style={[styles.modalContainer, { transform: [{ scale: modalScale }] }]}>
                         <Text style={styles.modalTitle}>{workoutToEdit ? "운동 수정" : "새로운 운동"}</Text>
                         <ScrollView showsVerticalScrollIndicator={false}>
                              <View style={styles.inputSection}>
                                   <Text style={styles.label}>운동 이름</Text>
                                   <TextInput
                                        style={styles.textInput}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="예: 푸쉬업, 스쿼트"
                                        placeholderTextColor="#888"
                                   />
                              </View>
                              <NumberInputStepper
                                   label="운동 시간 (1회 당)"
                                   value={duration}
                                   onValueChange={setDuration}
                                   unit="초"
                              />
                              <NumberInputStepper
                                   label="휴식 시간 (1회 당)"
                                   value={prepTime}
                                   onValueChange={setPrepTime}
                                   unit="초"
                              />
                              <NumberInputStepper
                                   label="반복 횟수 (1세트 당)"
                                   value={repeatCount}
                                   onValueChange={setRepeatCount}
                                   unit="회"
                              />
                              <NumberInputStepper
                                   label="총 세트 수"
                                   value={cycleCount}
                                   onValueChange={setCycleCount}
                                   unit="세트"
                              />
                              <NumberInputStepper
                                   label="세트 간 휴식"
                                   value={cycleRestTime}
                                   onValueChange={setCycleRestTime}
                                   unit="초"
                              />
                              <NumberInputStepper
                                   label="시작 전 준비 시간"
                                   value={preStartTime}
                                   onValueChange={setPreStartTime}
                                   unit="초"
                              />
                              <View style={styles.inputSection}>
                                   <Text style={styles.label}>카드 색상</Text>
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
                                                  { backgroundColor: "#2196F3" },
                                                  backgroundColor === "#2196F3" && styles.selectedColor,
                                             ]}
                                             onPress={() => setBackgroundColor("#2196F3")}
                                        />
                                        <Pressable
                                             style={[
                                                  styles.colorButton,
                                                  { backgroundColor: "#FF9800" },
                                                  backgroundColor === "#FF9800" && styles.selectedColor,
                                             ]}
                                             onPress={() => setBackgroundColor("#FF9800")}
                                        />
                                        <Pressable
                                             style={[
                                                  styles.colorButton,
                                                  { backgroundColor: "#9C27B0" },
                                                  backgroundColor === "#9C27B0" && styles.selectedColor,
                                             ]}
                                             onPress={() => setBackgroundColor("#9C27B0")}
                                        />
                                        <Pressable
                                             style={[
                                                  styles.colorButton,
                                                  { backgroundColor: "#E91E63" },
                                                  backgroundColor === "#E91E63" && styles.selectedColor,
                                             ]}
                                             onPress={() => setBackgroundColor("#E91E63")}
                                        />
                                   </View>
                              </View>
                         </ScrollView>
                         <View style={styles.buttonContainer}>
                              <Pressable style={[styles.actionButton, styles.cancelButton]} onPress={onClose}>
                                   <Text style={[styles.buttonText, styles.cancelButtonText]}>취소</Text>
                              </Pressable>
                              <Pressable style={[styles.actionButton, styles.addButton]} onPress={handleAdd}>
                                   <Text style={styles.buttonText}>{workoutToEdit ? "수정하기" : "추가하기"}</Text>
                              </Pressable>
                         </View>
                    </Animated.View>
               </KeyboardAvoidingView>
          </Modal>
     );
}

const styles = StyleSheet.create({
     modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "center", alignItems: "center" },
     modalContainer: { backgroundColor: "#1E1E1E", borderRadius: 24, padding: 24, width: "90%", maxHeight: "90%" },
     modalTitle: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", marginBottom: 24, textAlign: "center" },
     inputSection: { marginBottom: 24 },
     label: { fontSize: 16, color: "#ffffff", marginBottom: 8 },
     textInput: {
          backgroundColor: "#3C3C3C",
          color: "#FFFFFF",
          borderRadius: 12,
          padding: 12,
          fontSize: 16,
          height: 50,
     },
     colorPicker: { flexDirection: "row", justifyContent: "space-around", paddingTop: 10 },
     colorButton: { width: 40, height: 40, borderRadius: 20 },
     selectedColor: { borderWidth: 3, borderColor: "#FFFFFF", transform: [{ scale: 1.1 }] },
     buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, gap: 16 },
     actionButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
     cancelButton: { backgroundColor: "#3C3C3C" },
     addButton: { backgroundColor: "#4CAF50" },
     buttonText: { fontSize: 16, color: "#FFFFFF", fontWeight: "bold" },
     cancelButtonText: { color: "#E0E0E0" },
});
