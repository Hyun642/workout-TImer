import React from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Application from "expo-application";

export default function SettingsScreen() {
     const openLink = async (url: string) => {
          const supported = await Linking.canOpenURL(url);
          if (supported) {
               await Linking.openURL(url);
          } else {
               console.warn(`Cannot open URL: ${url}`);
          }
     };

     return (
          <View style={styles.container}>
               <View style={styles.section}>
                    <Pressable
                         style={styles.item}
                         onPress={() =>
                              openLink("https://victorious-skate-c5d.notion.site/ebd/1d098bbc296980649554db4bb1922be7")
                         }
                    >
                         <Text style={styles.itemTitle}>개인정보처리 방침</Text>
                         <MaterialIcons name="chevron-right" size={24} color="#BBBBBB" />
                    </Pressable>
                    <Pressable
                         style={styles.item}
                         onPress={() =>
                              openLink("https://victorious-skate-c5d.notion.site/1d998bbc296980088314e76177c347fb")
                         }
                    >
                         <Text style={styles.itemTitle}>서비스 이용약관</Text>
                         <MaterialIcons name="chevron-right" size={24} color="#BBBBBB" />
                    </Pressable>
                    <View style={styles.item}>
                         <Text style={styles.itemTitle}>앱 버전</Text>
                         <Text style={styles.itemDescription}>
                              {Application.nativeApplicationVersion || "1.0.0"} (Build{" "}
                              {Application.nativeBuildVersion || "1"})
                         </Text>
                    </View>
               </View>
          </View>
     );
}

const styles = StyleSheet.create({
     container: {
          flex: 1,
          backgroundColor: "#1C1C1C",
          paddingTop: 20,
     },
     header: {
          fontSize: 28,
          fontWeight: "bold",
          color: "#FCFCFC",
          paddingHorizontal: 20,
          paddingBottom: 16,
     },
     section: {
          marginHorizontal: 20,
     },
     item: {
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#3C3C3C",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
     },
     itemTitle: {
          fontSize: 18,
          color: "#FFFFFF",
     },
     itemDescription: {
          fontSize: 16,
          color: "#BBBBBB",
     },
});
