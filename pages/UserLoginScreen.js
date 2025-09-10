import React, { use, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { useKullanici } from '../context/KullaniciContext';
import { API_URL } from '../src/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

function UserLoginScreen(props) {
  const {setTelefonNumarasi, setKullaniciId } = useKullanici();
  const {purpose,setPurpose} = useKullanici();
  const [telefonNoGirdi, setTelefonNoGirdi] = useState('');
  const [loading, setLoading] = useState(false);
  const [hataVar, setHataVar] = useState(false);
  const [hataMesaji, setHataMesaji] = useState('');

  function handleChangeText(text) {
    setTelefonNoGirdi(text);
    setHataVar(false); // Kullanıcı yeni giriş yaparken hatayı temizle
  }

  async function handleLogin() {
    if (!telefonNoGirdi.trim()) {
      setHataVar(true);
      setHataMesaji('Lütfen telefon numaranızı girin');
      return;
    }

    if (telefonNoGirdi.length !== 10) {
      setHataVar(true);
      setHataMesaji('Telefon numarası 10 haneli olmalıdır');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: telefonNoGirdi }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login başarılı
        console.log('Login başarılı:', data);
        
        // Tokeni ve kullanıcı ID'sini kaydet
       // await AsyncStorage.setItem('userToken', data.token);
        //await AsyncStorage.setItem('userId', data.user.id.toString());
        
        // Context'e telefon ve ID bilgisini kaydet
        setTelefonNumarasi(telefonNoGirdi);
        setPurpose("login");
      // setKullaniciId(data.user.id.toString());
         // Telefon numarasını AsyncStorage'a kaydet
  await AsyncStorage.setItem('telefonNumarasi', telefonNoGirdi);
  setTelefonNumarasi(telefonNoGirdi);
        // Doğrulama ekranına yönlendir
        props.navigation.navigate('GirisYap');
      } else {
        // Login başarısız
        setHataVar(true);
        setHataMesaji(data.message || 'Giriş yapılamadı');
      }
    } catch (error) {
      console.error('Login error:', error);
      setHataVar(true);
      setHataMesaji('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>Giriş Yap</Text>

        <Text style={styles.label}>Telefon Numarası</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.prefixText}>0</Text>
          <TextInput
            style={styles.input}
            onChangeText={handleChangeText}
            placeholder="5XX XXX XX XX"
            keyboardType="phone-pad"
            value={telefonNoGirdi}
            maxLength={10}
          />
        </View>
        
        {hataVar && (
          <Text style={styles.hataMesaji}>{hataMesaji}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.loginButton,
            (loading || !telefonNoGirdi || telefonNoGirdi.length !== 10) && styles.disabledButton
          ]}
          onPress={handleLogin}
          disabled={loading || !telefonNoGirdi || telefonNoGirdi.length !== 10}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => props.navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '5%',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: '8%',
    color: '#FF6B00', // Turuncu tema rengi
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    alignSelf: 'flex-start',
    marginLeft: '10%',
    marginBottom: '1.5%',
    color: '#555',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: '4%',
    backgroundColor: 'white',
  },
  prefixText: {
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#666',
  },
  input: {
    flex: 1,
    minHeight: 50,
    padding: 10,
    fontSize: 16,
  },
  hataMesaji: {
    color: '#FF3B30', // Daha modern bir hata rengi
    marginBottom: '5%',
    alignSelf: 'flex-start',
    marginLeft: '10%',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#FF6B00', // Turuncu tema rengi
    paddingVertical: 15,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    marginTop: '5%',
    shadowColor: "#FF6B00",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: '5%',
    padding: 10,
  },
  backButtonText: {
    color: '#FF6B00', // Turuncu tema rengi
    fontSize: 14,
    fontWeight: '500',
  }
});

export default UserLoginScreen;