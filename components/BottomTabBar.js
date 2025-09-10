import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Ek yükseklik değeri (piksel)
const EXTRA_HEIGHT = 1; // Bu değeri artırıp azaltarak istediğiniz yüksekliğe getirebilirsiniz

function BottomTabBar() {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const currentRouteName = route.name;
    
    // Tab elementleri için veri yapısı
    const tabs = [
        {
            name: 'Ana Sayfa',
            routeName: 'Main',
            icon: 'home'
        },
        {
            name: 'Sepet',
            routeName: 'Sepet',
            icon: 'shopping-cart'
        },
        {
            name: 'Siparişlerim',
            routeName: 'Siparislerim',
            icon: 'list'
        },
        {
            name: 'Hesap',
            routeName: 'Hesap',
            icon: 'user'
        }
    ];

    // Taba tıklandığında çalışacak fonksiyon
    const handleTabPress = (routeName) => {
        navigation.navigate(routeName);
    };

    // Platform ve cihaza göre bottom padding hesaplama
    const getBottomPadding = () => {
        // insets.bottom değeri 0 veya tanımsız ise (hatalı ise), platform bazlı sabit değer kullan
        if (!insets || insets.bottom === undefined || insets.bottom === 0) {
            // Android için daha yüksek değer kullan
            return Platform.OS === 'android' ? 15 : 0;
        }
        // insets düzgün çalışıyorsa o değeri kullan
        return insets.bottom;
    };

    return (
        <View style={[
            styles.container,
            { 
                height: 60 + EXTRA_HEIGHT + getBottomPadding(),
                paddingBottom: getBottomPadding()
            }
        ]}>
            {tabs.map((tab, index) => {
                // Aktif tab kontrolü
                const isActive = currentRouteName === tab.routeName;
                
                return (
                    <TouchableOpacity
                        key={index}
                        style={styles.tabItem}
                        onPress={() => handleTabPress(tab.routeName)}
                        activeOpacity={0.7}
                    >
                        <Icon 
                            name={tab.icon} 
                            size={24} 
                            color={isActive ? '#FF8C00' : '#757575'} 
                        />
                        <Text 
                            style={[
                                styles.tabText,
                                isActive ? styles.activeTabText : styles.inactiveTabText
                            ]}
                        >
                            {tab.name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 60, // Bu değer, üstteki height hesaplamasında değiştirilecek
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        elevation: 10, // Android gölge efekti
        shadowColor: '#000', // iOS gölge efekti
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        position: 'absolute', // Ekranın en altına sabitlemek için
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999, // Diğer elementlerin üzerinde gösterilmesi için
        paddingTop: 0, // Butonları üstte tutmak için
    },
    tabItem: {
        flex: 1,
        justifyContent: 'flex-start', // Butonları üstte hizalamak için
        alignItems: 'center',
        paddingTop: 8,
        height: 60, // Butonların yüksekliğini sabit tutmak için
    },
    tabText: {
        fontSize: 10,
        marginTop: 3,
    },
    activeTabText: {
        color: '#FF8C00', // Ana tema renginiz
        fontWeight: '600',
    },
    inactiveTabText: {
        color: '#757575',
    }
});

export default BottomTabBar;