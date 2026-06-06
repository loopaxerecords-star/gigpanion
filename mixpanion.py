# Run this in your terminal: python3 mixpanion_bridge.py

import asyncio
import websockets
import soundcard as sc
import numpy as np
import json
import math

async def audio_stream(websocket, path):
    print("🟢 Mixpanion PWA connected! Beaming audio data...")
    
    # Locate the BlackHole driver natively
    selected_mic = sc.default_microphone()
    devices = sc.all_microphones(include_loopback=True)
    
    for mic in devices:
        if 'BlackHole' in mic.name:
            selected_mic = mic
            break
            
    print(f"🎙️ Listening to input device: {selected_mic.name}")

    try:
        with selected_mic.recorder(samplerate=44100, channels=1) as mic:
            while True:
                data = mic.record(numframes=1024)
                audio_data = data[:, 0]

                rms = np.sqrt(np.mean(audio_data**2))
                peak = np.max(np.abs(audio_data))
                lufs = (20 * math.log10(rms)) - 3 if rms > 0 else -60
                peak_db = (20 * math.log10(peak)) if peak > 0 else -60

                fft_data = np.abs(np.fft.rfft(audio_data))
                fft_scaled = np.interp(fft_data, (0, 10), (0, 255))
                fft_bins = fft_scaled[:256].astype(int).tolist()

                payload = json.dumps({"lufs": lufs, "peak": peak_db, "fft": fft_bins})
                await websocket.send(payload)
                await asyncio.sleep(0.02)

    except websockets.exceptions.ConnectionClosed:
        print("🔴 Mixpanion PWA disconnected.")

start_server = websockets.serve(audio_stream, "localhost", 8080)

print("🚀 Mixpanion Native Python Bridge initialized.")
print("📡 Listening on ws://localhost:8080...")
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
