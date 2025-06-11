import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Pressable, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import HomeScreen from "./src/screens/HomeScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { StatusBar } from "react-native";
import * as Notifications from "expo-notifications";
import logger from "./src/utils/logger";

const Stack = createStackNavigator();

// 알림 핸들러 설정: 앱이 실행 중일 때도 알림을 표시
Notifications.setNotificationHandler({
     handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
     }),
});

// 알림 권한 요청 함수
async function registerForPushNotificationsAsync() {
     let token;
     if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
               name: "default",
               importance: Notifications.AndroidImportance.MAX,
               vibrationPattern: [0, 250, 250, 250],
               lightColor: "#FF231F7C",
          });
     }

     const { status: existingStatus } = await Notifications.getPermissionsAsync();
     let finalStatus = existingStatus;
     if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
     }
     if (finalStatus !== "granted") {
          logger.warn("Failed to get push token for push notification!");
          return;
     }

     return token;
}

export default function App() {
     useEffect(() => {
          registerForPushNotificationsAsync();

          // 알림 액션 카테고리 설정
          Notifications.setNotificationCategoryAsync("workout-controls", [
               {
                    identifier: "pause-action",
                    buttonTitle: "일시정지",
                    options: {
                         // opensAppToForeground: false, // 이 옵션은 일시정지 후에도 알림이 그대로 있게 하므로 유용합니다.
                    },
               },
               {
                    identifier: "resume-action",
                    buttonTitle: "계속",
                    options: {
                         opensAppToForeground: true,
                    },
               },
               {
                    identifier: "stop-action",
                    buttonTitle: "중지",
                    options: {
                         opensAppToForeground: true,
                    },
               },
          ])
               .then(() => {
                    logger.log("Notification category 'workout-controls' set.");
               })
               .catch((err) => {
                    logger.error("Failed to set notification category.", err);
               });
     }, []);

     return (
          <>
               <StatusBar backgroundColor="#1C1C1C" barStyle="light-content" />
               <NavigationContainer>
                    <Stack.Navigator
                         initialRouteName="Home"
                         screenOptions={{
                              headerStyle: {
                                   backgroundColor: "#1C1C1C",
                              },
                              headerTintColor: "lightgray",
                              headerTitleStyle: {
                                   fontWeight: "bold",
                              },
                         }}
                    >
                         <Stack.Screen
                              name="Home"
                              component={HomeScreen}
                              options={({ navigation }) => ({
                                   title: "HOME WORKOUT TIMER",
                                   headerShown: true,
                                   headerRight: () => (
                                        <Pressable
                                             style={{ padding: 8, marginRight: 10 }}
                                             onPress={() => navigation.navigate("Settings")}
                                        >
                                             <MaterialIcons name="settings" size={20} color="lightgray" />
                                        </Pressable>
                                   ),
                              })}
                         />
                         <Stack.Screen name="History" component={HistoryScreen} options={{ title: "운동 기록" }} />
                         <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "설정" }} />
                    </Stack.Navigator>
               </NavigationContainer>
          </>
     );
}
