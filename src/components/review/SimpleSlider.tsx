import React, { useState } from 'react';
import { View, TouchableOpacity, LayoutChangeEvent } from 'react-native';

interface Props {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  trackStyle?: object;
  fillStyle?: object;
  thumbStyle?: object;
}

export function SimpleSlider({
  value,
  min,
  max,
  onChange,
  trackStyle,
  fillStyle,
  thumbStyle,
}: Props): React.JSX.Element {
  const pct = (value - min) / (max - min);
  const [trackWidth, setTrackWidth] = useState(0);

  return (
    <TouchableOpacity
      style={[
        {
          height: 32,
          justifyContent: 'center',
        },
        trackStyle,
      ]}
      activeOpacity={1}
      onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
      onPress={e => {
        const locationX = e.nativeEvent.locationX;
        const newPct = Math.max(0, Math.min(1, locationX / trackWidth));
        onChange(min + newPct * (max - min));
      }}
    >
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.15)',
        }}
      >
        <View
          style={[
            {
              height: 6,
              borderRadius: 3,
              backgroundColor: '#14B8A6',
            },
            { width: `${pct * 100}%` },
            fillStyle,
          ]}
        />
      </View>
      <View
        style={[
          {
            position: 'absolute',
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: '#14B8A6',
            marginLeft: -9,
          },
          { left: `${pct * 100}%` },
          thumbStyle,
        ]}
      />
    </TouchableOpacity>
  );
}
