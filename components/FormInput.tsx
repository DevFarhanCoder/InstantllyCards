import React from "react";
import { TextInput, StyleSheet, TextInputProps } from "react-native";

export default React.memo(function FormInput(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      style={[styles.input, props.style]}
      placeholderTextColor="#9CA3AF"
      autoCorrect={false}
      autoComplete="off"
      blurOnSubmit={false}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
});
