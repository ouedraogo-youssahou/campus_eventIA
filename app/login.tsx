import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Input, Button } from '../components';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    const user = await login(email, password);
    
    if (user) {
      // Rediriger selon le rôle
      if (user.role === 'admin') {
        router.replace('/admin/events');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      setError('Email ou mot de passe incorrect');
    }
    
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>CampusEvents AI</Text>
            <Text style={styles.subtitle}>Connexion</Text>
            
            <View style={styles.form}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="admin@campus.ma ou etudiant@campus.ma"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <Input
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                placeholder="admin123 ou etudiant123"
                secureTextEntry
              />
              
              {error ? <Text style={styles.error}>{error}</Text> : null}
              
              <Button
                title="Se connecter"
                onPress={handleLogin}
                loading={loading}
                style={styles.button}
              />
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Comptes de test</Text>
              <Text style={styles.infoText}>Admin: admin@campus.ma / admin123</Text>
              <Text style={styles.infoText}>Étudiant: etudiant@campus.ma / etudiant123</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center'
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  error: {
    color: '#e74c3c',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center'
  },
  button: {
    marginTop: 8
  },
  infoSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#e8f4fd',
    borderRadius: 8
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4
  }
});
