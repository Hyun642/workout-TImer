import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import HomeScreen from "./src/screens/HomeScreen";
import HistoryScreen from "./src/screens/HistoryScreen";

const Stack = createNativeStackNavigator();

function RootStack() {
     return (
          <Stack.Navigator
               screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: "#121212" },
               }}
          >
               <Stack.Screen name="Home" component={HomeScreen} />
               <Stack.Screen name="History" component={HistoryScreen} />
          </Stack.Navigator>
     );
}

export default function App() {
     return (
          <SafeAreaProvider style={styles.container}>
               <Toaster />
               <StatusBar barStyle="light-content" backgroundColor="#121212" />
               <NavigationContainer>
                    <RootStack />
               </NavigationContainer>
          </SafeAreaProvider>
     );
}

const styles = StyleSheet.create({
     container: {
          flex: 1,
     },
});
