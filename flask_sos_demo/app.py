def try_send_whatsapp_message(number, message):
    """Try to send a WhatsApp message using available pywhatkit methods."""
    if sendwhatmsg_instantly is not None:
        sendwhatmsg_instantly(
            number,
            message,
            wait_time=15,  # Wait time for page load
            tab_close=True,  # Close tab after sending
            close_time=3  # Time to wait before closing
        )
    elif sendwhatmsg is not None:
        now = datetime.now()
        sendwhatmsg(
            number,
            message,
            now.hour,
            (now.minute + 1) % 60,
            wait_time=15,
            tab_close=True,
            close_time=3
        )
    else:
        raise ImportError("No valid pywhatkit sendwhatmsg function available.")
from flask import Flask, render_template, request, redirect, url_for, jsonify
import threading
try:
    from pywhatkit.whats import sendwhatmsg_instantly
except ImportError:
    sendwhatmsg_instantly = None
try:
    from pywhatkit.whats import sendwhatmsg
except ImportError:
    sendwhatmsg = None
import pygame
import time
import random
import os
import sys
from datetime import datetime

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Global variables
user_passcode = None
TIMEOUT = 10
emergency_active = False
danger_detected = False
alert_sent = False
timer = None
repeating_alert_timer = None
message_loop_active = False

# Emergency contacts (UPDATE THESE WITH REAL NUMBERS)
PHONE_NUMBERS = ["+918548878488", "+918618266736"]  # Add country code

# Fallback locations if geolocation fails
USER_LOCATIONS = [
    (12.939443, 77.545355),
    (12.939626, 77.545125),
    (12.939145, 77.545361),
    (12.939828, 77.545380)
]

# Global variable to store real-time location from browser
current_location = None  # Will be (lat, lng) or None

@app.route('/', methods=['GET'])
def index():
    """Home page"""
    return render_template('index.html')

@app.route('/activate', methods=['POST'])
def activate():
    """Activate emergency system"""
    global emergency_active, alert_sent, current_location, danger_detected, message_loop_active

    emergency_active = True
    alert_sent = False
    danger_detected = False
    message_loop_active = False
    current_location = None

    # Clear any existing timers
    clear_timers()

    print("🚨 Emergency system activated")
    return redirect(url_for('map_view'))

@app.route('/set-passcode', methods=['GET', 'POST'])
def set_passcode():
    """Set up the emergency passcode"""
    global user_passcode

    if request.method == 'POST':
        user_passcode = request.form['new_passcode']
        print("✅ Passcode has been set")
        return redirect(url_for('reenter_passcode'))

    return render_template('set_passcode.html')

@app.route('/reenter-passcode', methods=['GET'])
def reenter_passcode():
    """Page to re-enter passcode for verification"""
    return render_template('reenter_passcode.html')

@app.route('/map', methods=['GET'])
def map_view():
    """Display map with location tracking"""
    global current_location

    if current_location:
        initial_lat, initial_lng = current_location
    else:
        initial_lat, initial_lng = USER_LOCATIONS[0]

    return render_template(
        'index3.html',
        emergency_active=emergency_active,
        initial_lat=initial_lat,
        initial_lng=initial_lng,
    )

@app.route('/submit-location', methods=['POST'])
def submit_location():
    """Receive real-time location from browser"""
    global current_location

    data = request.get_json()
    if data and 'lat' in data and 'lng' in data:
        current_location = (float(data['lat']), float(data['lng']))
        print(f"📍 Real-time location received: {current_location}")
        return jsonify({'status': 'success'})

    return jsonify({'status': 'error'}), 400

@app.route('/verify-passcode', methods=['POST'])
def verify_reenter_passcode():
    """Verify the entered passcode"""
    global danger_detected, timer, alert_sent, repeating_alert_timer, message_loop_active, current_location, emergency_active

    passcode = request.form.get('passcode', '')

    if passcode == user_passcode:
        # Correct passcode - cancel emergency
        danger_detected = False
        emergency_active = False
        message_loop_active = False
        current_location = None

        clear_timers()
        print("✅ Emergency cancelled - correct passcode entered")

        return render_template('passcode.html')
    else:
        # Wrong passcode - trigger emergency
        print("❌ Wrong passcode entered - triggering emergency alert")

        if not alert_sent:
            danger_detected = True
            alert_sent = True

            clear_timers()
            play_emergency_sound()

            # Start timeout timer for automatic alert
            global timer
            timer = threading.Timer(TIMEOUT, timeout_handler)
            timer.start()

            # Redirect to send alert immediately
            return redirect(url_for('send_alert_route'))

        return render_template(ALERT_TEMPLATE)

def clear_timers():
    """Safely clear all timers"""
    global timer, repeating_alert_timer

    if timer is not None:
        timer.cancel()
        timer = None

    if repeating_alert_timer is not None:
        repeating_alert_timer.cancel()
        repeating_alert_timer = None

def play_emergency_sound():
    """Play emergency alert sound"""
    try:
        # Try to play sound file
        sound_path = r'activate message.mp3'

        if os.path.exists(sound_path):
            pygame.mixer.init()
            pygame.mixer.music.load(sound_path)
            pygame.mixer.music.play()
            print("🔊 Emergency sound played")
        else:
            # Fallback: Use system beep
            print("⚠️ Sound file not found, using system beep")
            if sys.platform == "win32":
                import winsound
                winsound.Beep(1000, 1000)
            else:
                print('\a')  # ASCII bell character

    except Exception as e:
        print(f"Sound play error: {e}")

def timeout_handler():
    """Handle timeout when no passcode is entered"""
    global alert_sent
    if not alert_sent:
        print("⏰ Timeout reached - sending emergency alert")
        play_emergency_sound()
        # Need to run send_alert_route in app context
        with app.app_context():
            send_alert_route()


def schedule_repeating_alert():
    """Schedule a repeating emergency alert without self-referencing the route directly."""
    global repeating_alert_timer
    repeating_alert_timer = threading.Timer(30, send_alert_route)
    repeating_alert_timer.start()


@app.route('/send-alert', methods=['GET'])
def send_alert_route():
    """Send emergency alert via WhatsApp"""
    global danger_detected, alert_sent, repeating_alert_timer, message_loop_active, current_location, emergency_active

    danger_detected = True
    alert_sent = True
    message_loop_active = True

    # Get location
    if current_location:
        lat, lng = current_location
        print(f"📍 Using real-time location: {lat}, {lng}")
    else:
        selected_location = random.choice(USER_LOCATIONS)
        lat, lng = selected_location
        print(f"⚠️ Geolocation unavailable. Using fallback: {lat}, {lng}")

    # Create Google Maps link
    location_link = f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"

    # Current timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Emergency message
    message = (
        f"🚨 **EMERGENCY ALERT** 🚨\n\n"
        f"⚠️ **IMMEDIATE HELP NEEDED** ⚠️\n\n"
        f"This is an emergency message from the Safety SOS System.\n\n"
        f"📍 **Current Location:**\n{location_link}\n\n"
        f"🕐 **Time:** {timestamp}\n\n"
        f"📱 **Action Required:**\n"
        f"• Please contact me immediately\n"
        f"• Inform local authorities if unable to reach me\n"
        f"• Share this location with emergency services\n\n"
        f"⚠️ **THIS IS NOT A TEST - URGENT ASSISTANCE REQUIRED** ⚠️"
    )

    try:
        # Send WhatsApp messages in background thread
        thread = threading.Thread(target=send_whatsapp_message_sequence, args=(PHONE_NUMBERS, message))
        thread.daemon = True
        thread.start()

        print("📱 Emergency alert sent successfully!")

        # Schedule repeating alerts every 30 seconds if still in emergency mode
        if emergency_active and message_loop_active:
            schedule_repeating_alert()
            print("🔄 Repeating alert scheduled")

        return render_template(ALERT_TEMPLATE,
                             location_link=location_link,
                             timestamp=timestamp)

    except Exception as e:
        print("❌ Error sending alert: {}".format(str(e)))
        return render_template(ALERT_TEMPLATE,
                             location_link=location_link,
                             error="Error sending WhatsApp message: {}".format(str(e)))

@app.route('/cancel', methods=['POST'])
def cancel_emergency():
    """Manually cancel emergency mode"""
    global emergency_active, danger_detected, alert_sent, message_loop_active, current_location

    emergency_active = False
    danger_detected = False
    alert_sent = False
    message_loop_active = False
    current_location = None

    clear_timers()
    print("✅ Emergency manually cancelled")

    return jsonify({'status': 'success', 'message': 'Emergency cancelled'})

@app.route('/status', methods=['GET'])
def get_status():
    """Get current system status"""
    return jsonify({
        'emergency_active': emergency_active,
        'danger_detected': danger_detected,
        'alert_sent': alert_sent,
        'has_location': current_location is not None,
        'message_loop_active': message_loop_active
    })

# Send WhatsApp messages to multiple numbers with retry logic
def send_whatsapp_message_sequence(phone_numbers, message, retries=2):
    print("📱 Preparing to send WhatsApp messages...")
    print("⚠️ Make sure WhatsApp Web is logged in and browser is open!")

    initial_wait_time = 15
    print("⏳ Waiting {} seconds for WhatsApp Web to load...".format(initial_wait_time))
    time.sleep(initial_wait_time)

    success_count = 0

    for number in phone_numbers:
        print("📤 Sending to {}...".format(number))
        for attempt in range(retries):
            try:
                try_send_whatsapp_message(number, message)
                print("✅ Message sent successfully to {}".format(number))
                success_count += 1
                time.sleep(5)  # Wait between messages
                break
            except Exception as e:
                print("❌ Error sending to {} (attempt {}/{}): {}".format(number, attempt+1, retries, e))
                if attempt < retries - 1:
                    print("🔄 Retrying in 10 seconds...")
                    time.sleep(10)
                else:
                    print("❌ Failed to send message to {} after {} attempts".format(number, retries))

    print("📊 Summary: Successfully sent to {}/{} numbers".format(success_count, len(phone_numbers)))
    return success_count > 0

# Create reenter_passcode.html template if it doesn't exist
def create_missing_template():
    """Helper route to create missing template"""
    template_path = 'templates/reenter_passcode.html'
    if not os.path.exists(template_path):
        with open(template_path, 'w') as f:
            f.write('''<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Verify Passcode - Safety SOS</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            width: 90%;
            max-width: 400px;
        }
        h2 {
            color: #333;
            margin-bottom: 20px;
        }
        .timer {
            font-size: 48px;
            color: #ff4444;
            text-align: center;
            margin: 20px 0;
            font-weight: bold;
        }
        input {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
        }
        button {
            width: 100%;
            padding: 12px;
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #0b7dda;
        }
        .warning {
            color: #ff4444;
            font-size: 14px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Verify Your Passcode</h2>
        <div class="timer" id="timer">10</div>
        <form method="POST" action="{{ url_for('verify_reenter_passcode') }}">
            <input type="password" name="passcode" placeholder="Enter passcode" required autofocus>
            <button type="submit">Verify Passcode</button>
        </form>
        <div class="warning">⚠️ If you don't enter the correct passcode in 10 seconds, emergency alert will be sent to your contacts!</div>
    </div>

    <script>
        let timeLeft = 10;
        const timerElement = document.getElementById('timer');

        const countdown = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(countdown);
                timerElement.textContent = "0";
                timerElement.style.color = "red";
            }
        }, 1000);
    </script>
</body>
</html>''')
        return "Template created successfully!"
    return "Template already exists"

ALERT_TEMPLATE = 'alert.html'

if __name__ == "__main__":
    print("=" * 50)
    print("🚨 SAFETY SOS EMERGENCY SYSTEM 🚨")
    print("=" * 50)
    print(f"📞 Emergency contacts: {PHONE_NUMBERS}")
    print(f"⏰ Timeout duration: {TIMEOUT} seconds")
    print("=" * 50)
    print("\n⚠️ IMPORTANT:")
    print("1. Make sure WhatsApp Web is logged in your default browser")
    print("2. Update PHONE_NUMBERS with real emergency contacts")
    print("3. Place 'activate message.mp3' in the same folder (optional)")
    print("\n🌐 Starting server at http://127.0.0.1:5000")
    print("=" * 50)

    app.run(debug=True, host='127.0.0.1', port=5000)
