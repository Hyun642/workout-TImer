import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TextInput, Pressable, Animated } from "react-native";

interface Workout {
     id: string;
     name: string;
     duration: number;
     repeatCount: number;
     prepTime: number;
     preStartTime: number;
}

interface AddWorkoutModalProps {
     visible: boolean;
     onClose: () => void;
     onSubmit: (workout: Workout) => void;
     initialWorkout?: Workout;
}

export default function AddWorkoutModal({ visible, onClose, onSubmit, initialWorkout }: AddWorkoutModalProps) {
     const [name, setName] = useState(initialWorkout?.name || "");
     const [duration, setDuration] = useState(initialWorkout?.duration.toString() || "");
     const [repeatCount, setRepeatCount] = useState(initialWorkout?.repeatCount.toString() || "");
     const [prepTime, setPrepTime] = useState(initialWorkout?.prepTime.toString() || "");
     const [preStartTime, setPreStartTime] = useState(initialWorkout?.preStartTime?.toString() || "3");
     const [shakeAnimation] = useState(new Animated.Value(0));
     const [shakeNameAnimation] = useState(new Animated.Value(0));

     const shake = () => {
          Animated.sequence([
               Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]).start();
     };

     const shakeName = () => {
          Animated.sequence([
               Animated.timing(shakeNameAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeNameAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeNameAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
               Animated.timing(shakeNameAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]).start();
     };

     const handleSubmit = () => {
          if (!name) {
               shakeName();
               return;
          } else if (!duration || !repeatCount || !prepTime || !preStartTime) {
               shake();
               return;
          }

          onSubmit({
               id: "",
               name,
               duration: parseInt(duration, 10),
               repeatCount: parseInt(repeatCount, 10) || 0,
               prepTime: parseInt(prepTime, 10) || 5,
               preStartTime: parseInt(preStartTime, 10) || 3,
          });

          setName("");
          setDuration("");
          setRepeatCount("");
          setPrepTime("");
     };

     return (
          <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
               <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                         <Animated.View style={{ transform: [{ translateX: shakeNameAnimation }] }}>
                              <TextInput
                                   style={styles.title}
                                   placeholder="루틴 이름"
                                   value={name}
                                   onChangeText={setName}
                              />
                         </Animated.View>

                         <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
                              <TextInput
                                   style={styles.input}
                                   placeholder="시간 (초)"
                                   value={duration}
                                   onChangeText={setDuration}
                                   keyboardType="number-pad"
                                   placeholderTextColor="#ffffff"
                              />
                         </Animated.View>

                         <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
                              <TextInput
                                   style={styles.input}
                                   placeholder="시작 전 대기 시간 (초, 기본값: 3)"
                                   value={preStartTime}
                                   onChangeText={setPreStartTime}
                                   keyboardType="number-pad"
                                   placeholderTextColor="#ffffff"
                              />
                         </Animated.View>

                         <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
                              <TextInput
                                   style={styles.input}
                                   placeholder="대기 시간 (초, 기본값: 5)"
                                   value={prepTime}
                                   onChangeText={setPrepTime}
                                   keyboardType="number-pad"
                                   placeholderTextColor="#ffffff"
                              />
                         </Animated.View>

                         <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
                              <TextInput
                                   style={styles.input}
                                   placeholder="반복 횟수 (0 = 무한 반복)"
                                   value={repeatCount}
                                   onChangeText={setRepeatCount}
                                   keyboardType="number-pad"
                                   placeholderTextColor="#ffffff"
                              />
                         </Animated.View>

                         <View style={styles.buttonContainer}>
                              <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
                                   <Text style={styles.buttonText}>취소</Text>
                              </Pressable>
                              <Pressable style={[styles.button, styles.submitButton]} onPress={handleSubmit}>
                                   <Text style={[styles.buttonText, styles.submitButtonText]}>추가</Text>
                              </Pressable>
                         </View>
                    </View>
               </View>
          </Modal>
     );
}

const styles = StyleSheet.create({
     modalOverlay: {
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          justifyContent: "center",
          alignItems: "center",
     },
     modalContent: {
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 24,
          width: "90%",
          maxWidth: 400,
          borderWidth: 1,
          borderColor: "#333",
     },
     title: {
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 24,
          color: "#000000",
     },
     input: {
          borderWidth: 1,
          borderColor: "#ffffff",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          fontSize: 16,
          backgroundColor: "gray",
          color: "#ffffff",
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
          backgroundColor: "lightgray",
          borderWidth: 1,
          borderColor: "lightgray",
     },
     submitButton: {
          backgroundColor: "#4CAF50",
     },
     submitButtonText: {
          color: "#FFFFFF",
     },
});
