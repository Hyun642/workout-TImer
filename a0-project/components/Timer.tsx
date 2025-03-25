import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface TimerProps {
  duration: number;
  isActive: boolean;
  onComplete: () => void;
  prepTime: number;
}

export default function Timer({ duration, isActive, onComplete, prepTime }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepTimeLeft, setPrepTimeLeft] = useState(prepTime);
  const progressAnim = useRef(new Animated.Value(1)).current;  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      setPrepTimeLeft(prepTime);
      setIsPreparing(true);
      progressAnim.setValue(1);
      return;
    }

    let interval: NodeJS.Timeout;

    if (isPreparing && prepTimeLeft > 0) {
      interval = setInterval(() => {
        setPrepTimeLeft(prev => {
          if (prev <= 1) {
            setIsPreparing(false);
            progressAnim.setValue(1);
            return prepTime;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isPreparing && timeLeft > 0) {
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: timeLeft * 1000,
        useNativeDriver: false,
      }).start();

      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            onComplete();
            setIsPreparing(true);
            progressAnim.setValue(1);
            setPrepTimeLeft(prepTime);
            return duration;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPreparing]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>      <View style={styles.timerContainer}>
        {isPreparing ? (
          <View style={styles.prepTimeContainer}>
            <Text style={styles.prepLabel}>대기</Text>
            <Text style={[styles.timeText, { color: '#FFA500' }]}>
              {formatTime(prepTimeLeft)}
            </Text>
          </View>
        ) : (
          <View style={styles.workoutTimeContainer}>
            <Text style={styles.workoutLabel}>운동</Text>
            <Text style={[styles.timeText, { color: '#4CAF50' }]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        )}
      </View>
      {isActive && (
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: progressWidth },
              { backgroundColor: isPreparing ? '#FFA500' : '#FF1744' },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  timerContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#252525',
    borderRadius: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  prepTimeContainer: {
    alignItems: 'center',
    width: '100%',
  },
  workoutTimeContainer: {
    alignItems: 'center',
    width: '100%',
  },
  prepLabel: {
    fontSize: 16,
    color: '#FFA500',
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  workoutLabel: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  container: {
    alignItems: 'center',
    width: '100%',
  },
  timeText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: 8,
    fontVariant: ['tabular-nums'],
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
});