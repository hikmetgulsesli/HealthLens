import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text, View, StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {CameraScreen} from '../screens/CameraScreen';
import {ReviewScreen} from '../screens/ReviewScreen';
import {DashboardScreen} from '../screens/DashboardScreen';
import {HistoryScreen} from '../screens/HistoryScreen';
import {ProfileScreen} from '../screens/ProfileScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Review: undefined;
};

export type MainTabParamList = {
  CameraTab: undefined;
  Dashboard: undefined;
  History: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({label, focused}: {label: string; focused: boolean}) {
  return (
    <View style={styles.tabItem}>
      <View
        style={[
          styles.tabDot,
          {backgroundColor: focused ? colors.primary : colors.onSurfaceVariant},
        ]}
      />
      <Text
        style={[
          styles.tabLabel,
          {color: focused ? colors.primary : colors.onSurfaceVariant},
        ]}>
        {label}
      </Text>
    </View>
  );
}

function CameraTabStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}>
      <Tab.Screen
        name="CameraTab"
        component={CameraScreen}
        options={{
          tabBarIcon: ({focused}) => <TabIcon label="Kamera" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({focused}) => <TabIcon label="Özet" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({focused}) => <TabIcon label="Geçmiş" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon label="Profil" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <CameraTabStack />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surfaceContainerLow,
    borderTopWidth: 0.5,
    borderTopColor: colors.outline,
    height: 64,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
