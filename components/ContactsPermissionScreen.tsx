import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";


export default function PermissionScreen({ retry, permanentlyDenied }: any) {

  async function openSettings() {
    Linking.openSettings();
  }


  return (
    <View style={s.container}>
      <Ionicons name="people" size={80} color="#007aff" style={{ marginBottom: 20 }} />

      <Text style={s.title}>Allow Contacts Access</Text>
      <Text style={s.desc}>
        We use your phone contacts to help you find people already using our app.
        We never upload anything without your permission.
      </Text>

      {/* show Retry only if user can ask again */}
      {!permanentlyDenied && (
        <TouchableOpacity style={s.btnAllow} onPress={retry}>
          <Text style={s.btnText}>Allow Contacts</Text>
        </TouchableOpacity>
      )}

      {/* show settings ALWAYS */}
      <TouchableOpacity style={s.btnSettings} onPress={openSettings}>
        <Text style={s.btnSettingsText}>
          {permanentlyDenied ? "Enable in Settings" : "Open Settings"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  desc: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  btnAllow: {
    backgroundColor: "#007aff",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginBottom: 10,
  },
  btnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  btnSettings: {
    paddingVertical: 10,
    marginTop: 10,
  },
  btnSettingsText: {
    color: "#007aff",
    fontSize: 15,
    fontWeight: "600",
  },
});
