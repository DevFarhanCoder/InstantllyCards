// app/(main)/index.tsx
import { useEffect, useState } from "react";
import { View, FlatList, Text, TouchableOpacity } from "react-native";
import { api } from "@/lib/api";
import { useRouter } from "expo-router";

export default function Dashboard() {
  const r = useRouter();
  const [cards,setCards]=useState<any[]>([]);
  useEffect(()=>{ api("/cards").then(setCards).catch(console.warn); },[]);
  return (
    <View style={{ flex:1, padding:16 }}>
      <FlatList
        data={cards}
        keyExtractor={(x)=>x.id}
        renderItem={({item})=>(
          <TouchableOpacity onPress={()=>r.push(`/card/${item.id}`)} style={{ padding:16, borderWidth:1, borderRadius:12, marginBottom:12 }}>
            <Text style={{ fontWeight:"600" }}>{item.title}</Text>
            <Text numberOfLines={1}>{item.subtitle}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
