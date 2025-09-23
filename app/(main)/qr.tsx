// app/(main)/qr.tsx
import { View } from "react-native";
import QRCode from 'react-native-qrcode-svg'; // npm i react-native-qrcode-svg
export default function QR() {
  const url = "https://www.instantllycards.com/u/your-handle";
  return <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
    <QRCode value={url} size={220} />
  </View>;
}
