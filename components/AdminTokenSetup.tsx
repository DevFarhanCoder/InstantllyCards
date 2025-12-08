import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * TEMPORARY COMPONENT: Admin Token Setup
 * 
 * Usage:
 * 1. Add this component to your app temporarily (e.g., in the Ads tab)
 * 2. Paste your admin token from the web dashboard
 * 3. Click "Save Token"
 * 4. Remove this component after setup
 */
export default function AdminTokenSetup() {
  const [token, setToken] = useState('');
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  const checkCurrentToken = async () => {
    const existing = await AsyncStorage.getItem('adminAuthToken');
    setCurrentToken(existing);
  };

  const saveToken = async () => {
    if (!token.trim()) {
      Alert.alert('Error', 'Please enter a token');
      return;
    }

    try {
      await AsyncStorage.setItem('adminAuthToken', token.trim());
      Alert.alert('Success', '✅ Admin token saved successfully!\n\nYou can now create advertisements.');
      setToken('');
      checkCurrentToken();
    } catch (error) {
      Alert.alert('Error', 'Failed to save token: ' + error);
    }
  };

  const clearToken = async () => {
    try {
      await AsyncStorage.removeItem('adminAuthToken');
      Alert.alert('Success', 'Admin token cleared');
      setCurrentToken(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to clear token: ' + error);
    }
  };

  React.useEffect(() => {
    checkCurrentToken();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Admin Token Setup</Text>
      <Text style={styles.instructions}>
        1. Login to web dashboard{'\n'}
        2. Open browser console (F12){'\n'}
        3. Run: localStorage.getItem('authToken'){'\n'}
        4. Copy and paste the token below
      </Text>

      {currentToken ? (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>✅ Token is set</Text>
          <Text style={styles.tokenPreview}>
            {currentToken.substring(0, 20)}...{currentToken.substring(currentToken.length - 10)}
          </Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearToken}>
            <Text style={styles.clearButtonText}>Clear Token</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            value={token}
            onChangeText={setToken}
            placeholder="Paste admin token here"
            multiline
            numberOfLines={3}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity style={styles.button} onPress={saveToken}>
            <Text style={styles.buttonText}>Save Token</Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.note}>
        ⚠️ After saving the token once, you can remove this component from your app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3CD',
    borderWidth: 2,
    borderColor: '#FFC107',
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 12,
  },
  instructions: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 16,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    fontSize: 12,
    fontFamily: 'monospace',
    minHeight: 80,
  },
  button: {
    backgroundColor: '#FFC107',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: '#D4EDDA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statusText: {
    color: '#155724',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tokenPreview: {
    color: '#155724',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: '#DC3545',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    fontSize: 11,
    color: '#856404',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
