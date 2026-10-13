import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useApp } from '../context/AppContext';

export function LineChart({ data, labels = [], height = 150, color }) {
  const { colors: c } = useApp();
  const [w, setW] = useState(0);
  const col = color || c.primary;
  const pad = 12;
  const min = Math.min(...data, 0) === 0 && Math.min(...data) > 0 ? Math.min(...data) * 0.9 : Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => ({
    x: pad + (data.length === 1 ? (w - pad * 2) / 2 : (i * (w - pad * 2)) / (data.length - 1)),
    y: pad + (1 - (v - min) / span) * (height - pad * 2),
  }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  const area = pts.length ? `${line} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z` : '';
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={height}>
          {[0.25, 0.5, 0.75].map((t) => <Line key={t} x1={0} x2={w} y1={height * t} y2={height * t} stroke={c.divider} strokeWidth={1} />)}
          {area ? <Path d={area} fill={col} opacity={0.12} /> : null}
          {line ? <Path d={line} stroke={col} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
          {pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={4} fill={c.surface} stroke={col} strokeWidth={2.5} />)}
        </Svg>
      )}
      {labels.length > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
          {labels.map((l, i) => <Text key={i} style={{ fontSize: 10, color: c.sub }}>{l}</Text>)}
        </View>
      )}
    </View>
  );
}

export function BarChart({ data, labels = [], height = 130, color, goal }) {
  const { colors: c } = useApp();
  const max = Math.max(...data, goal || 0, 1);
  return (
    <View>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        {data.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: '60%', maxWidth: 28, height: Math.max(4, (v / max) * (height - 4)), borderRadius: 8, backgroundColor: color || c.primary, opacity: v >= (goal || 0) ? 1 : 0.55 }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        {labels.map((l, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: c.sub }}>{l}</Text>)}
      </View>
    </View>
  );
}

export function Donut({ parts, size = 130, stroke = 18 }) {
  const { colors: c } = useApp();
  const total = parts.reduce((s, p) => s + p.value, 0);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.divider} strokeWidth={stroke} fill="none" />
        {total > 0 && parts.map((p, i) => {
          const len = (p.value / total) * circ;
          const el = (
            <Circle key={i} cx={size / 2} cy={size / 2} r={r} stroke={p.color} strokeWidth={stroke} fill="none"
              strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset} rotation="-90" origin={`${size / 2}, ${size / 2}`} />
          );
          offset += len;
          return el;
        })}
      </Svg>
      <View style={{ marginLeft: 16, flex: 1 }}>
        {parts.map((p, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.color, marginRight: 8 }} />
            <Text style={{ color: c.text, fontSize: 13 }}>{p.label}: {p.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
