import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useKullanici } from '../context/KullaniciContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../src/config/api';

function VerificationScreen(props) {
  const { ad, soyad, telefonNumarasi, purpose, login } = useKullanici();
  const [girilenKod, setGirilenKod] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hataMesaji, setHataMesaji] = useState('');
  const [timer, setTimer] = useState(60);
  const [storedPhone, setStoredPhone] = useState(telefonNumarasi);

  useEffect(() => {
    const fetchPhone = async () => {
      const phone = await AsyncStorage.getItem('telefonNumarasi');
      if (phone && !telefonNumarasi) setStoredPhone(phone);
    };
    fetchPhone();
  }, [telefonNumarasi]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleKodDegisikligi = (text) => {
    setGirilenKod(text);
    setHataMesaji('');
  };

  const handleVerify = async () => {
    if (!girilenKod || girilenKod.length < 6) {
      setHataMesaji("Lütfen geçerli bir doğrulama kodu girin");
      return;
    }
    setYukleniyor(true);
    try {
      const telefon = telefonNumarasi || storedPhone;
      if (!telefon) {
        setHataMesaji("Telefon numarası bulunamadı.");
        props.navigation.navigate('Login');
        return;
      }
      const response = await fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: telefon, code: girilenKod, purpose: purpose, name: ad, surname: soyad })
      });
      const data = await response.json();
      if (response.ok) {
        if (!data.token || !data.user_id) throw new Error("Eksik veri döndü.");
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userId', String(data.user_id));
        await AsyncStorage.setItem('isLoggedIn', 'true');
        if (data.user_type) await AsyncStorage.setItem('userType', data.user_type);
        
        // Context'i güncelle - login fonksiyonunu kullan
        await login(data.token, data.user_id, data.user_type, ad, soyad, telefon);
        
        // Kısa bir gecikme ekleyin
        setTimeout(() => {
          props.navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }, 100);
      } else {
        setHataMesaji(data.message || "Doğrulama başarısız oldu");
      }
    } catch (error) {
      console.error("Doğrulama hatası:", error);
      setHataMesaji("Bağlantı hatası veya geçersiz kod.");
    } finally {
      setYukleniyor(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.dogrulamaKutusu}>
        <Text style={styles.baslik}>Doğrulama Kodu</Text>
        <Text style={styles.aciklama}>
          {telefonNumarasi || storedPhone} numaralı telefonunuza 
          gönderilen 6 haneli doğrulama kodunu girin
        </Text>

        <TextInput
          style={styles.input}
          onChangeText={handleKodDegisikligi}
          value={girilenKod}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="6 haneli kod"
          editable={!yukleniyor}
        />

        {hataMesaji ? <Text style={styles.hataMetni}>{hataMesaji}</Text> : null}

        <TouchableOpacity
          style={[styles.dogrulamaButonu, yukleniyor && styles.disabledButton]}
          onPress={handleVerify}
          disabled={yukleniyor || !girilenKod || girilenKod.length < 6}
        >
          {yukleniyor ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.dogrulamaButonMetni}>Doğrula</Text>
          )}
        </TouchableOpacity>

        <View style={styles.tekrarGonderContainer}>
          <TouchableOpacity
            disabled={timer > 0 || yukleniyor}
          >
            <Text style={[
              styles.tekrarGonderMetni,
              (timer > 0 || yukleniyor) && styles.disabledText
            ]}>
              {timer <= 0 ? "Süre bitti" : `Kalan süre: ${timer}s`}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.geriButton}
          onPress={() => props.navigation.goBack()}
          disabled={yukleniyor}
        >
          <Text style={styles.geriButtonMetni}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: '5%'
  },
  dogrulamaKutusu: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 15, // Daha yuvarlak kenarlar
    padding: '7%', // Biraz daha fazla iç boşluk
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  baslik: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '4%',
    color: '#FF6B00' // Turuncu tema rengi
  },
  aciklama: {
    textAlign: 'center',
    marginBottom: '6%',
    color: '#666',
    fontSize: 14,
    lineHeight: 20
  },
  input: {
    minHeight: 55,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: '6%',
    backgroundColor: '#fff',
    fontWeight: 'bold'
  },
  hataMetni: {
    color: '#FF3B30', // Daha modern bir hata rengi
    textAlign: 'center',
    marginBottom: '4%',
    fontSize: 14
  },
  dogrulamaButonu: {
    backgroundColor: '#FF6B00', // Turuncu tema rengi
    minHeight: 55,
    borderRadius: 25, // Daha yuvarlak buton
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '4%',
    shadowColor: "#FF6B00",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0.1
  },
  dogrulamaButonMetni: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  tekrarGonderContainer: {
    marginTop: '6%',
    alignItems: 'center'
  },
  tekrarGonderMetni: {
    color: '#FF6B00', // Turuncu tema rengi
    fontSize: 14,
    fontWeight: '500'
  },
  disabledText: {
    color: '#999'
  },
  geriButton: {
    marginTop: '6%',
    alignItems: 'center',
    padding: 10
  },
  geriButtonMetni: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500'
  }
});
export default VerificationScreen;