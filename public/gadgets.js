// GadgetGenie built-in demo library.
// These power the app when no AI key is set (and the offline / no-internet mode).
// Same JSON schema the AI returns, so the whole UI pipeline is identical either way.

const DEMO_GADGETS = [
  // ============================================================ LIGHTSABER
  {
    id: "lightsaber",
    name: "LED Lightsaber",
    emoji: "⚔️",
    tagline: "A real glowing saber with a color-changing blade and a power-up button!",
    difficulty: "Intermediate",
    buildTime: "1.5 hours",
    ageRange: "9–14",
    category: "fun",
    keywords: ["lightsaber", "light saber", "saber", "sword", "star wars", "laser sword", "glow sword"],
    materials: ["plastic", "electronics", "cardboard"],
    model: {
      units: "cm",
      parts: [
        { shape: "cylinder", name: "Hilt grip",     size: [2.2, 14], pos: [0, -19, 0], rot: [0, 0, 0], color: "#4a4f57" },
        { shape: "cylinder", name: "Grip rings",    size: [2.45, 6], pos: [0, -21, 0], rot: [0, 0, 0], color: "#2e3238" },
        { shape: "cylinder", name: "Emitter neck",  size: [2.6, 4],  pos: [0, -10.5, 0], rot: [0, 0, 0], color: "#8b929c" },
        { shape: "cylinder", name: "Emitter cup",   size: [3.0, 2.4],pos: [0, -7.6, 0], rot: [0, 0, 0], color: "#c8ccd2" },
        { shape: "box",      name: "Power button",  size: [1.4, 1.4, 0.9], pos: [0, -13, 2.4], rot: [0, 0, 0], color: "#e5484d" },
        { shape: "cylinder", name: "Blade",         size: [1.5, 42], pos: [0, 14.6, 0], rot: [0, 0, 0], color: "#58c4ff", glow: true },
        { shape: "sphere",   name: "Blade tip",     size: [1.5],     pos: [0, 35.6, 0], rot: [0, 0, 0], color: "#9fe0ff", glow: true },
        { shape: "cylinder", name: "Pommel",        size: [2.4, 2],  pos: [0, -27, 0], rot: [0, 0, 0], color: "#2e3238" },
      ],
    },
    parts: [
      { item: "Arduino Nano (or Uno)", qty: "1", cost: 8.0,  buy: "arduino nano clone", sustainable: null },
      { item: "NeoPixel LED strip (1 m, 30 LEDs, WS2812B)", qty: "1", cost: 9.0, buy: "ws2812b led strip 1m 30 led", sustainable: null },
      { item: "Clear polycarbonate tube, 1 in × 32 in (blade)", qty: "1", cost: 7.0, buy: "polycarbonate tube 1 inch lightsaber blade", sustainable: "Rolled clear report-cover sheets taped into a tube — free from old school folders" },
      { item: "PVC pipe, 1.25 in × 10 in (hilt)", qty: "1", cost: 3.0, buy: "1.25 inch pvc pipe", sustainable: "A sturdy cardboard tube (wrapping-paper core) wrapped in duct tape" },
      { item: "Push button (momentary, 12 mm)", qty: "1", cost: 0.3, buy: "12mm momentary push button", sustainable: null },
      { item: "9V battery + barrel-clip adapter", qty: "1", cost: 4.0, buy: "9v battery clip barrel jack arduino", sustainable: "Rechargeable 9V — reusable hundreds of times" },
      { item: "Jumper wires (male-to-male bundle)", qty: "1 set", cost: 3.0, buy: "arduino jumper wires male male", sustainable: null },
      { item: "White packing foam or bubble wrap (blade diffuser)", qty: "1 sheet", cost: 0, buy: "", sustainable: "Free — reuse foam from any package delivery instead of throwing it away" },
      { item: "Electrical tape + hot glue", qty: "1", cost: 2.5, buy: "electrical tape hot glue sticks", sustainable: null },
    ],
    tools: ["Scissors", "Hot glue gun (with an adult)", "Small screwdriver", "Ruler"],
    steps: [
      {
        title: "Build the hilt",
        text: "Cut the PVC pipe to about 25 cm. Wrap the middle with electrical tape stripes to make a grip. Drill (adult job!) or poke a hole 1 cm wide about halfway up — that's where your power button will live.",
        mentor: "Engineers call this the 'chassis' — the strong frame that holds everything. Real product designers always start with the frame, because every other part attaches to it.",
      },
      {
        title: "Make the glowing blade",
        text: "Roll the sheet of packing foam and slide it inside the clear tube. Then feed the NeoPixel LED strip straight down the middle of the foam. The foam spreads the light so the whole blade glows evenly.",
        mentor: "The foam is a 'diffuser' — light bounces off millions of tiny air bubbles inside it and scatters in every direction. That's the same science that makes clouds look white!",
      },
      {
        title: "Wire the brain",
        text: "Connect the NeoPixel strip: its 5V wire to the Arduino 5V pin, GND to GND, and the DIN (data) wire to pin 6. Push the button's two legs into GND and pin 2. Follow the Wiring tab — colors match!",
        mentor: "The data wire is like a mail carrier: the Arduino sends a tiny coded message down it 800,000 times a second telling EACH LED exactly what color to be. One wire, thirty individually-controlled lights!",
      },
      {
        title: "Load the code",
        text: "Plug the Arduino into a computer with a USB cable, open the Arduino IDE, paste in the code from the Code tab, install the 'Adafruit NeoPixel' library (Sketch → Include Library → Manage Libraries), and hit Upload.",
        mentor: "Uploading turns your human-readable code into machine code — millions of tiny ON/OFF switches. The Arduino's chip runs your loop about 16 million steps every second.",
      },
      {
        title: "Power it up",
        text: "Snap the 9V battery into its clip and plug the barrel jack into the Arduino. Tuck the Arduino and battery inside the hilt, with the button poking out of its hole. Hot-glue the blade tube into the top of the hilt.",
        mentor: "The 9V battery pushes electrons through the circuit like water pressure pushes water through a hose. The Arduino has a built-in 'regulator' that steps it down to a safe 5V for the LEDs.",
      },
      {
        title: "Ignite!",
        text: "Press the button once — the blade should light up from bottom to top like the movies. Press again to change color, and hold it to power down. If something's off, snap a photo and use Mentor Check!",
        mentor: "That bottom-to-top ignition is just a 'for loop' in your code lighting LED 0, then 1, then 2… with a tiny delay between each. Animation is math plus timing!",
      },
    ],
    code: {
      language: "arduino",
      filename: "lightsaber.ino",
      source: `// GadgetGenie — LED Lightsaber
// Button on pin 2: press = ignite / change color, hold = power down.
#include <Adafruit_NeoPixel.h>

#define LED_PIN    6
#define LED_COUNT  30
#define BUTTON_PIN 2

Adafruit_NeoPixel blade(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

uint32_t colors[] = {
  blade.Color(0, 120, 255),   // blue
  blade.Color(0, 255, 40),    // green
  blade.Color(255, 0, 0),     // red
  blade.Color(180, 0, 255),   // purple
};
int colorIndex = 0;
bool isOn = false;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  blade.begin();
  blade.setBrightness(180);
  blade.show(); // start dark
}

void igniteUp(uint32_t c) {
  for (int i = 0; i < LED_COUNT; i++) {   // light bottom -> top
    blade.setPixelColor(i, c);
    blade.show();
    delay(18);
  }
}

void powerDown() {
  for (int i = LED_COUNT - 1; i >= 0; i--) { // darken top -> bottom
    blade.setPixelColor(i, 0);
    blade.show();
    delay(14);
  }
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {   // button pressed
    unsigned long t = millis();
    while (digitalRead(BUTTON_PIN) == LOW) {
      if (isOn && millis() - t > 800) {   // long hold = power down
        powerDown();
        isOn = false;
        while (digitalRead(BUTTON_PIN) == LOW) {} // wait for release
        delay(50);
        return;
      }
    }
    delay(50); // debounce
    if (!isOn) {
      igniteUp(colors[colorIndex]);
      isOn = true;
    } else {
      colorIndex = (colorIndex + 1) % 4;  // next color
      for (int i = 0; i < LED_COUNT; i++) blade.setPixelColor(i, colors[colorIndex]);
      blade.show();
    }
  }
}`,
    },
    wiring: [
      { from: "NeoPixel 5V (red wire)", to: "Arduino 5V pin", color: "red", why: "Carries power — the 'pressure' that pushes electrons through every LED." },
      { from: "NeoPixel GND (white/black wire)", to: "Arduino GND pin", color: "black", why: "The return path. Electricity always flows in a complete loop — no loop, no glow." },
      { from: "NeoPixel DIN (green wire)", to: "Arduino pin 6", color: "green", why: "The data line — the Arduino streams color commands to all 30 LEDs through this one wire." },
      { from: "Button leg 1", to: "Arduino pin 2", color: "yellow", why: "The Arduino 'listens' to this pin. Pressing the button connects it to ground, which the code detects." },
      { from: "Button leg 2", to: "Arduino GND pin", color: "black", why: "Completes the button circuit when pressed. INPUT_PULLUP in the code keeps the pin steady when released." },
      { from: "9V battery clip", to: "Arduino barrel jack", color: "red", why: "Portable power! The Arduino's regulator converts 9V down to the 5V the chip and LEDs need." },
    ],
    howItWorks:
      "Your lightsaber is really three systems working together: a power system, a brain, and a light show.\n\nThe 9V battery is the power plant. Its chemistry creates a voltage — think of it as electrical pressure — that pushes electrons around the circuit. The Arduino is the brain: a tiny computer running your code 16 million steps per second, constantly checking 'is the button pressed?'\n\nThe magic is in the NeoPixel strip. Each LED has its own microchip. The Arduino sends a stream of 24-bit color codes down a single data wire; each LED grabs the first code and passes the rest along, like kids passing notes down a row. That's how one wire controls 30 lights independently — and why your blade can 'ignite' from bottom to top.",
    sustainability: [
      { instead: "Polycarbonate blade tube", use: "Clear plastic report covers rolled into a tube", why: "Rescues plastic that usually goes to landfill — and it's free." },
      { instead: "PVC hilt", use: "Wrapping-paper cardboard tube + duct tape", why: "Cardboard is recyclable and every house has a spare tube." },
      { instead: "New packing foam", use: "Foam saved from a delivery box", why: "Foam takes 500+ years to decompose — giving it a second life keeps it out of the ocean." },
      { instead: "Disposable 9V battery", use: "Rechargeable 9V + charger", why: "One rechargeable replaces ~300 disposables over its life." },
    ],
    safety: [
      "Ask an adult to help with the hot glue gun and any drilling.",
      "This is a prop — never hit people or pets with it. The blade tube can crack.",
      "Never use wall power. Battery only (9V is safe to touch).",
      "If any wire gets warm, unplug the battery and check the Wiring tab for a short circuit.",
    ],
  },

  // ============================================================ FLASHLIGHT
  {
    id: "flashlight",
    name: "Cardboard-Tube Flashlight",
    emoji: "🔦",
    tagline: "Your first real circuit — a working flashlight with a secret Morse-code mode!",
    difficulty: "Beginner",
    buildTime: "40 minutes",
    ageRange: "7–12",
    category: "practical",
    keywords: ["flashlight", "torch", "flash light", "lamp", "light"],
    materials: ["cardboard", "electronics", "plastic"],
    model: {
      units: "cm",
      parts: [
        { shape: "cylinder", name: "Body tube",   size: [2.4, 12], pos: [0, 0, 0], rot: [0, 0, 90], color: "#b98a5a" },
        { shape: "cylinder", name: "Front ring",  size: [2.7, 1.6], pos: [-6.2, 0, 0], rot: [0, 0, 90], color: "#3f4650" },
        { shape: "cylinder", name: "Back cap",    size: [2.6, 1.4], pos: [6.4, 0, 0], rot: [0, 0, 90], color: "#3f4650" },
        { shape: "sphere",   name: "Lens dome",   size: [2.35], pos: [-7.2, 0, 0], rot: [0, 0, 0], color: "#d9f6ff", glow: true },
        { shape: "box",      name: "Button mount", size: [3.4, 0.8, 1.6], pos: [1.5, 2.6, 0], rot: [0, 0, 0], color: "#8a6842" },
        { shape: "box",      name: "Push button", size: [1.2, 0.8, 1.2], pos: [1.5, 3.3, 0], rot: [0, 0, 0], color: "#23272e" },
      ],
    },
    parts: [
      { item: "Arduino Uno board", qty: "1", cost: 20.0, buy: "arduino uno r3", sustainable: "An Arduino Nano clone (~$8) works exactly the same" },
      { item: "9V battery", qty: "1", cost: 3.0, buy: "9v battery", sustainable: "Rechargeable 9V" },
      { item: "9V battery clip (barrel jack or pins)", qty: "1", cost: 1.5, buy: "9v battery clip barrel jack", sustainable: null },
      { item: "Mini breadboard (self-adhesive)", qty: "1", cost: 2.0, buy: "mini breadboard 170 point", sustainable: null },
      { item: "White LED (5 mm)", qty: "1", cost: 0.1, buy: "5mm white led", sustainable: "Rescue one from a broken toy or string of holiday lights" },
      { item: "220 Ω resistor", qty: "1", cost: 0.05, buy: "220 ohm resistor", sustainable: null },
      { item: "Push button (tactile switch)", qty: "1", cost: 0.2, buy: "tactile push button switch", sustainable: null },
      { item: "Jumper wires (male-to-male bundle)", qty: "1 set", cost: 3.0, buy: "arduino jumper wires", sustainable: null },
      { item: "Cardboard tube (toilet-paper roll)", qty: "1", cost: 0, buy: "", sustainable: "Free — this IS the recycled part!" },
      { item: "Clear plastic cup bottom (lens)", qty: "1", cost: 0, buy: "", sustainable: "Cut from a used clear cup before recycling it" },
    ],
    tools: ["Scissors", "Tape", "Marker"],
    steps: [
      {
        title: "Meet the breadboard",
        text: "Peel and stick the mini breadboard onto your desk for now. Look closely: each row of 5 holes is connected inside by a metal strip. Anything plugged into the same row is automatically wired together!",
        mentor: "The breadboard connects to the wires and helps conduct electricity — inside it are springy metal rails, so you can build circuits with zero soldering. Inventors use these to test ideas fast.",
      },
      {
        title: "Plant the LED",
        text: "Push the LED's LONG leg (+, called the anode) into row 1 and the SHORT leg (−, cathode) into row 2. LEDs are one-way streets — backwards, they simply won't light.",
        mentor: "LED means Light-Emitting Diode. A diode only lets electricity flow one direction, like a turnstile at a stadium. When electrons squeeze through its special crystal, they release energy as pure light — no heat wasted like old bulbs!",
      },
      {
        title: "Add the resistor bodyguard",
        text: "Plug the 220 Ω resistor from row 1 (the LED's + row) to an empty row 4. Either direction is fine — resistors don't care which way.",
        mentor: "The resistor is the LED's bodyguard. The Arduino pushes out more current than a tiny LED can survive; the resistor 'narrows the pipe' so just the right amount gets through. No resistor = instant LED burnout (you'd smell it!).",
      },
      {
        title: "Wire it to the Arduino",
        text: "Jumper wire from row 4 (resistor side) to Arduino pin 9. Another from row 2 (LED −) to Arduino GND. Then plug the push button into the breadboard and wire one leg to pin 2, the other leg to GND.",
        mentor: "Pin 9 is special — it can do PWM: switching on/off thousands of times a second. Later you can use that to make your flashlight dimmable, like a real camping torch.",
      },
      {
        title: "Upload the code",
        text: "Connect the Arduino to a computer by USB, paste the Code-tab sketch into the Arduino IDE, and press Upload. The LED should now toggle every time you press the button. Triple-press for the secret S.O.S. mode!",
        mentor: "Your code runs a 'loop' forever: check button → update light → repeat. Every gadget in your house — microwave, game controller, TV remote — runs a loop exactly like this one.",
      },
      {
        title: "Build the body",
        text: "Tape the clear cup-bottom over one end of the cardboard tube as the lens. Slide the breadboard, Arduino and battery inside, poke the button up through a small hole, and cap the back. Decorate it!",
        mentor: "Engineers call this 'packaging' — one of the hardest real-world jobs. Your phone is 90% clever packaging: fitting a computer, camera and battery into your pocket.",
      },
    ],
    code: {
      language: "arduino",
      filename: "flashlight.ino",
      source: `// GadgetGenie — Cardboard Flashlight
// Press = on/off. Press 3x fast = S.O.S. Morse mode!
#define LED_PIN 9
#define BUTTON_PIN 2

bool isOn = false;
int quickPresses = 0;
unsigned long lastPress = 0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void flash(int ms) {
  digitalWrite(LED_PIN, HIGH); delay(ms);
  digitalWrite(LED_PIN, LOW);  delay(200);
}

void sos() {                       // ... --- ...
  for (int i = 0; i < 3; i++) flash(150);   // S
  delay(250);
  for (int i = 0; i < 3; i++) flash(450);   // O
  delay(250);
  for (int i = 0; i < 3; i++) flash(150);   // S
  delay(800);
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(40);                               // debounce
    while (digitalRead(BUTTON_PIN) == LOW) {} // wait for release

    if (millis() - lastPress < 500) quickPresses++;
    else quickPresses = 1;
    lastPress = millis();

    if (quickPresses >= 3) {                 // secret mode!
      for (int i = 0; i < 3; i++) sos();
      quickPresses = 0;
      isOn = false;
    } else {
      isOn = !isOn;
    }
    digitalWrite(LED_PIN, isOn ? HIGH : LOW);
  }
}`,
    },
    wiring: [
      { from: "Arduino pin 9", to: "220 Ω resistor → LED long leg (+)", color: "red", why: "The Arduino's signal, tamed by the resistor so the LED gets a safe amount of current." },
      { from: "LED short leg (−)", to: "Arduino GND", color: "black", why: "Completes the loop back to the Arduino. Electricity only flows in complete circles." },
      { from: "Button leg 1", to: "Arduino pin 2", color: "yellow", why: "The 'ears' of the circuit — the code watches this pin to know when you press." },
      { from: "Button leg 2", to: "Arduino GND", color: "black", why: "Pressing the button connects pin 2 to ground — that voltage drop is what the code detects." },
      { from: "9V battery clip", to: "Arduino barrel jack / VIN", color: "red", why: "Frees your flashlight from the USB cable so it works anywhere." },
    ],
    howItWorks:
      "A flashlight looks simple, but yours is a genuine computer-controlled circuit.\n\nWhen you press the button, you're not switching the LED directly — you're sending a message. The button connects Arduino pin 2 to ground, the code notices the change within microseconds, flips its memory of on/off, and sets pin 9 HIGH (5 volts) or LOW (0 volts).\n\nWhen pin 9 goes HIGH, current flows: out of the pin, through the resistor (which limits it to about 14 milliamps — safe for the LED), through the LED's crystal where electrons drop energy levels and release photons of white light, and back to ground. That whole journey happens at nearly the speed of light, which is why the light feels instant.",
    sustainability: [
      { instead: "Plastic flashlight body", use: "Toilet-paper tube", why: "Zero cost, zero new plastic — cardboard biodegrades in ~2 months." },
      { instead: "New plastic lens", use: "Bottom of a used clear cup", why: "One less cup in the trash, and it focuses light just fine." },
      { instead: "Buying a new LED", use: "Rescue one from broken holiday lights", why: "One dead string of lights contains 50+ perfectly good LEDs." },
    ],
    safety: [
      "9V batteries are safe, but never connect the two battery terminals directly with a wire (it gets hot).",
      "Don't look directly into the LED up close — it's bright!",
      "Ask an adult before cutting the plastic cup.",
    ],
  },

  // ============================================================ MINI FAN
  {
    id: "mini-fan",
    name: "Turbo Desk Fan",
    emoji: "🌀",
    tagline: "An 8-blade mini fan with an Arduino speed dial — your own wind machine!",
    difficulty: "Beginner",
    buildTime: "1 hour",
    ageRange: "8–13",
    category: "fun",
    keywords: ["fan", "desk fan", "mini fan", "wind", "cooler", "propeller", "windmill", "turbine"],
    materials: ["cardboard", "electronics", "wood"],
    model: {
      units: "cm",
      parts: [
        { shape: "box",      name: "Base",        size: [10, 1.6, 8], pos: [0, -9.2, 0], rot: [0, 0, 0], color: "#3f4650" },
        { shape: "cylinder", name: "Stand column", size: [1.1, 9], pos: [0, -4, 0], rot: [0, 0, 0], color: "#8b929c" },
        { shape: "cylinder", name: "Motor body",  size: [1.7, 3.6], pos: [0, 1.4, -0.6], rot: [90, 0, 0], color: "#c8ccd2" },
        { shape: "cylinder", name: "Hub",         size: [1.0, 1.0], pos: [0, 1.4, 1.8], rot: [90, 0, 0], color: "#ffd23f" },
        { shape: "box", name: "Blade 1", size: [0.7, 5.6, 0.25], pos: [0, 4.4, 1.9],  rot: [0, 12, 0],   color: "#58c4ff" },
        { shape: "box", name: "Blade 2", size: [0.7, 5.6, 0.25], pos: [2.1, 3.5, 1.9], rot: [0, 12, -45], color: "#58c4ff" },
        { shape: "box", name: "Blade 3", size: [0.7, 5.6, 0.25], pos: [3, 1.4, 1.9],  rot: [0, 12, -90], color: "#58c4ff" },
        { shape: "box", name: "Blade 4", size: [0.7, 5.6, 0.25], pos: [2.1, -0.7, 1.9], rot: [0, 12, -135], color: "#58c4ff" },
        { shape: "box", name: "Blade 5", size: [0.7, 5.6, 0.25], pos: [0, -1.6, 1.9], rot: [0, 12, 180],  color: "#58c4ff" },
        { shape: "box", name: "Blade 6", size: [0.7, 5.6, 0.25], pos: [-2.1, -0.7, 1.9], rot: [0, 12, 135], color: "#58c4ff" },
        { shape: "box", name: "Blade 7", size: [0.7, 5.6, 0.25], pos: [-3, 1.4, 1.9], rot: [0, 12, 90],  color: "#58c4ff" },
        { shape: "box", name: "Blade 8", size: [0.7, 5.6, 0.25], pos: [-2.1, 3.5, 1.9], rot: [0, 12, 45], color: "#58c4ff" },
        { shape: "box",      name: "Speed knob",  size: [1.6, 0.8, 1.6], pos: [3.2, -8, 2.6], rot: [0, 0, 0], color: "#e5484d" },
      ],
    },
    parts: [
      { item: "Small DC hobby motor (3–6 V)", qty: "1", cost: 2.5, buy: "3v 6v dc hobby motor", sustainable: "Rescue one from a broken toy car or old electric toothbrush" },
      { item: "Arduino Uno (or Nano)", qty: "1", cost: 20.0, buy: "arduino uno r3", sustainable: "Optional! Skip it and wire motor → switch → battery for a one-speed fan" },
      { item: "NPN transistor (2N2222) + 1N4001 diode", qty: "1 each", cost: 0.6, buy: "2n2222 transistor 1n4001 diode kit", sustainable: null },
      { item: "Potentiometer (10 kΩ knob)", qty: "1", cost: 1.0, buy: "10k potentiometer knob", sustainable: null },
      { item: "220 Ω resistor", qty: "1", cost: 0.05, buy: "220 ohm resistor", sustainable: null },
      { item: "4×AA battery holder + batteries", qty: "1", cost: 5.0, buy: "4 aa battery holder switch", sustainable: "Rechargeable AAs" },
      { item: "Mini breadboard + jumper wires", qty: "1 set", cost: 5.0, buy: "mini breadboard jumper wire kit", sustainable: null },
      { item: "Stiff cardboard or old plastic folder (blades)", qty: "1 sheet", cost: 0, buy: "", sustainable: "Free — cereal-box cardboard makes perfect blades" },
      { item: "Bottle cap (hub) + wooden dowel/pencil (stand)", qty: "1 each", cost: 0, buy: "", sustainable: "Both rescued from the recycling bin" },
      { item: "Hot glue + tape", qty: "1", cost: 2.5, buy: "hot glue sticks", sustainable: null },
    ],
    tools: ["Scissors", "Hot glue gun (with an adult)", "Ruler", "Pencil"],
    steps: [
      {
        title: "Cut the 8 blades",
        text: "Draw and cut 8 identical blades (6 cm × 1.5 cm, slightly rounded tips) from cereal-box cardboard. Stack and trim them together so they're truly identical — an unbalanced fan wobbles!",
        mentor: "Identical blades keep the center of mass in the middle. Real jet-engine blades are matched to a fraction of a gram for exactly the same reason — balance beats vibration.",
      },
      {
        title: "Build the hub",
        text: "Poke a small hole in the center of the bottle cap and press it onto the motor shaft with a dab of hot glue. Glue the 8 blades around the cap, each tilted about 15 degrees — like the petals of a pinwheel.",
        mentor: "That tilt is the 'pitch'. A tilted blade shoves air backward as it spins, and Newton's third law shoves the air forward at you as wind. Flat blades just slice air and move nothing!",
      },
      {
        title: "Build the stand",
        text: "Hot-glue the pencil upright onto a cardboard base (add a jar-lid of coins inside for weight). Tape the motor sideways to the top of the pencil, shaft pointing forward.",
        mentor: "The heavy base lowers the center of gravity. Tall things with light bottoms tip over — that's why race cars are low and wide, and why your fan needs a chunky base.",
      },
      {
        title: "Wire the speed control",
        text: "The motor is too hungry for the Arduino to power directly, so a transistor does the heavy lifting: battery + → motor → transistor collector; transistor emitter → GND; Arduino pin 9 → 220 Ω resistor → transistor base. Clip the diode across the motor terminals (stripe toward battery +). Potentiometer: outer legs to 5V and GND, middle leg to pin A0.",
        mentor: "The transistor is an electronic valve: a tiny trickle of current from pin 9 into its 'base' lets a BIG current flow through the motor — like a finger on a garden-hose trigger. The diode protects everything from the motor's electrical 'kickback' when it stops.",
      },
      {
        title: "Upload and spin",
        text: "Upload the Code-tab sketch. Twist the potentiometer knob — the Arduino reads it 100 times a second and adjusts the fan speed smoothly from stop to turbo.",
        mentor: "The knob is a voltage divider: turning it slides a contact along a resistive track, changing the voltage on A0 from 0–5V. The Arduino converts that to a number 0–1023. That's analog-to-digital conversion — how ALL sensors talk to computers.",
      },
      {
        title: "Test and tune",
        text: "If the breeze feels weak, the fan may be blowing backward — swap the two motor wires to reverse spin. Trim any blade that looks longer than the rest. Enjoy your wind machine!",
        mentor: "Swapping the wires reverses the current direction through the motor's coils, which flips the magnetic push — so the shaft spins the other way. Motors are just magnets playing tag.",
      },
    ],
    code: {
      language: "arduino",
      filename: "turbo_fan.ino",
      source: `// GadgetGenie — Turbo Desk Fan
// Potentiometer on A0 sets the speed; pin 9 PWM drives the motor via a transistor.
#define MOTOR_PIN 9
#define KNOB_PIN  A0

void setup() {
  pinMode(MOTOR_PIN, OUTPUT);
}

void loop() {
  int knob = analogRead(KNOB_PIN);        // 0..1023 from the knob
  int speed = map(knob, 0, 1023, 0, 255); // scale to PWM range

  if (speed < 20) speed = 0;              // dead zone so it fully stops
  analogWrite(MOTOR_PIN, speed);          // pulse the motor at that power

  delay(10);                              // ~100 checks per second
}`,
    },
    wiring: [
      { from: "Battery pack + (red)", to: "Motor terminal 1", color: "red", why: "The motor gets its muscle straight from the batteries — not the Arduino, which can only supply small currents." },
      { from: "Motor terminal 2", to: "Transistor collector", color: "blue", why: "The transistor sits in the motor's path like a valve, deciding how much current flows." },
      { from: "Transistor emitter", to: "GND (shared with Arduino GND)", color: "black", why: "All grounds must connect! Circuits need one shared 'sea level' to measure voltages against." },
      { from: "Arduino pin 9", to: "220 Ω resistor → transistor base", color: "green", why: "The control signal. Tiny current here opens the valve for the big motor current." },
      { from: "1N4001 diode", to: "Across motor terminals (stripe to +)", color: "gray", why: "A spinning motor that suddenly stops acts like a generator and kicks voltage backward — the diode safely drains that spike." },
      { from: "Potentiometer middle leg", to: "Arduino pin A0", color: "yellow", why: "Reports the knob position as a voltage between 0 and 5V." },
      { from: "Potentiometer outer legs", to: "Arduino 5V and GND", color: "red", why: "Gives the knob its voltage range to divide." },
    ],
    howItWorks:
      "Your fan is a lesson in three kinds of engineering at once.\n\nElectrical: the DC motor contains coils of wire between magnets. Current through a coil makes it magnetic, it gets pushed around by the permanent magnets, and a clever switch called a commutator flips the current every half-turn so the push never stops — continuous spin.\n\nComputing: the Arduino can't vary voltage smoothly, so it cheats with PWM (pulse-width modulation): it switches the transistor on/off nearly a thousand times a second. On 30% of the time = 30% power. The motor's momentum smooths the pulses into steady speed.\n\nAerodynamics: each tilted blade is a tiny wing. As it sweeps through air it deflects air backward; by Newton's third law the air pushes forward off the blade — and that stream of pushed air is your breeze.",
    sustainability: [
      { instead: "Buying a plastic fan", use: "Building this from a cereal box + bottle cap", why: "Cheap desk fans are rarely repairable and end up as e-waste in ~2 years. Yours is fixable forever." },
      { instead: "New DC motor", use: "Motor from a broken toy", why: "Millions of toy motors are landfilled yearly inside broken toys — still working perfectly." },
      { instead: "Disposable AAs", use: "Rechargeable AAs", why: "4 rechargeables save ~400 disposable batteries over their life." },
    ],
    safety: [
      "Keep fingers, hair and pencils away from spinning blades (cardboard, but fast!).",
      "The transistor can get warm at full speed — that's normal, but let an adult check the wiring if it gets HOT.",
      "Hot glue guns are hot (it's in the name) — adult supervision.",
    ],
  },
  // ============================================================ BURGLAR ALARM
  {
    id: "burglar-alarm",
    name: "Scrap-Wood Burglar Alarm",
    emoji: "🚨",
    tagline: "Guard your room! A trip-wire alarm that catches intruders red-handed.",
    difficulty: "Beginner",
    buildTime: "45 minutes",
    ageRange: "8–13",
    category: "practical",
    keywords: ["alarm", "burglar", "security", "trip wire", "tripwire", "intruder", "door alarm", "guard"],
    materials: ["wood", "metal", "electronics"],
    model: {
      units: "cm",
      parts: [
        { shape: "box",      name: "Wood base",   size: [14, 1.4, 9], pos: [0, -3, 0], rot: [0, 0, 0], color: "#a9825a" },
        { shape: "box",      name: "Clothespin switch", size: [7, 1.6, 1.4], pos: [-3, -1.8, 1.5], rot: [0, 15, 0], color: "#c9a878" },
        { shape: "cylinder", name: "Buzzer",      size: [1.6, 1.2], pos: [4, -1.6, -1.5], rot: [0, 0, 0], color: "#2b2f36" },
        { shape: "box",      name: "9V battery",  size: [2.6, 4.4, 1.6], pos: [0.5, -0.1, -2.2], rot: [0, 0, 8], color: "#3b7a57" },
        { shape: "cylinder", name: "Trip line spool", size: [0.9, 1.8], pos: [-5.5, -1.5, -2], rot: [90, 0, 0], color: "#e0e4ea" },
        { shape: "box",      name: "Warning sign", size: [5, 3, 0.3], pos: [4.2, 1.6, 2.8], rot: [0, -12, 0], color: "#e5484d" },
      ],
    },
    parts: [
      { item: "Scrap wood board (~15 × 10 cm)", qty: "1", cost: 0, buy: "", sustainable: "Free — any offcut, old shelf piece, or thick cardboard works" },
      { item: "Wooden clothespin", qty: "1", cost: 0.1, buy: "wooden clothespins", sustainable: "Borrow one from the laundry room!" },
      { item: "Active buzzer (3–5 V)", qty: "1", cost: 1.0, buy: "5v active buzzer", sustainable: "Rescue one from a dead smoke detector or old toy (adult helps)" },
      { item: "9V battery + snap clip with wires", qty: "1", cost: 4.0, buy: "9v battery snap clip wires", sustainable: "Rechargeable 9V" },
      { item: "Aluminum foil", qty: "small sheet", cost: 0, buy: "", sustainable: "From the kitchen — a 5 cm square is plenty" },
      { item: "Fishing line or strong thread (trip line)", qty: "2 m", cost: 0.5, buy: "fishing line", sustainable: "Any old string or yarn works" },
      { item: "Popsicle stick", qty: "1", cost: 0, buy: "", sustainable: "Saved from a summer treat" },
      { item: "Tape + hot glue", qty: "1", cost: 1.0, buy: "hot glue sticks", sustainable: null },
    ],
    tools: ["Scissors", "Hot glue gun (with an adult)", "Tape"],
    steps: [
      {
        title: "Make the foil switch",
        text: "Wrap a small piece of aluminum foil around EACH jaw of the clothespin's mouth, so when the pin snaps shut, foil touches foil. Tape one bare wire end to each foil pad.",
        mentor: "You just built a 'normally-open switch'! Foil is a great conductor — when the two pads touch, electrons can jump across and complete the circuit. Apart = no path = silence.",
      },
      {
        title: "Add the trigger stick",
        text: "Tie the fishing line to the end of a popsicle stick, then push the stick between the clothespin's jaws to hold them APART. The alarm is now 'armed' — the circuit is broken.",
        mentor: "The stick is an insulator (electricity can't pass through dry wood), so it both blocks the foil pads AND breaks the circuit. Two jobs, one popsicle stick — engineers love parts that multitask.",
      },
      {
        title: "Wire the loop",
        text: "Connect it all in one loop: battery + wire → buzzer red wire; buzzer black wire → one foil pad; other foil pad's wire → battery −. Glue the clothespin, buzzer and battery to the wood base.",
        mentor: "This is a 'series circuit' — one single path. Every part is like a link in a chain: if ANY link is open (like your clothespin), nothing flows. Snap it shut and the loop completes at nearly light speed.",
      },
      {
        title: "Set the trap",
        text: "Put the base beside your door and stretch the fishing line across the doorway at ankle height, taping the far end to the wall. Keep it low and gentle — it should slip the stick out, not trip anyone.",
        mentor: "You want the line to release with a tiny tug. Engineers call this the 'trigger force' — too stiff and it never fires, too loose and it false-alarms. Test and tune it!",
      },
      {
        title: "Test your security system",
        text: "Walk through the doorway. The line pulls the stick free, the clothespin snaps shut, foil touches foil, and the buzzer screams until you re-arm it with the stick. Room: protected!",
        mentor: "Real burglar alarms work exactly this way — a circuit that closes (or breaks) when something moves. Yours is the same engineering as a museum laser alarm, just with a clothespin instead of a laser.",
      },
    ],
    code: null,
    wiring: [
      { from: "9V battery + (red)", to: "Buzzer + (red wire)", color: "red", why: "Power flows from the battery's + side toward the buzzer, ready to make noise." },
      { from: "Buzzer − (black wire)", to: "Foil pad 1 on clothespin", color: "black", why: "The buzzer's return path runs THROUGH the clothespin switch — no contact, no sound." },
      { from: "Foil pad 2 on clothespin", to: "9V battery − ", color: "black", why: "Completes the loop back to the battery — but only when the trap snaps shut!" },
    ],
    howItWorks:
      "Your alarm is a one-path 'series circuit' with a homemade switch in the middle.\n\nWhile the popsicle stick sits between the clothespin jaws, the two foil pads can't touch, so the circuit is broken and no current flows — the buzzer stays silent for days without draining the battery.\n\nWhen someone catches the trip line, it yanks the stick out. The clothespin's spring instantly clamps the jaws together, foil presses against foil, and the circuit completes. Current rushes from the battery through the buzzer — inside it, a tiny metal disc vibrates thousands of times per second, slapping the air to make that loud BEEP. The spring in the clothespin is doing the same job as the switch on your wall — it's just faster and sneakier.",
    sustainability: [
      { instead: "A plastic project box", use: "Scrap wood or thick cardboard", why: "Zero new plastic, and offcuts usually go straight to landfill." },
      { instead: "New buzzer", use: "One rescued from a broken toy", why: "Old toys are full of working buzzers, motors and LEDs — free parts bins!" },
      { instead: "Disposable 9V", use: "Rechargeable 9V", why: "The alarm barely uses power while armed, so one rechargeable lasts years." },
    ],
    safety: [
      "Keep the trip line at ankle height and gentle — it should slip free, never trip a person.",
      "Tell your family about the alarm so nobody gets scared (or tangled).",
      "Hot glue gun = adult supervision.",
    ],
  },

  // ============================================================ BOTTLE VACUUM
  {
    id: "bottle-vacuum",
    name: "Mini Bottle Dust-Buster",
    emoji: "🧹",
    tagline: "A real working vacuum cleaner made from a soda bottle — it actually picks up crumbs!",
    difficulty: "Intermediate",
    buildTime: "1 hour",
    ageRange: "9–14",
    category: "practical",
    keywords: ["vacuum", "dust buster", "dustbuster", "cleaner", "vacuum cleaner", "dust", "suck"],
    materials: ["plastic", "electronics"],
    model: {
      units: "cm",
      parts: [
        { shape: "cylinder", name: "Bottle body",   size: [4, 16], pos: [0, 0, 0], rot: [0, 0, 90], color: "#7fd1ae" },
        { shape: "cylinder", name: "Nozzle",        size: [1.6, 5], pos: [-10.5, 0, 0], rot: [0, 0, 90], color: "#3f4650" },
        { shape: "cylinder", name: "Motor cap",     size: [4.1, 3], pos: [8.5, 0, 0], rot: [0, 0, 90], color: "#2b2f36" },
        { shape: "cylinder", name: "Fan hub",       size: [0.8, 1], pos: [6.2, 0, 0], rot: [0, 0, 90], color: "#ffdf6b" },
        { shape: "box",      name: "Battery pack",  size: [6, 2, 3], pos: [3, 4.6, 0], rot: [0, 0, 0], color: "#3b7a57" },
        { shape: "box",      name: "Switch",        size: [1.6, 1, 1.6], pos: [8.5, 4.4, 0], rot: [0, 0, 0], color: "#e5484d" },
        { shape: "box",      name: "Handle",        size: [10, 1.2, 2], pos: [2, 6.2, 0], rot: [0, 0, 0], color: "#a9825a" },
      ],
    },
    parts: [
      { item: "Plastic soda bottle (1–2 L)", qty: "1", cost: 0, buy: "", sustainable: "Free — this IS the recycled part! Rinse and dry it well" },
      { item: "Strong DC motor (6–12 V, high RPM)", qty: "1", cost: 3.5, buy: "12v high speed dc motor 130", sustainable: "Rescue from a broken RC car or hair dryer (adult removes it)" },
      { item: "Second bottle (cut up for fan blades + nozzle)", qty: "1", cost: 0, buy: "", sustainable: "Also from the recycling bin" },
      { item: "4×AA battery holder with switch", qty: "1", cost: 5.0, buy: "4 aa battery holder switch", sustainable: "Rechargeable AAs" },
      { item: "Old thin sock or cloth scrap (dust filter)", qty: "1", cost: 0, buy: "", sustainable: "A holey sock finally gets a second career" },
      { item: "Bottle cap (fan hub)", qty: "1", cost: 0, buy: "", sustainable: "From the recycling bin" },
      { item: "Rubber bands + tape + hot glue", qty: "1 set", cost: 1.5, buy: "hot glue sticks rubber bands", sustainable: null },
    ],
    tools: ["Scissors (strong ones)", "Hot glue gun (with an adult)", "Marker", "Ruler"],
    steps: [
      {
        title: "Cut the bottle in two",
        text: "Draw a line around the bottle about one-third from the bottom and cut along it (adult helps — bottle plastic can be slippery). The big top part is the vacuum body; keep the bottom as a dust cup.",
        mentor: "You're building a 'housing' — the shell that channels airflow. Real vacuum designers spend months shaping housings so air flows smoothly with no leaks. Your bottle is already the perfect tube!",
      },
      {
        title: "Make the fan",
        text: "Cut a flat circle from the second bottle a bit smaller than the bottle's width, then cut 6 slits and twist each section slightly — like a pinwheel. Poke a hole in the exact center and hot-glue it onto the motor shaft, pressed into a bottle cap for grip.",
        mentor: "Angled blades are everything: when they spin, they grab air and hurl it BACKWARD out of the bottle. Air rushing out the back means new air must rush IN the front — that incoming rush is your suction!",
      },
      {
        title: "Mount the motor",
        text: "Hot-glue the motor inside the bottle's cut end, fan facing INTO the bottle, with small cardboard spacers so air can escape around the motor. The fan must spin freely — give it a test flick.",
        mentor: "Check the spin direction when you first power it: if it BLOWS out the nozzle instead of sucking, swap the motor's two wires — reversing current reverses the spin.",
      },
      {
        title: "Add the filter",
        text: "Stretch the sock across the bottle opening BEHIND the fan (between fan and motor exit), holding it with a rubber band. Air passes through the fabric; dust and crumbs get trapped.",
        mentor: "The filter is a physical sieve: air molecules are tiny enough to slip between the threads, but dust clumps are thousands of times bigger and get caught. Same science as a real HEPA filter, just sock-sized.",
      },
      {
        title: "Nozzle, switch, handle",
        text: "Roll a nozzle cone from the leftover plastic and tape it to the bottle's mouth. Tape the battery pack and its switch on top, wire it to the motor, and add a cardboard or wood handle.",
        mentor: "A narrower nozzle makes the air move FASTER (the same amount of air squeezing through a smaller hole must speed up). Faster air lifts heavier crumbs — that's why real vacuums have narrow attachments.",
      },
      {
        title: "Clean-up test!",
        text: "Sprinkle some paper punch-holes or crumbs on the table, flip the switch, and slowly sweep the nozzle over them. Empty the bottle and shake out the sock filter when you're done.",
        mentor: "If suction feels weak: check for air leaks (tape every gap!), make sure the fan spins the right way, and try fresh batteries. Vacuum engineering is 90% chasing leaks.",
      },
    ],
    code: null,
    wiring: [
      { from: "Battery pack + (red)", to: "Switch terminal 1", color: "red", why: "The switch sits in the power path so you can stop the motor without unplugging anything." },
      { from: "Switch terminal 2", to: "Motor terminal 1", color: "red", why: "When the switch closes, current continues on to spin the motor." },
      { from: "Motor terminal 2", to: "Battery pack − (black)", color: "black", why: "Completes the circuit loop back to the batteries." },
    ],
    howItWorks:
      "A vacuum cleaner doesn't really 'suck' — it makes the air do the work.\n\nThe spinning fan throws air out of the back of the bottle, which lowers the air pressure inside. The air in your room (pushing at a mighty 14.7 pounds per square inch!) is now stronger than the air inside the bottle, so it shoves its way in through the nozzle — carrying crumbs and dust along for the ride.\n\nThe sock filter lets the air molecules through but traps the big dust particles, so only clean air exits past the motor. Every real vacuum — from a Dustbuster to an industrial shop-vac — is exactly this: a fan, a filter, and clever airflow. Yours just proudly shows its recycled bottle guts.",
    sustainability: [
      { instead: "Buying a mini vacuum (~$30)", use: "Two bottles from the recycling bin", why: "Cheap handheld vacs are nearly unrepairable e-waste; yours is rebuildable forever." },
      { instead: "New motor", use: "Motor from a broken RC car or hair dryer", why: "Salvaged motors are usually MORE powerful than hobby ones — and free." },
      { instead: "Disposable filter", use: "An old sock, shaken out and reused", why: "Zero waste, infinite reuses, and honestly kind of hilarious." },
    ],
    safety: [
      "Adult helps with cutting bottle plastic (edges can be sharp — tape over them).",
      "Keep fingers and hair away from the spinning fan.",
      "Never vacuum liquids — water + electronics = fried motor.",
      "High-RPM motors can get warm; take breaks on long cleaning missions.",
    ],
  },

  // ============================================================ BIONIC HAND
  {
    id: "bionic-hand",
    name: "Cardboard Bionic Hand",
    emoji: "🦾",
    tagline: "A mechanical robot hand with string tendons — grab trash without touching it!",
    difficulty: "Intermediate",
    buildTime: "1.5 hours",
    ageRange: "8–14",
    category: "practical",
    keywords: ["bionic", "hand", "robot hand", "robotic hand", "grabber", "claw", "prosthetic", "trash picker", "arm"],
    materials: ["cardboard", "plastic"],
    model: {
      units: "cm",
      parts: [
        { shape: "box", name: "Palm",     size: [9, 10, 1.2], pos: [0, 0, 0],  rot: [0, 0, 0], color: "#c9a878" },
        { shape: "box", name: "Finger 1", size: [1.7, 9, 1.1], pos: [-3.4, 9, 0], rot: [0, 0, 5],  color: "#b98a5a" },
        { shape: "box", name: "Finger 2", size: [1.7, 10, 1.1], pos: [-1.1, 9.6, 0], rot: [0, 0, 2], color: "#b98a5a" },
        { shape: "box", name: "Finger 3", size: [1.7, 9.4, 1.1], pos: [1.2, 9.3, 0], rot: [0, 0, -2], color: "#b98a5a" },
        { shape: "box", name: "Finger 4", size: [1.7, 8, 1.1], pos: [3.4, 8.5, 0], rot: [0, 0, -6], color: "#b98a5a" },
        { shape: "box", name: "Thumb",    size: [1.8, 6.5, 1.1], pos: [-5.6, 1.5, 0], rot: [0, 0, 40], color: "#b98a5a" },
        { shape: "box", name: "Wrist + arm tube", size: [7, 9, 1.4], pos: [0, -9, 0], rot: [0, 0, 0], color: "#a9825a" },
        { shape: "cylinder", name: "Pull-ring", size: [1.4, 0.8], pos: [0, -14.5, 0], rot: [90, 0, 0], color: "#e5484d" },
      ],
    },
    parts: [
      { item: "Stiff cardboard (big box side)", qty: "1 sheet", cost: 0, buy: "", sustainable: "Free — any shipping box from the recycling pile" },
      { item: "Plastic straws (finger joints)", qty: "6", cost: 0, buy: "", sustainable: "Reuse straws from drinks instead of tossing them" },
      { item: "String or yarn (tendons)", qty: "3 m", cost: 0.5, buy: "cotton string", sustainable: "Old shoelaces work great" },
      { item: "Rubber bands (return springs)", qty: "5", cost: 0.3, buy: "rubber bands", sustainable: "The ones off broccoli bunches!" },
      { item: "Paper clips or keyring (pull handles)", qty: "5", cost: 0.2, buy: "paper clips", sustainable: "From the junk drawer" },
      { item: "Tape + hot glue", qty: "1", cost: 1.0, buy: "hot glue sticks", sustainable: null },
    ],
    tools: ["Scissors", "Pencil", "Ruler", "Hot glue gun (with an adult)"],
    steps: [
      {
        title: "Trace and cut the hand",
        text: "Place your hand on the cardboard with fingers spread, trace around it EXTRA chunky (fingers 2 cm wide), and add a long arm section below the wrist. Cut the whole thing out in one piece.",
        mentor: "Engineers call this a 'template'. Copying nature's designs — like your own hand — is called biomimicry, and it's how engineers designed everything from Velcro (burrs!) to airplane wings (birds!).",
      },
      {
        title: "Make the knuckles bend",
        text: "Look at your real fingers: three segments each. On each cardboard finger, gently score (half-cut) two lines where your knuckles are, and fold forward so each finger curls.",
        mentor: "A joint is just a controlled weak spot! Your real knuckles are hinge joints — they bend one way only. Scoring the cardboard on ONE side copies that: it folds forward but stays stiff backward.",
      },
      {
        title: "Glue on the tendon tubes",
        text: "Cut the straws into 2 cm pieces. Glue one piece onto each finger segment and several down the palm and arm — making a tunnel path from each fingertip to the bottom of the arm.",
        mentor: "These straws are 'tendon sheaths'. Your real hand works the same way: the muscles are in your FOREARM, and cord-like tendons run through little tunnels to pull your fingers. Wiggle your fingers and watch your forearm move!",
      },
      {
        title: "Thread the tendons",
        text: "Tape one end of a string to each fingertip, then thread it down through all that finger's straw pieces and out the bottom of the arm. Tie each string to a paper-clip ring. Five fingers, five strings.",
        mentor: "You've built a 'cable-driven mechanism' — pulling a flexible cable turns your muscle power into finger-curling motion at a distance. Bike brakes, excavator claws and real prosthetic hands all use this trick.",
      },
      {
        title: "Add return springs",
        text: "Stretch a rubber band along the BACK of each finger (tape at fingertip and palm). Now when you release a string, the finger springs back straight instead of staying curled.",
        mentor: "Your body does this with 'extensor' muscles on the back of your hand. Every robot joint needs two forces: one to move, one to return. Rubber bands are the simplest return spring ever invented.",
      },
      {
        title: "Trash-grab mission!",
        text: "Hold the arm, hook your fingers into the rings, and pull — the hand curls and grips! Practice picking up a crumpled paper ball, then a plastic bottle. Now go rescue some litter without touching it.",
        mentor: "Grip strength comes from friction. If things slip, glue little foam or rubber-band pads on the fingertips — that's exactly why your real fingertips have soft ridged skin (fingerprints are tire treads!).",
      },
    ],
    code: null,
    wiring: [],
    howItWorks:
      "This build has zero electronics — it's pure mechanical engineering, and it works exactly like the hand you're using to hold it.\n\nEach string is a tendon. Pull it, and the force travels through the straw tunnels and curls the finger at its scored joints, just like the tendons from your forearm muscles curl your real fingers. The straws matter more than they look: they keep the string hugging the finger, so the pulling force turns into bending instead of just lifting the string off the cardboard.\n\nThe rubber bands are the 'antagonist' — the opposing force that straightens each finger when you let go. Muscle pairs in your body work the same way: biceps bend your arm, triceps straighten it. Robot designers copy this pull-and-return pattern in almost every robotic hand ever built — including the multi-million-dollar ones on the International Space Station.",
    sustainability: [
      { instead: "A plastic grabber tool (~$15)", use: "One free shipping box", why: "And when your cardboard hand wears out, it's 100% recyclable — no plastic in the landfill." },
      { instead: "New straws", use: "Rinsed straws from drinks", why: "Plastic straws take ~200 years to decompose; give them a useful second life." },
      { instead: "Throwing away litter-covered gloves", use: "This hand for trash pickup", why: "Cleaning up your park while never touching the gross stuff = double win for the planet." },
    ],
    safety: [
      "Scissors + thick cardboard = go slow; adult helps with tough cuts.",
      "Hot glue gun = adult supervision.",
      "Only pick up safe trash (paper, bottles, cans) — never glass shards or anything sharp.",
      "Wash hands after trash missions, even though the bionic hand did the dirty work!",
    ],
  },

  // ============================================================ BLUETOOTH RACE CAR
  {
    id: "bluetooth-car",
    name: "Bluetooth Race Car",
    emoji: "🏎️",
    tagline: "Drive it from your phone! A smartphone-controlled racer you built yourself.",
    difficulty: "Advanced",
    buildTime: "2.5 hours",
    ageRange: "10–15",
    category: "fun",
    keywords: ["race car", "car", "rc car", "bluetooth", "remote control", "phone controlled", "racer", "vehicle", "rc"],
    materials: ["electronics", "cardboard", "wood"],
    model: {
      units: "cm",
      parts: [
        { shape: "box",      name: "Chassis",     size: [16, 1.2, 9], pos: [0, 0, 0], rot: [0, 0, 0], color: "#2f6fb8" },
        { shape: "box",      name: "Arduino",     size: [4.5, 1, 2.2], pos: [-2, 1.2, 0], rot: [0, 0, 0], color: "#1f9d55" },
        { shape: "box",      name: "Motor driver", size: [4, 1.6, 4], pos: [3.5, 1.4, 0], rot: [0, 0, 0], color: "#e5484d" },
        { shape: "box",      name: "Battery pack", size: [6, 1.8, 3], pos: [-5, 1.5, 0], rot: [0, 0, 0], color: "#3b7a57" },
        { shape: "cylinder", name: "Wheel FL",     size: [2.6, 1.4], pos: [5.5, -1, 5.2], rot: [90, 0, 0], color: "#23272e" },
        { shape: "cylinder", name: "Wheel FR",     size: [2.6, 1.4], pos: [5.5, -1, -5.2], rot: [90, 0, 0], color: "#23272e" },
        { shape: "cylinder", name: "Wheel BL",     size: [2.6, 1.4], pos: [-5.5, -1, 5.2], rot: [90, 0, 0], color: "#23272e" },
        { shape: "cylinder", name: "Wheel BR",     size: [2.6, 1.4], pos: [-5.5, -1, -5.2], rot: [90, 0, 0], color: "#23272e" },
        { shape: "box",      name: "Bluetooth antenna fin", size: [0.8, 3, 2.4], pos: [-7.5, 2.6, 0], rot: [0, 0, -12], color: "#58c4ff", glow: true },
      ],
    },
    parts: [
      { item: "Arduino Uno (or Nano)", qty: "1", cost: 20.0, buy: "arduino uno r3", sustainable: "Nano clone (~$8) saves money and space" },
      { item: "HC-05 Bluetooth module", qty: "1", cost: 8.0, buy: "hc-05 bluetooth module arduino", sustainable: null },
      { item: "L298N motor driver board", qty: "1", cost: 6.0, buy: "l298n motor driver module", sustainable: null },
      { item: "TT gear motors with wheels", qty: "4 (or 2 + casters)", cost: 10.0, buy: "tt gear motor wheels arduino car kit", sustainable: "Motors + wheels from a broken RC toy work perfectly" },
      { item: "6×AA battery holder", qty: "1", cost: 3.0, buy: "6 aa battery holder", sustainable: "Rechargeable AAs" },
      { item: "Sturdy cardboard or thin wood board (chassis)", qty: "1", cost: 0, buy: "", sustainable: "Free — recycled shipping box or scrap plywood" },
      { item: "Jumper wires (male-female mix)", qty: "1 set", cost: 4.0, buy: "arduino jumper wires kit", sustainable: null },
      { item: "Free phone app: 'Arduino Bluetooth Controller'", qty: "1", cost: 0, buy: "", sustainable: null },
      { item: "Zip ties + hot glue", qty: "1 set", cost: 2.0, buy: "small zip ties", sustainable: null },
    ],
    tools: ["Hot glue gun (with an adult)", "Small screwdriver", "Scissors", "Phone with Bluetooth"],
    steps: [
      {
        title: "Build the chassis",
        text: "Cut a sturdy 16 × 9 cm rectangle. Hot-glue the four gear motors underneath at the corners (wheels pointing out), left motors wired together and right motors wired together — that's 'tank steering'.",
        mentor: "Tank steering means no complicated turning parts: to turn LEFT, the right wheels spin faster than the left. Real tanks, Mars rovers, and robot vacuums all steer exactly this way.",
      },
      {
        title: "Mount the electronics",
        text: "Glue the Arduino, L298N driver, and battery holder on top. Keep the L298N near the motors so their wires reach; put the battery pack in the middle so the car doesn't tip.",
        mentor: "Placing heavy parts (batteries!) low and central sets the 'center of mass'. If it's too far back, your car does accidental wheelies — fun, but hard to steer.",
      },
      {
        title: "Wire the muscle: L298N",
        text: "Left motors → OUT1/OUT2. Right motors → OUT3/OUT4. Battery + → 12V input, battery − → GND (and ALSO to Arduino GND). L298N 5V pin → Arduino VIN. Control pins: IN1–IN4 → Arduino pins 5, 6, 9, 10.",
        mentor: "The Arduino can't power motors — they'd fry it. The L298N is a 'muscle board': the Arduino sends tiny direction signals to IN1–IN4, and the board switches the BIG battery current out to the motors. Brain and brawn, separated.",
      },
      {
        title: "Wire the ears: HC-05",
        text: "HC-05 VCC → Arduino 5V, GND → GND, TXD → Arduino pin 2, RXD → Arduino pin 3 (through a simple two-resistor divider — 1kΩ + 2kΩ — because HC-05 wants 3.3V on RXD). Upload the code from the Code tab.",
        mentor: "TX means 'transmit' and RX means 'receive' — the module and Arduino chat over these two wires at 9600 characters per second. Crossing TX→RX is like two people facing each other to talk: mouth to ear!",
      },
      {
        title: "Pair your phone",
        text: "Power the car. In your phone's Bluetooth settings pair with 'HC-05' (PIN is 1234). Then open the Arduino Bluetooth Controller app, pick controller mode, and map buttons: F, B, L, R, S (stop).",
        mentor: "Bluetooth is radio! Your phone and the HC-05 hop between 79 radio channels 1,600 times a second in perfect sync — that hopping is why Bluetooth doesn't get jammed by Wi-Fi and microwaves.",
      },
      {
        title: "Race day",
        text: "Press F on your phone — the car drives forward! Set up a course with cereal boxes. If a side drives backward, swap that side's two motor wires on the L298N. Time your laps and tune!",
        mentor: "Your phone sends a single letter over radio; the Arduino reads it and flips motor directions in under a millisecond. You've built a real remote-control system — the same architecture as a $1,000 drone.",
      },
    ],
    code: {
      language: "arduino",
      filename: "bluetooth_car.ino",
      source: `// GadgetGenie — Bluetooth Race Car
// Phone app sends letters over the HC-05: F=forward B=back L=left R=right S=stop
#include <SoftwareSerial.h>
SoftwareSerial bt(2, 3);   // RX, TX  (HC-05 TXD->2, RXD->3 via divider)

// L298N control pins
#define L_FWD 5
#define L_BCK 6
#define R_FWD 9
#define R_BCK 10

void setup() {
  pinMode(L_FWD, OUTPUT); pinMode(L_BCK, OUTPUT);
  pinMode(R_FWD, OUTPUT); pinMode(R_BCK, OUTPUT);
  bt.begin(9600);          // HC-05 default speed
  stopCar();
}

void drive(int lf, int lb, int rf, int rb) {
  digitalWrite(L_FWD, lf); digitalWrite(L_BCK, lb);
  digitalWrite(R_FWD, rf); digitalWrite(R_BCK, rb);
}

void stopCar() { drive(LOW, LOW, LOW, LOW); }

void loop() {
  if (bt.available()) {
    char cmd = bt.read();            // one letter from your phone
    switch (cmd) {
      case 'F': drive(HIGH, LOW, HIGH, LOW); break;  // both sides forward
      case 'B': drive(LOW, HIGH, LOW, HIGH); break;  // both sides back
      case 'L': drive(LOW, HIGH, HIGH, LOW); break;  // spin left
      case 'R': drive(HIGH, LOW, LOW, HIGH); break;  // spin right
      case 'S': stopCar(); break;
    }
  }
}`,
    },
    wiring: [
      { from: "Battery pack + ", to: "L298N 12V input", color: "red", why: "The motors drink straight from the battery — big current the Arduino could never supply." },
      { from: "Battery pack − ", to: "L298N GND + Arduino GND", color: "black", why: "ONE shared ground for everything — without it, the boards can't understand each other's signals." },
      { from: "L298N 5V out", to: "Arduino VIN", color: "red", why: "The driver board makes a clean 5V and feeds the Arduino — one battery powers the whole car." },
      { from: "Arduino pins 5,6,9,10", to: "L298N IN1–IN4", color: "green", why: "Four direction signals: each pair says 'this side forward' or 'this side backward'." },
      { from: "HC-05 TXD", to: "Arduino pin 2", color: "yellow", why: "The radio's mouth talks into the Arduino's ear — your phone's commands arrive here." },
      { from: "HC-05 RXD", to: "Arduino pin 3 (via 1k/2k divider)", color: "yellow", why: "The divider drops 5V to ~3.3V so the radio's delicate ear doesn't get shouted at." },
      { from: "HC-05 VCC / GND", to: "Arduino 5V / GND", color: "red", why: "Power for the radio module itself." },
    ],
    howItWorks:
      "Your race car is three systems talking to each other: a radio, a brain, and muscle.\n\nThe radio (HC-05) listens for Bluetooth signals from your phone. Bluetooth is just radio waves wiggling 2.4 billion times a second — when you tap 'F', your phone encodes the letter into those wiggles and the HC-05 decodes it back into the letter F and whispers it to the Arduino over the TX wire.\n\nThe brain (Arduino) runs a loop thousands of times a second: any letter arrived? If yes, set the four direction pins. The muscle (L298N) contains an 'H-bridge' — a clever diamond of electronic switches that can push current through a motor in EITHER direction, which is how the same motor can drive forward or backward. Left and right sides get separate commands, so spinning them opposite ways turns the car on a dime — tank steering, straight off a Mars rover.",
    sustainability: [
      { instead: "A store RC car (~$40)", use: "This build (~$50 first time, then reusable parts)", why: "Every part unbolts and rebuilds into your NEXT robot — store cars end up in landfill when one gear strips." },
      { instead: "New motors + wheels", use: "Salvaged from a broken RC toy", why: "A dead $10 toy donates $15 of perfectly good motors." },
      { instead: "Plastic chassis kit", use: "Recycled cardboard or scrap wood", why: "Lighter than the kit chassis — your car actually gets FASTER by recycling." },
    ],
    safety: [
      "Drive indoors or on sidewalks — never in the street.",
      "The L298N chip gets warm during long races; that's normal, but let it cool if it's HOT.",
      "Battery + must NEVER touch battery − directly (short circuit = hot wires).",
      "Ask an adult before installing the phone app.",
    ],
  },

  // ============================================================ PROPELLER BOAT
  {
    id: "propeller-boat",
    name: "Recycled Propeller Boat",
    emoji: "🚤",
    tagline: "A bottle-hulled speedboat with a spinning air propeller — bathtub racing awaits!",
    difficulty: "Beginner",
    buildTime: "1 hour",
    ageRange: "7–12",
    category: "fun",
    keywords: ["boat", "propeller boat", "ship", "airboat", "speedboat", "water", "bathtub", "float"],
    materials: ["plastic", "wood", "electronics"],
    model: {
      units: "cm",
      parts: [
        { shape: "cylinder", name: "Hull left",   size: [3, 18], pos: [0, -1, 4], rot: [0, 0, 90], color: "#7fd1ae" },
        { shape: "cylinder", name: "Hull right",  size: [3, 18], pos: [0, -1, -4], rot: [0, 0, 90], color: "#7fd1ae" },
        { shape: "box",      name: "Deck",        size: [14, 0.8, 10], pos: [0, 1.2, 0], rot: [0, 0, 0], color: "#c9a878" },
        { shape: "box",      name: "Battery box", size: [5, 2, 3], pos: [2, 2.6, 0], rot: [0, 0, 0], color: "#3b7a57" },
        { shape: "cylinder", name: "Motor mast",  size: [0.7, 6], pos: [-4.5, 4, 0], rot: [0, 0, 0], color: "#8b929c" },
        { shape: "cylinder", name: "Motor",       size: [1.3, 3], pos: [-4.5, 7.4, 0], rot: [0, 0, 90], color: "#c8ccd2" },
        { shape: "box", name: "Prop blade 1", size: [0.6, 4.5, 0.3], pos: [-6.6, 9.6, 0], rot: [0, 20, 0], color: "#ffd23f" },
        { shape: "box", name: "Prop blade 2", size: [0.6, 4.5, 0.3], pos: [-6.6, 5.2, 0], rot: [0, 20, 180], color: "#ffd23f" },
        { shape: "box",      name: "Rudder fin",  size: [0.4, 2.5, 3], pos: [6.8, -1.6, 0], rot: [0, 0, 0], color: "#e5484d" },
      ],
    },
    parts: [
      { item: "Plastic bottles (hulls)", qty: "2", cost: 0, buy: "", sustainable: "Free from the recycling bin — caps ON for floatiness" },
      { item: "Small DC motor (3–6 V)", qty: "1", cost: 2.5, buy: "3v 6v dc hobby motor", sustainable: "From a broken toy" },
      { item: "Propeller for hobby motor (or make from a bottle!)", qty: "1", cost: 1.0, buy: "hobby motor propeller 2mm shaft", sustainable: "Cut a mini prop from bottle plastic like the vacuum's fan" },
      { item: "2×AA battery holder with switch", qty: "1", cost: 3.0, buy: "2 aa battery holder switch", sustainable: "Rechargeable AAs" },
      { item: "Popsicle sticks (deck + motor mast)", qty: "8", cost: 0.5, buy: "craft popsicle sticks", sustainable: "Saved from treats, washed" },
      { item: "Plastic lid piece (rudder)", qty: "1", cost: 0, buy: "", sustainable: "From a yogurt tub lid" },
      { item: "Waterproof tape + hot glue", qty: "1", cost: 2.0, buy: "duct tape hot glue", sustainable: null },
    ],
    tools: ["Scissors", "Hot glue gun (with an adult)", "Tape"],
    steps: [
      {
        title: "Build the catamaran hulls",
        text: "Screw the caps tightly on both bottles and tape/glue them side by side, about 8 cm apart, with popsicle sticks bridging across like a raft deck. Two hulls = a catamaran!",
        mentor: "Two skinny hulls are more stable than one fat one — that's why racing catamarans don't tip. The trapped air inside each bottle pushes up with a force equal to the water it displaces (that's buoyancy — Archimedes figured it out in a bathtub!).",
      },
      {
        title: "Raise the motor mast",
        text: "Glue a few popsicle sticks into a tall triangle near the BACK of the deck, and mount the motor on top, shaft pointing backward, HIGH enough that the propeller can never touch the water.",
        mentor: "This is an AIRBOAT design — the propeller pushes air, not water, so nothing electrical goes near the wet stuff. Swamp airboats in Florida use this exact layout to skim over weeds.",
      },
      {
        title: "Attach the propeller",
        text: "Push the propeller onto the motor shaft. Give it a spin test: the air should blow BACKWARD (you feel breeze behind the boat). If it blows forward, swap the motor's two wires.",
        mentor: "Newton's third law is your engine: the prop hurls air backward, so the air pushes the boat forward with exactly equal force. Every plane, drone and rocket is just 'throw stuff one way, go the other'.",
      },
      {
        title: "Wire it up (waterproof-ish)",
        text: "Wire battery holder → switch → motor. Tape the battery box to the CENTER of the deck and cover every wire joint with tape. Keep all electricity on the top deck, far from the water.",
        mentor: "Water and electronics don't mix because water (especially with a little salt or soap) conducts electricity and creates sneaky short circuits. Height + tape = your waterproofing armor.",
      },
      {
        title: "Add the rudder",
        text: "Glue the plastic rudder fin under the back of the deck so it drags in the water. Bend it slightly left or right before each run to steer — straight rudder = straight race line.",
        mentor: "The rudder steers by deflecting water: angle it right and the water pushes the tail LEFT, so the nose points RIGHT. Ships have steered this way for 2,000 years — your boat joins a proud tradition.",
      },
      {
        title: "Launch day!",
        text: "Bathtub, kiddie pool, or a calm puddle. Flip the switch, aim, release! Race a friend's boat, time your crossings, and experiment: does moving the battery forward change the speed?",
        mentor: "If the boat tilts back, your motor mast is too heavy or too far back — slide the battery forward as a counterweight. Congratulations: you're doing real naval 'trim' engineering.",
      },
    ],
    code: null,
    wiring: [
      { from: "Battery holder + (red)", to: "Switch terminal 1", color: "red", why: "The switch lets you cut power without touching wet wires." },
      { from: "Switch terminal 2", to: "Motor terminal 1", color: "red", why: "Closed switch = current flows on to the motor." },
      { from: "Motor terminal 2", to: "Battery holder − (black)", color: "black", why: "Completes the loop. Swap the two motor wires to reverse the prop's spin direction." },
    ],
    howItWorks:
      "Your boat floats, pushes, and steers using three different bits of physics.\n\nFloating: each capped bottle is full of air, which is ~800 times lighter than water. The water it shoves aside pushes back up (buoyancy) far harder than gravity pulls the boat down, so you ride high and dry.\n\nPushing: the motor spins the propeller about 6,000 times a minute. Each angled blade is a little wing that flings air backward — and by Newton's third law, the air flings your boat forward with equal force. Because it's an AIR propeller, all the electrics stay safely above the waterline.\n\nSteering: the rudder is a water deflector. Tilt it, and the stream of water sliding past pushes the tail sideways, swinging the nose the other way. Trim, thrust, buoyancy — you've covered a whole semester of naval engineering in a bathtub.",
    sustainability: [
      { instead: "A plastic toy boat (~$15)", use: "Two rescued bottles", why: "Bottles get maybe 20 minutes of use before recycling — yours becomes a boat for a whole summer." },
      { instead: "New motor", use: "Motor from a broken toy", why: "Working motors get landfilled inside broken toys every day." },
      { instead: "Buying a rudder kit", use: "A yogurt-lid fin", why: "Perfect stiffness, zero cost, one less lid in the bin." },
    ],
    safety: [
      "Water play = adult nearby, always.",
      "Keep the spinning propeller away from fingers and hair — it stings.",
      "Batteries and connections stay on top of the deck; if anything falls in the water, switch off before grabbing it.",
      "Dry everything after each voyage so the motor doesn't rust.",
    ],
  },

  // ============================================================ ARCADE JOYSTICK GAME
  {
    id: "arcade-game",
    name: "Cardboard Arcade Game",
    emoji: "🕹️",
    tagline: "Your own mini arcade cabinet — catch the bouncing light with a real joystick!",
    difficulty: "Intermediate",
    buildTime: "2 hours",
    ageRange: "9–14",
    category: "fun",
    keywords: ["arcade", "joystick", "game", "arcade game", "video game", "cabinet", "led game", "catch"],
    materials: ["cardboard", "electronics"],
    model: {
      units: "cm",
      parts: [
        { shape: "box",      name: "Cabinet body", size: [14, 16, 10], pos: [0, 0, 0], rot: [0, 0, 0], color: "#2f6fb8" },
        { shape: "box",      name: "Marquee top",  size: [14, 3, 11], pos: [0, 9.5, 0.5], rot: [12, 0, 0], color: "#e5484d" },
        { shape: "box",      name: "Screen (LED row)", size: [10, 5, 0.6], pos: [0, 3.5, 5.1], rot: [0, 0, 0], color: "#14202e" },
        { shape: "sphere",   name: "LED light",    size: [0.7], pos: [-3, 3.5, 5.6], rot: [0, 0, 0], color: "#58ff8a", glow: true },
        { shape: "box",      name: "Control deck", size: [14, 1.4, 6], pos: [0, -3.4, 6.5], rot: [-18, 0, 0], color: "#c9a878" },
        { shape: "cylinder", name: "Joystick stem", size: [0.5, 3.4], pos: [-3, -1.6, 7.4], rot: [-18, 0, 0], color: "#8b929c" },
        { shape: "sphere",   name: "Joystick ball", size: [1.3], pos: [-3, 0.2, 8], rot: [0, 0, 0], color: "#e5484d" },
        { shape: "cylinder", name: "Big button",   size: [1.3, 0.8], pos: [3, -2.6, 7.2], rot: [-18, 0, 0], color: "#ffd23f" },
      ],
    },
    parts: [
      { item: "Arduino Uno (or Nano)", qty: "1", cost: 20.0, buy: "arduino uno r3", sustainable: "Nano clone ~$8" },
      { item: "Analog joystick module (KY-023)", qty: "1", cost: 2.5, buy: "ky-023 joystick module arduino", sustainable: null },
      { item: "LEDs (mixed colors, 5 mm)", qty: "7", cost: 0.7, buy: "5mm led assorted pack", sustainable: "Rescue from broken holiday lights" },
      { item: "220 Ω resistors", qty: "7", cost: 0.35, buy: "220 ohm resistor pack", sustainable: null },
      { item: "Piezo buzzer (sounds!)", qty: "1", cost: 1.0, buy: "piezo buzzer arduino", sustainable: null },
      { item: "Breadboard + jumper wires", qty: "1 set", cost: 6.0, buy: "breadboard jumper wire kit", sustainable: null },
      { item: "Cereal box or shipping box (cabinet)", qty: "1", cost: 0, buy: "", sustainable: "Free — this is the arcade cabinet!" },
      { item: "9V battery + clip", qty: "1", cost: 4.0, buy: "9v battery clip barrel jack", sustainable: "Rechargeable 9V" },
      { item: "Markers/paint (cabinet art)", qty: "—", cost: 0, buy: "", sustainable: "Decorate with what you have" },
    ],
    tools: ["Scissors", "Ruler", "Markers", "Hot glue gun (with an adult)"],
    steps: [
      {
        title: "Fold the arcade cabinet",
        text: "Cut and fold the box into a classic arcade shape: tall back, angled control deck at the front, slanted marquee on top. Cut a rectangular window in the front — that's your 'screen'. Paint it loud!",
        mentor: "Real arcade cabinets angle the controls at ~18° because your wrists rest naturally at that tilt. Ergonomics — designing machines to fit humans — is a whole engineering job.",
      },
      {
        title: "Build the LED 'screen'",
        text: "Push the 7 LEDs in a straight row through the screen window (poke holes). Behind the cardboard, each LED's long leg gets its own 220 Ω resistor to an Arduino pin (2–8); all short legs join one wire to GND.",
        mentor: "Seven LEDs in a row is a 1-pixel-tall display! Every screen you've ever seen is just this idea scaled up — your phone has about 3 million rows like yours, refreshed 60 times a second.",
      },
      {
        title: "Mount the joystick",
        text: "Cut a small hole in the control deck and hot-glue the joystick module underneath so the stick pokes up through. Wire it: VCC → 5V, GND → GND, VRx → pin A0.",
        mentor: "Inside the joystick are two potentiometers — the same knob-part as the fan's speed dial — one for left/right, one for up/down. Tilting the stick slides them, changing the voltage the Arduino reads. Analog control!",
      },
      {
        title: "Add the buzzer",
        text: "Buzzer + leg → Arduino pin 12, − leg → GND. This is your arcade's sound system: bleeps for wins, womp-womps for misses.",
        mentor: "A piezo buzzer contains a crystal that physically flexes when voltage hits it. Pulse it 440 times a second and it drums the air 440 times a second — that's the musical note A! Sound is just fast pushes.",
      },
      {
        title: "Upload the game",
        text: "Load the Code-tab sketch. The green light bounces along the row, getting faster each round. Flick the joystick exactly when it hits the middle LED to score — miss three and it's game over!",
        mentor: "The whole game is a loop: move light → read joystick → check timing → speed up. Every video game ever made — even the giant ones — is that same loop with more decoration. You now know the secret.",
      },
      {
        title: "Grand opening!",
        text: "Close up the cabinet, battery inside, and host a tournament. Track high scores on the cabinet side with a marker — sibling rivalry guaranteed. Then try changing the code: more LEDs? Faster? Two-player?",
        mentor: "Changing difficulty by editing one number in the code is called 'tuning game balance' — real game designers tweak numbers like that for months. You get to do it in seconds.",
      },
    ],
    code: {
      language: "arduino",
      filename: "arcade_catch.ino",
      source: `// GadgetGenie — Cardboard Arcade: CATCH THE LIGHT
// A light bounces across 7 LEDs. Flick the joystick when it's in the MIDDLE!
#define FIRST_PIN 2      // LEDs on pins 2..8, middle = pin 5
#define JOY_X A0
#define BUZZER 12

int pos = 0, dir = 1;
int delayMs = 300;       // starting speed
int lives = 3;

void setup() {
  for (int p = 2; p <= 8; p++) pinMode(p, OUTPUT);
  pinMode(BUZZER, OUTPUT);
}

void beep(int freq, int ms) { tone(BUZZER, freq, ms); delay(ms); }

void showOnly(int index) {
  for (int i = 0; i < 7; i++) digitalWrite(FIRST_PIN + i, i == index ? HIGH : LOW);
}

bool joyFlicked() {
  int x = analogRead(JOY_X);          // centered ~512
  return (x < 200 || x > 823);        // pushed hard either way
}

void gameOver() {
  beep(200, 300); beep(150, 300); beep(100, 600);   // womp womp
  for (int i = 0; i < 3; i++) {                      // flash all
    for (int p = 2; p <= 8; p++) digitalWrite(p, HIGH);
    delay(200);
    for (int p = 2; p <= 8; p++) digitalWrite(p, LOW);
    delay(200);
  }
  delayMs = 300; lives = 3;                          // reset game
}

void loop() {
  showOnly(pos);

  // wait at this LED, watching for a flick
  unsigned long t = millis();
  bool flicked = false;
  while (millis() - t < (unsigned long)delayMs) {
    if (joyFlicked()) { flicked = true; break; }
  }

  if (flicked) {
    if (pos == 3) {                    // middle LED = HIT!
      beep(880, 100); beep(1320, 150); // happy bleep
      if (delayMs > 60) delayMs -= 30; // speed up = harder
    } else {                           // wrong timing = miss
      beep(180, 250);
      if (--lives <= 0) { gameOver(); }
    }
    while (joyFlicked()) {}            // wait for stick release
    delay(150);
  }

  pos += dir;                          // bounce the light
  if (pos == 6 || pos == 0) dir = -dir;
}`,
    },
    wiring: [
      { from: "Arduino pins 2–8", to: "220 Ω resistor → each LED long leg (+)", color: "green", why: "Seven separate control lines — the Arduino picks exactly which 'pixel' is lit." },
      { from: "All LED short legs (−)", to: "Arduino GND (shared rail)", color: "black", why: "All returns merge into one ground path — fewer wires, same complete circuits." },
      { from: "Joystick VRx", to: "Arduino pin A0", color: "yellow", why: "Reports the stick's left-right tilt as a voltage from 0 to 5V." },
      { from: "Joystick VCC / GND", to: "Arduino 5V / GND", color: "red", why: "Powers the joystick's internal potentiometers." },
      { from: "Buzzer +", to: "Arduino pin 12", color: "blue", why: "The Arduino pulses this pin hundreds of times a second to play each note." },
      { from: "9V battery clip", to: "Arduino barrel jack", color: "red", why: "Cordless arcade! The regulator turns 9V into the 5V everything else drinks." },
    ],
    howItWorks:
      "Your arcade machine is a real-time computer game running on bare hardware — no screen needed.\n\nThe 'display' is seven LEDs the Arduino flicks on and off so fast the light seems to travel. The game loop runs over and over: light the current LED, watch the joystick for a fraction of a second, then move the light one step. When you flick the stick, the code checks a single question — is the light on the middle LED right now? — and answers with a happy bleep or a lost life.\n\nThe difficulty curve is one line of math: every hit subtracts 30 milliseconds from the wait time, so the light moves faster and faster. Your reaction time is about 200 milliseconds; the game becomes physically impossible around 60 — and chasing that limit is exactly what made arcade games addictive in 1980. Insert coin, young engineer.",
    sustainability: [
      { instead: "A handheld arcade toy (~$25)", use: "A cereal box + $10 of reusable electronics", why: "When you're bored of this game, re-code the SAME parts into a new one — zero new waste." },
      { instead: "New LEDs", use: "LEDs from dead string lights", why: "One broken strand = a lifetime supply of game pixels." },
      { instead: "Buying cabinet decals", use: "Hand-drawn marker art", why: "100% custom, 0% shipping." },
    ],
    safety: [
      "Poke LED holes with a pencil onto an eraser backstop — not toward your hand.",
      "Hot glue gun = adult supervision.",
      "9V battery only — never wall power.",
      "Take screen breaks… wait, you built the screen. Take LED breaks.",
    ],
  },
];

// Fuzzy match a kid's prompt to a demo gadget (used when no AI key is set).
function matchDemoGadget(prompt) {
  const p = (prompt || "").toLowerCase();
  let best = null, bestScore = 0;
  for (const g of DEMO_GADGETS) {
    let score = 0;
    for (const k of g.keywords) if (p.includes(k)) score = Math.max(score, k.length);
    if (p.includes(g.name.toLowerCase())) score += 20;
    if (score > bestScore) { bestScore = score; best = g; }
  }
  return best; // null = no match
}
