import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useKullanici } from '../context/KullaniciContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../src/config/api';
import BottomTabBar from '../components/BottomTabBar';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';

function UserPaymentScreen(props) {
    // Mevcut context hook'larını genişletin
    const { 
        userToken, 
        sepetUrunleri, 
        setSepetUrunleri, 
        isLoggedIn
    } = useKullanici();

    // Ekran yüklendiğinde oturum kontrolü yapan bir useEffect
    useEffect(() => {
        console.log("Ödeme ekranı açıldı, login durumu:", isLoggedIn);
        
        // Doğrudan context'teki isLoggedIn değerini kontrol et
        if (!isLoggedIn) {
            Alert.alert(
                'Giriş Yapın',
                'Ödeme yapmak için lütfen giriş yapın',
                [
                    { 
                        text: 'Giriş Yap', 
                        onPress: () => props.navigation.navigate('Login') 
                    },
                    { 
                        text: 'İptal', 
                        onPress: () => props.navigation.goBack(),
                        style: 'cancel' 
                    }
                ]
            );
        }
    }, [isLoggedIn]);
 
    // State'ler
    const [odemeYontemi, setOdemeYontemi] = useState('cash');
    const [not, setNot] = useState('');
    const [notEkleAktif, setNotEkleAktif] = useState(false);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [adresler, setAdresler] = useState([]);
    const [seciliAdresId, setSeciliAdresId] = useState(null);
    const [hata, setHata] = useState(null);
    const [toplamFiyat, setToplamFiyat] = useState();

    // useFocusEffect kullanarak ekran her odaklandığında adresleri yeniden yükle
    useFocusEffect(
        React.useCallback(() => {
            console.log("Ekran odaklandı, adres bilgileri yenileniyor... isLoggedIn:", isLoggedIn);
            
            // Login durumunu yeniden kontrol et
            if (!isLoggedIn) {
                return; // Login yoksa işlemi iptal et
            }
            
            adresBilgileriniGetir();
            // Toplam fiyatı da yenile
            toplamHesapla();
            
            return () => {
                // Temizleme işlemleri gerekirse burada yapabilirsiniz
                console.log("Ekran odaktan çıktı");
            };
        }, [isLoggedIn])
    );

    const adresBilgileriniGetir = async () => {
        setYukleniyor(true);
        setHata(null);
        try {
            if (!isLoggedIn || !userToken) {
                throw new Error('Oturum açık değil');
            }
            
            console.log("Adres bilgileri getiriliyor... Token:", userToken ? "VAR" : "YOK");
            
            const response = await fetch(`${API_URL}/api/addresses`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log("Adres API response status:", response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.log("Adres API error response:", errorText);
                throw new Error(`Adresler alınamadı (${response.status})`);
            }
            
            const responseData = await response.json();
            console.log("Adres API response data:", JSON.stringify(responseData).substring(0, 100) + "...");
            
            if (responseData.addresses && Array.isArray(responseData.addresses)) {
                setAdresler(responseData.addresses);
                
                // Varsayılan adres var mı kontrol et
                const varsayilanAdres = responseData.addresses.find(adres => adres.is_default === 1);
                if (varsayilanAdres) {
                    setSeciliAdresId(varsayilanAdres.id);
                } else if (responseData.addresses.length > 0) {
                    // Varsayılan yoksa ilk adresi seç
                    setSeciliAdresId(responseData.addresses[0].id);
                }
            } else {
                console.log("Adres bulunamadı veya format uygun değil");
                setAdresler([]);
            }
        } catch (error) {
            console.error("Adres bilgileri getirme hatası:", error);
            setHata(error.message);
        } finally {
            setYukleniyor(false);
        }
    };
    
    // Toplam sipariş tutarı hesapla
    const hesaplaToplam = async () => {
        try {
            if (!isLoggedIn || !userToken) {
                console.log("Toplam hesaplama: Oturum açık değil");
                return "0.00";
            }

            console.log("Sepet toplam hesaplaması... Token:", userToken ? "VAR" : "YOK");
            
            // Sepet ürünlerini API'den çek
            const response = await fetch(`${API_URL}/api/products/cart`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error("Sepet getirme hatası:", response.status);
                return "0.00";
            }
            
            const responseData = await response.json();
            
            // Sepet boşsa
            if (!responseData.cart || responseData.cart.length === 0) {
                console.log("Sepet boş");
                return "0.00";
            }
            
            // Toplam tutarı hesapla
            const toplam = responseData.cart.reduce((toplam, urun) => {
                const fiyat = parseFloat(urun.base_price || 0);
                const adet = urun.quantity || 1;
                const itemTotal = fiyat * adet;
                
                console.log(`Ürün: ${urun.name}, Birim Fiyat: ${fiyat}, Adet: ${adet}, Ara Toplam: ${itemTotal}`);
                
                return toplam + itemTotal;
            }, 0);
            
            const sonuc = toplam.toFixed(2);
            console.log(`Hesaplanan toplam: ${sonuc}`);
            
            return sonuc;
        } catch (error) {
            console.error("Toplam hesaplama hatası:", error);
            return "0.00";
        }
    };

    // Toplamı hesaplayan fonksiyon
    const toplamHesapla = async () => {
        const toplam = await hesaplaToplam();
        setToplamFiyat(toplam);
    };
    
    // Siparişi tamamla
    const handleSiparisTamamlaButton = async () => {
        if (!isLoggedIn) {
          Alert.alert('Giriş Yapın', 'Ödeme yapmak için lütfen giriş yapın');
          return;
        }
        
        try {
          setYukleniyor(true);
          
          // SİPARİŞ VERMEDEN ÖNCE ÇALIŞMA SAATLERİNİ KONTROL ET
          console.log("Sipariş öncesi çalışma saatleri kontrol ediliyor...");
          const workingHoursResponse = await fetch(`${API_URL}/api/restaurant-hours/check`);
          const workingHoursData = await workingHoursResponse.json();
          
          if (!workingHoursResponse.ok) {
            // API erişim hatası varsa uyarı göster ve iptal et
            throw new Error("Çalışma saatleri kontrol edilemedi. Lütfen daha sonra tekrar deneyin.");
          }
          
          // Restoran kapalıysa sipariş vermeyi engelle
          if (!workingHoursData.is_open) {
            setYukleniyor(false);
            
            // Daha detaylı bir uyarı mesajı göster
            Alert.alert(
              'Çalışma Saatleri Dışında',
              'Üzgünüz, şu anda çalışma saatleri dışındayız ve sipariş alamıyoruz.\n\n' +
              'Çalışma saatleri içinde tekrar deneyiniz.',
              [
                {
                  text: 'Anladım',
                  onPress: () => {
                    // Ana sayfaya yönlendir
                    navigation.navigate('Main');
                  }
                }
              ]
            );
            return;
          }
          
          console.log("1. Sipariş tamamla tıklandı, login durumu:", isLoggedIn);
          
          // Sepetteki ürünlerin seçeneklerini getir
          const cartResponse = await fetch(`${API_URL}/api/products/cart`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${userToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!cartResponse.ok) {
            throw new Error("Sepet bilgileri alınamadı");
          }
          
          const cartData = await cartResponse.json();
          
          // Sepetteki ürünlerin seçeneklerinden not oluştur
          let secilenUrunlerNotu = "";
          
          // Alınan sepet verilerini detaylı olarak logla
          console.log("Sepet verileri:", JSON.stringify(cartData).substring(0, 500));
          
          if (cartData && cartData.cart && Array.isArray(cartData.cart)) {
            // Her ürün için seçenekleri topla
            let tumSecenekler = [];
            
            cartData.cart.forEach((item) => {
              console.log(`Ürün: ${item.name}, Options:`, item.options);
              
              // Seçenekleri ekle
              if (item.options) {
                try {
                  // Options bir string ise JSON olarak parse et
                  let parsedOptions = null;
                  
                  if (typeof item.options === 'string') {
                    // Ham veriyi logla
                    console.log("Ham options verisi:", item.options);
                    
                    try {
                      parsedOptions = JSON.parse(item.options);
                    } catch (parseError) {
                      console.log("JSON parse hatası:", parseError.message);
                      
                      // Değerleri doğrudan regex ile çıkar
                      const valueRegex = /"value":"([^"]+)"/g;
                      let match;
                      while ((match = valueRegex.exec(item.options)) !== null) {
                        const value = match[1].trim();
                        if (value && !tumSecenekler.includes(value)) {
                          tumSecenekler.push(value);
                        }
                      }
                      
                      return; // Bu ürün için işlemeyi atla
                    }
                  } else {
                    parsedOptions = item.options;
                  }
                  
                  // Ayrıştırılmış seçenek verilerini işle
                  if (Array.isArray(parsedOptions)) {
                    // Dizi formatındaki seçenekler
                    parsedOptions.forEach(option => {
                      if (option && option.values && Array.isArray(option.values)) {
                        option.values.forEach(val => {
                          if (val && val.value) {
                            const value = val.value.trim();
                            if (value && !tumSecenekler.includes(value)) {
                              tumSecenekler.push(value);
                            }
                          }
                        });
                      }
                    });
                  } else if (parsedOptions && typeof parsedOptions === 'object') {
                    // Nesne formatındaki seçenekler
                    for (const key in parsedOptions) {
                      const option = parsedOptions[key];
                      
                      if (option && Array.isArray(option.values)) {
                        option.values.forEach(val => {
                          if (val && val.value) {
                            const value = val.value.trim();
                            if (value && !tumSecenekler.includes(value)) {
                              tumSecenekler.push(value);
                            }
                          }
                        });
                      } else if (option && option.value) {
                        // Doğrudan değer içeren seçenekler
                        const value = option.value.trim();
                        if (value && !tumSecenekler.includes(value)) {
                          tumSecenekler.push(value);
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.log("Seçenek işleme hatası:", e.message);
                }
              }
            });
            
            // Bulunan tüm seçenekleri nota ekle
            if (tumSecenekler.length > 0) {
              // Karakter sınırını aşmamak için kısalt (veritabanı VARCHAR 255 sınırlaması)
              secilenUrunlerNotu = tumSecenekler.join(",");
              
              // 200 karakteri aşmayacak şekilde kısalt (tampon bırakarak)
              if (secilenUrunlerNotu.length > 200) {
                secilenUrunlerNotu = secilenUrunlerNotu.substring(0, 197) + "...";
              }
              
              console.log("Eklenen tüm seçenekler (kısaltılmış):", secilenUrunlerNotu);
            }
          }
          
          // Kullanıcı notunu ve ürün notlarını birleştir
          let fullNote = secilenUrunlerNotu;
          if (not && not.trim()) {
            if (fullNote) {
              // Kalan karakter hesabı
              const kalanKarakter = 250 - fullNote.length;
              if (kalanKarakter > 10) { // En az 10 karakter için yer bırak
                let userNote = not.trim();
                if (userNote.length > kalanKarakter) {
                  userNote = userNote.substring(0, kalanKarakter - 3) + "...";
                }
                fullNote += " | " + userNote;
              }
            } else {
              // Kullanıcı notu için tam alan
              let userNote = not.trim();
              if (userNote.length > 250) {
                userNote = userNote.substring(0, 247) + "...";
              }
              fullNote = userNote;
            }
          }
          
          // Not alanının uzunluğunu kontrol et (veritabanı sınırını aşmasın diye)
          console.log("Son not içeriği:", fullNote, "Uzunluk:", fullNote.length);
          
          // Özel karakterleri temizle
          fullNote = fullNote.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
          
          if (fullNote.length > 2000) {
            console.log(`DİKKAT: Not çok uzun (${fullNote.length} karakter). Kısaltılıyor...`);
            fullNote = fullNote.substring(0, 1990) + "...";
          }
          
          console.log("Temizlenmiş not:", fullNote);
          console.log("Not uzunluğu:", fullNote.length);
          
          console.log("2. Sipariş POST isteği başlıyor...");
          console.log("İstek URL:", `${API_URL}/api/orders`);
          
          const orderRequest = {
            address_id: seciliAdresId,
            payment_type: odemeYontemi,
            note: fullNote
          };
          
          console.log("İstek body:", JSON.stringify(orderRequest));
          
          const response = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${userToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderRequest)
          });
          
          console.log("3. POST yanıtı alındı:", response.status, "OK:", response.ok);
          
          // Response body'i oku
          const responseText = await response.text();
          console.log("4. POST yanıt metni:", responseText);
          
          // JSON olarak parse et (eğer mümkünse)
          try {
            const responseData = JSON.parse(responseText);
            console.log("5. JSON parse edildi:", JSON.stringify(responseData));
            
            if (response.ok) {
              console.log("6. İşlem başarılı, sepet temizleniyor");
              setSepetUrunleri([]);
              
              // Başarılı yanıt alındığında, sonuç ekranına yönlendir
              props.navigation.navigate('SiparisTamamla', {
                islemDurumu: 'basarili',
                siparisDetaylari: {
                  siparisId: responseData.order_id,
                  toplamTutar: responseData.total_amount,
                  odemeYontemi: odemeYontemi,
                  adres: seciliAdres ? `${seciliAdres.neighborhood}, ${seciliAdres.street}, ${seciliAdres.address_detail}` : '',
                  siparisTarihi: moment().format('DD.MM.YYYY')
                }
              });
            } else {
              console.log("6. İşlem başarısız:", responseData.error || responseData.message);
              // Başarısız yanıt - SiparisTamamla sayfasına yönlendir
              props.navigation.navigate('SiparisTamamla', {
                islemDurumu: 'basarisiz'
              });
              
              // Hata mesajını göster
              Alert.alert(
                'Hata',
                responseData.error || 'Sipariş oluşturulurken bir hata oluştu',
                [{ text: 'Tamam' }]
              );
            }
          } catch (parseError) {
            console.error("JSON parse hatası:", parseError.message);
            
            // JSON parse edilemediğinde - SiparisTamamla sayfasına yönlendir
            props.navigation.navigate('SiparisTamamla', {
              islemDurumu: 'basarisiz'
            });
            
            // Hata mesajını göster
            Alert.alert(
              'Yanıt Hatası',
              'Sunucu yanıtı işlenemedi',
              [{ text: 'Tamam' }]
            );
          }
        } catch (error) {
          console.error("Fetch hatası:", error.message);
          
          // Ağ hatası durumunda - SiparisTamamla sayfasına yönlendir
          props.navigation.navigate('SiparisTamamla', {
            islemDurumu: 'basarisiz'
          });
          
          // Hata mesajını göster
          Alert.alert(
            'Bağlantı Hatası',
            'Sunucuya bağlanırken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin.',
            [{ text: 'Tamam' }]
          );
        } finally {
          // Her durumda yükleniyor durumunu kapat
          setYukleniyor(false);
          console.log("İşlem tamamlandı, yükleniyor durumu kapatıldı");
        }
      };
    // Seçili adresi bul
    const getSeciliAdres = () => {
        if (!seciliAdresId || adresler.length === 0) return null;
        return adresler.find(adres => adres.id === seciliAdresId);
    };
    
    const seciliAdres = getSeciliAdres();
    
    // Yükleniyor durumunda
    if (yukleniyor && adresler.length === 0) {
        return (
            <View style={styles.yuklemeContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.yuklemeText}>Bilgiler yükleniyor...</Text>
            </View>
        );
    }
    
    return (
        <View style={styles.mainContainer}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {/* İlerleme Göstergesi */}
                <View style={styles.ilerlemeBari}>
                    <View style={styles.ilerlemeAdimlari}>
                        <Text style={styles.ilerlemeTextPasif}>SEPETİM</Text>
                    </View>
                    <View style={[styles.ilerlemeAdimlari, styles.aktifAdim]}>
                        <Text style={styles.ilerlemeTextAktif}>ONAY</Text>
                    </View>
                    <View style={styles.ilerlemeAdimlari}>
                        <Text style={styles.ilerlemeTextPasif}>SONUÇ</Text>
                    </View>
                </View>
                
                {/* Adres Bilgisi */}
                <View style={styles.adresContainer}>
                    <Text style={styles.baslik}>Teslimat Adresi</Text>
                    
                    {hata && (
                        <Text style={styles.hataText}>
                            {hata}
                        </Text>
                    )}
                    
                    {seciliAdres ? (
                        <>
                            <Text style={styles.adresBilgisi}>
                                {seciliAdres.title}
                            </Text>
                            <Text style={styles.adresDetay}>
                                {seciliAdres.neighborhood}, {seciliAdres.street}
                            </Text>
                            <Text style={styles.adresTarifi}>
                                {seciliAdres.city}/{seciliAdres.district} - {seciliAdres.address_detail || ''}
                            </Text>
                        </>
                    ) : (
                        <Text style={styles.bosAdresText}>
                            {adresler.length === 0 
                                ? "Henüz kayıtlı adresiniz bulunmamaktadır." 
                                : "Lütfen bir adres seçiniz."}
                        </Text>
                    )}
                    
                    <TouchableOpacity 
    style={styles.adresDegistirButon}
    onPress={() => props.navigation.navigate(
        adresler.length === 0 ? 'YeniAdres' : 'Adreslerim', 
        adresler.length === 0 ? { returnToPayment: true } : {}
    )}
>
    <Text style={styles.adresDegistirText}>
        {adresler.length === 0 ? "Adres Ekle" : "Adresi Değiştir"}
    </Text>
</TouchableOpacity>
                </View>
                
                {/* Ödeme Seçenekleri */}
                <View style={styles.odemeContainer}>
                    <Text style={styles.baslik}>Ödeme Seçenekleri</Text>
                    
                    <TouchableOpacity 
                        style={[styles.odemeSecenegi, odemeYontemi === 'cash' && styles.seciliOdeme]}
                        onPress={() => setOdemeYontemi('cash')}
                    >
                        <Text style={styles.odemeSecenek}>Kapıda Nakit Ödeme</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.odemeSecenegi, odemeYontemi === 'credit_card' && styles.seciliOdeme]}
                        onPress={() => setOdemeYontemi('credit_card')}
                    >
                        <Text style={styles.odemeSecenek}>Kapıda Kredi Kartı ile Ödeme</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Not Ekleme */}
                <View style={styles.notContainer}>
                    <Text style={styles.baslik}>Sipariş Notu</Text>
                    
                    {notEkleAktif ? (
                        <>
                            <TextInput
                                style={styles.notInput}
                                placeholder="Siparişiniz için not ekleyin..."
                                multiline={true}
                                value={not}
                                onChangeText={(text) => setNot(text)}
                            />
                            <TouchableOpacity 
                                style={styles.notKapatButon}
                                onPress={() => setNotEkleAktif(false)}
                            >
                                <Text style={styles.notKapatText}>Kapat</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity 
                            style={styles.notEkleButon}
                            onPress={() => setNotEkleAktif(true)}
                        >
                            <Text style={styles.notEkleText}>Not Ekle</Text>
                        </TouchableOpacity>
                    )}
                </View>
                
                {/* Alt Kısım - Toplam ve Tamamla Butonu */}
                <View style={styles.altContainer}>
                    <View style={styles.toplamFiyatContainer}>
                        <Text style={styles.toplamFiyatText}>{toplamFiyat} TL</Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={[
                            styles.siparisTamamlaButon,
                            (!seciliAdres || yukleniyor || !isLoggedIn) && styles.disabledButton
                        ]}
                        onPress={handleSiparisTamamlaButton}
                        disabled={!seciliAdres || yukleniyor || !isLoggedIn}
                    >
                        <Text style={styles.siparisTamamlaText}>
                            {yukleniyor ? "İŞLENİYOR..." : "SİPARİŞİ TAMAMLA"}
                        </Text>
                    </TouchableOpacity>
                </View>
                
                {/* Tab bar için boşluk bırak */}
                <View style={styles.tabBarSpacer} />
            </ScrollView>
            
            {yukleniyor && (
                <View style={styles.overlaySpin}>
                    <ActivityIndicator size="large" color="#007bff" />
                </View>
            )}
            
            <View style={styles.tabBarContainer}>
                <BottomTabBar />
            </View>
        </View>
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
    },
    scrollContent: {
        paddingBottom: 80,
    },
    yuklemeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    yuklemeText: {
        marginTop: '3%',
        fontSize: 16,
        color: '#666',
    },
    overlaySpin: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
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
    baslik: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: '3%',
        color: '#333',
    },
    adresContainer: {
        backgroundColor: '#fff',
        padding: '4%',
        marginVertical: '2%',
        borderRadius: 10, // Daha yuvarlak
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    adresBilgisi: {
        fontSize: 16,
        marginBottom: '1.5%',
        fontWeight: 'bold',
        color: '#333',
    },
    adresDetay: {
        fontSize: 15,
        marginBottom: '1.5%',
        color: '#555',
    },
    adresTarifi: {
        color: '#666',
        marginBottom: '3%',
    },
    bosAdresText: {
        color: '#FF3B30', // Daha modern bir hata rengi
        marginBottom: '3%',
    },
    hataText: {
        color: '#FF3B30', // Daha modern bir hata rengi
        marginBottom: '4%',
    },
    adresDegistirButon: {
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#FF6B00', // Turuncu tema rengi
        borderRadius: 20, // Daha yuvarlak
    },
    adresDegistirText: {
        color: '#FF6B00', // Turuncu tema rengi
        fontWeight: '500',
    },
    odemeContainer: {
        backgroundColor: '#fff',
        padding: '4%',
        marginVertical: '2%',
        borderRadius: 10, // Daha yuvarlak
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    odemeSecenegi: {
        padding: '4%',
        marginVertical: '1.5%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10, // Daha yuvarlak
    },
    seciliOdeme: {
        borderColor: '#FF6B00', // Turuncu tema rengi
        backgroundColor: '#FFF8F5', // Çok açık turuncu tonu
    },
    odemeSecenek: {
        fontSize: 15,
        color: '#444',
    },
    notContainer: {
        backgroundColor: '#fff',
        padding: '4%',
        marginVertical: '2%',
        borderRadius: 10, // Daha yuvarlak
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    notEkleButon: {
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 10, // Daha yuvarlak
        alignItems: 'center',
    },
    notEkleText: {
        color: '#666',
    },
    notInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10, // Daha yuvarlak
        padding: 10,
        minHeight: 100,
        textAlignVertical: 'top',
        backgroundColor: '#fff',
    },
    notKapatButon: {
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginTop: '1.5%',
    },
    notKapatText: {
        color: '#666',
    },
    altContainer: {
        backgroundColor: '#fff',
        padding: '4%',
        marginVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        borderRadius: 10, // Daha yuvarlak alt kısım
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toplamFiyatContainer: {
        flex: 1,
    },
    toplamFiyatText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF6B00', // Turuncu tema rengi
    },
    siparisTamamlaButon: {
        backgroundColor: '#FF6B00', // Turuncu tema rengi
        padding: 15,
        borderRadius: 25, // Daha yuvarlak buton
        paddingHorizontal: 20,
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
        backgroundColor: '#cccccc',
        shadowOpacity: 0.1,
    },
    siparisTamamlaText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    tabBarSpacer: {
        height: 60, // BottomTabBar'ın yüksekliği
    },
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100
    }
});

export default UserPaymentScreen;