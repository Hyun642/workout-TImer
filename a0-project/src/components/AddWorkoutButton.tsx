import React from "react";
import { StyleSheet, Pressable, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface AddWorkoutButtonProps {
     onPress: () => void;
}

export default function AddWorkoutButton({ onPress }: AddWorkoutButtonProps) {
     const scaleAnim = new Animated.Value(1);

     const handlePress = () => {
          Animated.sequence([
               Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 100,
                    useNativeDriver: true,
               }),
               Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
               }),
          ]).start();

          onPress();
     };

     return (
          <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
               <Pressable onPress={handlePress} style={styles.button}>
                    <MaterialCommunityIcons name="plus" size={32} color="white" />
               </Pressable>
          </Animated.View>
     );
}

const styles = StyleSheet.create({
     container: {
          position: "absolute",
          bottom: 24,
          right: 24,
     },
     button: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: "#2186F2",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
     },
});
