import React from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ImageBackground, 
    Image,
    StatusBar,
    SafeAreaView,
    Dimensions
} from 'react-native';

const { width, height } = Dimensions.get('window');

function StartScreen(props) {
    function handleLogin() {
        console.log('Giriş yap tıklandı');
        props.navigation.navigate('Login');
    }

    function handleRegister() {
        console.log('Kayıt ol tıklandı');
        props.navigation.navigate('Register');
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" />
            
            {/* Arka plan görseli - Türk Restoran/Gıda teması */}
            <ImageBackground 
                source={require('./background.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                {/* Karanlık overlay */}
                <View style={styles.overlay}>
                    {/* Logo alanı */}
                    <View style={styles.logoContainer}>
                        <Image 
                   source={require('./background.png')}
                            style={styles.logoImage}
                            resizeMode="cover"
                        />
                        <Text style={styles.logoText}>Yörem Döner</Text>
                        <Text style={styles.logoSubText}>Lezzetin adresi</Text>
                    </View>
                    
                    {/* Alt kısım içeriği */}
                    <View style={styles.bottomContent}>
                        <Text style={styles.title}>Hoş Geldiniz</Text>
                        <Text style={styles.subtitle}>Lezzetli yemekler bir tık uzağınızda</Text>
                        
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={handleLogin}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.loginButtonText}>Giriş Yap</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={styles.registerButton}
                                onPress={handleRegister}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.registerButtonText}>Kayıt Ol</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'space-between', // Logoyu üstte, içeriği altta konumlandırır
        paddingVertical: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: height * 0.1, // Ekranın üst kısmından belirli bir mesafe
        width: '100%',
    },
    logoImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: 'white',
        marginBottom: 15,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    logoSubText: {
        fontSize: 16,
        color: 'white',
        marginTop: 5,
        fontStyle: 'italic',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 5
    },
    bottomContent: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'white',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    subtitle: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 40,
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 5
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 300
    },
    loginButton: {
        backgroundColor: '#FF6B00',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: "#FF6B00",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
        elevation: 5,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    },
    registerButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 15,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'white',
        alignItems: 'center'
    },
    registerButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    }
});

export default StartScreen;