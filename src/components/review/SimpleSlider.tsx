import React, { useState } from 'react';
import { View, TouchableOpacity, LayoutChangeEvent, StyleSheet } from 'react-native';

interface Props {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  trackStyle?: object;
  fillStyle?: object;
  thumbStyle?: object;
}

const TRACK_INACTIVE = 'rgba(255,255,255,0.15)';
const TRACK_ACTIVE = '#14B8A6';

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
      style={[styles.touch, trackStyle]}
      activeOpacity={1}
      onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
      onPress={e => {
        const locationX = e.nativeEvent.locationX;
        const newPct = Math.max(0, Math.min(1, locationX / trackWidth));
        onChange(min + newPct * (max - min));
      }}
    >
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${pct * 100}%` }, fillStyle]}
        />
      </View>
      <View
        style={[
          styles.thumb,
          { left: `${pct * 100}%` },
          thumbStyle,
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: {
    height: 32,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: TRACK_INACTIVE,
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: TRACK_ACTIVE,
  },
  thumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: TRACK_ACTIVE,
    marginLeft: -9,
  },
});
