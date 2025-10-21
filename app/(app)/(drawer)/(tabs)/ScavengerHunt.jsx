import { useSelector } from "react-redux";
import { useState } from "react";
import { View, Text } from "react-native";
import { Provider } from "react-redux";
import  CheckBox  from "@react-native-community/checkbox";

const ScavengerHunt = () => {
  const huntData = useSelector((state) => state.huntData);

  return (
    <Provider>
    <View>
      <Text>Scavenger Hunt</Text>
      {huntData.map((item) => (
        <Text key={item.id}>{item.name}</Text>
        
      ))}
    </View>
    </Provider>
  );
};

export default ScavengerHunt;
