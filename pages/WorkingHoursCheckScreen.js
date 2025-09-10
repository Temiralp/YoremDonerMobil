import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  BackHandler,
  ActivityIndicator 
} from 'react-native';
import { API_URL } from '../src/config/api';

function WorkingHoursCheckScreen() {
  const [loading, setLoading] = useState(true);
  const [workingHours, setWorkingHours] = useState([]);
  const [currentDay, setCurrentDay] = useState(null);

  useEffect(() => {
    checkWorkingHours();
  }, []);

  const checkWorkingHours = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/restaurant-hours/check`);
      const data = await response.json();
      
      if (response.ok) {
        // Çalışma saatlerini kaydet
        if (data.working_hours) {
          setWorkingHours(data.working_hours);
        }
        
        // Güncel günü ayarla
        setCurrentDay(new Date().getDay());
      }
    } catch (error) {
      console.error('Çalışma saatleri kontrolünde hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseApp = () => {
    BackHandler.exitApp(); // Android için uygulamayı kapatır
  };

  const formatTime = (timeString) => {
    // '08:30:00' formatını '08:30' formatına çevirir
    return timeString ? timeString.substring(0, 5) : '';
  };

  const getDayName = (dayNum) => {
    const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    return days[dayNum];
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Çalışma saatleri kontrol ediliyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.messageBox}>
        <Text style={styles.headerText}>Çalışma Saatleri Dışındayız</Text>
        
        <Text style={styles.subText}>
          Şu anda hizmet veremiyoruz. Lütfen çalışma saatlerimiz içinde tekrar ziyaret edin.
        </Text>
        
        <View style={styles.hoursContainer}>
          <Text style={styles.hoursHeaderText}>Çalışma Saatlerimiz:</Text>
          
          {workingHours && workingHours.opening_time && workingHours.closing_time ? (
            <Text style={styles.todayHoursText}>
              Bugün ({getDayName(currentDay)}): {formatTime(workingHours.opening_time)} - {formatTime(workingHours.closing_time)}
            </Text>
          ) : (
            <Text style={styles.todayHoursText}>
              Bugün ({getDayName(currentDay)}): Kapalıyız
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleCloseApp}
        >
          <Text style={styles.closeButtonText}>Uygulamayı Kapat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  messageBox: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FF6B00',
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
    lineHeight: 22,
  },
  hoursContainer: {
    backgroundColor: '#f8f8f8',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#eee',
  },
  hoursHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  todayHoursText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FF6B00',
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
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
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default WorkingHoursCheckScreen;