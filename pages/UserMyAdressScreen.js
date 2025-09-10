import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  ActivityIndicator,
  SafeAreaView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../src/config/api';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Eğer yüklü değilse, npm install react-native-vector-icons

function UserMyAdressScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Adres listesini API'den çek
  useEffect(() => {
    fetchAddresses();
  }, []);

  // Navigation listener - Adresler ekranına her geri dönüldüğünde listeyi yenile
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAddresses();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/api/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setAddresses(data.addresses || []);
        
        // Varsayılan adresi seç
        const defaultAddress = data.addresses?.find(addr => addr.is_default === 1);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (data.addresses?.length > 0) {
          setSelectedAddressId(data.addresses[0].id);
        }
      } else {
        setError(data.error || 'Adresler alınamadı');
      }
    } catch (err) {
      console.error('Adres getirme hatası:', err);
      setError('Adresleriniz yüklenirken bir sorun oluştu');
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/api/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        // Adres başarıyla silindi, listeyi güncelle
        setAddresses(prevAddresses => prevAddresses.filter(addr => addr.id !== addressId));
        Alert.alert('Başarılı', 'Adres silindi');
        
        // Eğer seçili adresi sildiyse, başka bir adresi seç
        if (selectedAddressId === addressId) {
          if (addresses.length > 1) {
            const newSelectedAddress = addresses.find(addr => addr.id !== addressId);
            setSelectedAddressId(newSelectedAddress?.id || null);
          } else {
            setSelectedAddressId(null);
          }
        }
      } else {
        // Adresin kullanımda olup olmadığını kontrol et
        if (data.error && data.error.includes('foreign key constraint fails')) {
          Alert.alert(
            'Adres Silinemedi', 
            'Bu adres daha önce verdiğiniz siparişlerde kullanıldığı için silinemiyor. Farklı bir adres seçip bu adresi varsayılan adres olmaktan çıkarabilirsiniz.'
          );
        } else {
          Alert.alert('Hata', data.error || 'Adres silinemedi');
        }
      }
    } catch (err) {
      console.error('Adres silme hatası:', err);
      
      // Yakalanan hatada foreign key ihlali var mı kontrol et
      if (err.message && (
          err.message.includes('foreign key constraint fails') || 
          err.message.includes('Cannot delete or update a parent row')
        )) {
        Alert.alert(
          'Adres Silinemedi', 
          'Bu adres daha önce verdiğiniz siparişlerde kullanıldığı için silinemiyor. Farklı bir adres seçip bu adresi varsayılan adres olmaktan çıkarabilirsiniz.'
        );
      } else {
        Alert.alert('Hata', 'Adres silinirken bir sorun oluştu');
      }
    }
  };

  const setAsDefaultAddress = async (addressId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const addressToUpdate = addresses.find(addr => addr.id === addressId);
      
      if (!addressToUpdate) return;
      
      const response = await fetch(`${API_URL}/api/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...addressToUpdate,
          is_default: 1
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Başarılı', 'Varsayılan adres güncellendi');
        fetchAddresses(); // Adres listesini yenile
      } else {
        Alert.alert('Hata', data.error || 'Adres güncellenemedi');
      }
    } catch (err) {
      console.error('Adres güncelleme hatası:', err);
      Alert.alert('Hata', 'Adres güncellenirken bir sorun oluştu');
    }
  };

  // Adres kartı bileşeni
  const AddressCard = ({ address }) => {
    const isDefault = address.is_default === 1;
    const isSelected = selectedAddressId === address.id;
    
    return (
      <TouchableOpacity 
        style={[
          styles.addressCard,
          isSelected && styles.selectedAddressCard
        ]}
        onPress={() => setSelectedAddressId(address.id)}
      >
        <View style={styles.addressHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.addressTitle}>{address.title}</Text>
            {isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Varsayılan</Text>
              </View>
            )}
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                // Sipariş verilmiş adresler için adres silme işleminde ek uyarı
                Alert.alert(
                  'Adres Sil',
                  'Bu adresi silmek istediğinizden emin misiniz?\n\nNot: Bu adresle sipariş verdiyseniz, silme işlemi başarısız olabilir.',
                  [
                    { text: 'İptal', style: 'cancel' },
                    { text: 'Sil', onPress: () => deleteAddress(address.id), style: 'destructive' }
                  ]
                );
              }}
            >
              <Icon name="delete" size={18} color="#ff0000" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.addressText}>
          {address.city}, {address.district}, {address.neighborhood}, {address.street}
        </Text>
        <Text style={styles.addressDetail}>{address.address_detail}</Text>
        
        {!isDefault && (
          <TouchableOpacity 
            style={styles.setDefaultButton}
            onPress={() => setAsDefaultAddress(address.id)}
          >
            <Text style={styles.setDefaultButtonText}>Varsayılan Yap</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Yeni adres ekleme butonu
  const AddNewAddressButton = () => {
    console.log("Yeni adres ekle tıklandı");
    navigation.navigate("YeniAdres");
  };

  // Yükleniyor durumu
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>Adresleriniz yükleniyor...</Text>
      </View>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="error-outline" size={48} color="#ff0000" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchAddresses}
        >
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Adres yoksa
  if (addresses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Icon name="location-off" size={64} color="#ccc" />
          <Text style={styles.noAddressText}>Henüz kayıtlı adresiniz bulunmuyor</Text>
          <TouchableOpacity 
            style={styles.addAddressButton}
            onPress={AddNewAddressButton}
          >
            <Text style={styles.addAddressButtonText}>Yeni Adres Ekle</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Normal durum - Adres listesi
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Adreslerim</Text>
        <Text style={styles.headerSubtitle}>Kayıtlı adresleriniz ({addresses.length})</Text>
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <AddressCard address={item} />}
        contentContainerStyle={styles.addressList}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity 
        style={styles.floatingAddButton}
        onPress={AddNewAddressButton}
      >
        <Icon name="add" size={24} color="#fff" />
        <Text style={styles.floatingAddButtonText}>Yeni Adres Ekle</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  addressList: {
    padding: 15,
    paddingBottom: 120, // Floating button ve TabBar için alan sağlıyoruz
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedAddressCard: {
    borderColor: '#FF8C00',
    borderWidth: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#FF8C00',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
  },
  addressText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  addressDetail: {
    fontSize: 14,
    color: '#777',
    marginBottom: 10,
  },
  setDefaultButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FF8C00',
    marginTop: 5,
  },
  setDefaultButtonText: {
    color: '#FF8C00',
    fontSize: 12,
    fontWeight: '500',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 70, // TabBar'ın (60px) üzerinde kalması için değeri arttırdık
    right: 20,
    backgroundColor: '#FF8C00',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 5, // TabBar'dan düşük ama çoğu içerikten yüksek
  },
  floatingAddButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    color: '#ff0000',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noAddressText: {
    marginTop: 15,
    marginBottom: 25,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  addAddressButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  addAddressButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default UserMyAdressScreen;