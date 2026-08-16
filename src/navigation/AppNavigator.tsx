import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, withAlpha } from '../theme/colors';
import { tr } from '../i18n';
import { CameraScreen } from '../screens/CameraScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { useUserStore } from '../stores/userStore';
import { RootContainer } from '../components/common/RootContainer';

export type RootStackParamList = {
  MainTabs: undefined;
  Review: undefined;
  CameraTab: undefined;
  Onboarding: undefined;
  Paywall: undefined;
};

export type MainTabParamList = {
  CameraTab: undefined;
  Dashboard: undefined;
  History: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <Icon
      name={name}
      size={24}
      color={focused ? colors.onPrimaryContainer : colors.onSurfaceVariant}
      style={styles.tabIcon}
    />
  );
}

const CameraIcon = ({ focused }: { focused: boolean }) => (
  <TabBarIcon name="photo-camera" focused={focused} />
);

const DashboardIcon = ({ focused }: { focused: boolean }) => (
  <TabBarIcon name="dashboard" focused={focused} />
);

const HistoryIcon = ({ focused }: { focused: boolean }) => (
  <TabBarIcon name="folder-open" focused={focused} />
);

const ProfileIcon = ({ focused }: { focused: boolean }) => (
  <TabBarIcon name="settings" focused={focused} />
);

function CameraTabStack() {
  const isFirstLaunch = useUserStore(s => s.profile.isFirstLaunch);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isFirstLaunch ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="Review"
            component={ReviewScreen}
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: colors.onPrimaryContainer,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarActiveBackgroundColor: withAlpha(colors.primaryContainer, 0.3),
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="CameraTab"
        component={CameraScreen}
        options={{
          tabBarLabel: tr.tabs.camera,
          tabBarIcon: CameraIcon,
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: tr.tabs.dashboard,
          tabBarIcon: DashboardIcon,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: tr.tabs.library,
          tabBarIcon: HistoryIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: tr.tabs.settings,
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const syncKeychainLimit = useUserStore(s => s.syncKeychainLimit);

  React.useEffect(() => {
    syncKeychainLimit();
  }, [syncKeychainLimit]);

  return (
    <RootContainer>
      <NavigationContainer>
        <CameraTabStack />
      </NavigationContainer>
    </RootContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surfaceContainerLow,
    borderTopWidth: 0.5,
    borderTopColor: colors.outline,
    height: 80,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabItem: {
    borderRadius: 16,
    marginHorizontal: 4,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  tabIcon: {
    marginBottom: 2,
  },
});
