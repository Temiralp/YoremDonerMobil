import React, { useState, useEffect } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    ActivityIndicator,
    FlatList
} from 'react-native';
import { useKullanici } from '../context/KullaniciContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../src/config/api';
import moment from 'moment';

function UserMyOrdersScreen() {
    const { userToken } = useKullanici();
    const [siparisler, setSiparisler] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);

    // Sipariş durumu için Türkçe çeviriler
    const durumCevirici = {
        'pending': 'Beklemede',
        'preparing': 'Hazırlanıyor',
        'on_the_way': 'Yolda',
        'delivered': 'Teslim Edildi',
        'cancelled': 'İptal Edildi'
    };

    // Sipariş durumu için renk
    const durumRengi = {
        'pending': '#FFA500', 
        'preparing': '#1E90FF', 
        'on_the_way': '#4169E1', 
        'delivered': '#2E8B57', 
        'cancelled': '#DC143C'
    };

    useEffect(() => {
        siparisleriGetir();
    }, []);

    const siparisleriGetir = async () => {
        try {
            setYukleniyor(true);

            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setYukleniyor(false);
                return;
            }

            const response = await fetch(`${API_URL}/api/orders`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const responseData = await response.json();

            // Siparişleri tarihe göre sırala (en yeni önce)
            const siralanmisSiparisler = responseData.data.sort((a, b) => 
                new Date(b.order_time) - new Date(a.order_time)
            );

            setSiparisler(siralanmisSiparisler);
        } catch (error) {
            console.error('Siparişleri getirme hatası:', error);
        } finally {
            setYukleniyor(false);
        }
    };

    const renderSiparis = ({ item: siparis }) => (
        <View style={styles.siparisKarti}>
            <View style={styles.siparisBaslik}>
                <Text style={styles.siparisNumarasi}>Sipariş #{siparis.id}</Text>
                <View 
                    style={[
                        styles.durumEtiketi, 
                        { backgroundColor: durumRengi[siparis.order_status] }
                    ]}
                >
                    <Text style={styles.durumEtiketiText}>
                        {durumCevirici[siparis.order_status] || siparis.order_status}
                    </Text>
                </View>
            </View>
            
            <View style={styles.siparisBilgileri}>
                <Text style={styles.tarih}>
                    {moment(siparis.order_time).format('DD.MM.YYYY HH:mm')}
                </Text>
                <Text style={styles.toplamTutar}>
                    Toplam: {parseFloat(siparis.total_amount).toFixed(2)} TL
                </Text>
            </View>
        </View>
    );

    if (yukleniyor) {
        return (
            <View style={styles.merkezKapsayici}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.yukleniyorText}>Siparişler yükleniyor...</Text>
            </View>
        );
    }

    if (siparisler.length === 0) {
        return (
            <View style={styles.merkezKapsayici}>
                <Text style={styles.bosListeText}>Henüz siparişiniz bulunmamaktadır.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sayfaBasligi}></Text>
            
            <FlatList
                data={siparisler}
                renderItem={renderSiparis}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        position: 'relative',
    },
    sayfaBasligi: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 15,
        color: '#333'
    },
    merkezKapsayici: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f8f8',
    },
    yukleniyorText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666'
    },
    bosListeText: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        marginHorizontal: 30,
        lineHeight: 24
    },
    listContainer: {
        padding: 12,
        paddingBottom: 80 // Bottom tab bar için alan
    },
    siparisKarti: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
        marginHorizontal: 2
    },
    siparisBaslik: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 10
    },
    siparisNumarasi: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    durumEtiketi: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20
    },
    durumEtiketiText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12
    },
    siparisBilgileri: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    tarih: {
        color: '#666',
        fontSize: 14
    },
    toplamTutar: {
        fontWeight: 'bold',
        color: '#FF6B00',
        fontSize: 15
    },
    // Tab Bar için Container
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100
    }
});

export default UserMyOrdersScreen;