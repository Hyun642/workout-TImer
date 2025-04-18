import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import HomeScreen from "./src/screens/HomeScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { StatusBar } from "react-native";

const Stack = createStackNavigator();

export default function App() {
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
