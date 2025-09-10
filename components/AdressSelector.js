import React, { useEffect, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { API_URL } from '../src/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

function AdresSelector({ adresBilgileri, onAdresChange }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Bölge verileri
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [neighborhoods, setNeighborhoods] = useState([]);
    const [streets, setStreets] = useState([]);
    
    // Form alanları
    const [title, setTitle] = useState(adresBilgileri?.title || '');
    const [selectedCity, setSelectedCity] = useState(adresBilgileri?.city || '');
    const [selectedDistrict, setSelectedDistrict] = useState(adresBilgileri?.district || '');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState(adresBilgileri?.neighborhood || '');
    const [selectedStreet, setSelectedStreet] = useState(adresBilgileri?.street || '');
    const [addressDetail, setAddressDetail] = useState(adresBilgileri?.address_detail || '');
    const [isDefault, setIsDefault] = useState(adresBilgileri?.is_default === 1 || false);

    // Form dokunulmuşluk durumları
    const [touched, setTouched] = useState({
        title: false,
        city: false,
        district: false,
        neighborhood: false,
        street: false,
        addressDetail: false
    });

    // Hata mesajları için state'ler
    const [errors, setErrors] = useState({
        title: false,
        city: false,
        district: false,
        neighborhood: false,
        street: false,
        addressDetail: false
    });

    // Bölge ve adres verilerini getir
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const response = await fetch(`${API_URL}/api/addresses/regions`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const responseData = await response.json();

                if (responseData.status === "success") {
                    // Veri yapısını işle
                    const cityList = Object.keys(responseData.data);
                    setCities(cityList);
                    
                    // Eğer önceden seçilmiş bir şehir varsa, onun ilçelerini de yükle
                    if (selectedCity && responseData.data[selectedCity]) {
                        const districtList = Object.keys(responseData.data[selectedCity]);
                        setDistricts(districtList);
                        
                        // Eğer önceden seçilmiş bir ilçe varsa, onun mahallelerini de yükle
                        if (selectedDistrict && responseData.data[selectedCity][selectedDistrict]) {
                            const neighborhoodList = Object.keys(responseData.data[selectedCity][selectedDistrict]);
                            setNeighborhoods(neighborhoodList);
                            
                            // Eğer önceden seçilmiş bir mahalle varsa, onun sokaklarını da yükle
                            if (selectedNeighborhood && responseData.data[selectedCity][selectedDistrict][selectedNeighborhood]) {
                                const streetList = responseData.data[selectedCity][selectedDistrict][selectedNeighborhood];
                                setStreets(streetList);
                            }
                        }
                    }
                    
                    setLoading(false);
                } else {
                    throw new Error('Bölge bilgileri alınamadı');
                }
            } catch (err) {
                console.error('Bölge verileri getirme hatası:', err);
                setError('Bölge bilgileri yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // adresBilgileri prop'undaki değişiklikleri izle
    useEffect(() => {
        // Form bilgileri dışarıdan boşaltıldıysa, tüm form alanlarını temizle
        if (Object.keys(adresBilgileri).length === 0) {
            console.log("AdresSelector: Form temizleniyor...");
            setTitle('');
            setSelectedCity('');
            setSelectedDistrict('');
            setSelectedNeighborhood('');
            setSelectedStreet('');
            setAddressDetail('');
            setIsDefault(false);
            
            // Sadece cities dışındaki listeleri temizle (cities API'den geldiği için korunmalı)
            setDistricts([]);
            setNeighborhoods([]);
            setStreets([]);
            
            // Dokunulmuşluk durumlarını ve hataları da sıfırla
            setTouched({
                title: false,
                city: false,
                district: false,
                neighborhood: false,
                street: false,
                addressDetail: false
            });
            
            setErrors({
                title: false,
                city: false,
                district: false,
                neighborhood: false,
                street: false,
                addressDetail: false
            });
        }
    }, [adresBilgileri]);

    // Dokunulan alanı işaretle
    const handleTouch = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    // Değer değişikliğinde dokunulduğunu işaretle ve validasyonu çağır
    const handleChange = (field, value, setter) => {
        setter(value);
        handleTouch(field);
    };

    // Alan doğrulama fonksiyonu - yalnızca dokunulan alanlar için hata göster
    const validateFields = () => {
        const newErrors = {
            title: touched.title && title === '',
            city: touched.city && selectedCity === '',
            district: touched.district && selectedDistrict === '',
            neighborhood: touched.neighborhood && selectedNeighborhood === '',
            street: touched.street && selectedStreet === '',
            addressDetail: touched.addressDetail && addressDetail === ''
        };
        
        setErrors(newErrors);
        return newErrors;
    };
    
    // Formun tamamının geçerli olup olmadığını kontrol et
    const isFormValid = () => {
        return (
            title !== '' && 
            selectedCity !== '' && 
            selectedDistrict !== '' && 
            selectedNeighborhood !== '' && 
            selectedStreet !== '' && 
            addressDetail !== ''
        );
    };

    // Adres bilgilerini her değişiklikte güncelle
    useEffect(() => {
        // Dokunulan alanların doğrulamasını yap
        validateFields();
        
        // Debug için seçilen değerleri loglayalım
        console.log("Adres bilgileri güncelleniyor:", {
            title, 
            selectedCity, 
            selectedDistrict, 
            selectedNeighborhood, 
            selectedStreet, 
            addressDetail
        });
        
        onAdresChange({
            title,
            city: selectedCity,
            district: selectedDistrict,
            neighborhood: selectedNeighborhood,
            street: selectedStreet,
            address_detail: addressDetail,
            is_default: isDefault ? 1 : 0,
            isValid: isFormValid(),
            validate: () => {
                // Tüm alanları dokunulmuş olarak işaretle
                setTouched({
                    title: true,
                    city: true,
                    district: true,
                    neighborhood: true,
                    street: true,
                    addressDetail: true
                });
                
                // Doğrulama yap ve sonucu döndür
                const validationErrors = {
                    title: title === '',
                    city: selectedCity === '',
                    district: selectedDistrict === '',
                    neighborhood: selectedNeighborhood === '',
                    street: selectedStreet === '',
                    addressDetail: addressDetail === ''
                };
                
                setErrors(validationErrors);
                
                return !Object.values(validationErrors).some(error => error);
            }
        });
    }, [title, selectedCity, selectedDistrict, selectedNeighborhood, selectedStreet, addressDetail, isDefault, touched]);

    // Şehir değiştiğinde
    useEffect(() => {
        if (selectedCity) {
            const fetchDistricts = async () => {
                try {
                    const token = await AsyncStorage.getItem('userToken');
                    const response = await fetch(`${API_URL}/api/addresses/regions`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const data = await response.json();
                    
                    if (data.status === "success" && data.data[selectedCity]) {
                        const districtList = Object.keys(data.data[selectedCity]);
                        setDistricts(districtList);
                        
                        // İlçe, mahalle ve sokak seçimlerini sıfırla
                        setSelectedDistrict('');
                        setSelectedNeighborhood('');
                        setSelectedStreet('');
                        setNeighborhoods([]);
                        setStreets([]);
                        
                        // İlçe için dokunulmuş durumunu sıfırla
                        setTouched(prev => ({ ...prev, district: false }));
                        setErrors(prev => ({ ...prev, district: false }));
                    }
                } catch (error) {
                    console.error("İlçe verisi alınamadı:", error);
                }
            };
            
            fetchDistricts();
        }
    }, [selectedCity]);

    // İlçe değiştiğinde
    useEffect(() => {
        if (selectedCity && selectedDistrict) {
            const fetchNeighborhoods = async () => {
                try {
                    const token = await AsyncStorage.getItem('userToken');
                    const response = await fetch(`${API_URL}/api/addresses/regions`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const data = await response.json();
                    
                    if (data.status === "success" && 
                        data.data[selectedCity] && 
                        data.data[selectedCity][selectedDistrict]) {
                        const neighborhoodList = Object.keys(data.data[selectedCity][selectedDistrict]);
                        setNeighborhoods(neighborhoodList);
                        
                        // Mahalle ve sokak seçimlerini sıfırla
                        setSelectedNeighborhood('');
                        setSelectedStreet('');
                        setStreets([]);
                        
                        // Mahalle için dokunulmuş durumunu sıfırla
                        setTouched(prev => ({ ...prev, neighborhood: false }));
                        setErrors(prev => ({ ...prev, neighborhood: false }));
                    }
                } catch (error) {
                    console.error("Mahalle verisi alınamadı:", error);
                }
            };
            
            fetchNeighborhoods();
        }
    }, [selectedDistrict]);

    // Mahalle değiştiğinde
    useEffect(() => {
        if (selectedCity && selectedDistrict && selectedNeighborhood) {
            const fetchStreets = async () => {
                try {
                    const token = await AsyncStorage.getItem('userToken');
                    const response = await fetch(`${API_URL}/api/addresses/regions`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const data = await response.json();
                    
                    if (data.status === "success" && 
                        data.data[selectedCity] && 
                        data.data[selectedCity][selectedDistrict] &&
                        data.data[selectedCity][selectedDistrict][selectedNeighborhood]) {
                        const streetList = data.data[selectedCity][selectedDistrict][selectedNeighborhood];
                        setStreets(streetList);
                        
                        // Sokak seçimini sıfırla
                        setSelectedStreet('');
                        
                        // Sokak için dokunulmuş durumunu sıfırla
                        setTouched(prev => ({ ...prev, street: false }));
                        setErrors(prev => ({ ...prev, street: false }));
                    }
                } catch (error) {
                    console.error("Sokak verisi alınamadı:", error);
                }
            };
            
            fetchStreets();
        }
    }, [selectedNeighborhood]);

    // Loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text>Bölge bilgileri yükleniyor...</Text>
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    // Android için özel render fonksiyonu
    const renderAndroidForm = () => {
        return (
            <>
                <Text style={styles.cityText}> </Text>
                
                <Text style={styles.label}>Adres Başlığı <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                    style={[styles.input, errors.title && styles.errorBorder]}
                    placeholder="Örn: Ev, İş, Yazlık vb."
                    value={title}
                    onChangeText={(text) => handleChange('title', text, setTitle)}
                    onBlur={() => handleTouch('title')}
                />
                {errors.title && <Text style={styles.errorText}>Adres başlığı girilmesi zorunludur</Text>}

                <Text style={styles.label}>Şehir <Text style={styles.requiredStar}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.city && styles.errorBorder]}>
                    <Text style={styles.selectedValueText}>
                        {selectedCity || "Şehir seçin"}
                    </Text>
                    <Picker
                        selectedValue={selectedCity}
                        onValueChange={(value) => handleChange('city', value, setSelectedCity)}
                        style={styles.androidPicker}
                        onBlur={() => handleTouch('city')}
                    >
                        <Picker.Item label="Şehir seçin" value="" />
                        {cities.map((city) => (
                            <Picker.Item key={city} label={city} value={city} />
                        ))}
                    </Picker>
                </View>
                {errors.city && <Text style={styles.errorText}>Şehir seçimi zorunludur</Text>}

                <Text style={styles.label}>İlçe <Text style={styles.requiredStar}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.district && styles.errorBorder]}>
                    <Text style={styles.selectedValueText}>
                        {selectedDistrict || "İlçe seçin"}
                    </Text>
                    <Picker
                        selectedValue={selectedDistrict}
                        onValueChange={(value) => handleChange('district', value, setSelectedDistrict)}
                        style={styles.androidPicker}
                        enabled={districts.length > 0}
                        onBlur={() => handleTouch('district')}
                    >
                        <Picker.Item label="İlçe seçin" value="" />
                        {districts.map((district) => (
                            <Picker.Item key={district} label={district} value={district} />
                        ))}
                    </Picker>
                </View>
                {errors.district && <Text style={styles.errorText}>İlçe seçimi zorunludur</Text>}

                <Text style={styles.label}>Mahalle <Text style={styles.requiredStar}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.neighborhood && styles.errorBorder]}>
                    <Text style={styles.selectedValueText}>
                        {selectedNeighborhood || "Mahalle seçin"}
                    </Text>
                    <Picker
                        selectedValue={selectedNeighborhood}
                        onValueChange={(value) => handleChange('neighborhood', value, setSelectedNeighborhood)}
                        style={styles.androidPicker}
                        enabled={neighborhoods.length > 0}
                        onBlur={() => handleTouch('neighborhood')}
                    >
                        <Picker.Item label="Mahalle seçin" value="" />
                        {neighborhoods.map((neighborhood) => (
                            <Picker.Item key={neighborhood} label={neighborhood} value={neighborhood} />
                        ))}
                    </Picker>
                </View>
                {errors.neighborhood && <Text style={styles.errorText}>Mahalle seçimi zorunludur</Text>}

                <Text style={styles.label}>Sokak <Text style={styles.requiredStar}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.street && styles.errorBorder]}>
                    <Text style={styles.selectedValueText}>
                        {selectedStreet || "Sokak seçin"}
                    </Text>
                    <Picker
                        selectedValue={selectedStreet}
                        onValueChange={(value) => handleChange('street', value, setSelectedStreet)}
                        style={styles.androidPicker}
                        enabled={streets.length > 0}
                        onBlur={() => handleTouch('street')}
                    >
                        <Picker.Item label="Sokak seçin" value="" />
                        {streets.map((street) => (
                            <Picker.Item key={street} label={street} value={street} />
                        ))}
                    </Picker>
                </View>
                {errors.street && <Text style={styles.errorText}>Sokak seçimi zorunludur</Text>}

                <Text style={styles.label}>Adres Detayı <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                    style={[styles.textArea, errors.addressDetail && styles.errorBorder]}
                    placeholder="Bina no, daire no, kat, vb. adres detaylarını yazın"
                    value={addressDetail}
                    onChangeText={(text) => handleChange('addressDetail', text, setAddressDetail)}
                    multiline={true}
                    numberOfLines={4}
                    onBlur={() => handleTouch('addressDetail')}
                />
                {errors.addressDetail && <Text style={styles.errorText}>Adres detayı girilmesi zorunludur</Text>}

                <View style={styles.checkboxContainer}>
                    <Text style={styles.label}>Varsayılan Adresim</Text>
                    <View style={styles.pickerContainer}>
                        <Text style={styles.selectedValueText}>
                            {isDefault ? "Evet" : "Hayır"}
                        </Text>
                        <Picker
                            selectedValue={isDefault ? "1" : "0"}
                            onValueChange={(value) => setIsDefault(value === "1")}
                            style={styles.androidPicker}
                        >
                            <Picker.Item label="Hayır" value="0" />
                            <Picker.Item label="Evet" value="1" />
                        </Picker>
                    </View>
                </View>

                {/* Formun altına butonların görünmesi için ekstra boş alan */}
                <View style={styles.extraSpace} />
            </>
        );
    };

    // iOS için normal render fonksiyonu
    const renderIOSForm = () => {
        return (
            <>
                <Text style={styles.cityText}> </Text>
                
                <Text style={styles.label}>Adres Başlığı <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                    style={[styles.input, errors.title && styles.errorBorder]}
                    placeholder="Örn: Ev, İş, Yazlık vb."
                    value={title}
                    onChangeText={(text) => handleChange('title', text, setTitle)}
                    onBlur={() => handleTouch('title')}
                />
                {errors.title && <Text style={styles.errorText}>Adres başlığı girilmesi zorunludur</Text>}

                <Text style={styles.label}>Şehir <Text style={styles.requiredStar}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.city && styles.errorBorder]}>
                    <Picker
                        selectedValue={selectedCity}
                        onValueChange={(value) => handleChange('city', value, setSelectedCity)}
                        style={styles.picker}
                        onBlur={() => handleTouch('city')}
                    >
                        <Picker.Item label="Şehir seçin" value="" />
                        {cities.map((city) => (
                            <Picker.Item key={city} label={city} value={city} />
                        ))}
                    </Picker>
                </View>
                {errors.city && <Text style={styles.errorText}>Şehir seçimi zorunludur</Text>}

                <Text style={styles.label}>İlçe <Text style={styles.requiredStar}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.district && styles.errorBorder]}>
                    <Picker
                        selectedValue={selectedDistrict}
                        onValueChange={(value) => handleChange('district', value, setSelectedDistrict)}
                        style={styles.picker}
                        enabled={districts.length > 0}
                        onBlur={() => handleTouch('district')}
                    >
                        <Picker.Item label="İlçe seçin" value="" />
                        {districts.map((district) => (
                            <Picker.Item key={district} label={district} value={district} />
                        ))}
                    </Picker>
                </View>
                {errors.district && <Text style={styles.errorText}>İlçe seçimi zorunludur</Text>}

                <Text style={styles.label}>Mahalle <Text style={styles.requiredStar}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.neighborhood && styles.errorBorder]}>
                    <Picker
                        selectedValue={selectedNeighborhood}
                        onValueChange={(value) => handleChange('neighborhood', value, setSelectedNeighborhood)}
                        style={styles.picker}
                        enabled={neighborhoods.length > 0}
                        onBlur={() => handleTouch('neighborhood')}
                    >
                        <Picker.Item label="Mahalle seçin" value="" />
                        {neighborhoods.map((neighborhood) => (
                            <Picker.Item key={neighborhood} label={neighborhood} value={neighborhood} />
                        ))}
                    </Picker>
                </View>
                {errors.neighborhood && <Text style={styles.errorText}>Mahalle seçimi zorunludur</Text>}

                <Text style={styles.label}>Sokak <Text style={styles.requiredStar}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.street && styles.errorBorder]}>
                    <Picker
                        selectedValue={selectedStreet}
                        onValueChange={(value) => handleChange('street', value, setSelectedStreet)}
                        style={styles.picker}
                        enabled={streets.length > 0}
                        onBlur={() => handleTouch('street')}
                    >
                        <Picker.Item label="Sokak seçin" value="" />
                        {streets.map((street) => (
                            <Picker.Item key={street} label={street} value={street} />
                        ))}
                    </Picker>
                </View>
                {errors.street && <Text style={styles.errorText}>Sokak seçimi zorunludur</Text>}

                <Text style={styles.label}>Adres Detayı <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                    style={[styles.textArea, errors.addressDetail && styles.errorBorder]}
                    placeholder="Bina no, daire no, kat, vb. adres detaylarını yazın"
                    value={addressDetail}
                    onChangeText={(text) => handleChange('addressDetail', text, setAddressDetail)}
                    multiline={true}
                    numberOfLines={4}
                    onBlur={() => handleTouch('addressDetail')}
                />
                {errors.addressDetail && <Text style={styles.errorText}>Adres detayı girilmesi zorunludur</Text>}

                <View style={styles.checkboxContainer}>
                    <Text style={styles.label}>Varsayılan Adresim</Text>
                    <Picker
                        selectedValue={isDefault ? "1" : "0"}
                        onValueChange={(value) => setIsDefault(value === "1")}
                        style={styles.picker}
                    >
                        <Picker.Item label="Hayır" value="0" />
                        <Picker.Item label="Evet" value="1" />
                    </Picker>
                </View>

                {/* Formun altına butonların görünmesi için ekstra boş alan */}
                <View style={styles.extraSpace} />
            </>
        );
    };

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
        >
            {Platform.OS === 'android' ? renderAndroidForm() : renderIOSForm()}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    contentContainer: {
        padding: 15,
        paddingBottom: 120, // BottomTabBar'a ek olarak butonlar için boşluk
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        padding: 20
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        padding: 20
    },
    cityText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center'
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 5,
        color: '#555',
    },
    requiredStar: {
        color: 'red',
        fontSize: 16,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        marginBottom: 15,
        backgroundColor: 'white',
        overflow: 'hidden',
        height: 50, // Tutarlı yükseklik
        justifyContent: 'center', // İçeriği dikey olarak ortala
    },
    picker: {
        height: 50,
        width: '100%',
    },
    // Android için özel stiller
    androidPicker: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0, // Görünmez ama çalışan Picker
        height: 50,
    },
    selectedValueText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 10,
        textAlignVertical: 'center',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 10,
        marginBottom: 15,
        backgroundColor: 'white',
    },
    textArea: {
        height: 100,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 10,
        marginBottom: 15,
        textAlignVertical: 'top',
        backgroundColor: 'white',
    },
    checkboxContainer: {
        marginBottom: 20, // Alt boşluk
    },
    errorBorder: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginBottom: 15,
    },
    // Formun altına ekstra boşluk
    extraSpace: {
        height: 80, // Kaydet butonunun görünür olması için ekstra alan
    }
});

export default AdresSelector;