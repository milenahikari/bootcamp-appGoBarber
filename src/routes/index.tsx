import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SigIn from '../pages/SigIn';
import SigUp from '../pages/SigUp';

const Auth = createStackNavigator();

const AuthRoutes: React.FC = () => (
  <Auth.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: {
        backgroundColor: '#312e38',
      },
    }}
  >
    <Auth.Screen name="SigIn" component={SigIn} />
    <Auth.Screen name="SigUp" component={SigUp} />
  </Auth.Navigator>
);

export default AuthRoutes;
