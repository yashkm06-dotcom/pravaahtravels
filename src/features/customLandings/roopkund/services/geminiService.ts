/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export async function sendMessageToGemini(
  promptOrHistory: any,
  _optionalNewMessage?: string
): Promise<string> {
  try {
    const res = await fetch('/api/weather-alerts?destination=Roopkund');
    if (res.ok) {
      const data = await res.json();
      return `Roopkund Trail Dispatch: ${data.condition || 'Clear conditions'}. ${data.advisoryMessage || 'Trek is operating smoothly.'}`;
    }
  } catch (err) {
    console.warn('Gemini fallback:', err);
  }
  return "The Roopkund Trail is a 7-day high-altitude archaeological trek (~15,750 ft) in Garhwal Uttarakhand. Best seasons are May–June and Sept–Oct.";
}
