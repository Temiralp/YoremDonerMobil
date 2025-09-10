import React, { useState } from 'react';
import {
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    SafeAreaView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator // Bu satırı ekleyin
} from 'react-native';
import { useKullanici } from '../context/KullaniciContext';
import { API_URL } from '../src/config/api';

function UserRegisterScreen(props) {
    // State'ler
    const [ad, setAd] = useState('');
    const [soyad, setSoyad] = useState('');
    const [email, setEmail] = useState('');
    const [telefon, setTelefon] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);

    // Context hook'ları
    const { 
        setAd: contextSetAd, 
        setSoyad: contextSetSoyad, 
        setTelefonNumarasi,
        setPurpose 
    } = useKullanici();

    // Form doğrulama fonksiyonu
    const validateForm = () => {
        // Ad soyad kontrolü
        if (!ad.trim()) {
            Alert.alert('Hata', 'Ad alanı boş bırakılamaz');
            return false;
        }

        if (!soyad.trim()) {
            Alert.alert('Hata', 'Soyad alanı boş bırakılamaz');
            return false;
        }

        // Telefon numarası kontrolü
        const telefonRegex = /^5\d{9}$/;
        if (!telefon.trim()) {
            Alert.alert('Hata', 'Telefon numarası boş bırakılamaz');
            return false;
        }
        if (!telefonRegex.test(telefon)) {
            Alert.alert('Hata', 'Geçerli bir telefon numarası girin (5XXXXXXXXX formatında)');
            return false;
        }

        // E-posta kontrolü (isteğe bağlı)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.trim() && !emailRegex.test(email)) {
            Alert.alert('Hata', 'Geçerli bir e-posta adresi girin');
            return false;
        }

        return true;
    };

    // Kayıt işlemi
    const handleRegister = async () => {
        // Form doğrulaması
        if (!validateForm()) {
            return;
        }

        setYukleniyor(true);

        try {
            // Backend'e kayıt isteği
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: ad,
                    surname: soyad,
                    email: email || null, // E-posta boş olabilir
                    phone: telefon
                }),
            });

            // Yanıtı text olarak al
            const responseText = await response.text();
            
            let data;
            try {
                // JSON parse etmeye çalış
                data = JSON.parse(responseText);
            } catch (parseError) {
                // JSON parse edilemezse
                console.error('JSON parse hatası:', parseError);
                console.error('Ham yanıt:', responseText);
                
                throw new Error('Sunucudan gelen yanıt işlenemedi');
            }

            if (!response.ok) {
                // Sunucudan gelen spesifik hata mesajını göster
                const errorMessage = data.error || 
                    data.message || 
                    'Kayıt işlemi başarısız';
                
                // Yaygın hata senaryoları için özel mesajlar
                if (errorMessage.includes('telefon numarası zaten kayıtlı')) {
                    throw new Error('Bu telefon numarası zaten kullanılmaktadır. Lütfen başka bir numara deneyin.');
                }
                
                throw new Error(errorMessage);
            }

            // Context'e bilgileri kaydet
            contextSetAd(ad);
            contextSetSoyad(soyad);
            setTelefonNumarasi(telefon);
            setPurpose("registration");

            // Doğrulama ekranına yönlendir
            props.navigation.navigate('Verification');

        } catch (error) {
            // Hata durumunda kullanıcıyı bilgilendirme
            console.error('Kayıt hatası:', error);
            
            // Ağ hatası veya bağlantı problemi
            if (error.message.includes('fetch')) {
                Alert.alert(
                    'Bağlantı Hatası', 
                    'Sunucuya bağlanırken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin.'
                );
            } else {
                // Diğer hatalar
                Alert.alert(
                    'Kayıt Hatası', 
                    error.message || 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.'
                );
            }
        } finally {
            setYukleniyor(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.title}>Kayıt Ol</Text>

                    {/* Ad Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Ad</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Adınızı girin"
                            value={ad}
                            onChangeText={setAd}
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Soyad Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Soyad</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Soyadınızı girin"
                            value={soyad}
                            onChangeText={setSoyad}
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Telefon Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Telefon Numarası</Text>
                        <View style={styles.phoneInputContainer}>
                            <Text style={styles.phonePrefix}>0</Text>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="5XX XXX XX XX"
                                value={telefon}
                                onChangeText={setTelefon}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        </View>
                    </View>

                    {/* E-posta Input (İsteğe Bağlı) */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>E-posta (İsteğe Bağlı)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="E-posta adresinizi girin"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Kayıt Butonu */}
                    <TouchableOpacity 
                        style={styles.registerButton}
                        onPress={handleRegister}
                        disabled={yukleniyor}
                    >
                        {yukleniyor ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.registerButtonText}>Kayıt Ol</Text>
                        )}
                    </TouchableOpacity>

                    {/* Giriş Yap Bağlantısı */}
                    <View style={styles.loginLinkContainer}>
                        <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
                        <TouchableOpacity 
                            onPress={() => props.navigation.navigate('Login')}
                        >
                            <Text style={styles.loginLinkText}>Giriş Yap</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: '5%',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '8%',
        color: '#FF6B00', // Turuncu tema rengi
    },
    inputContainer: {
        marginBottom: '4%',
        width: '100%',
    },
    label: {
        marginBottom: '1.5%',
        color: '#555',
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
    },
    phonePrefix: {
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#666',
        borderRightWidth: 1,
        borderRightColor: '#ddd',
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
    },
    registerButton: {
        backgroundColor: '#FF6B00', // Turuncu tema rengi
        borderRadius: 25, // Daha yuvarlak butonlar
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: '5%',
        shadowColor: "#FF6B00",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
        elevation: 5,
        width: '100%',
    },
    registerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: '5%',
    },
    loginText: {
        color: '#666',
    },
    loginLinkText: {
        color: '#FF6B00', // Turuncu tema rengi
        fontWeight: 'bold',
    },
});

export default UserRegisterScreen;