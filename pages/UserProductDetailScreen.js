import React, { useState, useEffect } from 'react';
import { 
   View, 
   Text, 
   StyleSheet, 
   Image, 
   TouchableOpacity,
   Alert,
   ActivityIndicator,
   ScrollView,
   Platform,
   Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useKullanici } from '../context/KullaniciContext';
import { API_URL } from '../src/config/api';

// Platform'a göre bottom inset değeri
const BOTTOM_INSET = Platform.OS === 'ios' ? 34 : 0;
const { height } = Dimensions.get('window');

function UserProductDetailScreen({ route, navigation }) {
   // Context'ten sipariş bilgilerini kaydetmek için metodu al
   const { setSiparisDetaylari, userToken, isLoggedIn } = useKullanici();

   // Navigation ile gelen ürün ID'sini al
   const { urunId } = route.params;
   
   // Ürün bilgileri state'i
   const [urun, setUrun] = useState(null);
   const [yukleniyor, setYukleniyor] = useState(true);
   const [hata, setHata] = useState(null);
   
   // Miktar ve seçilen seçenekler için state'ler
   const [miktar, setMiktar] = useState(1);
   const [secenekGruplari, setSecenekGruplari] = useState([]); // Seçenek grupları (örn: Boyut, Ekstra soslar, vb.)
   const [secilenSecenekler, setSecilenSecenekler] = useState({}); // Seçilen seçenekler

   // Ürün bilgilerini API'den çek
   useEffect(() => {
      const urunGetir = async () => {
         try {
            setYukleniyor(true);
            setHata(null);
            
            console.log(`Ürün detayları çekiliyor: ${API_URL}/api/products/${urunId}`);
            
            // Ürün detaylarını çek
            const productResponse = await fetch(`${API_URL}/api/products/${urunId}`);
            
            if (!productResponse.ok) {
               throw new Error(`Ürünler alınamadı. HTTP Kodu: ${productResponse.status}`);
            }
            
            const productData = await productResponse.json();
            
            if (!productData || productData.status !== "success") {
               throw new Error('Geçersiz ürün veri formatı');
            }

            setUrun(productData.data);
            
            // Ürün seçeneklerini çek
            try {
               const optionsResponse = await fetch(`${API_URL}/api/products/${urunId}/options`);
               
               if (optionsResponse.ok) {
                  const optionsData = await optionsResponse.json();
                  console.log('Seçenek verileri:', optionsData);
                  
                  // Gelen veriyi güvenli bir şekilde işle
                  if (Array.isArray(optionsData)) {
                     // Null veya geçersiz değerleri temizle
                     const temizlenmisVeri = optionsData.filter(group => group && typeof group === 'object')
                        .map(group => {
                           // Emin ol ki her grup güvenli değerlerle dolsun
                           let values = [];
                           
                           // Option values'u işle
                           if (group.values && Array.isArray(group.values)) {
                              values = group.values
                                 .filter(val => val && typeof val === 'object')
                                 .map(val => ({
                                    id: val.id || `val-${Math.random().toString(36).slice(2, 7)}`,
                                    value: val.value || group.name || 'Seçenek',
                                    price_adjustment: parseFloat(val.price_adjustment) || 0
                                 }));
                           }
                           
                           return {
                              ...group,
                              id: group.id || `group-${Math.random().toString(36).slice(2, 7)}`,
                              name: group.name || 'Seçenek',
                              type: group.type || 'multiple',
                              values: values
                           };
                        });
                     
                     setSecenekGruplari(temizlenmisVeri);
                     
                     // Her seçenek grubu için varsayılan değerleri ayarla
                     const secenekler = {};
                     temizlenmisVeri.forEach(group => {
                        // Her grup için varsayılan değerleri ayarla
                        if (group.values && group.values.length > 0) {
                           if (group.type === 'single') {
                              // Tekli seçim için ilk değeri seç
                              secenekler[group.id] = [group.values[0].id];
                           } else if (group.is_required) {
                              // Zorunlu çoklu seçim için ilk değeri seç
                              secenekler[group.id] = [group.values[0].id];
                           } else {
                              // Zorunlu olmayan seçimler için boş array
                              secenekler[group.id] = [];
                           }
                        } else {
                           secenekler[group.id] = [];
                        }
                     });
                     
                     setSecilenSecenekler(secenekler);
                  }
               }
            } catch (optionsError) {
               console.error('Seçenek verileri yüklenirken hata:', optionsError);
               // Seçenekleri yükleme hatası kritik değil, devam et
            }
         } catch (error) {
            console.error('Ürün detayları yüklenirken hata oluştu:', error);
            setHata(`Ürün detayları yüklenemedi: ${error.message}`);
            
            // Hata mesajını göster ama yine de devam et
            Alert.alert(
               'Uyarı',
               'Ürün detayları tam olarak yüklenemedi, bazı bilgiler sınırlı olabilir.',
               [{ text: 'Tamam' }]
            );
            
            // Ana ürün listesinden ürünü bularak geçici veri oluştur
            try {
               const allProductsResponse = await fetch(`${API_URL}/api/products`);
               if (allProductsResponse.ok) {
                  const allProductsData = await allProductsResponse.json();
                  if (allProductsData.status === "success" && Array.isArray(allProductsData.data)) {
                     const bulunanUrun = allProductsData.data.find(u => u.id === parseInt(urunId));
                     if (bulunanUrun) {
                        setUrun(bulunanUrun);
                     } else {
                        throw new Error('Ürün bulunamadı');
                     }
                  }
               }
            } catch (fallbackError) {
               // Fallback olarak minimal ürün
               const tempUrun = {
                  id: parseInt(urunId),
                  name: "Ürün #" + urunId,
                  description: "Ürün açıklaması yüklenemedi",
                  base_price: 0,
                  image_url: null
               };
               setUrun(tempUrun);
            }
         } finally {
            setYukleniyor(false);
         }
      };
      
      urunGetir();
   }, [urunId]);

   // Seçenek değerini değiştir
   const handleSecenekDegistir = (groupId, valueId) => {
      // Null değerler için güvenlik
      if (!groupId || !valueId) {
         console.log("Geçersiz grup veya değer ID'si");
         return;
      }

      setSecilenSecenekler(prev => {
         // Seçenek grubunu bul
         const group = secenekGruplari.find(g => g && g.id === groupId);
         
         // Grup bulunamazsa mevcut durumu döndür
         if (!group) {
            console.log("Seçenek grubu bulunamadı:", groupId);
            return prev;
         }
         
         // Mevcut grup için seçilen değerleri al (yoksa boş array)
         const mevcutDegerler = Array.isArray(prev[groupId]) ? [...prev[groupId]] : [];
         
         // Tekli seçim ise sadece bu değeri içeren yeni array oluştur
         if (group.type === 'single') {
            return { ...prev, [groupId]: [valueId] };
         } 
         // Çoklu seçim ise toggle (ekle/çıkar)
         else {
            const valueIndex = mevcutDegerler.indexOf(valueId);
            if (valueIndex >= 0) {
               // Zorunluysa ve son kalan değerse çıkarma
               if (group.is_required && mevcutDegerler.length === 1) {
                  Alert.alert('Uyarı', 'Bu seçenek grubu için en az bir seçim yapmalısınız.');
                  return prev;
               }
               
               // Değer zaten seçili, çıkar
               mevcutDegerler.splice(valueIndex, 1);
            } else {
               // Değer seçili değil, ekle
               mevcutDegerler.push(valueId);
            }
            return { ...prev, [groupId]: mevcutDegerler };
         }
      });
   };

   // Seçilen seçenekler için ekstra ücret hesapla
   const secenekEkstraUcret = () => {
      if (!secenekGruplari.length) return 0;
      
      let toplamEkstra = 0;
      
      // Her grup için seçilen değerlerin fiyat düzenlemelerini topla
      Object.entries(secilenSecenekler).forEach(([groupId, valueIds]) => {
         const group = secenekGruplari.find(g => g.id === parseInt(groupId));
         if (!group) return;
         
         valueIds.forEach(valueId => {
            const value = group.values.find(v => v.id === valueId);
            if (value && value.price_adjustment) {
               toplamEkstra += parseFloat(value.price_adjustment);
            }
         });
      });
      
      return toplamEkstra;
   };

   // Toplam fiyat hesaplama
   const toplamFiyat = () => {
      if (!urun) return "0.00";
      const birimFiyat = parseFloat(urun.base_price || 0) + secenekEkstraUcret();
      return (birimFiyat * miktar).toFixed(2);
   };

   // Seçilen seçenek değerinin adını bul
   const getSecenekDegeriAdi = (groupId, valueId) => {
      const group = secenekGruplari.find(g => g.id === parseInt(groupId));
      if (!group) return '';
      
      const value = group.values.find(v => v.id === valueId);
      return value ? value.value : '';
   };

   // Sepete ekleme fonksiyonu
   const handleSepeteEkle = async () => {
      // Zorunlu seçenekleri kontrol et
      let zorunluSecenekIcermiyorMu = false;
      
      secenekGruplari.forEach(group => {
         if (group.is_required && 
             (!secilenSecenekler[group.id] || secilenSecenekler[group.id].length === 0)) {
            zorunluSecenekIcermiyorMu = true;
            Alert.alert('Uyarı', `Lütfen '${group.name}' için en az bir seçim yapınız.`);
            return;
         }
      });
      
      if (zorunluSecenekIcermiyorMu) return;
  
      // Kullanıcı giriş yapmış mı kontrol et
      if (!isLoggedIn) {
         const token = await AsyncStorage.getItem('userToken');
         if (!token) {
            Alert.alert(
               'Oturum Gerekli',
               'Sepete ürün eklemek için lütfen giriş yapın.',
               [
                  { 
                     text: 'Giriş Yap', 
                     onPress: () => navigation.navigate('Login') 
                  },
                  {
                     text: 'İptal',
                     style: 'cancel'
                  }
               ]
            );
            return;
         }
      }
  
      try {
         setYukleniyor(true);
  
         // Token'ı al
         const token = userToken || await AsyncStorage.getItem('userToken');
         
         // Seçilen seçenekleri API formatına dönüştür
         const formattedOptions = [];
         Object.entries(secilenSecenekler).forEach(([groupId, valueIds]) => {
            const group = secenekGruplari.find(g => g.id === parseInt(groupId));
            if (!group || !valueIds.length) return;
            
            const groupValues = valueIds.map(valueId => {
               const value = group.values.find(v => v.id === valueId);
               return {
                  value_id: valueId, 
                  value: value ? value.value : '',
                  price_adjustment: value ? value.price_adjustment : 0
               };
            });
            
            formattedOptions.push({
               option_id: parseInt(groupId),
               name: group.name,
               type: group.type,
               values: groupValues
            });
         });
  
         // API'ye sepete ekleme isteği
         const response = await fetch(`${API_URL}/api/products/cart`, {
            method: 'POST',
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({
               product_id: urun.id,
               quantity: miktar,
               options: formattedOptions,
               note: ''  // İsteğe bağlı not
            })
         });
  
         // Yanıtın detaylarını al
         const responseData = await response.json();
  
         if (!response.ok) {
            console.error('Sepete ekleme hatası:', {
               status: response.status,
               body: responseData
            });
  
            // Daha detaylı hata mesajı
            Alert.alert(
               'Hata', 
               responseData.details || responseData.error || 'Ürün sepete eklenemedi',
               [{ text: 'Tamam' }]
            );
            return;
         }
  
         // Context'e sipariş detayları kaydedilir
         const siparisDetaylari = {
            urunId: urun.id,
            urunAdi: urun.name,
            fiyat: parseFloat(urun.base_price),
            miktar: miktar,
            secenekler: formattedOptions,
            seceneklerEkstraFiyat: secenekEkstraUcret(),
            toplamFiyat: parseFloat(toplamFiyat())
         };
  
         // Context'e kaydet
         setSiparisDetaylari(siparisDetaylari);
  
         // Başarılı mesajı göster
         Alert.alert(
            'Başarılı',
            'Ürün sepete eklendi',
            [
               { 
                  text: 'Sepete Git', 
                  onPress: () => navigation.navigate('Sepet') 
               },
               {
                  text: 'Alışverişe Devam',
                  onPress: () => navigation.goBack()
               }
            ]
         );
      } catch (error) {
         console.error('Sepete eklerken ağ hatası:', error);
         Alert.alert(
            'Hata',
            `Bağlantı hatası: ${error.message}`,
            [{ text: 'Tamam' }]
         );
      } finally {
         setYukleniyor(false);
      }
   };

   // Yükleniyor durumunda göster
   if (yukleniyor) {
      return (
         <View style={styles.yuklemeContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.yuklemeText}>Ürün detayları yükleniyor...</Text>
         </View>
      );
   }

   // Ürün bulunamazsa kontrol
   if (!urun) {
      return (
         <View style={styles.container}>
            <Text>Ürün bulunamadı</Text>
            <TouchableOpacity 
               style={styles.yenidenDeneButton}
               onPress={() => navigation.goBack()}
            >
               <Text style={styles.yenidenDeneButtonText}>Geri Dön</Text>
            </TouchableOpacity>
         </View>
      );
   }

   return (
      <View style={styles.container}>
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
              {/* Ürün Resmi */}
              <Image 
                  source={{ 
                      uri: urun.image_url 
                          ? `${API_URL}${urun.image_url}` 
                          : 'https://www.shutterstock.com/image-photo/background-food-dishes-european-cuisine-260nw-2490284951.jpg' 
                  }} 
                  style={styles.urunResmi} 
                  resizeMode="cover"
              />
  
              {/* Ürün Adı */}
              <Text style={styles.urunAdi}>{urun.name}</Text>
  
              {/* Ürün Açıklaması */}
              <Text style={styles.urunAciklama}>{urun.description || "Ürün açıklaması bulunmamaktadır."}</Text>
  
              {/* Miktar Seçimi */}
              <View style={styles.miktarContainer}>
                  <Text style={styles.miktarBaslik}>Miktar:</Text>
                  <View style={styles.miktarAyarlamaContainer}>
                      <TouchableOpacity 
                          style={styles.miktarButon}
                          onPress={() => setMiktar(Math.max(1, miktar - 1))}
                      >
                          <Text style={styles.miktarButonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.miktarText}>{miktar}</Text>
                      <TouchableOpacity 
                          style={styles.miktarButon}
                          onPress={() => setMiktar(miktar + 1)}
                      >
                          <Text style={styles.miktarButonText}>+</Text>
                      </TouchableOpacity>
                  </View>
              </View>
  
              {/* Seçenek Grupları */}
              {secenekGruplari && secenekGruplari.map(group => {
                  if (!group || !group.id) return null;
                  return (
                      <View key={String(group.id)} style={styles.secenekGrupContainer}>
                          <View style={styles.seceneklerListContainer}>
                              {group.values && Array.isArray(group.values) && group.values.map((value, index) => {
                                  if (!value) return null;
                                  const valueId = value.id;
                                  const isSelected = secilenSecenekler[group.id] && 
                                      Array.isArray(secilenSecenekler[group.id]) && 
                                      secilenSecenekler[group.id].includes(valueId);
                                  
                                  return (
                                      <TouchableOpacity 
                                          key={valueId || `option-${index}`}
                                          style={[
                                              styles.secenekSatir,
                                              index === 0 && styles.ilkSecenekSatir
                                          ]}
                                          onPress={() => valueId && handleSecenekDegistir(group.id, valueId)}
                                      >
                                          <View style={styles.secenekSolKisim}>
                                              <View style={[
                                                  styles.checkbox,
                                                  isSelected && styles.checkboxSelected
                                              ]}>
                                                  {isSelected && (
                                                      <Text style={styles.checkmarkText}>✓</Text>
                                                  )}
                                              </View>
                                              {value.image_url && (
                                                  <Image 
                                                      source={{ uri: value.image_url }}
                                                      style={styles.secenekResim}
                                                      resizeMode="cover"
                                                  />
                                              )}
                                              <Text style={styles.secenekAdi}>
                                                  {value.value || group.name || 'Seçenek'}
                                              </Text>
                                          </View>
                                          <Text style={styles.secenekFiyat}>
                                              {value.price_adjustment > 0 ? `${value.price_adjustment} TL` : ''}
                                          </Text>
                                      </TouchableOpacity>
                                  );
                              })}
                          </View>
                      </View>
                  );
              })}
              
              {/* Malzemeler */}
              {urun.ingredients && urun.ingredients.length > 0 && (
                  <View style={styles.malzemelerContainer}>
                      <Text style={styles.malzemelerBaslik}>İçindekiler:</Text>
                      <Text style={styles.malzemelerText}>
                          {urun.ingredients.map(ing => ing.name || ing).join(', ')}
                      </Text>
                  </View>
              )}
              
              {/* Boşluk */}
              <View style={{ height: 120 }} />
          </ScrollView>
          
          {/* Alt Kısım - Sabit pozisyonda */}
          <View style={styles.altKisimContainer}>
              <View style={styles.toplamFiyatContainer}>
                  <Text style={styles.toplamFiyatText}>{toplamFiyat()} TL</Text>
              </View>
              <View style={styles.butonlarContainer}>
                  <TouchableOpacity 
                      style={styles.hizliSiparisButon}
                  >
                      <Text style={styles.butonText}>Hızlı Sipariş Ver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                      style={styles.sepeteEkleButon}
                      onPress={handleSepeteEkle}
                      disabled={yukleniyor}
                  >
                      <Text style={styles.sepeteEkleText}>
                          {yukleniyor ? 'Ekleniyor...' : 'Sepete Ekle'}
                      </Text>
                  </TouchableOpacity>
              </View>
          </View>
          
          {hata && (
              <View style={styles.uyariContainer}>
                  <Text style={styles.uyariText}>
                      ⚠️ Bazı bilgiler tam olarak yüklenemedi. Sınırlı içerik gösteriliyor.
                  </Text>
              </View>
          )}
      </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        position: 'relative'
    },
    scrollContainer: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        paddingBottom: 120, // Alt kısım için boşluk
        alignItems: 'center'
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
    urunResmi: {
        width: '100%',
        height: 280, // Daha büyük resim
        borderRadius: 0, // Yukarıda köşe yok
        marginBottom: 15,
    },
    urunAdi: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333333',
        textAlign: 'left',
        alignSelf: 'flex-start',
        paddingHorizontal: 15,
        width: '100%',
    },
    urunAciklama: {
        color: '#666666',
        textAlign: 'left',
        marginBottom: 20,
        fontSize: 14,
        lineHeight: 20,
        paddingHorizontal: 15,
        width: '100%',
    },
    miktarContainer: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    miktarBaslik: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333333',
    },
    miktarAyarlamaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    miktarButon: {
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 25,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    miktarButonText: {
        fontSize: 20,
        color: '#333',
        fontWeight: 'bold',
    },
    miktarText: {
        fontSize: 18,
        marginHorizontal: 20,
        color: '#333',
        fontWeight: '500',
    },
    secenekGrupContainer: {
        width: '100%',
        marginBottom: 0,
        paddingHorizontal: 0,
    },
    seceneklerListContainer: {
        width: '100%',
        flexDirection: 'column',
    },
    secenekSatir: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        width: '100%',
        backgroundColor: 'white',
    },
    ilkSecenekSatir: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginTop: 5,
    },
    secenekSolKisim: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    checkbox: {
        width: 26,
        height: 26,
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 3,
        marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: 'white',
        borderColor: '#FF6B00',
    },
    checkmarkText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF6B00',
    },
    secenekResim: {
        width: 40,
        height: 40,
        borderRadius: 4,
        marginRight: 12,
    },
    secenekAdi: {
        fontSize: 16,
        fontWeight: '400',
        color: '#333333',
        flex: 1,
    },
    secenekFiyat: {
        fontSize: 16,
        fontWeight: '500',
        color: '#FF6B00',
        marginLeft: 8,
    },
    malzemelerContainer: {
        width: '100%',
        marginBottom: 25,
        paddingHorizontal: 15,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        marginHorizontal: 15,
    },
    malzemelerBaslik: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333333',
    },
    malzemelerText: {
        color: '#666666',
        lineHeight: 20,
    },
    altKisimContainer: {
        flexDirection: 'column',
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 25 : 25,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 100,
    },
    toplamFiyatContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 10,
    },
    toplamFiyatText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
    },
    butonlarContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    hizliSiparisButon: {
        flex: 1,
        backgroundColor: 'white',
        paddingVertical: 15,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#FF6B00',
        alignItems: 'center',
        marginRight: 10,
    },
    sepeteEkleButon: {
        flex: 1,
        backgroundColor: '#FF6B00',
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: "#FF6B00",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 3,
    },
    butonText: {
        color: '#FF6B00',
        fontWeight: 'bold',
        fontSize: 16,
    },
    sepeteEkleText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    uyariContainer: {
        backgroundColor: '#FFF9C4',
        padding: 12,
        borderRadius: 10,
        marginVertical: 15,
        width: '90%',
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: '#FFE082',
    },
    uyariText: {
        color: '#F57F17',
        textAlign: 'center',
        fontSize: 14,
    }
});

export default UserProductDetailScreen;