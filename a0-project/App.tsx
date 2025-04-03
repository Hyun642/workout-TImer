import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./src/screens/HomeScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
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
                              options={{ title: "HOME TRAINING TIMER", headerShown: true }}
                         />
                         <Stack.Screen name="History" component={HistoryScreen} options={{ title: "운동 기록" }} />
                    </Stack.Navigator>
               </NavigationContainer>
          </>
     );
}
