import React from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Application from "expo-application";
import Slider from "@react-native-community/slider"; // [추가]
import { useSettings } from "../contexts/SettingsContext"; // [추가]

export default function SettingsScreen() {
     const { soundEffectsVolume, setSoundEffectsVolume } = useSettings(); // [추가]

     const openLink = async (url: string) => {
          // ... (기존과 동일)
     };

     return (
          <View style={styles.container}>
               <View style={styles.section}>
                    {/* [추가] 효과음 볼륨 조절 섹션 */}
                    <Text style={styles.sectionTitle}>사운드 설정</Text>
                    <View style={styles.item}>
                         <Text style={styles.itemTitle}>효과음 볼륨</Text>
                         <Text style={styles.itemDescription}>{Math.round(soundEffectsVolume * 100)}%</Text>
                    </View>
                    <Slider
                         style={{ width: "100%", height: 40, marginBottom: 10 }}
                         minimumValue={0}
                         maximumValue={1}
                         step={0.05}
                         value={soundEffectsVolume}
                         onValueChange={setSoundEffectsVolume}
                         minimumTrackTintColor="#FFFFFF"
                         maximumTrackTintColor="#555555"
                         thumbTintColor="#FFFFFF"
                    />
               </View>

               <View style={styles.section}>
                    <Text style={styles.sectionTitle}>앱 정보</Text>
                    <Pressable style={styles.item} onPress={() => openLink("https://...")}>
                         <Text style={styles.itemTitle}>개인정보처리 방침</Text>
                         <MaterialIcons name="chevron-right" size={24} color="#BBBBBB" />
                    </Pressable>
                    <Pressable style={styles.item} onPress={() => openLink("https://...")}>
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
     container: { flex: 1, backgroundColor: "#1C1C1C", paddingTop: 20 },
     section: { marginHorizontal: 20, marginBottom: 20 },
     sectionTitle: {
          fontSize: 14,
          fontWeight: "bold",
          color: "#888888",
          marginBottom: 8,
          textTransform: "uppercase",
     },
     item: {
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#3C3C3C",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
     },
     itemTitle: { fontSize: 18, color: "#FFFFFF" },
     itemDescription: { fontSize: 16, color: "#BBBBBB" },
});
