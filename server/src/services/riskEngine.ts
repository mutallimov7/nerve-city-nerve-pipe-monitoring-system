// Nerve Risk Engine Service
// Sensor fusion-based anomaly detection — AI-assisted prototype risk engine

export interface RiskInput {
  accelX: number;
  accelY: number;
  accelZ: number;
  rawVibration: number;
  vibrationLevel: number;
  baseline: number;
  acousticLevel: number;
  micPeakToPeak: number;
  soundStatus: string;
  temperature: number;
  humidity: number;
  battery: number;
  signalStrength: number;
  recentRiskScores?: number[]; // last N readings for spike filtering
}

export interface RiskResult {
  riskScore: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  mode: string;
  activityLevel: string;
  explanation: string;
  recommendedAction: string;
  reasons: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getActivityLevel(score: number): string {
  if (score <= 30) return 'Low Activity';
  if (score <= 60) return 'Medium Activity';
  if (score <= 80) return 'High Activity';
  return 'Abnormal Activity';
}

function getStatus(score: number): 'SAFE' | 'WARNING' | 'CRITICAL' {
  if (score < 40) return 'SAFE';
  if (score < 70) return 'WARNING';
  return 'CRITICAL';
}

export function calculateRisk(input: RiskInput): RiskResult {
  const reasons: string[] = [];
  let vibrationScore = 0;
  let acousticScore = 0;
  let temperatureScore = 0;
  let humidityScore = 0;
  let batteryPenalty = 0;
  let signalPenalty = 0;

  // ─── Vibration scoring (40% weight → max 40 pts) ───────────────────────────
  const vib = input.vibrationLevel;
  if (vib < 30) {
    vibrationScore = vib * 0.3; // 0–9
  } else if (vib < 60) {
    vibrationScore = 9 + (vib - 30) * 0.7; // 9–30
    reasons.push('Vibration level is elevated above baseline, indicating increased pipe activity.');
  } else if (vib < 80) {
    vibrationScore = 30 + (vib - 60) * 0.5; // 30–40
    reasons.push('Vibration level is higher than normal baseline, indicating possible mechanical anomaly.');
  } else {
    vibrationScore = 40;
    reasons.push('Critical vibration detected — possible mechanical anomaly or nearby construction/heavy traffic impact on pipe.');
  }
  vibrationScore = clamp(vibrationScore, 0, 40);

  // ─── Acoustic scoring (25% weight → max 25 pts) ────────────────────────────
  const ac = input.acousticLevel;
  if (ac < 20) {
    acousticScore = ac * 0.1;
  } else if (ac < 50) {
    acousticScore = 2 + (ac - 20) * 0.2;
  } else if (ac < 75) {
    acousticScore = 8 + (ac - 50) * 0.5;
    reasons.push('Acoustic level is elevated — abnormal sound detected around the pipe.');
  } else {
    acousticScore = 25;
    reasons.push('Acoustic anomaly detected — unusual sound intensity suggests potential pipe activity anomaly.');
  }
  acousticScore = clamp(acousticScore, 0, 25);

  // Bonus: combined vibration + acoustic anomaly
  if (vib >= 60 && ac >= 50) {
    const combinedBonus = Math.min(10, (vib - 60) * 0.1 + (ac - 50) * 0.1);
    vibrationScore = Math.min(40, vibrationScore + combinedBonus * 0.5);
    acousticScore = Math.min(25, acousticScore + combinedBonus * 0.5);
    reasons.push('High vibration and high acoustic level occurred together, increasing combined risk score.');
  }

  // ─── Temperature / Freeze scoring (15% weight → max 15 pts) ────────────────
  const temp = input.temperature;
  if (temp <= 0) {
    temperatureScore = 15;
    reasons.push('Temperature is at or below freezing point — critical freeze risk for the pipe.');
  } else if (temp <= 2) {
    temperatureScore = 8;
    reasons.push('Temperature is close to freezing point, creating freeze warning risk.');
  } else if (temp > 2) {
    temperatureScore = Math.max(0, 3 - (temp - 2) * 0.3);
  }
  temperatureScore = clamp(temperatureScore, 0, 15);

  // ─── Humidity scoring (10% weight → max 10 pts) ─────────────────────────────
  const hum = input.humidity;
  if (hum < 70) {
    humidityScore = hum * 0.02;
  } else if (hum < 85) {
    humidityScore = 5 + (hum - 70) * 0.2;
    reasons.push('Humidity is high inside or around the enclosure, suggesting moisture risk.');
  } else {
    humidityScore = 10;
    reasons.push('Humidity is critically high — significant moisture risk to the sensor enclosure and pipe joint.');
  }
  humidityScore = clamp(humidityScore, 0, 10);

  // ─── Battery penalty (up to 5 pts) ──────────────────────────────────────────
  const bat = input.battery;
  if (bat < 10) {
    batteryPenalty = 5;
    reasons.push('Battery level is critically low — urgent maintenance required.');
  } else if (bat < 20) {
    batteryPenalty = 2;
    reasons.push('Battery level is low and maintenance is recommended soon.');
  }

  // ─── Signal penalty (up to 5 pts) ───────────────────────────────────────────
  const sig = input.signalStrength;
  if (sig < -80) {
    signalPenalty = 5;
    reasons.push('Weak Wi-Fi signal — data reliability may be compromised.');
  } else if (sig < -70) {
    signalPenalty = 2;
  }

  // ─── Spike filter using recent readings ─────────────────────────────────────
  const rawScore = vibrationScore + acousticScore + temperatureScore + humidityScore + batteryPenalty + signalPenalty;
  let riskScore = Math.round(clamp(rawScore, 0, 100));

  // If only one spike reading with no recent history confirming it, soften slightly
  if (input.recentRiskScores && input.recentRiskScores.length >= 3) {
    const avgRecent = input.recentRiskScores.slice(-3).reduce((a, b) => a + b, 0) / 3;
    if (riskScore > 70 && avgRecent < 40) {
      // Single spike — dampen to WARNING level
      riskScore = Math.round(Math.min(riskScore, 65 + (riskScore - 65) * 0.5));
      reasons.push('Note: Single spike detected. Awaiting confirmation from subsequent readings.');
    }
  }

  const status = getStatus(riskScore);
  const activityLevel = getActivityLevel(riskScore);

  // ─── Determine mode ─────────────────────────────────────────────────────────
  let mode = 'Normal Mode';
  const highVib = vib >= 60;
  const highAc = ac >= 50;
  const freeze = temp <= 2;
  const highHum = hum >= 70;
  const lowBat = bat < 20;
  const weakSig = sig < -80;

  if (highVib && highAc) {
    mode = 'Mechanical + Acoustic Anomaly Mode';
  } else if (highVib) {
    mode = 'Mechanical Anomaly Mode';
  } else if (highAc) {
    mode = 'Acoustic Anomaly Mode';
  } else if (freeze && highHum) {
    mode = 'Combined Critical Risk Mode';
  } else if (temp <= 0) {
    mode = 'Freeze/Ice Risk Mode';
  } else if (freeze) {
    mode = 'Freeze/Ice Risk Mode';
  } else if (highHum) {
    mode = 'Humidity Risk Mode';
  } else if (lowBat) {
    mode = 'Low Battery Maintenance Mode';
  } else if (weakSig) {
    mode = 'Weak Signal Mode';
  }

  // ─── Explanation ─────────────────────────────────────────────────────────────
  let explanation = '';
  if (reasons.length === 0) {
    explanation = 'All sensor readings are within normal operational parameters. Pipe activity level is low.';
  } else {
    explanation = reasons[0];
  }

  // ─── Recommended action ──────────────────────────────────────────────────────
  let recommendedAction = 'No immediate action required. Continue routine monitoring.';
  if (status === 'CRITICAL') {
    if (mode.includes('Mechanical + Acoustic')) {
      recommendedAction = 'Dispatch field inspection team immediately. High combined risk of mechanical and acoustic anomaly detected.';
    } else if (mode.includes('Mechanical')) {
      recommendedAction = 'Schedule urgent inspection for potential mechanical pipe issue. Check for nearby construction or ground movement.';
    } else if (mode.includes('Acoustic')) {
      recommendedAction = 'Investigate acoustic anomaly. Check for unusual pipe flow conditions or external sound sources.';
    } else if (mode.includes('Freeze')) {
      recommendedAction = 'Emergency freeze protection measures required. Insulate pipe and monitor temperature closely.';
    } else if (mode.includes('Combined')) {
      recommendedAction = 'Critical combined risk. Deploy emergency inspection and freeze protection team.';
    } else if (mode.includes('Battery')) {
      recommendedAction = 'Replace device battery immediately to ensure continuous monitoring.';
    } else {
      recommendedAction = 'Critical risk detected. Dispatch field team for immediate assessment.';
    }
  } else if (status === 'WARNING') {
    if (mode.includes('Humidity')) {
      recommendedAction = 'Check sensor enclosure seal and surrounding area for moisture ingress.';
    } else if (mode.includes('Freeze')) {
      recommendedAction = 'Monitor temperature closely. Prepare freeze protection measures.';
    } else if (mode.includes('Battery')) {
      recommendedAction = 'Schedule battery replacement during next maintenance visit.';
    } else if (mode.includes('Weak Signal')) {
      recommendedAction = 'Check device antenna and Wi-Fi router placement. Consider signal booster.';
    } else {
      recommendedAction = 'Monitor the device closely. Schedule inspection if readings persist above warning threshold.';
    }
  }

  return {
    riskScore,
    status,
    mode,
    activityLevel,
    explanation,
    recommendedAction,
    reasons,
  };
}
