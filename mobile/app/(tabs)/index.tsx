import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { io } from "socket.io-client";

const SOCKET_URL = "http://192.168.1.5:3000";

export default function HomeScreen() {
  const [connected, setConnected] = useState(false);
  const [lead, setLead] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("connect", () => {
      console.log("Connected to backend:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from backend");
      setConnected(false);
    });

    socket.on("new_lead", (data) => {
      console.log("New lead received:", data);
      setLead(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meta Lead Monitor</Text>

      <Text style={connected ? styles.connected : styles.disconnected}>
        {connected
          ? "🟢 Connected to Backend"
          : "🔴 Disconnected from Backend"}
      </Text>

      {lead && (
        <View style={styles.leadBox}>
          <Text style={styles.leadTitle}>New Lead</Text>
          <Text selectable>{JSON.stringify(lead, null, 2)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  connected: {
    fontSize: 18,
  },

  disconnected: {
    fontSize: 18,
  },

  leadBox: {
    marginTop: 30,
    padding: 20,
    borderWidth: 1,
    borderRadius: 10,
    width: "100%",
  },

  leadTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
});