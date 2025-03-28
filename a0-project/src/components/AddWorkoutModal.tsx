import React, { useState, useEffect } from "react";
import {
     View,
     Text,
     StyleSheet,
     Modal,
     TextInput,
     Pressable,
     Animated,
     TouchableWithoutFeedback,
     Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";

interface Workout {
     id: string;
     name: string;
     duration: number;
     repeatCount: number;
     prepTime: number;
     preStartTime: number;
     backgroundColor: string; // 배경색 필드 추가
}

interface AddWorkoutModalProps {
     visible: boolean;
     onClose: () => void;
     onSubmit: (workout: Workout) => void;
     initialWorkout?: Workout;
}

const LABELS = {
     name: "루틴 이름",
     duration: "운동 시간 (초)",
     preStartTime: "시작 전 준비 시간 (초)",
     prepTime: "대기 시간 (초)",
     repeatCount: "반복 횟수 (무한 반복은 0)",
     backgroundColor: "배경색",
};

// 색상 선택지 정의
const COLOR_OPTIONS = [
     { label: "녹색", value: "#4CAF50" },
     { label: "주황색", value: "#FF5722" },
     { label: "보라색", value: "#ad71f8" },
     { label: "파랑색", value: "#0049f0" },
];

export default function AddWorkoutModal({ visible, onClose, onSubmit, initialWorkout }: AddWorkoutModalProps) {
     const [name, setName] = useState(initialWorkout?.name || "");
     const [duration, setDuration] = useState(initialWorkout?.duration.toString() || "");
     const [repeatCount, setRepeatCount] = useState(initialWorkout?.repeatCount.toString() || "");
     const [prepTime, setPrepTime] = useState(initialWorkout?.prepTime.toString() || "");
     const [preStartTime, setPreStartTime] = useState(initialWorkout?.preStartTime?.toString() || "3");
     const [backgroundColor, setBackgroundColor] = useState(initialWorkout?.backgroundColor || COLOR_OPTIONS[0].value);
     const [shakeNameAnimation] = useState(new Animated.Value(0));
     const [shakeDurationAnimation] = useState(new Animated.Value(0));
     const [shakePreStartTimeAnimation] = useState(new Animated.Value(0));
     const [shakePrepTimeAnimation] = useState(new Animated.Value(0));
     const [shakeRepeatCountAnimation] = useState(new Animated.Value(0));
     const [modalScale] = useState(new Animated.Value(0));

     useEffect(() => {
          if (initialWorkout) {
               setName(initialWorkout.name);
               setDuration(initialWorkout.duration.toString());
               setRepeatCount(initialWorkout.repeatCount.toString());
               setPrepTime(initialWorkout.prepTime.toString());
               setPreStartTime(initialWorkout.preStartTime.toString());
               setBackgroundColor(initialWorkout.backgroundColor || COLOR_OPTIONS[0].value);
          }
     }, [initialWorkout]);

     useEffect(() => {
          if (visible) {
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
     }, [visible]);

     const shakeName = () => {
          Animated.sequence([
               Animated.timing(shakeNameAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeNameAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeNameAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeNameAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]).start();
     };

     const shakeDuration = () => {
          Animated.sequence([
               Animated.timing(shakeDurationAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeDurationAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeDurationAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeDurationAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]).start();
     };

     const shakePreStartTime = () => {
          Animated.sequence([
               Animated.timing(shakePreStartTimeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakePreStartTimeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakePreStartTimeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakePreStartTimeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]).start();
     };

     const shakePrepTime = () => {
          Animated.sequence([
               Animated.timing(shakePrepTimeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakePrepTimeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakePrepTimeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakePrepTimeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]).start();
     };

     const shakeRepeatCount = () => {
          Animated.sequence([
               Animated.timing(shakeRepeatCountAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeRepeatCountAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeRepeatCountAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeRepeatCountAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]).start();
     };

     const handleSubmit = () => {
          let hasError = false;

          if (!name) {
               shakeName();
               hasError = true;
          }
          if (!duration) {
               shakeDuration();
               hasError = true;
          }
          if (!preStartTime) {
               shakePreStartTime();
               hasError = true;
          }
          if (!prepTime) {
               shakePrepTime();
               hasError = true;
          }
          if (!repeatCount) {
               shakeRepeatCount();
               hasError = true;
          }

          if (hasError) {
               return;
          }

          const workoutData: Workout = {
               id: initialWorkout?.id || "",
               name,
               duration: parseInt(duration, 10),
               repeatCount: parseInt(repeatCount, 10) || 0,
               prepTime: parseInt(prepTime, 10) || 5,
               preStartTime: parseInt(preStartTime, 10) || 3,
               backgroundColor, // 선택된 배경색 추가
          };

          onSubmit(workoutData);

          if (!initialWorkout) {
               setName("");
               setDuration("");
               setRepeatCount("");
               setPrepTime("");
               setPreStartTime("3");
               setBackgroundColor(COLOR_OPTIONS[0].value); // 초기화 시 기본 색상으로 설정
          }
     };

     const handleOverlayPress = () => {
          Keyboard.dismiss();
     };

     return (
          <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose}>
               <TouchableWithoutFeedback onPress={handleOverlayPress}>
                    <View style={styles.modalOverlay}>
                         <Animated.View style={[styles.modalContent, { transform: [{ scale: modalScale }] }]}>
                              <Text style={styles.headerText}>{initialWorkout ? "루틴 편집" : "새 루틴"}</Text>

                              <View style={styles.fieldContainer}>
                                   <Text style={styles.label}>{LABELS.name}</Text>
                                   <Animated.View style={{ transform: [{ translateX: shakeNameAnimation }] }}>
                                        <TextInput
                                             style={[styles.input, { fontSize: 20, fontWeight: "bold" }]}
                                             value={name}
                                             onChangeText={setName}
                                        />
                                   </Animated.View>
                              </View>

                              <View style={styles.fieldContainer}>
                                   <Text style={styles.label}>{LABELS.preStartTime}</Text>
                                   <Animated.View style={{ transform: [{ translateX: shakePreStartTimeAnimation }] }}>
                                        <TextInput
                                             style={styles.input}
                                             value={preStartTime}
                                             onChangeText={setPreStartTime}
                                             keyboardType="number-pad"
                                        />
                                   </Animated.View>
                              </View>

                              <View style={styles.fieldContainer}>
                                   <Text style={styles.label}>{LABELS.duration}</Text>
                                   <Animated.View style={{ transform: [{ translateX: shakeDurationAnimation }] }}>
                                        <TextInput
                                             style={styles.input}
                                             value={duration}
                                             onChangeText={setDuration}
                                             keyboardType="number-pad"
                                        />
                                   </Animated.View>
                              </View>

                              <View style={styles.fieldContainer}>
                                   <Text style={styles.label}>{LABELS.prepTime}</Text>
                                   <Animated.View style={{ transform: [{ translateX: shakePrepTimeAnimation }] }}>
                                        <TextInput
                                             style={styles.input}
                                             value={prepTime}
                                             onChangeText={setPrepTime}
                                             keyboardType="number-pad"
                                        />
                                   </Animated.View>
                              </View>

                              <View style={styles.fieldContainer}>
                                   <Text style={styles.label}>{LABELS.repeatCount}</Text>
                                   <Animated.View style={{ transform: [{ translateX: shakeRepeatCountAnimation }] }}>
                                        <TextInput
                                             style={styles.input}
                                             value={repeatCount}
                                             onChangeText={setRepeatCount}
                                             keyboardType="number-pad"
                                        />
                                   </Animated.View>
                              </View>

                              <View style={styles.fieldContainer}>
                                   <Text style={styles.label}>{LABELS.backgroundColor}</Text>
                                   <Picker
                                        selectedValue={backgroundColor}
                                        onValueChange={(itemValue) => setBackgroundColor(itemValue)}
                                        style={styles.picker}
                                   >
                                        {COLOR_OPTIONS.map((option) => (
                                             <Picker.Item
                                                  key={option.value}
                                                  label={option.label}
                                                  value={option.value}
                                             />
                                        ))}
                                   </Picker>
                              </View>

                              <View style={styles.buttonContainer}>
                                   <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
                                        <Text style={styles.buttonText}>취소</Text>
                                   </Pressable>
                                   <LinearGradient
                                        colors={["#4CAF50", "#45a049"]}
                                        style={[styles.button, styles.submitButton]}
                                   >
                                        <Pressable onPress={handleSubmit}>
                                             <Text style={[styles.buttonText, styles.submitButtonText]}>
                                                  {initialWorkout ? "수정" : "추가"}
                                             </Text>
                                        </Pressable>
                                   </LinearGradient>
                              </View>
                         </Animated.View>
                    </View>
               </TouchableWithoutFeedback>
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
     modalContent: {
          backgroundColor: "#2C2C2C",
          borderRadius: 20,
          padding: 24,
          width: "90%",
          maxWidth: 400,
          borderWidth: 1,
          borderColor: "#444",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
     },
     headerText: {
          fontSize: 24,
          fontWeight: "bold",
          color: "#FFFFFF",
          textAlign: "center",
          marginBottom: 24,
     },
     fieldContainer: {
          marginBottom: 16,
     },
     label: {
          fontSize: 16,
          color: "#FFFFFF",
          marginBottom: 8,
     },
     input: {
          borderWidth: 1,
          borderColor: "#555",
          borderRadius: 12,
          padding: 16,
          fontSize: 16,
          backgroundColor: "#3A3A3A",
          color: "#FFFFFF",
     },
     picker: {
          backgroundColor: "#3A3A3A",
          color: "#FFFFFF",
          borderRadius: 12,
     },
     buttonContainer: {
          flexDirection: "row",
          justifyContent: "flex-end",
          marginTop: 16,
     },
     button: {
          paddingVertical: 14,
          paddingHorizontal: 28,
          borderRadius: 12,
          marginLeft: 16,
     },
     buttonText: {
          fontSize: 16,
          fontWeight: "600",
     },
     cancelButton: {
          backgroundColor: "#555",
     },
     submitButton: {
          backgroundColor: "transparent",
     },
     submitButtonText: {
          color: "#FFFFFF",
     },
});
