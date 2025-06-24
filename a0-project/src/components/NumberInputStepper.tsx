import React, { useRef } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface NumberInputStepperProps {
     label: string;
     value: number;
     onValueChange: (newValue: number) => void;
     min?: number;
     max?: number;
     step?: number;
     unit?: string;
}

export default function NumberInputStepper({
     label,
     value,
     onValueChange,
     min = 0,
     max = 999,
     step = 1,
     unit = "초",
}: NumberInputStepperProps) {
     const intervalRef = useRef<NodeJS.Timeout | null>(null);
     const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

     const handleIncrement = () => {
          onValueChange(Math.min(max, value + step));
     };

     const handleDecrement = () => {
          onValueChange(Math.max(min, value - step));
     };

     const handlePressIn = (action: "increment" | "decrement") => {
          // 길게 누를 때 0.5초 후에 연속 변경 시작
          longPressTimerRef.current = setTimeout(() => {
               intervalRef.current = setInterval(() => {
                    if (action === "increment") handleIncrement();
                    else handleDecrement();
               }, 100); // 0.1초마다 값 변경
          }, 500);
     };

     const handlePressOut = () => {
          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
          if (intervalRef.current) clearInterval(intervalRef.current);
     };

     return (
          <View style={styles.container}>
               <Text style={styles.label}>{label}</Text>
               <View style={styles.controlsContainer}>
                    <Pressable
                         onPress={handleDecrement}
                         onPressIn={() => handlePressIn("decrement")}
                         onPressOut={handlePressOut}
                         style={styles.button}
                         hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                         <MaterialIcons name="remove" size={24} color="#E0E0E0" />
                    </Pressable>
                    <View style={styles.valueContainer}>
                         <TextInput
                              style={styles.valueText}
                              value={String(value)}
                              onChangeText={(text) => onValueChange(parseInt(text) || 0)}
                              keyboardType="numeric"
                              maxLength={3}
                              textAlign="center"
                         />
                         <Text style={styles.unitText}>{unit}</Text>
                    </View>
                    <Pressable
                         onPress={handleIncrement}
                         onPressIn={() => handlePressIn("increment")}
                         onPressOut={handlePressOut}
                         style={styles.button}
                         hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                         <MaterialIcons name="add" size={24} color="#E0E0E0" />
                    </Pressable>
               </View>
          </View>
     );
}

const styles = StyleSheet.create({
     container: {
          marginBottom: 24,
     },
     label: {
          fontSize: 16,
          color: "#ffffff",
          marginBottom: 8,
     },
     controlsContainer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#3C3C3C",
          borderRadius: 12,
          paddingHorizontal: 8,
          height: 50,
     },
     button: {
          padding: 8,
     },
     valueContainer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
     },
     valueText: {
          fontSize: 20,
          fontWeight: "bold",
          color: "#FFFFFF",
          minWidth: 50,
     },
     unitText: {
          fontSize: 16,
          color: "#BBBBBB",
          marginLeft: 4,
     },
});
