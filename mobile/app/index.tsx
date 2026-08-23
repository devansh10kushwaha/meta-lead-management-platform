import { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { io } from "socket.io-client";

const BACKEND_URL = "http://192.168.1.5:3000";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_time: string;
};

export default function HomeScreen() {
  const [connected, setConnected] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL);

    socket.on("connect", () => {
      console.log("Connected to backend:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from backend");
      setConnected(false);
    });

    socket.on("new_lead", (newLead: Lead) => {
      console.log("New lead received:", newLead);
      setLead(newLead);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Meta Lead Monitor</Text>

      <Text style={connected ? styles.connected : styles.disconnected}>
        {connected
          ? "🟢 Connected to Backend"
          : "🔴 Disconnected from Backend"}
      </Text>

      {lead && (
        <View style={styles.leadCard}>
          <Text style={styles.leadTitle}>New Lead</Text>

          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{lead.name}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{lead.email}</Text>

          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{lead.phone}</Text>

          <Text style={styles.label}>Created Time</Text>
          <Text style={styles.value}>{lead.created_time}</Text>
        </View>
      )}

      {!lead && (
        <Text style={styles.waiting}>
          Waiting for new leads...
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  connected: {
    fontSize: 18,
    marginBottom: 30,
  },

  disconnected: {
    fontSize: 18,
    color: "red",
    marginBottom: 30,
  },

  waiting: {
    fontSize: 18,
    marginTop: 20,
  },

  leadCard: {
    width: "100%",
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
  },

  leadTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
  },

  value: {
    fontSize: 17,
    marginTop: 4,
  },
});