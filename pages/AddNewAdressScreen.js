import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import AdresSelector from '../components/AdressSelector';
import BottomTabBar from '../components/BottomTabBar';
import { API_URL } from '../src/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

function AddNewAdressScreen({ navigation, route }) {
    const [adresBilgileri, setAdresBilgileri] = useState({});
    const [isValid, setIsValid] = useState(false);
    const [loading, setLoading] = useState(false);

    // AdresSelector'dan gelen bilgileri güncelle
    function adresBilgileriniGuncelle(yeniBilgiler) {
        setAdresBilgileri(yeniBilgiler);
        setIsValid(yeniBilgiler.isValid);
    }

    // Adres bilgilerini temizle
    function adresiSil() {
        // Boş nesne ile güncelleme yap ki alt bileşen bunu algılayabilsin
        setAdresBilgileri({});
        console.log("Adres bilgileri silindi");
        
        // Geçerlilik durumunu sıfırla
        setIsValid(false);
    }

    // Adresi API'ye gönder ve kaydet
    async function adresiKaydet() {
        // Önce formu doğrula
        if (!adresBilgileri.validate || !adresBilgileri.validate()) {
            Alert.alert("Uyarı", "Lütfen tüm zorunlu alanları doldurun.");
            return;
        }

        if (!isValid) {
            Alert.alert("Uyarı", "Lütfen tüm zorunlu alanları doldurun.");
            return;
        }

        setLoading(true);

        try {
            const token = await AsyncStorage.getItem('userToken');
            
            console.log("Gönderilecek veriler:", JSON.stringify({
                title: adresBilgileri.title,
                city: adresBilgileri.city,
                district: adresBilgileri.district,
                neighborhood: adresBilgileri.neighborhood,
                street: adresBilgileri.street,
                address_detail: adresBilgileri.address_detail,
                is_default: adresBilgileri.is_default
            }));
            
            const response = await fetch(`${API_URL}/api/addresses`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: adresBilgileri.title,
                    city: adresBilgileri.city,
                    district: adresBilgileri.district,
                    neighborhood: adresBilgileri.neighborhood,
                    street: adresBilgileri.street,
                    address_detail: adresBilgileri.address_detail,
                    is_default: adresBilgileri.is_default
                })
            });

            const data = await response.json();
            
            setLoading(false);
            
            if (response.ok) {
                Alert.alert("Başarılı", "Adres başarıyla kaydedildi.");
                
                // Eğer ödeme sayfasından geldiyse, OdemeYap sayfasına geri dön
                if (route.params && route.params.returnToPayment) {
                    navigation.navigate("OdemeYap");
                } else {
                    // Aksi takdirde ana sayfaya yönlendir
                    navigation.navigate("Main");
                }
            } else {
                Alert.alert("Hata", data.error || "Adres eklenirken bir sorun oluştu.");
            }
        } catch (error) {
            setLoading(false);
            console.error('Adres kaydetme hatası:', error);
            Alert.alert("Hata", "Bir bağlantı sorunu oluştu. Lütfen tekrar deneyin.");
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardContainer}
            >
                <View style={styles.content}>
                    <AdresSelector 
                        adresBilgileri={adresBilgileri} 
                        onAdresChange={adresBilgileriniGuncelle} 
                    />
                </View>
                
                {/* Alt menü - TabBar için ayrı bir alan */}
                <View style={styles.bottomTabContainer}>
                    {/* BottomTabBar bileşeni buraya gelecek */}
                </View>
                
                {/* Butonlar - Sabit pozisyonda ve TabBar'ın üstünde */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={styles.deleteButton} 
                        onPress={adresiSil}
                    >
                        <Text style={styles.deleteButtonText}>Formu Temizle</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.saveButton, !isValid && styles.disabledButton]} 
                        onPress={adresiKaydet}
                        disabled={!isValid || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.saveButtonText}>Adresi Kaydet</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    keyboardContainer: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingBottom: 130, // Butonlar + TabBar için boşluk
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: '4%',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        position: 'absolute',
        bottom: 60, // BottomTabBar'ın üzerinde (60px yüksekliğinde)
        left: 0,
        right: 0,
        zIndex: 5, // TabBar'dan düşük ancak çoğu içerikten yüksek
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    deleteButton: {
        flex: 1,
        marginRight: '2%',
        backgroundColor: '#f8f8f8',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20, // Daha yuvarlak butonlar
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButtonText: {
        color: '#555',
        fontWeight: '500',
    },
    saveButton: {
        flex: 2,
        backgroundColor: '#FF6B00', // Turuncu tema rengi
        borderRadius: 20, // Daha yuvarlak butonlar
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
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
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    bottomTabContainer: {
        width: '100%',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        zIndex: 10, // En üstte olduğundan emin olmak için
    }
});

export default AddNewAdressScreen;