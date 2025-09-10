import React, { useState, useEffect } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Alert, 
    ActivityIndicator,
    SafeAreaView // SafeAreaView ekledik
} from 'react-native';
import { useKullanici } from '../context/KullaniciContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../src/config/api';
import BottomTabBar from '../components/BottomTabBar';

function AccountScreen(props) {
    // Context'ten kullanıcı bilgilerini al
    const { 
        kullaniciId, 
        setKullaniciId, 
        telefonNumarasi,
        setTelefonNumarasi,
        logout
    } = useKullanici();

    // Kullanıcı bilgileri için state
    const [kullaniciBilgileri, setKullaniciBilgileri] = useState({
        ad: '',
        soyad: '',
        telefon: telefonNumarasi || ''
    });
    const [yukleniyor, setYukleniyor] = useState(true);
    const [cikisYapiliyor, setCikisYapiliyor] = useState(false);

    // Kullanıcı profil bilgilerini çekme
    useEffect(() => {
        const profilBilgileriniGetir = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                
                const response = await fetch(`${API_URL}/auth/profile`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Profil bilgileri alınamadı');
                }

                const data = await response.json();
                
                // Full name'i parçalara ayır
                const nameParts = data.full_name ? data.full_name.split(' ') : [];
                
                setKullaniciBilgileri({
                    ad: nameParts[0] || '',
                    soyad: nameParts.slice(1).join(' ') || '',
                    telefon: data.phone || telefonNumarasi
                });
            } catch (error) {
                console.error("Profil bilgileri çekme hatası:", error);
                Alert.alert("Hata", "Profil bilgileri yüklenirken bir sorun oluştu.");
            } finally {
                setYukleniyor(false);
            }
        };

        profilBilgileriniGetir();
    }, []);

    // Adreslerim sayfasına yönlendirme
    function handleAdreslerimButton() {
        console.log("adreslerim butonuna tıklandı");
        props.navigation.navigate("Adreslerim");
    }

    // Siparişlerim sayfasına yönlendirme
    function handleSiparislerimButton() {
        console.log("siparişlerim butonuna tıklandı");
        props.navigation.navigate("Siparislerim");
    }

    // Çıkış yapma işlemi
    async function handleLogout() {
        Alert.alert(
          "Çıkış Yap",
          "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
          [
            {
              text: "İptal",
              style: "cancel"
            },
            {
              text: "Çıkış Yap",
              onPress: async () => {
                try {
                  setCikisYapiliyor(true);
                  
                  // Logout işleminin tamamlanmasını bekle
                  await logout();
                  
                  // Kısa bir gecikme ekleyin - context'in güncellenmesi için zaman tanıyın
                  setTimeout(() => {
                    try {
                      // props.navigation.navigate() yerine props.navigation.reset() kullanalım
                      props.navigation.reset({
                        index: 0,
                        routes: [{ name: 'Start' }],
                      });
                      
                      console.log("Çıkış yapıldı, Start ekranına yönlendirildi");
                    } catch (navError) {
                      console.error("Navigasyon hatası:", navError);
                      Alert.alert("Hata", "Çıkış sonrası sayfa yönlendirmesi başarısız oldu.");
                    }
                    setCikisYapiliyor(false);
                  }, 500); // Gecikmeyi 300ms'den 500ms'ye çıkaralım
                } catch (error) {
                  console.error("Çıkış yapılırken hata:", error);
                  Alert.alert("Hata", "Çıkış yapılırken bir hata oluştu.");
                  setCikisYapiliyor(false);
                }
              }
            }
          ]
        );
      }

    // Yükleniyor durumu
    if (yukleniyor || cikisYapiliyor) {
        return (
            <SafeAreaView style={styles.mainContainer}>
                <View style={styles.yuklemeContainer}>
                    <ActivityIndicator size="large" color="#007bff" />
                    <Text style={styles.yuklemeText}>
                        {cikisYapiliyor ? "Çıkış yapılıyor..." : "Profil bilgileri yükleniyor..."}
                    </Text>
                </View>
                {/* Bottom Tab Bar'ı her durumda göster */}
                <View style={styles.tabBarContainer}>
                    <BottomTabBar />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
                {/* Kullanıcı bilgileri kutusu */}
                <TouchableOpacity 
                    style={styles.kutu}
                    onPress={() => console.log("Profil düzenlemeye tıklandı")}
                >
                    <Text style={styles.kullaniciAdi}>
                        {kullaniciBilgileri.ad} {kullaniciBilgileri.soyad}
                    </Text>
                    <Text style={styles.telefon}>{kullaniciBilgileri.telefon}</Text>
                </TouchableOpacity>
                
                {/* Adreslerim kutusu */}
                <TouchableOpacity 
                    style={styles.kutu}
                    onPress={handleAdreslerimButton}
                >
                    <Text style={styles.menuBaslik}>Adreslerim</Text>
                </TouchableOpacity>
                
                {/* Siparişlerim kutusu */}
                <TouchableOpacity 
                    style={styles.kutu}
                    onPress={handleSiparislerimButton}
                >
                    <Text style={styles.menuBaslik}>Siparişlerim</Text>
                </TouchableOpacity>
                
                {/* Çıkış Yap butonu */}
                <TouchableOpacity 
                    style={styles.cikisButon}
                    onPress={handleLogout}
                    disabled={cikisYapiliyor}
                >
                    <Text style={styles.cikisText}>Çıkış Yap</Text>
                </TouchableOpacity>
            </View>
            
            {/* Bottom Tab Bar */}
            <View style={styles.tabBarContainer}>
                <BottomTabBar />
                
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        position: 'relative',
    },
    container: {
        flex: 1,
        padding: 20,
        paddingBottom: 80, // BottomTabBar için boşluk bırak
    },
    kutu: {
        backgroundColor: 'white',
        borderWidth: 0,
        borderColor: '#ddd',
        borderRadius: 15,
        padding: 18,
        marginVertical: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3
    },
    kullaniciAdi: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5
    },
    telefon: {
        fontSize: 16,
        color: '#666',
        marginTop: 5
    },
    menuBaslik: {
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
        fontWeight: '500'
    },
    cikisButon: {
        backgroundColor: '#FF4136', // Çıkış butonu için farklı bir kırmızı
        padding: 16,
        borderRadius: 25,
        marginTop: 'auto',
        marginBottom: 50,
        alignItems: 'center',
        shadowColor: "#FF4136",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 3
    },
    cikisText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    },
    yuklemeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8'
    },
    yuklemeText: {
        marginTop: 12,
        color: '#666',
        fontSize: 16
    },
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100
    },
    baslik: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
        color: '#333'
    },
    // Hesap Menü İtem Stilleri (Adreslerim ve Siparişlerim için)
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    menuItemIcon: {
        marginRight: 15,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center'
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    chevronIcon: {
        color: '#ccc'
    }
});



export default AccountScreen;