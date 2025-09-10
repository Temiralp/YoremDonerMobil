import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KullaniciContext = createContext();

export const KullaniciProvider = ({ children }) => {
    // Kullanıcı bilgileri
    const [kullaniciId, setKullaniciId] = useState();
    const [userToken, setUserToken] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [userType, setUserType] = useState(null);
    const [kayitliDogrulamaKodu, setKayitliDogrulamaKodu] = useState('');
    const [telefonNumarasi, setTelefonNumarasi] = useState('');
    const [ad, setAd] = useState('');
    const [soyad, setSoyad] = useState('');
    const [kvkkOnay, setKvkkOnay] = useState(false);
    const [purpose, setPurpose] = useState('login'); // 'login', 'register'
    
    // Sipariş ve ödeme bilgileri
    const [siparisDetaylari, setSiparisDetaylari] = useState(null);
    
    // Adres bilgileri
    const [adresBilgileri, setAdresBilgileri] = useState(null);
    
    // Sepet bilgileri
    const [sepetUrunleri, setSepetUrunleri] = useState([]);
    
    // AsyncStorage'dan kullanıcı verileri yükleme
    useEffect(() => {
        const loadUserData = async () => {
            try {
                // Kullanıcı kimlik bilgileri
                const id = await AsyncStorage.getItem('userId');
                const token = await AsyncStorage.getItem('userToken');
                const type = await AsyncStorage.getItem('userType');
                const isLoggedInValue = await AsyncStorage.getItem('isLoggedIn');
                
                // Kişisel bilgiler
                const phone = await AsyncStorage.getItem('telefonNumarasi');
                const firstName = await AsyncStorage.getItem('ad');
                const lastName = await AsyncStorage.getItem('soyad');
                
                // Değerleri state'lere aktarma
                if (id) {
                    setKullaniciId(id);
                }
                
                if (token) {
                    setUserToken(token);
                }
                
                if (isLoggedInValue === 'true') {
                    setIsLoggedIn(true);
                }
                
                if (type) setUserType(type);
                if (phone) setTelefonNumarasi(phone);
                if (firstName) setAd(firstName);
                if (lastName) setSoyad(lastName);
                
            } catch (error) {
                console.error('AsyncStorage veri yükleme hatası:', error);
            }
        };
        
        loadUserData();
    }, []);
    
    // Kullanıcı giriş işlemi
    const login = async (token, id, type, name, surname, phone) => {
        try {
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userId', id.toString());
            await AsyncStorage.setItem('isLoggedIn', 'true');
            if (type) await AsyncStorage.setItem('userType', type);
            if (name) await AsyncStorage.setItem('ad', name);
            if (surname) await AsyncStorage.setItem('soyad', surname);
            if (phone) await AsyncStorage.setItem('telefonNumarasi', phone);
            
            setUserToken(token);
            setKullaniciId(id);
            setUserType(type);
            setAd(name || '');
            setSoyad(surname || '');
            setTelefonNumarasi(phone || '');
            setIsLoggedIn(true);
        } catch (error) {
            console.error('Login ve AsyncStorage hatası:', error);
        }
    };
    
    // Kullanıcı çıkış işlemi
// Kullanıcı çıkış işlemi - Güncellendi
const logout = async () => {
    try {
        // İlk olarak AsyncStorage'ı temizle
        const keys = [
            'userToken', 
            'userId', 
            'userType', 
            'ad', 
            'soyad', 
            'telefonNumarasi',
            'isLoggedIn'
        ];
        await AsyncStorage.multiRemove(keys);
        
        // Sonra context state'lerini temizle
        setUserToken(null);
        setKullaniciId(null);
        setUserType(null);
        setAd('');
        setSoyad('');
        setTelefonNumarasi('');
        setIsLoggedIn(false);
        setSepetUrunleri([]);
        
        // İşlemin tamamlandığından emin olmak için kısa bir bekleme ekle
        return new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
        console.error('Logout hatası:', error);
        throw error; // Hata durumunda hatayı ilet
    }
};
    
    // Sepete ürün ekleme yardımcı fonksiyonu
    const sepeteUrunEkle = (urun) => {
        setSepetUrunleri(prevUrunler => [...prevUrunler, urun]);
    };
    
    // Sepetten ürün kaldırma
    const sepettenUrunKaldir = (urunId) => {
        setSepetUrunleri(prevUrunler => 
            prevUrunler.filter(urun => urun.id !== urunId)
        );
    };
    
    return (
        <KullaniciContext.Provider
            value={{
                // Kullanıcı bilgileri
                kullaniciId,
                setKullaniciId,
                userToken,
                isLoggedIn,
                userType,
                telefonNumarasi,
                setTelefonNumarasi,
                ad,
                setAd,
                soyad,
                setSoyad,
                kvkkOnay,
                setKvkkOnay,
                kayitliDogrulamaKodu,
                setKayitliDogrulamaKodu,
                purpose,
                setPurpose,
                
                // Kullanıcı işlemleri
                login,
                logout,
                
                // Sipariş detayları
                siparisDetaylari,
                setSiparisDetaylari,
                
                // Adres bilgileri
                adresBilgileri,
                setAdresBilgileri,
                
                // Sepet bilgileri
                sepetUrunleri,
                setSepetUrunleri,
                sepeteUrunEkle,
                sepettenUrunKaldir
            }}
        >
            {children}
        </KullaniciContext.Provider>
    );
};

export const useKullanici = () => useContext(KullaniciContext);

export default KullaniciContext;