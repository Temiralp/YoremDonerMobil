import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity
} from 'react-native';

function UserPaymentResultScreen(props) {
    // Route'dan gelen parametreleri al
    const { islemDurumu, siparisDetaylari } = props.route.params || {};
    
    // Debug log
    console.log("Route parametreleri:", {
        islemDurumu,
        siparisDetaylari: JSON.stringify(siparisDetaylari, null, 2)
    });

    // Başarılı ekranı
    const BasariliEkrani = () => (
        <View style={styles.sonucContainer}>
            <View style={styles.iconContainer}>
                <Text style={styles.iconText}>✓</Text>
            </View>
            <Text style={styles.baslikText}>Siparişiniz Alındı!</Text>
            <Text style={styles.aciklamaText}>
                Siparişiniz başarıyla alındı. Siparişiniz hazırlanıyor ve en kısa sürede adresinize teslim edilecek.
            </Text>
            
            <View style={styles.siparisOzetiContainer}>
                <Text style={styles.ozetBaslik}>Sipariş Özeti</Text>
                <Text style={styles.ozetDetay}>Sipariş ID: {siparisDetaylari?.siparisId || '-'}</Text>
                <Text style={styles.ozetDetay}>Toplam Tutar: {siparisDetaylari?.toplamTutar || '0'} TL</Text>
                <Text style={styles.ozetDetay}>
                    Ödeme Yöntemi: {
                        siparisDetaylari?.odemeYontemi === 'cash' 
                            ? 'Kapıda Nakit Ödeme' 
                            : 'Kapıda Kredi Kartı ile Ödeme'
                    }
                </Text>
                <Text style={styles.ozetDetay}>Tarih: {siparisDetaylari?.siparisTarihi || '-'}</Text>
                <Text style={styles.ozetDetay}>Adres: {siparisDetaylari?.adres || '-'}</Text>
            </View>
            
            <TouchableOpacity 
                style={styles.buton}
                onPress={() => props.navigation.navigate('Main')}
            >
                <Text style={styles.butonText}>Ana Sayfaya Dön</Text>
            </TouchableOpacity>
        </View>
    );

    // Başarısız ekranı
    const BasarisizEkrani = () => (
        <View style={styles.sonucContainer}>
            <View style={[styles.iconContainer, styles.hataIcon]}>
                <Text style={styles.iconText}>✗</Text>
            </View>
            <Text style={[styles.baslikText, styles.hataText]}>İşlem Başarısız!</Text>
            <Text style={styles.aciklamaText}>
                Siparişiniz işlenirken bir hata oluştu. Lütfen tekrar deneyiniz veya müşteri hizmetleri ile iletişime geçiniz.
            </Text>
            
            <TouchableOpacity 
                style={styles.buton}
                onPress={() => props.navigation.goBack()}
            >
                <Text style={styles.butonText}>Tekrar Dene</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.buton, styles.ikinciButon]}
                onPress={() => props.navigation.navigate('Main')}
            >
                <Text style={styles.butonText}>Ana Sayfaya Dön</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.ilerlemeBari}>
                <View style={styles.ilerlemeAdimlari}>
                    <Text style={styles.ilerlemeTextPasif}>SEPETİM</Text>
                </View>
                <View style={styles.ilerlemeAdimlari}>
                    <Text style={styles.ilerlemeTextPasif}>ONAY</Text>
                </View>
                <View style={[styles.ilerlemeAdimlari, styles.aktifAdim]}>
                    <Text style={styles.ilerlemeTextAktif}>SONUÇ</Text>
                </View>
            </View>
            
            {islemDurumu === 'basarili' ? <BasariliEkrani /> : <BasarisizEkrani />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    ilerlemeBari: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: '4%',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    ilerlemeAdimlari: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
    },
    aktifAdim: {
        borderWidth: 2,
        borderColor: '#FF6B00', // Turuncu tema rengi
        borderRadius: 5,
    },
    ilerlemeTextAktif: {
        fontWeight: 'bold',
        color: '#FF6B00', // Turuncu tema rengi
    },
    ilerlemeTextPasif: {
        color: '#666',
    },
    sonucContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5%',
    },
    iconContainer: {
        width: '20%',
        aspectRatio: 1, // Kare oran
        borderRadius: 50, // Dairesel
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '5%',
        shadowColor: "#4CAF50",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
        elevation: 5,
    },
    hataIcon: {
        backgroundColor: '#FF3B30', // Daha modern bir hata rengi
        shadowColor: "#FF3B30",
    },
    iconText: {
        color: '#fff',
        fontSize: 40,
    },
    baslikText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: '4%',
        color: '#4CAF50',
        textAlign: 'center',
    },
    hataText: {
        color: '#FF3B30', // Daha modern bir hata rengi
    },
    aciklamaText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: '7%',
        color: '#666',
    },
    siparisOzetiContainer: {
        width: '100%',
        padding: '5%',
        backgroundColor: '#fff',
        borderRadius: 15, // Daha yuvarlak kenarlar
        marginBottom: '7%',
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 2,
    },
    ozetBaslik: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: '4%',
        color: '#333',
    },
    ozetDetay: {
        fontSize: 15,
        color: '#444',
        marginBottom: '2%',
    },
    buton: {
        backgroundColor: '#FF6B00', // Turuncu tema rengi
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25, // Daha yuvarlak butonlar
        width: '100%',
        alignItems: 'center',
        shadowColor: "#FF6B00",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
        elevation: 5,
    },
    ikinciButon: {
        backgroundColor: '#757575', // Gri ton
        marginTop: '3%',
        shadowColor: "#757575",
    },
    butonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default UserPaymentResultScreen;