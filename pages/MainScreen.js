import React, { useState, useEffect, useRef } from 'react';
import BottomTabBar from '../components/BottomTabBar';
import { API_URL } from '../src/config/api';
import { 
    View, 
    Text, 
    StyleSheet, 
    Image, 
    Dimensions, 
    FlatList, 
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';

const { width } = Dimensions.get('window');

function MainScreen({ navigation }) {
    const [kategoriler, setKategoriler] = useState([]);
    const [secilenKategori, setSecilenKategori] = useState(null);
    const [urunler, setUrunler] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [urunlerYukleniyor, setUrunlerYukleniyor] = useState(false);
    const [hata, setHata] = useState(null);
    const [backendCalisiyor, setBackendCalisiyor] = useState(true);
    const [sliderlar, setSliderlar] = useState([]);
    const [currentSliderIndex, setCurrentSliderIndex] = useState(0);
    const scrollViewRef = useRef(null);

    useEffect(() => {
        kategorileriGetir();
        sliderlariGetir();
    }, []);

    useEffect(() => {
        if (sliderlar.length > 1) {
            const sliderInterval = setInterval(() => {
                const nextIndex = (currentSliderIndex + 1) % sliderlar.length;
                setCurrentSliderIndex(nextIndex);
                if (scrollViewRef.current) {
                    scrollViewRef.current.scrollTo({
                        x: nextIndex * width,
                        animated: true
                    });
                }
            }, 5000);
            return () => clearInterval(sliderInterval);
        }
    }, [sliderlar, currentSliderIndex]);

    useEffect(() => {
        if (secilenKategori) {
            urunleriGetir(secilenKategori.id);
        }
    }, [secilenKategori]);

    const sliderlariGetir = async () => {
        try {
            const response = await fetch(`${API_URL}/api/sliders`);
            if (!response.ok) throw new Error(`Sliderlar alınamadı. HTTP Kodu: ${response.status}`);
            
            const responseData = await response.json();
            if (responseData.status === "success" && Array.isArray(responseData.data)) {
                setSliderlar(responseData.data);
            } else {
                throw new Error('Geçersiz slider veri formatı');
            }
        } catch (error) {
            console.error('Slider bilgileri yüklenirken hata oluştu:', error);
        }
    };

    const kategorileriGetir = async () => {
        try {
            setYukleniyor(true);
            const response = await fetch(`${API_URL}/api/categories`);
            
            if (!response.ok) throw new Error(`Kategoriler alınamadı. HTTP Kodu: ${response.status}`);
            
            const responseData = await response.json();
            if (responseData.status === "success" && Array.isArray(responseData.data)) {
                setKategoriler(responseData.data);
                if (responseData.data.length > 0) {
                    setSecilenKategori(responseData.data[0]);
                }
            } else {
                throw new Error('Geçersiz veri formatı');
            }
            
            setHata(null);
        } catch (error) {
            console.error('Kategori bilgileri yüklenirken hata oluştu:', error);
            setHata('Kategoriler yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
        } finally {
            setYukleniyor(false);
        }
    };

    const urunleriGetir = async (kategoriId) => {
        try {
            setUrunlerYukleniyor(true);
            setHata(null);
            
            const response = await fetch(`${API_URL}/api/products?category_id=${kategoriId}`);
            
            if (!response.ok) {
                setBackendCalisiyor(false);
                throw new Error('Ürünler API\'den alınamadı');
            }
            
            const responseData = await response.json();
            if (responseData.status === "success" && Array.isArray(responseData.data)) {
                setUrunler(responseData.data);
            } else {
                setBackendCalisiyor(false);
                throw new Error('Geçersiz ürün veri formatı');
            }
        } catch (error) {
            console.error('Ürünler yüklenirken hata oluştu:', error);
            setHata('Ürünler yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
        } finally {
            setUrunlerYukleniyor(false);
        }
    };

    if (yukleniyor) {
        return (
            <View style={styles.yuklemeContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.yuklemeText}>Kategoriler yükleniyor...</Text>
            </View>
        );
    }

    if (hata) {
        return (
            <View style={styles.hataContainer}>
                <Text style={styles.hataText}>{hata}</Text>
                <TouchableOpacity 
                    style={styles.yenidenDeneButton} 
                    onPress={() => {
                        setHata(null);
                        kategorileriGetir();
                        sliderlariGetir();
                        if (secilenKategori) {
                            urunleriGetir(secilenKategori.id);
                        }
                    }}
                >
                    <Text style={styles.yenidenDeneButtonText}>Yeniden Dene</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (kategoriler.length === 0) {
        return (
            <View style={styles.container}>
                <Text>Henüz kategori bulunmamaktadır.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Slider */}
            {sliderlar.length > 0 && (
                <View style={styles.sliderWrapper}>
                    <ScrollView 
                        ref={scrollViewRef}
                        horizontal 
                        pagingEnabled 
                        showsHorizontalScrollIndicator={false}
                        scrollEnabled={false}
                    >
                        {sliderlar.map((slider) => (
                            <TouchableOpacity key={slider.id} activeOpacity={1}>
                              <Image
  source={{ 
    uri: slider.image_url.startsWith('http') 
      ? slider.image_url 
      : slider.image_url 
        ? `${API_URL}${slider.image_url}` 
        : 'https://www.shutterstock.com/image-photo/background-food-dishes-european-cuisine-260nw-2490284951.jpg'
  }}
  style={styles.sliderImage}
  resizeMode="cover"
  onError={(e) => {
    console.log('Resim yükleme hatası:', e.nativeEvent.error);
    // Hata durumunda kaynak değiştirme işlemini burada yapabilirsiniz
  }}
/>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <View style={styles.sliderDotContainer}>
                        {sliderlar.map((_, index) => (
                            <View 
                                key={index} 
                                style={[
                                    styles.sliderDot, 
                                    index === currentSliderIndex && styles.activeDot
                                ]} 
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* Kategori Listesi */}
            <View style={styles.kategoriContainer}>
                <Text style={styles.kategoriBaslik}>Yemek Kategorileri</Text>
                <FlatList
                    horizontal
                    data={kategoriler}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={[
                                styles.kategoriButton,
                                secilenKategori?.id === item.id && styles.aktifKategori
                            ]}
                            onPress={() => setSecilenKategori(item)}
                        >
                            <Text style={secilenKategori?.id === item.id ? styles.aktifKategoriText : styles.kategoriText}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    showsHorizontalScrollIndicator={false}
                />
            </View>

            {/* Seçili Kategorinin Ürünleri */}
            <View style={styles.urunlerContainer}>
                {urunlerYukleniyor ? (
                    <ActivityIndicator size="large" color="#007bff" />
                ) : urunler.length > 0 ? (
                    <FlatList
                        data={urunler}
                        renderItem={({ item }) => (
                            <View style={styles.urunKarti}>
                                <Image 
                                    source={{ uri: item.image_url ? `${API_URL}${item.image_url}` : 'https://www.shutterstock.com/image-photo/background-food-dishes-european-cuisine-260nw-2490284951.jpg' }} 
                                    style={styles.urunResmi}
                                    onError={(error) => console.error('Resim yükleme hatası:', error.nativeEvent.error)}
                                    onLoad={() => console.log('Resim yüklendi:', `${API_URL}${item.image_url}`)}
                                />
                                <View style={styles.urunBilgileri}>
                                    <Text style={styles.urunAdi}>{item.name}</Text>
                                    <Text style={styles.urunAciklama} numberOfLines={2}>
                                        {item.description || "Ürün açıklaması mevcut değil"}
                                    </Text>
                                    <View style={styles.urunAltBilgi}>
                                        <Text style={styles.urunFiyati}>
                                            {parseFloat(item.base_price).toFixed(2)} TL
                                        </Text>
                                        <TouchableOpacity 
                                            style={styles.siparisButonu}
                                            onPress={() => {
                                                if (backendCalisiyor) {
                                                    navigation.navigate('UserProductDetail', { urunId: item.id });
                                                } else {
                                                    Alert.alert(
                                                        "Geliştirme Modu",
                                                        "Backend API çalışmadığı için sipariş verilemiyor.",
                                                        [{ text: "Tamam" }]
                                                    );
                                                }
                                            }}
                                        >
                                            <Text style={styles.siparisButonuYazi}>Sipariş Ver</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.urunlerListContainer} // Alt kısımda boşluk bırakması için
                    />
                ) : (
                    <View style={styles.bosUrunContainer}>
                        <Text style={styles.bosUrunText}>Bu kategoride ürün bulunmamaktadır.</Text>
                    </View>
                )}
            </View>

            {!backendCalisiyor && (
                <View style={styles.uyariContainer}>
                    <Text style={styles.uyariText}>
                        ⚠️ Backend API bağlantısı çalışmıyor. Geçici veriler gösterilmektedir.
                    </Text>
                </View>
            )}

            <BottomTabBar />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    sliderWrapper: {
        height: 180,
        marginTop: 50,
        position: 'relative',
    },
    sliderImage: {
        width: width,
        height: 180,
    },
    sliderDotContainer: {
        position: 'absolute',
        bottom: 10,
        flexDirection: 'row',
        alignSelf: 'center',
    },
    sliderDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginHorizontal: 5,
    },
    activeDot: {
        backgroundColor: 'white',
        width: 12,
    },
    kategoriContainer: {
        marginVertical: 15,
        paddingHorizontal: 10,
    },
    kategoriBaslik: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        paddingHorizontal: 5,
        color: '#333333',
    },
    kategoriButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginHorizontal: 6,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    aktifKategori: {
        backgroundColor: '#FF6B00',
        borderColor: '#FF6B00',
    },
    kategoriText: {
        color: '#555555',
        fontWeight: '500',
    },
    aktifKategoriText: {
        color: 'white',
        fontWeight: 'bold',
    },
    urunlerContainer: {
        flex: 1,
        marginTop: 5,
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    urunlerListContainer: {
        paddingBottom: 150, // BottomTabBar için gerekli boşluk
    },
    urunKarti: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 12,
        marginVertical: 6,
        backgroundColor: 'white',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
        borderWidth: 0,
        marginHorizontal: 2,
    },
    urunResmi: {
        width: 100,
        height: 100,
        borderRadius: 10,
        marginRight: 15,
    },
    urunBilgileri: {
        flex: 1,
        justifyContent: 'space-between'
    },
    urunAdi: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 4,
    },
    urunAciklama: {
        color: '#777777',
        marginVertical: 5,
        fontSize: 13,
        lineHeight: 18,
    },
    urunAltBilgi: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    urunFiyati: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B00',
    },
    siparisButonu: {
        backgroundColor: '#FF6B00',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: "#FF6B00",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 3,
    },
    siparisButonuYazi: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13,
    },
    yuklemeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    yuklemeText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    hataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f8f8',
    },
    hataText: {
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
        marginBottom: 20,
    },
    yenidenDeneButton: {
        backgroundColor: '#FF6B00',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        shadowColor: "#FF6B00",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 3,
    },
    yenidenDeneButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    bosUrunContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    bosUrunText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    uyariContainer: {
        backgroundColor: '#FFF9C4',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#FFF176',
        marginBottom: 60,
    },
    uyariText: {
        color: '#F57F17',
        textAlign: 'center',
        fontSize: 14,
    }
});

export default MainScreen;