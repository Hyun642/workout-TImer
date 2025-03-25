import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Timer from './Timer';
import { Workout } from '../types/workout';
import AddWorkoutModal from './AddWorkoutModal';

interface WorkoutCardProps {
  workout: Workout;
  onDelete: (id: string) => void;
  onEdit: (workout: Workout) => void;
}

export default function WorkoutCard({ workout, onDelete, onEdit }: WorkoutCardProps) {  const [isTimerActive, setIsTimerActive] = useState(false);
  const [repeatCount, setRepeatCount] = useState(0);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [totalTime, setTotalTime] = useState<number>(0);
  const scaleAnim = new Animated.Value(1);
  const completedAnim = useRef(new Animated.Value(0)).current;  const handlePress = () => {
    if (!isTimerActive && !isCompleted) {
      setStartTime(new Date());
    }
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (isCompleted) {
      handleReset();
      return;
    }

    setIsTimerActive(!isTimerActive);
    setIsPaused(!isPaused);
  };  const handleReset = () => {
    setIsTimerActive(false);
    setRepeatCount(0);
    setIsPaused(false);
    setIsCompleted(false);
    setStartTime(null);
    setTotalTime(0);
    completedAnim.setValue(0);
  };  const celebrateCompletion = () => {
    setIsCompleted(true);
    if (startTime) {
      const endTime = new Date();
      const timeDiff = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      setTotalTime(timeDiff);
    }
    Animated.sequence([
      Animated.timing(completedAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(completedAnim, {
        toValue: 0.8,
        friction: 3,
        useNativeDriver: true,
      })
    ]).start();
  };  const handleComplete = () => {
    setRepeatCount(prev => {
      const newCount = prev + 1;
      if (workout.repeatCount !== 0 && newCount >= workout.repeatCount) {
        setIsTimerActive(false);
        celebrateCompletion();
        return newCount;
      }
      if (workout.repeatCount === 0 || newCount < workout.repeatCount) {
        setIsTimerActive(true);
      }
      return newCount;
    });
  };

  return (    <Animated.View style={[
      styles.card, 
      { transform: [{ scale: scaleAnim }] },
      isTimerActive && !isPaused && !isCompleted && { backgroundColor: '#4CAF50' },
      isPaused && { backgroundColor: '#4CAF50' },
      isCompleted && { backgroundColor: '#2196F3' }
    ]}>
      <Pressable onPress={handlePress}>
        <View style={styles.header}>
          <Text style={styles.title}>{workout.name}</Text>
          <View style={styles.actions}>            <Pressable 
              onPress={() => setIsEditModalVisible(true)} 
              style={styles.actionButton}
            >
              <MaterialCommunityIcons name="pencil" size={24} color="#666" />
            </Pressable>
            <Pressable 
              onPress={() => {
                Alert.alert(
                  "루틴 삭제",
                  `해당 루틴을 삭제합니다. "${workout.name}"?`,
                  [
                    { text: "취소", style: "cancel" },
                    { text: "확인", onPress: () => onDelete(workout.id), style: "destructive" }
                  ]
                );
              }} 
              style={styles.actionButton}
            >
              <MaterialCommunityIcons name="delete" size={24} color="#666" />
            </Pressable>
          </View>
        </View>
        <Timer
          duration={workout.duration}
          isActive={isTimerActive}
          onComplete={handleComplete}
          prepTime={workout.prepTime}
        />        <View style={styles.footer}>
          <Text style={styles.repeatText}>
            반복: {repeatCount}/{workout.repeatCount === 0 ? '∞' : workout.repeatCount}
          </Text>
          <Pressable onPress={handleReset} style={styles.resetButton}>
            <MaterialIcons name="replay" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
        
        {isPaused && isTimerActive && (
          <View style={styles.pauseOverlay}>
            <Text style={styles.pauseText}></Text>
          </View>
        )}

        {isCompleted && (
          <Animated.View style={[
            styles.completedOverlay,
            {
              transform: [
                { scale: completedAnim },
                { translateY: completedAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })}
              ],
              opacity: completedAnim
            }
          ]}>            <Text style={styles.completedText}>대단해요!</Text>
            <MaterialIcons name="celebration" size={40} color="#FFD700" />
            <Text style={styles.totalTimeText}>총 소요시간: {Math.floor(totalTime / 60)}분 {totalTime % 60}초</Text>
          </Animated.View>
        )}      </Pressable>
      <AddWorkoutModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSubmit={(updatedWorkout) => {
          onEdit({ ...updatedWorkout, id: workout.id });
          setIsEditModalVisible(false);
        }}
        initialWorkout={workout}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(150, 230, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  pauseText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  completedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  completedText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  resetButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },  card: {
    backgroundColor: '#2196F3',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    aspectRatio: 1,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 16,
    padding: 8,
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repeatText: {
    fontSize: 16,
    color: '#BBBBBB',
    fontWeight: '500',
  },
});