import React, { useState, useEffect } from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, ActivityIndicator, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import StartScreen from './pages/StartScreen';
import UserLoginScreen from './pages/UserLoginScreen';
import VerficationScreen from './pages/VerficationScreen';
import UserRegisterScreen from './pages/UserRegisterScreen';
import AddNewAdressScreen from './pages/AddNewAdressScreen';
import MainScreen from './pages/MainScreen';
import UserProductDetailScreen from './pages/UserProductDetailScreen';
import UserAddToCardScreen from './pages/UserAddToCardScreen';
import UserPaymentScreen from './pages/UserPaymentScreen';
import UserPaymentResultScreen from './pages/UserPaymentResultScreen';
import BottomTabBar from "./components/BottomTabBar";
import AccountScreen from "./pages/AccountScreen";
import UserMyAdressScreen from "./pages/UserMyAdressScreen";
import UserMyOrdersScreen from './pages/UserMyOrdersScreen';
import WorkingHoursCheckScreen from './pages/WorkingHoursCheckScreen';
import { KullaniciProvider, useKullanici } from './context/KullaniciContext';
import { API_URL } from './src/config/api';

function AppNavigator() {
  const Stack = createStackNavigator();
  const { kullaniciId, setKullaniciId, setTelefonNumarasi, isLoggedIn } = useKullanici();
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState(null);
  const [isOutsideWorkingHours, setIsOutsideWorkingHours] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  // Çalışma saatlerini kontrol et
  const checkWorkingHours = async () => {
    try {
      console.log("Çalışma saatleri kontrol ediliyor...");
      const response = await fetch(`${API_URL}/api/restaurant-hours/check`);
      const data = await response.json();
      
      if (response.ok) {
        console.log("Çalışma saati kontrolü sonucu:", data.is_open ? "AÇIK" : "KAPALI");
        setIsOutsideWorkingHours(!data.is_open);
      } else {
        console.log("Çalışma saati API'sine erişilemedi, varsayılan olarak AÇIK");
        // API erişilemiyorsa varsayılan olarak açık kabul et
        setIsOutsideWorkingHours(false);
      }
    } catch (error) {
      console.error('Çalışma saatleri kontrolünde hata:', error);
      // Hata durumunda da varsayılan olarak açık kabul et
      setIsOutsideWorkingHours(false);
    }
  };

  useEffect(() => {
    // AppState'i dinle
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // Uygulama arka plandan ön plana geçtiğinde çalışma saatlerini kontrol et
        console.log("Uygulama ön plana geçti, çalışma saatleri kontrol ediliyor...");
        checkWorkingHours();
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // Çalışma saatlerini kontrol et
        await checkWorkingHours();
        
        const token = await AsyncStorage.getItem('userToken');
        const userId = await AsyncStorage.getItem('userId');
        const telefon = await AsyncStorage.getItem('telefonNumarasi');
        
        console.log('Token kontrolü:', {
          token: !!token, 
          userId: !!userId
        });
        
        // Token ve userId var mı diye daha detaylı kontrol
        if (token && userId) {
          setKullaniciId(userId);
          if (telefon) setTelefonNumarasi(telefon);
          setInitialRoute('Main');
        } else {
          setInitialRoute('Start');
        }
      } catch (error) {
        console.log('Token kontrolünde hata:', error);
        setInitialRoute('Start');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkLoginStatus();
    
    // Uygulama aktifken periyodik olarak çalışma saatlerini kontrol et
    const intervalId = setInterval(() => {
      checkWorkingHours();
    }, 10000); // Her dakika kontrol et
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Uygulama durumunu izleme
  useEffect(() => {
    // isLoggedIn değiştiğinde ekran değişimini kontrol et
    console.log("Giriş durumu değişti:", isLoggedIn);
  }, [isLoggedIn]);
  
  if (isLoading || !initialRoute) {
    // Yükleme ekranı göster
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }
  
  // Eğer çalışma saatleri dışındaysa
  if (isOutsideWorkingHours) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <WorkingHoursCheckScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={initialRoute} 
          screenOptions={{
            headerTitleAlign: 'center',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        >
          <Stack.Screen 
            name='Start' 
            component={StartScreen}  
            options={{ 
              title: 'Hoş Geldiniz',
              headerLeft: () => null,
              gestureEnabled: false
            }}
          />
          <Stack.Screen name='Login' component={UserLoginScreen} options={{ title: 'Giriş' }} />
          <Stack.Screen name='Register' component={UserRegisterScreen} options={{ title: 'Kayıt Ol' }} />
          <Stack.Screen name='Verification' component={VerficationScreen} options={{ title: 'Doğrulama' }} />
          <Stack.Screen name="UyeOlmadanDevam" component={AddNewAdressScreen} options={{ title: 'Adres Ekle' }} />
          
          <Stack.Screen 
            name="Main" 
            component={MainScreen}  
            options={{ headerShown: false }} 
          />
          <Stack.Screen
            name="UserProductDetail"
            component={UserProductDetailScreen}
            options={{ title: 'Ürün Detayı' }}
          />
          <Stack.Screen 
            name="Sepet" 
            component={UserAddToCardScreen} 
            options={{ title: 'Sepetim' }}
          />
          <Stack.Screen 
            name='Hesap' 
            component={AccountScreen} 
            options={{ title: 'Hesabım' }}
          />
          <Stack.Screen 
            name="OdemeYap" 
            component={UserPaymentScreen} 
            options={{ title: 'Ödeme' }}
          />
          <Stack.Screen 
            name="SiparisTamamla" 
            component={UserPaymentResultScreen} 
            options={{ title: 'Sipariş Sonucu' }}
          />
          <Stack.Screen 
            name="Adreslerim" 
            component={UserMyAdressScreen} 
            options={{ title: 'Adreslerim' }}
          />
          <Stack.Screen 
            name="YeniAdres" 
            component={AddNewAdressScreen} 
            options={{ title: 'Yeni Adres' }}
          />
          <Stack.Screen 
            name="GirisYap" 
            component={VerficationScreen} 
            options={{ title: 'Giriş Yap' }}
          />
          <Stack.Screen 
            name="Siparislerim" 
            component={UserMyOrdersScreen} 
            options={{ title: 'Siparişlerim' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KullaniciProvider>
          <AppNavigator />
        </KullaniciProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8'
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16
  }
});

export default App;